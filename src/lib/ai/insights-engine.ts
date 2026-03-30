/**
 * InsightGov Africa - AI Insights Engine
 * =======================================
 * Moteur d'insights automatiques avec IA.
 * Génère des analyses approfondies, tendances et recommandations.
 */

import { getOpenAIClient } from './openai';
import type { DashboardConfig, KPIConfig, Sector } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'comparison' | 'correlation' | 'prediction';
  title: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  metric?: string;
  value?: number;
  previousValue?: number;
  changePercent?: number;
  affectedColumns?: string[];
  recommendation?: string;
  confidence: number;
  actionable: boolean;
  visualEvidence?: {
    chartType: string;
    data: Record<string, unknown>[];
  };
}

export interface TrendAnalysis {
  column: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  slope: number;
  r2: number;
  forecast?: number[];
  seasonality?: {
    detected: boolean;
    period?: string;
    strength?: number;
  };
  changepoints?: number[];
}

export interface AnomalyDetection {
  column: string;
  anomalies: Array<{
    index: number;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
    possibleCause?: string;
  }>;
  method: 'isolation_forest' | 'zscore' | 'iqr' | 'ai';
}

export interface CorrelationResult {
  column1: string;
  column2: string;
  correlation: number;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative';
  significance: number;
  insight?: string;
}

export interface ExecutiveSummaryAI {
  overview: string;
  keyFindings: string[];
  performanceIndicators: {
    metric: string;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    value: number;
    target?: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  strategicRecommendations: string[];
  riskAlerts: string[];
  opportunities: string[];
  nextActions: {
    action: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    deadline?: string;
    responsible?: string;
  }[];
}

// =============================================================================
// TREND ANALYSIS
// =============================================================================

/**
 * Analyse les tendances dans les données numériques
 */
export function analyzeTrends(
  data: Record<string, unknown>[],
  columns: string[]
): TrendAnalysis[] {
  const trends: TrendAnalysis[] = [];

  for (const column of columns) {
    const values = data
      .map(row => parseFloat(String(row[column])))
      .filter(v => !isNaN(v));

    if (values.length < 3) continue;

    // Linear regression for trend
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    
    // Calculate R-squared
    const yPred = values.map((_, i) => yMean + slope * (i - xMean));
    const ssRes = values.reduce((sum, y, i) => sum + Math.pow(y - yPred[i], 2), 0);
    const ssTot = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

    // Determine trend direction
    let trend: TrendAnalysis['trend'];
    const avgChange = slope / Math.abs(yMean) * 100;
    
    if (Math.abs(avgChange) < 1) {
      trend = 'stable';
    } else if (r2 > 0.7) {
      trend = slope > 0 ? 'increasing' : 'decreasing';
    } else {
      trend = 'volatile';
    }

    // Simple forecast (next 3 periods)
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      forecast.push(yPred[n - 1] + slope * i);
    }

    trends.push({
      column,
      trend,
      slope,
      r2,
      forecast,
      seasonality: detectSeasonality(values),
    });
  }

  return trends;
}

/**
 * Détecte la saisonnalité dans les données
 */
function detectSeasonality(values: number[]): TrendAnalysis['seasonality'] {
  if (values.length < 12) {
    return { detected: false };
  }

  // Simple autocorrelation check for seasonality
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;

  const autocorr = (lag: number) => {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += (values[i] - mean) * (values[i + lag] - mean);
    }
    return sum / ((n - lag) * variance);
  };

  // Check for common periods (weekly=7, monthly=12, quarterly=4)
  const periods = [
    { lag: 7, name: 'weekly' },
    { lag: 12, name: 'monthly' },
    { lag: 4, name: 'quarterly' },
  ];

  for (const period of periods) {
    if (n > period.lag * 2) {
      const corr = autocorr(period.lag);
      if (Math.abs(corr) > 0.5) {
        return {
          detected: true,
          period: period.name,
          strength: Math.abs(corr),
        };
      }
    }
  }

  return { detected: false };
}

// =============================================================================
// ANOMALY DETECTION
// =============================================================================

/**
 * Détecte les anomalies dans les données
 */
export function detectAnomalies(
  data: Record<string, unknown>[],
  columns: string[]
): AnomalyDetection[] {
  const results: AnomalyDetection[] = [];

  for (const column of columns) {
    const values = data
      .map((row, i) => ({ index: i, value: parseFloat(String(row[column])) }))
      .filter(v => !isNaN(v.value));

    if (values.length < 4) continue;

    const anomalies: AnomalyDetection['anomalies'] = [];
    const numericValues = values.map(v => v.value);

    // Z-Score method
    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const stdDev = Math.sqrt(
      numericValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / numericValues.length
    );

    if (stdDev === 0) continue;

    for (const { index, value } of values) {
      const zScore = Math.abs((value - mean) / stdDev);
      
      if (zScore > 3) {
        anomalies.push({
          index,
          value,
          expectedValue: mean,
          deviation: ((value - mean) / mean) * 100,
          severity: zScore > 4 ? 'high' : 'medium',
          possibleCause: suggestAnomalyCause(column, value, mean),
        });
      }
    }

    if (anomalies.length > 0) {
      results.push({
        column,
        anomalies,
        method: 'zscore',
      });
    }
  }

  return results;
}

/**
 * Suggère une cause possible pour l'anomalie
 */
function suggestAnomalyCause(column: string, value: number, mean: number): string {
  const diff = value - mean;
  const lowerColumn = column.toLowerCase();

  if (lowerColumn.includes('vente') || lowerColumn.includes('sale') || lowerColumn.includes('revenue')) {
    return diff > 0
      ? 'Pic de ventes possible: promotion, saisonnalité, ou événement spécial'
      : 'Baisse de ventes: vérifier les stocks, la concurrence, ou problèmes opérationnels';
  }

  if (lowerColumn.includes('client') || lowerColumn.includes('user') || lowerColumn.includes('patient')) {
    return diff > 0
      ? 'Afflux inhabituel: campagne marketing ou événement externe'
      : 'Baisse de fréquentation: vérifier les horaires, la météo, ou la concurrence';
  }

  if (lowerColumn.includes('cout') || lowerColumn.includes('cost') || lowerColumn.includes('depense')) {
    return diff > 0
      ? 'Dépense exceptionnelle: achat important, urgence, ou erreur de saisie'
      : 'Économie inhabituelle: vérifier si toutes les dépenses sont enregistrées';
  }

  return 'Valeur inhabituelle détectée - vérifier la source des données';
}

// =============================================================================
// CORRELATION ANALYSIS
// =============================================================================

/**
 * Analyse les corrélations entre colonnes numériques
 */
export function analyzeCorrelations(
  data: Record<string, unknown>[],
  columns: string[]
): CorrelationResult[] {
  const results: CorrelationResult[] = [];
  const numericColumns = columns.filter(col => {
    const values = data.slice(0, 10).map(row => parseFloat(String(row[col])));
    return values.filter(v => !isNaN(v)).length > 5;
  });

  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];

      const pairs = data
        .map(row => ({
          x: parseFloat(String(row[col1])),
          y: parseFloat(String(row[col2])),
        }))
        .filter(p => !isNaN(p.x) && !isNaN(p.y));

      if (pairs.length < 10) continue;

      const correlation = calculatePearsonCorrelation(pairs.map(p => p.x), pairs.map(p => p.y));
      const strength = getCorrelationStrength(Math.abs(correlation));
      const direction = correlation > 0 ? 'positive' : 'negative';

      // Generate insight for strong correlations
      let insight: string | undefined;
      if (strength === 'strong' || strength === 'moderate') {
        insight = generateCorrelationInsight(col1, col2, correlation);
      }

      results.push({
        column1: col1,
        column2: col2,
        correlation,
        strength,
        direction,
        significance: 1 - Math.exp(-pairs.length * Math.pow(correlation, 2) / 2),
        insight,
      });
    }
  }

  return results.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

/**
 * Calcule le coefficient de corrélation de Pearson
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Détermine la force de la corrélation
 */
function getCorrelationStrength(absCorr: number): CorrelationResult['strength'] {
  if (absCorr >= 0.7) return 'strong';
  if (absCorr >= 0.4) return 'moderate';
  if (absCorr >= 0.2) return 'weak';
  return 'none';
}

/**
 * Génère un insight pour une corrélation
 */
function generateCorrelationInsight(col1: string, col2: string, correlation: number): string {
  const direction = correlation > 0 ? 'positivement' : 'négativement';
  const absCorr = Math.abs(correlation);
  const strength = absCorr >= 0.7 ? 'fortement' : absCorr >= 0.4 ? 'modérément' : 'faiblement';

  return `"${col1}" et "${col2}" sont ${strength} corrélés ${direction} (r=${correlation.toFixed(2)}). ` +
    `Une variation de l'un pourrait influencer l'autre.`;
}

// =============================================================================
// AI-POWERED INSIGHTS GENERATION
// =============================================================================

/**
 * Génère des insights automatiques avec GPT-4o
 */
export async function generateAIInsights(
  data: Record<string, unknown>[],
  config: DashboardConfig,
  sector: Sector,
  organizationType: string
): Promise<Insight[]> {
  const insights: Insight[] = [];

  // Get statistics
  const trends = analyzeTrends(data, Object.keys(data[0] || {}));
  const anomalies = detectAnomalies(data, Object.keys(data[0] || {}));
  const correlations = analyzeCorrelations(data, Object.keys(data[0] || {}));

  // Prepare context for AI
  const context = {
    sector,
    organizationType,
    dataShape: {
      rows: data.length,
      columns: Object.keys(data[0] || {}).length,
    },
    trends: trends.slice(0, 5).map(t => ({
      column: t.column,
      trend: t.trend,
      slope: t.slope,
      r2: t.r2,
    })),
    anomalies: anomalies.slice(0, 3).map(a => ({
      column: a.column,
      count: a.anomalies.length,
    })),
    topCorrelations: correlations.slice(0, 3).map(c => ({
      columns: [c.column1, c.column2],
      correlation: c.correlation,
      insight: c.insight,
    })),
    kpis: config.kpis.slice(0, 5).map(k => k.title),
    existingInsights: config.keyInsights,
  };

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en analyse de données pour les organisations africaines.
Génère des insights actionnables et spécifiques au contexte ${sector} pour une ${organizationType}.

Réponds en JSON avec un tableau d'insights:
{
  "insights": [
    {
      "type": "trend|anomaly|opportunity|risk|comparison|correlation|prediction",
      "title": "Titre court",
      "description": "Description détaillée",
      "importance": "critical|high|medium|low",
      "category": "performance|risk|opportunity|operation|finance",
      "recommendation": "Action recommandée",
      "confidence": 0.0-1.0,
      "actionable": true/false
    }
  ]
}

Focus sur:
1. Insights spécifiques au contexte africain (FCFA, saisonnalité, etc.)
2. Recommandations pratiques et immédiatement applicables
3. Identification des risques et opportunités
4. Comparaisons avec les benchmarks du secteur`,
        },
        {
          role: 'user',
          content: `Analyse ces données et génère des insights:

Contexte: ${JSON.stringify(context, null, 2)}

Échantillon de données (10 premières lignes):
${JSON.stringify(data.slice(0, 10), null, 2)}

Génère entre 5 et 10 insights pertinents.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      if (parsed.insights && Array.isArray(parsed.insights)) {
        insights.push(...parsed.insights.map((insight: Partial<Insight>, i: number) => ({
          id: `ai_insight_${i}`,
          type: insight.type || 'trend',
          title: insight.title || 'Insight',
          description: insight.description || '',
          importance: insight.importance || 'medium',
          category: insight.category || 'performance',
          recommendation: insight.recommendation,
          confidence: insight.confidence || 0.7,
          actionable: insight.actionable ?? true,
        })));
      }
    }
  } catch (error) {
    console.error('Erreur génération insights IA:', error);
  }

  // Add automated insights from trends
  for (const trend of trends.filter(t => t.r2 > 0.5)) {
    insights.push({
      id: `trend_${trend.column}`,
      type: 'trend',
      title: `Tendance ${trend.trend === 'increasing' ? 'haussière' : trend.trend === 'decreasing' ? 'baissière' : 'stable'}: ${trend.column}`,
      description: `La colonne "${trend.column}" montre une tendance ${trend.trend} avec une corrélation de ${(trend.r2 * 100).toFixed(0)}%.`,
      importance: trend.r2 > 0.8 ? 'high' : 'medium',
      category: 'performance',
      metric: trend.column,
      confidence: trend.r2,
      actionable: true,
      recommendation: trend.trend === 'increasing'
        ? 'Maintenir les actions actuelles qui contribuent à cette croissance positive.'
        : trend.trend === 'decreasing'
        ? 'Analyser les causes de cette baisse et mettre en place des actions correctives.'
        : 'Stimuler cette métrique avec des actions ciblées.',
    });
  }

  // Add anomaly insights
  for (const anomaly of anomalies) {
    if (anomaly.anomalies.length > 0) {
      const highSeverity = anomaly.anomalies.filter(a => a.severity === 'high');
      insights.push({
        id: `anomaly_${anomaly.column}`,
        type: 'anomaly',
        title: `Anomalies détectées: ${anomaly.column}`,
        description: `${anomaly.anomalies.length} valeurs anormales détectées dans "${anomaly.column}", dont ${highSeverity.length} de haute sévérité.`,
        importance: highSeverity.length > 0 ? 'critical' : 'medium',
        category: 'risk',
        affectedColumns: [anomaly.column],
        confidence: 0.85,
        actionable: true,
        recommendation: 'Vérifier les données sources et corriger les erreurs de saisie potentielles.',
      });
    }
  }

  // Add correlation insights
  for (const corr of correlations.filter(c => c.strength === 'strong')) {
    insights.push({
      id: `correlation_${corr.column1}_${corr.column2}`,
      type: 'correlation',
      title: `Correlation forte: ${corr.column1} & ${corr.column2}`,
      description: corr.insight || `Les colonnes "${corr.column1}" et "${corr.column2}" sont fortement corrélées (${corr.direction}, r=${corr.correlation.toFixed(2)}).`,
      importance: 'high',
      category: 'performance',
      affectedColumns: [corr.column1, corr.column2],
      confidence: corr.significance,
      actionable: true,
      recommendation: `Optimiser ${corr.column1} pourrait avoir un impact sur ${corr.column2}.`,
    });
  }

  return insights.sort((a, b) => {
    const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });
}

// =============================================================================
// EXECUTIVE SUMMARY GENERATION
// =============================================================================

/**
 * Génère un résumé exécutif complet avec IA
 */
export async function generateExecutiveSummaryAI(
  data: Record<string, unknown>[],
  config: DashboardConfig,
  sector: Sector,
  organizationType: string
): Promise<ExecutiveSummaryAI> {
  const insights = await generateAIInsights(data, config, sector, organizationType);
  const trends = analyzeTrends(data, Object.keys(data[0] || {}));

  // Calculate performance indicators from KPIs
  const performanceIndicators = config.kpis.filter(k => k.isKeyMetric).map(kpi => {
    const trend = trends.find(t => t.column === kpi.columns?.y);
    return {
      metric: kpi.title,
      status: Math.random() > 0.5 ? 'good' : 'warning' as const, // Placeholder
      value: Math.random() * 1000,
      trend: trend?.trend === 'increasing' ? 'up' : trend?.trend === 'decreasing' ? 'down' : 'stable',
    };
  });

  // Extract recommendations
  const strategicRecommendations = insights
    .filter(i => i.recommendation && i.importance === 'high')
    .map(i => i.recommendation!);

  // Extract risks
  const riskAlerts = insights
    .filter(i => i.type === 'risk' || i.type === 'anomaly')
    .map(i => `${i.title}: ${i.description}`);

  // Extract opportunities
  const opportunities = insights
    .filter(i => i.type === 'opportunity')
    .map(i => i.description);

  // Generate next actions
  const nextActions = insights
    .filter(i => i.actionable && i.importance === 'high')
    .slice(0, 5)
    .map(i => ({
      action: i.recommendation || `Investiguer: ${i.title}`,
      priority: i.importance === 'critical' ? 'urgent' : i.importance as 'urgent' | 'high' | 'medium' | 'low',
    }));

  // Generate overview with AI
  let overview = '';
  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Tu es un consultant senior spécialisé dans l\'analyse de données pour organisations africaines. Rédige un résumé exécutif concis et percutant.',
        },
        {
          role: 'user',
          content: `Rédige un résumé exécutif de 2-3 phrases pour une ${organizationType} du secteur ${sector} basé sur ces insights:
${JSON.stringify(insights.slice(0, 5), null, 2)}

Répondre directement avec le texte, sans guillemets.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    overview = response.choices[0]?.message?.content || '';
  } catch {
    overview = `Analyse des données pour ${organizationType} - ${sector}. ${insights.length} insights générés.`;
  }

  return {
    overview,
    keyFindings: insights.slice(0, 5).map(i => i.description),
    performanceIndicators,
    strategicRecommendations: strategicRecommendations.length > 0 ? strategicRecommendations : [
      'Continuer le monitoring des KPIs clés',
      'Approfondir l\'analyse des tendances détectées',
    ],
    riskAlerts: riskAlerts.length > 0 ? riskAlerts : ['Aucun risque majeur détecté'],
    opportunities: opportunities.length > 0 ? opportunities : [
      'Optimiser les processus actuels',
      'Exploiter les corrélations identifiées',
    ],
    nextActions: nextActions.length > 0 ? nextActions : [
      { action: 'Revoir les données analysées', priority: 'medium' },
    ],
  };
}

export default {
  analyzeTrends,
  detectAnomalies,
  analyzeCorrelations,
  generateAIInsights,
  generateExecutiveSummaryAI,
};
