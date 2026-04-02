/**
 * InsightGov Africa - Direct Analyze API Route
 * ==============================================
 * Analyse les données directement et génère un dashboard dynamique
 * Détecte automatiquement le secteur si non fourni
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectSector, detectOrganizationType } from '@/lib/ai/sector-detection';
import { generateExpertDashboard, generateAutoInsights } from '@/lib/ai/bi-expert';
import { requireAuth } from '@/lib/auth-middleware';
import type { ColumnMetadata, OrganizationType, Sector, DashboardConfig } from '@/types';

/**
 * POST /api/analyze-direct
 * Analyse directe des données avec détection automatique de secteur
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  const authResult = await requireAuth(request, 'read');
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const auth = authResult.auth;

  const startTime = Date.now();

  try {
    const body = await request.json();
    const { 
      columnsMetadata, 
      data, 
      organizationType: providedOrgType, 
      sector: providedSector,
    } = body;

    // Validation
    if (!columnsMetadata || !Array.isArray(columnsMetadata)) {
      return NextResponse.json(
        { success: false, error: 'Métadonnées de colonnes requises' },
        { status: 400 }
      );
    }

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: 'Données requises' },
        { status: 400 }
      );
    }

    // Journalisation pour audit
    console.log(`[Analyze-Direct] User ${auth.email} (${auth.userId}) requested direct analysis`);

    const columns = columnsMetadata as ColumnMetadata[];
    const sampleData = data;

    // Détection automatique du secteur si non fourni
    let sector: Sector = providedSector as Sector;
    let sectorConfidence = 1;
    let detectedKeywords: string[] = [];

    if (!sector || sector === 'other') {
      const detection = detectSector(columns, sampleData);
      sector = detection.sector;
      sectorConfidence = detection.confidence;
      detectedKeywords = detection.detectedKeywords;
      console.log(`[Analyze] Secteur détecté: ${sector} (confiance: ${(sectorConfidence * 100).toFixed(1)}%)`);
    }

    // Détection automatique du type d'organisation si non fourni
    let organizationType: OrganizationType = providedOrgType as OrganizationType;
    let orgTypeConfidence = 1;

    if (!organizationType || organizationType === 'other') {
      const detection = detectOrganizationType(columns, sampleData);
      organizationType = detection.type;
      orgTypeConfidence = detection.confidence;
      console.log(`[Analyze] Type org détecté: ${organizationType} (confiance: ${(orgTypeConfidence * 100).toFixed(1)}%)`);
    }

    // Générer le dashboard dynamique
    let config: DashboardConfig;
    let fromCache = false;

    try {
      const result = await generateExpertDashboard(
        columns,
        organizationType,
        sector,
        sampleData
      );
      
      config = result.config;
      fromCache = result.fromCache;

      // Générer des insights automatiques
      const autoInsights = await generateAutoInsights(sampleData, columns);
      if (autoInsights.length > 0) {
        config.keyInsights = [...(config.keyInsights || []), ...autoInsights];
      }

      // Ajouter les informations de détection
      (config as any).detectedContext = {
        sector,
        sectorConfidence,
        organizationType,
        orgTypeConfidence,
        detectedKeywords: detectedKeywords.slice(0, 10),
      };

    } catch (error) {
      console.error('[Analyze] Erreur génération dashboard:', error);
      
      // Fallback: générer un dashboard basique
      config = generateFallbackDashboard(columns, sampleData, sector, organizationType);
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      config,
      metadata: {
        processingTimeMs: processingTime,
        fromCache,
        detection: {
          sector,
          sectorConfidence,
          organizationType,
          orgTypeConfidence,
          detectedKeywords,
        },
        dataStats: {
          rowCount: sampleData.length,
          columnCount: columns.length,
          numericColumns: columns.filter(c => c.dataType && ['numeric', 'currency', 'percentage'].includes(c.dataType)).length,
          categoryColumns: columns.filter(c => c.dataType === 'category').length,
          dateColumns: columns.filter(c => c.dataType && ['datetime', 'date'].includes(c.dataType)).length,
        },
        userId: auth.userId,
        organizationId: auth.organizationId,
        executedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[Analyze] Erreur:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'analyse',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * Génère un dashboard de fallback basé sur les données réelles
 */
function generateFallbackDashboard(
  columns: ColumnMetadata[],
  data: Record<string, unknown>[],
  sector: Sector,
  organizationType: OrganizationType
): DashboardConfig {
  const numericCols = columns.filter(c => c.dataType && ['numeric', 'currency', 'percentage'].includes(c.dataType));
  const categoryCols = columns.filter(c => c.dataType === 'category');
  const dateCols = columns.filter(c => c.dataType && ['datetime', 'date'].includes(c.dataType));

  const kpis: DashboardConfig['kpis'] = [];

  // Calculer les statistiques réelles pour les KPIs
  const calculateAggregation = (
    col: ColumnMetadata,
    aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min'
  ): number => {
    const values = data
      .map(row => Number(row[col.cleanName || '']))
      .filter(v => !isNaN(v));

    if (values.length === 0) return 0;

    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'count':
        return values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  };

  // Générer les KPIs basés sur les données réelles
  numericCols.slice(0, 4).forEach((col, index) => {
    const total = calculateAggregation(col, 'sum');
    const avg = calculateAggregation(col, 'avg');
    
    kpis.push({
      id: `kpi_${index + 1}`,
      title: col.originalName || col.cleanName || `Indicateur ${index + 1}`,
      description: `Total: ${total.toLocaleString('fr-FR')} | Moyenne: ${avg.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`,
      chartType: 'metric',
      columns: { y: col.cleanName || '' },
      aggregation: 'sum',
      valueFormat: col.dataType === 'currency' 
        ? { prefix: 'FCFA ', decimals: 0, compact: true }
        : { decimals: 0, compact: true },
      colors: ['blue'],
      order: index + 1,
      size: { cols: 3, rows: 1 },
      isKeyMetric: index < 2,
    });
  });

  // Ajouter un graphique à barres si on a des catégories et des nombres
  if (categoryCols.length > 0 && numericCols.length > 0) {
    kpis.push({
      id: 'kpi_bar',
      title: `${numericCols[0].originalName || 'Valeur'} par ${categoryCols[0].originalName || 'Catégorie'}`,
      description: 'Top 10 catégories',
      chartType: 'bar',
      columns: {
        x: categoryCols[0].cleanName || '',
        y: numericCols[0].cleanName || '',
      },
      aggregation: 'sum',
      colors: ['emerald'],
      order: kpis.length + 1,
      size: { cols: 6, rows: 2 },
      isKeyMetric: false,
    });
  }

  // Ajouter un donut pour la répartition
  if (categoryCols.length > 0) {
    kpis.push({
      id: 'kpi_donut',
      title: `Répartition par ${categoryCols[0].originalName || 'Catégorie'}`,
      description: 'Distribution des catégories',
      chartType: 'donut',
      columns: { x: categoryCols[0].cleanName || '' },
      aggregation: 'count',
      colors: ['emerald', 'blue', 'amber', 'violet', 'rose', 'teal'],
      order: kpis.length + 1,
      size: { cols: 4, rows: 2 },
      isKeyMetric: false,
    });
  }

  // Ajouter un graphique de tendance si on a des dates
  if (dateCols.length > 0 && numericCols.length > 0) {
    kpis.push({
      id: 'kpi_trend',
      title: 'Évolution temporelle',
      description: `Évolution de ${numericCols[0].originalName || 'la valeur'} dans le temps`,
      chartType: 'line',
      columns: {
        x: dateCols[0].cleanName || '',
        y: numericCols[0].cleanName || '',
      },
      aggregation: 'sum',
      colors: ['blue'],
      order: kpis.length + 1,
      size: { cols: 12, rows: 2 },
      isKeyMetric: false,
    });
  }

  return {
    version: '2.0',
    title: `Dashboard ${sector !== 'other' ? sector : 'Analyse'}`,
    description: `Analyse automatique pour ${organizationType !== 'other' ? organizationType : 'votre organisation'}`,
    executiveSummary: `Ce dashboard présente l'analyse de ${data.length} enregistrements. ${columns.length} colonnes ont été analysées dont ${numericCols.length} indicateurs numériques.`,
    keyInsights: [
      `${data.length} enregistrements analysés`,
      `${numericCols.length} indicateurs numériques disponibles`,
      categoryCols.length > 0 ? `${categoryCols.length} dimensions catégorielles détectées` : '',
      dateCols.length > 0 ? `Données temporelles disponibles (${dateCols.length} colonnes)` : '',
    ].filter(Boolean) as string[],
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
      model: 'auto-detect-v2',
      tokensUsed: 0,
      processingTimeMs: 100,
    },
  };
}
