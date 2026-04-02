/**
 * InsightGov Africa - Comments API
 * ==================================
 * API pour les commentaires sur datasets et KPIs
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  addComment,
  getComments,
  resolveComment,
} from '@/lib/collaboration/collaboration-service';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// ============================================
// GET /api/comments?datasetId=xxx&kpiId=xxx
// Récupère les commentaires
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get('datasetId');
  const kpiId = searchParams.get('kpiId');

  if (!datasetId && !kpiId) {
    return NextResponse.json(
      { success: false, error: 'datasetId ou kpiId requis' },
      { status: 400 }
    );
  }

  // Validation UUID
  if (datasetId) {
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

    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (dataset.organizationId !== auth.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
    }
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
      { success: false, error: 'Erreur lors de la récupération des commentaires' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/comments
// Ajoute un commentaire
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (write)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { content, datasetId, kpiId, parentId, mentions } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'content requis' },
        { status: 400 }
      );
    }

    if (!datasetId && !kpiId) {
      return NextResponse.json(
        { success: false, error: 'datasetId ou kpiId requis' },
        { status: 400 }
      );
    }

    // Validation UUID et vérification d'appartenance
    if (datasetId) {
      const uuidError = validateUUID(datasetId);
      if (uuidError) return uuidError;

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

      if (auth.role !== 'owner' && auth.role !== 'admin') {
        if (dataset.organizationId !== auth.organizationId) {
          return NextResponse.json(
            { success: false, error: 'Accès refusé.' },
            { status: 403 }
          );
        }
      }
    }

    // Toujours utiliser l'utilisateur authentifié
    const result = await addComment(auth.userId, content, {
      datasetId,
      kpiId,
      parentId,
      mentions,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      comment: result.comment,
    });
  } catch (error) {
    console.error('Erreur ajout commentaire:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'ajout du commentaire' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/comments
// Met à jour un commentaire (résolution)
// ============================================

export async function PATCH(request: NextRequest) {
  // Vérification d'authentification (write)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { commentId, isResolved } = body;

    if (!commentId) {
      return NextResponse.json(
        { success: false, error: 'commentId requis' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(commentId);
    if (uuidError) return uuidError;

    // Vérifier que le commentaire existe et appartient à l'organisation
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      include: {
        dataset: { select: { organizationId: true } },
      } as any,
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Commentaire non trouvé.' },
        { status: 404 }
      );
    }

    // Vérification d'appartenance
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      const commentDataset = (comment as any).dataset;
      if (commentDataset?.organizationId !== auth.organizationId && comment.userId !== auth.userId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
    }

    await resolveComment(commentId, isResolved ?? true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur mise à jour commentaire:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du commentaire' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/comments
// Supprime un commentaire
// ============================================

export async function DELETE(request: NextRequest) {
  // Vérification d'authentification (delete)
  const authResult = await requireAuth(request, 'delete');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(commentId);
    if (uuidError) return uuidError;

    // Vérifier que le commentaire existe et appartient à l'organisation
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      include: {
        dataset: { select: { organizationId: true } },
      } as any,
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Commentaire non trouvé.' },
        { status: 404 }
      );
    }

    // Vérification: seul l'auteur ou un admin peut supprimer
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (comment.userId !== auth.userId) {
        return NextResponse.json(
          { success: false, error: 'Vous ne pouvez supprimer que vos propres commentaires.' },
          { status: 403 }
        );
      }
    }

    await db.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true, message: 'Commentaire supprimé.' });
  } catch (error) {
    console.error('Erreur suppression commentaire:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du commentaire' },
      { status: 500 }
    );
  }
}
