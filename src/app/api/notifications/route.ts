/**
 * InsightGov Africa - Notifications API
 * ======================================
 * API pour les notifications utilisateur
 * SÉCURISÉ avec authentification
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/collaboration/collaboration-service';
import { requireAuth } from '@/lib/auth-middleware';

// ============================================
// GET /api/notifications
// Récupère les notifications de l'utilisateur connecté
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    // Toujours utiliser l'utilisateur authentifié
    const notifications = await getNotifications(auth.userId, {
      unreadOnly,
      limit,
    });

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/notifications
// Marque une ou plusieurs notifications comme lues
// ============================================

export async function PATCH(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { notificationId, markAll } = body;

    // Marquer toutes les notifications comme lues
    if (markAll) {
      await markAllNotificationsRead(auth.userId);
      return NextResponse.json({ success: true, markedAll: true });
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'notificationId requis' },
        { status: 400 }
      );
    }

    // Vérifier que la notification appartient à l'utilisateur
    const { db } = await import('@/lib/db');
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification non trouvée.' },
        { status: 404 }
      );
    }

    if (notification.userId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé.' },
        { status: 403 }
      );
    }

    await markNotificationRead(notificationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur mise à jour notification:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de la notification' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/notifications
// Supprime une notification
// ============================================

export async function DELETE(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    // Vérifier que la notification appartient à l'utilisateur
    const { db } = await import('@/lib/db');
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification non trouvée.' },
        { status: 404 }
      );
    }

    if (notification.userId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé.' },
        { status: 403 }
      );
    }

    await db.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ success: true, message: 'Notification supprimée.' });
  } catch (error) {
    console.error('Erreur suppression notification:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la notification' },
      { status: 500 }
    );
  }
}
