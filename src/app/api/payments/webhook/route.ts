// ============================================
// InsightGov Africa - API Webhook Paystack
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { updateOrganizationTier, recordSubscription } from '@/services/paystack';
import { db } from '@/lib/db';

// Secret pour vérifier les webhooks Paystack
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Vérifier la signature (en production)
    if (PAYSTACK_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
      const signature = request.headers.get('x-paystack-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      const hash = createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const { data, event: eventType } = event;

    console.log(`[Paystack Webhook] Event: ${eventType}`);

    // Traiter selon le type d'événement
    switch (eventType) {
      case 'charge.success': {
        const reference = data.reference;
        const subscription = await db.subscription.findUnique({
          where: { paystackReference: reference },
        });

        if (subscription) {
          await recordSubscription({
            organizationId: subscription.organizationId,
            paystackReference: reference,
            status: 'ACTIVE',
            amount: data.amount,
            currency: data.currency,
            interval: subscription.interval || 'monthly',
          });

          // Déterminer le tier
          const amount = data.amount;
          let tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' = 'STARTER';

          if (amount >= 49900) {
            tier = 'ENTERPRISE';
          } else if (amount >= 14900) {
            tier = 'PROFESSIONAL';
          }

          await updateOrganizationTier(subscription.organizationId, tier);
        }
        break;
      }

      case 'subscription.create': {
        console.log('[Paystack] Subscription created:', data.subscription_code);
        break;
      }

      case 'subscription.disable': {
        // Annuler l'abonnement - retour au plan gratuit
        if (data.subscription_code) {
          const subscription = await db.subscription.findFirst({
            where: {
              paystackReference: { contains: data.subscription_code },
            },
          });

          if (subscription) {
            await db.subscription.update({
              where: { id: subscription.id },
              data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
              },
            });

            await updateOrganizationTier(subscription.organizationId, 'FREE');
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const reference = data.reference;
        const subscription = await db.subscription.findUnique({
          where: { paystackReference: reference },
        });

        if (subscription) {
          await db.subscription.update({
            where: { id: subscription.id },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }

      default:
        console.log(`[Paystack Webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Paystack Webhook Error]', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
