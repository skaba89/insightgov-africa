// ============================================
// InsightGov Africa - API Vérifier Paiement
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { stripeService, updateOrganizationTier, recordSubscription, getPlanByAmount } from '@/services/stripe';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const reference = searchParams.get('reference');

    if (!sessionId && !reference) {
      return NextResponse.json(
        { error: 'session_id or reference is required' },
        { status: 400 }
      );
    }

    // Utiliser sessionId si disponible (Stripe), sinon reference
    const lookupKey = sessionId || reference!;

    // Vérifier le paiement auprès de Stripe
    const result = await stripeService.getSession(lookupKey);

    // Trouver l'abonnement correspondant
    const subscription = await db.subscription.findFirst({
      where: {
        OR: [
          { paystackReference: reference || '' },
          { paystackReference: lookupKey },
        ],
      },
      include: { organization: true },
    });

    // Si le paiement est réussi
    if (result.status === 'complete' && result.payment_status === 'paid') {
      // Si on a trouvé un abonnement, le mettre à jour
      if (subscription) {
        await recordSubscription({
          organizationId: subscription.organizationId,
          stripeSessionId: lookupKey,
          status: 'ACTIVE',
          amount: result.amount_total,
          currency: result.currency.toUpperCase(),
          interval: subscription.interval || 'monthly',
        });

        // Déterminer le tier basé sur le montant
        const tier = getPlanByAmount(result.amount_total);

        // Mettre à jour le tier de l'organisation
        await updateOrganizationTier(subscription.organizationId, tier as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE');

        return NextResponse.json({
          success: true,
          data: {
            status: 'success',
            tier,
            organizationId: subscription.organizationId,
            amount: result.amount_total,
            currency: result.currency,
          },
        });
      }

      // Pas d'abonnement trouvé, mais paiement vérifié
      const tier = getPlanByAmount(result.amount_total);

      return NextResponse.json({
        success: true,
        data: {
          status: 'success',
          tier,
          amount: result.amount_total,
          currency: result.currency,
          customerEmail: result.customer_email,
        },
      });
    }

    // Paiement échoué ou en attente
    return NextResponse.json({
      success: false,
      data: {
        status: result.status,
        paymentStatus: result.payment_status,
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
