/**
 * InsightGov Africa - API Keys API
 * ==================================
 * API pour la gestion des clés API
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiPermission,
} from '@/lib/api/api-service';
import { db } from '@/lib/db';

// ============================================
// GET /api/api-keys?organizationId=xxx
// Liste les clés API d'une organisation
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification (admin requis pour voir les clés API)
  const authResult = await requireAuth(request, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'organizationId requis' },
      { status: 400 }
    );
  }

  // Validation UUID
  const uuidError = validateUUID(organizationId);
  if (uuidError) return uuidError;

  // Vérifier que l'utilisateur appartient à cette organisation
  if (auth.role !== 'owner') {
    if (auth.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé.' },
        { status: 403 }
      );
    }
  }

  try {
    const keys = await listApiKeys(organizationId);
    return NextResponse.json({ success: true, keys });
  } catch (error) {
    console.error('Erreur récupération clés API:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des clés API' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/api-keys
// Crée une nouvelle clé API
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (admin requis pour créer des clés API)
  const authResult = await requireAuth(request, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { organizationId, name, permissions, createdBy, rateLimit, expiresAt } = body;

    if (!organizationId || !name) {
      return NextResponse.json(
        { success: false, error: 'organizationId et name requis' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(organizationId);
    if (uuidError) return uuidError;

    // Vérifier que l'utilisateur appartient à cette organisation
    if (auth.role !== 'owner') {
      if (auth.organizationId !== organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
    }

    // Valider les permissions
    const validPermissions: ApiPermission[] = ['read', 'write', 'admin'];
    const requestedPermissions = (permissions || ['read']) as ApiPermission[];
    
    for (const perm of requestedPermissions) {
      if (!validPermissions.includes(perm)) {
        return NextResponse.json(
          { success: false, error: `Permission invalide: ${perm}. Permissions valides: read, write, admin` },
          { status: 400 }
        );
      }
    }

    // Vérifier que le plan permet l'accès API
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: { subscriptionTier: true },
    });

    const plan = org?.subscriptionTier || 'free';
    if (plan === 'free' || plan === 'starter') {
      return NextResponse.json(
        { success: false, error: 'Accès API non disponible sur votre plan. Passez au plan Professional ou Enterprise.' },
        { status: 403 }
      );
    }

    const result = await createApiKey(
      organizationId,
      name,
      requestedPermissions,
      auth.userId, // Toujours utiliser l'utilisateur authentifié
      {
        rateLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      }
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId,
        action: 'settings_change',
        entityType: 'api_key',
        entityId: result.apiKey?.id,
        metadata: JSON.stringify({ name, permissions: requestedPermissions }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

    return NextResponse.json({
      success: true,
      apiKey: result.apiKey,
      rawKey: result.rawKey, // Important: uniquement retourné à la création
      warning: 'Copiez cette clé maintenant, elle ne sera plus affichée',
    });
  } catch (error) {
    console.error('Erreur création clé API:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de la clé API' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/api-keys?keyId=xxx&organizationId=xxx
// Révoque une clé API
// ============================================

export async function DELETE(request: NextRequest) {
  // Vérification d'authentification (admin requis pour révoquer des clés API)
  const authResult = await requireAuth(request, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get('keyId');
  const organizationId = searchParams.get('organizationId');

  if (!keyId || !organizationId) {
    return NextResponse.json(
      { success: false, error: 'keyId et organizationId requis' },
      { status: 400 }
    );
  }

  // Validation UUID
  const keyUuidError = validateUUID(keyId);
  if (keyUuidError) return keyUuidError;

  const orgUuidError = validateUUID(organizationId);
  if (orgUuidError) return orgUuidError;

  // Vérifier que l'utilisateur appartient à cette organisation
  if (auth.role !== 'owner') {
    if (auth.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé.' },
        { status: 403 }
      );
    }
  }

  try {
    // Vérifier que la clé appartient bien à l'organisation
    const apiKey = await db.apiKey.findUnique({
      where: { id: keyId },
      select: { organizationId: true, name: true },
    });

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Clé API non trouvée.' },
        { status: 404 }
      );
    }

    if (apiKey.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Cette clé API n\'appartient pas à votre organisation.' },
        { status: 403 }
      );
    }

    const result = await revokeApiKey(keyId, organizationId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId,
        action: 'settings_change',
        entityType: 'api_key',
        entityId: keyId,
        metadata: JSON.stringify({ action: 'revoke', name: apiKey.name }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur révocation clé API:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la révocation de la clé API' },
      { status: 500 }
    );
  }
}
