/**
 * InsightGov Africa - PDF Export API Route
 * =========================================
 * API pour générer et télécharger des rapports PDF.
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDashboardPDF } from '@/lib/pdf/pdf-generator';
import { requireAuth, validateUUID, checkPlanLimit } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import type { DashboardConfig } from '@/types';

// ============================================
// POST /api/export/pdf
// Génère un PDF à partir d'une configuration dashboard
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (write pour export)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { kpiConfigId, config, organizationName } = body;

    let dashboardConfig: DashboardConfig | null = null;
    let targetOrgId = auth.organizationId;

    // Récupérer la config depuis l'ID si fourni
    if (kpiConfigId) {
      // Validation UUID
      const uuidError = validateUUID(kpiConfigId);
      if (uuidError) return uuidError;

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

      // Vérifier l'appartenance
      if (auth.role !== 'owner' && auth.role !== 'admin') {
        if (kpiConfig.dataset.organizationId !== auth.organizationId) {
          return NextResponse.json(
            { success: false, error: 'Accès refusé.' },
            { status: 403 }
          );
        }
      }

      dashboardConfig = JSON.parse(kpiConfig.configJson as string) as DashboardConfig;
      targetOrgId = kpiConfig.dataset.organizationId;
    } else if (config) {
      dashboardConfig = config as DashboardConfig;
    }

    if (!dashboardConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration requise (kpiConfigId ou config)' },
        { status: 400 }
      );
    }

    // Vérifier les limites du plan
    if (targetOrgId) {
      const planCheck = await checkPlanLimit(targetOrgId, 'exports');
      if (!planCheck.allowed) {
        return NextResponse.json(
          { success: false, error: planCheck.message, code: 'PLAN_LIMIT_EXCEEDED' },
          { status: 402 }
        );
      }
    }

    // Générer le PDF
    const pdfBuffer = await generateDashboardPDF(
      dashboardConfig,
      organizationName || 'Organisation'
    );

    // Convertir Buffer en Uint8Array pour NextResponse
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    // Log de l'activité
    if (auth.organizationId) {
      await db.activityLog.create({
        data: {
          userId: auth.userId,
          organizationId: auth.organizationId,
          action: 'export',
          entityType: 'dataset',
          metadata: JSON.stringify({ format: 'pdf', configId: kpiConfigId }),
        },
      }).catch(err => console.error('Failed to log activity:', err));
    }

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

// ============================================
// GET /api/export/pdf
// Prévisualisation des métadonnées du rapport
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const kpiConfigId = searchParams.get('kpiConfigId');

    if (!kpiConfigId) {
      return NextResponse.json(
        { success: false, error: 'kpiConfigId requis' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(kpiConfigId);
    if (uuidError) return uuidError;

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

    // Vérifier l'appartenance
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (kpiConfig.dataset.organizationId !== auth.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
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
      { success: false, error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
