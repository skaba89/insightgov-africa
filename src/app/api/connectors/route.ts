/**
 * InsightGov Africa - Data Connectors API Route
 * ==============================================
 * API pour gérer les connecteurs de données.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncConnector, getConnectorTypes } from '@/lib/connectors/data-connectors';

/**
 * GET /api/connectors
 * Liste les types de connecteurs disponibles
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'types') {
    return NextResponse.json({
      success: true,
      connectorTypes: getConnectorTypes(),
    });
  }

  // List connectors for organization (in production, fetch from DB)
  return NextResponse.json({
    success: true,
    connectors: [],
    message: 'Utilisez POST pour créer un nouveau connecteur',
  });
}

/**
 * POST /api/connectors
 * Crée un nouveau connecteur ou synchronise
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, connector } = body;

    switch (action) {
      case 'create':
        // In production, save to database
        return NextResponse.json({
          success: true,
          connector: {
            id: `conn_${Date.now()}`,
            ...connector,
            status: 'active',
            createdAt: new Date().toISOString(),
          },
          message: 'Connecteur créé avec succès',
        });

      case 'sync':
        if (!connector) {
          return NextResponse.json(
            { success: false, error: 'Connecteur requis' },
            { status: 400 }
          );
        }

        const result = await syncConnector(connector);

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
            organizationId: 'test',
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
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erreur connecteurs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du traitement de la requête',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/connectors
 * Supprime un connecteur
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const connectorId = searchParams.get('id');

  if (!connectorId) {
    return NextResponse.json(
      { success: false, error: 'ID connecteur requis' },
      { status: 400 }
    );
  }

  // In production, delete from database
  return NextResponse.json({
    success: true,
    message: 'Connecteur supprimé',
  });
}
