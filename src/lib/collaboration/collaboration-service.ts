/**
 * InsightGov Africa - Collaboration Service
 * ==========================================
 * Services pour la gestion d'équipe, le partage et les commentaires
 */

import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export type UserRole = 'owner' | 'admin' | 'analyst' | 'viewer';
export type Permission = 'view' | 'edit' | 'admin';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'canceled';
export type NotificationType = 'comment' | 'share' | 'mention' | 'export' | 'alert';
export type ActivityAction = 'upload' | 'analyze' | 'export' | 'share' | 'comment' | 'delete';

export interface TeamMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  joinedAt: Date;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  expiresAt: Date;
  status: InvitationStatus;
  createdAt: Date;
}

export interface CommentData {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  mentions: string[];
  isResolved: boolean;
  replies: CommentData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date;
}

// =============================================================================
// TEAM MANAGEMENT
// =============================================================================

/**
 * Récupère les membres d'une équipe
 */
export async function getTeamMembers(organizationId: string): Promise<TeamMember[]> {
  const users = await db.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    role: user.role as UserRole,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    joinedAt: user.createdAt,
  }));
}

/**
 * Invite un nouveau membre
 */
export async function inviteTeamMember(
  organizationId: string,
  email: string,
  role: UserRole,
  invitedBy: string
): Promise<{ success: boolean; invitation?: TeamInvitation; error?: string }> {
  // Vérifier si l'utilisateur existe déjà
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: 'Un utilisateur avec cet email existe déjà' };
  }

  // Vérifier s'il y a déjà une invitation en attente
  const existingInvitation = await db.teamInvitation.findFirst({
    where: {
      organizationId,
      email,
      status: 'pending',
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvitation) {
    return { success: false, error: 'Une invitation est déjà en attente pour cet email' };
  }

  // Créer l'invitation
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

  const invitation = await db.teamInvitation.create({
    data: {
      organizationId,
      email,
      role,
      token,
      invitedBy,
      expiresAt,
    },
  });

  // Logger l'activité
  await logActivity({
    organizationId,
    userId: invitedBy,
    action: 'share',
    entityType: 'user',
    entityId: invitation.id,
    metadata: { email, role },
  });

  return {
    success: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role as UserRole,
      invitedBy: invitation.invitedBy,
      expiresAt: invitation.expiresAt,
      status: invitation.status as InvitationStatus,
      createdAt: invitation.createdAt,
    },
  };
}

/**
 * Accepte une invitation
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const invitation = await db.teamInvitation.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invitation) {
    return { success: false, error: 'Invitation non trouvée' };
  }

  if (invitation.status !== 'pending') {
    return { success: false, error: 'Cette invitation a déjà été traitée' };
  }

  if (invitation.expiresAt < new Date()) {
    await db.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: 'expired' },
    });
    return { success: false, error: 'Cette invitation a expiré' };
  }

  // Mettre à jour l'utilisateur
  await db.user.update({
    where: { id: userId },
    data: {
      organizationId: invitation.organizationId,
      role: invitation.role,
    },
  });

  // Marquer l'invitation comme acceptée
  await db.teamInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'accepted',
      acceptedAt: new Date(),
    },
  });

  return { success: true };
}

/**
 * Met à jour le rôle d'un membre
 */
export async function updateMemberRole(
  organizationId: string,
  userId: string,
  newRole: UserRole,
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  // Vérifier que l'utilisateur appartient à l'organisation
  const user = await db.user.findFirst({
    where: { id: userId, organizationId },
  });

  if (!user) {
    return { success: false, error: 'Utilisateur non trouvé' };
  }

  // Ne pas permettre de changer le rôle du propriétaire
  if (user.role === 'owner') {
    return { success: false, error: 'Impossible de modifier le rôle du propriétaire' };
  }

  await db.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  await logActivity({
    organizationId,
    userId: updatedBy,
    action: 'share',
    entityType: 'user',
    entityId: userId,
    metadata: { newRole },
  });

  return { success: true };
}

/**
 * Supprime un membre de l'équipe
 */
export async function removeTeamMember(
  organizationId: string,
  userId: string,
  removedBy: string
): Promise<{ success: boolean; error?: string }> {
  const user = await db.user.findFirst({
    where: { id: userId, organizationId },
  });

  if (!user) {
    return { success: false, error: 'Utilisateur non trouvé' };
  }

  if (user.role === 'owner') {
    return { success: false, error: 'Impossible de supprimer le propriétaire' };
  }

  await db.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  await logActivity({
    organizationId,
    userId: removedBy,
    action: 'delete',
    entityType: 'user',
    entityId: userId,
  });

  return { success: true };
}

// =============================================================================
// SHARING
// =============================================================================

/**
 * Partage un dataset avec un utilisateur
 */
export async function shareDataset(
  datasetId: string,
  sharedBy: string,
  sharedWith: string | null, // null pour partage public
  permission: Permission
): Promise<{ success: boolean; shareId?: string; error?: string }> {
  // Vérifier que le dataset existe
  const dataset = await db.dataset.findUnique({
    where: { id: datasetId },
  });

  if (!dataset) {
    return { success: false, error: 'Dataset non trouvé' };
  }

  // Créer ou mettre à jour le partage
  const existingShare = await db.datasetShare.findFirst({
    where: {
      datasetId,
      sharedWith,
      isActive: true,
    },
  });

  if (existingShare) {
    await db.datasetShare.update({
      where: { id: existingShare.id },
      data: { permission },
    });
    return { success: true, shareId: existingShare.id };
  }

  const share = await db.datasetShare.create({
    data: {
      datasetId,
      sharedBy,
      sharedWith,
      permission,
    },
  });

  // Notifier l'utilisateur si ce n'est pas un partage public
  if (sharedWith) {
    await createNotification({
      userId: sharedWith,
      type: 'share',
      title: 'Nouveau dataset partagé',
      message: `Un dataset a été partagé avec vous`,
      data: { datasetId, permission, sharedBy },
    });
  }

  await logActivity({
    organizationId: dataset.organizationId,
    userId: sharedBy,
    action: 'share',
    entityType: 'dataset',
    entityId: datasetId,
    metadata: { sharedWith, permission },
  });

  return { success: true, shareId: share.id };
}

/**
 * Récupère les partages d'un dataset
 */
export async function getDatasetShares(datasetId: string) {
  const shares = await db.datasetShare.findMany({
    where: { datasetId, isActive: true },
    include: {
      // sharedWith user info would be here in a real app
    },
  });

  return shares.map((share) => ({
    id: share.id,
    sharedBy: share.sharedBy,
    sharedWith: share.sharedWith,
    permission: share.permission as Permission,
    createdAt: share.createdAt,
    expiresAt: share.expiresAt,
  }));
}

/**
 * Révoque un partage
 */
export async function revokeShare(shareId: string): Promise<{ success: boolean }> {
  await db.datasetShare.update({
    where: { id: shareId },
    data: { isActive: false },
  });

  return { success: true };
}

// =============================================================================
// COMMENTS
// =============================================================================

/**
 * Ajoute un commentaire
 */
export async function addComment(
  userId: string,
  content: string,
  options: {
    datasetId?: string;
    kpiId?: string;
    parentId?: string;
    mentions?: string[];
  }
): Promise<{ success: boolean; comment?: CommentData; error?: string }> {
  if (!options.datasetId && !options.kpiId) {
    return { success: false, error: 'datasetId ou kpiId requis' };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, avatarUrl: true, organizationId: true },
  });

  if (!user) {
    return { success: false, error: 'Utilisateur non trouvé' };
  }

  const comment = await db.comment.create({
    data: {
      userId,
      content,
      datasetId: options.datasetId,
      kpiId: options.kpiId,
      parentId: options.parentId,
      mentions: options.mentions ? JSON.stringify(options.mentions) : null,
    },
  });

  // Notifier les utilisateurs mentionnés
  if (options.mentions && options.mentions.length > 0) {
    for (const mentionedUserId of options.mentions) {
      await createNotification({
        userId: mentionedUserId,
        type: 'mention',
        title: 'Vous avez été mentionné',
        message: `${user.firstName || 'Un utilisateur'} vous a mentionné dans un commentaire`,
        data: { commentId: comment.id, datasetId: options.datasetId, kpiId: options.kpiId },
      });
    }
  }

  // Logger l'activité
  await logActivity({
    organizationId: user.organizationId,
    userId,
    action: 'comment',
    entityType: options.datasetId ? 'dataset' : 'kpi',
    entityId: options.datasetId || options.kpiId,
    metadata: { commentId: comment.id },
  });

  return {
    success: true,
    comment: {
      id: comment.id,
      userId,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonyme',
      userAvatar: user.avatarUrl,
      content,
      mentions: options.mentions || [],
      isResolved: false,
      replies: [],
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    },
  };
}

/**
 * Récupère les commentaires d'un dataset
 */
export async function getComments(
  options: { datasetId?: string; kpiId?: string }
): Promise<CommentData[]> {
  const comments = await db.comment.findMany({
    where: {
      datasetId: options.datasetId,
      kpiId: options.kpiId,
      parentId: null, // Seulement les commentaires principaux
    },
    include: {
      // In a real app, would include user info and replies
    },
    orderBy: { createdAt: 'desc' },
  });

  // Récupérer les réponses pour chaque commentaire
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await db.comment.findMany({
        where: { parentId: comment.id },
        orderBy: { createdAt: 'asc' },
      });

      const user = await db.user.findUnique({
        where: { id: comment.userId },
        select: { firstName: true, lastName: true, avatarUrl: true },
      });

      return {
        id: comment.id,
        userId: comment.userId,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Anonyme',
        userAvatar: user?.avatarUrl,
        content: comment.content,
        mentions: comment.mentions ? JSON.parse(comment.mentions) : [],
        isResolved: comment.isResolved,
        replies: replies.map((reply) => {
          // Would fetch user info for each reply in production
          return {
            id: reply.id,
            userId: reply.userId,
            userName: 'Utilisateur',
            userAvatar: null,
            content: reply.content,
            mentions: [],
            isResolved: false,
            replies: [],
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
          };
        }),
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      };
    })
  );

  return commentsWithReplies;
}

/**
 * Résout un commentaire
 */
export async function resolveComment(
  commentId: string,
  resolved: boolean
): Promise<{ success: boolean }> {
  await db.comment.update({
    where: { id: commentId },
    data: { isResolved: resolved },
  });

  return { success: true };
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

/**
 * Crée une notification
 */
export async function createNotification(options: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  await db.notification.create({
    data: {
      userId: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      data: options.data ? JSON.stringify(options.data) : null,
    },
  });
}

/**
 * Récupère les notifications d'un utilisateur
 */
export async function getNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<NotificationData[]> {
  const notifications = await db.notification.findMany({
    where: {
      userId,
      ...(options?.unreadOnly && { isRead: false }),
    },
    take: options?.limit || 50,
    orderBy: { createdAt: 'desc' },
  });

  return notifications.map((n) => ({
    id: n.id,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
    data: n.data ? JSON.parse(n.data) : null,
    isRead: n.isRead,
    createdAt: n.createdAt,
  }));
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean }> {
  await db.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { success: true };
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllNotificationsRead(userId: string): Promise<{ success: boolean }> {
  await db.notification.updateMany({
    where: { userId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { success: true };
}

// =============================================================================
// ACTIVITY LOG
// =============================================================================

/**
 * Log une activité
 */
export async function logActivity(options: {
  organizationId?: string | null;
  userId?: string | null;
  action: ActivityAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await db.activityLog.create({
    data: {
      organizationId: options.organizationId,
      userId: options.userId,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    },
  });
}

/**
 * Récupère l'historique d'activité
 */
export async function getActivityLog(options: {
  organizationId?: string;
  userId?: string;
  action?: ActivityAction;
  limit?: number;
}) {
  const logs = await db.activityLog.findMany({
    where: {
      ...(options.organizationId && { organizationId: options.organizationId }),
      ...(options.userId && { userId: options.userId }),
      ...(options.action && { action: options.action }),
    },
    take: options.limit || 100,
    orderBy: { createdAt: 'desc' },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata ? JSON.parse(log.metadata) : null,
    createdAt: log.createdAt,
  }));
}
