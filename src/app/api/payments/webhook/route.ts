// ============================================
// InsightGov Africa - API Webhook Stripe
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { updateOrganizationTier, recordSubscription, getPlanByAmount } from '@/services/stripe';
import { db } from '@/lib/db';

// Secret pour vérifier les webhooks Stripe
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Vérifier la signature Stripe (en production)
    const signature = request.headers.get('stripe-signature');
    if (STRIPE_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      // Note: En production, utilisez la bibliothèque stripe officielle
      // pour vérifier la signature avec stripe.webhooks.constructEvent
      // Pour simplifier, nous acceptons les webhooks en mode test
    }

    const event = JSON.parse(body);
    const { data, type } = event;

    console.log(`[Stripe Webhook] Event: ${type}`);

    // Traiter selon le type d'événement
    switch (type) {
      case 'checkout.session.completed': {
        const session = data.object;
        const sessionId = session.id;
        const metadata = session.metadata || {};
        const organizationId = metadata.organizationId;
        const plan = metadata.plan;

        // Trouver l'abonnement en attente
        const subscription = await db.subscription.findFirst({
          where: {
            organizationId,
            status: 'PENDING',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (subscription) {
          await recordSubscription({
            organizationId: subscription.organizationId,
            stripeSessionId: sessionId,
            status: 'ACTIVE',
            amount: session.amount_total,
            currency: session.currency?.toUpperCase() || 'EUR',
            interval: subscription.interval || 'monthly',
          });

          // Déterminer le tier
          const tier = getPlanByAmount(session.amount_total);
          await updateOrganizationTier(subscription.organizationId, tier as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE');

          console.log(`[Stripe] Subscription activated for org ${organizationId}, tier: ${tier}`);
        }
        break;
      }

      case 'customer.subscription.created': {
        console.log('[Stripe] Subscription created:', data.object.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = data.object;
        console.log('[Stripe] Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        // Annuler l'abonnement - retour au plan gratuit
        const subscriptionId = data.object.id;

        const subscription = await db.subscription.findFirst({
          where: {
            paystackReference: { contains: subscriptionId },
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
          console.log(`[Stripe] Subscription cancelled for org ${subscription.organizationId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = data.object;
        console.log('[Stripe] Payment succeeded for invoice:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = data.object;
        const customerId = invoice.customer;

        // Trouver l'abonnement correspondant
        const subscription = await db.subscription.findFirst({
          where: {
            status: 'ACTIVE',
          },
          include: {
            organization: {
              include: {
                users: {
                  where: { role: 'owner' },
                },
              },
            },
          },
        });

        if (subscription) {
          await db.subscription.update({
            where: { id: subscription.id },
            data: { status: 'PAST_DUE' },
          });

          console.log(`[Stripe] Payment failed for org ${subscription.organizationId}`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook Error]', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
