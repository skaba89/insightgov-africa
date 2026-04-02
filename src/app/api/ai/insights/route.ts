/**
 * InsightGov Africa - AI Insights API Route
 * ==========================================
 * API pour générer des insights automatiques.
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import {
  generateAIInsights,
  generateExecutiveSummaryAI,
  analyzeTrends,
  detectAnomalies,
  analyzeCorrelations,
} from '@/lib/ai/insights-engine';
import { db } from '@/lib/db';
import type { DashboardConfig, Sector } from '@/types';

// ============================================
// POST /api/ai/insights
// Génère des insights pour un dataset
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (write pour générer insights)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { data, config, sector, organizationType, analysisType, datasetId } = body;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Données requises' },
        { status: 400 }
      );
    }

    // Si datasetId fourni, vérifier l'appartenance
    if (datasetId && db) {
      const uuidError = validateUUID(datasetId);
      if (uuidError) return uuidError;

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
    }

    const columns = Object.keys(data[0] || {});

    switch (analysisType) {
      case 'full':
        // Generate complete insights
        const insights = await generateAIInsights(
          data,
          config as DashboardConfig,
          sector as Sector || 'other',
          organizationType || 'enterprise'
        );

        return NextResponse.json({
          success: true,
          insights,
          count: insights.length,
        });

      case 'summary':
        // Generate executive summary
        const summary = await generateExecutiveSummaryAI(
          data,
          config as DashboardConfig,
          sector as Sector || 'other',
          organizationType || 'enterprise'
        );

        return NextResponse.json({
          success: true,
          summary,
        });

      case 'trends':
        // Analyze trends only
        const trends = analyzeTrends(data, columns);

        return NextResponse.json({
          success: true,
          trends,
        });

      case 'anomalies':
        // Detect anomalies only
        const anomalies = detectAnomalies(data, columns);

        return NextResponse.json({
          success: true,
          anomalies,
          totalAnomalies: anomalies.reduce((sum, a) => sum + a.anomalies.length, 0),
        });

      case 'correlations':
        // Analyze correlations only
        const correlations = analyzeCorrelations(data, columns);

        return NextResponse.json({
          success: true,
          correlations,
          strongCorrelations: correlations.filter(c => c.strength === 'strong').length,
        });

      default:
        // Default: full analysis
        const fullInsights = await generateAIInsights(
          data,
          config as DashboardConfig,
          sector as Sector || 'other',
          organizationType || 'enterprise'
        );

        const fullSummary = await generateExecutiveSummaryAI(
          data,
          config as DashboardConfig,
          sector as Sector || 'other',
          organizationType || 'enterprise'
        );

        const fullTrends = analyzeTrends(data, columns);
        const fullAnomalies = detectAnomalies(data, columns);
        const fullCorrelations = analyzeCorrelations(data, columns);

        // Log de l'activité
        if (auth.organizationId && db) {
          await db.activityLog.create({
            data: {
              userId: auth.userId,
              organizationId: auth.organizationId,
              action: 'analyze',
              entityType: 'dataset',
              entityId: datasetId,
              metadata: JSON.stringify({ analysisType: 'full' }),
            },
          }).catch(err => console.error('Failed to log activity:', err));
        }

        return NextResponse.json({
          success: true,
          insights: fullInsights,
          summary: fullSummary,
          trends: fullTrends,
          anomalies: fullAnomalies,
          correlations: fullCorrelations,
          metadata: {
            generatedAt: new Date().toISOString(),
            dataPoints: data.length,
            columns: columns.length,
            insightsCount: fullInsights.length,
            anomaliesCount: fullAnomalies.reduce((sum, a) => sum + a.anomalies.length, 0),
            strongCorrelations: fullCorrelations.filter(c => c.strength === 'strong').length,
          },
        });
    }
  } catch (error) {
    console.error('Erreur génération insights:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération des insights' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/ai/insights
// Récupère les insights enregistrés pour un dataset
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');

    if (!datasetId) {
      return NextResponse.json(
        { success: false, error: 'Dataset ID requis' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(datasetId);
    if (uuidError) return uuidError;

    // Vérifier que le dataset appartient à l'organisation
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database non disponible.' },
        { status: 503 }
      );
    }
    
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

    // En production, récupérer depuis la base de données
    return NextResponse.json({
      success: true,
      insights: [],
      message: 'Utilisez POST pour générer de nouveaux insights',
    });
  } catch (error) {
    console.error('Erreur récupération insights:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
