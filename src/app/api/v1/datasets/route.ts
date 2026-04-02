/**
 * InsightGov Africa - Public API v1 - Datasets
 * ==============================================
 * Endpoint public pour la gestion des datasets via clé API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/api-service';
import { db } from '@/lib/db';

/**
 * Middleware pour valider la clé API
 */
async function authenticateRequest(request: NextRequest): Promise<{
  valid: boolean;
  organizationId?: string;
  permissions?: string[];
  error?: string;
}> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return { valid: false, error: 'Authorization header requis' };
  }

  const [type, key] = authHeader.split(' ');

  if (type !== 'Bearer' || !key) {
    return { valid: false, error: 'Format Authorization invalide. Utilisez: Bearer <api_key>' };
  }

  return validateApiKey(key);
}

/**
 * GET /api/v1/datasets
 * Liste tous les datasets de l'organisation
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const status = searchParams.get('status');

  try {
    const where = {
      organizationId: auth.organizationId,
      ...(status && { status }),
    };

    const [datasets, total] = await Promise.all([
      db.dataset.findMany({
        where,
        select: {
          id: true,
          name: true,
          originalFileName: true,
          fileType: true,
          rowCount: true,
          columnCount: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      db.dataset.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: datasets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Erreur récupération datasets:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des datasets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/datasets
 * Crée un nouveau dataset (metadata seulement, le fichier doit être uploadé séparément)
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!auth.permissions?.includes('write')) {
    return NextResponse.json(
      { error: 'Permission write requise' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, fileUrl, fileType, rowCount, columnCount, columnsMetadata } = body;

    if (!name || !fileUrl || !fileType) {
      return NextResponse.json(
        { error: 'name, fileUrl et fileType requis' },
        { status: 400 }
      );
    }

    const dataset = await db.dataset.create({
      data: {
        organizationId: auth.organizationId!,
        name,
        originalFileName: name,
        fileUrl,
        fileType,
        rowCount: rowCount || 0,
        columnCount: columnCount || 0,
        columnsMetadata: columnsMetadata ? JSON.stringify(columnsMetadata) : '[]',
        status: 'pending',
      },
    });

    // Déclencher les webhooks
    const { triggerWebhooksForEvent } = await import('@/lib/api/api-service');
    await triggerWebhooksForEvent(auth.organizationId!, 'dataset.created', {
      datasetId: dataset.id,
      name: dataset.name,
    });

    return NextResponse.json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    console.error('Erreur création dataset:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du dataset' },
      { status: 500 }
    );
  }
}
