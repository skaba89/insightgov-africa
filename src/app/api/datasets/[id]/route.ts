// ============================================
// InsightGov Africa - API Dataset (single)
// Récupération, mise à jour, suppression d'un dataset
// SÉCURISÉ avec authentification et vérification d'appartenance
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';
import { requireResourceAccess, validateUUID, requireAuth } from '@/lib/auth-middleware';

// ============================================
// GET /api/datasets/[id] - Détails d'un dataset
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validation UUID
    const uuidError = validateUUID(id);
    if (uuidError) return uuidError;

    // Vérification d'authentification et d'accès
    const result = await requireResourceAccess(request, 'dataset', id, 'read');
    if (!result.success) return (result as any).response;

    const { resource: existingDataset } = result;

    // Récupérer le dataset complet avec ses relations
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
      } as any,
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
      kpis: (dataset as any).kpis?.map((kpi: any) => ({
        ...kpi,
        configJson: JSON.parse(kpi.configJson as string),
      })) || [],
      dashboards: (dataset as any).dashboards?.map((dashboard: any) => ({
        ...dashboard,
        layoutConfig: JSON.parse(dashboard.layoutConfig as string),
      })) || [],
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

    // Validation UUID
    const uuidError = validateUUID(id);
    if (uuidError) return uuidError;

    // Vérification d'authentification et d'accès (write permission)
    const result = await requireResourceAccess(request, 'dataset', id, 'write');
    if (!result.success) return (result as any).response;

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    
    // Champs autorisés pour la mise à jour
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;

    const dataset = await db.dataset.update({
      where: { id },
      data: updateData,
    });

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: result.auth.userId,
        organizationId: result.auth.organizationId,
        action: 'update',
        entityType: 'dataset',
        entityId: id,
        metadata: JSON.stringify({ updatedFields: Object.keys(updateData) }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

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

    // Validation UUID
    const uuidError = validateUUID(id);
    if (uuidError) return uuidError;

    // Vérification d'authentification et d'accès (delete permission)
    const result = await requireResourceAccess(request, 'dataset', id, 'delete');
    if (!result.success) return (result as any).response;

    // Récupérer le dataset pour supprimer le fichier
    const dataset = await db.dataset.findUnique({
      where: { id },
      select: { fileUrl: true, name: true },
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

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: result.auth.userId,
        organizationId: result.auth.organizationId,
        action: 'delete',
        entityType: 'dataset',
        entityId: id,
        metadata: JSON.stringify({ datasetName: dataset.name }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

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
