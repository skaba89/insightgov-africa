import { prisma } from './db'
import { getServerSession } from 'next-auth'

/**
 * Row Level Security (RLS) Implementation
 * Provides data isolation at the application level for SQLite
 * and prepares for database-level RLS in PostgreSQL production
 */

// Types for RLS context
interface RLSContext {
  userId: string
  organizationId: string
  role: 'OWNER' | 'ADMIN' | 'ANALYST' | 'VIEWER'
}

/**
 * Get current user context for RLS
 */
export async function getRLSContext(): Promise<RLSContext | null> {
  const session = await getServerSession()
  
  if (!session?.user?.id) {
    return null
  }
  
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
    role: session.user.role as RLSContext['role'],
  }
}

/**
 * RLS Policy Types
 */
export type RLSPolicy = {
  resource: string
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'
  condition: (context: RLSContext, resourceId?: string) => Promise<boolean>
}

/**
 * Define RLS policies
 */
const rlsPolicies: RLSPolicy[] = [
  // Dataset policies
  {
    resource: 'Dataset',
    action: 'READ',
    condition: async (context, resourceId) => {
      if (!resourceId) return true // List will be filtered
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: resourceId,
          OR: [
            { organizationId: context.organizationId },
            { organizationId: null }, // Public datasets
          ]
        }
      })
      return !!dataset
    }
  },
  {
    resource: 'Dataset',
    action: 'CREATE',
    condition: async (context) => {
      // Check plan limits
      const count = await prisma.dataset.count({
        where: { organizationId: context.organizationId }
      })
      const limits = getPlanLimits(context.role)
      return count < limits.maxDatasets
    }
  },
  {
    resource: 'Dataset',
    action: 'UPDATE',
    condition: async (context, resourceId) => {
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: resourceId,
          organizationId: context.organizationId
        }
      })
      if (!dataset) return false
      
      // Only owner, admin, or creator can update
      return context.role === 'OWNER' || 
             context.role === 'ADMIN' || 
             dataset.userId === context.userId
    }
  },
  {
    resource: 'Dataset',
    action: 'DELETE',
    condition: async (context, resourceId) => {
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: resourceId,
          organizationId: context.organizationId
        }
      })
      if (!dataset) return false
      
      // Only owner, admin, or creator can delete
      return context.role === 'OWNER' || 
             context.role === 'ADMIN' || 
             dataset.userId === context.userId
    }
  },
  
  // KPI policies
  {
    resource: 'KPIConfig',
    action: 'READ',
    condition: async (context, resourceId) => {
      if (!resourceId) return true
      const kpi = await prisma.kPIConfig.findFirst({
        where: {
          id: resourceId,
          dataset: { organizationId: context.organizationId }
        }
      })
      return !!kpi
    }
  },
  {
    resource: 'KPIConfig',
    action: 'CREATE',
    condition: async (context) => {
      const count = await prisma.kPIConfig.count({
        where: { userId: context.userId }
      })
      const limits = getPlanLimits(context.role)
      return count < limits.maxKPIs
    }
  },
  {
    resource: 'KPIConfig',
    action: 'UPDATE',
    condition: async (context, resourceId) => {
      const kpi = await prisma.kPIConfig.findFirst({
        where: {
          id: resourceId,
          userId: context.userId
        }
      })
      if (!kpi) return false
      
      return context.role === 'OWNER' || 
             context.role === 'ADMIN' || 
             kpi.userId === context.userId
    }
  },
  {
    resource: 'KPIConfig',
    action: 'DELETE',
    condition: async (context, resourceId) => {
      const kpi = await prisma.kPIConfig.findFirst({
        where: {
          id: resourceId,
          OR: [
            { userId: context.userId },
            { dataset: { organizationId: context.organizationId } }
          ]
        }
      })
      if (!kpi) return false
      
      return context.role === 'OWNER' || 
             context.role === 'ADMIN' || 
             kpi.userId === context.userId
    }
  },
  
  // Organization policies
  {
    resource: 'Organization',
    action: 'READ',
    condition: async (context, resourceId) => {
      return context.organizationId === resourceId
    }
  },
  {
    resource: 'Organization',
    action: 'UPDATE',
    condition: async (context) => {
      return context.role === 'OWNER' || context.role === 'ADMIN'
    }
  },
  {
    resource: 'Organization',
    action: 'DELETE',
    condition: async (context) => {
      return context.role === 'OWNER'
    }
  },
  
  // User policies
  {
    resource: 'User',
    action: 'READ',
    condition: async (context, resourceId) => {
      // Can read users in same organization
      if (!resourceId) return true
      const user = await prisma.user.findFirst({
        where: {
          id: resourceId,
          organizationId: context.organizationId
        }
      })
      return !!user
    }
  },
  {
    resource: 'User',
    action: 'UPDATE',
    condition: async (context, resourceId) => {
      // Can update self or (admin/owner can update others in org)
      if (resourceId === context.userId) return true
      
      if (context.role === 'OWNER' || context.role === 'ADMIN') {
        const targetUser = await prisma.user.findFirst({
          where: {
            id: resourceId,
            organizationId: context.organizationId
          }
        })
        // Cannot modify other owners
        if (targetUser?.role === 'OWNER' && context.role !== 'OWNER') {
          return false
        }
        return !!targetUser
      }
      return false
    }
  },
  {
    resource: 'User',
    action: 'DELETE',
    condition: async (context, resourceId) => {
      // Cannot delete self
      if (resourceId === context.userId) return false
      
      // Only owner can delete users
      if (context.role !== 'OWNER' && context.role !== 'ADMIN') return false
      
      const targetUser = await prisma.user.findFirst({
        where: {
          id: resourceId,
          organizationId: context.organizationId
        }
      })
      
      // Cannot delete other owners (only owner can)
      if (targetUser?.role === 'OWNER' && context.role !== 'OWNER') {
        return false
      }
      
      return !!targetUser
    }
  },
  
  // API Key policies
  {
    resource: 'ApiKey',
    action: 'READ',
    condition: async (context) => {
      return context.role === 'OWNER' || context.role === 'ADMIN'
    }
  },
  {
    resource: 'ApiKey',
    action: 'CREATE',
    condition: async (context) => {
      if (context.role !== 'OWNER' && context.role !== 'ADMIN') return false
      
      const count = await prisma.apiKey.count({
        where: { organizationId: context.organizationId }
      })
      const limits = getPlanLimits(context.role)
      return count < limits.maxApiKeys
    }
  },
  {
    resource: 'ApiKey',
    action: 'DELETE',
    condition: async (context, resourceId) => {
      if (context.role !== 'OWNER' && context.role !== 'ADMIN') return false
      
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: resourceId,
          organizationId: context.organizationId
        }
      })
      return !!apiKey
    }
  },
]

/**
 * Get plan limits based on role
 */
function getPlanLimits(role: string) {
  const limits = {
    OWNER: {
      maxDatasets: 100,
      maxKPIs: 500,
      maxApiKeys: 10,
      maxTeamMembers: 50,
      maxStorageMB: 10000,
    },
    ADMIN: {
      maxDatasets: 50,
      maxKPIs: 200,
      maxApiKeys: 5,
      maxTeamMembers: 20,
      maxStorageMB: 5000,
    },
    ANALYST: {
      maxDatasets: 20,
      maxKPIs: 100,
      maxApiKeys: 0,
      maxTeamMembers: 0,
      maxStorageMB: 1000,
    },
    VIEWER: {
      maxDatasets: 0,
      maxKPIs: 0,
      maxApiKeys: 0,
      maxTeamMembers: 0,
      maxStorageMB: 0,
    },
  }
  
  return limits[role as keyof typeof limits] || limits.VIEWER
}

/**
 * Check if an action is allowed on a resource
 */
export async function checkRLS(
  resource: string,
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE',
  resourceId?: string
): Promise<boolean> {
  const context = await getRLSContext()
  
  if (!context) {
    return false
  }
  
  const policy = rlsPolicies.find(
    p => p.resource === resource && p.action === action
  )
  
  if (!policy) {
    // Default deny if no policy exists
    console.warn(`No RLS policy found for ${resource}.${action}`)
    return false
  }
  
  return policy.condition(context, resourceId)
}

/**
 * Apply RLS filters to Prisma queries
 */
export function applyRLSFilters(
  resource: string,
  context: RLSContext,
  where: Record<string, unknown> = {}
): Record<string, unknown> {
  switch (resource) {
    case 'Dataset':
      return {
        ...where,
        organizationId: context.organizationId,
      }
    
    case 'KPIConfig':
      return {
        ...where,
        dataset: {
          organizationId: context.organizationId
        }
      }
    
    case 'User':
      return {
        ...where,
        organizationId: context.organizationId,
      }
    
    case 'Organization':
      return {
        ...where,
        id: context.organizationId,
      }
    
    case 'ApiKey':
      return {
        ...where,
        organizationId: context.organizationId,
      }
    
    case 'AuditLog':
      return {
        ...where,
        organizationId: context.organizationId,
      }
    
    case 'ActivityLog':
      return {
        ...where,
        organizationId: context.organizationId,
      }
    
    default:
      return where
  }
}

/**
 * SQL RLS policies for PostgreSQL production deployment
 * Execute these on the database when migrating to PostgreSQL
 */
export const POSTGRESQL_RLS_POLICIES = `
-- Enable RLS on all tables
ALTER TABLE "Dataset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KPIConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;

-- Dataset policies
CREATE POLICY "Users can view datasets in their organization"
  ON "Dataset" FOR SELECT
  USING ("organizationId" = current_setting('app.current_organization_id')::text);

CREATE POLICY "Users can create datasets in their organization"
  ON "Dataset" FOR INSERT
  WITH CHECK ("organizationId" = current_setting('app.current_organization_id')::text);

CREATE POLICY "Owners and admins can update datasets"
  ON "Dataset" FOR UPDATE
  USING (
    "organizationId" = current_setting('app.current_organization_id')::text
    AND (
      current_setting('app.current_user_role')::text IN ('OWNER', 'ADMIN')
      OR "userId" = current_setting('app.current_user_id')::text
    )
  );

CREATE POLICY "Owners and admins can delete datasets"
  ON "Dataset" FOR DELETE
  USING (
    "organizationId" = current_setting('app.current_organization_id')::text
    AND (
      current_setting('app.current_user_role')::text IN ('OWNER', 'ADMIN')
      OR "userId" = current_setting('app.current_user_id')::text
    )
  );

-- KPIConfig policies
CREATE POLICY "Users can view KPIs in their organization"
  ON "KPIConfig" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Dataset"
      WHERE "Dataset"."id" = "KPIConfig"."datasetId"
      AND "Dataset"."organizationId" = current_setting('app.current_organization_id')::text
    )
  );

-- AuditLog policies
CREATE POLICY "Users can view audit logs in their organization"
  ON "AuditLog" FOR SELECT
  USING ("organizationId" = current_setting('app.current_organization_id')::text);

-- API Key policies
CREATE POLICY "Only owners and admins can manage API keys"
  ON "ApiKey" FOR ALL
  USING (
    "organizationId" = current_setting('app.current_organization_id')::text
    AND current_setting('app.current_user_role')::text IN ('OWNER', 'ADMIN')
  );
`

/**
 * Set RLS context for PostgreSQL (call before queries)
 */
export async function setPostgreSQLRLSContext(
  userId: string,
  organizationId: string,
  role: string
): Promise<void> {
  await prisma.$executeRawUnsafe(`
    SET app.current_user_id = '${userId}';
    SET app.current_organization_id = '${organizationId}';
    SET app.current_user_role = '${role}';
  `)
}
