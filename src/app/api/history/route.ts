// ============================================
// InsightGov Africa - API Historique
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { historyService } from '@/services/history';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthSession();

    if (!auth) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');

    if (datasetId) {
      const history = await historyService.getDatasetHistory(datasetId);
      return NextResponse.json({ success: true, data: history });
    }

    const [history, stats] = await Promise.all([
      historyService.getOrganizationHistory(auth.user.organizationId, {
        limit: 50,
      }),
      historyService.getActivityStats(auth.user.organizationId),
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
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
