/**
 * InsightGov Africa - AI Analysis Service
 * ========================================
 * Service d'analyse IA utilisant OpenAI GPT-4o pour:
 * - Analyser les colonnes d'un dataset
 * - Générer des configurations de dashboard
 * - Créer des insights et recommandations
 * - Support multi-année et comparaisons YoY
 */

import { getOpenAIClient, OPENAI_MODEL, SYSTEM_PROMPTS } from './openai';
import type {
  ColumnMetadata,
  DashboardConfig,
  KPIConfig,
  OrganizationType,
  Sector,
  AIAnalysisContext,
  EnhancedKPIConfig,
  EnhancedDashboardConfig,
} from '@/types';

// =============================================================================
// TYPES INTERNAUX
// =============================================================================

interface AIResponse {
  success: boolean;
  data?: DashboardConfig;
  error?: string;
  tokensUsed?: number;
}

interface ColumnAnalysisResponse {
  columns: {
    name: string;
    description: string;
    suggestedUse: string;
  }[];
}

// =============================================================================
// FONCTIONS D'ANALYSE
// =============================================================================

/**
 * Analyse les colonnes d'un dataset et génère des descriptions
 * Utilise GPT-4o pour comprendre le contexte sémantique
 */
export async function analyzeColumns(
  columns: ColumnMetadata[],
  organizationType: OrganizationType,
  sector: Sector
): Promise<ColumnAnalysisResponse> {
  const openai = getOpenAIClient();

  // Construire le contexte pour l'IA
  const columnsInfo = columns.map((col) => ({
    name: col.originalName,
    type: col.dataType,
    sampleValues: col.sampleValues.slice(0, 5),
    statistics: col.statistics,
    uniqueCount: col.statistics?.uniqueCount,
  }));

  const prompt = `
Analyse les colonnes suivantes d'un fichier de données pour une organisation de type "${organizationType}" dans le secteur "${sector}".

Colonnes à analyser:
${JSON.stringify(columnsInfo, null, 2)}

Pour chaque colonne, fournis:
1. Une description claire et concise (1-2 phrases)
2. Une suggestion d'utilisation (visualisation, filtre, agrégation, etc.)

Réponds uniquement en JSON avec ce format:
{
  "columns": [
    {
      "name": "nom_colonne",
      "description": "Description de la colonne",
      "suggestedUse": "Suggestion d'utilisation"
    }
  ]
}
`;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPTS.COLUMN_ANALYSIS,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Pas de réponse de l\'IA');
  }

  return JSON.parse(content) as ColumnAnalysisResponse;
}

/**
 * Génère une configuration complète de dashboard
 * Basée sur le contexte organisationnel et les données
 */
export async function generateDashboardConfig(
  columns: ColumnMetadata[],
  organizationType: OrganizationType,
  sector: Sector,
  sampleData: Record<string, unknown>[],
  customInstructions?: string
): Promise<AIResponse> {
  const openai = getOpenAIClient();
  const startTime = Date.now();

  try {
    // Préparer le contexte
    const context: AIAnalysisContext = {
      organizationType,
      sector,
      columns: columns.map((col) => ({
        name: col.cleanName,
        sampleValues: col.sampleValues.slice(0, 10) as (string | number | null)[],
        detectedType: col.dataType,
      })),
      rowCount: sampleData.length,
      customInstructions,
    };

    // Construire le prompt
    const prompt = `
Génère une configuration de dashboard pour les données suivantes.

CONTEXTE:
- Type d'organisation: ${organizationType}
- Secteur: ${sector}
- Nombre de lignes: ${sampleData.length}
${customInstructions ? `- Instructions personnalisées: ${customInstructions}` : ''}

COLONNES DISPONIBLES:
${JSON.stringify(context.columns, null, 2)}

ÉCHANTILLON DE DONNÉES (5 premières lignes):
${JSON.stringify(sampleData.slice(0, 5), null, 2)}

RÈGLES DE GÉNÉRATION:
1. Génère entre 6 et 10 KPIs pertinents pour le secteur ${sector}
2. Utilise les types de graphiques adaptés:
   - "bar" pour les comparaisons entre catégories
   - "line" ou "area" pour les tendances temporelles
   - "donut" ou "pie" pour les répartitions (max 6 segments)
   - "kpi" ou "metric" pour les valeurs clés
   - "table" pour les données détaillées
3. Pour chaque KPI, spécifie obligatoirement:
   - id: identifiant unique (string)
   - title: titre clair
   - chartType: type de graphique
   - columns: { x, y } avec les noms exacts des colonnes
   - order: position d'affichage (1-12)
   - size: { cols: 1-12, rows: 1-3 }
4. Ajoute un résumé exécutif et des insights clés

FORMAT DE RÉPONSE ATTENDU:
{
  "title": "Titre du Dashboard",
  "description": "Description du dashboard",
  "executiveSummary": "Résumé exécutif en 2-3 phrases",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommendations": ["Recommandation 1", "Recommandation 2"],
  "kpis": [
    {
      "id": "kpi_1",
      "title": "Titre du KPI",
      "description": "Description",
      "chartType": "bar",
      "columns": {
        "x": "nom_colonne_x",
        "y": "nom_colonne_y"
      },
      "aggregation": "sum",
      "valueFormat": {
        "prefix": "FCFA ",
        "decimals": 0
      },
      "colors": ["blue"],
      "order": 1,
      "size": { "cols": 6, "rows": 1 },
      "isKeyMetric": true
    }
  ],
  "globalFilters": [
    {
      "column": "nom_colonne",
      "label": "Label du filtre",
      "type": "select"
    }
  ]
}

GÉNÈRE MAINTENANT LA CONFIGURATION:
`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.DASHBOARD_GENERATION,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    if (!content) {
      return {
        success: false,
        error: 'Pas de réponse de l\'IA',
        tokensUsed,
      };
    }

    // Parser et valider la réponse
    let config: DashboardConfig;
    try {
      config = JSON.parse(content);
    } catch {
      return {
        success: false,
        error: 'Format de réponse invalide de l\'IA',
        tokensUsed,
      };
    }

    // Ajouter les métadonnées de génération
    config.metadata = {
      generatedAt: new Date().toISOString(),
      model: OPENAI_MODEL,
      tokensUsed,
      processingTimeMs: Date.now() - startTime,
    };

    // Valider et corriger les IDs des KPIs
    config.kpis = config.kpis.map((kpi, index) => ({
      ...kpi,
      id: kpi.id || `kpi_${index + 1}`,
      order: kpi.order || index + 1,
    }));

    return {
      success: true,
      data: config,
      tokensUsed,
    };
  } catch (error) {
    console.error('Erreur lors de la génération du dashboard:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erreur inconnue lors de l\'analyse',
      tokensUsed: 0,
    };
  }
}

/**
 * Génère un résumé exécutif des données
 */
export async function generateExecutiveSummary(
  columns: ColumnMetadata[],
  data: Record<string, unknown>[],
  organizationType: OrganizationType,
  sector: Sector
): Promise<string> {
  const openai = getOpenAIClient();

  // Calculer quelques statistiques clés
  const stats = {
    totalRows: data.length,
    columns: columns.length,
    numericColumns: columns.filter(
      (c) => c.dataType === 'numeric' || c.dataType === 'currency'
    ).length,
    dateColumns: columns.filter((c) => c.dataType === 'datetime').length,
    categoryColumns: columns.filter((c) => c.dataType === 'category').length,
  };

  const prompt = `
Génère un résumé exécutif concis (3-5 phrases) pour un dashboard destiné à une organisation de type "${organizationType}" dans le secteur "${sector}".

Statistiques du dataset:
- Nombre de lignes: ${stats.totalRows}
- Nombre de colonnes: ${stats.columns}
- Colonnes numériques: ${stats.numericColumns}
- Colonnes de dates: ${stats.dateColumns}
- Colonnes catégorielles: ${stats.categoryColumns}

Colonnes principales:
${columns
  .slice(0, 5)
  .map((c) => `- ${c.originalName} (${c.dataType})`)
  .join('\n')}

Échantillon de données:
${JSON.stringify(data.slice(0, 3), null, 2)}

Le résumé doit être professionnel, en français, et adapté à un public de décideurs africains.
Réponds uniquement avec le résumé, sans mise en forme.
`;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPTS.EXECUTIVE_SUMMARY,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Suggère des KPIs basés sur le secteur
 * Utilisé comme fallback si l'analyse IA échoue
 */
export function getSuggestedKPIsBySector(sector: Sector): Partial<KPIConfig>[] {
  const sectorKPIs: Record<Sector, Partial<KPIConfig>[]> = {
    health: [
      { title: 'Patients traités', chartType: 'bar', isKeyMetric: true },
      { title: 'Taux de vaccination', chartType: 'gauge', isKeyMetric: true },
      { title: 'Répartition par pathologie', chartType: 'donut' },
      { title: 'Évolution mensuelle des consultations', chartType: 'line' },
      { title: 'Mortalité par région', chartType: 'barList' },
    ],
    education: [
      { title: 'Taux de scolarisation', chartType: 'metric', isKeyMetric: true },
      { title: 'Effectifs par niveau', chartType: 'bar' },
      { title: 'Résultats aux examens', chartType: 'donut' },
      { title: 'Évolution des effectifs', chartType: 'area' },
      { title: 'Ratio élèves/enseignant', chartType: 'gauge' },
    ],
    agriculture: [
      { title: 'Production totale', chartType: 'metric', isKeyMetric: true },
      { title: 'Rendement par culture', chartType: 'bar' },
      { title: 'Répartition par région', chartType: 'donut' },
      { title: 'Évolution des surfaces cultivées', chartType: 'area' },
      { title: 'Prix moyens par produit', chartType: 'line' },
    ],
    finance: [
      { title: 'Recettes totales', chartType: 'metric', isKeyMetric: true },
      { title: 'Dépenses par catégorie', chartType: 'donut' },
      { title: 'Évolution budgétaire', chartType: 'area' },
      { title: 'Solde mensuel', chartType: 'bar' },
      { title: 'Taux d\'exécution', chartType: 'progressBar' },
    ],
    infrastructure: [
      { title: 'Projets réalisés', chartType: 'metric', isKeyMetric: true },
      { title: 'Kilomètres construits', chartType: 'bar' },
      { title: 'Budget exécuté', chartType: 'donut' },
      { title: 'Avancement par projet', chartType: 'barList' },
      { title: 'Évolution trimestrielle', chartType: 'area' },
    ],
    energy: [
      { title: 'Production totale', chartType: 'metric', isKeyMetric: true },
      { title: 'Taux d\'électrification', chartType: 'gauge', isKeyMetric: true },
      { title: 'Consommation par zone', chartType: 'bar' },
      { title: 'Répartition par source', chartType: 'donut' },
      { title: 'Évolution de la demande', chartType: 'line' },
    ],
    social: [
      { title: 'Bénéficiaires', chartType: 'metric', isKeyMetric: true },
      { title: 'Montants distribués', chartType: 'bar' },
      { title: 'Couverture par région', chartType: 'donut' },
      { title: 'Évolution mensuelle', chartType: 'area' },
      { title: 'Types d\'aide', chartType: 'barList' },
    ],
    environment: [
      { title: 'Émissions CO2', chartType: 'metric', isKeyMetric: true },
      { title: 'Taux de déforestation', chartType: 'gauge' },
      { title: 'Aires protégées', chartType: 'donut' },
      { title: 'Évolution annuelle', chartType: 'line' },
      { title: 'Par zone géographique', chartType: 'bar' },
    ],
    trade: [
      { title: 'Volume échanges', chartType: 'metric', isKeyMetric: true },
      { title: 'Balance commerciale', chartType: 'bar' },
      { title: 'Répartition imports/exports', chartType: 'donut' },
      { title: 'Partenaires commerciaux', chartType: 'barList' },
      { title: 'Évolution mensuelle', chartType: 'area' },
    ],
    mining: [
      { title: 'Production minière', chartType: 'metric', isKeyMetric: true },
      { title: 'Redevances perçues', chartType: 'bar' },
      { title: 'Répartition par minerai', chartType: 'donut' },
      { title: 'Emplois créés', chartType: 'area' },
      { title: 'Sites actifs', chartType: 'barList' },
    ],
    transport: [
      { title: 'Passagers transportés', chartType: 'metric', isKeyMetric: true },
      { title: 'Tonnage', chartType: 'bar' },
      { title: 'Ponctualité', chartType: 'gauge' },
      { title: 'Évolution mensuelle', chartType: 'line' },
      { title: 'Par type de transport', chartType: 'donut' },
    ],
    telecom: [
      { title: 'Abonnés actifs', chartType: 'metric', isKeyMetric: true },
      { title: 'Taux de couverture', chartType: 'gauge' },
      { title: 'Par opérateur', chartType: 'donut' },
      { title: 'Évolution abonnés', chartType: 'area' },
      { title: 'Débit moyen', chartType: 'bar' },
    ],
    other: [
      { title: 'Total', chartType: 'metric', isKeyMetric: true },
      { title: 'Répartition', chartType: 'donut' },
      { title: 'Évolution', chartType: 'line' },
      { title: 'Par catégorie', chartType: 'bar' },
      { title: 'Détails', chartType: 'barList' },
    ],
  };

  return sectorKPIs[sector] || sectorKPIs.other;
}

/**
 * Génère une configuration de fallback si l'IA échoue
 */
export function generateFallbackConfig(
  columns: ColumnMetadata[],
  organizationType: OrganizationType,
  sector: Sector,
  data: Record<string, unknown>[]
): DashboardConfig {
  // Identifier les colonnes clés
  const numericColumns = columns.filter(
    (c) => c.dataType === 'numeric' || c.dataType === 'currency' || c.dataType === 'percentage'
  );
  const categoryColumns = columns.filter((c) => c.dataType === 'category');
  const dateColumns = columns.filter(
    (c) => c.dataType === 'datetime' || c.dataType === 'date'
  );
  const geoColumns = columns.filter((c) => c.dataType === 'geo');

  // Obtenir les KPIs suggérés pour le secteur
  const suggestedKPIs = getSuggestedKPIsBySector(sector);

  // Générer des KPIs basiques
  const kpis: KPIConfig[] = [];

  // Fonction helper pour obtenir le nom d'affichage
  const getDisplayName = (col: ColumnMetadata): string => {
    return col.originalName || col.name || col.cleanName || 'Valeur';
  };

  // Fonction helper pour obtenir le nom de colonne de données
  const getDataColumnName = (col: ColumnMetadata): string => {
    return col.cleanName || col.name || '';
  };

  // KPI 1: Métrique principale (somme de la première colonne numérique)
  if (numericColumns.length > 0) {
    const mainCol = numericColumns[0];
    kpis.push({
      id: 'kpi_main',
      title: getDisplayName(mainCol),
      description: `Total de ${getDisplayName(mainCol)}`,
      chartType: 'metric',
      columns: { y: getDataColumnName(mainCol) },
      aggregation: 'sum',
      valueFormat: {
        decimals: 0,
        compact: true,
      },
      colors: ['blue'],
      order: 1,
      size: { cols: 3, rows: 1 },
      isKeyMetric: true,
    });
  }

  // KPI 2: Deuxième métrique si disponible
  if (numericColumns.length > 1) {
    const secondCol = numericColumns[1];
    kpis.push({
      id: 'kpi_second',
      title: getDisplayName(secondCol),
      description: `Total de ${getDisplayName(secondCol)}`,
      chartType: 'metric',
      columns: { y: getDataColumnName(secondCol) },
      aggregation: 'sum',
      valueFormat: {
        decimals: 0,
        compact: true,
      },
      colors: ['emerald'],
      order: 2,
      size: { cols: 3, rows: 1 },
      isKeyMetric: true,
    });
  }

  // KPI 3: Gauge si pourcentage disponible
  const percentageCol = columns.find(c => c.dataType === 'percentage');
  if (percentageCol) {
    kpis.push({
      id: 'kpi_gauge',
      title: getDisplayName(percentageCol),
      description: `${getDisplayName(percentageCol)} moyen`,
      chartType: 'gauge',
      columns: { y: getDataColumnName(percentageCol) },
      aggregation: 'avg',
      valueFormat: {
        suffix: '%',
        decimals: 1,
      },
      thresholds: {
        target: 80,
        warning: 60,
      },
      colors: ['blue'],
      order: 3,
      size: { cols: 3, rows: 1 },
      isKeyMetric: true,
    });
  }

  // KPI 4: Bar chart (catégorie vs numérique)
  if (categoryColumns.length > 0 && numericColumns.length > 0) {
    kpis.push({
      id: 'kpi_bar',
      title: `${getDisplayName(numericColumns[0])} par ${getDisplayName(categoryColumns[0])}`,
      description: 'Comparaison par catégorie',
      chartType: 'bar',
      columns: {
        x: getDataColumnName(categoryColumns[0]),
        y: getDataColumnName(numericColumns[0]),
      },
      aggregation: 'sum',
      colors: ['blue'],
      order: 4,
      size: { cols: 6, rows: 2 },
      isKeyMetric: false,
    });
  }

  // KPI 5: Donut (répartition par catégorie)
  if (categoryColumns.length > 0) {
    kpis.push({
      id: 'kpi_donut',
      title: `Répartition par ${getDisplayName(categoryColumns[0])}`,
      description: 'Distribution des catégories',
      chartType: 'donut',
      columns: { x: getDataColumnName(categoryColumns[0]) },
      aggregation: 'count',
      colors: ['blue', 'emerald', 'violet', 'amber', 'rose'],
      order: 5,
      size: { cols: 4, rows: 2 },
      isKeyMetric: false,
    });
  }

  // KPI 6: Line chart (si colonne de date)
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    kpis.push({
      id: 'kpi_line',
      title: `Évolution temporelle`,
      description: `Évolution de ${getDisplayName(numericColumns[0])} dans le temps`,
      chartType: 'line',
      columns: {
        x: getDataColumnName(dateColumns[0]),
        y: getDataColumnName(numericColumns[0]),
      },
      aggregation: 'sum',
      colors: ['emerald'],
      order: 6,
      size: { cols: 12, rows: 2 },
      isKeyMetric: false,
    });
  }

  // Ajouter les KPIs suggérés du secteur
  suggestedKPIs.slice(0, 3).forEach((suggested, index) => {
    if (kpis.length < 8) {
      const colForSuggestion = numericColumns.length > 0 ? numericColumns[0] : columns[0];
      kpis.push({
        id: `kpi_suggested_${index}`,
        title: suggested.title || `KPI ${index + 1}`,
        description: suggested.title || '',
        chartType: suggested.chartType || 'bar',
        columns: numericColumns.length > 0 ? { y: getDataColumnName(colForSuggestion) } : {},
        colors: ['blue'],
        order: kpis.length + 1,
        size: { cols: 4, rows: 1 },
        isKeyMetric: suggested.isKeyMetric || false,
      });
    }
  });

  // Construire la configuration
  const config: DashboardConfig = {
    version: '1.0',
    title: `Dashboard ${sector}`,
    description: `Tableau de bord pour le secteur ${sector}`,
    executiveSummary: `Ce dashboard présente les indicateurs clés pour votre organisation dans le secteur ${sector}. Les données ont été analysées automatiquement.`,
    keyInsights: [
      `${data.length} enregistrements analysés`,
      `${columns.length} colonnes détectées`,
      `${numericColumns.length} indicateurs numériques disponibles`,
    ],
    recommendations: [
      'Vérifiez que les colonnes sont correctement interprétées',
      'Ajoutez des filtres pour affiner l\'analyse',
      'Exportez le dashboard en PDF pour le partage',
    ],
    kpis,
    globalFilters: categoryColumns.slice(0, 3).map((col) => ({
      column: getDataColumnName(col),
      label: getDisplayName(col),
      type: 'select' as const,
    })),
    metadata: {
      generatedAt: new Date().toISOString(),
      model: 'fallback',
      tokensUsed: 0,
      processingTimeMs: 0,
    },
  };

  return config;
}

// =============================================================================
// ENHANCED DASHBOARD CONFIG GENERATION
// =============================================================================

/**
 * Détecte les années dans les données
 */
export function detectYearsInData(
  columns: ColumnMetadata[],
  data: Record<string, unknown>[]
): number[] {
  const years = new Set<number>();
  
  columns.forEach(col => {
    const colName = col.cleanName || col.name;
    const colLower = colName.toLowerCase();
    
    // Vérifier si c'est une colonne d'année
    if (
      colLower.includes('annee') ||
      colLower.includes('année') ||
      colLower.includes('year') ||
      col.dataType === 'datetime' ||
      col.dataType === 'date'
    ) {
      data.forEach(row => {
        const value = row[colName];
        if (typeof value === 'number' && value > 1900 && value < 2100) {
          years.add(value);
        } else if (typeof value === 'string') {
          // Extraire l'année d'une date
          const yearMatch = value.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) {
            years.add(parseInt(yearMatch[0]));
          }
        } else if (value instanceof Date) {
          years.add(value.getFullYear());
        }
      });
    }
  });
  
  return Array.from(years).sort((a, b) => a - b);
}

/**
 * Détecte les dimensions géographiques dans les données
 */
export function detectGeographyDimensions(
  columns: ColumnMetadata[]
): string[] {
  return columns
    .filter(col => {
      const colLower = (col.cleanName || col.name).toLowerCase();
      return (
        col.dataType === 'geo' ||
        colLower.includes('region') ||
        colLower.includes('région') ||
        colLower.includes('pays') ||
        colLower.includes('country') ||
        colLower.includes('district') ||
        colLower.includes('ville') ||
        colLower.includes('city') ||
        colLower.includes('prefecture') ||
        colLower.includes('département') ||
        colLower.includes('province')
      );
    })
    .map(col => col.cleanName || col.name);
}

/**
 * Génère des KPIs avec support multi-année
 */
export function generateMultiYearKPIs(
  baseKPIs: KPIConfig[],
  years: number[],
  timeColumn?: string
): EnhancedKPIConfig[] {
  return baseKPIs.map(kpi => {
    const enhancedKpi: EnhancedKPIConfig = {
      ...kpi,
      supportsMultiYear: years.length > 1,
      defaultYearComparison: years.length > 1 ? 'yoy' : 'none',
    };
    
    if (timeColumn && years.length > 1) {
      enhancedKpi.detectedDimensions = {
        time: timeColumn,
      };
    }
    
    return enhancedKpi;
  });
}

/**
 * Génère une configuration de dashboard étendue avec support multi-année
 */
export function generateEnhancedDashboardConfig(
  columns: ColumnMetadata[],
  organizationType: OrganizationType,
  sector: Sector,
  data: Record<string, unknown>[]
): EnhancedDashboardConfig {
  // Détecter les années disponibles
  const availableYears = detectYearsInData(columns, data);
  
  // Détecter les dimensions géographiques
  const geoDimensions = detectGeographyDimensions(columns);
  
  // Générer la configuration de base
  const baseConfig = generateFallbackConfig(columns, organizationType, sector, data);
  
  // Identifier la colonne de temps
  const timeColumn = columns.find(col => {
    const colLower = (col.cleanName || col.name).toLowerCase();
    return (
      col.dataType === 'datetime' ||
      col.dataType === 'date' ||
      colLower.includes('annee') ||
      colLower.includes('année') ||
      colLower.includes('year')
    );
  });
  
  // Enrichir les KPIs avec le support multi-année
  const enhancedKPIs = generateMultiYearKPIs(
    baseConfig.kpis,
    availableYears,
    timeColumn?.cleanName || timeColumn?.name
  );
  
  // Ajouter des KPIs de comparaison si plusieurs années
  if (availableYears.length > 1) {
    // KPI de tendance annuelle
    const numericColumns = columns.filter(
      c => c.dataType === 'numeric' || c.dataType === 'currency' || c.dataType === 'percentage'
    );
    
    if (numericColumns.length > 0) {
      const mainCol = numericColumns[0];
      const colName = mainCol.cleanName || mainCol.name;
      
      // Ajouter KPI de comparaison YoY
      enhancedKPIs.push({
        id: 'kpi_yoy_comparison',
        title: `Évolution ${mainCol.originalName || colName}`,
        description: `Comparaison année sur année de ${mainCol.originalName || colName}`,
        chartType: 'line',
        columns: {
          x: timeColumn?.cleanName || timeColumn?.name || 'year',
          y: colName,
        },
        aggregation: 'sum',
        order: enhancedKPIs.length + 1,
        size: { cols: 6, rows: 2 },
        isKeyMetric: true,
        supportsMultiYear: true,
        defaultYearComparison: 'yoy',
        detectedDimensions: {
          time: timeColumn?.cleanName || timeColumn?.name,
        },
      });
      
      // Ajouter KPI de variation
      enhancedKPIs.push({
        id: 'kpi_year_variation',
        title: 'Variation annuelle',
        description: `Variation en pourcentage par rapport à l'année précédente`,
        chartType: 'bar',
        columns: {
          x: timeColumn?.cleanName || timeColumn?.name || 'year',
          y: colName,
        },
        aggregation: 'sum',
        valueFormat: {
          suffix: '%',
          decimals: 1,
        },
        order: enhancedKPIs.length + 1,
        size: { cols: 4, rows: 2 },
        isKeyMetric: false,
        supportsMultiYear: true,
        defaultYearComparison: 'yoy',
      });
    }
  }
  
  // Construire la configuration étendue
  const enhancedConfig: EnhancedDashboardConfig = {
    ...baseConfig,
    availableYears,
    availablePeriods: [], // Peut être calculé ultérieurement
    detectedDimensions: {
      time: timeColumn?.cleanName || timeColumn?.name,
      geography: geoDimensions,
      categories: columns
        .filter(c => c.dataType === 'category')
        .map(c => c.cleanName || c.name),
    },
    kpis: enhancedKPIs,
    defaultFilters: {
      years: availableYears.length > 0 ? [availableYears[availableYears.length - 1]] : [],
      periods: [],
      quarters: [],
      months: [],
      geographies: [],
      organizations: [],
      projects: [],
      indicators: [],
      customFilters: {},
    },
    comparisonOptions: availableYears.length > 1 ? {
      enabled: false,
      type: 'yoy',
      baselineYear: availableYears[0],
      comparisonYears: availableYears.slice(1),
    } : undefined,
  };
  
  return enhancedConfig;
}
