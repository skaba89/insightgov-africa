/**
 * InsightGov Africa - Audit Logs API
 * ====================================
 * API endpoints for retrieving and exporting audit logs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuditService, AuditLogFilters, PaginationOptions } from '@/lib/audit/audit-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/audit-logs - Retrieve audit logs with filters
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse filter parameters
    const filters: AuditLogFilters = {};

    // Organization filter - default to user's organization
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    if (organizationId) {
      filters.organizationId = organizationId;
    }

    // User filter
    const userId = searchParams.get('userId');
    if (userId) {
      filters.userId = userId;
    }

    // Action filter (can be comma-separated)
    const action = searchParams.get('action');
    if (action) {
      filters.action = action.includes(',') ? action.split(',') : action;
    }

    // Entity type filter (can be comma-separated)
    const entityType = searchParams.get('entityType');
    if (entityType) {
      filters.entityType = entityType.includes(',') ? entityType.split(',') : entityType;
    }

    // Status filter
    const status = searchParams.get('status');
    if (status) {
      filters.status = status;
    }

    // Date range filters
    const startDate = searchParams.get('startDate');
    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    const endDate = searchParams.get('endDate');
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    // Search filter
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    // IP address filter
    const ipAddress = searchParams.get('ipAddress');
    if (ipAddress) {
      filters.ipAddress = ipAddress;
    }

    // Pagination options
    const pagination: PaginationOptions = {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '50', 10), 100),
      sortBy: (searchParams.get('sortBy') as 'createdAt' | 'action' | 'userId') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // Check if export is requested
    const exportFormat = searchParams.get('export');

    if (exportFormat === 'csv') {
      const csv = await AuditService.exportToCsv(filters);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (exportFormat === 'json') {
      const json = await AuditService.exportToJson(filters);
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // Check if stats are requested
    const includeStats = searchParams.get('includeStats') === 'true';

    // Get paginated logs
    const result = await AuditService.getLogs(filters, pagination);

    // Get stats if requested
    let stats = null;
    if (includeStats && organizationId) {
      stats = await AuditService.getStats(organizationId, filters.startDate, filters.endDate);
    }

    // Log the audit log view
    await AuditService.log({
      action: 'dataset_view',
      entityType: 'settings',
      userId: session.user.id,
      organizationId: session.user.organizationId,
      metadata: {
        filters: JSON.stringify(filters),
        pagination: JSON.stringify(pagination),
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      ...result,
      ...(stats && { stats }),
    });
  } catch (error) {
    console.error('[AuditLogs API] Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// GET /api/audit-logs/stats - Get audit statistics
export async function STATS(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const stats = await AuditService.getStats(
      organizationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[AuditLogs API] Error fetching audit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit statistics' },
      { status: 500 }
    );
  }
}

// GET /api/audit-logs/actions - Get list of available actions
export async function ACTIONS() {
  const { AUDIT_ACTION_LABELS } = await import('@/lib/audit/audit-service');
  
  return NextResponse.json({
    actions: Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  });
}

// GET /api/audit-logs/entity-types - Get list of available entity types
export async function ENTITY_TYPES() {
  const { ENTITY_TYPE_LABELS } = await import('@/lib/audit/audit-service');
  
  return NextResponse.json({
    entityTypes: Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  });
}
