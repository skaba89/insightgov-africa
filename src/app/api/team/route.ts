/**
 * InsightGov Africa - Team API
 * ==============================
 * API pour la gestion d'équipe
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTeamMembers,
  inviteTeamMember,
  updateMemberRole,
  removeTeamMember,
  type UserRole,
} from '@/lib/collaboration/collaboration-service';

/**
 * GET /api/team?organizationId=xxx
 * Récupère les membres d'une équipe
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json(
      { error: 'organizationId requis' },
      { status: 400 }
    );
  }

  try {
    const members = await getTeamMembers(organizationId);
    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error('Erreur récupération équipe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'équipe' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/invite
 * Invite un nouveau membre
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, organizationId, email, role, userId, invitedBy } = body;

    if (action === 'invite') {
      if (!organizationId || !email || !role || !invitedBy) {
        return NextResponse.json(
          { error: 'organizationId, email, role et invitedBy requis' },
          { status: 400 }
        );
      }

      const result = await inviteTeamMember(
        organizationId,
        email,
        role as UserRole,
        invitedBy
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        invitation: result.invitation,
      });
    }

    if (action === 'updateRole') {
      if (!organizationId || !userId || !role) {
        return NextResponse.json(
          { error: 'organizationId, userId et role requis' },
          { status: 400 }
        );
      }

      const updatedBy = body.updatedBy || userId;
      const result = await updateMemberRole(
        organizationId,
        userId,
        role as UserRole,
        updatedBy
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'remove') {
      if (!organizationId || !userId) {
        return NextResponse.json(
          { error: 'organizationId et userId requis' },
          { status: 400 }
        );
      }

      const removedBy = body.removedBy || userId;
      const result = await removeTeamMember(organizationId, userId, removedBy);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Erreur gestion équipe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la gestion de l\'équipe' },
      { status: 500 }
    );
  }
}
