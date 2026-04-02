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
import { requireAuth } from '@/lib/auth-middleware';

/**
 * POST /api/ai/predict
 * Génère des prévisions et insights
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  const authResult = await requireAuth(request, 'read');
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const auth = authResult.auth;

  try {
    const body = await request.json();
    const { action, data, context, options } = body;

    if (!action || !data) {
      return NextResponse.json(
        { success: false, error: 'action et data requis' },
        { status: 400 }
      );
    }

    const timeSeriesData = data as TimeSeriesPoint[];

    // Journalisation pour audit
    console.log(`[AI Predict] User ${auth.email} (${auth.userId}) requested action: ${action}`);

    switch (action) {
      case 'forecast':
        const horizon = options?.horizon || 6;
        const forecast = await generateForecast(timeSeriesData, horizon);
        return NextResponse.json({
          success: true,
          forecast,
          metadata: {
            userId: auth.userId,
            organizationId: auth.organizationId,
            executedAt: new Date().toISOString(),
          },
        });

      case 'trend':
        const trend = analyzeTrend(timeSeriesData);
        return NextResponse.json({
          success: true,
          trend,
          metadata: {
            userId: auth.userId,
            organizationId: auth.organizationId,
          },
        });

      case 'anomalies':
        const sensitivity = options?.sensitivity || 'medium';
        const anomalies = detectAnomalies(timeSeriesData, sensitivity);
        return NextResponse.json({
          success: true,
          anomalies,
          metadata: {
            userId: auth.userId,
            organizationId: auth.organizationId,
          },
        });

      case 'insights':
        if (!context) {
          return NextResponse.json(
            { success: false, error: 'context requis pour insights' },
            { status: 400 }
          );
        }
        const insights = await generateInsights(timeSeriesData, context);
        return NextResponse.json({
          success: true,
          insights,
          metadata: {
            userId: auth.userId,
            organizationId: auth.organizationId,
          },
        });

      case 'full-analysis':
        if (!context) {
          return NextResponse.json(
            { success: false, error: 'context requis pour full-analysis' },
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
          metadata: {
            userId: auth.userId,
            organizationId: auth.organizationId,
            executedAt: new Date().toISOString(),
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue. Utilisez: forecast, trend, anomalies, insights, full-analysis' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erreur analyse prédictive:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'analyse prédictive' },
      { status: 500 }
    );
  }
}
