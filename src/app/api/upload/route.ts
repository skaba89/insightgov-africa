/**
 * InsightGov Africa - Upload API Route
 * =====================================
 * Gère l'upload de fichiers CSV/Excel, leur validation et stockage.
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateUUID, checkPlanLimit } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { validateFile, parseFile, extractColumnMetadata } from '@/lib/parsers';
import { storeDatasetData } from '@/lib/data-cache';
import type { FileValidationResult } from '@/types';

// Configuration
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB default

// ============================================
// POST /api/upload
// Upload et validation d'un fichier de données
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (write pour upload)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    // Parser le multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;

    // Validations de base
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Fichier trop volumineux. Maximum: ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      );
    }

    // Vérifier les limites du plan
    if (auth.organizationId) {
      const planCheck = await checkPlanLimit(auth.organizationId, 'datasets');
      if (!planCheck.allowed) {
        return NextResponse.json(
          { success: false, error: planCheck.message, code: 'PLAN_LIMIT_EXCEEDED' },
          { status: 402 }
        );
      }
    }

    // Valider le fichier
    const validation: FileValidationResult = await validateFile(file);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fichier invalide',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Parser le fichier pour extraire les données
    const parseResult = await parseFile(file);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors du parsing du fichier',
          details: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // Extraire les métadonnées des colonnes
    const columnsMetadata = extractColumnMetadata(
      parseResult.data,
      parseResult.headers
    );

    // Générer une URL de fichier
    const fileUrl = `uploads/${auth.userId}/${Date.now()}_${file.name}`;

    // Détecter le type de fichier
    const extension = file.name.split('.').pop()?.toLowerCase();
    const fileType = extension === 'csv' ? 'csv' : 'xlsx';

    // Créer le dataset en base de données
    const dataset = await db.dataset.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        name: name || file.name.replace(/\.[^/.]+$/, ''),
        originalFileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType,
        rowCount: parseResult.rowCount,
        columnCount: parseResult.columnCount,
        columnsMetadata: JSON.stringify(columnsMetadata),
        status: 'pending',
      },
    });

    // Store the actual data in cache for analysis
    storeDatasetData(dataset.id, parseResult.data, parseResult.headers);

    // Log de l'activité
    if (auth.organizationId) {
      await db.activityLog.create({
        data: {
          userId: auth.userId,
          organizationId: auth.organizationId,
          action: 'upload',
          entityType: 'dataset',
          entityId: dataset.id,
          metadata: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            rowCount: parseResult.rowCount,
          }),
        },
      }).catch(err => console.error('Failed to log activity:', err));
    }

    return NextResponse.json({
      success: true,
      dataset: {
        ...dataset,
        columnsMetadata,
      },
      validation: {
        rowCount: validation.rowCount,
        columnCount: validation.columnCount,
        warnings: validation.warnings,
      },
      preview: parseResult.data,
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur lors de l\'upload',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/upload
// Récupère la liste des datasets de l'utilisateur
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const whereClause: Record<string, unknown> = { userId: auth.userId };
    
    if (auth.organizationId) {
      whereClause.organizationId = auth.organizationId;
    }

    const datasets = await db.dataset.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        kpiConfigs: {
          where: { isPublished: true },
          take: 1,
          orderBy: { version: 'desc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      datasets: datasets.map((d) => ({
        ...d,
        columnsMetadata: JSON.parse(d.columnsMetadata as string),
        hasConfig: d.kpiConfigs && d.kpiConfigs.length > 0,
      })),
    });
  } catch (error) {
    console.error('Erreur récupération datasets:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la récupération' },
      { status: 500 }
    );
  }
}

// ============================================
// OPTIONS /api/upload
// Configuration CORS pour les requêtes preflight
// ============================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
