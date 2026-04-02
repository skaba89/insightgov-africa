// ============================================
// InsightGov Africa - API KPI (single)
// Mise à jour et suppression d'un KPI
// SÉCURISÉ avec authentification et vérification d'appartenance
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';

// ============================================
// GET /api/kpis/[id] - Détails d'un KPI
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { id } = await params;

    // Validation UUID
    const uuidError = validateUUID(id);
    if (uuidError) return uuidError;

    const kpi = await db.kPI.findUnique({
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

    // Vérification d'appartenance (sauf pour owners/admins)
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (kpi.dataset.organizationId !== auth.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
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
  // Vérification d'authentification (write permission)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { id } = await params;

    // Validation UUID
    const uuidError = validateUUID(id);
    if (uuidError) return uuidError;

    // Vérifier que le KPI existe et appartient à l'organisation
    const existingKpi = await db.kPI.findUnique({
      where: { id },
      include: {
        dataset: {
          select: { organizationId: true, name: true },
        },
      },
    });

    if (!existingKpi) {
      return NextResponse.json(
        { success: false, error: 'KPI non trouvé' },
        { status: 404 }
      );
    }

    // Vérification d'appartenance (sauf pour owners/admins)
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (existingKpi.dataset.organizationId !== auth.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    // Champs autorisés pour la mise à jour
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.value !== undefined) updateData.value = body.value;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.trend !== undefined) updateData.trend = body.trend;
    if (body.trendValue !== undefined) updateData.trendValue = body.trendValue;
    if (body.configJson !== undefined) updateData.configJson = JSON.stringify(body.configJson);
    if (body.insightText !== undefined) updateData.insightText = body.insightText;
    if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;

    const kpi = await db.kPI.update({
      where: { id },
      data: updateData,
    });

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'update',
        entityType: 'kpi',
        entityId: id,
        metadata: JSON.stringify({ 
          datasetName: existingKpi.dataset.name,
          updatedFields: Object.keys(updateData) 
        }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

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
  // Vérification d'authentification (delete permission)
  const authResult = await requireAuth(request, 'delete');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { id } = await params;

    // Validation UUID
    const uuidError = validateUUID(id);
    if (uuidError) return uuidError;

    // Vérifier que le KPI existe et appartient à l'organisation
    const existingKpi = await db.kPI.findUnique({
      where: { id },
      include: {
        dataset: {
          select: { organizationId: true, name: true },
        },
      },
    });

    if (!existingKpi) {
      return NextResponse.json(
        { success: false, error: 'KPI non trouvé' },
        { status: 404 }
      );
    }

    // Vérification d'appartenance (sauf pour owners/admins)
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (existingKpi.dataset.organizationId !== auth.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
    }

    await db.kPI.delete({
      where: { id },
    });

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'delete',
        entityType: 'kpi',
        entityId: id,
        metadata: JSON.stringify({ 
          datasetName: existingKpi.dataset.name,
          kpiName: existingKpi.name 
        }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

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
