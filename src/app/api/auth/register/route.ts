/**
 * InsightGov Africa - User Registration API
 * ==========================================
 * Handles user registration with email/password and email verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Generate a secure verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, organizationName, organizationType, sector } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token (expires in 24 hours)
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create organization if name provided
    let organizationId: string | null = null;
    if (organizationName) {
      const organization = await prisma.organization.create({
        data: {
          name: organizationName,
          type: organizationType || 'enterprise',
          sector: sector || 'other',
          subscriptionTier: 'free',
        },
      });
      organizationId = organization.id;
    }

    // Create user with verification token (NOT auto-verified)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        ...(organizationId && { organizationId }),
        role: organizationId ? 'owner' : 'viewer',
        emailVerified: null, // NOT verified - requires email confirmation
        verificationToken: verificationToken,
        verificationTokenExpiry: verificationTokenExpiry,
      },
    });

    // Create free subscription if organization created
    if (organizationId) {
      await prisma.subscription.create({
        data: {
          organizationId: organizationId,
          tier: 'free',
          status: 'active',
          price: 0,
          currency: 'EUR',
          billingCycle: 'monthly',
        },
      });
    }

    // TODO: Send verification email with the token
    // In production, use a service like Resend, SendGrid, or AWS SES
    // For development, we'll log the verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;
    
    console.log('=== EMAIL VERIFICATION (DEV MODE) ===');
    console.log(`To: ${email}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log('=====================================');

    // For demo/development: Auto-verify if no email service configured
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY;
    
    if (isDevelopment) {
      // Auto-verify in development mode
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: isDevelopment 
        ? 'Compte créé avec succès' 
        : 'Compte créé. Vérifiez votre email pour activer votre compte.',
      requiresVerification: !isDevelopment,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      // Only include verification URL in development
      ...(isDevelopment && { verificationUrl }),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}
