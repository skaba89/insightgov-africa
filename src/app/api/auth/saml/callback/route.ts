/**
 * InsightGov Africa - SAML Callback Handler
 * ==========================================
 * Handles SAML assertion responses from Identity Providers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseRelayState, mapSAMLAttributes, SAMLAssertion } from '@/lib/auth/saml-provider';
import { AuditService } from '@/lib/audit/audit-service';
import { SignJWT } from 'jose';
import { randomUUID } from 'crypto';

// Simple SAML assertion parser (for demonstration - production should use a proper SAML library)
function parseSAMLAssertion(samlResponse: string): SAMLAssertion | null {
  try {
    // Decode base64
    const decoded = Buffer.from(samlResponse, 'base64').toString('utf8');
    
    // Extract NameID
    const nameIDMatch = decoded.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/i) ||
                        decoded.match(/<NameID[^>]*>([^<]+)<\/NameID>/i);
    const nameID = nameIDMatch ? nameIDMatch[1] : '';

    // Extract attributes
    const attributes: Record<string, string | string[]> = {};
    
    // Common attribute patterns
    const attrPatterns = [
      // Azure AD format
      { name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress', alias: 'email' },
      { name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname', alias: 'firstName' },
      { name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname', alias: 'lastName' },
      { name: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups', alias: 'groups' },
      // Okta/Google format
      { name: 'email', alias: 'email' },
      { name: 'firstName', alias: 'firstName' },
      { name: 'lastName', alias: 'lastName' },
      { name: 'groups', alias: 'groups' },
      { name: 'department', alias: 'department' },
    ];

    for (const pattern of attrPatterns) {
      const regex = new RegExp(`<saml:Attribute[^>]*Name="${pattern.name}"[^>]*>[\\s\\S]*?<saml:AttributeValue[^>]*>([^<]+)<\\/saml:AttributeValue>[\\s\\S]*?<\\/saml:Attribute>`, 'i');
      const match = decoded.match(regex);
      if (match) {
        attributes[pattern.name] = match[1];
        attributes[pattern.alias] = match[1];
      }

      // Also try to capture multiple values for groups
      if (pattern.alias === 'groups') {
        const multiRegex = new RegExp(`<saml:Attribute[^>]*Name="${pattern.name}"[^>]*>([\\s\\S]*?)<\\/saml:Attribute>`, 'i');
        const multiMatch = decoded.match(multiRegex);
        if (multiMatch) {
          const values = multiMatch[1].match(/<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/gi);
          if (values && values.length > 1) {
            const groupValues = values.map(v => v.replace(/<\/?saml:AttributeValue[^>]*>/gi, '').trim());
            attributes[pattern.name] = groupValues;
            attributes[pattern.alias] = groupValues;
          }
        }
      }
    }

    // Extract SessionIndex
    const sessionIndexMatch = decoded.match(/SessionIndex="([^"]+)"/i);
    const sessionIndex = sessionIndexMatch ? sessionIndexMatch[1] : undefined;

    return {
      nameID,
      attributes,
      sessionIndex,
    };
  } catch (error) {
    console.error('[SAML] Error parsing assertion:', error);
    return null;
  }
}

// POST /api/auth/saml/callback - Handle SAML assertion
export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const formData = await request.formData();
    const samlResponse = formData.get('SAMLResponse') as string;
    const relayState = formData.get('RelayState') as string | null;

    if (!samlResponse) {
      console.error('[SAML] No SAMLResponse in callback');
      return NextResponse.redirect(new URL('/login?error=no_saml_response', request.url));
    }

    // Parse SAML assertion
    const assertion = parseSAMLAssertion(samlResponse);
    if (!assertion || !assertion.nameID) {
      console.error('[SAML] Failed to parse SAML assertion');
      return NextResponse.redirect(new URL('/login?error=invalid_saml', request.url));
    }

    // Find user by email (from NameID or attributes)
    const email = assertion.attributes.email as string || assertion.nameID;
    
    // Find organization with active SSO
    const ssoConfigs = await db.sSOConfig.findMany({
      where: { isActive: true },
    });

    let matchedConfig = null;
    let organization = null;

    // Try to match user to organization
    for (const config of ssoConfigs) {
      const org = await db.organization.findUnique({
        where: { id: config.organizationId },
      });
      
      if (org) {
        // Check if user email domain matches organization domain
        // or if user already belongs to this organization
        const existingUser = await db.user.findFirst({
          where: {
            email,
            organizationId: org.id,
          },
        });

        if (existingUser) {
          matchedConfig = config;
          organization = org;
          break;
        }
      }
    }

    if (!matchedConfig) {
      console.error('[SAML] No matching SSO configuration found for:', email);
      
      await AuditService.log({
        action: 'sso_login',
        entityType: 'sso_config',
        organizationId: null,
        metadata: {
          email,
          error: 'No matching SSO configuration',
        },
        ipAddress,
        userAgent,
        status: 'failed',
        errorMessage: 'No matching SSO configuration found',
      });

      return NextResponse.redirect(new URL('/login?error=no_sso_config', request.url));
    }

    // Map SAML attributes to user profile
    const mappedUser = mapSAMLAttributes(assertion, {
      ...matchedConfig,
      attributeMapping: JSON.parse(matchedConfig.attributeMapping || '{}'),
      groupRoleMapping: matchedConfig.groupRoleMapping
        ? JSON.parse(matchedConfig.groupRoleMapping)
        : undefined,
    });

    // Find or create user
    let user = await db.user.findUnique({
      where: { email },
    });

    if (!user && matchedConfig.autoProvision) {
      // Auto-provision user
      user = await db.user.create({
        data: {
          email,
          firstName: mappedUser.firstName,
          lastName: mappedUser.lastName,
          organizationId: matchedConfig.organizationId,
          role: mappedUser.role,
          isActive: true,
          emailVerified: new Date(), // SSO users are pre-verified
        },
      });

      console.log('[SAML] Auto-provisioned user:', email);
    } else if (user) {
      // Update last login
      await db.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          firstName: mappedUser.firstName || user.firstName,
          lastName: mappedUser.lastName || user.lastName,
        },
      });
    }

    if (!user) {
      console.error('[SAML] User not found and auto-provision disabled');
      return NextResponse.redirect(new URL('/login?error=user_not_found', request.url));
    }

    // Create SSO session record
    await db.sSOSession.create({
      data: {
        organizationId: matchedConfig.organizationId,
        userId: user.id,
        ssoConfigId: matchedConfig.id,
        nameID: assertion.nameID,
        sessionIndex: assertion.sessionIndex,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Update SSO config last used
    await db.sSOConfig.update({
      where: { id: matchedConfig.id },
      data: { lastUsedAt: new Date() },
    });

    // Create session token
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'development-secret');
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      organizationId: user.organizationId,
      organizationName: organization?.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(randomUUID())
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // Log successful SSO login
    await AuditService.log({
      action: 'sso_login',
      entityType: 'sso_config',
      entityId: matchedConfig.id,
      userId: user.id,
      organizationId: matchedConfig.organizationId,
      metadata: {
        provider: matchedConfig.provider,
        email,
        autoProvisioned: !user.createdAt,
      },
      ipAddress,
      userAgent,
      sessionId: token.slice(0, 16),
    });

    // Parse relay state for redirect
    let redirectPath = '/dashboard';
    if (relayState) {
      const parsed = parseRelayState(relayState);
      if (parsed?.redirect) {
        redirectPath = parsed.redirect;
      }
    }

    // Set session cookie and redirect
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    
    response.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[SAML] Callback error:', error);

    await AuditService.log({
      action: 'sso_login',
      entityType: 'sso_config',
      organizationId: null,
      metadata: {
        error: String(error),
      },
      ipAddress,
      userAgent,
      status: 'failed',
      errorMessage: String(error),
    });

    return NextResponse.redirect(new URL('/login?error=saml_error', request.url));
  }
}

// GET /api/auth/saml/callback - Handle SAML redirect (for testing)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');
  
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  }
  
  return NextResponse.json({
    message: 'SAML callback endpoint. POST requests only.',
  });
}
