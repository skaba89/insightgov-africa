/**
 * InsightGov Africa - API & Webhook Service
 * ==========================================
 * Services pour la gestion des clés API et webhooks
 */

import { db } from '@/lib/db';
import { randomBytes, createHash, createHmac } from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export type ApiPermission = 'read' | 'write' | 'admin';

export interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: ApiPermission[];
  rateLimit: number;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: Date | null;
  failureCount: number;
  createdAt: Date;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  organizationId: string;
}

// =============================================================================
// API KEYS
// =============================================================================

const API_KEY_PREFIX = 'iga_'; // InsightGov Africa
const API_KEY_LENGTH = 32;

/**
 * Génère une clé API
 */
export function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const rawKey = randomBytes(API_KEY_LENGTH).toString('hex');
  const key = `${API_KEY_PREFIX}${rawKey}`;
  const keyHash = hashApiKey(key);
  const keyPrefix = key.slice(0, 12) + '...'; // iga_xxxxxxxx...

  return { key, keyHash, keyPrefix };
}

/**
 * Hash une clé API
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Crée une nouvelle clé API
 */
export async function createApiKey(
  organizationId: string,
  name: string,
  permissions: ApiPermission[],
  createdBy: string,
  options?: {
    rateLimit?: number;
    expiresAt?: Date;
  }
): Promise<{ success: boolean; apiKey?: ApiKeyData; rawKey?: string; error?: string }> {
  // Vérifier les limites selon le plan d'abonnement
  const existingKeys = await db.apiKey.count({
    where: { organizationId, isActive: true },
  });

  // TODO: Vérifier les limites selon le plan (ex: 5 pour starter, 20 pour pro)
  if (existingKeys >= 20) {
    return { success: false, error: 'Limite de clés API atteinte' };
  }

  const { key, keyHash, keyPrefix } = generateApiKey();

  const apiKey = await db.apiKey.create({
    data: {
      organizationId,
      name,
      keyHash,
      keyPrefix,
      permissions: JSON.stringify(permissions),
      rateLimit: options?.rateLimit || 1000,
      expiresAt: options?.expiresAt,
      createdBy,
    },
  });

  return {
    success: true,
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      permissions: JSON.parse(apiKey.permissions),
      rateLimit: apiKey.rateLimit,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
    },
    rawKey: key, // Seulement retourné à la création
  };
}

/**
 * Valide une clé API
 */
export async function validateApiKey(
  key: string
): Promise<{ valid: boolean; organizationId?: string; permissions?: ApiPermission[]; error?: string }> {
  const keyHash = hashApiKey(key);

  const apiKey = await db.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      organizationId: true,
      permissions: true,
      isActive: true,
      expiresAt: true,
      rateLimit: true,
    },
  });

  if (!apiKey) {
    return { valid: false, error: 'Clé API invalide' };
  }

  if (!apiKey.isActive) {
    return { valid: false, error: 'Clé API désactivée' };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'Clé API expirée' };
  }

  // TODO: Vérifier le rate limiting

  // Mettre à jour lastUsedAt
  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    valid: true,
    organizationId: apiKey.organizationId,
    permissions: JSON.parse(apiKey.permissions),
  };
}

/**
 * Liste les clés API d'une organisation
 */
export async function listApiKeys(organizationId: string): Promise<ApiKeyData[]> {
  const keys = await db.apiKey.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    permissions: JSON.parse(k.permissions),
    rateLimit: k.rateLimit,
    lastUsedAt: k.lastUsedAt,
    expiresAt: k.expiresAt,
    isActive: k.isActive,
    createdAt: k.createdAt,
  }));
}

/**
 * Révoque une clé API
 */
export async function revokeApiKey(
  keyId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = await db.apiKey.findFirst({
    where: { id: keyId, organizationId },
  });

  if (!apiKey) {
    return { success: false, error: 'Clé API non trouvée' };
  }

  await db.apiKey.update({
    where: { id: keyId },
    data: { isActive: false },
  });

  return { success: true };
}

// =============================================================================
// WEBHOOKS
// =============================================================================

const WEBHOOK_EVENTS = [
  'dataset.created',
  'dataset.updated',
  'dataset.deleted',
  'analysis.started',
  'analysis.completed',
  'analysis.failed',
  'report.generated',
  'share.created',
  'comment.created',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/**
 * Crée un webhook
 */
export async function createWebhook(
  organizationId: string,
  name: string,
  url: string,
  events: string[],
  createdBy: string,
  options?: { secret?: string }
): Promise<{ success: boolean; webhook?: WebhookData; error?: string }> {
  // Valider l'URL
  try {
    new URL(url);
  } catch {
    return { success: false, error: 'URL invalide' };
  }

  // Vérifier les limites
  const existingWebhooks = await db.webhook.count({
    where: { organizationId, isActive: true },
  });

  if (existingWebhooks >= 10) {
    return { success: false, error: 'Limite de webhooks atteinte' };
  }

  const webhook = await db.webhook.create({
    data: {
      organizationId,
      name,
      url,
      events: JSON.stringify(events),
      secret: options?.secret || randomBytes(16).toString('hex'),
      createdBy,
    },
  });

  return {
    success: true,
    webhook: {
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      events: JSON.parse(webhook.events),
      isActive: webhook.isActive,
      lastTriggeredAt: webhook.lastTriggeredAt,
      failureCount: webhook.failureCount,
      createdAt: webhook.createdAt,
    },
  };
}

/**
 * Liste les webhooks d'une organisation
 */
export async function listWebhooks(organizationId: string): Promise<WebhookData[]> {
  const webhooks = await db.webhook.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return webhooks.map((w) => ({
    id: w.id,
    name: w.name,
    url: w.url,
    events: JSON.parse(w.events),
    isActive: w.isActive,
    lastTriggeredAt: w.lastTriggeredAt,
    failureCount: w.failureCount,
    createdAt: w.createdAt,
  }));
}

/**
 * Supprime un webhook
 */
export async function deleteWebhook(
  webhookId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const webhook = await db.webhook.findFirst({
    where: { id: webhookId, organizationId },
  });

  if (!webhook) {
    return { success: false, error: 'Webhook non trouvé' };
  }

  await db.webhook.delete({
    where: { id: webhookId },
  });

  return { success: true };
}

/**
 * Déclenche un webhook
 */
export async function triggerWebhook(
  webhookId: string,
  event: string,
  data: Record<string, unknown>,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const webhook = await db.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook || !webhook.isActive) {
    return { success: false, error: 'Webhook non trouvé ou inactif' };
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
    organizationId,
  };

  const payloadString = JSON.stringify(payload);

  // Générer la signature
  const signature = createHmac('sha256', webhook.secret || '')
    .update(payloadString)
    .digest('hex');

  const startTime = Date.now();

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-InsightGov-Signature': signature,
        'X-InsightGov-Event': event,
      },
      body: payloadString,
    });

    const duration = Date.now() - startTime;
    const success = response.ok;

    // Enregistrer la livraison
    await db.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload: payloadString,
        responseCode: response.status,
        success,
        duration,
      },
    });

    // Mettre à jour le webhook
    await db.webhook.update({
      where: { id: webhookId },
      data: {
        lastTriggeredAt: new Date(),
        failureCount: success ? 0 : webhook.failureCount + 1,
      },
    });

    return { success };
  } catch (error) {
    const duration = Date.now() - startTime;

    // Enregistrer l'échec
    await db.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload: payloadString,
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        duration,
      },
    });

    await db.webhook.update({
      where: { id: webhookId },
      data: {
        lastTriggeredAt: new Date(),
        failureCount: webhook.failureCount + 1,
      },
    });

    return { success: false, error: 'Échec de l\'envoi du webhook' };
  }
}

/**
 * Déclenche tous les webhooks pour un événement
 */
export async function triggerWebhooksForEvent(
  organizationId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const webhooks = await db.webhook.findMany({
    where: {
      organizationId,
      isActive: true,
    },
  });

  const relevantWebhooks = webhooks.filter((w) => {
    const events = JSON.parse(w.events) as string[];
    return events.includes(event) || events.includes('*');
  });

  // Envoyer en parallèle
  await Promise.allSettled(
    relevantWebhooks.map((w) => triggerWebhook(w.id, event, data, organizationId))
  );
}

/**
 * Récupère l'historique des livraisons d'un webhook
 */
export async function getWebhookDeliveries(
  webhookId: string,
  limit: number = 50
): Promise<
  {
    id: string;
    event: string;
    success: boolean;
    responseCode: number | null;
    duration: number | null;
    error: string | null;
    createdAt: Date;
  }[]
> {
  const deliveries = await db.webhookDelivery.findMany({
    where: { webhookId },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return deliveries.map((d) => ({
    id: d.id,
    event: d.event,
    success: d.success,
    responseCode: d.responseCode,
    duration: d.duration,
    error: d.error,
    createdAt: d.createdAt,
  }));
}
