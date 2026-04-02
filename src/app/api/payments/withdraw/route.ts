// =============================================================================
// InsightGov Africa - Withdraw API
// API de retrait Mobile Money
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { walletService, orangeMoneyService, mtnMoneyService } from '@/lib/payments';
import { z } from 'zod';

// Validation schema
const withdrawSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  currency: z.enum(['GNF', 'USD', 'EUR']).default('GNF'),
  provider: z.enum(['orange', 'mtn', 'cash', 'bank']).default('orange'),
  phoneNumber: z.string().min(8, 'Numéro de téléphone inval'),
  description: z.string().optional(),
});

// POST /api/payments/withdraw - Initiate a withdrawal
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const validation = withdrawSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { amount, currency, provider, phoneNumber, description } = validation.data;

    // Check if user has sufficient balance
    const balance = await walletService.getBalance(auth.userId);
    const availableBalance = currency === 'GNF' ? balance.gnf : currency === 'USD' ? balance.usd : balance.eur;

    if (availableBalance < amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Solde insuffisant. Solde disponible: ${availableBalance} ${currency}` 
        },
        { status: 400 }
      );
    }

    // Execute withdrawal
    const result = await walletService.debit(
      auth.userId,
      amount,
      currency as 'GNF' | 'USD' | 'EUR',
      description || 'Retrait Mobile Money',
      phoneNumber,
      provider
    );

    if (result.success) {
      // In production, we would also call the provider API to send money
      // For now, we just record the transaction

      return NextResponse.json({
        success: true,
        transactionId: result.transactionId,
        reference: result.reference,
        newBalance: result.newBalance,
        message: 'Retrait initié avec succès. Vous recevrez une confirmation.',
      });
    }

    return NextResponse.json({
      success: false,
      error: result.error || 'Échec du retrait',
    }, { status: 400 });

  } catch (error) {
    console.error('[Withdraw API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du retrait' },
      { status: 500 }
    );
  }
}
