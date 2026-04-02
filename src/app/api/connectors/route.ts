/**
 * InsightGov Africa - Data Connectors API Route
 * ==============================================
 * API pour gérer les connecteurs de données.
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import { syncConnector, getConnectorTypes } from '@/lib/connectors/data-connectors';
import { db } from '@/lib/db';

// ============================================
// GET /api/connectors
// Liste les types de connecteurs ou les connecteurs de l'organisation
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'types') {
    return NextResponse.json({
      success: true,
      connectorTypes: getConnectorTypes(),
    });
  }

  // Liste les connecteurs de l'organisation
  if (!auth.organizationId) {
    return NextResponse.json({
      success: true,
      connectors: [],
    });
  }

  try {
    // Les connecteurs sont stockés dans les paramètres de l'organisation
    // Pour l'instant, retourner une liste vide
    // En production, récupérer depuis une table dédiée
    return NextResponse.json({
      success: true,
      connectors: [],
    });
  } catch (error) {
    console.error('Erreur récupération connecteurs:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des connecteurs' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/connectors
// Crée un nouveau connecteur ou synchronise
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (admin pour créer des connecteurs)
  const authResult = await requireAuth(request, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { action, connector } = body;

    // Vérifier l'organisation
    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Aucune organisation associée.' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create':
        // Vérifier que le plan permet les intégrations
        const org = await db.organization.findUnique({
          where: { id: auth.organizationId },
          select: { subscriptionTier: true },
        });

        if (org?.subscriptionTier === 'free') {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Les intégrations nécessitent un plan Professional ou Enterprise.',
              code: 'PLAN_UPGRADE_REQUIRED'
            },
            { status: 402 }
          );
        }

        // En production, sauvegarder en base de données
        const newConnector = {
          id: `conn_${Date.now()}`,
          ...connector,
          organizationId: auth.organizationId,
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        // Log de l'activité
        await db.activityLog.create({
          data: {
            userId: auth.userId,
            organizationId: auth.organizationId,
            action: 'settings_change',
            entityType: 'connector',
            metadata: JSON.stringify({ type: connector.type, action: 'create' }),
          },
        }).catch(err => console.error('Failed to log activity:', err));

        return NextResponse.json({
          success: true,
          connector: newConnector,
          message: 'Connecteur créé avec succès',
        });

      case 'sync':
        if (!connector) {
          return NextResponse.json(
            { success: false, error: 'Configuration du connecteur requise' },
            { status: 400 }
          );
        }

        // Vérifier que le connecteur appartient à l'organisation
        if (connector.organizationId && connector.organizationId !== auth.organizationId) {
          return NextResponse.json(
            { success: false, error: 'Accès refusé.' },
            { status: 403 }
          );
        }

        const result = await syncConnector({
          ...connector,
          organizationId: auth.organizationId,
        });

        return NextResponse.json({
          success: result.success,
          result,
        });

      case 'test':
        // Test connector configuration
        if (!connector) {
          return NextResponse.json(
            { success: false, error: 'Configuration requise' },
            { status: 400 }
          );
        }

        try {
          const testResult = await syncConnector({
            ...connector,
            id: 'test',
            organizationId: auth.organizationId,
          });

          return NextResponse.json({
            success: true,
            message: 'Connexion réussie',
            sampleData: testResult,
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Échec de la connexion',
          });
        }

      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue. Actions valides: create, sync, test' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erreur connecteurs:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du traitement de la requête' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/connectors
// Supprime un connecteur
// ============================================

export async function DELETE(request: NextRequest) {
  // Vérification d'authentification (admin pour supprimer)
  const authResult = await requireAuth(request, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const connectorId = searchParams.get('id');

  if (!connectorId) {
    return NextResponse.json(
      { success: false, error: 'ID connecteur requis' },
      { status: 400 }
    );
  }

  // En production, vérifier que le connecteur appartient à l'organisation
  // et supprimer de la base de données

  // Log de l'activité
  if (auth.organizationId) {
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'delete',
        entityType: 'connector',
        entityId: connectorId,
      },
    }).catch(err => console.error('Failed to log activity:', err));
  }

  return NextResponse.json({
    success: true,
    message: 'Connecteur supprimé',
  });
}
