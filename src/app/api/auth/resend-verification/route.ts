/**
 * InsightGov Africa - Resend Verification Email API
 * ===================================================
 * Resends the email verification link to users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { emailService } from '@/services/email';

/**
 * POST /api/auth/resend-verification
 * Resend verification email to user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Adresse email requise' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'Si un compte existe avec cet email, un lien de vérification a été envoyé.',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Cet email est déjà vérifié' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry,
      },
    });

    // Build verification URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;

    // Send verification email
    const emailResult = await emailService.sendEmailVerification({
      name: user.firstName || user.email.split('@')[0],
      email: user.email,
      verificationUrl,
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', (emailResult as any).error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Un nouveau lien de vérification a été envoyé à votre adresse email.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'envoi' },
      { status: 500 }
    );
  }
}
