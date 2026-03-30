/**
 * InsightGov Africa - Paystack Payment API Route
 * ===============================================
 * API pour initialiser les paiements et gérer les abonnements.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getPaystackClient,
  PRICING_PLANS,
  type PricingPlanTier,
} from '@/lib/paystack/paystack-client';

/**
 * POST /api/paystack/initialize
 * Initialise une transaction de paiement
 * 
 * Request body:
 * - tier: Plan d'abonnement (starter, professional, enterprise)
 * - organizationId: ID de l'organisation
 * - email: Email de l'utilisateur
 * - billingCycle: 'monthly' | 'yearly' (optionnel, défaut: monthly)
 * 
 * Response:
 * - authorization_url: URL de paiement Paystack
 * - reference: Référence unique de la transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, organizationId, email, billingCycle = 'monthly' } = body;

    // Validations
    if (!tier || !organizationId || !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'tier, organizationId et email sont requis',
        },
        { status: 400 }
      );
    }

    const plan = PRICING_PLANS[tier as PricingPlanTier];
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'organisation existe
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organisation non trouvée' },
        { status: 404 }
      );
    }

    // Calculer le montant (réduction 20% pour annuel)
    let amount = plan.amount;
    if (billingCycle === 'yearly') {
      amount = Math.round(plan.amount * 12 * 0.8); // 20% de réduction
    }

    // Pour le plan gratuit, pas de paiement
    if (amount === 0) {
      await db.organization.update({
        where: { id: organizationId },
        data: { subscriptionTier: tier },
      });

      await db.subscription.upsert({
        where: { organizationId },
        create: {
          organizationId,
          tier,
          status: 'active',
          price: 0,
          currency: 'EUR',
          billingCycle,
        },
        update: {
          tier,
          status: 'active',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Plan gratuit activé',
        tier,
      });
    }

    // Initialiser la transaction Paystack
    const paystack = getPaystackClient();
    const reference = paystack.generateReference();

    const result = await paystack.initializeTransaction({
      amount,
      email,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      metadata: {
        organizationId,
        tier,
        billingCycle,
      },
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Erreur lors de l\'initialisation du paiement',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      authorization_url: result.data.authorization_url,
      reference: result.data.reference,
      amount,
      currency: plan.currency,
    });
  } catch (error) {
    console.error('Erreur initialisation paiement:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'initialisation du paiement',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/paystack/verify
 * Vérifie le statut d'une transaction
 * 
 * Query params:
 * - reference: Référence de la transaction
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Référence requise' },
        { status: 400 }
      );
    }

    const paystack = getPaystackClient();
    const result = await paystack.verifyTransaction(reference);

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Transaction non trouvée',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: {
        status: result.data.status,
        reference: result.data.reference,
        amount: result.data.amount / 100,
        currency: result.data.currency,
        paidAt: result.data.paid_at,
        channel: result.data.channel,
      },
    });
  } catch (error) {
    console.error('Erreur vérification transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la vérification',
      },
      { status: 500 }
    );
  }
}
