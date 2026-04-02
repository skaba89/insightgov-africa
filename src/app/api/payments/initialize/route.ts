// ============================================
// InsightGov Africa - API Initialiser Paiement
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { stripeService, PRICING_PLANS } from '@/services/stripe';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  const authResult = await requireAuth(request, 'write');

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const auth = authResult.auth;

  try {
    const body = await request.json();
    const { organizationId, plan, email } = body;

    if (!organizationId || !plan || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur peut effectuer un paiement pour cette organisation
    if (auth.role !== 'owner' && auth.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé. Vous ne pouvez pas effectuer de paiement pour cette organisation.' },
        { status: 403 }
      );
    }

    // Vérifier que l'email correspond à l'utilisateur connecté
    if (auth.email !== email) {
      console.warn(`[Payment] Email mismatch: auth=${auth.email}, request=${email}`);
    }

    // Vérifier que le plan existe
    const planConfig = PRICING_PLANS[plan as keyof typeof PRICING_PLANS];
    if (!planConfig || planConfig.price === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Vérifier l'organisation
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Journalisation pour audit
    console.log(`[Payment] User ${auth.email} (${auth.userId}) initializing payment for org ${organizationId}, plan: ${plan}`);

    // Générer une référence unique
    const reference = `igv_${organizationId.slice(0, 8)}_${Date.now()}`;

    // Créer une session de checkout Stripe
    const result = await stripeService.createCheckoutSession({
      email,
      amount: planConfig.price,
      currency: planConfig.currency.toLowerCase(),
      productName: `InsightGov Africa - ${planConfig.name}`,
      metadata: {
        organizationId,
        plan,
        organizationName: organization.name,
        userId: auth.userId,
        reference,
      },
    });

    // Créer un enregistrement d'abonnement en attente
    await db.subscription.create({
      data: {
        organizationId,
        paystackReference: reference, // Garder pour compatibilité
        status: 'PENDING',
        amount: planConfig.price,
        currency: planConfig.currency,
        interval: planConfig.interval || 'monthly',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: result.url,
        sessionId: result.id,
        reference,
      },
      metadata: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Payment Initialize Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
