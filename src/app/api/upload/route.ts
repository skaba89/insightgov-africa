/**
 * InsightGov Africa - Upload API Route
 * =====================================
 * Gère l'upload de fichiers CSV/Excel, leur validation et stockage.
 * Gracefully handles database unavailability.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateFile, parseFile, extractColumnMetadata } from '@/lib/parsers';
import type { FileValidationResult } from '@/types';

// Configuration
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB default

// In-memory storage for demo mode
const demoDatasets: Map<string, Record<string, unknown>> = new Map();

/**
 * POST /api/upload
 * Upload et validation d'un fichier de données
 */
export async function POST(request: NextRequest) {
  try {
    // Parser le multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const organizationId = formData.get('organizationId') as string | null;
    const name = formData.get('name') as string | null;

    // Validations de base
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis' },
        { status: 400 }
      );
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
    const fileUrl = `local://${userId}/${Date.now()}_${file.name}`;

    // Détecter le type de fichier
    const extension = file.name.split('.').pop()?.toLowerCase();
    const fileType = extension === 'csv' ? 'csv' : 'xlsx';

    // Dataset data
    const datasetData = {
      id: `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      organizationId: organizationId || null,
      name: name || file.name.replace(/\.[^/.]+$/, ''),
      originalFileName: file.name,
      fileUrl,
      fileSize: file.size,
      fileType,
      rowCount: parseResult.rowCount,
      columnCount: parseResult.columnCount,
      columnsMetadata,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If database is available, save to database
    if (db) {
      try {
        // Check if user exists
        const user = await db.user.findUnique({
          where: { id: userId },
        });

        if (user) {
          const dbDataset = await db.dataset.create({
            data: {
              userId,
              organizationId: organizationId || null,
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

          datasetData.id = dbDataset.id;
        }
      } catch (dbError) {
        console.warn('Database save failed, using in-memory storage:', dbError);
      }
    }

    // Store in memory for demo mode
    demoDatasets.set(datasetData.id, { ...datasetData, columnsMetadata: JSON.stringify(columnsMetadata) });

    return NextResponse.json({
      success: true,
      dataset: {
        ...datasetData,
        columnsMetadata,
      },
      validation: {
        rowCount: validation.rowCount,
        columnCount: validation.columnCount,
        warnings: validation.warnings,
      },
      preview: parseResult.data, // Retourner TOUTES les données parsées, pas juste 10 lignes
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

/**
 * GET /api/upload
 * Récupère la liste des datasets d'un utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    // Try database first
    if (db) {
      try {
        const whereClause: Record<string, unknown> = { userId };
        if (organizationId) {
          whereClause.organizationId = organizationId;
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

        if (datasets.length > 0) {
          return NextResponse.json({
            success: true,
            datasets: datasets.map((d) => ({
              ...d,
              columnsMetadata: JSON.parse(d.columnsMetadata as string),
              hasConfig: d.kpiConfigs && d.kpiConfigs.length > 0,
            })),
          });
        }
      } catch (dbError) {
        console.warn('Database query failed:', dbError);
      }
    }

    // Fallback to in-memory datasets
    const userDatasets = Array.from(demoDatasets.values()).filter(
      (d) => d.userId === userId
    );

    return NextResponse.json({
      success: true,
      datasets: userDatasets.map((d) => ({
        ...d,
        columnsMetadata: typeof d.columnsMetadata === 'string' 
          ? JSON.parse(d.columnsMetadata) 
          : d.columnsMetadata,
        hasConfig: false,
      })),
    });
  } catch (error) {
    console.error('Erreur récupération datasets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur lors de la récupération',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/upload
 * Configuration CORS pour les requêtes preflight
 */
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
