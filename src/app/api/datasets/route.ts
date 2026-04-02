/**
 * InsightGov Africa - Datasets API Route
 * =======================================
 * Gestion CRUD des datasets (fichiers uploadés).
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, validateUUID, checkPlanLimit } from '@/lib/auth-middleware';
import type { ColumnMetadata } from '@/types';

// ============================================
// GET /api/datasets
// Liste tous les datasets d'une organisation
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const includeConfig = searchParams.get('includeConfig') === 'true';

    // Si pas d'organizationId, utiliser celui de l'utilisateur
    const targetOrgId = organizationId || auth.organizationId;

    if (!targetOrgId) {
      return NextResponse.json(
        { success: false, error: 'Aucune organisation associée à votre compte.' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(targetOrgId);
    if (uuidError) return uuidError;

    // Vérifier que l'utilisateur appartient à cette organisation
    // (sauf owners/admins qui peuvent voir toutes les organisations)
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (auth.organizationId !== targetOrgId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
    }

    const whereClause: Record<string, unknown> = { organizationId: targetOrgId };
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
          } as any
        : undefined,
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
      { success: false, error: 'Erreur lors de la récupération des datasets' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/datasets
// Crée un nouveau dataset
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (write permission)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { 
      name, 
      originalFileName, 
      fileUrl, 
      fileSize, 
      fileType, 
      rowCount, 
      columnCount, 
      columnsMetadata,
      organizationId 
    } = body;

    // Validation des champs requis
    if (!name || !originalFileName || !fileUrl) {
      return NextResponse.json(
        { success: false, error: 'name, originalFileName et fileUrl sont requis' },
        { status: 400 }
      );
    }

    // Utiliser l'organisation de l'utilisateur si non spécifiée
    const targetOrgId = organizationId || auth.organizationId;

    if (!targetOrgId) {
      return NextResponse.json(
        { success: false, error: 'Aucune organisation associée.' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(targetOrgId);
    if (uuidError) return uuidError;

    // Vérifier que l'utilisateur appartient à cette organisation
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (auth.organizationId !== targetOrgId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
    }

    // Vérifier les limites du plan
    const planCheck = await checkPlanLimit(targetOrgId, 'datasets');
    if (!planCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: planCheck.message || 'Limite du plan atteinte',
          code: 'PLAN_LIMIT_EXCEEDED' 
        },
        { status: 402 }
      );
    }

    // Créer le dataset
    const dataset = await db.dataset.create({
      data: {
        name,
        originalFileName,
        fileUrl,
        fileSize: fileSize || 0,
        fileType: fileType || 'csv',
        rowCount: rowCount || 0,
        columnCount: columnCount || 0,
        columnsMetadata: JSON.stringify(columnsMetadata || []),
        status: 'pending',
        userId: auth.userId,
        organizationId: targetOrgId,
      },
    });

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: targetOrgId,
        action: 'upload',
        entityType: 'dataset',
        entityId: dataset.id,
        metadata: JSON.stringify({ 
          fileName: originalFileName, 
          fileSize,
          rowCount 
        }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

    return NextResponse.json({
      success: true,
      dataset: {
        ...dataset,
        columnsMetadata: JSON.parse(dataset.columnsMetadata as string),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur création dataset:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du dataset' },
      { status: 500 }
    );
  }
}
