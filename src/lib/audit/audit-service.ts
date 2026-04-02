/**
 * InsightGov Africa - Audit Service
 * ===================================
 * Enterprise-grade audit logging service for tracking all critical actions.
 */

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Audit action types
export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'sso_login'
  | 'upload'
  | 'analyze'
  | 'export'
  | 'share'
  | 'comment'
  | 'delete'
  | 'settings_change'
  | 'team_add'
  | 'team_remove'
  | 'subscription_change'
  | 'dataset_view'
  | 'api_key_create'
  | 'api_key_revoke'
  | 'webhook_create'
  | 'webhook_delete'
  | 'password_change'
  | 'email_change'
  | 'role_change';

// Entity types
export type EntityType =
  | 'dataset'
  | 'kpi'
  | 'user'
  | 'organization'
  | 'subscription'
  | 'settings'
  | 'api_key'
  | 'sso_config'
  | 'webhook'
  | 'comment';

// Audit log entry interface
export interface AuditLogEntry {
  organizationId?: string | null;
  userId?: string | null;
  action: AuditAction | string;
  entityType: EntityType | string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: 'success' | 'failed' | 'pending';
  errorMessage?: string | null;
  sessionId?: string | null;
}

// Audit log with relations
export type AuditLogWithUser = Prisma.ActivityLogGetPayload<{
  include: { user: true };
}>;

// Filter options for querying audit logs
export interface AuditLogFilters {
  organizationId?: string;
  userId?: string;
  action?: string | string[];
  entityType?: string | string[];
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  ipAddress?: string;
}

// Pagination options
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'action' | 'userId';
  sortOrder?: 'asc' | 'desc';
}

// Paginated result
export interface PaginatedAuditLogs {
  logs: AuditLogWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Audit Service Class
 */
export class AuditService {
  /**
   * Log an audit event
   */
  static async log(entry: AuditLogEntry): Promise<string> {
    try {
      const log = await db.activityLog.create({
        data: {
          organizationId: entry.organizationId,
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          status: entry.status || 'success',
          errorMessage: entry.errorMessage,
          sessionId: entry.sessionId,
        },
      });

      return log.id;
    } catch (error) {
      console.error('[AuditService] Failed to log audit event:', error);
      // Don't throw - audit logging should not break the main flow
      return '';
    }
  }

  /**
   * Log multiple events in batch
   */
  static async logBatch(entries: AuditLogEntry[]): Promise<number> {
    try {
      const result = await db.activityLog.createMany({
        data: entries.map((entry) => ({
          organizationId: entry.organizationId,
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          status: entry.status || 'success',
          errorMessage: entry.errorMessage,
          sessionId: entry.sessionId,
        })),
      });

      return result.count;
    } catch (error) {
      console.error('[AuditService] Failed to log batch audit events:', error);
      return 0;
    }
  }

  /**
   * Get paginated audit logs with filters
   */
  static async getLogs(
    filters: AuditLogFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedAuditLogs> {
    const {
      organizationId,
      userId,
      action,
      entityType,
      status,
      startDate,
      endDate,
      search,
      ipAddress,
    } = filters;

    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;

    // Build where clause
    const where: Prisma.ActivityLogWhereInput = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = Array.isArray(action) ? { in: action } : action;
    }

    if (entityType) {
      where.entityType = Array.isArray(entityType) ? { in: entityType } : entityType;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    if (ipAddress) {
      where.ipAddress = { contains: ipAddress };
    }

    if (search) {
      // Search in metadata JSON and error message
      where.OR = [
        { metadata: { contains: search } },
        { errorMessage: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
      ];
    }

    // Get total count
    const total = await db.activityLog.count({ where });

    // Get paginated results
    const logs = await db.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      logs: logs as AuditLogWithUser[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit log by ID
   */
  static async getLogById(id: string): Promise<AuditLogWithUser | null> {
    return db.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    }) as Promise<AuditLogWithUser | null>;
  }

  /**
   * Get audit statistics for an organization
   */
  static async getStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLogs: number;
    byAction: Record<string, number>;
    byStatus: Record<string, number>;
    byEntityType: Record<string, number>;
    uniqueUsers: number;
    uniqueIpAddresses: number;
  }> {
    const where: Prisma.ActivityLogWhereInput = {
      organizationId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Get all logs for stats calculation
    const logs = await db.activityLog.findMany({
      where,
      select: {
        action: true,
        status: true,
        entityType: true,
        userId: true,
        ipAddress: true,
      },
    });

    // Calculate stats
    const byAction: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byEntityType: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const uniqueIpAddresses = new Set<string>();

    for (const log of logs) {
      // Count by action
      byAction[log.action] = (byAction[log.action] || 0) + 1;

      // Count by status
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;

      // Count by entity type
      byEntityType[log.entityType] = (byEntityType[log.entityType] || 0) + 1;

      // Track unique users
      if (log.userId) {
        uniqueUsers.add(log.userId);
      }

      // Track unique IPs
      if (log.ipAddress) {
        uniqueIpAddresses.add(log.ipAddress);
      }
    }

    return {
      totalLogs: logs.length,
      byAction,
      byStatus,
      byEntityType,
      uniqueUsers: uniqueUsers.size,
      uniqueIpAddresses: uniqueIpAddresses.size,
    };
  }

  /**
   * Export audit logs to CSV format
   */
  static async exportToCsv(
    filters: AuditLogFilters = {}
  ): Promise<string> {
    const { logs } = await this.getLogs(filters, { limit: 10000 });

    const headers = [
      'ID',
      'Timestamp',
      'Organization ID',
      'User Email',
      'User Name',
      'Action',
      'Entity Type',
      'Entity ID',
      'Status',
      'IP Address',
      'User Agent',
      'Error Message',
      'Metadata',
    ];

    const rows = logs.map((log) => [
      log.id,
      log.createdAt.toISOString(),
      log.organizationId || '',
      log.user?.email || '',
      log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() : '',
      log.action,
      log.entityType,
      log.entityId || '',
      log.status,
      log.ipAddress || '',
      log.userAgent || '',
      log.errorMessage || '',
      log.metadata || '',
    ]);

    // Escape CSV values
    const escapeCsv = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    return [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');
  }

  /**
   * Export audit logs to JSON format
   */
  static async exportToJson(
    filters: AuditLogFilters = {}
  ): Promise<string> {
    const { logs } = await this.getLogs(filters, { limit: 10000 });

    return JSON.stringify(
      logs.map((log) => ({
        id: log.id,
        timestamp: log.createdAt,
        organizationId: log.organizationId,
        user: log.user
          ? {
              id: log.user.id,
              email: log.user.email,
              name: `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim(),
            }
          : null,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        status: log.status,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        errorMessage: log.errorMessage,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
      null,
      2
    );
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  static async cleanupOldLogs(
    retentionDays: number = 365
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[AuditService] Cleaned up ${result.count} old audit logs`);
    return result.count;
  }
}

// Action type definitions with labels
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  login: 'User Login',
  logout: 'User Logout',
  login_failed: 'Failed Login Attempt',
  sso_login: 'SSO Login',
  upload: 'Dataset Upload',
  analyze: 'Dataset Analysis',
  export: 'Data Export',
  share: 'Data Share',
  comment: 'Comment Added',
  delete: 'Data Deletion',
  settings_change: 'Settings Changed',
  team_add: 'Team Member Added',
  team_remove: 'Team Member Removed',
  subscription_change: 'Subscription Changed',
  dataset_view: 'Dataset Viewed',
  api_key_create: 'API Key Created',
  api_key_revoke: 'API Key Revoked',
  webhook_create: 'Webhook Created',
  webhook_delete: 'Webhook Deleted',
  password_change: 'Password Changed',
  email_change: 'Email Changed',
  role_change: 'Role Changed',
};

// Entity type definitions with labels
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  dataset: 'Dataset',
  kpi: 'KPI Configuration',
  user: 'User',
  organization: 'Organization',
  subscription: 'Subscription',
  settings: 'Settings',
  api_key: 'API Key',
  sso_config: 'SSO Configuration',
  webhook: 'Webhook',
  comment: 'Comment',
};

// Status labels
export const STATUS_LABELS: Record<string, string> = {
  success: 'Success',
  failed: 'Failed',
  pending: 'Pending',
};

export default AuditService;
