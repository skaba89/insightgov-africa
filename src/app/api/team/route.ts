/**
 * InsightGov Africa - Team API
 * ==============================
 * API pour la gestion d'équipe
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import {
  getTeamMembers,
  inviteTeamMember,
  updateMemberRole,
  removeTeamMember,
  type UserRole,
} from '@/lib/collaboration/collaboration-service';
import { db } from '@/lib/db';

// ============================================
// GET /api/team?organizationId=xxx
// Récupère les membres d'une équipe
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'organizationId requis' },
      { status: 400 }
    );
  }

  // Validation UUID
  const uuidError = validateUUID(organizationId);
  if (uuidError) return uuidError;

  // Vérifier que l'utilisateur appartient à cette organisation
  // ou est owner/admin (peut voir toutes les organisations)
  if (auth.role !== 'owner' && auth.role !== 'admin') {
    if (auth.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé.' },
        { status: 403 }
      );
    }
  }

  try {
    const members = await getTeamMembers(organizationId);
    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error('Erreur récupération équipe:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de l\'équipe' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/team
// Actions : invite, updateRole, remove
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (admin permission pour gestion équipe)
  const authResult = await requireAuth(request, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { action, organizationId, email, role, userId, invitedBy, updatedBy, removedBy } = body;

    // Validation UUID pour organizationId
    if (organizationId) {
      const uuidError = validateUUID(organizationId);
      if (uuidError) return uuidError;
    }

    // Vérifier que l'utilisateur appartient à cette organisation
    if (auth.role !== 'owner') {
      if (auth.organizationId !== organizationId) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé. Vous ne pouvez gérer que votre propre organisation.' },
          { status: 403 }
        );
      }
    }

    // ============================================
    // Action : Inviter un membre
    // ============================================
    if (action === 'invite') {
      if (!organizationId || !email || !role) {
        return NextResponse.json(
          { success: false, error: 'organizationId, email et role requis' },
          { status: 400 }
        );
      }

      // Valider le rôle
      const validRoles: UserRole[] = ['admin', 'analyst', 'viewer'];
      if (!validRoles.includes(role as UserRole)) {
        return NextResponse.json(
          { success: false, error: 'Rôle invalide. Rôles autorisés: admin, analyst, viewer' },
          { status: 400 }
        );
      }

      const result = await inviteTeamMember(
        organizationId,
        email,
        role as UserRole,
        auth.userId // Toujours utiliser l'utilisateur authentifié
      );

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      // Log de l'activité
      await db.activityLog.create({
        data: {
          userId: auth.userId,
          organizationId,
          action: 'team_add',
          entityType: 'user',
          metadata: JSON.stringify({ email, role }),
        },
      }).catch(err => console.error('Failed to log activity:', err));

      return NextResponse.json({
        success: true,
        invitation: result.invitation,
      });
    }

    // ============================================
    // Action : Modifier le rôle d'un membre
    // ============================================
    if (action === 'updateRole') {
      if (!organizationId || !userId || !role) {
        return NextResponse.json(
          { success: false, error: 'organizationId, userId et role requis' },
          { status: 400 }
        );
      }

      // Validation UUID pour userId
      const userUuidError = validateUUID(userId);
      if (userUuidError) return userUuidError;

      // Valider le rôle
      const validRoles: UserRole[] = ['admin', 'analyst', 'viewer'];
      if (!validRoles.includes(role as UserRole)) {
        return NextResponse.json(
          { success: false, error: 'Rôle invalide. Rôles autorisés: admin, analyst, viewer' },
          { status: 400 }
        );
      }

      // Vérifier qu'on ne modifie pas un owner
      const targetUser = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true },
      });

      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'Utilisateur non trouvé.' },
          { status: 404 }
        );
      }

      if (targetUser.role === 'owner') {
        return NextResponse.json(
          { success: false, error: 'Impossible de modifier le rôle d\'un owner.' },
          { status: 403 }
        );
      }

      const result = await updateMemberRole(
        organizationId,
        userId,
        role as UserRole,
        auth.userId
      );

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      // Log de l'activité
      await db.activityLog.create({
        data: {
          userId: auth.userId,
          organizationId,
          action: 'settings_change',
          entityType: 'user',
          entityId: userId,
          metadata: JSON.stringify({ email: targetUser.email, newRole: role }),
        },
      }).catch(err => console.error('Failed to log activity:', err));

      return NextResponse.json({ success: true });
    }

    // ============================================
    // Action : Supprimer un membre
    // ============================================
    if (action === 'remove') {
      if (!organizationId || !userId) {
        return NextResponse.json(
          { success: false, error: 'organizationId et userId requis' },
          { status: 400 }
        );
      }

      // Validation UUID pour userId
      const userUuidError = validateUUID(userId);
      if (userUuidError) return userUuidError;

      // Vérifier qu'on ne supprime pas un owner
      const targetUser = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true },
      });

      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'Utilisateur non trouvé.' },
          { status: 404 }
        );
      }

      if (targetUser.role === 'owner') {
        return NextResponse.json(
          { success: false, error: 'Impossible de supprimer un owner.' },
          { status: 403 }
        );
      }

      // Empêcher l'auto-suppression
      if (userId === auth.userId) {
        return NextResponse.json(
          { success: false, error: 'Vous ne pouvez pas vous supprimer vous-même.' },
          { status: 400 }
        );
      }

      const result = await removeTeamMember(organizationId, userId, auth.userId);

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      // Log de l'activité
      await db.activityLog.create({
        data: {
          userId: auth.userId,
          organizationId,
          action: 'team_remove',
          entityType: 'user',
          entityId: userId,
          metadata: JSON.stringify({ email: targetUser.email }),
        },
      }).catch(err => console.error('Failed to log activity:', err));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Action non reconnue. Actions valides: invite, updateRole, remove' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erreur gestion équipe:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la gestion de l\'équipe' },
      { status: 500 }
    );
  }
}
