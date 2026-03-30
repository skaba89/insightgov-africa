/**
 * InsightGov Africa - Datasets API Route
 * =======================================
 * Gestion CRUD des datasets (fichiers uploadés).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireOwnership } from '@/lib/security';
import type { ColumnMetadata } from '@/types';

/**
 * GET /api/datasets
 * Liste tous les datasets d'une organisation
 * 
 * Query params:
 * - organizationId: ID de l'organisation (requis)
 * - status: Filtrer par statut (optionnel)
 * - includeConfig: Inclure la configuration KPI (optionnel)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const includeConfig = searchParams.get('includeConfig') === 'true';

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'ID organisation requis' },
        { status: 400 }
      );
    }

    // Vérifier l'autorisation d'accès à cette organisation
    const ownershipCheck = await requireOwnership(organizationId);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }

    const whereClause: Record<string, unknown> = { organizationId };
    if (status) {
      whereClause.status = status;
    }

    const datasets = await db.dataset.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: includeConfig
        ? {
            kpiConfigs: {
              where: { isPublished: true },
              orderBy: { version: 'desc' },
              take: 1,
            },
          }
        : false,
    });

    // Transformer les données pour le frontend
    const transformedDatasets = datasets.map((dataset) => {
      const result: Record<string, unknown> = {
        ...dataset,
        columnsMetadata: JSON.parse(dataset.columnsMetadata as string),
        hasConfig: false,
      };

      if (includeConfig && dataset.kpiConfigs && dataset.kpiConfigs.length > 0) {
        result.hasConfig = true;
        result.latestConfig = JSON.parse(dataset.kpiConfigs[0].configJson as string);
      }

      return result;
    });

    return NextResponse.json({
      success: true,
      count: transformedDatasets.length,
      datasets: transformedDatasets,
    });
  } catch (error) {
    console.error('Erreur récupération datasets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des datasets',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/datasets/[id]
 * Récupère un dataset spécifique
 */
export async function GET_BY_ID(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dataset = await db.dataset.findUnique({
      where: { id },
      include: {
        organization: true,
        kpiConfigs: {
          orderBy: { version: 'desc' },
          take: 5,
        },
      },
    });

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dataset: {
        ...dataset,
        columnsMetadata: JSON.parse(dataset.columnsMetadata as string),
        kpiConfigs: dataset.kpiConfigs.map((k) => ({
          ...k,
          configJson: JSON.parse(k.configJson as string),
        })),
      },
    });
  } catch (error) {
    console.error('Erreur récupération dataset:', error);
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
 * PATCH /api/datasets/[id]
 * Met à jour un dataset
 * 
 * Body:
 * - name: Nouveau nom
 * - status: Nouveau statut
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, status, columnsMetadata } = body;

    // Construire les données à mettre à jour
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (columnsMetadata) {
      updateData.columnsMetadata = JSON.stringify(columnsMetadata);
    }

    const dataset = await db.dataset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      dataset: {
        ...dataset,
        columnsMetadata: JSON.parse(dataset.columnsMetadata as string),
      },
    });
  } catch (error) {
    console.error('Erreur mise à jour dataset:', error);
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
 * DELETE /api/datasets/[id]
 * Supprime un dataset et ses configurations associées
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier que le dataset existe
    const dataset = await db.dataset.findUnique({
      where: { id },
    });

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer les KPIs associés d'abord (cascade)
    await db.kPIConfig.deleteMany({
      where: { datasetId: id },
    });

    // Supprimer le dataset
    await db.dataset.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Dataset supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur suppression dataset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la suppression',
      },
      { status: 500 }
    );
  }
}
