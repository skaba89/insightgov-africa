/**
 * InsightGov Africa - Notifications API
 * ======================================
 * API pour les notifications utilisateur
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/collaboration/collaboration-service';

/**
 * GET /api/notifications?userId=xxx&unreadOnly=true
 * Récupère les notifications d'un utilisateur
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  if (!userId) {
    return NextResponse.json(
      { error: 'userId requis' },
      { status: 400 }
    );
  }

  try {
    const notifications = await getNotifications(userId, {
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
      { error: 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Marque une ou plusieurs notifications comme lues
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, userId, markAll } = body;

    if (markAll && userId) {
      await markAllNotificationsRead(userId);
      return NextResponse.json({ success: true, markedAll: true });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId requis' },
        { status: 400 }
      );
    }

    await markNotificationRead(notificationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur mise à jour notification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la notification' },
      { status: 500 }
    );
  }
}
