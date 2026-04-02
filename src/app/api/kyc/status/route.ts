// =============================================================================
// InsightGov Africa - KYC Status API Route
// =============================================================================
// GET /api/kyc/status - Get KYC verification status
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { kycService } from '@/lib/kyc-service';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get KYC status
    const status = await kycService.getKYCStatus(session.user.id);

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Impossible de récupérer le statut KYC' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('[API] KYC status error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH /api/kyc/status - Admin: Verify or Reject KYC
// =============================================================================

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Check if user is admin
    // Note: In production, add proper role check
    const body = await request.json();
    const { action, userId, reason } = body;

    if (!action || !userId) {
      return NextResponse.json(
        { success: false, error: 'Action et userId requis' },
        { status: 400 }
      );
    }

    if (action === 'verify') {
      const result = await kycService.verifyKYC(userId, {
        reviewerId: session.user.id,
        notes: body.notes,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'KYC vérifié avec succès',
      });
    } else if (action === 'reject') {
      if (!reason || reason.trim().length < 10) {
        return NextResponse.json(
          { success: false, error: 'La raison du rejet doit contenir au moins 10 caractères' },
          { status: 400 }
        );
      }

      const result = await kycService.rejectKYC(userId, reason, {
        reviewerId: session.user.id,
        notes: body.notes,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'KYC rejeté',
      });
    } else if (action === 'upgrade') {
      const { newLevel, additionalDocuments } = body;
      
      if (!newLevel) {
        return NextResponse.json(
          { success: false, error: 'Nouveau niveau requis' },
          { status: 400 }
        );
      }

      const result = await kycService.upgradeKYCLevel(userId, newLevel, additionalDocuments);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        status: result.status,
        level: result.level,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Action invalide' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[API] KYC status patch error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
