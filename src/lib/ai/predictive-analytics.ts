/**
 * InsightGov Africa - Predictive Analytics Service
 * ==================================================
 * Service d'analyse prédictive et de prévisions ML
 * Utilise des algorithmes statistiques pour les prévisions
 */

import { getOpenAIClient, OPENAI_MODEL } from './openai';

// =============================================================================
// TYPES
// =============================================================================

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface ForecastResult {
  forecast: TimeSeriesPoint[];
  confidence: {
    lower: TimeSeriesPoint[];
    upper: TimeSeriesPoint[];
  };
  accuracy: {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
  };
  method: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: boolean;
}

export interface AnomalyDetectionResult {
  anomalies: {
    date: string;
    value: number;
    expected: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
  }[];
  summary: {
    totalAnomalies: number;
    highSeverity: number;
    anomalyRate: number;
  };
}

export interface TrendAnalysisResult {
  trend: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  r2: number;
  seasonality: {
    detected: boolean;
    period: number | null;
  };
  changePoints: {
    date: string;
    type: 'increase' | 'decrease';
    magnitude: number;
  }[];
}

export interface InsightRecommendation {
  type: 'alert' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  actionItems: string[];
}

// =============================================================================
// FORECASTING
// =============================================================================

/**
 * Génère une prévision pour une série temporelle
 * Utilise une approche hybride: statistiques + GPT pour l'interprétation
 */
export async function generateForecast(
  data: TimeSeriesPoint[],
  horizon: number = 6 // mois
): Promise<ForecastResult> {
  if (data.length < 3) {
    throw new Error('Au moins 3 points de données requis pour la prévision');
  }

  // Calculer les statistiques de base
  const values = data.map((d) => d.value);
  const n = values.length;

  // Calculer la moyenne mobile simple
  const windowSize = Math.min(3, Math.floor(n / 2));
  const movingAvg: number[] = [];
  for (let i = windowSize - 1; i < n; i++) {
    const sum = values.slice(i - windowSize + 1, i + 1).reduce((a, b) => a + b, 0);
    movingAvg.push(sum / windowSize);
  }

  // Détecter la tendance (régression linéaire simple)
  const { slope, intercept, r2 } = linearRegression(
    data.slice(-movingAvg.length).map((d, i) => ({ x: i, y: movingAvg[i] }))
  );

  // Générer les prévisions
  const lastDate = new Date(data[data.length - 1].date);
  const lastValue = values[n - 1];
  const avgValue = values.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(
    values.reduce((sum, v) => sum + Math.pow(v - avgValue, 2), 0) / n
  );

  const forecast: TimeSeriesPoint[] = [];
  const lower: TimeSeriesPoint[] = [];
  const upper: TimeSeriesPoint[] = [];

  for (let i = 1; i <= horizon; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setMonth(forecastDate.getMonth() + i);

    // Combinaison tendance + moyenne mobile
    const trendComponent = slope * (movingAvg.length + i - 1) + intercept;
    const smoothedValue = movingAvg[movingAvg.length - 1];
    const forecastValue = (trendComponent * 0.7 + smoothedValue * 0.3);

    // Intervalle de confiance (élargit avec le temps)
    const confidenceWidth = stdDev * (1 + 0.1 * i);

    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      value: Math.max(0, forecastValue),
    });

    lower.push({
      date: forecastDate.toISOString().split('T')[0],
      value: Math.max(0, forecastValue - confidenceWidth),
    });

    upper.push({
      date: forecastDate.toISOString().split('T')[0],
      value: forecastValue + confidenceWidth,
    });
  }

  // Calculer les métriques d'erreur
  const mape = calculateMAPE(data.slice(-movingAvg.length), movingAvg);
  const rmse = calculateRMSE(data.slice(-movingAvg.length), movingAvg);

  return {
    forecast,
    confidence: { lower, upper },
    accuracy: { mape, rmse },
    method: 'Hybrid Moving Average + Linear Regression',
    trend: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
    seasonality: detectSeasonality(values),
  };
}

/**
 * Analyse les tendances d'une série temporelle
 */
export function analyzeTrend(data: TimeSeriesPoint[]): TrendAnalysisResult {
  const values = data.map((d) => d.value);
  const n = values.length;

  // Régression linéaire
  const { slope, r2 } = linearRegression(data.map((d, i) => ({ x: i, y: d.value })));

  // Détecter la saisonnalité
  const seasonality = detectSeasonality(values);

  // Détecter les points de changement
  const changePoints = detectChangePoints(data);

  return {
    trend: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
    slope,
    r2,
    seasonality: {
      detected: seasonality,
      period: seasonality ? detectSeasonalPeriod(values) : null,
    },
    changePoints,
  };
}

/**
 * Détecte les anomalies dans une série temporelle
 */
export function detectAnomalies(
  data: TimeSeriesPoint[],
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): AnomalyDetectionResult {
  const values = data.map((d) => d.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
  );

  // Seuils selon la sensibilité
  const thresholds = {
    low: 3,
    medium: 2.5,
    high: 2,
  };

  const threshold = thresholds[sensitivity] * stdDev;

  const anomalies: AnomalyDetectionResult['anomalies'] = [];

  for (let i = 0; i < data.length; i++) {
    const deviation = Math.abs(data[i].value - avg);

    if (deviation > threshold) {
      const severity =
        deviation > 3 * stdDev ? 'high' : deviation > 2 * stdDev ? 'medium' : 'low';

      anomalies.push({
        date: data[i].date,
        value: data[i].value,
        expected: avg,
        deviation: (deviation / avg) * 100,
        severity,
      });
    }
  }

  return {
    anomalies,
    summary: {
      totalAnomalies: anomalies.length,
      highSeverity: anomalies.filter((a) => a.severity === 'high').length,
      anomalyRate: (anomalies.length / data.length) * 100,
    },
  };
}

// =============================================================================
// AI-POWERED INSIGHTS
// =============================================================================

/**
 * Génère des insights et recommandations basés sur les données
 */
export async function generateInsights(
  data: TimeSeriesPoint[],
  context: {
    sector: string;
    metricName: string;
    organizationType: string;
  }
): Promise<InsightRecommendation[]> {
  const openai = getOpenAIClient();

  // Analyser les données
  const trend = analyzeTrend(data);
  const anomalies = detectAnomalies(data);

  // Préparer le résumé des données
  const dataSummary = {
    totalPoints: data.length,
    firstDate: data[0].date,
    lastDate: data[data.length - 1].date,
    minValue: Math.min(...data.map((d) => d.value)),
    maxValue: Math.max(...data.map((d) => d.value)),
    avgValue: data.reduce((a, b) => a + b.value, 0) / data.length,
    trend: trend.trend,
    slope: trend.slope,
    r2: trend.r2,
    anomalyCount: anomalies.summary.totalAnomalies,
    seasonality: trend.seasonality.detected,
  };

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en analyse de données pour organisations africaines.
Analyse les données fournies et génère 3-5 insights et recommandations actionnables.

Chaque insight doit être au format JSON:
{
  "type": "alert|opportunity|recommendation",
  "title": "Titre court",
  "description": "Description détaillée",
  "impact": "low|medium|high",
  "confidence": 0.85,
  "actionItems": ["Action 1", "Action 2"]
}

Types d'insights:
- alert: Problème ou risque identifié
- opportunity: Opportunité d'amélioration
- recommendation: Recommandation spécifique

Réponds uniquement avec un tableau JSON d'insights.`,
      },
      {
        role: 'user',
        content: `Contexte: ${context.organizationType} dans le secteur ${context.sector}
Métrique analysée: ${context.metricName}

Résumé des données:
${JSON.stringify(dataSummary, null, 2)}

Anomalies détectées: ${anomalies.summary.totalAnomalies}
Points de changement: ${trend.changePoints.length}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return [];
  }

  try {
    const parsed = JSON.parse(content);
    return parsed.insights || parsed.recommendations || [];
  } catch {
    return [];
  }
}

/**
 * Génère un rapport narratif des insights
 */
export async function generateNarrativeReport(
  data: TimeSeriesPoint[],
  forecast: ForecastResult | null,
  insights: InsightRecommendation[],
  context: {
    sector: string;
    metricName: string;
    organizationType: string;
  }
): Promise<string> {
  const openai = getOpenAIClient();

  const trend = analyzeTrend(data);
  const avgValue = data.reduce((a, b) => a + b.value, 0) / data.length;
  const lastValue = data[data.length - 1].value;
  const firstValue = data[0].value;
  const percentChange = ((lastValue - firstValue) / firstValue) * 100;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content: `Tu es un consultant senior spécialisé dans l'analyse de données pour le secteur public africain.
Rédige un rapport narratif concis (3-4 paragraphes) qui:
1. Résume les tendances principales
2. Explique les fluctuations significatives
3. Présente les prévisions (si disponibles)
4. Recommande des actions prioritaires

Le ton doit être professionnel mais accessible, adapté aux décideurs.`,
      },
      {
        role: 'user',
        content: `Données pour ${context.metricName} (${context.organizationType}, ${context.sector}):
- Période: ${data[0].date} à ${data[data.length - 1].date}
- Valeur moyenne: ${avgValue.toFixed(2)}
- Changement total: ${percentChange.toFixed(1)}%
- Tendance: ${trend.trend}
- Saisonnalité: ${trend.seasonality.detected ? 'Détectée' : 'Non détectée'}

${forecast ? `Prévision sur ${forecast.forecast.length} périodes: ${forecast.trend}` : ''}

Insights clés:
${insights.map((i) => `- ${i.title}: ${i.description}`).join('\n')}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 800,
  });

  return response.choices[0]?.message?.content || 'Impossible de générer le rapport.';
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function linearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  r2: number;
} {
  const n = points.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const yMean = sumY / n;
  let ssTotal = 0,
    ssRes = 0;
  for (const p of points) {
    const yPred = slope * p.x + intercept;
    ssTotal += Math.pow(p.y - yMean, 2);
    ssRes += Math.pow(p.y - yPred, 2);
  }
  const r2 = 1 - ssRes / ssTotal;

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept, r2: isNaN(r2) ? 0 : r2 };
}

function detectSeasonality(values: number[]): boolean {
  if (values.length < 12) return false;

  // Autocorrélation simple pour détecter la saisonnalité
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;

  // Calculer l'autocorrélation pour différents décalages
  for (let lag = 3; lag <= Math.min(12, Math.floor(values.length / 2)); lag++) {
    let autocorr = 0;
    for (let i = 0; i < values.length - lag; i++) {
      autocorr += (values[i] - avg) * (values[i + lag] - avg);
    }
    autocorr /= (values.length - lag) * variance;

    // Si l'autocorrélation est significative (> 0.5), il y a saisonnalité
    if (autocorr > 0.5) {
      return true;
    }
  }

  return false;
}

function detectSeasonalPeriod(values: number[]): number | null {
  if (values.length < 12) return null;

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;

  let maxAutocorr = 0;
  let bestLag = null;

  for (let lag = 3; lag <= Math.min(12, Math.floor(values.length / 2)); lag++) {
    let autocorr = 0;
    for (let i = 0; i < values.length - lag; i++) {
      autocorr += (values[i] - avg) * (values[i + lag] - avg);
    }
    autocorr /= (values.length - lag) * variance;

    if (autocorr > maxAutocorr && autocorr > 0.5) {
      maxAutocorr = autocorr;
      bestLag = lag;
    }
  }

  return bestLag;
}

function detectChangePoints(
  data: TimeSeriesPoint[]
): TrendAnalysisResult['changePoints'] {
  if (data.length < 5) return [];

  const values = data.map((d) => d.value);
  const changePoints: TrendAnalysisResult['changePoints'] = [];

  // Calculer la différence absolue moyenne
  const diffs = [];
  for (let i = 1; i < values.length; i++) {
    diffs.push(Math.abs(values[i] - values[i - 1]));
  }
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const threshold = avgDiff * 2;

  for (let i = 1; i < values.length - 1; i++) {
    const diff = values[i + 1] - values[i];

    if (Math.abs(diff) > threshold) {
      changePoints.push({
        date: data[i + 1].date,
        type: diff > 0 ? 'increase' : 'decrease',
        magnitude: (Math.abs(diff) / values[i]) * 100,
      });
    }
  }

  return changePoints.slice(0, 5); // Limiter à 5 points
}

function calculateMAPE(actual: TimeSeriesPoint[], predicted: number[]): number {
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i].value !== 0) {
      sum += Math.abs((actual[i].value - predicted[i]) / actual[i].value);
    }
  }
  return (sum / actual.length) * 100;
}

function calculateRMSE(actual: TimeSeriesPoint[], predicted: number[]): number {
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    sum += Math.pow(actual[i].value - predicted[i], 2);
  }
  return Math.sqrt(sum / actual.length);
}
