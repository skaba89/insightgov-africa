// ============================================
// InsightGov Africa - Service Abonnements
// Gestion complète des souscriptions
// ============================================

import { db } from '@/lib/db';
import { paystackService, PRICING_PLANS } from './paystack';

// ============================================
// TYPES
// ============================================

export interface SubscriptionStatus {
  tier: string;
  status: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  limits: {
    datasets: { used: number; limit: number };
    dashboards: { used: number; limit: number };
    users: { used: number; limit: number };
    exports: { used: number; limit: number };
  };
}

export interface Invoice {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  status: string;
  pdfUrl?: string;
}

// ============================================
// SERVICE ABONNEMENTS
// ============================================

export class SubscriptionService {
  /**
   * Obtenir le statut de l'abonnement d'une organisation
   */
  async getSubscriptionStatus(organizationId: string): Promise<SubscriptionStatus> {
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            datasets: true,
            users: true,
          },
        },
      },
    });

    if (!organization) {
      throw new Error('Organisation non trouvée');
    }

    const tier = organization.subscriptionTier;
    const plan = PRICING_PLANS[tier as keyof typeof PRICING_PLANS] || PRICING_PLANS.FREE;

    // Compter les dashboards
    const dashboardCount = await db.dashboard.count({
      where: {
        dataset: { organizationId },
      },
    });

    // Compter les exports ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const exportCount = await db.export.count({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
      },
    });

    const activeSubscription = organization.subscriptions[0];

    return {
      tier,
      status: activeSubscription?.status || 'FREE',
      currentPeriodEnd: activeSubscription?.endDate || undefined,
      cancelAtPeriodEnd: false,
      limits: {
        datasets: {
          used: organization._count.datasets,
          limit: plan.limits.datasets,
        },
        dashboards: {
          used: dashboardCount,
          limit: plan.limits.dashboards,
        },
        users: {
          used: organization._count.users,
          limit: plan.limits.users,
        },
        exports: {
          used: exportCount,
          limit: plan.limits.exports,
        },
      },
    };
  }

  /**
   * Changer le plan d'abonnement
   */
  async changePlan(params: {
    organizationId: string;
    email: string;
    newPlan: string;
  }): Promise<{ authorizationUrl: string; reference: string }> {
    const { organizationId, email, newPlan } = params;

    // Vérifier que le plan existe
    const plan = PRICING_PLANS[newPlan as keyof typeof PRICING_PLANS];
    if (!plan || plan.price === 0) {
      throw new Error('Plan invalide');
    }

    // Vérifier l'organisation
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organisation non trouvée');
    }

    // Initialiser le paiement
    const reference = `igv_upgrade_${organizationId.slice(0, 8)}_${Date.now()}`;

    const result = await paystackService.initializePayment({
      email,
      amount: plan.price,
      currency: plan.currency,
      reference,
      metadata: {
        organizationId,
        plan: newPlan,
        type: 'upgrade',
      },
    });

    if (!result.status || !result.data) {
      throw new Error(result.message || 'Erreur lors de l\'initialisation du paiement');
    }

    // Créer un enregistrement en attente
    await db.subscription.create({
      data: {
        organizationId,
        paystackReference: reference,
        status: 'PENDING',
        amount: plan.price,
        currency: plan.currency,
        interval: 'monthly',
      },
    });

    return {
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
    };
  }

  /**
   * Annuler l'abonnement
   */
  async cancelSubscription(organizationId: string): Promise<void> {
    const activeSubscription = await db.subscription.findFirst({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeSubscription) {
      throw new Error('Aucun abonnement actif trouvé');
    }

    // Annuler côté Paystack si configuré
    if (activeSubscription.paystackReference && paystackService.isConfigured()) {
      try {
        await paystackService.cancelSubscription(activeSubscription.paystackReference);
      } catch (error) {
        console.error('[Subscription] Error canceling with Paystack:', error);
      }
    }

    // Mettre à jour en base
    await db.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Rétrograder au plan gratuit
    await db.organization.update({
      where: { id: organizationId },
      data: { subscriptionTier: 'FREE' },
    });
  }

  /**
   * Obtenir l'historique des factures
   */
  async getInvoices(organizationId: string): Promise<Invoice[]> {
    const subscriptions = await db.subscription.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    return subscriptions.map((sub) => ({
      id: sub.id,
      date: sub.createdAt,
      amount: sub.amount,
      currency: sub.currency,
      status: sub.status,
      pdfUrl: undefined, // TODO: Générer les PDFs
    }));
  }

  /**
   * Vérifier et mettre à jour les abonnements expirés
   */
  async checkExpiredSubscriptions(): Promise<void> {
    const now = new Date();

    const expiredSubscriptions = await db.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      include: { organization: true },
    });

    for (const subscription of expiredSubscriptions) {
      console.log(`[Subscription] Expiring subscription for ${subscription.organization.name}`);

      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: 'EXPIRED' },
      });

      await db.organization.update({
        where: { id: subscription.organizationId },
        data: { subscriptionTier: 'FREE' },
      });
    }
  }

  /**
   * Upgrader après paiement réussi
   */
  async activateAfterPayment(reference: string): Promise<void> {
    const subscription = await db.subscription.findUnique({
      where: { paystackReference: reference },
    });

    if (!subscription) {
      throw new Error('Abonnement non trouvé');
    }

    // Vérifier le paiement
    const verification = await paystackService.verifyPayment(reference);

    if (verification.status && verification.data?.status === 'success') {
      const amount = verification.data.amount;

      // Déterminer le tier
      let tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' = 'STARTER';
      if (amount >= 49900) {
        tier = 'ENTERPRISE';
      } else if (amount >= 14900) {
        tier = 'PROFESSIONAL';
      }

      // Calculer la date de fin
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      // Mettre à jour l'abonnement
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          startDate: new Date(),
          endDate,
        },
      });

      // Mettre à jour l'organisation
      await db.organization.update({
        where: { id: subscription.organizationId },
        data: { subscriptionTier: tier },
      });

      console.log(`[Subscription] Activated ${tier} for organization ${subscription.organizationId}`);
    }
  }
}

// Export singleton
export const subscriptionService = new SubscriptionService();
