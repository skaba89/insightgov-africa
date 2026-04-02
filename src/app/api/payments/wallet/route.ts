// =============================================================================
// InsightGov Africa - Wallet API
// API de gestion du portefeuille électronique
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { walletService } from '@/lib/payments';

// GET /api/payments/wallet - Get wallet balance
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const balance = await walletService.getBalance(auth.userId);
    
    const transactions = await walletService.getTransactions(auth.userId, { limit: 10 });

    return NextResponse.json({
      success: true,
      data: {
        balance,
        transactions,
      },
    });
  } catch (error) {
    console.error('[Wallet API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération du portefeuille' },
      { status: 500 }
    );
  }
}
