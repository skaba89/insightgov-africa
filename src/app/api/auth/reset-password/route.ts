/**
 * InsightGov Africa - Reset Password API
 * ========================================
 * Handles password reset requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation',
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Store token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // In production, send email with reset link
    // For now, just log it
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(`Reset URL: ${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`);

    return NextResponse.json({
      success: true,
      message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du lien de réinitialisation' },
      { status: 500 }
    );
  }
}
