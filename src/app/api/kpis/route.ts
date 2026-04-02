/**
 * InsightGov Africa - KPIs API Route
 * ===================================
 * Gestion des configurations KPI générées par l'IA.
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import type { DashboardConfig, KPIConfig } from '@/types';

// ============================================
// GET /api/kpis
// Récupère les configurations KPI
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');
    const organizationId = searchParams.get('organizationId');

    // Vérifier que l'organizationId correspond à l'utilisateur
    if (organizationId && organizationId !== auth.organizationId) {
      // Seuls les owners/admins peuvent voir les KPIs d'autres organisations
      if (auth.role !== 'owner' && auth.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
    }

    if (datasetId) {
      // Validation UUID
      const uuidError = validateUUID(datasetId);
      if (uuidError) return uuidError;

      // Vérifier que le dataset appartient à l'organisation de l'utilisateur
      const dataset = await db.dataset.findUnique({
        where: { id: datasetId },
        select: { organizationId: true },
      });

      if (!dataset) {
        return NextResponse.json(
          { success: false, error: 'Dataset non trouvé.' },
          { status: 404 }
        );
      }

      // Vérification d'appartenance (sauf pour owners/admins)
      if (auth.role !== 'owner' && auth.role !== 'admin') {
        if (dataset.organizationId !== auth.organizationId) {
          return NextResponse.json(
            { success: false, error: 'Accès refusé.' },
            { status: 403 }
          );
        }
      }

      // Récupérer les configs du dataset
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

    // Si organizationId est fourni, utiliser celui de l'utilisateur par défaut
    const targetOrgId = organizationId || auth.organizationId;

    if (!targetOrgId) {
      return NextResponse.json(
        { success: false, error: 'Aucune organisation associée.' },
        { status: 400 }
      );
    }

    // Récupérer tous les KPIs d'une organisation
    const datasets = await db.dataset.findMany({
      where: { organizationId: targetOrgId },
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
  } catch (error) {
    console.error('Erreur récupération KPIs:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/kpis
// Crée une nouvelle version de configuration KPI
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (write permission)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { datasetId, configJson, isPublished = false, userId: providedUserId } = body;

    if (!datasetId || !configJson) {
      return NextResponse.json(
        { success: false, error: 'datasetId et configJson requis' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(datasetId);
    if (uuidError) return uuidError;

    // Vérifier que le dataset existe et appartient à l'organisation
    const dataset = await db.dataset.findUnique({
      where: { id: datasetId },
      select: { organizationId: true, name: true },
    });

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset non trouvé' },
        { status: 404 }
      );
    }

    // Vérification d'appartenance (sauf pour owners/admins)
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (dataset.organizationId !== auth.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
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
        userId: auth.userId, // Toujours utiliser l'utilisateur authentifié
        version: nextVersion,
        configJson: typeof configJson === 'string' ? configJson : JSON.stringify(configJson),
        isPublished,
        generatedAt: new Date(),
      },
    });

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'create',
        entityType: 'kpi',
        entityId: kpiConfig.id,
        metadata: JSON.stringify({ datasetId, version: nextVersion }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

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
      { success: false, error: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/kpis
// Met à jour une configuration KPI
// ============================================

export async function PATCH(request: NextRequest) {
  // Vérification d'authentification (write permission)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { id, isPublished, configJson } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(id);
    if (uuidError) return uuidError;

    // Vérifier que le KPIConfig existe et appartient à l'organisation
    const existingConfig = await db.kPIConfig.findUnique({
      where: { id },
      include: {
        dataset: {
          select: { organizationId: true },
        },
      },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration non trouvée' },
        { status: 404 }
      );
    }

    // Vérification d'appartenance (sauf pour owners/admins)
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (existingConfig.dataset.organizationId !== auth.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
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
      { success: false, error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/kpis
// Supprime une configuration KPI
// ============================================

export async function DELETE(request: NextRequest) {
  // Vérification d'authentification (delete permission)
  const authResult = await requireAuth(request, 'delete');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(id);
    if (uuidError) return uuidError;

    // Vérifier que le KPIConfig existe et appartient à l'organisation
    const existingConfig = await db.kPIConfig.findUnique({
      where: { id },
      include: {
        dataset: {
          select: { organizationId: true, name: true },
        },
      },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration non trouvée' },
        { status: 404 }
      );
    }

    // Vérification d'appartenance (sauf pour owners/admins)
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (existingConfig.dataset.organizationId !== auth.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
    }

    await db.kPIConfig.delete({
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
        metadata: JSON.stringify({ datasetName: existingConfig.dataset.name }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

    return NextResponse.json({
      success: true,
      message: 'Configuration supprimée',
    });
  } catch (error) {
    console.error('Erreur suppression KPI config:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/kpis/reorder
// Réorganise l'ordre des KPIs dans une configuration
// ============================================

export async function PUT(request: NextRequest) {
  // Vérification d'authentification (write permission)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { configId, kpiUpdates } = body;

    if (!configId || !kpiUpdates) {
      return NextResponse.json(
        { success: false, error: 'configId et kpiUpdates requis' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(configId);
    if (uuidError) return uuidError;

    // Récupérer la config actuelle
    const kpiConfig = await db.kPIConfig.findUnique({
      where: { id: configId },
      include: {
        dataset: {
          select: { organizationId: true },
        },
      },
    });

    if (!kpiConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration non trouvée' },
        { status: 404 }
      );
    }

    // Vérification d'appartenance (sauf pour owners/admins)
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (kpiConfig.dataset.organizationId !== auth.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
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
      { success: false, error: 'Erreur lors du réordonnancement' },
      { status: 500 }
    );
  }
}
