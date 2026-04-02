/**
 * InsightGov Africa - Webhooks API
 * ==================================
 * API pour la gestion des webhooks
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import {
  createWebhook,
  listWebhooks,
  deleteWebhook,
  getWebhookDeliveries,
  triggerWebhook,
} from '@/lib/api/api-service';
import { db } from '@/lib/db';

// ============================================
// GET /api/webhooks
// Liste les webhooks ou récupère l'historique
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification (admin pour voir les webhooks)
  const authResult = await requireAuth(request, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const webhookId = searchParams.get('webhookId');
  const deliveries = searchParams.get('deliveries');

  // Récupérer l'historique des livraisons
  if (deliveries && webhookId) {
    // Validation UUID
    const uuidError = validateUUID(webhookId);
    if (uuidError) return uuidError;

    // Vérifier que le webhook appartient à l'organisation
    const webhook = await db.webhook.findUnique({
      where: { id: webhookId },
      select: { organizationId: true },
    });

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook non trouvé.' },
        { status: 404 }
      );
    }

    if (auth.role !== 'owner' && webhook.organizationId !== auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé.' },
        { status: 403 }
      );
    }

    try {
      const deliveryHistory = await getWebhookDeliveries(webhookId, 50);
      return NextResponse.json({ success: true, deliveries: deliveryHistory });
    } catch (error) {
      console.error('Erreur récupération livraisons:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des livraisons' },
        { status: 500 }
      );
    }
  }

  // Lister les webhooks de l'organisation
  if (!auth.organizationId) {
    return NextResponse.json({
      success: true,
      webhooks: [],
    });
  }

  try {
    const webhooks = await listWebhooks(auth.organizationId);
    return NextResponse.json({ success: true, webhooks });
  } catch (error) {
    console.error('Erreur récupération webhooks:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des webhooks' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/webhooks
// Crée un nouveau webhook ou déclenche un webhook
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (admin pour gérer les webhooks)
  const authResult = await requireAuth(request, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { action, name, url, events, secret, webhookId, event, data } = body;

    // Vérifier l'organisation
    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Aucune organisation associée.' },
        { status: 400 }
      );
    }

    // Déclencher un webhook existant
    if (action === 'trigger' && webhookId) {
      if (!event || !data) {
        return NextResponse.json(
          { success: false, error: 'event et data requis pour trigger' },
          { status: 400 }
        );
      }

      // Validation UUID
      const uuidError = validateUUID(webhookId);
      if (uuidError) return uuidError;

      // Vérifier que le webhook appartient à l'organisation
      const webhook = await db.webhook.findUnique({
        where: { id: webhookId },
        select: { organizationId: true },
      });

      if (!webhook || webhook.organizationId !== auth.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Webhook non trouvé ou accès refusé.' },
          { status: 404 }
        );
      }

      const result = await triggerWebhook(webhookId, event, data, auth.organizationId);
      return NextResponse.json(result);
    }

    // Créer un nouveau webhook
    if (!name || !url || !events) {
      return NextResponse.json(
        { success: false, error: 'name, url et events requis' },
        { status: 400 }
      );
    }

    // Valider l'URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'URL invalide' },
        { status: 400 }
      );
    }

    const result = await createWebhook(
      auth.organizationId,
      name,
      url,
      events,
      auth.userId, // Toujours utiliser l'utilisateur authentifié
      { secret }
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'settings_change',
        entityType: 'webhook',
        entityId: result.webhook?.id,
        metadata: JSON.stringify({ name, events }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

    return NextResponse.json({
      success: true,
      webhook: result.webhook,
    });
  } catch (error) {
    console.error('Erreur gestion webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la gestion du webhook' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/webhooks
// Supprime un webhook
// ============================================

export async function DELETE(request: NextRequest) {
  // Vérification d'authentification (admin pour supprimer)
  const authResult = await requireAuth(request, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const webhookId = searchParams.get('id');

  if (!webhookId) {
    return NextResponse.json(
      { success: false, error: 'ID webhook requis' },
      { status: 400 }
    );
  }

  // Validation UUID
  const uuidError = validateUUID(webhookId);
  if (uuidError) return uuidError;

  if (!auth.organizationId) {
    return NextResponse.json(
      { success: false, error: 'Aucune organisation associée.' },
      { status: 400 }
    );
  }

  // Vérifier que le webhook appartient à l'organisation
  const webhook = await db.webhook.findUnique({
    where: { id: webhookId },
    select: { organizationId: true, name: true },
  });

  if (!webhook) {
    return NextResponse.json(
      { success: false, error: 'Webhook non trouvé.' },
      { status: 404 }
    );
  }

  if (webhook.organizationId !== auth.organizationId) {
    return NextResponse.json(
      { success: false, error: 'Accès refusé.' },
      { status: 403 }
    );
  }

  try {
    const result = await deleteWebhook(webhookId, auth.organizationId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'delete',
        entityType: 'webhook',
        entityId: webhookId,
        metadata: JSON.stringify({ name: webhook.name }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du webhook' },
      { status: 500 }
    );
  }
}
