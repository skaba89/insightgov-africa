// ============================================
// InsightGov Africa - API Partage Dashboard
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// ============================================
// CRÉER UN LIEN DE PARTAGE
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const body = await request.json();
    const { dashboardId, organizationId, expiresInDays } = body;

    if (!dashboardId || !organizationId) {
      return NextResponse.json(
        { error: 'dashboardId et organizationId requis' },
        { status: 400 }
      );
    }

    // Vérifier que le dashboard appartient à l'organisation
    const dashboard = await db.dashboard.findFirst({
      where: {
        id: dashboardId,
        dataset: { organizationId },
      },
      include: {
        dataset: {
          select: {
            name: true,
            columnsMetadata: true,
            organizationId: true,
          },
        },
      },
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard non trouvé' },
        { status: 404 }
      );
    }

    // Générer un token unique
    const shareToken = nanoid(12);

    // Mettre à jour le dashboard avec le token
    await db.dashboard.update({
      where: { id: dashboardId },
      data: {
        shareToken,
        isPublic: true,
      },
    });

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${shareToken}`;

    return NextResponse.json({
      success: true,
      data: {
        shareToken,
        shareUrl,
      },
    });
  } catch (error: any) {
    console.error('[Share Create Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// ACCÉDER À UN DASHBOARD PARTAGÉ
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: shareToken } = await params;

    // Trouver le dashboard par token
    const dashboard = await db.dashboard.findUnique({
      where: { shareToken },
      include: {
        dataset: {
          select: {
            name: true,
            columnsMetadata: true,
            rowCount: true,
            columnCount: true,
            fileUrl: true,
            kpis: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!dashboard || !dashboard.isPublic) {
      return NextResponse.json(
        { error: 'Dashboard non trouvé ou non partagé' },
        { status: 404 }
      );
    }

    // Charger les données brutes si disponibles
    let rawData: any[] = [];
    try {
      if (dashboard.dataset.fileUrl) {
        const filePath = path.join(process.cwd(), 'uploads', dashboard.dataset.fileUrl);

        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const parsed = Papa.parse(fileContent, { header: true });
          rawData = parsed.data.slice(0, 500);
        }
      }
    } catch (e) {
      console.error('Error loading raw data:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        dashboard: {
          id: dashboard.id,
          title: dashboard.title,
          description: dashboard.description,
          layoutConfig: dashboard.layoutConfig,
          filtersConfig: dashboard.filtersConfig,
        },
        dataset: {
          name: dashboard.dataset.name,
          rowCount: dashboard.dataset.rowCount,
          columnCount: dashboard.dataset.columnCount,
          columnsMetadata: dashboard.dataset.columnsMetadata,
        },
        kpis: dashboard.dataset.kpis,
        rawData,
      },
    });
  } catch (error: any) {
    console.error('[Share Get Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
