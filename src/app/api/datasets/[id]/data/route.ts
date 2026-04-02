// ============================================
// InsightGov Africa - API Dataset Raw Data
// Récupération des données brutes d'un dataset
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';
import Papa from 'papaparse';
import { requireResourceAccess } from '@/lib/auth-middleware';

// ============================================
// GET /api/datasets/[id]/data - Données brutes
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier l'authentification et l'accès à la ressource
    const accessResult = await requireResourceAccess(request, 'dataset', id, 'read');
    
    if (!accessResult.success) {
      return (accessResult as any).response;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');

    const dataset = await db.dataset.findUnique({
      where: { id },
      select: {
        id: true,
        fileUrl: true,
        fileType: true,
        columnsMetadata: true,
        organizationId: true,
      },
    });

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset non trouvé' },
        { status: 404 }
      );
    }

    let data: Record<string, unknown>[] = [];

    // Si c'est un fichier stocké
    if (dataset.fileUrl && dataset.fileUrl.startsWith('/uploads/')) {
      try {
        const filePath = join(process.cwd(), 'public', dataset.fileUrl);
        const fileContent = await readFile(filePath, 'utf-8');
        
        const parsed = Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
        
        data = parsed.data as Record<string, unknown>[];
      } catch (fileError) {
        console.error('Erreur lecture fichier:', fileError);
        // Retourner des données vides
        data = [];
      }
    }

    // Pagination
    const paginatedData = data.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        total: data.length,
        limit,
        offset,
        hasMore: offset + limit < data.length,
      },
    });
  } catch (error) {
    console.error('Erreur GET dataset data:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
