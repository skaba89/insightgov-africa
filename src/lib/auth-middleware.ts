/**
 * InsightGov Africa - Authentication Middleware
 * ==============================================
 * Middleware réutilisable pour sécuriser les endpoints API
 * 
 * Ce module fournit:
 * - Vérification d'authentification obligatoire
 * - Vérification des permissions par rôle
 * - Vérification d'appartenance organisationnelle
 * - Validation des UUIDs
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// ============================================
// Types et Constants
// ============================================

export type Permission = 'read' | 'write' | 'delete' | 'admin';

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'analyst' | 'viewer';
  organizationId: string | null;
  organizationName: string | null;
}

export interface ResourceAccessResult {
  success: true;
  auth: AuthContext;
  resource: any;
}

export interface ResourceAccessError {
  success: false;
  response: NextResponse;
}

// Mapping des permissions par rôle
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: ['read', 'write', 'delete', 'admin'],
  admin: ['read', 'write', 'delete', 'admin'],
  analyst: ['read', 'write'],
  viewer: ['read'],
};

// Messages d'erreur en français
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentification requise. Veuillez vous connecter.',
  FORBIDDEN: 'Permissions insuffisantes pour cette action.',
  NOT_FOUND: 'Ressource non trouvée.',
  INVALID_ID: 'Identifiant invalide.',
  ORGANIZATION_MISMATCH: 'Accès refusé. Cette ressource n\'appartient pas à votre organisation.',
  INTERNAL_ERROR: 'Erreur interne du serveur.',
};

// ============================================
// Validation UUID
// ============================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function validateUUID(id: string): NextResponse | null {
  if (!id || !isValidUUID(id)) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INVALID_ID },
      { status: 400 }
    );
  }
  return null;
}

// ============================================
// Vérification d'Authentification de Base
// ============================================

/**
 * Vérifie que l'utilisateur est authentifié
 * Retourne le contexte d'authentification ou une réponse d'erreur
 */
export async function requireAuth(
  request: NextRequest,
  requiredPermission: Permission = 'read'
): Promise<{ auth: AuthContext } | NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    // Vérifier la présence de la session
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED, code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Vérifier les permissions du rôle
    const userRole = session.user.role || 'viewer';
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    
    if (!permissions.includes(requiredPermission)) {
      console.warn(`[Auth] Permission denied: user ${session.user.email} (${userRole}) tried ${requiredPermission}`);
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.FORBIDDEN, code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Retourner le contexte d'authentification
    return {
      auth: {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name || '',
        role: userRole as AuthContext['role'],
        organizationId: session.user.organizationId,
        organizationName: session.user.organizationName,
      },
    };
  } catch (error) {
    console.error('[Auth] Error in requireAuth:', error);
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INTERNAL_ERROR, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================
// Vérification d'Appartenance Organisationnelle
// ============================================

/**
 * Vérifie l'accès à une ressource spécifique
 * Combine authentification + vérification d'appartenance
 */
export async function requireResourceAccess(
  request: NextRequest,
  resourceType: 'dataset' | 'kpiConfig' | 'organization' | 'apiKey' | 'webhook',
  resourceId: string,
  requiredPermission: Permission = 'read'
): Promise<ResourceAccessResult | ResourceAccessError> {
  // 1. Valider l'UUID
  const uuidError = validateUUID(resourceId);
  if (uuidError) {
    return { success: false, response: uuidError };
  }

  // 2. Vérifier l'authentification
  const authResult = await requireAuth(request, requiredPermission);
  if (authResult instanceof NextResponse) {
    return { success: false, response: authResult };
  }

  const { auth } = authResult;

  // 3. Récupérer la ressource et vérifier l'appartenance
  try {
    let resource: any = null;
    let resourceOrgId: string | null = null;

    switch (resourceType) {
      case 'dataset':
        resource = await db.dataset.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            organizationId: true,
            userId: true,
            name: true,
            status: true,
          },
        });
        resourceOrgId = resource?.organizationId;
        break;

      case 'kpiConfig':
        resource = await db.kPIConfig.findUnique({
          where: { id: resourceId },
          include: {
            dataset: {
              select: { organizationId: true },
            },
          },
        });
        resourceOrgId = resource?.dataset?.organizationId;
        break;

      case 'apiKey':
        resource = await db.apiKey.findUnique({
          where: { id: resourceId },
          select: { id: true, organizationId: true, name: true },
        });
        resourceOrgId = resource?.organizationId;
        break;

      case 'webhook':
        resource = await db.webhook.findUnique({
          where: { id: resourceId },
          select: { id: true, organizationId: true, name: true },
        });
        resourceOrgId = resource?.organizationId;
        break;

      case 'organization':
        resource = await db.organization.findUnique({
          where: { id: resourceId },
          select: { id: true, name: true },
        });
        resourceOrgId = resourceId; // Pour une org, l'ID est l'orgId
        break;
    }

    // 4. Vérifier que la ressource existe
    if (!resource) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: ERROR_MESSAGES.NOT_FOUND, code: 'NOT_FOUND' },
          { status: 404 }
        ),
      };
    }

    // 5. Vérifier l'appartenance à l'organisation
    // Les owners/admins peuvent bypass cette vérification
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      if (resourceOrgId && auth.organizationId !== resourceOrgId) {
        console.warn(`[Auth] Organization mismatch: user ${auth.email} tried to access ${resourceType} from org ${resourceOrgId}`);
        return {
          success: false,
          response: NextResponse.json(
            { success: false, error: ERROR_MESSAGES.ORGANIZATION_MISMATCH, code: 'FORBIDDEN' },
            { status: 403 }
          ),
        };
      }
    }

    return { success: true, auth, resource };
  } catch (error) {
    console.error(`[Auth] Error in requireResourceAccess for ${resourceType}:`, error);
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INTERNAL_ERROR, code: 'INTERNAL_ERROR' },
        { status: 500 }
      ),
    };
  }
}

// ============================================
// Wrapper pour Endpoints API
// ============================================

/**
 * Wrapper pour sécuriser un endpoint API avec authentification
 * Usage:
 * 
 * export const GET = withAuth(async (request, context, auth) => {
 *   // auth contient les infos utilisateur
 *   return NextResponse.json({ data: ... });
 * });
 */
export function withAuth(
  handler: (request: NextRequest, context: any, auth: AuthContext) => Promise<NextResponse>,
  requiredPermission: Permission = 'read'
) {
  return async (request: NextRequest, context: any) => {
    const authResult = await requireAuth(request, requiredPermission);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    return handler(request, context, authResult.auth);
  };
}

/**
 * Wrapper pour sécuriser un endpoint avec vérification de ressource
 * Usage:
 * 
 * export const GET = withResourceAccess('dataset', 'read')(
 *   async (request, context, auth, resource) => {
 *     return NextResponse.json({ data: resource });
 *   }
 * );
 */
export function withResourceAccess(
  resourceType: 'dataset' | 'kpiConfig' | 'organization' | 'apiKey' | 'webhook',
  requiredPermission: Permission = 'read'
) {
  return (
    handler: (request: NextRequest, context: any, auth: AuthContext, resource: any) => Promise<NextResponse>
  ) => {
    return async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
      const { id } = await context.params;
      
      const result = await requireResourceAccess(request, resourceType, id, requiredPermission);
      
      if (!result.success) {
        return result.response;
      }
      
      return handler(request, context, result.auth, result.resource);
    };
  };
}

// ============================================
// Helper pour vérifier les limites du plan
// ============================================

interface PlanLimits {
  maxDatasets: number;
  maxDashboards: number;
  maxTeamMembers: number;
  maxExports: number;
  apiAccess: boolean;
  aiQueriesPerMonth: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxDatasets: 1,
    maxDashboards: 5,
    maxTeamMembers: 1,
    maxExports: 5,
    apiAccess: false,
    aiQueriesPerMonth: 10,
  },
  starter: {
    maxDatasets: 10,
    maxDashboards: 25,
    maxTeamMembers: 5,
    maxExports: 50,
    apiAccess: false,
    aiQueriesPerMonth: 100,
  },
  professional: {
    maxDatasets: -1, // Illimité
    maxDashboards: -1,
    maxTeamMembers: 25,
    maxExports: -1,
    apiAccess: true,
    aiQueriesPerMonth: 1000,
  },
  enterprise: {
    maxDatasets: -1,
    maxDashboards: -1,
    maxTeamMembers: -1,
    maxExports: -1,
    apiAccess: true,
    aiQueriesPerMonth: -1,
  },
};

/**
 * Vérifie si l'organisation peut créer une nouvelle ressource
 */
export async function checkPlanLimit(
  organizationId: string,
  resourceType: 'datasets' | 'dashboards' | 'teamMembers' | 'exports',
  quantity: number = 1
): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  try {
    // Récupérer le plan de l'organisation
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: { subscriptionTier: true },
    });

    const plan = org?.subscriptionTier || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // Compter les ressources actuelles
    let current = 0;
    let limit = 0;

    switch (resourceType) {
      case 'datasets':
        current = await db.dataset.count({ where: { organizationId } });
        limit = limits.maxDatasets;
        break;
      case 'dashboards':
        // Compter via KPIConfigs uniques
        const datasets = await db.dataset.findMany({
          where: { organizationId },
          select: { id: true },
        });
        current = await db.kPIConfig.count({
          where: { datasetId: { in: datasets.map(d => d.id) } },
        });
        limit = limits.maxDashboards;
        break;
      case 'teamMembers':
        current = await db.user.count({ where: { organizationId } });
        limit = limits.maxTeamMembers;
        break;
      case 'exports':
        // Pour l'instant, pas de suivi des exports
        current = 0;
        limit = limits.maxExports;
        break;
    }

    // -1 signifie illimité
    if (limit === -1) {
      return { allowed: true, current, limit: -1 };
    }

    const allowed = current + quantity <= limit;
    
    return {
      allowed,
      current,
      limit,
      message: allowed ? undefined : `Limite atteinte (${current}/${limit}). Passez à un plan supérieur pour continuer.`,
    };
  } catch (error) {
    console.error('[Auth] Error checking plan limit:', error);
    return { allowed: false, current: 0, limit: 0, message: 'Erreur lors de la vérification des limites.' };
  }
}

// ============================================
// Export par défaut
// ============================================

export default {
  requireAuth,
  requireResourceAccess,
  withAuth,
  withResourceAccess,
  isValidUUID,
  validateUUID,
  checkPlanLimit,
  PLAN_LIMITS,
  ROLE_PERMISSIONS,
};
