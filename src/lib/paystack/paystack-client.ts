/**
 * InsightGov Africa - Paystack Integration Service
 * =================================================
 * Service d'intégration avec Paystack pour les paiements africains.
 * Supporte les abonnements et paiements uniques.
 */

import crypto from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export interface PaystackConfig {
  secretKey: string;
  publicKey: string;
  baseUrl: string;
}

export interface PaystackCustomer {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackPlan {
  name: string;
  amount: number; // en centimes (kobo pour NGN, centimes pour autres devises)
  interval: 'daily' | 'weekly' | 'monthly' | 'biannually' | 'annually';
  currency?: string;
  description?: string;
}

export interface PaystackSubscription {
  customer: string;
  plan: string;
  authorization?: string;
  start_date?: string;
}

export interface PaystackTransaction {
  amount: number;
  email: string;
  reference?: string;
  callback_url?: string;
  plan?: string;
  invoice_limit?: number;
  metadata?: Record<string, unknown>;
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, unknown>;
    log: {
      history: Array<{
        type: string;
        message: string;
        time: number;
      }>;
    };
    fees: number;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: Record<string, unknown>;
      risk_action: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
    plan?: {
      id: number;
      name: string;
      plan_code: string;
      description: string | null;
      amount: number;
      interval: string;
      currency: string;
    };
    subscription?: {
      id: number;
      subscription_code: string;
      email_token: string;
      amount: number;
      currency: string;
      plan: {
        id: number;
        name: string;
        plan_code: string;
      };
      status: string;
    };
  };
}

// =============================================================================
// PAYSTACK CLIENT
// =============================================================================

class PaystackClient {
  private config: PaystackConfig;

  constructor(secretKey?: string, publicKey?: string) {
    this.config = {
      secretKey: secretKey || process.env.PAYSTACK_SECRET_KEY || '',
      publicKey: publicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
      baseUrl: 'https://api.paystack.co',
    };
  }

  /**
   * Effectue une requête vers l'API Paystack
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Erreur API Paystack',
        };
      }

      return {
        success: true,
        data: result.data as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // =========================================================================
  // CUSTOMERS
  // =========================================================================

  /**
   * Crée un client Paystack
   */
  async createCustomer(customer: PaystackCustomer) {
    return this.request<{ id: number; customer_code: string; email: string }>(
      '/customer',
      'POST',
      customer as unknown as Record<string, unknown>
    );
  }

  /**
   * Récupère un client par email
   */
  async getCustomer(email: string) {
    return this.request<{ id: number; customer_code: string; email: string }>(
      `/customer/${email}`
    );
  }

  // =========================================================================
  // PLANS
  // =========================================================================

  /**
   * Crée un plan d'abonnement
   */
  async createPlan(plan: PaystackPlan) {
    return this.request<{ id: number; name: string; plan_code: string; amount: number }>(
      '/plan',
      'POST',
      plan as unknown as Record<string, unknown>
    );
  }

  /**
   * Liste tous les plans
   */
  async listPlans() {
    return this.request<Array<{ id: number; name: string; plan_code: string }>>(
      '/plan'
    );
  }

  // =========================================================================
  // TRANSACTIONS
  // =========================================================================

  /**
   * Initialise une transaction
   */
  async initializeTransaction(transaction: PaystackTransaction) {
    return this.request<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>(
      '/transaction/initialize',
      'POST',
      transaction as unknown as Record<string, unknown>
    );
  }

  /**
   * Vérifie une transaction
   */
  async verifyTransaction(reference: string) {
    return this.request<{
      id: number;
      status: string;
      reference: string;
      amount: number;
      gateway_response: string;
      paid_at: string;
      channel: string;
      currency: string;
      customer: { email: string };
    }>(`/transaction/verify/${reference}`);
  }

  /**
   * Liste les transactions
   */
  async listTransactions(params?: { perPage?: number; page?: number }) {
    const query = new URLSearchParams();
    if (params?.perPage) query.set('perPage', params.perPage.toString());
    if (params?.page) query.set('page', params.page.toString());

    return this.request<Array<{
      id: number;
      status: string;
      reference: string;
      amount: number;
    }>>(`/transaction?${query.toString()}`);
  }

  // =========================================================================
  // SUBSCRIPTIONS
  // =========================================================================

  /**
   * Crée un abonnement
   */
  async createSubscription(subscription: PaystackSubscription) {
    return this.request<{
      id: number;
      subscription_code: string;
      email_token: string;
      status: string;
    }>(
      '/subscription',
      'POST',
      subscription as unknown as Record<string, unknown>
    );
  }

  /**
   * Active un abonnement
   */
  async enableSubscription(code: string, token: string) {
    return this.request<{ status: boolean; message: string }>(
      '/subscription/enable',
      'POST',
      { code, token }
    );
  }

  /**
   * Désactive un abonnement
   */
  async disableSubscription(code: string, token: string) {
    return this.request<{ status: boolean; message: string }>(
      '/subscription/disable',
      'POST',
      { code, token }
    );
  }

  /**
   * Récupère un abonnement
   */
  async getSubscription(code: string) {
    return this.request<{
      id: number;
      subscription_code: string;
      status: string;
      amount: number;
    }>(`/subscription/${code}`);
  }

  // =========================================================================
  // UTILITAIRES
  // =========================================================================

  /**
   * Vérifie la signature d'un webhook
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.config.secretKey)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  /**
   * Génère une référence unique
   */
  generateReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `IGA-${timestamp}-${random}`.toUpperCase();
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Singleton client
let paystackClient: PaystackClient | null = null;

export function getPaystackClient(): PaystackClient {
  if (!paystackClient) {
    paystackClient = new PaystackClient();
  }
  return paystackClient;
}

// Plans prédéfinis pour InsightGov Africa
export const PRICING_PLANS = {
  free: {
    name: 'Free',
    amount: 0,
    currency: 'EUR',
    interval: 'monthly' as const,
    features: [
      '1 dataset',
      '5 KPIs maximum',
      'Export PDF limité',
      'Support email',
    ],
  },
  starter: {
    name: 'Starter',
    amount: 9900, // 99 EUR en centimes
    currency: 'EUR',
    interval: 'monthly' as const,
    features: [
      '5 datasets',
      '15 KPIs par dashboard',
      'Export PDF illimité',
      'Support prioritaire',
      'Filtres avancés',
    ],
  },
  professional: {
    name: 'Professional',
    amount: 49900, // 499 EUR en centimes
    currency: 'EUR',
    interval: 'monthly' as const,
    features: [
      'Datasets illimités',
      'KPIs illimités',
      'Export PDF & Excel',
      'API Access',
      'Support dédié',
      'Personnalisation avancée',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    amount: 149900, // 1499 EUR en centimes
    currency: 'EUR',
    interval: 'monthly' as const,
    features: [
      'Tout inclus Professional',
      'Serveur dédié',
      'SSO / SAML',
      'SLA 99.9%',
      'Formation équipe',
      'Support 24/7',
    ],
  },
} as const;

export type PricingPlanTier = keyof typeof PRICING_PLANS;

export default PaystackClient;
