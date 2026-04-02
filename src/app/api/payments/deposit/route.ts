// =============================================================================
// InsightGov Africa - Deposit API
// API de dépôt Mobile Money
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { walletService, orangeMoneyService, mtnMoneyService } from '@/lib/payments';
import { z } from 'zod';

// Validation schema
const depositSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  currency: z.enum(['GNF', 'USD', 'EUR']).default('GNF'),
  provider: z.enum(['orange', 'mtn', 'cash', 'bank']).default('orange'),
  phoneNumber: z.string().min(8, 'Numéro de téléphone inval'),
  description: z.string().optional(),
});

// POST /api/payments/deposit - Initiate a deposit
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const validation = depositSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { amount, currency, provider, phoneNumber, description } = validation.data;

    // Initiate payment with provider
    let paymentResult;

    if (provider === 'orange') {
      if (!orangeMoneyService.isConfigured()) {
        return NextResponse.json(
          { success: false, error: 'Orange Money non configuré' },
          { status: 503 }
        );
      }

      paymentResult = await orangeMoneyService.initiatePayment({
        amount,
        currency,
        phoneNumber,
        description,
      });
    } else if (provider === 'mtn') {
      if (!mtnMoneyService.isConfigured()) {
        return NextResponse.json(
          { success: false, error: 'MTN Money non configuré' },
          { status: 503 }
        );
      }

      paymentResult = await mtnMoneyService.initiatePayment({
        amount,
        currency,
        phoneNumber,
        description,
      });
    } else {
      // Cash or bank deposit - create pending transaction
      const result = await walletService.credit(
        auth.userId,
        amount,
        currency,
        description || `Dépôt ${provider}`,
        provider
      );

      return NextResponse.json({
        success: result.success,
        transactionId: result.transactionId,
        reference: result.reference,
        message: result.success 
          ? 'Dépôt enregistré. En attente de confirmation.' 
          : result.error,
      });
    }

    // Handle provider response
    if (paymentResult.status === 'success') {
      // Credit wallet immediately for successful payments
      const creditResult = await walletService.credit(
        auth.userId,
        amount,
        currency as 'GNF' | 'USD' | 'EUR',
        description || 'Dépôt Mobile Money',
        provider
      );

      return NextResponse.json({
        success: true,
        transactionId: creditResult.transactionId,
        reference: creditResult.reference,
        paymentId: paymentResult.transactionId,
        message: 'Dépôt effectué avec succès',
      });
    }

    if (paymentResult.status === 'pending') {
      return NextResponse.json({
        success: true,
        status: 'pending',
        paymentId: paymentResult.transactionId,
        message: 'Dépôt en attente. Veuillez valider sur votre téléphone.',
      });
    }

    return NextResponse.json({
      success: false,
      error: paymentResult.error || 'Échec du dépôt',
    }, { status: 400 });

  } catch (error) {
    console.error('[Deposit API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du dépôt' },
      { status: 500 }
    );
  }
}
