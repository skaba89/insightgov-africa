// ============================================
// InsightGov Africa - API Vérifier Paiement
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { paystackService, updateOrganizationTier, recordSubscription } from '@/services/paystack';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Vérifier le paiement auprès de Paystack
    const result = await paystackService.verifyPayment(reference);

    if (!result.status || !result.data) {
      return NextResponse.json(
        { error: result.message || 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Trouver l'abonnement correspondant
    const subscription = await db.subscription.findUnique({
      where: { paystackReference: reference },
      include: { organization: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Si le paiement est réussi
    if (result.data.status === 'success') {
      // Mettre à jour l'abonnement
      await recordSubscription({
        organizationId: subscription.organizationId,
        paystackReference: reference,
        status: 'ACTIVE',
        amount: result.data.amount,
        currency: result.data.currency,
        interval: subscription.interval || 'monthly',
      });

      // Déterminer le tier basé sur le montant
      const amount = result.data.amount;
      let tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' = 'STARTER';

      if (amount >= 49900) {
        tier = 'ENTERPRISE';
      } else if (amount >= 14900) {
        tier = 'PROFESSIONAL';
      }

      // Mettre à jour le tier de l'organisation
      await updateOrganizationTier(subscription.organizationId, tier);

      return NextResponse.json({
        success: true,
        data: {
          status: 'success',
          tier,
          organizationId: subscription.organizationId,
          amount: result.data.amount,
          currency: result.data.currency,
        },
      });
    }

    // Paiement échoué ou en attente
    return NextResponse.json({
      success: false,
      data: {
        status: result.data.status,
        message: result.data.gateway_response,
      },
    });
  } catch (error: any) {
    console.error('[Payment Verify Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
