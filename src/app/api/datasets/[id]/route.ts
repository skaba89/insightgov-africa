// ============================================
// InsightGov Africa - API Dataset (single)
// Récupération, mise à jour, suppression d'un dataset
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

// ============================================
// GET /api/datasets/[id] - Détails d'un dataset
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dataset = await db.dataset.findUnique({
      where: { id },
      include: {
        kpis: {
          orderBy: { displayOrder: 'asc' },
        },
        dashboards: {
          where: { isDefault: true },
          take: 1,
        },
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            sector: true,
          },
        },
      },
    });

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset non trouvé' },
        { status: 404 }
      );
    }

    // Parser les JSON stockés
    const responseData = {
      ...dataset,
      columnsMetadata: JSON.parse(dataset.columnsMetadata as string),
      kpis: dataset.kpis.map((kpi) => ({
        ...kpi,
        configJson: JSON.parse(kpi.configJson as string),
      })),
      dashboards: dataset.dashboards.map((dashboard) => ({
        ...dashboard,
        layoutConfig: JSON.parse(dashboard.layoutConfig as string),
      })),
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Erreur GET dataset:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/datasets/[id] - Mise à jour
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    
    if (body.name) updateData.name = body.name;
    if (body.description) updateData.description = body.description;

    const dataset = await db.dataset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    console.error('Erreur PATCH dataset:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/datasets/[id] - Suppression
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer le dataset pour supprimer le fichier
    const dataset = await db.dataset.findUnique({
      where: { id },
      select: { fileUrl: true },
    });

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le fichier physique
    if (dataset.fileUrl) {
      try {
        const filePath = path.join(process.cwd(), 'public', dataset.fileUrl);
        await unlink(filePath);
      } catch {
        // Ignorer si le fichier n'existe pas
      }
    }

    // Supprimer le dataset (cascade pour KPIs et dashboards)
    await db.dataset.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Dataset supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur DELETE dataset:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
