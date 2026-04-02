// =============================================================================
// InsightGov Africa - Webhook Management API Route
// =============================================================================
// CRUD operations for webhooks
// GET    /api/webhooks/manage - List webhooks
// POST   /api/webhooks/manage - Create webhook
// PATCH  /api/webhooks/manage - Update webhook
// DELETE /api/webhooks/manage - Delete webhook
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  webhookService, 
  WebhookEvent, 
  CreateWebhookInput 
} from '@/lib/webhook-service';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const createWebhookSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  url: z.string().url('URL invalide'),
  events: z.array(z.string()).min(1, 'Au moins un événement requis'),
  secret: z.string().min(16, 'Le secret doit contenir au moins 16 caractères').optional(),
});

const updateWebhookSchema = z.object({
  webhookId: z.string(),
  name: z.string().min(2).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
});

const deleteWebhookSchema = z.object({
  webhookId: z.string(),
});

const getDeliveriesSchema = z.object({
  webhookId: z.string(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  event: z.string().optional(),
  success: z.coerce.boolean().optional(),
});

const triggerWebhookSchema = z.object({
  event: z.string(),
  data: z.record(z.string(), z.unknown()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// GET - List webhooks or get deliveries
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Get webhook deliveries
    if (action === 'deliveries') {
      const validation = getDeliveriesSchema.safeParse({
        webhookId: searchParams.get('webhookId'),
        limit: searchParams.get('limit'),
        offset: searchParams.get('offset'),
        event: searchParams.get('event'),
        success: searchParams.get('success'),
      });

      if (!validation.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Paramètres invalides',
            details: validation.error.flatten().fieldErrors 
          },
          { status: 400 }
        );
      }

      const result = await webhookService.getWebhookDeliveries(
        validation.data.webhookId,
        {
          limit: validation.data.limit,
          offset: validation.data.offset,
          event: validation.data.event as WebhookEvent,
          success: validation.data.success,
        }
      );

      return NextResponse.json({
        success: true,
        data: result.deliveries,
        total: result.total,
      });
    }

    // Get available events
    if (action === 'events') {
      return NextResponse.json({
        success: true,
        data: webhookService.getAvailableEvents(),
      });
    }

    // List organization webhooks (default)
    const webhooks = await webhookService.getOrganizationWebhooks(
      session.user.organizationId
    );

    return NextResponse.json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    console.error('[API] Webhook GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create webhook or trigger webhook
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;

    // Trigger webhook
    if (action === 'trigger') {
      const validation = triggerWebhookSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Données invalides',
            details: validation.error.flatten().fieldErrors 
          },
          { status: 400 }
        );
      }

      const results = await webhookService.trigger({
        event: validation.data.event as WebhookEvent,
        data: validation.data.data,
        organizationId: session.user.organizationId,
        metadata: validation.data.metadata,
      });

      return NextResponse.json({
        success: true,
        data: results,
        triggered: results.length,
      });
    }

    // Retry failed webhooks
    if (action === 'retry') {
      const result = await webhookService.retryFailedWebhooks();

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // Regenerate secret
    if (action === 'regenerate-secret') {
      if (!body.webhookId) {
        return NextResponse.json(
          { success: false, error: 'webhookId requis' },
          { status: 400 }
        );
      }

      const result = await webhookService.regenerateSecret(
        body.webhookId,
        session.user.id
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        secret: result.secret,
        message: 'Secret régénéré avec succès',
      });
    }

    // Create webhook (default)
    const validation = createWebhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides',
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const result = await webhookService.createWebhook({
      organizationId: session.user.organizationId,
      name: validation.data.name,
      url: validation.data.url,
      events: validation.data.events as WebhookEvent[],
      secret: validation.data.secret,
      createdBy: session.user.id,
    } as CreateWebhookInput);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      webhook: result.webhook,
      message: 'Webhook créé avec succès',
    });
  } catch (error) {
    console.error('[API] Webhook POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update webhook
// =============================================================================

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateWebhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides',
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const result = await webhookService.updateWebhook(
      validation.data.webhookId,
      {
        name: validation.data.name,
        url: validation.data.url,
        events: validation.data.events as WebhookEvent[],
        isActive: validation.data.isActive,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      webhook: result.webhook,
      message: 'Webhook mis à jour avec succès',
    });
  } catch (error) {
    console.error('[API] Webhook PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete webhook
// =============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = deleteWebhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides',
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const result = await webhookService.deleteWebhook(
      validation.data.webhookId,
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook supprimé avec succès',
    });
  } catch (error) {
    console.error('[API] Webhook DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
