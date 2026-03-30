/**
 * InsightGov Africa - Paystack Webhook API Route
 * ===============================================
 * Gestion des webhooks Paystack pour les paiements et abonnements.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaystackClient, type PaystackWebhookEvent } from '@/lib/paystack/paystack-client';

/**
 * POST /api/paystack/webhook
 * Reçoit les webhooks Paystack
 * 
 * Headers:
 * - x-paystack-signature: Signature HMAC du payload
 * 
 * Events gérés:
 * - charge.success: Paiement réussi
 * - subscription.create: Abonnement créé
 * - subscription.disable: Abonnement désactivé
 * - subscription.expiring: Abonnement expire bientôt
 * - invoice.create: Facture créée
 * - invoice.payment_failed: Échec de paiement
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier la signature
    const signature = request.headers.get('x-paystack-signature');
    const rawBody = await request.text();

    if (!signature) {
      console.error('Webhook Paystack: signature manquante');
      return NextResponse.json(
        { success: false, error: 'Signature manquante' },
        { status: 401 }
      );
    }

    // Vérifier la signature (en production)
    const paystack = getPaystackClient();
    const isValid = paystack.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error('Webhook Paystack: signature invalide');
      return NextResponse.json(
        { success: false, error: 'Signature invalide' },
        { status: 401 }
      );
    }

    // Parser l'événement
    const event: PaystackWebhookEvent = JSON.parse(rawBody);
    console.log(`Webhook Paystack reçu: ${event.event}`);

    // Traiter selon le type d'événement
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event);
        break;

      case 'subscription.create':
        await handleSubscriptionCreate(event);
        break;

      case 'subscription.disable':
        await handleSubscriptionDisable(event);
        break;

      case 'subscription.expiring':
        await handleSubscriptionExpiring(event);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;

      default:
        console.log(`Événement Paystack non géré: ${event.event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur webhook Paystack:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du traitement du webhook',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// HANDLERS
// =============================================================================

/**
 * Traite un paiement réussi
 */
async function handleChargeSuccess(event: PaystackWebhookEvent) {
  const { data } = event;
  const metadata = data.metadata;

  // Récupérer l'ID de l'organisation depuis les métadonnées
  const organizationId = metadata?.organizationId as string | undefined;

  if (!organizationId) {
    console.error('Organization ID non trouvé dans les métadonnées');
    return;
  }

  // Mettre à jour l'abonnement
  await db.subscription.updateMany({
    where: { organizationId },
    data: {
      status: 'active',
    },
  });

  // Mettre à jour le tier de l'organisation
  const tier = metadata?.tier as string;
  if (tier) {
    await db.organization.update({
      where: { id: organizationId },
      data: { subscriptionTier: tier },
    });
  }

  console.log(`Paiement réussi pour l'organisation ${organizationId}`);
}

/**
 * Traite la création d'un abonnement
 */
async function handleSubscriptionCreate(event: PaystackWebhookEvent) {
  const { data } = event;
  const subscription = data.subscription;
  const customer = data.customer;

  if (!subscription || !customer) return;

  // Trouver l'organisation par email
  const user = await db.user.findFirst({
    where: { email: customer.email },
    include: { organization: true },
  });

  if (!user?.organization) {
    console.error(`Utilisateur non trouvé: ${customer.email}`);
    return;
  }

  // Créer ou mettre à jour l'abonnement
  await db.subscription.upsert({
    where: { organizationId: user.organizationId },
    create: {
      organizationId: user.organizationId,
      tier: 'professional',
      status: 'active',
      price: data.amount / 100,
      currency: data.currency,
      billingCycle: subscription.plan?.interval || 'monthly',
      paystackCustomerId: customer.customer_code,
      paystackSubscriptionId: subscription.subscription_code,
    },
    update: {
      status: 'active',
      paystackSubscriptionId: subscription.subscription_code,
    },
  });

  console.log(`Abonnement créé pour ${customer.email}`);
}

/**
 * Traite la désactivation d'un abonnement
 */
async function handleSubscriptionDisable(event: PaystackWebhookEvent) {
  const { data } = event;
  const subscription = data.subscription;

  if (!subscription) return;

  // Trouver l'abonnement par son code Paystack
  const dbSubscription = await db.subscription.findFirst({
    where: { paystackSubscriptionId: subscription.subscription_code },
  });

  if (!dbSubscription) return;

  // Mettre à jour le statut
  await db.subscription.update({
    where: { id: dbSubscription.id },
    data: { status: 'canceled' },
  });

  // Rétrograder l'organisation au plan gratuit
  await db.organization.update({
    where: { id: dbSubscription.organizationId },
    data: { subscriptionTier: 'free' },
  });

  console.log(`Abonnement désactivé: ${subscription.subscription_code}`);
}

/**
 * Traite un abonnement qui expire bientôt
 */
async function handleSubscriptionExpiring(event: PaystackWebhookEvent) {
  const { data } = event;
  const subscription = data.subscription;

  if (!subscription) return;

  // TODO: Envoyer un email de notification à l'utilisateur
  console.log(`Abonnement expire bientôt: ${subscription.subscription_code}`);
}

/**
 * Traite un échec de paiement
 */
async function handleInvoicePaymentFailed(event: PaystackWebhookEvent) {
  const { data } = event;
  const customer = data.customer;

  if (!customer) return;

  // Trouver l'utilisateur
  const user = await db.user.findFirst({
    where: { email: customer.email },
  });

  if (!user) return;

  // Mettre à jour l'abonnement en erreur
  await db.subscription.updateMany({
    where: { organizationId: user.organizationId },
    data: { status: 'past_due' },
  });

  console.log(`Échec de paiement pour ${customer.email}`);
}
