/**
 * InsightGov Africa - AI Insights API Route
 * ==========================================
 * API pour générer des insights automatiques.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateAIInsights,
  generateExecutiveSummaryAI,
  analyzeTrends,
  detectAnomalies,
  analyzeCorrelations,
} from '@/lib/ai/insights-engine';
import type { DashboardConfig, Sector, ColumnMetadata } from '@/types';

/**
 * POST /api/ai/insights
 * Génère des insights pour un dataset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, config, sector, organizationType, analysisType } = body;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Données requises' },
        { status: 400 }
      );
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
      {
        success: false,
        error: 'Erreur lors de la génération des insights',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/insights
 * Récupère les insights enregistrés pour un dataset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');

    if (!datasetId) {
      return NextResponse.json(
        { success: false, error: 'Dataset ID requis' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    // For now, return placeholder
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
