// ============================================
// InsightGov Africa - API KPI (single)
// Mise à jour et suppression d'un KPI
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================
// GET /api/kpis/[id] - Détails d'un KPI
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const kpi = await db.kpi.findUnique({
      where: { id },
      include: {
        dataset: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
    });

    if (!kpi) {
      return NextResponse.json(
        { success: false, error: 'KPI non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...kpi,
        configJson: JSON.parse(kpi.configJson as string),
      },
    });
  } catch (error) {
    console.error('Erreur GET kpi:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/kpis/[id] - Mise à jour
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
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category) updateData.category = body.category;
    if (body.value !== undefined) updateData.value = body.value;
    if (body.unit) updateData.unit = body.unit;
    if (body.trend) updateData.trend = body.trend;
    if (body.trendValue !== undefined) updateData.trendValue = body.trendValue;
    if (body.configJson) updateData.configJson = JSON.stringify(body.configJson);
    if (body.insightText !== undefined) updateData.insightText = body.insightText;
    if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;

    const kpi = await db.kpi.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: kpi,
    });
  } catch (error) {
    console.error('Erreur PATCH kpi:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/kpis/[id] - Suppression
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.kpi.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'KPI supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur DELETE kpi:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
