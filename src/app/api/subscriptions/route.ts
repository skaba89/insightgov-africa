// ============================================
// InsightGov Africa - API Abonnements
// Gestion des souscriptions
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, checkLimit } from '@/lib/auth-helpers';
import { subscriptionService } from '@/services/subscription';

// ============================================
// GET - Obtenir le statut de l'abonnement
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthSession();

    if (!auth) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const status = await subscriptionService.getSubscriptionStatus(
      auth.user.organizationId
    );

    // Vérifier les limites
    const limits = {
      datasets: await checkLimit(
        auth.user.organizationId,
        'datasets',
        auth.organization.subscriptionTier
      ),
      dashboards: await checkLimit(
        auth.user.organizationId,
        'dashboards',
        auth.organization.subscriptionTier
      ),
      users: await checkLimit(
        auth.user.organizationId,
        'users',
        auth.organization.subscriptionTier
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        checks: limits,
      },
    });
  } catch (error: any) {
    console.error('[Subscription Get Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Changer de plan
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthSession();

    if (!auth) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan requis' },
        { status: 400 }
      );
    }

    const result = await subscriptionService.changePlan({
      organizationId: auth.user.organizationId,
      email: auth.user.email,
      newPlan: plan,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Subscription Change Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Annuler l'abonnement
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthSession();

    if (!auth) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await subscriptionService.cancelSubscription(auth.user.organizationId);

    return NextResponse.json({
      success: true,
      message: 'Abonnement annulé avec succès',
    });
  } catch (error: any) {
    console.error('[Subscription Cancel Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
