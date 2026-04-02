/**
 * InsightGov Africa - Analyze API Route
 * ======================================
 * Analyse un dataset et génère une configuration de dashboard.
 * Utilise le service BI Expert optimisé pour des réponses rapides.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateExpertDashboard, generateAutoInsights } from '@/lib/ai/bi-expert';
import { generateFallbackConfig } from '@/lib/ai/analysis';
import { getDatasetData } from '@/lib/data-cache';
import { detectSector, detectOrganizationType } from '@/lib/ai/sector-detection';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
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
  // Vérifier l'authentification
  const authResult = await requireAuth(request, 'write');
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const auth = authResult.auth;

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

    // Valider l'UUID
    const uuidError = validateUUID(datasetId);
    if (uuidError) {
      return uuidError;
    }

    // Vérifier que la base de données est disponible
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Base de données non disponible' },
        { status: 503 }
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

    // Vérifier l'appartenance à l'organisation (sauf pour les owners/admins)
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (dataset.organizationId && auth.organizationId !== dataset.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé. Ce dataset n\'appartient pas à votre organisation.' },
          { status: 403 }
        );
      }
    }

    // Journalisation pour audit
    console.log(`[Analyze] User ${auth.email} (${auth.userId}) analyzing dataset: ${datasetId}`);

    // Mettre à jour le statut
    await db.dataset.update({
      where: { id: datasetId },
      data: { status: 'analyzing' },
    });

    // Parser les métadonnées des colonnes
    const columnsMetadata: ColumnMetadata[] = JSON.parse(
      dataset.columnsMetadata as string
    );

    // Récupérer les VRAIES données du fichier depuis le cache
    let actualData = getDatasetData(datasetId);
    
    // Si pas de données en cache, générer des données de démonstration
    const sampleData = actualData || generateSampleData(columnsMetadata, 100);
    const isUsingRealData = actualData !== null;

    // Détection automatique du secteur si non fourni
    let detectedSector = sector as Sector;
    let sectorConfidence = 1.0;
    let autoDetectedSector: { sector: Sector; confidence: number; detectedKeywords: string[] } | null = null;

    if (!sector || sector === 'other') {
      autoDetectedSector = detectSector(columnsMetadata, sampleData);
      detectedSector = autoDetectedSector.sector;
      sectorConfidence = autoDetectedSector.confidence;
      console.log(`[Analyze] Secteur auto-détecté: ${detectedSector} (confiance: ${(sectorConfidence * 100).toFixed(1)}%)`);
    }

    // Détection automatique du type d'organisation si non fourni
    let detectedOrgType = organizationType as OrganizationType;
    if (!organizationType) {
      const orgDetection = detectOrganizationType(columnsMetadata, sampleData);
      detectedOrgType = orgDetection.type;
      console.log(`[Analyze] Type org auto-détecté: ${detectedOrgType} (confiance: ${(orgDetection.confidence * 100).toFixed(1)}%)`);
    }

    // Lancer l'analyse IA avec le service BI Expert optimisé
    let config: DashboardConfig;
    let tokensUsed = 0;
    let usedFallback = false;
    let fromCache = false;

    try {
      // Utiliser le service BI Expert pour une analyse rapide et professionnelle
      const result = await generateExpertDashboard(
        columnsMetadata,
        detectedOrgType,
        detectedSector,
        sampleData
      );
      
      config = result.config;
      fromCache = result.fromCache;

      // Ajouter les informations de détection automatique à la config
      if (autoDetectedSector) {
        config.keyInsights = config.keyInsights || [];
        config.keyInsights.unshift(
          `🔍 Secteur détecté automatiquement: ${detectedSector} (${(sectorConfidence * 100).toFixed(0)}% de confiance)`
        );
        if (autoDetectedSector.detectedKeywords.length > 0) {
          config.keyInsights.push(
            `Mots-clés détectés: ${autoDetectedSector.detectedKeywords.slice(0, 5).join(', ')}`
          );
        }
      }

      if (isUsingRealData) {
        config.keyInsights = config.keyInsights || [];
        config.keyInsights.unshift(`📊 Analyse basée sur ${sampleData.length} lignes de données réelles`);
      }

      // Générer des insights automatiques supplémentaires
      const autoInsights = await generateAutoInsights(sampleData, columnsMetadata);
      if (autoInsights.length > 0 && config.keyInsights) {
        config.keyInsights = [...config.keyInsights, ...autoInsights.slice(0, 3)];
      }
    } catch (aiError) {
      console.error('Erreur BI Expert, utilisation du fallback:', aiError);
      config = generateFallbackConfig(
        columnsMetadata,
        detectedOrgType,
        detectedSector,
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
        userId: auth.userId,
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
        fromCache,
        columnCount: columnsMetadata.length,
        rowCount: dataset.rowCount,
        isUsingRealData,
        detectedSector: autoDetectedSector ? {
          sector: detectedSector,
          confidence: sectorConfidence,
          keywords: autoDetectedSector.detectedKeywords,
        } : null,
        userId: auth.userId,
        organizationId: auth.organizationId,
      },
    });
  } catch (error) {
    console.error('Erreur analyse:', error);

    // Marquer le dataset en erreur si possible
    try {
      const body = await request.clone().json();
      if (body.datasetId && db) {
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
  // Vérifier l'authentification
  const authResult = await requireAuth(request, 'read');
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const auth = authResult.auth;

  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');

    if (!datasetId) {
      return NextResponse.json(
        { success: false, error: 'ID dataset requis' },
        { status: 400 }
      );
    }

    // Valider l'UUID
    const uuidError = validateUUID(datasetId);
    if (uuidError) {
      return uuidError;
    }

    // Vérifier que la base de données est disponible
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Base de données non disponible' },
        { status: 503 }
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

    // Vérifier l'appartenance à l'organisation (sauf pour les owners/admins)
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (kpiConfig.dataset.organizationId && auth.organizationId !== kpiConfig.dataset.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé. Ce dataset n\'appartient pas à votre organisation.' },
          { status: 403 }
        );
      }
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
        userId: auth.userId,
        organizationId: auth.organizationId,
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
      const colName = col.cleanName || col.originalName || `column_${columns.indexOf(col)}`;
      
      switch (col.dataType) {
        case 'numeric':
          // Générer des nombres aléatoires dans la plage détectée
          const min = col.statistics?.min ?? 0;
          const max = col.statistics?.max ?? 1000;
          row[colName] = Math.round(
            min + Math.random() * (max - min)
          );
          break;

        case 'currency':
          // Générer des montants
          row[colName] = Math.round(Math.random() * 1000000);
          break;

        case 'percentage':
          // Générer des pourcentages
          row[colName] = Math.round(Math.random() * 100);
          break;

        case 'category':
          // Utiliser les valeurs uniques si disponibles
          if (col.uniqueValues && col.uniqueValues.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * col.uniqueValues.length
            );
            row[colName] = col.uniqueValues[randomIndex];
          } else {
            row[colName] = `Catégorie ${Math.floor(Math.random() * 5) + 1}`;
          }
          break;

        case 'datetime':
        case 'date':
          // Générer des dates dans les 12 derniers mois
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 365));
          row[colName] = date.toISOString().split('T')[0];
          break;

        case 'boolean':
          row[colName] = Math.random() > 0.5;
          break;

        case 'geo':
          const countries = [
            'Sénégal', 'Mali', 'Burkina Faso', 'Niger', 'Côte d\'Ivoire',
            'Bénin', 'Togo', 'Guinée', 'Mauritanie', 'Cameroun'
          ];
          row[colName] = countries[Math.floor(Math.random() * countries.length)];
          break;

        default:
          // Utiliser les exemples si disponibles
          if (col.sampleValues && col.sampleValues.length > 0) {
            row[colName] = col.sampleValues[i % col.sampleValues.length];
          } else {
            row[colName] = `Valeur ${i + 1}`;
          }
      }
    });

    data.push(row);
  }

  return data;
}
