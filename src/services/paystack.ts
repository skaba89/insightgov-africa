// ============================================
// InsightGov Africa - Service Paystack
// Intégration paiement pour l'Afrique
// ============================================

import { db } from '@/lib/db';

// ============================================
// TYPES
// ============================================

export interface PaystackConfig {
  secretKey: string;
  publicKey: string;
  baseUrl: string;
}

export interface InitializePaymentParams {
  email: string;
  amount: number; // En centimes (1 EUR = 100 centimes)
  currency?: string;
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaystackResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerifyResponse {
  status: boolean;
  message: string;
  data?: {
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
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: any;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
    };
    plan: any;
  };
}

// ============================================
// CONFIGURATION
// ============================================

const PAYSTACK_CONFIG: PaystackConfig = {
  secretKey: process.env.PAYSTACK_SECRET_KEY || '',
  publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.paystack.co'
    : 'https://api.paystack.co', // Paystack utilise la même URL en test et prod
};

// ============================================
// TARIFICATION INSIGHTGOV AFRICA
// ============================================

export const PRICING_PLANS = {
  FREE: {
    name: 'Gratuit',
    price: 0,
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
    price: 4900, // 49€ en centimes
    priceDisplay: '49€',
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
    price: 14900, // 149€ en centimes
    priceDisplay: '149€',
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
    price: 49900, // 499€ en centimes
    priceDisplay: '499€',
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
// SERVICE PAYSTACK
// ============================================

export class PaystackService {
  private config: PaystackConfig;

  constructor(config: PaystackConfig = PAYSTACK_CONFIG) {
    this.config = config;
  }

  /**
   * Vérifier si Paystack est configuré
   */
  isConfigured(): boolean {
    return !!this.config.secretKey && !!this.config.publicKey;
  }

  /**
   * Initialiser un paiement
   */
  async initializePayment(params: InitializePaymentParams): Promise<PaystackResponse> {
    if (!this.isConfigured()) {
      // Mode démo - retourner une URL de test
      return {
        status: true,
        message: 'Mode démo - Paiement simulé',
        data: {
          authorization_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/payment/demo?ref=${params.reference || 'demo'}`,
          access_code: 'demo_access_code',
          reference: params.reference || `demo_${Date.now()}`,
        },
      };
    }

    const reference = params.reference || `igv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = await fetch(`${this.config.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        currency: params.currency || 'EUR',
        reference,
        callback_url: params.callbackUrl || `${process.env.NEXTAUTH_URL}/payment/callback`,
        metadata: params.metadata || {},
      }),
    });

    const data = await response.json();
    return data;
  }

  /**
   * Vérifier un paiement
   */
  async verifyPayment(reference: string): Promise<VerifyResponse> {
    if (!this.isConfigured()) {
      // Mode démo - simuler un succès
      return {
        status: true,
        message: 'Mode démo - Paiement vérifié',
        data: {
          id: 1,
          domain: 'test',
          status: 'success',
          reference,
          amount: 4900,
          message: 'Demo payment',
          gateway_response: 'Successful',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          channel: 'card',
          currency: 'EUR',
          ip_address: '127.0.0.1',
          metadata: {},
          log: {},
          fees: 0,
          fees_split: {},
          authorization: {},
          customer: {
            id: 1,
            first_name: 'Demo',
            last_name: 'User',
            email: 'demo@insightgov.africa',
            customer_code: 'demo_customer',
          },
          plan: null,
        },
      };
    }

    const response = await fetch(`${this.config.baseUrl}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  }

  /**
   * Créer un plan d'abonnement
   */
  async createPlan(params: {
    name: string;
    amount: number;
    interval: 'daily' | 'weekly' | 'monthly' | 'annually';
    description?: string;
  }): Promise<any> {
    if (!this.isConfigured()) {
      return { status: true, message: 'Mode démo', data: { plan_code: 'demo_plan' } };
    }

    const response = await fetch(`${this.config.baseUrl}/plan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    return response.json();
  }

  /**
   * Créer un abonnement
   */
  async createSubscription(params: {
    email: string;
    plan: string;
    reference?: string;
  }): Promise<any> {
    if (!this.isConfigured()) {
      return { status: true, message: 'Mode démo', data: { subscription_code: 'demo_sub' } };
    }

    const response = await fetch(`${this.config.baseUrl}/subscription`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    return response.json();
  }

  /**
   * Annuler un abonnement
   */
  async cancelSubscription(subscriptionCode: string): Promise<any> {
    if (!this.isConfigured()) {
      return { status: true, message: 'Mode démo' };
    }

    const response = await fetch(`${this.config.baseUrl}/subscription/${subscriptionCode}/disable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.json();
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
  paystackReference: string;
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED';
  amount: number;
  currency: string;
  interval?: string;
}): Promise<void> {
  await db.subscription.upsert({
    where: {
      paystackReference: params.paystackReference,
    },
    create: {
      organizationId: params.organizationId,
      paystackReference: params.paystackReference,
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

// Export singleton
export const paystackService = new PaystackService();
