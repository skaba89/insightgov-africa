/**
 * InsightGov Africa - SAML SSO Authentication API
 * =================================================
 * Handles SAML authentication initiation and configuration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  generateSAMLLoginUrl,
  generateRelayState,
  validateSAMLConfig,
  SSOProvider,
  SSO_PROVIDER_TEMPLATES,
} from '@/lib/auth/saml-provider';
import { AuditService } from '@/lib/audit/audit-service';

// GET /api/auth/saml - Get SSO configuration status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const ssoConfig = await db.sSOConfig.findUnique({
      where: { organizationId },
      select: {
        id: true,
        provider: true,
        displayName: true,
        isActive: true,
        isDefault: true,
        autoProvision: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      configured: !!ssoConfig,
      active: ssoConfig?.isActive ?? false,
      config: ssoConfig,
    });
  } catch (error) {
    console.error('[SAML] Error fetching SSO config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SSO configuration' },
      { status: 500 }
    );
  }
}

// POST /api/auth/saml - Initiate SAML login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, redirectUrl } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get SSO configuration
    const ssoConfig = await db.sSOConfig.findUnique({
      where: { organizationId },
    });

    if (!ssoConfig || !ssoConfig.isActive) {
      return NextResponse.json(
        { error: 'SSO is not configured or not active for this organization' },
        { status: 400 }
      );
    }

    // Generate relay state for redirect after auth
    const relayState = generateRelayState(redirectUrl);

    // Generate SAML login URL
    const loginUrl = generateSAMLLoginUrl(
      {
        ...ssoConfig,
        provider: ssoConfig.provider as any,
        attributeMapping: JSON.parse(ssoConfig.attributeMapping || '{}'),
        groupRoleMapping: ssoConfig.groupRoleMapping
          ? JSON.parse(ssoConfig.groupRoleMapping)
          : undefined,
      },
      relayState
    );

    // Log SSO initiation
    await AuditService.log({
      action: 'sso_login',
      entityType: 'sso_config',
      entityId: ssoConfig.id,
      organizationId,
      metadata: {
        provider: ssoConfig.provider,
        relayState: relayState.slice(0, 16),
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      status: 'pending',
    });

    return NextResponse.json({
      redirectUrl: loginUrl,
      relayState,
    });
  } catch (error) {
    console.error('[SAML] Error initiating SAML login:', error);
    return NextResponse.json(
      { error: 'Failed to initiate SAML login' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/saml - Create or update SSO configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      provider,
      displayName,
      entryPoint,
      issuer,
      callbackUrl,
      cert,
      privateKey,
      attributeMapping,
      wantAssertionsSigned,
      wantResponseSigned,
      signMetadata,
      identifierFormat,
      acceptedClockSkewMs,
      autoProvision,
      defaultRole,
      groupRoleMapping,
      isActive,
    } = body;

    if (!organizationId || !provider || !entryPoint || !cert) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate configuration
    const validationErrors = validateSAMLConfig({
      provider,
      entryPoint,
      issuer,
      callbackUrl,
      cert,
      attributeMapping,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Create or update SSO configuration
    const ssoConfig = await db.sSOConfig.upsert({
      where: { organizationId },
      create: {
        organizationId,
        provider: provider as SSOProvider,
        displayName: displayName || SSO_PROVIDER_TEMPLATES[provider as SSOProvider]?.displayName || provider,
        entryPoint,
        issuer: issuer || `${process.env.NEXTAUTH_URL}/saml/${organizationId.slice(0, 8)}`,
        callbackUrl: callbackUrl || `${process.env.NEXTAUTH_URL}/api/auth/saml/callback`,
        cert,
        privateKey,
        attributeMapping: JSON.stringify(attributeMapping || {}),
        wantAssertionsSigned: wantAssertionsSigned ?? true,
        wantResponseSigned: wantResponseSigned ?? false,
        signMetadata: signMetadata ?? false,
        identifierFormat: identifierFormat || 'urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress',
        acceptedClockSkewMs: acceptedClockSkewMs ?? 300000,
        autoProvision: autoProvision ?? true,
        defaultRole: defaultRole || 'viewer',
        groupRoleMapping: groupRoleMapping ? JSON.stringify(groupRoleMapping) : null,
        isActive: isActive ?? false,
      },
      update: {
        provider: provider as SSOProvider,
        displayName: displayName || SSO_PROVIDER_TEMPLATES[provider as SSOProvider]?.displayName || provider,
        entryPoint,
        issuer,
        callbackUrl,
        cert,
        privateKey,
        attributeMapping: JSON.stringify(attributeMapping || {}),
        wantAssertionsSigned: wantAssertionsSigned ?? true,
        wantResponseSigned: wantResponseSigned ?? false,
        signMetadata: signMetadata ?? false,
        identifierFormat,
        acceptedClockSkewMs,
        autoProvision,
        defaultRole,
        groupRoleMapping: groupRoleMapping ? JSON.stringify(groupRoleMapping) : null,
        isActive,
      },
    });

    // Log configuration change
    await AuditService.log({
      action: 'settings_change',
      entityType: 'sso_config',
      entityId: ssoConfig.id,
      organizationId,
      metadata: {
        provider,
        action: 'upsert',
        isActive,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      config: {
        id: ssoConfig.id,
        provider: ssoConfig.provider,
        displayName: ssoConfig.displayName,
        isActive: ssoConfig.isActive,
      },
    });
  } catch (error) {
    console.error('[SAML] Error saving SSO config:', error);
    return NextResponse.json(
      { error: 'Failed to save SSO configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/saml - Delete SSO configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const existingConfig = await db.sSOConfig.findUnique({
      where: { organizationId },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'SSO configuration not found' },
        { status: 404 }
      );
    }

    // Delete SSO configuration
    await db.sSOConfig.delete({
      where: { organizationId },
    });

    // Log deletion
    await AuditService.log({
      action: 'settings_change',
      entityType: 'sso_config',
      entityId: existingConfig.id,
      organizationId,
      metadata: {
        action: 'delete',
        provider: existingConfig.provider,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SAML] Error deleting SSO config:', error);
    return NextResponse.json(
      { error: 'Failed to delete SSO configuration' },
      { status: 500 }
    );
  }
}

// GET /api/auth/saml/metadata - Get SAML metadata
export async function METADATA(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return new NextResponse('Organization ID is required', { status: 400 });
    }

    const ssoConfig = await db.sSOConfig.findUnique({
      where: { organizationId },
    });

    if (!ssoConfig) {
      return new NextResponse('SSO configuration not found', { status: 404 });
    }

    const { generateSAMLMetadata } = await import('@/lib/auth/saml-provider');
    const metadata = generateSAMLMetadata({
      ...ssoConfig,
      provider: ssoConfig.provider as any,
      attributeMapping: JSON.parse(ssoConfig.attributeMapping || '{}'),
      groupRoleMapping: ssoConfig.groupRoleMapping ? JSON.parse(ssoConfig.groupRoleMapping) : undefined,
    } as any);

    return new NextResponse(metadata, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': 'attachment; filename="sp-metadata.xml"',
      },
    });
  } catch (error) {
    console.error('[SAML] Error generating metadata:', error);
    return new NextResponse('Failed to generate metadata', { status: 500 });
  }
}
