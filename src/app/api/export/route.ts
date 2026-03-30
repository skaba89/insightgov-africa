/**
 * InsightGov Africa - PDF Export API Route
 * =========================================
 * API pour générer et télécharger des rapports PDF.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDashboardPDF } from '@/lib/pdf/pdf-generator';
import { db } from '@/lib/db';
import type { DashboardConfig } from '@/types';

/**
 * POST /api/export/pdf
 * Génère un PDF à partir d'une configuration dashboard
 * 
 * Request body:
 * - kpiConfigId: ID de la configuration KPI (optionnel si config fournie)
 * - config: DashboardConfig (optionnel si kpiConfigId fourni)
 * - organizationName: Nom de l'organisation
 * 
 * Response:
 * - PDF binaire ou erreur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kpiConfigId, config, organizationName } = body;

    let dashboardConfig: DashboardConfig | null = null;

    // Récupérer la config depuis l'ID si fourni
    if (kpiConfigId) {
      const kpiConfig = await db.kPIConfig.findUnique({
        where: { id: kpiConfigId },
        include: { dataset: { include: { organization: true } } },
      });

      if (!kpiConfig) {
        return NextResponse.json(
          { success: false, error: 'Configuration non trouvée' },
          { status: 404 }
        );
      }

      dashboardConfig = JSON.parse(kpiConfig.configJson as string) as DashboardConfig;
    } else if (config) {
      dashboardConfig = config as DashboardConfig;
    }

    if (!dashboardConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration requise (kpiConfigId ou config)' },
        { status: 400 }
      );
    }

    // Générer le PDF
    const pdfBuffer = await generateDashboardPDF(
      dashboardConfig,
      organizationName || 'Organisation'
    );

    // Convertir Buffer en Uint8Array pour NextResponse
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    // Retourner le PDF
    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="dashboard-${Date.now()}.pdf"`,
        'Content-Length': pdfUint8Array.length.toString(),
      },
    });
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la génération du PDF',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/export/pdf
 * Prévisualisation des métadonnées du rapport
 * 
 * Query params:
 * - kpiConfigId: ID de la configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kpiConfigId = searchParams.get('kpiConfigId');

    if (!kpiConfigId) {
      return NextResponse.json(
        { success: false, error: 'kpiConfigId requis' },
        { status: 400 }
      );
    }

    const kpiConfig = await db.kPIConfig.findUnique({
      where: { id: kpiConfigId },
      include: { dataset: { include: { organization: true } } },
    });

    if (!kpiConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration non trouvée' },
        { status: 404 }
      );
    }

    const config = JSON.parse(kpiConfig.configJson as string) as DashboardConfig;

    return NextResponse.json({
      success: true,
      preview: {
        title: config.title,
        description: config.description,
        executiveSummary: config.executiveSummary,
        kpisCount: config.kpis.length,
        keyMetricsCount: config.kpis.filter((k) => k.isKeyMetric).length,
        insightsCount: config.keyInsights?.length || 0,
        recommendationsCount: config.recommendations?.length || 0,
        organizationName: kpiConfig.dataset.organization?.name,
        generatedAt: kpiConfig.generatedAt,
      },
    });
  } catch (error) {
    console.error('Erreur prévisualisation PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération',
      },
      { status: 500 }
    );
  }
}
