/**
 * InsightGov Africa - Email Verification API
 * ===========================================
 * Handles email verification with token validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/auth/verify-email
 * Verify user email with token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de vérification requis' },
        { status: 400 }
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token invalide ou expiré' },
        { status: 400 }
      );
    }

    // Mark email as verified and clear the token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email vérifié avec succès',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/verify-email
 * Verify email via GET request (from email link)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=missing_token', request.url)
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=invalid_token', request.url)
      );
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL('/login?verified=true', request.url)
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      new URL('/auth/verify-email?error=server_error', request.url)
    );
  }
}
