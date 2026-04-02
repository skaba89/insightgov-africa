// =============================================================================
// InsightGov Africa - Transfer API
// API de transfert d'argent
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { walletService } from '@/lib/payments';
import { z } from 'zod';

// Validation schema
const transferSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  currency: z.enum(['GNF', 'USD', 'EUR']).default('GNF'),
  recipientPhone: z.string().min(8, 'Numéro de téléphone inval'),
  description: z.string().optional(),
});

// POST /api/payments/transfer - Transfer money
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const validation = transferSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { amount, currency, recipientPhone, description } = validation.data;

    // Validate recipient phone (can't transfer to self)
    if (auth.email === recipientPhone || auth.userId === recipientPhone) {
      return NextResponse.json(
        { success: false, error: 'Impossible de transférer à votre propre compte' },
        { status: 400 }
      );
    }

    // Execute transfer
    const result = await walletService.transfer(
      auth.userId,
      recipientPhone,
      amount,
      currency as 'GNF' | 'USD' | 'EUR',
      description
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        transactionId: result.transactionId,
        reference: result.reference,
        newBalance: result.newBalance,
        message: 'Transfert effectué avec succès',
      });
    }

    return NextResponse.json({
      success: false,
      error: result.error || 'Échec du transfert',
    }, { status: 400 });

  } catch (error) {
    console.error('[Transfer API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du transfert' },
      { status: 500 }
    );
  }
}
