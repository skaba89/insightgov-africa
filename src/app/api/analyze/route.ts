/**
 * InsightGov Africa - Analyze API Route
 * ======================================
 * Analyse un dataset avec GPT-4o et génère une configuration de dashboard.
 * Étape 2 du pipeline: Traitement IA.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  generateDashboardConfig,
  generateFallbackConfig,
} from '@/lib/ai/analysis';
import type { ColumnMetadata, OrganizationType, Sector, DashboardConfig } from '@/types';

/**
 * POST /api/analyze
 * Lance l'analyse IA d'un dataset et génère les KPIs
 * 
 * Request body:
 * - datasetId: ID du dataset à analyser
 * - organizationType: Type d'organisation (ministry, ngo, enterprise)
 * - sector: Secteur d'activité
 * - customInstructions: Instructions personnalisées (optionnel)
 * 
 * Response:
 * - success: boolean
 * - config: DashboardConfig générée
 * - tokensUsed: Nombre de tokens utilisés
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { datasetId, organizationType, sector, customInstructions } = body;

    // Validations
    if (!datasetId) {
      return NextResponse.json(
        { success: false, error: 'ID dataset requis' },
        { status: 400 }
      );
    }

    if (!organizationType || !sector) {
      return NextResponse.json(
        { success: false, error: 'Type d\'organisation et secteur requis' },
        { status: 400 }
      );
    }

    // Récupérer le dataset
    const dataset = await db.dataset.findUnique({
      where: { id: datasetId },
      include: { organization: true },
    });

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le statut
    await db.dataset.update({
      where: { id: datasetId },
      data: { status: 'analyzing' },
    });

    // Parser les métadonnées des colonnes
    const columnsMetadata: ColumnMetadata[] = JSON.parse(
      dataset.columnsMetadata as string
    );

    // Générer des données de démonstration pour l'analyse
    // En production, on récupérerait les vraies données depuis le cache/storage
    const sampleData = generateSampleData(columnsMetadata, 100);

    // Lancer l'analyse IA
    let config: DashboardConfig;
    let tokensUsed = 0;
    let usedFallback = false;

    try {
      const aiResult = await generateDashboardConfig(
        columnsMetadata,
        organizationType as OrganizationType,
        sector as Sector,
        sampleData,
        customInstructions
      );

      if (aiResult.success && aiResult.data) {
        config = aiResult.data;
        tokensUsed = aiResult.tokensUsed || 0;
      } else {
        // Utiliser le fallback si l'IA échoue
        console.warn('IA échouée, utilisation du fallback:', aiResult.error);
        config = generateFallbackConfig(
          columnsMetadata,
          organizationType as OrganizationType,
          sector as Sector,
          sampleData
        );
        usedFallback = true;
      }
    } catch (aiError) {
      console.error('Erreur IA, utilisation du fallback:', aiError);
      config = generateFallbackConfig(
        columnsMetadata,
        organizationType as OrganizationType,
        sector as Sector,
        sampleData
      );
      usedFallback = true;
    }

    // Enrichir les métadonnées des colonnes avec les descriptions de l'IA
    const enrichedColumns = columnsMetadata.map((col) => {
      const kpiDescription = config.kpis.find(
        (k) => k.columns.x === col.cleanName || k.columns.y === col.cleanName
      );
      return {
        ...col,
        description: kpiDescription?.description || col.description,
      };
    });

    // Sauvegarder la configuration KPI
    const kpiConfig = await db.kPIConfig.create({
      data: {
        datasetId,
        version: 1,
        configJson: JSON.stringify(config),
        isPublished: true,
        generatedAt: new Date(),
      },
    });

    // Mettre à jour le dataset
    await db.dataset.update({
      where: { id: datasetId },
      data: {
        status: 'ready',
        analyzedAt: new Date(),
        columnsMetadata: JSON.stringify(enrichedColumns),
      },
    });

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      config,
      metadata: {
        datasetId,
        kpiConfigId: kpiConfig.id,
        tokensUsed,
        processingTimeMs: processingTime,
        usedFallback,
        columnCount: columnsMetadata.length,
        rowCount: dataset.rowCount,
      },
    });
  } catch (error) {
    console.error('Erreur analyse:', error);

    // Marquer le dataset en erreur si possible
    try {
      const body = await request.clone().json();
      if (body.datasetId) {
        await db.dataset.update({
          where: { id: body.datasetId },
          data: {
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
          },
        });
      }
    } catch {
      // Ignore update errors
    }

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
 * GET /api/analyze
 * Récupère la configuration d'un dataset
 * 
 * Query params:
 * - datasetId: ID du dataset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');

    if (!datasetId) {
      return NextResponse.json(
        { success: false, error: 'ID dataset requis' },
        { status: 400 }
      );
    }

    // Récupérer la dernière configuration publiée
    const kpiConfig = await db.kPIConfig.findFirst({
      where: {
        datasetId,
        isPublished: true,
      },
      orderBy: { version: 'desc' },
      include: { dataset: true },
    });

    if (!kpiConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration non trouvée' },
        { status: 404 }
      );
    }

    const config: DashboardConfig = JSON.parse(kpiConfig.configJson as string);

    return NextResponse.json({
      success: true,
      config,
      metadata: {
        id: kpiConfig.id,
        version: kpiConfig.version,
        generatedAt: kpiConfig.generatedAt,
        datasetStatus: kpiConfig.dataset.status,
      },
    });
  } catch (error) {
    console.error('Erreur récupération config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération',
      },
      { status: 500 }
    );
  }
}

/**
 * Génère des données de démonstration basées sur les métadonnées
 * Utilisé pour l'analyse IA quand les vraies données ne sont pas disponibles
 */
function generateSampleData(
  columns: ColumnMetadata[],
  rowCount: number
): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];

  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, unknown> = {};

    columns.forEach((col) => {
      switch (col.dataType) {
        case 'numeric':
          // Générer des nombres aléatoires dans la plage détectée
          const min = col.statistics?.min ?? 0;
          const max = col.statistics?.max ?? 1000;
          row[col.cleanName] = Math.round(
            min + Math.random() * (max - min)
          );
          break;

        case 'currency':
          // Générer des montants
          row[col.cleanName] = Math.round(Math.random() * 1000000);
          break;

        case 'percentage':
          // Générer des pourcentages
          row[col.cleanName] = Math.round(Math.random() * 100);
          break;

        case 'category':
          // Utiliser les valeurs uniques si disponibles
          if (col.uniqueValues && col.uniqueValues.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * col.uniqueValues.length
            );
            row[col.cleanName] = col.uniqueValues[randomIndex];
          } else {
            row[col.cleanName] = `Catégorie ${Math.floor(Math.random() * 5) + 1}`;
          }
          break;

        case 'datetime':
        case 'date':
          // Générer des dates dans les 12 derniers mois
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 365));
          row[col.cleanName] = date.toISOString().split('T')[0];
          break;

        case 'boolean':
          row[col.cleanName] = Math.random() > 0.5;
          break;

        case 'geo':
          const countries = [
            'Sénégal', 'Mali', 'Burkina Faso', 'Niger', 'Côte d\'Ivoire',
            'Bénin', 'Togo', 'Guinée', 'Mauritanie', 'Cameroun'
          ];
          row[col.cleanName] = countries[Math.floor(Math.random() * countries.length)];
          break;

        default:
          // Utiliser les exemples si disponibles
          if (col.sampleValues.length > 0) {
            row[col.cleanName] = col.sampleValues[i % col.sampleValues.length];
          } else {
            row[col.cleanName] = `Valeur ${i + 1}`;
          }
      }
    });

    data.push(row);
  }

  return data;
}
