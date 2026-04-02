/**
 * InsightGov Africa - Organization Subscription API Route
 * ========================================================
 * Gère les abonnements par organisation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/organizations/[id]/subscription
 * Récupère l'abonnement d'une organisation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer l'abonnement actif de l'organisation
    const subscription = await db.subscription.findFirst({
      where: {
        organizationId,
        status: 'active',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
          },
        },
      },
    });

    if (!subscription) {
      // Retourner un plan gratuit par défaut si pas d'abonnement
      return NextResponse.json({
        success: true,
        subscription: {
          id: null,
          status: 'inactive',
          tier: 'free',
          organizationId,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        tier: subscription.tier,
        organizationId: subscription.organizationId,
        currentPeriodStart: subscription.currentPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        paystackSubscriptionCode: subscription.paystackSubscriptionId,
        organization: subscription.organization,
      },
    });
  } catch (error) {
    console.error('Erreur récupération abonnement:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizations/[id]/subscription
 * Met à jour l'abonnement d'une organisation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tier, status } = body;

    // Vérifier que l'utilisateur est admin de l'organisation
    const membership = await db.organizationMember.findFirst({
      where: {
        organizationId,
        userId: session.user.id,
        role: { in: ['owner', 'admin'] },
      },
    });

    if (!membership) {
      // Si pas de membership, vérifier si l'utilisateur appartient à l'organisation
      const user = await db.user.findFirst({
        where: {
          id: session.user.id,
          organizationId,
        },
      });
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Permissions insuffisantes' },
          { status: 403 }
        );
      }
    }

    // Mettre à jour ou créer l'abonnement
    const subscription = await db.subscription.upsert({
      where: {
        organizationId,
      },
      create: {
        organizationId,
        tier: tier || 'free',
        status: status || 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
      },
      update: {
        tier: tier || undefined,
        status: status || undefined,
      },
    });

    // Mettre à jour le tier de l'organisation
    await db.organization.update({
      where: { id: organizationId },
      data: { subscriptionTier: tier || 'free' },
    });

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Erreur mise à jour abonnement:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/subscription
 * Annule l'abonnement d'une organisation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const membership = await db.organizationMember.findFirst({
      where: {
        organizationId,
        userId: session.user.id,
        role: { in: ['owner', 'admin'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Marquer l'abonnement pour annulation
    await db.subscription.updateMany({
      where: {
        organizationId,
        status: 'active',
      },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Abonnement annulé avec succès',
    });
  } catch (error) {
    console.error('Erreur annulation abonnement:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
