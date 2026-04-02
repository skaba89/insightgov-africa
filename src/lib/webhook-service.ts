// =============================================================================
// InsightGov Africa - Advanced Webhook Service
// =============================================================================
// Service de webhooks avec signature HMAC, retry automatique et historique
// Support pour multiples événements système
// =============================================================================

import { db } from '@/lib/db';
import { AuditLogger } from '@/lib/audit-logger';
import { createHmac, timingSafeEqual } from 'crypto';
import { nanoid } from 'nanoid';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type WebhookEvent =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.kyc_verified'
  | 'user.kyc_rejected'
  | 'transaction.created'
  | 'transaction.completed'
  | 'transaction.failed'
  | 'payment.received'
  | 'payment.failed'
  | 'dataset.created'
  | 'dataset.processed'
  | 'dataset.deleted'
  | 'kpi.generated'
  | 'dashboard.created'
  | 'dashboard.shared'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.expired'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'backup.completed'
  | 'backup.failed'
  | 'alert.triggered';

export type WebhookStatus = 'active' | 'disabled' | 'failed';

export interface WebhookConfig {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  status: WebhookStatus;
  lastTriggeredAt?: Date;
  failureCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
  organizationId: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookDeliveryResult {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  success: boolean;
  responseCode?: number;
  responseBody?: string;
  duration?: number;
  error?: string;
  retryCount: number;
  createdAt: Date;
}

export interface CreateWebhookInput {
  organizationId: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  createdBy: string;
}

export interface TriggerWebhookInput {
  event: WebhookEvent;
  data: Record<string, unknown>;
  organizationId: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookRetryConfig {
  maxRetries: number;
  retryDelays: number[]; // in milliseconds
  backoffMultiplier: number;
}

// =============================================================================
// WEBHOOK CONFIGURATION
// =============================================================================

const DEFAULT_RETRY_CONFIG: WebhookRetryConfig = {
  maxRetries: 5,
  retryDelays: [1000, 5000, 15000, 60000, 300000], // 1s, 5s, 15s, 1m, 5m
  backoffMultiplier: 1.5,
};

const WEBHOOK_TIMEOUT = 30000; // 30 seconds
const MAX_FAILURES_BEFORE_DISABLE = 10;
const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB

// Valid webhook events with descriptions
export const WEBHOOK_EVENTS: Record<WebhookEvent, { description: string; category: string }> = {
  'user.created': { description: 'Nouvel utilisateur créé', category: 'user' },
  'user.updated': { description: 'Utilisateur mis à jour', category: 'user' },
  'user.deleted': { description: 'Utilisateur supprimé', category: 'user' },
  'user.kyc_verified': { description: 'KYC vérifié', category: 'user' },
  'user.kyc_rejected': { description: 'KYC rejeté', category: 'user' },
  'transaction.created': { description: 'Transaction créée', category: 'transaction' },
  'transaction.completed': { description: 'Transaction complétée', category: 'transaction' },
  'transaction.failed': { description: 'Transaction échouée', category: 'transaction' },
  'payment.received': { description: 'Paiement reçu', category: 'payment' },
  'payment.failed': { description: 'Paiement échoué', category: 'payment' },
  'dataset.created': { description: 'Dataset créé', category: 'data' },
  'dataset.processed': { description: 'Dataset traité', category: 'data' },
  'dataset.deleted': { description: 'Dataset supprimé', category: 'data' },
  'kpi.generated': { description: 'KPI généré', category: 'analytics' },
  'dashboard.created': { description: 'Dashboard créé', category: 'analytics' },
  'dashboard.shared': { description: 'Dashboard partagé', category: 'analytics' },
  'subscription.created': { description: 'Abonnement créé', category: 'subscription' },
  'subscription.updated': { description: 'Abonnement mis à jour', category: 'subscription' },
  'subscription.cancelled': { description: 'Abonnement annulé', category: 'subscription' },
  'subscription.expired': { description: 'Abonnement expiré', category: 'subscription' },
  'invoice.created': { description: 'Facture créée', category: 'billing' },
  'invoice.paid': { description: 'Facture payée', category: 'billing' },
  'invoice.overdue': { description: 'Facture en retard', category: 'billing' },
  'backup.completed': { description: 'Sauvegarde terminée', category: 'system' },
  'backup.failed': { description: 'Sauvegarde échouée', category: 'system' },
  'alert.triggered': { description: 'Alerte déclenchée', category: 'system' },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a secure webhook secret
 */
function generateWebhookSecret(): string {
  return `whsec_${nanoid(32)}`;
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify HMAC signature safely (timing-safe comparison)
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = generateSignature(payload, secret);
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(signature, 'hex');
    
    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

/**
 * Validate webhook URL
 */
function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow HTTPS in production
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return false;
    }
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize payload for logging (remove sensitive data)
 */
function sanitizePayload(payload: WebhookPayload): Record<string, unknown> {
  const sanitized = { ...payload };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'pin', 'otp'];
  
  const sanitizeObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
        result[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
    return result;
  };
  
  return sanitizeObject(sanitized as unknown as Record<string, unknown>);
}

// =============================================================================
// WEBHOOK SERVICE CLASS
// =============================================================================

class WebhookServiceClass {
  private retryQueue: Map<string, { webhookId: string; payload: WebhookPayload; retryCount: number; nextRetry: Date }[]> = new Map();

  /**
   * Create a new webhook
   */
  async createWebhook(input: CreateWebhookInput): Promise<{ success: boolean; webhook?: WebhookConfig; error?: string }> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      // Validate input
      if (!input.name || input.name.trim().length < 2) {
        return { success: false, error: 'Le nom du webhook doit contenir au moins 2 caractères' };
      }

      if (!isValidWebhookUrl(input.url)) {
        return { success: false, error: 'URL de webhook invalide (HTTPS requis en production)' };
      }

      if (!input.events || input.events.length === 0) {
        return { success: false, error: 'Au moins un événement doit être sélectionné' };
      }

      // Validate events
      const invalidEvents = input.events.filter(e => !WEBHOOK_EVENTS[e]);
      if (invalidEvents.length > 0) {
        return { success: false, error: `Événements invalides: ${invalidEvents.join(', ')}` };
      }

      // Generate secret if not provided
      const secret = input.secret || generateWebhookSecret();

      // Create webhook in database
      const webhook = await db.webhook.create({
        data: {
          organizationId: input.organizationId,
          name: input.name.trim(),
          url: input.url.trim(),
          secret,
          events: JSON.stringify(input.events),
          isActive: true,
          failureCount: 0,
          createdBy: input.createdBy,
        },
      });

      // Log audit
      await AuditLogger.log({
        action: 'WEBHOOK_CREATED',
        userId: input.createdBy,
        organizationId: input.organizationId,
        entityType: 'WEBHOOK',
        entityId: webhook.id,
        metadata: {
          name: input.name,
          url: input.url,
          events: input.events,
        },
      });

      console.log(`[Webhook] Created: ${webhook.id} for org ${input.organizationId}`);

      return {
        success: true,
        webhook: {
          id: webhook.id,
          organizationId: webhook.organizationId,
          name: webhook.name,
          url: webhook.url,
          secret: webhook.secret,
          events: JSON.parse(webhook.events) as WebhookEvent[],
          isActive: webhook.isActive,
          status: 'active',
          failureCount: webhook.failureCount,
          createdBy: webhook.createdBy,
          createdAt: webhook.createdAt,
          updatedAt: webhook.updatedAt,
        },
      };
    } catch (error) {
      console.error('[Webhook] Create error:', error);
      return { success: false, error: 'Erreur lors de la création du webhook' };
    }
  }

  /**
   * Trigger a webhook for an event
   */
  async triggerWebhook(webhookId: string, input: TriggerWebhookInput): Promise<WebhookDeliveryResult> {
    if (!db) {
      return {
        id: nanoid(),
        webhookId,
        event: input.event,
        success: false,
        error: 'Database not available',
        retryCount: 0,
        createdAt: new Date(),
      };
    }

    const deliveryId = nanoid();
    const startTime = Date.now();

    try {
      // Get webhook
      const webhook = await db.webhook.findUnique({
        where: { id: webhookId },
      });

      if (!webhook) {
        return {
          id: deliveryId,
          webhookId,
          event: input.event,
          success: false,
          error: 'Webhook not found',
          retryCount: 0,
          createdAt: new Date(),
        };
      }

      if (!webhook.isActive) {
        return {
          id: deliveryId,
          webhookId,
          event: input.event,
          success: false,
          error: 'Webhook is disabled',
          retryCount: 0,
          createdAt: new Date(),
        };
      }

      // Check if event is subscribed
      const subscribedEvents = JSON.parse(webhook.events) as WebhookEvent[];
      if (!subscribedEvents.includes(input.event)) {
        return {
          id: deliveryId,
          webhookId,
          event: input.event,
          success: false,
          error: 'Event not subscribed',
          retryCount: 0,
          createdAt: new Date(),
        };
      }

      // Build payload
      const payload: WebhookPayload = {
        id: nanoid(),
        event: input.event,
        timestamp: new Date().toISOString(),
        data: input.data,
        organizationId: input.organizationId,
        metadata: input.metadata,
      };

      const payloadString = JSON.stringify(payload);

      // Check payload size
      if (payloadString.length > MAX_PAYLOAD_SIZE) {
        return {
          id: deliveryId,
          webhookId,
          event: input.event,
          success: false,
          error: 'Payload too large',
          retryCount: 0,
          createdAt: new Date(),
        };
      }

      // Generate signature
      const signature = generateSignature(payloadString, webhook.secret);

      // Send webhook
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

      let responseCode: number | undefined;
      let responseBody: string | undefined;
      let error: string | undefined;

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Id': webhook.id,
            'X-Webhook-Event': input.event,
            'X-Webhook-Signature': `sha256=${signature}`,
            'X-Webhook-Timestamp': payload.timestamp,
            'User-Agent': 'InsightGov-Webhook/1.0',
          },
          body: payloadString,
          signal: controller.signal,
        });

        responseCode = response.status;
        responseBody = await response.text().catch(() => undefined);

        clearTimeout(timeoutId);

        if (!response.ok) {
          error = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        error = fetchError instanceof Error ? fetchError.message : 'Network error';
      }

      const duration = Date.now() - startTime;
      const success = responseCode !== undefined && responseCode >= 200 && responseCode < 300;

      // Update webhook status
      if (success) {
        await db.webhook.update({
          where: { id: webhookId },
          data: {
            lastTriggeredAt: new Date(),
            failureCount: 0,
          },
        });
      } else {
        const newFailureCount = webhook.failureCount + 1;
        const isActive = newFailureCount < MAX_FAILURES_BEFORE_DISABLE;

        await db.webhook.update({
          where: { id: webhookId },
          data: {
            failureCount: newFailureCount,
            isActive,
          },
        });
      }

      // Log delivery
      await db.webhookDelivery.create({
        data: {
          webhookId,
          event: input.event,
          payload: payloadString,
          responseCode,
          responseBody: responseBody?.substring(0, 1000), // Truncate for storage
          success,
          duration,
          error,
        },
      });

      // Log audit
      await AuditLogger.log({
        action: success ? 'WEBHOOK_DELIVERED' : 'WEBHOOK_FAILED',
        organizationId: input.organizationId,
        entityType: 'WEBHOOK',
        entityId: webhookId,
        metadata: {
          event: input.event,
          responseCode,
          duration,
          success,
        },
      });

      console.log(`[Webhook] Delivered: ${webhookId} -> ${input.event} (${responseCode}, ${duration}ms)`);

      return {
        id: deliveryId,
        webhookId,
        event: input.event,
        success,
        responseCode,
        responseBody,
        duration,
        error,
        retryCount: 0,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('[Webhook] Trigger error:', error);
      return {
        id: deliveryId,
        webhookId,
        event: input.event,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: 0,
        createdAt: new Date(),
      };
    }
  }

  /**
   * Trigger webhooks for all subscribed webhooks in an organization
   */
  async trigger(input: TriggerWebhookInput): Promise<WebhookDeliveryResult[]> {
    if (!db) {
      return [];
    }

    try {
      // Get all active webhooks for organization
      const webhooks = await db.webhook.findMany({
        where: {
          organizationId: input.organizationId,
          isActive: true,
        },
      });

      const results: WebhookDeliveryResult[] = [];

      for (const webhook of webhooks) {
        const events = JSON.parse(webhook.events) as WebhookEvent[];
        if (events.includes(input.event)) {
          const result = await this.triggerWebhook(webhook.id, input);
          results.push(result);
        }
      }

      return results;
    } catch (error) {
      console.error('[Webhook] Trigger all error:', error);
      return [];
    }
  }

  /**
   * Retry failed webhooks
   */
  async retryFailedWebhooks(options?: { maxAge?: number }): Promise<{ retried: number; succeeded: number; failed: number }> {
    if (!db) {
      return { retried: 0, succeeded: 0, failed: 0 };
    }

    const maxAge = options?.maxAge || 24 * 60 * 60 * 1000; // 24 hours default
    const cutoff = new Date(Date.now() - maxAge);

    try {
      // Get failed deliveries
      const failedDeliveries = await db.webhookDelivery.findMany({
        where: {
          success: false,
          createdAt: { gte: cutoff },
        },
        include: { webhook: true },
        orderBy: { createdAt: 'desc' },
      });

      let retried = 0;
      let succeeded = 0;
      let failed = 0;

      for (const delivery of failedDeliveries) {
        if (!delivery.webhook.isActive) continue;

        // Parse payload
        const payload = JSON.parse(delivery.payload) as WebhookPayload;

        // Retry
        const result = await this.triggerWebhook(delivery.webhookId, {
          event: delivery.event as WebhookEvent,
          data: payload.data,
          organizationId: payload.organizationId,
        });

        retried++;
        if (result.success) {
          succeeded++;
        } else {
          failed++;
        }
      }

      console.log(`[Webhook] Retry batch: ${retried} retried, ${succeeded} succeeded, ${failed} failed`);

      return { retried, succeeded, failed };
    } catch (error) {
      console.error('[Webhook] Retry failed error:', error);
      return { retried: 0, succeeded: 0, failed: 0 };
    }
  }

  /**
   * Get webhook delivery history
   */
  async getWebhookDeliveries(
    webhookId: string,
    options?: {
      limit?: number;
      offset?: number;
      event?: WebhookEvent;
      success?: boolean;
    }
  ): Promise<{ deliveries: WebhookDeliveryResult[]; total: number }> {
    if (!db) {
      return { deliveries: [], total: 0 };
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    try {
      const where: Record<string, unknown> = { webhookId };
      if (options?.event) where.event = options.event;
      if (options?.success !== undefined) where.success = options.success;

      const [deliveries, total] = await Promise.all([
        db.webhookDelivery.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.webhookDelivery.count({ where }),
      ]);

      return {
        deliveries: deliveries.map(d => ({
          id: d.id,
          webhookId: d.webhookId,
          event: d.event as WebhookEvent,
          success: d.success,
          responseCode: d.responseCode ?? undefined,
          responseBody: d.responseBody ?? undefined,
          duration: d.duration ?? undefined,
          error: d.error ?? undefined,
          retryCount: 0,
          createdAt: d.createdAt,
        })),
        total,
      };
    } catch (error) {
      console.error('[Webhook] Get deliveries error:', error);
      return { deliveries: [], total: 0 };
    }
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    webhookId: string,
    data: Partial<Pick<WebhookConfig, 'name' | 'url' | 'events' | 'isActive'>>
  ): Promise<{ success: boolean; webhook?: WebhookConfig; error?: string }> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const webhook = await db.webhook.findUnique({
        where: { id: webhookId },
      });

      if (!webhook) {
        return { success: false, error: 'Webhook non trouvé' };
      }

      // Validate updates
      if (data.url && !isValidWebhookUrl(data.url)) {
        return { success: false, error: 'URL de webhook invalide' };
      }

      if (data.events) {
        const invalidEvents = data.events.filter(e => !WEBHOOK_EVENTS[e]);
        if (invalidEvents.length > 0) {
          return { success: false, error: `Événements invalides: ${invalidEvents.join(', ')}` };
        }
      }

      // Update webhook
      const updated = await db.webhook.update({
        where: { id: webhookId },
        data: {
          name: data.name,
          url: data.url,
          events: data.events ? JSON.stringify(data.events) : undefined,
          isActive: data.isActive,
        },
      });

      return {
        success: true,
        webhook: {
          id: updated.id,
          organizationId: updated.organizationId,
          name: updated.name,
          url: updated.url,
          secret: updated.secret,
          events: JSON.parse(updated.events) as WebhookEvent[],
          isActive: updated.isActive,
          status: updated.isActive ? 'active' : 'disabled',
          failureCount: updated.failureCount,
          createdBy: updated.createdBy,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      };
    } catch (error) {
      console.error('[Webhook] Update error:', error);
      return { success: false, error: 'Erreur lors de la mise à jour' };
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const webhook = await db.webhook.findUnique({
        where: { id: webhookId },
      });

      if (!webhook) {
        return { success: false, error: 'Webhook non trouvé' };
      }

      // Delete deliveries first
      await db.webhookDelivery.deleteMany({
        where: { webhookId },
      });

      // Delete webhook
      await db.webhook.delete({
        where: { id: webhookId },
      });

      // Log audit
      await AuditLogger.log({
        action: 'WEBHOOK_DELETED',
        userId,
        organizationId: webhook.organizationId,
        entityType: 'WEBHOOK',
        entityId: webhookId,
        metadata: {
          name: webhook.name,
          url: webhook.url,
        },
      });

      console.log(`[Webhook] Deleted: ${webhookId}`);

      return { success: true };
    } catch (error) {
      console.error('[Webhook] Delete error:', error);
      return { success: false, error: 'Erreur lors de la suppression' };
    }
  }

  /**
   * Get webhooks for an organization
   */
  async getOrganizationWebhooks(organizationId: string): Promise<WebhookConfig[]> {
    if (!db) {
      return [];
    }

    try {
      const webhooks = await db.webhook.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      });

      return webhooks.map(w => ({
        id: w.id,
        organizationId: w.organizationId,
        name: w.name,
        url: w.url,
        secret: w.secret,
        events: JSON.parse(w.events) as WebhookEvent[],
        isActive: w.isActive,
        status: w.isActive ? 'active' : 'disabled',
        lastTriggeredAt: w.lastTriggeredAt ?? undefined,
        failureCount: w.failureCount,
        createdBy: w.createdBy,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      }));
    } catch (error) {
      console.error('[Webhook] Get organization webhooks error:', error);
      return [];
    }
  }

  /**
   * Verify incoming webhook signature (for external webhooks)
   */
  verifyIncomingSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    return verifySignature(payload, signature, secret);
  }

  /**
   * Get available webhook events
   */
  getAvailableEvents(): Record<WebhookEvent, { description: string; category: string }> {
    return WEBHOOK_EVENTS;
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateSecret(webhookId: string, userId: string): Promise<{ success: boolean; secret?: string; error?: string }> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const newSecret = generateWebhookSecret();

      await db.webhook.update({
        where: { id: webhookId },
        data: { secret: newSecret },
      });

      // Log audit
      await AuditLogger.log({
        action: 'WEBHOOK_SECRET_REGENERATED',
        userId,
        entityType: 'WEBHOOK',
        entityId: webhookId,
      });

      console.log(`[Webhook] Secret regenerated: ${webhookId}`);

      return { success: true, secret: newSecret };
    } catch (error) {
      console.error('[Webhook] Regenerate secret error:', error);
      return { success: false, error: 'Erreur lors de la régénération du secret' };
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookServiceClass();

// Export class for testing
export { WebhookServiceClass };

// Default export
export default webhookService;
