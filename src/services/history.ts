// ============================================
// InsightGov Africa - Service Historique
// Audit logs et historique des analyses
// ============================================

import { db } from '@/lib/db';

// ============================================
// TYPES
// ============================================

export interface AuditLogEntry {
  organizationId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

// ============================================
// ACTIONS D'AUDIT
// ============================================

export const AUDIT_ACTIONS = {
  // Authentification
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  REGISTER: 'auth.register',

  // Organisations
  ORG_CREATE: 'org.create',
  ORG_UPDATE: 'org.update',
  ORG_DELETE: 'org.delete',

  // Datasets
  DATASET_UPLOAD: 'dataset.upload',
  DATASET_VIEW: 'dataset.view',
  DATASET_DELETE: 'dataset.delete',
  DATASET_EXPORT: 'dataset.export',

  // Analyses
  ANALYSIS_START: 'analysis.start',
  ANALYSIS_COMPLETE: 'analysis.complete',
  ANALYSIS_ERROR: 'analysis.error',

  // Abonnements
  SUBSCRIPTION_CREATE: 'subscription.create',
  SUBSCRIPTION_CANCEL: 'subscription.cancel',
  SUBSCRIPTION_EXPIRE: 'subscription.expire',

  // Partage
  SHARE_CREATE: 'share.create',
  SHARE_VIEW: 'share.view',
  SHARE_REVOKE: 'share.revoke',
} as const;

// ============================================
// SERVICE D'HISTORIQUE
// ============================================

export class HistoryService {
  /**
   * Enregistrer une action dans l'audit log
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Note: Dans une implémentation complète, on aurait une table AuditLog
      // Pour l'instant, on log dans la console
      console.log('[Audit]', {
        timestamp: new Date().toISOString(),
        organizationId: entry.organizationId,
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        metadata: entry.metadata,
      });

      // Créer un export pour tracer les actions importantes
      if (entry.action.includes('export') || entry.action.includes('subscription')) {
        await db.export.create({
          data: {
            type: 'PDF',
            status: 'COMPLETED',
            parameters: JSON.stringify(entry),
            organizationId: entry.organizationId,
          },
        });
      }
    } catch (error) {
      console.error('[Audit] Error logging:', error);
    }
  }

  /**
   * Récupérer l'historique d'une organisation
   */
  async getOrganizationHistory(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      actions?: string[];
    }
  ): Promise<any[]> {
    // Récupérer les exports comme proxy pour l'historique
    const exports = await db.export.findMany({
      where: {
        organizationId,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return exports.map((e) => ({
      id: e.id,
      date: e.createdAt,
      type: e.type,
      status: e.status,
      parameters: e.parameters ? JSON.parse(e.parameters) : null,
    }));
  }

  /**
   * Récupérer l'historique d'un dataset
   */
  async getDatasetHistory(datasetId: string): Promise<any[]> {
    const dataset = await db.dataset.findUnique({
      where: { id: datasetId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        processedAt: true,
        processingStatus: true,
        kpis: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        dashboards: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!dataset) return [];

    return [
      {
        date: dataset.createdAt,
        action: 'dataset.upload',
        resource: 'dataset',
        resourceId: dataset.id,
        metadata: { name: dataset.name },
      },
      ...(dataset.processedAt
        ? [
            {
              date: dataset.processedAt,
              action: 'analysis.complete',
              resource: 'dataset',
              resourceId: dataset.id,
              metadata: { kpiCount: dataset.kpis.length },
            },
          ]
        : []),
      ...dataset.kpis.map((kpi) => ({
        date: kpi.createdAt,
        action: 'kpi.create',
        resource: 'kpi',
        resourceId: kpi.id,
        metadata: { name: kpi.name },
      })),
      ...dataset.dashboards.map((dash) => ({
        date: dash.createdAt,
        action: 'dashboard.create',
        resource: 'dashboard',
        resourceId: dash.id,
        metadata: { title: dash.title },
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Récupérer les statistiques d'activité
   */
  async getActivityStats(organizationId: string): Promise<{
    totalDatasets: number;
    totalExports: number;
    totalKpis: number;
    activityByDay: { date: string; count: number }[];
  }> {
    const [datasets, exports, kpis] = await Promise.all([
      db.dataset.count({ where: { organizationId } }),
      db.export.count({ where: { organizationId } }),
      db.kpi.count({
        where: { dataset: { organizationId } },
      }),
    ]);

    // Activité par jour (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExports = await db.export.findMany({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });

    const activityByDay = recentExports.reduce((acc, exp) => {
      const date = exp.createdAt.toISOString().split('T')[0];
      const existing = acc.find((a) => a.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, [] as { date: string; count: number }[]);

    return {
      totalDatasets: datasets,
      totalExports: exports,
      totalKpis: kpis,
      activityByDay,
    };
  }
}

// Export singleton
export const historyService = new HistoryService();
