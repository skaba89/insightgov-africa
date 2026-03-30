/**
 * InsightGov Africa - AI Data Cleaning API Route
 * ===============================================
 * API pour le nettoyage automatique des données.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  cleanDataWithAI,
  analyzeDataQuality,
  applyCleaningOperations,
} from '@/lib/ai/data-cleaning';

/**
 * POST /api/ai/clean
 * Analyse et nettoie les données
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, context, operations, action } = body;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Données requises' },
        { status: 400 }
      );
    }

    const columns = Object.keys(data[0] || {});

    switch (action) {
      case 'analyze':
        // Analyze data quality only
        const issues = await analyzeDataQuality(data, columns);

        return NextResponse.json({
          success: true,
          issues,
          summary: {
            totalIssues: issues.length,
            criticalIssues: issues.filter(i => i.severity === 'critical').length,
            highIssues: issues.filter(i => i.severity === 'high').length,
            autoFixableIssues: issues.filter(i => i.autoFixable).length,
          },
        });

      case 'apply':
        // Apply specific cleaning operations
        if (!operations || !Array.isArray(operations)) {
          return NextResponse.json(
            { success: false, error: 'Opérations de nettoyage requises' },
            { status: 400 }
          );
        }

        const cleanedData = applyCleaningOperations(data, operations);

        return NextResponse.json({
          success: true,
          cleanedData,
          operationsApplied: operations.filter(o => o.applied).length,
        });

      case 'auto':
      default:
        // Full automatic cleaning
        const result = await cleanDataWithAI(data, context);

        return NextResponse.json({
          success: true,
          ...result,
          cleanedData: applyCleaningOperations(
            data,
            result.operations.filter(o => o.confidence >= 0.8).map(o => ({ ...o, applied: true }))
          ),
        });
    }
  } catch (error) {
    console.error('Erreur nettoyage données:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du nettoyage des données',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/clean
 * Retourne les opérations de nettoyage disponibles
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    operations: [
      {
        type: 'fill_missing',
        name: 'Remplir valeurs manquantes',
        description: 'Remplace les valeurs manquantes par la moyenne, médiane ou mode',
        autoFixable: true,
      },
      {
        type: 'remove_outliers',
        name: 'Supprimer valeurs aberrantes',
        description: 'Détecte et corrige les valeurs aberrantes (winsorization)',
        autoFixable: true,
      },
      {
        type: 'deduplicate',
        name: 'Supprimer doublons',
        description: 'Supprime les lignes en double',
        autoFixable: true,
      },
      {
        type: 'standardize_format',
        name: 'Standardiser formats',
        description: 'Standardise les formats (dates, téléphones, etc.)',
        autoFixable: true,
      },
      {
        type: 'correct_type',
        name: 'Corriger types',
        description: 'Convertit les colonnes dans le bon type de données',
        autoFixable: true,
      },
      {
        type: 'transform',
        name: 'Transformer',
        description: 'Applique des transformations personnalisées',
        autoFixable: false,
      },
    ],
    contextOptions: {
      organizationType: ['ministry', 'ngo', 'enterprise'],
      sectors: [
        'health', 'education', 'agriculture', 'finance', 'infrastructure',
        'energy', 'social', 'environment', 'trade', 'mining', 'transport', 'telecom', 'other',
      ],
    },
  });
}
