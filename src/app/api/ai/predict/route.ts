/**
 * InsightGov Africa - Predictive Analytics API
 * ==============================================
 * API pour les prévisions et l'analyse prédictive
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateForecast,
  analyzeTrend,
  detectAnomalies,
  generateInsights,
  generateNarrativeReport,
  type TimeSeriesPoint,
} from '@/lib/ai/predictive-analytics';

/**
 * POST /api/ai/predict
 * Génère des prévisions et insights
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, context, options } = body;

    if (!action || !data) {
      return NextResponse.json(
        { error: 'action et data requis' },
        { status: 400 }
      );
    }

    const timeSeriesData = data as TimeSeriesPoint[];

    switch (action) {
      case 'forecast':
        const horizon = options?.horizon || 6;
        const forecast = await generateForecast(timeSeriesData, horizon);
        return NextResponse.json({
          success: true,
          forecast,
        });

      case 'trend':
        const trend = analyzeTrend(timeSeriesData);
        return NextResponse.json({
          success: true,
          trend,
        });

      case 'anomalies':
        const sensitivity = options?.sensitivity || 'medium';
        const anomalies = detectAnomalies(timeSeriesData, sensitivity);
        return NextResponse.json({
          success: true,
          anomalies,
        });

      case 'insights':
        if (!context) {
          return NextResponse.json(
            { error: 'context requis pour insights' },
            { status: 400 }
          );
        }
        const insights = await generateInsights(timeSeriesData, context);
        return NextResponse.json({
          success: true,
          insights,
        });

      case 'full-analysis':
        if (!context) {
          return NextResponse.json(
            { error: 'context requis pour full-analysis' },
            { status: 400 }
          );
        }

        // Exécuter toutes les analyses en parallèle
        const [forecastResult, trendResult, anomaliesResult, insightsResult] =
          await Promise.all([
            generateForecast(timeSeriesData, options?.horizon || 6),
            Promise.resolve(analyzeTrend(timeSeriesData)),
            Promise.resolve(detectAnomalies(timeSeriesData, options?.sensitivity || 'medium')),
            generateInsights(timeSeriesData, context),
          ]);

        // Générer le rapport narratif
        const report = await generateNarrativeReport(
          timeSeriesData,
          forecastResult,
          insightsResult,
          context
        );

        return NextResponse.json({
          success: true,
          analysis: {
            forecast: forecastResult,
            trend: trendResult,
            anomalies: anomaliesResult,
            insights: insightsResult,
            report,
          },
        });

      default:
        return NextResponse.json(
          { error: 'Action non reconnue. Utilisez: forecast, trend, anomalies, insights, full-analysis' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erreur analyse prédictive:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse prédictive' },
      { status: 500 }
    );
  }
}
