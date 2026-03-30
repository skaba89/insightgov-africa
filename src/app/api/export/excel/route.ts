/**
 * InsightGov Africa - Excel Export API Route
 * ===========================================
 * API pour générer et télécharger des rapports Excel.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { DashboardConfig, KPIConfig } from '@/types';
import * as XLSX from 'xlsx';

/**
 * POST /api/export/excel
 * Génère un fichier Excel à partir d'une configuration dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, organizationName = 'Organisation', options = {} } = body;

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Configuration requise' },
        { status: 400 }
      );
    }

    const dashboardConfig = config as DashboardConfig;

    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new();

    // =========================================================================
    // Feuille 1: Résumé Exécutif
    // =========================================================================
    const summaryData = [
      ['InsightGov Africa - Rapport de Dashboard'],
      [''],
      ['Organisation:', organizationName],
      ['Titre:', dashboardConfig.title],
      ['Date de génération:', new Date().toLocaleDateString('fr-FR')],
      [''],
      ['=== RÉSUMÉ EXÉCUTIF ==='],
      [dashboardConfig.executiveSummary || ''],
      [''],
      ['=== STATISTIQUES CLÉS ==='],
      ['Nombre de KPIs:', dashboardConfig.kpis.length],
      ['Indicateurs clés:', dashboardConfig.kpis.filter((k: KPIConfig) => k.isKeyMetric).length],
      ['Insights:', dashboardConfig.keyInsights?.length || 0],
      ['Recommandations:', dashboardConfig.recommendations?.length || 0],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style des cellules (largeur des colonnes)
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 50 }];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

    // =========================================================================
    // Feuille 2: KPIs
    // =========================================================================
    const kpisHeaders = [
      'Titre',
      'Description',
      'Type de graphique',
      'Colonne X',
      'Colonne Y',
      'Agrégation',
      'Indicateur clé',
    ];

    const kpisData = [
      kpisHeaders,
      ...dashboardConfig.kpis.map((kpi: KPIConfig) => [
        kpi.title,
        kpi.description || '',
        kpi.chartType,
        kpi.columns?.x || '',
        kpi.columns?.y || '',
        kpi.aggregation || '',
        kpi.isKeyMetric ? 'Oui' : 'Non',
      ]),
    ];

    const kpisSheet = XLSX.utils.aoa_to_sheet(kpisData);
    kpisSheet['!cols'] = [
      { wch: 25 },
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
    ];
    
    XLSX.utils.book_append_sheet(workbook, kpisSheet, 'KPIs');

    // =========================================================================
    // Feuille 3: Insights
    // =========================================================================
    if (dashboardConfig.keyInsights && dashboardConfig.keyInsights.length > 0) {
      const insightsData = [
        ['#', 'Insight'],
        ...dashboardConfig.keyInsights.map((insight: string, index: number) => [
          index + 1,
          insight,
        ]),
      ];

      const insightsSheet = XLSX.utils.aoa_to_sheet(insightsData);
      insightsSheet['!cols'] = [{ wch: 5 }, { wch: 80 }];
      
      XLSX.utils.book_append_sheet(workbook, insightsSheet, 'Insights');
    }

    // =========================================================================
    // Feuille 4: Recommandations
    // =========================================================================
    if (dashboardConfig.recommendations && dashboardConfig.recommendations.length > 0) {
      const recsData = [
        ['#', 'Recommandation'],
        ...dashboardConfig.recommendations.map((rec: string, index: number) => [
          index + 1,
          rec,
        ]),
      ];

      const recsSheet = XLSX.utils.aoa_to_sheet(recsData);
      recsSheet['!cols'] = [{ wch: 5 }, { wch: 80 }];
      
      XLSX.utils.book_append_sheet(workbook, recsSheet, 'Recommandations');
    }

    // =========================================================================
    // Feuille 5: Filtres globaux
    // =========================================================================
    if (dashboardConfig.globalFilters && dashboardConfig.globalFilters.length > 0) {
      const filtersData = [
        ['Colonne', 'Type de filtre', 'Valeur par défaut'],
        ...dashboardConfig.globalFilters.map((filter) => [
          filter.column,
          filter.type,
          filter.defaultValue || '',
        ]),
      ];

      const filtersSheet = XLSX.utils.aoa_to_sheet(filtersData);
      filtersSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 30 }];
      
      XLSX.utils.book_append_sheet(workbook, filtersSheet, 'Filtres');
    }

    // =========================================================================
    // Générer le buffer
    // =========================================================================
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Retourner le fichier Excel
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="dashboard-${Date.now()}.xlsx"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Erreur génération Excel:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la génération du fichier Excel',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
