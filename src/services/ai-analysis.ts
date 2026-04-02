// ============================================
// InsightGov Africa - Service d'Analyse IA
// Intégration avec GPT-4o via z-ai-web-dev-sdk
// ============================================

import ZAI from 'z-ai-web-dev-sdk';
import {
  AIAnalysisRequest,
  AIAnalysisResponse,
  AIAnalysisResponse as AIResponse,
  ColumnMetadata,
  OrganizationType,
  TremorChartType,
  ChartConfig,
  Kpi,
  DatasetSummary,
  SuggestedKpi,
  ChartSuggestion,
} from '@/types';

// ============================================
// PROMPTS SYSTÈME POUR L'IA
// ============================================

const SYSTEM_PROMPT_ANALYSIS = `Tu es un expert en analyse de données et visualisation pour le secteur public et les organisations en Afrique.

Tu analyses des datasets pour des Ministères, ONG et Entreprises africaines.

Ta mission :
1. Comprendre le contexte et le secteur d'activité
2. Identifier les KPIs pertinents pour ce type d'organisation
3. Suggérer les visualisations les plus appropriées
4. Générer des insights actionnables

Tu DOIS répondre en JSON valide avec la structure exacte demandée.

Règles importantes :
- Les KPIs doivent être pertinents pour le secteur africain
- Utilise des termes appropriés au contexte (franc CFA, régions africaines, etc.)
- Les graphiques doivent utiliser Tremor.so (BarChart, LineChart, AreaChart, DonutChart, BarList, etc.)
- Chaque suggestion doit avoir une justification claire`;

// ============================================
// FONCTION PRINCIPALE : Analyser un dataset
// ============================================

/**
 * Analyse un dataset avec GPT-4o et génère les suggestions de KPIs et graphiques
 * @param request - Données de la requête d'analyse
 * @returns Configuration JSON pour les KPIs et graphiques
 */
export async function analyzeDataset(
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse> {
  try {
    const zai = await ZAI.create();

    // Construire le prompt utilisateur avec les données
    const userPrompt = buildAnalysisPrompt(request);

    // Appeler GPT-4o
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT_ANALYSIS,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('Pas de réponse de l\'IA');
    }

    // Parser la réponse JSON
    const analysisResult = parseAIResponse(responseContent);
    
    return analysisResult;
  } catch (error) {
    console.error('Erreur analyse IA:', error);
    return {
      success: false,
      datasetSummary: {
        title: 'Erreur d\'analyse',
        description: 'Impossible d\'analyser le dataset',
        mainTopic: 'Inconnu',
        dataQuality: 'Non évaluée',
      },
      suggestedKpis: [],
      suggestedCharts: [],
      insights: ['Erreur lors de l\'analyse IA'],
      recommendations: ['Veuillez réessayer ou contacter le support'],
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// ============================================
// CONSTRUCTION DU PROMPT D'ANALYSE
// ============================================

function buildAnalysisPrompt(request: AIAnalysisRequest): string {
  const orgTypeLabel = getOrganizationTypeLabel(request.organizationType);
  const sectorLabel = request.sector;
  const subSectorLabel = request.subSector ? ` (${request.subSector})` : '';

  // Formater les colonnes pour le prompt
  const columnsDescription = request.columns.map((col) => {
    return `
- **${col.name}** (${col.type})
  - Type sémantique: ${col.detectedSemanticType}
  - Échantillon: ${col.sampleValues.slice(0, 3).join(', ')}
  - Qualité: ${col.quality.overallScore}%
  - Statistiques: ${formatStatistics(col)}`;
  }).join('\n');

  // Formater un échantillon de données
  const sampleDataFormatted = request.sampleData
    .slice(0, 10)
    .map((row, i) => `${i + 1}. ${JSON.stringify(row)}`)
    .join('\n');

  return `# Analyse de Dataset

## Contexte
- **Type d'organisation**: ${orgTypeLabel}${subSectorLabel}
- **Secteur**: ${sectorLabel}
- **Langue des insights**: ${request.language === 'fr' ? 'Français' : 'Anglais'}

## Colonnes détectées (${request.columns.length} colonnes)
${columnsDescription}

## Échantillon de données (10 premières lignes)
${sampleDataFormatted}

## Tâche
Analyse ce dataset et génère une réponse JSON avec la structure suivante:

\`\`\`json
{
  "datasetSummary": {
    "title": "Titre descriptif du dataset",
    "description": "Description courte du contenu",
    "mainTopic": "Thème principal",
    "timeRange": {"start": "date début", "end": "date fin"},
    "geographicScope": ["pays/régions"],
    "dataQuality": "Évaluation de la qualité (Bonne/Moyenne/Faible)"
  },
  "suggestedKpis": [
    {
      "name": "Nom du KPI",
      "description": "Description et pourquoi c'est important",
      "category": "Catégorie (Financier, Opérationnel, Social, etc.)",
      "calculation": "Comment le calculer",
      "column": "Colonne principale concernée",
      "importance": "critical/high/medium/low"
    }
  ],
  "suggestedCharts": [
    {
      "chartType": "BarChart|LineChart|DonutChart|AreaChart|BarList",
      "title": "Titre du graphique",
      "subtitle": "Sous-titre optionnel",
      "xAxis": {"column": "nom_colonne", "label": "Label axe X"},
      "yAxis": {"column": "nom_colonne", "label": "Label axe Y"},
      "series": [{"column": "nom_colonne", "name": "Nom série", "color": "blue"}],
      "reasoning": "Pourquoi ce graphique est pertinent",
      "priority": 1
    }
  ],
  "insights": [
    "Insight 1: observation importante",
    "Insight 2: autre observation"
  ],
  "recommendations": [
    "Recommandation 1: action suggérée",
    "Recommandation 2: autre action"
  ]
}
\`\`\`

Génère 5-8 KPIs pertinents et 4-6 graphiques appropriés pour ce type d'organisation.`;
}

// ============================================
// PARSING DE LA RÉPONSE IA
// ============================================

function parseAIResponse(responseContent: string): AIAnalysisResponse {
  try {
    // Extraire le JSON de la réponse (peut être enveloppé dans du markdown)
    let jsonStr = responseContent;
    
    // Chercher le bloc JSON
    const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // Essayer de trouver un objet JSON directement
      const objectMatch = responseContent.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      datasetSummary: parsed.datasetSummary || {
        title: 'Dataset analysé',
        description: '',
        mainTopic: '',
        dataQuality: 'Non évaluée',
      },
      suggestedKpis: parsed.suggestedKpis || [],
      suggestedCharts: parsed.suggestedCharts || [],
      insights: parsed.insights || [],
      recommendations: parsed.recommendations || [],
    };
  } catch (error) {
    console.error('Erreur parsing réponse IA:', error);
    console.error('Contenu reçu:', responseContent.substring(0, 500));
    
    // Retourner une réponse par défaut
    return {
      success: false,
      datasetSummary: {
        title: 'Erreur de parsing',
        description: 'Impossible de parser la réponse de l\'IA',
        mainTopic: 'Inconnu',
        dataQuality: 'Non évaluée',
      },
      suggestedKpis: [],
      suggestedCharts: [],
      insights: [],
      recommendations: [],
      error: 'Erreur de parsing de la réponse IA',
    };
  }
}

// ============================================
// GÉNÉRATION DE LA CONFIGURATION DES KPIs
// ============================================

/**
 * Génère les configurations de KPIs prêtes à être sauvegardées
 * à partir des suggestions de l'IA
 */
export function generateKpiConfigs(
  suggestions: SuggestedKpi[],
  chartSuggestions: ChartSuggestion[],
  columns: ColumnMetadata[]
): Partial<Kpi>[] {
  return suggestions.map((suggestion, index) => {
    // Trouver la colonne correspondante
    const column = columns.find(
      (c) => c.name === suggestion.column || c.originalName === suggestion.column
    );

    // Trouver un graphique associé si disponible
    const associatedChart = chartSuggestions.find(
      (chart) =>
        chart.xAxis?.column === suggestion.column ||
        chart.series.some((s) => s.column === suggestion.column)
    );

    // Construire la configuration JSON pour Tremor
    const configJson: ChartConfig = associatedChart
      ? buildChartConfig(associatedChart, columns)
      : buildDefaultKpiCard(suggestion, column);

    return {
      name: suggestion.name,
      description: suggestion.description,
      category: suggestion.category,
      unit: detectUnit(suggestion, column),
      configJson,
      insightText: suggestion.description,
      displayOrder: index + 1,
      isPublic: false,
    };
  });
}

// ============================================
// CONSTRUCTION DE LA CONFIG CHART
// ============================================

function buildChartConfig(
  suggestion: ChartSuggestion,
  columns: ColumnMetadata[]
): ChartConfig {
  const xAxisColumn = columns.find(
    (c) => c.name === suggestion.xAxis?.column || c.originalName === suggestion.xAxis?.column
  );
  const yAxisColumn = columns.find(
    (c) => c.name === suggestion.yAxis?.column || c.originalName === suggestion.yAxis?.column
  );

  return {
    chartType: suggestion.chartType as TremorChartType,
    title: suggestion.title,
    subtitle: suggestion.subtitle,
    dataSource: {
      type: 'column',
      columns: suggestion.series.map((s) => s.column),
    },
    xAxis: suggestion.xAxis
      ? {
          column: suggestion.xAxis.column,
          label: suggestion.xAxis.label,
          type: xAxisColumn?.type === 'DATE' ? 'date' : 'category',
        }
      : undefined,
    yAxis: suggestion.yAxis
      ? {
          column: suggestion.yAxis.column,
          label: suggestion.yAxis.label,
          type: 'number',
        }
      : undefined,
    series: suggestion.series.map((s) => ({
      name: s.name,
      column: s.column,
      color: s.color,
    })),
    colors: suggestion.series.map((s) => s.color).filter(Boolean),
    legend: {
      show: true,
      position: 'bottom',
    },
    tooltip: {
      enabled: true,
    },
  };
}

function buildDefaultKpiCard(
  suggestion: SuggestedKpi,
  column?: ColumnMetadata
): ChartConfig {
  return {
    chartType: 'KpiCard' as TremorChartType,
    title: suggestion.name,
    subtitle: suggestion.description,
    dataSource: {
      type: 'aggregation',
      columns: column ? [column.name] : [],
      aggregationType: 'sum',
    },
    options: {
      format: detectFormat(column),
    },
  };
}

// ============================================
// UTILITAIRES
// ============================================

function getOrganizationTypeLabel(type: OrganizationType): string {
  const labels: Record<OrganizationType, string> = {
    ministry: 'Ministère / Gouvernement',
    ngo: 'ONG / Organisation Internationale',
    enterprise: 'Entreprise Privée',
    academic: 'Institution Académique',
    other: 'Autre Organisation',
  };
  return labels[type] || 'Organisation';
}

function formatStatistics(col: ColumnMetadata): string {
  const stats = col.statistics;
  const parts: string[] = [];

  if (stats.count) parts.push(`${stats.count} valeurs`);
  if (stats.uniqueCount) parts.push(`${stats.uniqueCount} uniques`);
  if (stats.mean !== undefined) parts.push(`moy: ${stats.mean.toFixed(2)}`);
  if (stats.min !== undefined && stats.max !== undefined) {
    parts.push(`[${stats.min} - ${stats.max}]`);
  }
  if (stats.nullCount && stats.nullCount > 0) {
    parts.push(`${stats.nullCount} nulls`);
  }

  return parts.join(', ');
}

function detectUnit(suggestion: SuggestedKpi, column?: ColumnMetadata): string {
  const nameLower = suggestion.name.toLowerCase();
  const categoryLower = suggestion.category?.toLowerCase() || '';

  if (nameLower.includes('%') || nameLower.includes('pourcent') || nameLower.includes('taux')) {
    return '%';
  }
  if (nameLower.includes('fcfa') || nameLower.includes('cfa') || categoryLower.includes('financ')) {
    return 'FCFA';
  }
  if (nameLower.includes('nombre') || nameLower.includes('count') || nameLower.includes('total')) {
    return '';
  }
  if (column?.detectedSemanticType === 'CURRENCY') {
    return 'FCFA';
  }
  if (column?.detectedSemanticType === 'PERCENTAGE') {
    return '%';
  }

  return '';
}

function detectFormat(column?: ColumnMetadata): string {
  if (!column) return 'number';
  
  switch (column.detectedSemanticType) {
    case 'CURRENCY':
      return 'currency';
    case 'PERCENTAGE':
      return 'percent';
    case 'QUANTITY':
      return 'integer';
    default:
      if (column.type === 'NUMBER') return 'number';
      if (column.type === 'DATE') return 'date';
      return 'text';
  }
}

// ============================================
// FONCTION UTILITAIRE POUR INSIGHTS
// ============================================

/**
 * Génère un texte d'insight personnalisé pour un KPI
 */
export async function generateKpiInsight(
  kpiName: string,
  kpiValue: number,
  kpiUnit: string,
  context: {
    organizationType: OrganizationType;
    sector: string;
    dataRange?: { min: number; max: number; avg: number };
  }
): Promise<string> {
  try {
    const zai = await ZAI.create();

    const prompt = `Génère un insight court (1-2 phrases) pour ce KPI:

- KPI: ${kpiName}
- Valeur: ${kpiValue} ${kpiUnit}
- Contexte: ${getOrganizationTypeLabel(context.organizationType)} - ${context.sector}
${context.dataRange ? `- Distribution: min=${context.dataRange.min}, max=${context.dataRange.max}, moyenne=${context.dataRange.avg}` : ''}

L'insight doit être:
- Actionnable et pertinent pour un décideur africain
- En français
- Sans jargon technique
- Maximum 2 phrases`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Tu es un analyste de données expert qui rédige des insights clairs et actionnables.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content || `${kpiName}: ${kpiValue} ${kpiUnit}`;
  } catch (error) {
    console.error('Erreur génération insight:', error);
    return `${kpiName}: ${kpiValue} ${kpiUnit}`;
  }
}

// ============================================
// EXPORT PAR DÉFAUT
// ============================================

export default {
  analyzeDataset,
  generateKpiConfigs,
  generateKpiInsight,
};
