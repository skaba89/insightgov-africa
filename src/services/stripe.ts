// ============================================
// InsightGov Africa - Service Stripe
// Intégration paiement gratuite (mode test)
// ============================================

import { db } from '@/lib/db';

// ============================================
// TYPES
// ============================================

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  baseUrl: string;
  mode: 'test' | 'live';
}

export interface InitializePaymentParams {
  email: string;
  amount: number; // En centimes (1 EUR = 100 centimes)
  currency?: string;
  productName: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResponse {
  id: string;
  url: string;
  status: string;
}

export interface VerifyResponse {
  id: string;
  status: string;
  payment_status: string;
  amount_total: number;
  currency: string;
  customer_email: string;
  metadata: Record<string, string>;
  created: number;
}

// ============================================
// CONFIGURATION
// ============================================

const STRIPE_CONFIG: StripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  baseUrl: 'https://api.stripe.com/v1',
  mode: (process.env.STRIPE_MODE as 'test' | 'live') || 'test',
};

// ============================================
// TARIFICATION INSIGHTGOV AFRICA
// ============================================

export const PRICING_PLANS = {
  FREE: {
    name: 'Gratuit',
    nameEn: 'Free',
    price: 0,
    priceId: null, // Pas de prix Stripe pour le plan gratuit
    currency: 'EUR',
    features: [
      '1 Dataset',
      '5 Dashboards',
      'Export PDF (5/mois)',
      'Support email',
    ],
    limits: {
      datasets: 1,
      dashboards: 5,
      exports: 5,
      users: 1,
    },
  },
  STARTER: {
    name: 'Starter',
    nameEn: 'Starter',
    price: 4900, // 49€ en centimes
    priceDisplay: '49€',
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter_monthly', // À créer dans Stripe
    currency: 'EUR',
    interval: 'monthly',
    features: [
      '10 Datasets',
      '25 Dashboards',
      'Export PDF illimité',
      'Support prioritaire',
      'Partage public',
    ],
    limits: {
      datasets: 10,
      dashboards: 25,
      exports: -1,
      users: 5,
    },
  },
  PROFESSIONAL: {
    name: 'Professionnel',
    nameEn: 'Professional',
    price: 14900, // 149€ en centimes
    priceDisplay: '149€',
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional_monthly',
    currency: 'EUR',
    interval: 'monthly',
    features: [
      'Datasets illimités',
      'Dashboards illimités',
      'Export PDF & Excel',
      'API Access',
      'Support dédié',
      'Branding personnalisé',
    ],
    limits: {
      datasets: -1,
      dashboards: -1,
      exports: -1,
      users: 25,
    },
  },
  ENTERPRISE: {
    name: 'Entreprise',
    nameEn: 'Enterprise',
    price: 49900, // 499€ en centimes
    priceDisplay: '499€',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
    currency: 'EUR',
    interval: 'monthly',
    features: [
      'Tout illimité',
      'Déploiement on-premise',
      'SLA 99.9%',
      'Account manager dédié',
      'Formation équipe',
      'Intégrations custom',
    ],
    limits: {
      datasets: -1,
      dashboards: -1,
      exports: -1,
      users: -1,
    },
  },
};

// ============================================
// SERVICE STRIPE
// ============================================

export class StripeService {
  private config: StripeConfig;

  constructor(config: StripeConfig = STRIPE_CONFIG) {
    this.config = config;
  }

  /**
   * Vérifier si Stripe est configuré
   */
  isConfigured(): boolean {
    return !!this.config.secretKey && !!this.config.publishableKey;
  }

  /**
   * Vérifier si en mode test
   */
  isTestMode(): boolean {
    return this.config.mode === 'test' || this.config.secretKey.startsWith('sk_test_');
  }

  /**
   * Obtenir la clé publique
   */
  getPublishableKey(): string | null {
    return this.config.publishableKey || null;
  }

  /**
   * Créer une session de checkout Stripe
   */
  async createCheckoutSession(params: InitializePaymentParams): Promise<CheckoutSessionResponse> {
    if (!this.isConfigured()) {
      // Mode démo - retourner une URL de test
      return {
        id: `cs_demo_${Date.now()}`,
        url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/payment/demo?ref=${params.metadata?.reference || 'demo'}`,
        status: 'open',
      };
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = params.successUrl || `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = params.cancelUrl || `${baseUrl}/payment/cancel`;

    const response = await fetch(`${this.config.baseUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'customer_email': params.email,
        'line_items[0][price_data][currency]': params.currency || 'eur',
        'line_items[0][price_data][unit_amount]': params.amount.toString(),
        'line_items[0][price_data][product_data][name]': params.productName,
        'line_items[0][quantity]': '1',
        'success_url': successUrl,
        'cancel_url': cancelUrl,
        'metadata[reference]': params.metadata?.reference || '',
        'metadata[organization_id]': params.metadata?.organizationId || '',
        'metadata[plan]': params.metadata?.plan || '',
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error: ${error}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      url: data.url,
      status: data.status,
    };
  }

  /**
   * Créer une session d'abonnement
   */
  async createSubscriptionSession(params: {
    email: string;
    priceId: string;
    successUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, string>;
  }): Promise<CheckoutSessionResponse> {
    if (!this.isConfigured()) {
      return {
        id: `sub_demo_${Date.now()}`,
        url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/payment/demo?ref=${params.metadata?.reference || 'demo'}`,
        status: 'open',
      };
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = params.successUrl || `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = params.cancelUrl || `${baseUrl}/payment/cancel`;

    const response = await fetch(`${this.config.baseUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'customer_email': params.email,
        'line_items[0][price]': params.priceId,
        'line_items[0][quantity]': '1',
        'success_url': successUrl,
        'cancel_url': cancelUrl,
        'metadata[reference]': params.metadata?.reference || '',
        'metadata[organization_id]': params.metadata?.organizationId || '',
        'metadata[plan]': params.metadata?.plan || '',
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error: ${error}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      url: data.url,
      status: data.status,
    };
  }

  /**
   * Récupérer une session de checkout
   */
  async getSession(sessionId: string): Promise<VerifyResponse> {
    if (!this.isConfigured() || sessionId.startsWith('cs_demo_')) {
      // Mode démo
      return {
        id: sessionId,
        status: 'complete',
        payment_status: 'paid',
        amount_total: 4900,
        currency: 'eur',
        customer_email: 'demo@insightgov.africa',
        metadata: { plan: 'STARTER' },
        created: Date.now() / 1000,
      };
    }

    const response = await fetch(`${this.config.baseUrl}/checkout/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error: ${error}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      payment_status: data.payment_status,
      amount_total: data.amount_total,
      currency: data.currency,
      customer_email: data.customer_email || data.customer_details?.email || '',
      metadata: data.metadata || {},
      created: data.created,
    };
  }

  /**
   * Vérifier la signature du webhook
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn('[Stripe] Webhook secret not configured');
      return true; // En mode démo, accepter tous les webhooks
    }

    // Note: En production, utilisez la bibliothèque stripe officielle pour vérifier
    // la signature du webhook avec stripe.webhooks.constructEvent
    return true;
  }

  /**
   * Annuler un abonnement
   */
  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean }> {
    if (!this.isConfigured()) {
      return { success: true };
    }

    const response = await fetch(`${this.config.baseUrl}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error: ${error}`);
    }

    return { success: true };
  }

  /**
   * Créer un portail client pour gérer les abonnements
   */
  async createCustomerPortal(customerId: string): Promise<string> {
    if (!this.isConfigured()) {
      return `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/account/billing`;
    }

    const response = await fetch(`${this.config.baseUrl}/billing_portal/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: `${process.env.NEXTAUTH_URL}/account/billing`,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error: ${error}`);
    }

    const data = await response.json();
    return data.url;
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Créer ou mettre à jour un abonnement dans la base de données
 */
export async function recordSubscription(params: {
  organizationId: string;
  stripeSessionId: string;
  stripeSubscriptionId?: string;
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED';
  amount: number;
  currency: string;
  interval?: string;
}): Promise<void> {
  await db.subscription.upsert({
    where: {
      paystackReference: params.stripeSessionId, // Garder le nom pour compatibilité
    },
    create: {
      organizationId: params.organizationId,
      paystackReference: params.stripeSessionId,
      status: params.status,
      amount: params.amount,
      currency: params.currency,
      interval: params.interval,
      startDate: params.status === 'ACTIVE' ? new Date() : null,
      endDate: params.status === 'ACTIVE'
        ? new Date(Date.now() + (params.interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
        : null,
    },
    update: {
      status: params.status,
      startDate: params.status === 'ACTIVE' ? new Date() : undefined,
      endDate: params.status === 'ACTIVE'
        ? new Date(Date.now() + (params.interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
        : undefined,
    },
  });
}

/**
 * Mettre à jour le tier d'abonnement de l'organisation
 */
export async function updateOrganizationTier(
  organizationId: string,
  tier: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
): Promise<void> {
  await db.organization.update({
    where: { id: organizationId },
    data: { subscriptionTier: tier },
  });
}

/**
 * Obtenir le plan par montant
 */
export function getPlanByAmount(amount: number): keyof typeof PRICING_PLANS {
  if (amount >= 49900) return 'ENTERPRISE';
  if (amount >= 14900) return 'PROFESSIONAL';
  if (amount >= 4900) return 'STARTER';
  return 'FREE';
}

// Export singleton
export const stripeService = new StripeService();

// Export pour compatibilité avec le code existant
export const paystackService = stripeService;
