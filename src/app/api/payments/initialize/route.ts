// ============================================
// InsightGov Africa - API Initialiser Paiement
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { paystackService, PRICING_PLANS } from '@/services/paystack';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, plan, email } = body;

    if (!organizationId || !plan || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Vérifier que le plan existe
    const planConfig = PRICING_PLANS[plan as keyof typeof PRICING_PLANS];
    if (!planConfig || planConfig.price === 0) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Vérifier l'organisation
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Générer une référence unique
    const reference = `igv_${organizationId.slice(0, 8)}_${Date.now()}`;

    // Initialiser le paiement
    const result = await paystackService.initializePayment({
      email,
      amount: planConfig.price,
      currency: planConfig.currency,
      reference,
      metadata: {
        organizationId,
        plan,
        organizationName: organization.name,
      },
    });

    if (!result.status) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Créer un enregistrement d'abonnement en attente
    await db.subscription.create({
      data: {
        organizationId,
        paystackReference: reference,
        status: 'PENDING',
        amount: planConfig.price,
        currency: planConfig.currency,
        interval: planConfig.interval || 'monthly',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl: result.data?.authorization_url,
        reference: result.data?.reference,
        accessCode: result.data?.access_code,
      },
    });
  } catch (error: any) {
    console.error('[Payment Initialize Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
