/**
 * InsightGov Africa - BI Expert Service
 * ======================================
 * Service d'analyse Business Intelligence expert
 * Optimisé pour des réponses rapides et des insights professionnels
 */

import { getZAIClient } from './z-ai-client';
import type { ColumnMetadata, DashboardConfig, KPIConfig, OrganizationType, Sector } from '@/types';

// =============================================================================
// CACHE POUR OPTIMISATION
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.timestamp < entry.ttl) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

// =============================================================================
// SYSTÈME DE PROMPTS EXPERT BI
// =============================================================================

const BI_EXPERT_SYSTEM_PROMPT = `Tu es un EXPERT en Business Intelligence et Data Visualization avec 15+ ans d'expérience.

 Tes expertises:
- Analyse de données pour le secteur public et privé en Afrique
- Création de dashboards exécutifs et KPIs actionnables
- Visualisation de données moderne avec chart.js, recharts, tremor
- Storytelling avec les données pour décideurs

RÈGLES D'OR:
1. TOUJOURS fournir des insights actionnables, pas juste des descriptions
2. Identifier les tendances, anomalies et opportunités
3. Suggérer les visualisations LES PLUS appropriées
4. Utiliser le contexte africain (FCFA, régions, secteurs locaux)
5. Être concis et professionnel

TYPES DE GRAPHIQUES RECOMMANDÉS:
- bar: Comparaisons entre catégories (top 10, classements)
- line: Évolutions temporelles, tendances
- area: Tendances avec volume
- donut: Répartitions (max 6 segments)
- gauge: Indicateurs de performance (0-100%)
- metric: KPIs clés en grand
- table: Données détaillées
- sparkline: Mini tendances inline
- heatmap: Densité / corrélations
- treemap: Hiérarchies volumétriques
- waterfall: Évolutions cumulées
- bullet: Performance vs objectif`;

const DASHBOARD_EXPERT_PROMPT = `En tant qu'expert BI, génère une configuration de dashboard OPTIMISÉE.

STRUCTURE OPTIMALE (layout 12 colonnes):
┌─────────────────────────────────────────────────────────────┐
│  [KPI 1]  [KPI 2]  [KPI 3]  [KPI 4]  (4 cols each, 1 row)  │
├─────────────────────────────────────────────────────────────┤
│  [Chart Principal - 8 cols]    [Donut - 4 cols]            │
├─────────────────────────────────────────────────────────────┤
│  [Tableau détaillé - 12 cols]                               │
└─────────────────────────────────────────────────────────────┘

RÈGLES DE DESIGN:
1. Commencer par 4 KPIs clés (chiffres impactants)
2. Ajouter 1-2 graphiques de tendance
3. Inclure 1 répartition (donut/pie)
4. Terminer par un tableau de données
5. MAX 8 visualisations pour éviter la surcharge

COULEURS RECOMMANDÉES (palette africaine moderne):
- Primaire: #0EA5E9 (sky-500), #10B981 (emerald-500)
- Accent: #F59E0B (amber-500), #EF4444 (red-500)
- Neutre: #6366F1 (indigo-500), #8B5CF6 (violet-500)`;

// =============================================================================
// FONCTIONS D'ANALYSE RAPIDE
// =============================================================================

/**
 * Génère rapidement une config dashboard optimisée
 * Avec fallback instantané si l'IA est lente
 */
export async function generateExpertDashboard(
  columns: ColumnMetadata[],
  organizationType: OrganizationType,
  sector: Sector,
  sampleData: Record<string, unknown>[]
): Promise<{ config: DashboardConfig; fromCache: boolean }> {
  const cacheKey = `dashboard_${JSON.stringify(columns.map(c => c.cleanName))}_${sector}`;
  
  // Vérifier le cache
  const cached = getCached<DashboardConfig>(cacheKey);
  if (cached) {
    return { config: cached, fromCache: true };
  }

  // Préparer les données pour l'analyse
  const analysisContext = prepareAnalysisContext(columns, sampleData);
  
  // Lancer l'analyse IA avec timeout court
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s max

  try {
    const zai = await getZAIClient();
    
    const response = await Promise.race([
      zai.chat.completions.create({
        messages: [
          { role: 'system', content: BI_EXPERT_SYSTEM_PROMPT },
          { role: 'system', content: DASHBOARD_EXPERT_PROMPT },
          { 
            role: 'user', 
            content: `Analyse ces données et génère UN dashboard optimal:

SECTEUR: ${sector}
TYPE ORG: ${organizationType}
LIGNES: ${sampleData.length}

COLONNES:
${analysisContext.columnsSummary}

ÉCHANTILLON:
${JSON.stringify(sampleData.slice(0, 3), null, 2)}

RÉPONSE JSON EXACTE:
{
  "title": "Titre Dashboard",
  "executiveSummary": "Résumé en 2 phrases",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "kpis": [...],
  "recommendations": ["Action 1", "Action 2"]
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      )
    ]);

    clearTimeout(timeout);

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const config = JSON.parse(jsonMatch ? jsonMatch[0] : content) as DashboardConfig;
        
        // Valider et enrichir la config
        const enrichedConfig = enrichDashboardConfig(config, columns, sector);
        
        // Mettre en cache
        setCache(cacheKey, enrichedConfig, 10 * 60 * 1000); // 10 minutes
        
        return { config: enrichedConfig, fromCache: false };
      } catch {
        // Fallback
      }
    }
  } catch (error) {
    clearTimeout(timeout);
    console.log('[BI Expert] IA timeout ou erreur, utilisation du générateur rapide');
  }

  // Générateur rapide de fallback
  const quickConfig = generateQuickDashboard(columns, organizationType, sector, sampleData);
  return { config: quickConfig, fromCache: false };
}

/**
 * Prépare le contexte d'analyse
 */
function prepareAnalysisContext(
  columns: ColumnMetadata[],
  sampleData: Record<string, unknown>[]
): { columnsSummary: string; dataProfile: string } {
  const numericCols = columns.filter(c => ['numeric', 'currency', 'percentage'].includes(c.dataType));
  const categoryCols = columns.filter(c => c.dataType === 'category');
  const dateCols = columns.filter(c => ['datetime', 'date'].includes(c.dataType));
  const geoCols = columns.filter(c => c.dataType === 'geo');

  const columnsSummary = columns.map(c => {
    const stats = c.statistics;
    let summary = `- ${c.cleanName} (${c.dataType})`;
    if (stats?.min !== undefined && stats?.max !== undefined) {
      summary += ` [${stats.min} - ${stats.max}]`;
    }
    if (c.uniqueValues?.length) {
      summary += ` {${c.uniqueValues.slice(0, 3).join(', ')}...}`;
    }
    return summary;
  }).join('\n');

  return { columnsSummary, dataProfile: '' };
}

/**
 * Enrichit la config générée
 */
function enrichDashboardConfig(
  config: DashboardConfig,
  columns: ColumnMetadata[],
  sector: Sector
): DashboardConfig {
  // S'assurer que chaque KPI a les champs requis
  config.kpis = config.kpis.map((kpi, index) => ({
    ...kpi,
    id: kpi.id || `kpi_${index + 1}`,
    order: kpi.order || index + 1,
    size: kpi.size || getDefaultSize(kpi.chartType, index),
    colors: kpi.colors || getDefaultColors(sector),
    isKeyMetric: kpi.isKeyMetric ?? (index < 4),
  }));

  // Ajouter les métadonnées
  config.metadata = {
    generatedAt: new Date().toISOString(),
    model: 'bi-expert-v2',
    tokensUsed: 0,
    processingTimeMs: 0,
  };

  return config;
}

/**
 * Taille par défaut selon le type de graphique
 */
function getDefaultSize(chartType: string, index: number): { cols: number; rows: number } {
  if (chartType === 'metric' || chartType === 'gauge') {
    return { cols: 3, rows: 1 };
  }
  if (chartType === 'donut' || chartType === 'pie') {
    return { cols: 4, rows: 2 };
  }
  if (chartType === 'table') {
    return { cols: 12, rows: 2 };
  }
  if (index === 4) { // Graphique principal
    return { cols: 8, rows: 2 };
  }
  return { cols: 6, rows: 2 };
}

/**
 * Couleurs par défaut selon le secteur
 */
function getDefaultColors(sector: Sector): string[] {
  const sectorColors: Record<Sector, string[]> = {
    health: ['emerald', 'teal', 'cyan', 'green'],
    education: ['blue', 'indigo', 'sky', 'violet'],
    agriculture: ['green', 'lime', 'emerald', 'amber'],
    finance: ['blue', 'indigo', 'slate', 'cyan'],
    infrastructure: ['amber', 'orange', 'yellow', 'stone'],
    energy: ['yellow', 'amber', 'orange', 'red'],
    social: ['rose', 'pink', 'fuchsia', 'violet'],
    environment: ['green', 'emerald', 'teal', 'lime'],
    trade: ['blue', 'cyan', 'sky', 'indigo'],
    mining: ['amber', 'stone', 'slate', 'zinc'],
    transport: ['violet', 'purple', 'fuchsia', 'indigo'],
    telecom: ['blue', 'cyan', 'sky', 'violet'],
    other: ['blue', 'emerald', 'amber', 'violet'],
  };
  return sectorColors[sector] || sectorColors.other;
}

/**
 * Générateur rapide de dashboard (fallback instantané)
 */
function generateQuickDashboard(
  columns: ColumnMetadata[],
  organizationType: OrganizationType,
  sector: Sector,
  sampleData: Record<string, unknown>[]
): DashboardConfig {
  const numericCols = columns.filter(c => ['numeric', 'currency', 'percentage'].includes(c.dataType));
  const categoryCols = columns.filter(c => c.dataType === 'category');
  const dateCols = columns.filter(c => ['datetime', 'date'].includes(c.dataType));

  const kpis: KPIConfig[] = [];
  const colors = getDefaultColors(sector);

  // Helper pour créer un titre user-friendly
  const createUserFriendlyTitle = (colName: string, sector: Sector): string => {
    const name = colName.toLowerCase();
    
    // Mapping pour des titres plus parlants
    const sectorLabels: Record<Sector, Record<string, string>> = {
      health: {
        'patients': 'Nombre de Patients',
        'consultations': 'Consultations Totales',
        'hospitalisations': 'Hospitalisations',
        'deces': 'Décès Enregistrés',
        'deaths': 'Décès',
        'vaccinations': 'Vaccinations',
        'vaccines': 'Vaccins Administrés',
        'cas': 'Cas Signalés',
        'cases': 'Cas Confirmés',
        'medecins': 'Médecins',
        'infirmiers': 'Infirmiers',
        'lits': 'Lits Disponibles',
        'beds': 'Lits',
      },
      education: {
        'eleves': 'Élèves Inscrits',
        'etudiants': 'Étudiants',
        'enseignants': 'Enseignants',
        'professeurs': 'Professeurs',
        'classes': 'Classes',
        'ecoles': 'Écoles',
        'schools': 'Écoles',
        'inscrits': 'Inscrits',
        'admis': 'Admis',
        'reussite': 'Taux de Réussite',
        'effectif': 'Effectif Total',
      },
      agriculture: {
        'production': 'Production Totale',
        'rendement': 'Rendement Moyen',
        'surface': 'Surface Cultivée',
        'hectares': 'Hectares',
        'recolte': 'Récolte',
        'ferme': 'Fermes',
        'agriculteurs': 'Agriculteurs',
      },
      finance: {
        'budget': 'Budget Total',
        'depenses': 'Dépenses',
        'recettes': 'Recettes',
        'revenus': 'Revenus',
        'credit': 'Crédits',
        'montant': 'Montant Total',
        'transactions': 'Transactions',
      },
      other: {},
      infrastructure: {},
      energy: {},
      social: {},
      environment: {},
      trade: {},
      mining: {},
      transport: {},
      telecom: {},
    };
    
    // Chercher dans le mapping du secteur
    const sectorMap = sectorLabels[sector] || {};
    for (const [key, label] of Object.entries(sectorMap)) {
      if (name.includes(key)) return label;
    }
    
    // Nettoyer le nom de la colonne
    return colName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  };

  // KPI 1-4: Métriques clés avec valeurs calculées
  numericCols.slice(0, 4).forEach((col, i) => {
    const values = sampleData
      .map(row => Number(row[col.cleanName || col.name || '']))
      .filter(v => !isNaN(v) && v !== 0);
    
    const total = values.reduce((sum, val) => sum + val, 0);
    const avg = values.length > 0 ? total / values.length : 0;
    
    // Utiliser le titre user-friendly
    const friendlyTitle = createUserFriendlyTitle(col.originalName || col.cleanName || `Métrique ${i + 1}`, sector);
    
    kpis.push({
      id: `kpi_${i + 1}`,
      title: friendlyTitle,
      description: values.length > 0 
        ? `Total: ${total.toLocaleString('fr-FR')} | Moyenne: ${avg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`
        : 'Aucune donnée disponible',
      chartType: 'metric',
      columns: { y: col.cleanName || '' },
      aggregation: 'sum',
      valueFormat: col.dataType === 'currency' 
        ? { prefix: 'FCFA ', decimals: 0, compact: true }
        : { decimals: 0, compact: true },
      colors: [colors[i % colors.length]],
      order: i + 1,
      size: { cols: 3, rows: 1 },
      isKeyMetric: true,
    });
  });

  // KPI 5: Bar chart (catégorie vs numérique)
  if (categoryCols.length > 0 && numericCols.length > 0) {
    const categoryTitle = createUserFriendlyTitle(categoryCols[0].originalName || categoryCols[0].cleanName || 'Catégorie', sector);
    const valueTitle = createUserFriendlyTitle(numericCols[0].originalName || numericCols[0].cleanName || 'Valeur', sector);
    
    kpis.push({
      id: 'kpi_bar',
      title: `${valueTitle} par ${categoryTitle}`,
      description: 'Comparaison par catégorie',
      chartType: 'bar',
      columns: {
        x: categoryCols[0].cleanName || '',
        y: numericCols[0].cleanName || '',
      },
      aggregation: 'sum',
      colors,
      order: 5,
      size: { cols: 8, rows: 2 },
      isKeyMetric: false,
    });
  }

  // KPI 6: Donut
  if (categoryCols.length > 0) {
    const categoryTitle = createUserFriendlyTitle(categoryCols[0].originalName || categoryCols[0].cleanName || 'Catégorie', sector);
    
    kpis.push({
      id: 'kpi_donut',
      title: `Répartition par ${categoryTitle}`,
      description: 'Distribution des catégories',
      chartType: 'donut',
      columns: { x: categoryCols[0].cleanName || '' },
      aggregation: 'count',
      colors,
      order: 6,
      size: { cols: 4, rows: 2 },
      isKeyMetric: false,
    });
  }

  // KPI 7: Line chart temporel
  if (dateCols.length > 0 && numericCols.length > 0) {
    const valueTitle = createUserFriendlyTitle(numericCols[0].originalName || numericCols[0].cleanName || 'Valeur', sector);
    
    kpis.push({
      id: 'kpi_trend',
      title: `Évolution - ${valueTitle}`,
      description: 'Tendance sur la période',
      chartType: 'line',
      columns: {
        x: dateCols[0].cleanName || '',
        y: numericCols[0].cleanName || '',
      },
      aggregation: 'sum',
      colors: [colors[0]],
      order: 7,
      size: { cols: 12, rows: 2 },
      isKeyMetric: false,
    });
  }

  // Construire la config
  return {
    version: '2.0',
    title: `Dashboard ${sector.charAt(0).toUpperCase() + sector.slice(1)}`,
    description: `Analyse pour ${organizationType} - Secteur ${sector}`,
    executiveSummary: `Ce dashboard présente ${sampleData.length} enregistrements analysés pour le secteur ${sector}. Les KPIs clés ont été identifiés automatiquement.`,
    keyInsights: [
      `${sampleData.length} enregistrements analysés`,
      `${numericCols.length} indicateurs numériques disponibles`,
      `${categoryCols.length} dimensions catégorielles`,
    ],
    recommendations: [
      'Explorez les graphiques pour découvrir les tendances',
      'Utilisez les filtres pour affiner l\'analyse',
      'Exportez en PDF pour partager avec votre équipe',
    ],
    kpis,
    globalFilters: categoryCols.slice(0, 3).map(col => ({
      column: col.cleanName || '',
      label: col.originalName || col.cleanName || 'Filtre',
      type: 'select' as const,
    })),
    metadata: {
      generatedAt: new Date().toISOString(),
      model: 'quick-generator-v2',
      tokensUsed: 0,
      processingTimeMs: 50,
    },
  };
}

// =============================================================================
// INSIGHTS AUTOMATIQUES
// =============================================================================

/**
 * Génère des insights automatiques sur les données
 */
export async function generateAutoInsights(
  data: Record<string, unknown>[],
  columns: ColumnMetadata[]
): Promise<string[]> {
  const insights: string[] = [];
  
  // Calculs rapides
  const numericCols = columns.filter(c => ['numeric', 'currency', 'percentage'].includes(c.dataType));
  
  for (const col of numericCols.slice(0, 3)) {
    const values = data
      .map(row => Number(row[col.cleanName || '']) || 0)
      .filter(v => v !== 0);
    
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      insights.push(
        `${col.originalName || col.cleanName}: Total ${sum.toLocaleString('fr-FR')}, Moyenne ${avg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}, Max ${max.toLocaleString('fr-FR')}`
      );
    }
  }

  // Détection d'anomalies simples
  for (const col of numericCols.slice(0, 2)) {
    const values = data.map(row => Number(row[col.cleanName || '']) || 0);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length);
    
    const anomalies = values.filter(v => Math.abs(v - avg) > 2 * stdDev).length;
    if (anomalies > 0) {
      insights.push(`⚠️ ${anomalies} valeurs anormales détectées dans ${col.originalName || col.cleanName}`);
    }
  }

  return insights;
}

export default {
  generateExpertDashboard,
  generateAutoInsights,
};
