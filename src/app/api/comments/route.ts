/**
 * InsightGov Africa - Comments API
 * ==================================
 * API pour les commentaires sur datasets et KPIs
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  addComment,
  getComments,
  resolveComment,
} from '@/lib/collaboration/collaboration-service';

/**
 * GET /api/comments?datasetId=xxx&kpiId=xxx
 * Récupère les commentaires
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get('datasetId');
  const kpiId = searchParams.get('kpiId');

  if (!datasetId && !kpiId) {
    return NextResponse.json(
      { error: 'datasetId ou kpiId requis' },
      { status: 400 }
    );
  }

  try {
    const comments = await getComments({
      datasetId: datasetId || undefined,
      kpiId: kpiId || undefined,
    });
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Erreur récupération commentaires:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commentaires' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments
 * Ajoute un commentaire
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, content, datasetId, kpiId, parentId, mentions } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { error: 'userId et content requis' },
        { status: 400 }
      );
    }

    if (!datasetId && !kpiId) {
      return NextResponse.json(
        { error: 'datasetId ou kpiId requis' },
        { status: 400 }
      );
    }

    const result = await addComment(userId, content, {
      datasetId,
      kpiId,
      parentId,
      mentions,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      comment: result.comment,
    });
  } catch (error) {
    console.error('Erreur ajout commentaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout du commentaire' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/comments
 * Met à jour un commentaire (résolution)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, isResolved } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId requis' },
        { status: 400 }
      );
    }

    await resolveComment(commentId, isResolved ?? true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur mise à jour commentaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du commentaire' },
      { status: 500 }
    );
  }
}
