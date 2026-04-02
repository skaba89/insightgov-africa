// ============================================
// InsightGov Africa - API Historique
// SÉCURISÉ avec authentification et vérification d'appartenance
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import { historyService } from '@/services/history';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');

    if (datasetId) {
      // Validation UUID
      const uuidError = validateUUID(datasetId);
      if (uuidError) return uuidError;

      // Vérifier que le dataset appartient à l'organisation
      const dataset = await db.dataset.findUnique({
        where: { id: datasetId },
        select: { organizationId: true },
      });

      if (!dataset) {
        return NextResponse.json(
          { success: false, error: 'Dataset non trouvé.' },
          { status: 404 }
        );
      }

      if (auth.role !== 'owner' && auth.role !== 'admin') {
        if (dataset.organizationId !== auth.organizationId) {
          return NextResponse.json(
            { success: false, error: 'Accès refusé.' },
            { status: 403 }
          );
        }
      }

      const history = await historyService.getDatasetHistory(datasetId);
      return NextResponse.json({ success: true, data: history });
    }

    // Historique de l'organisation
    if (!auth.organizationId) {
      return NextResponse.json({
        success: true,
        data: { history: [], stats: null },
      });
    }

    const [history, stats] = await Promise.all([
      historyService.getOrganizationHistory(auth.organizationId, {
        limit: 50,
      }),
      historyService.getActivityStats(auth.organizationId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        history,
        stats,
      },
    });
  } catch (error: any) {
    console.error('[History Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
