/**
 * InsightGov Africa - Webhooks API
 * ==================================
 * API pour la gestion des webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createWebhook,
  listWebhooks,
  deleteWebhook,
  getWebhookDeliveries,
  triggerWebhook,
} from '@/lib/api/api-service';

/**
 * GET /api/webhooks?organizationId=xxx&webhookId=xxx
 * Liste les webhooks ou récupère l'historique d'un webhook
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  const webhookId = searchParams.get('webhookId');
  const deliveries = searchParams.get('deliveries');

  if (deliveries && webhookId) {
    // Récupérer l'historique des livraisons
    try {
      const deliveryHistory = await getWebhookDeliveries(webhookId, 50);
      return NextResponse.json({ success: true, deliveries: deliveryHistory });
    } catch (error) {
      console.error('Erreur récupération livraisons:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des livraisons' },
        { status: 500 }
      );
    }
  }

  if (!organizationId) {
    return NextResponse.json(
      { error: 'organizationId requis' },
      { status: 400 }
    );
  }

  try {
    const webhooks = await listWebhooks(organizationId);
    return NextResponse.json({ success: true, webhooks });
  } catch (error) {
    console.error('Erreur récupération webhooks:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * Crée un nouveau webhook ou déclenche un webhook existant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, organizationId, name, url, events, createdBy, secret, webhookId, event, data } = body;

    // Déclencher un webhook existant
    if (action === 'trigger' && webhookId) {
      if (!event || !data) {
        return NextResponse.json(
          { error: 'event et data requis pour trigger' },
          { status: 400 }
        );
      }

      const result = await triggerWebhook(webhookId, event, data, organizationId);
      return NextResponse.json(result);
    }

    // Créer un nouveau webhook
    if (!organizationId || !name || !url || !events || !createdBy) {
      return NextResponse.json(
        { error: 'organizationId, name, url, events et createdBy requis' },
        { status: 400 }
      );
    }

    const result = await createWebhook(organizationId, name, url, events, createdBy, { secret });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      webhook: result.webhook,
    });
  } catch (error) {
    console.error('Erreur gestion webhook:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la gestion du webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks?webhookId=xxx&organizationId=xxx
 * Supprime un webhook
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const webhookId = searchParams.get('webhookId');
  const organizationId = searchParams.get('organizationId');

  if (!webhookId || !organizationId) {
    return NextResponse.json(
      { error: 'webhookId et organizationId requis' },
      { status: 400 }
    );
  }

  try {
    const result = await deleteWebhook(webhookId, organizationId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression webhook:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du webhook' },
      { status: 500 }
    );
  }
}
