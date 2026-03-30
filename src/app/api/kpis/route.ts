/**
 * InsightGov Africa - KPIs API Route
 * ===================================
 * Gestion des configurations KPI générées par l'IA.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { DashboardConfig, KPIConfig } from '@/types';

/**
 * GET /api/kpis
 * Récupère les configurations KPI
 * 
 * Query params:
 * - datasetId: ID du dataset (optionnel, pour filtrer)
 * - organizationId: ID de l'organisation (pour lister tous les KPIs)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');
    const organizationId = searchParams.get('organizationId');

    if (datasetId) {
      // Récupérer les configs d'un dataset spécifique
      const configs = await db.kPIConfig.findMany({
        where: { datasetId },
        orderBy: { version: 'desc' },
        include: { dataset: true },
      });

      return NextResponse.json({
        success: true,
        configs: configs.map((c) => ({
          ...c,
          configJson: JSON.parse(c.configJson as string),
        })),
      });
    }

    if (organizationId) {
      // Récupérer tous les KPIs d'une organisation
      const datasets = await db.dataset.findMany({
        where: { organizationId },
        select: { id: true },
      });

      const datasetIds = datasets.map((d) => d.id);

      const configs = await db.kPIConfig.findMany({
        where: {
          datasetId: { in: datasetIds },
          isPublished: true,
        },
        orderBy: { generatedAt: 'desc' },
        include: { dataset: true },
      });

      return NextResponse.json({
        success: true,
        configs: configs.map((c) => ({
          ...c,
          configJson: JSON.parse(c.configJson as string),
        })),
      });
    }

    return NextResponse.json(
      { success: false, error: 'datasetId ou organizationId requis' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erreur récupération KPIs:', error);
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
 * POST /api/kpis
 * Crée une nouvelle version de configuration KPI
 * 
 * Body:
 * - datasetId: ID du dataset
 * - configJson: Configuration du dashboard
 * - isPublished: Publier immédiatement (défaut: false)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { datasetId, configJson, isPublished = false } = body;

    if (!datasetId || !configJson) {
      return NextResponse.json(
        { success: false, error: 'datasetId et configJson requis' },
        { status: 400 }
      );
    }

    // Vérifier que le dataset existe
    const dataset = await db.dataset.findUnique({
      where: { id: datasetId },
    });

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset non trouvé' },
        { status: 404 }
      );
    }

    // Obtenir le dernier numéro de version
    const lastConfig = await db.kPIConfig.findFirst({
      where: { datasetId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (lastConfig?.version || 0) + 1;

    // Créer la nouvelle configuration
    const kpiConfig = await db.kPIConfig.create({
      data: {
        datasetId,
        version: nextVersion,
        configJson: typeof configJson === 'string' ? configJson : JSON.stringify(configJson),
        isPublished,
        generatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      kpiConfig: {
        ...kpiConfig,
        configJson: JSON.parse(kpiConfig.configJson as string),
      },
    });
  } catch (error) {
    console.error('Erreur création KPI config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la création',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/kpis
 * Met à jour une configuration KPI
 * 
 * Body:
 * - id: ID de la config
 * - isPublished: Publier/Dépublier
 * - configJson: Mise à jour de la config (optionnel)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isPublished, configJson } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isPublished === 'boolean') {
      updateData.isPublished = isPublished;
    }
    if (configJson) {
      updateData.configJson = typeof configJson === 'string' ? configJson : JSON.stringify(configJson);
    }

    const kpiConfig = await db.kPIConfig.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      kpiConfig: {
        ...kpiConfig,
        configJson: JSON.parse(kpiConfig.configJson as string),
      },
    });
  } catch (error) {
    console.error('Erreur mise à jour KPI config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la mise à jour',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/kpis
 * Supprime une configuration KPI
 * 
 * Query params:
 * - id: ID de la config à supprimer
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    await db.kPIConfig.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration supprimée',
    });
  } catch (error) {
    console.error('Erreur suppression KPI config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la suppression',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/kpis/reorder
 * Réorganise l'ordre des KPIs dans une configuration
 * 
 * Body:
 * - configId: ID de la config
 * - kpiOrder: Array des IDs de KPIs dans le nouvel ordre
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { configId, kpiUpdates } = body;

    if (!configId || !kpiUpdates) {
      return NextResponse.json(
        { success: false, error: 'configId et kpiUpdates requis' },
        { status: 400 }
      );
    }

    // Récupérer la config actuelle
    const kpiConfig = await db.kPIConfig.findUnique({
      where: { id: configId },
    });

    if (!kpiConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration non trouvée' },
        { status: 404 }
      );
    }

    // Parser et mettre à jour l'ordre des KPIs
    const config: DashboardConfig = JSON.parse(kpiConfig.configJson as string);
    
    // Appliquer les mises à jour
    kpiUpdates.forEach((update: { id: string; order: number; size?: { cols: number; rows: number } }) => {
      const kpi = config.kpis.find((k) => k.id === update.id);
      if (kpi) {
        kpi.order = update.order;
        if (update.size) {
          kpi.size = update.size;
        }
      }
    });

    // Trier les KPIs par ordre
    config.kpis.sort((a, b) => a.order - b.order);

    // Sauvegarder
    const updatedConfig = await db.kPIConfig.update({
      where: { id: configId },
      data: {
        configJson: JSON.stringify(config),
      },
    });

    return NextResponse.json({
      success: true,
      config: JSON.parse(updatedConfig.configJson as string),
    });
  } catch (error) {
    console.error('Erreur réordonnancement KPIs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du réordonnancement',
      },
      { status: 500 }
    );
  }
}
