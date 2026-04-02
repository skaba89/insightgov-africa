/**
 * InsightGov Africa - Audit Logs API
 * ====================================
 * API endpoints for retrieving and exporting audit logs.
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import { AuditService, AuditLogFilters, PaginationOptions } from '@/lib/audit/audit-service';

// ============================================
// GET /api/audit-logs
// Retrieve audit logs with filters
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { searchParams } = new URL(request.url);

    // Parse filter parameters
    const filters: AuditLogFilters = {};

    // Organization filter - toujours utiliser l'organisation de l'utilisateur
    const targetOrgId = auth.organizationId;
    if (targetOrgId) {
      filters.organizationId = targetOrgId;
    }

    // User filter
    const userId = searchParams.get('userId');
    if (userId) {
      // Validation UUID
      const uuidError = validateUUID(userId);
      if (uuidError) return uuidError;
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
    if (includeStats && targetOrgId) {
      stats = await AuditService.getStats(targetOrgId, filters.startDate, filters.endDate);
    }

    return NextResponse.json({
      ...result,
      ...(stats && { stats }),
    });
  } catch (error) {
    console.error('[AuditLogs API] Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
