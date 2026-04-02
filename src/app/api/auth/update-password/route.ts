/**
 * InsightGov Africa - Update Password API
 * =========================================
 * Handles password updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, token } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Mot de passe requis' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    let userEmail: string | null = null;

    // Check for reset token first
    if (token) {
      const verificationToken = await prisma.verificationToken.findFirst({
        where: {
          token,
          expires: { gt: new Date() },
        },
      });

      if (!verificationToken) {
        return NextResponse.json(
          { error: 'Token invalide ou expiré' },
          { status: 400 }
        );
      }

      userEmail = verificationToken.identifier;

      // Delete used token
      await prisma.verificationToken.delete({
        where: { token },
      });
    } else {
      // Check for authenticated session
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 401 }
        );
      }
      userEmail = session.user.email;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { email: userEmail },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
    });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du mot de passe' },
      { status: 500 }
    );
  }
}
