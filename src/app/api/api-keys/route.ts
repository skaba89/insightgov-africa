/**
 * InsightGov Africa - API Keys API
 * ==================================
 * API pour la gestion des clés API
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiPermission,
} from '@/lib/api/api-service';

/**
 * GET /api/api-keys?organizationId=xxx
 * Liste les clés API d'une organisation
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json(
      { error: 'organizationId requis' },
      { status: 400 }
    );
  }

  try {
    const keys = await listApiKeys(organizationId);
    return NextResponse.json({ success: true, keys });
  } catch (error) {
    console.error('Erreur récupération clés API:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des clés API' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/api-keys
 * Crée une nouvelle clé API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, name, permissions, createdBy, rateLimit, expiresAt } = body;

    if (!organizationId || !name || !createdBy) {
      return NextResponse.json(
        { error: 'organizationId, name et createdBy requis' },
        { status: 400 }
      );
    }

    const result = await createApiKey(
      organizationId,
      name,
      (permissions || ['read']) as ApiPermission[],
      createdBy,
      {
        rateLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      apiKey: result.apiKey,
      rawKey: result.rawKey, // Important: uniquement retourné à la création
      warning: 'Copiez cette clé maintenant, elle ne sera plus affichée',
    });
  } catch (error) {
    console.error('Erreur création clé API:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la clé API' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/api-keys?keyId=xxx&organizationId=xxx
 * Révoque une clé API
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get('keyId');
  const organizationId = searchParams.get('organizationId');

  if (!keyId || !organizationId) {
    return NextResponse.json(
      { error: 'keyId et organizationId requis' },
      { status: 400 }
    );
  }

  try {
    const result = await revokeApiKey(keyId, organizationId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur révocation clé API:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la révocation de la clé API' },
      { status: 500 }
    );
  }
}
