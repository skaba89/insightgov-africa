// ============================================
// InsightGov Africa - Helpers d'Authentification
// Fonctions utilitaires pour la sécurité
// ============================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  organizationId: string;
}

export interface AuthResult {
  user: AuthUser;
  organization: {
    id: string;
    name: string;
    type: string;
    sector: string;
    subscriptionTier: string;
  };
}

// ============================================
// AUTHENTIFICATION SERVEUR
// ============================================

/**
 * Récupérer la session utilisateur côté serveur
 */
export async function getAuthSession() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return null;
    }

    // Récupérer l'utilisateur complet avec son organisation
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            sector: true,
            subscriptionTier: true,
          },
        },
      },
    });

    if (!user || !user.organization) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role,
        organizationId: user.organizationId!,
      },
      organization: user.organization,
    } as AuthResult;
  } catch (error) {
    console.error('[Auth] Error getting session:', error);
    return null;
  }
}

/**
 * Récupérer l'utilisateur depuis les headers (middleware)
 */
export function getUserFromHeaders(request: NextRequest): AuthUser | null {
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  const userRole = request.headers.get('x-user-role') as UserRole;
  const organizationId = request.headers.get('x-organization-id');

  if (!userId || !userEmail || !organizationId) {
    return null;
  }

  return {
    id: userId,
    email: userEmail,
    role: userRole,
    organizationId,
  };
}

// ============================================
// PROTECTION DES API ROUTES
// ============================================

/**
 * Wrapper pour protéger une API route
 */
export function withAuth(
  handler: (request: NextRequest, context: { params: Record<string, string> }, auth: AuthResult) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: Record<string, string> }) => {
    const auth = await getAuthSession();

    if (!auth) {
      return NextResponse.json(
        { error: 'Non authentifié', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    return handler(request, context, auth);
  };
}

/**
 * Wrapper pour les routes nécessitant un rôle spécifique
 */
export function withRole(roles: UserRole[]) {
  return function (
    handler: (request: NextRequest, context: { params: Record<string, string> }, auth: AuthResult) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, context: { params: Record<string, string> }) => {
      const auth = await getAuthSession();

      if (!auth) {
        return NextResponse.json(
          { error: 'Non authentifié', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      if (!roles.includes(auth.user.role)) {
        return NextResponse.json(
          { error: 'Accès non autorisé', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      return handler(request, context, auth);
    };
  };
}

// ============================================
// ISOLATION DES DONNÉES
// ============================================

/**
 * Filtre Prisma pour l'isolation par organisation
 */
export function orgFilter(organizationId: string) {
  return { organizationId };
}

/**
 * Vérifier l'accès à une ressource
 */
export async function checkResourceAccess(
  resourceType: 'dataset' | 'kpi' | 'dashboard',
  resourceId: string,
  organizationId: string
): Promise<boolean> {
  switch (resourceType) {
    case 'dataset':
      const dataset = await db.dataset.findFirst({
        where: { id: resourceId, organizationId },
        select: { id: true },
      });
      return !!dataset;

    case 'kpi':
      const kpi = await db.kpi.findFirst({
        where: { id: resourceId, dataset: { organizationId } },
        select: { id: true },
      });
      return !!kpi;

    case 'dashboard':
      const dashboard = await db.dashboard.findFirst({
        where: { id: resourceId, dataset: { organizationId } },
        select: { id: true },
      });
      return !!dashboard;

    default:
      return false;
  }
}

// ============================================
// VÉRIFICATION DES LIMITES
// ============================================

export const PLAN_LIMITS = {
  FREE: {
    datasets: 1,
    dashboards: 5,
    exports: 5,
    users: 1,
    rowsPerDataset: 10000,
  },
  STARTER: {
    datasets: 10,
    dashboards: 25,
    exports: -1,
    users: 5,
    rowsPerDataset: 50000,
  },
  PROFESSIONAL: {
    datasets: -1,
    dashboards: -1,
    exports: -1,
    users: 25,
    rowsPerDataset: 500000,
  },
  ENTERPRISE: {
    datasets: -1,
    dashboards: -1,
    exports: -1,
    users: -1,
    rowsPerDataset: -1,
  },
};

/**
 * Vérifier si une organisation peut créer une nouvelle ressource
 */
export async function checkLimit(
  organizationId: string,
  limitType: 'datasets' | 'dashboards' | 'users',
  subscriptionTier: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = PLAN_LIMITS[subscriptionTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
  const limit = limits[limitType];

  // Illimité
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  let current = 0;

  switch (limitType) {
    case 'datasets':
      current = await db.dataset.count({ where: { organizationId } });
      break;
    case 'dashboards':
      current = await db.dashboard.count({
        where: { dataset: { organizationId } },
      });
      break;
    case 'users':
      current = await db.user.count({ where: { organizationId } });
      break;
  }

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

// ============================================
// EXPORTS
// ============================================

export { UserRole };
