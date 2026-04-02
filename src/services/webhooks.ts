// ============================================
// InsightGov Africa - Webhooks Service
// Intégrations avec systèmes externes
// ============================================

import { db } from '@/lib/db';
import { createHmac } from 'crypto';

// ============================================
// TYPES
// ============================================

export interface WebhookConfig {
  id: string;
  organizationId: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: Date;
}

export type WebhookEvent =
  | 'dataset.created'
  | 'dataset.processed'
  | 'dataset.deleted'
  | 'kpi.generated'
  | 'dashboard.created'
  | 'dashboard.shared'
  | 'subscription.created'
  | 'subscription.cancelled';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  organizationId: string;
}

// ============================================
// SERVICE WEBHOOKS
// ============================================

export class WebhookService {
  /**
   * Envoyer un webhook
   */
  async sendWebhook(
    organizationId: string,
    event: WebhookEvent,
    data: any
  ): Promise<void> {
    // Récupérer les webhooks actifs pour cette organisation
    // Note: En production, on aurait une table Webhook dans Prisma
    console.log(`[Webhook] Event: ${event} for org: ${organizationId}`);

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      organizationId,
    };

    // TODO: Implémenter la récupération des webhooks depuis la DB
    // Pour l'instant, on log juste
    console.log('[Webhook] Payload:', JSON.stringify(payload, null, 2));
  }

  /**
   * Vérifier la signature d'un webhook entrant
   */
  verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Déclencher les webhooks pour un événement
   */
  async trigger(
    organizationId: string,
    event: WebhookEvent,
    data: any
  ): Promise<void> {
    try {
      await this.sendWebhook(organizationId, event, data);
    } catch (error) {
      console.error(`[Webhook] Error triggering ${event}:`, error);
    }
  }
}

// ============================================
// INTÉGRATIONS PRÉDÉFINIES
// ============================================

export const WEBHOOK_INTEGRATIONS = {
  SLACK: {
    name: 'Slack',
    icon: '💬',
    description: 'Recevoir des notifications dans Slack',
    setupUrl: 'https://api.slack.com/apps',
  },
  DISCORD: {
    name: 'Discord',
    icon: '🎮',
    description: 'Notifications via Discord Webhook',
    setupUrl: 'https://discord.com/developers/applications',
  },
  ZAPIER: {
    name: 'Zapier',
    icon: '⚡',
    description: 'Connecter à 5000+ applications',
    setupUrl: 'https://zapier.com/apps',
  },
  MAKE: {
    name: 'Make (Integromat)',
    icon: '🔧',
    description: 'Automatisations avancées',
    setupUrl: 'https://www.make.com',
  },
  CUSTOM: {
    name: 'Custom',
    icon: '🔗',
    description: 'Votre endpoint personnalisé',
    setupUrl: null,
  },
};

// Export singleton
export const webhookService = new WebhookService();
