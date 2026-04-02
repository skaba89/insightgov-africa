// =============================================================================
// InsightGov Africa - Backup API
// =============================================================================
// POST: Trigger a new backup
// GET: List backups with optional filters
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { backupService, type BackupType, type BackupCategory } from '@/services/backup-service';
import { backupScheduler } from '@/lib/backup/scheduler';
import { db } from '@/lib/db';
import { requireAuth, AuthContext } from '@/lib/auth-middleware';

// =============================================================================
// GET - List Backups (Admin Only)
// =============================================================================

export async function GET(request: NextRequest) {
  // Vérifier l'authentification avec droits admin
  const authResult = await requireAuth(request, 'admin');
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const auth = authResult.auth;

  try {
    const { searchParams } = new URL(request.url);

    // Parse filters - restreindre à l'organisation de l'utilisateur sauf pour les owners
    const filters = {
      organizationId: auth.role === 'owner' 
        ? (searchParams.get('organizationId') || undefined)
        : (auth.organizationId || undefined),
      backupType: searchParams.get('backupType') as BackupType | undefined,
      category: searchParams.get('category') as BackupCategory | undefined,
      status: searchParams.get('status') as 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    };

    const { backups, total } = await backupService.listBackups(filters);

    // Get statistics
    let stats = null;
    if (searchParams.get('includeStats') === 'true') {
      stats = await getBackupStats(filters.organizationId);
    }

    return NextResponse.json({
      success: true,
      data: backups,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: total > filters.offset + filters.limit,
      },
      stats,
    });
  } catch (error: any) {
    console.error('[Backup API] Error listing backups:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Backup (Admin Only)
// =============================================================================

export async function POST(request: NextRequest) {
  // Vérifier l'authentification avec droits admin
  const authResult = await requireAuth(request, 'admin');
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const auth = authResult.auth;

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.backupType || !body.category) {
      return NextResponse.json(
        { success: false, error: 'backupType and category are required' },
        { status: 400 }
      );
    }

    // Validate backup type
    const validBackupTypes: BackupType[] = ['full', 'incremental', 'differential', 'archive'];
    if (!validBackupTypes.includes(body.backupType)) {
      return NextResponse.json(
        { success: false, error: `Invalid backupType. Must be one of: ${validBackupTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories: BackupCategory[] = ['database', 'files', 'config', 'full_system'];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Restrict organizationId to user's organization (except owners)
    const organizationId = auth.role === 'owner' 
      ? body.organizationId 
      : auth.organizationId;

    // Create backup options
    const options = {
      organizationId,
      backupType: body.backupType as BackupType,
      category: body.category as BackupCategory,
      storageBackend: body.storageBackend as 'local' | 's3' | 'gcs' | 'azure' | undefined,
      compressionType: body.compressionType as 'none' | 'gzip' | 'brotli' | 'lz4' | undefined,
      encryption: body.encryption ? {
        enabled: body.encryption.enabled || false,
        type: body.encryption.type as 'aes-256-gcm' | 'aes-256-cbc' | undefined,
        key: body.encryption.key,
      } : undefined,
      retentionDays: body.retentionDays,
      retentionCategory: body.retentionCategory as 'daily' | 'weekly' | 'monthly' | 'archive' | undefined,
      includedTables: body.includedTables,
      includedFiles: body.includedFiles,
      triggeredBy: auth.userId,
      triggerType: 'manual' as const,
      scheduleId: body.scheduleId,
    };

    // Trigger backup
    const result = await backupService.createBackup(options);

    if (result.status === 'failed') {
      return NextResponse.json(
        { success: false, error: result.error, data: result },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Backup ${result.backupNumber} created successfully`,
    });
  } catch (error: any) {
    console.error('[Backup API] Error creating backup:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getBackupStats(organizationId?: string): Promise<{
  total: number;
  completed: number;
  failed: number;
  pending: number;
  totalSize: number;
  lastBackup: Date | null;
}> {
  if (!db) {
    return {
      total: 0,
      completed: 0,
      failed: 0,
      pending: 0,
      totalSize: 0,
      lastBackup: null,
    };
  }

  const where = organizationId ? { organizationId } : {};

  const [total, completed, failed, pending, sizeResult, lastBackup] = await Promise.all([
    db.backup.count({ where }),
    db.backup.count({ where: { ...where, status: 'completed' } }),
    db.backup.count({ where: { ...where, status: 'failed' } }),
    db.backup.count({ where: { ...where, status: 'pending' } }),
    db.backup.aggregate({
      where: { ...where, status: 'completed' },
      _sum: { compressedSize: true },
    }),
    db.backup.findFirst({
      where: { ...where, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  return {
    total,
    completed,
    failed,
    pending,
    totalSize: sizeResult._sum.compressedSize || 0,
    lastBackup: lastBackup?.createdAt || null,
  };
}
