// =============================================================================
// InsightGov Africa - Backup Restore API
// =============================================================================
// POST: Restore from backup
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { backupService } from '@/services/backup-service';

// =============================================================================
// POST - Restore from Backup
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Validate backup exists
    const backup = await backupService.getBackupDetails(id);
    if (!backup) {
      return NextResponse.json(
        { success: false, error: 'Backup not found' },
        { status: 404 }
      );
    }

    // Check if backup is in completed status
    if (backup.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Can only restore from completed backups' },
        { status: 400 }
      );
    }

    // Prepare restore options
    const restoreOptions = {
      backupId: id,
      targetTables: body.targetTables,
      targetFiles: body.targetFiles,
      overwriteExisting: body.overwriteExisting || false,
      dryRun: body.dryRun || false,
    };

    // Run restore
    const result = await backupService.restoreBackup(restoreOptions);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result,
        message: result.dryRun 
          ? 'Dry run completed successfully' 
          : 'Backup restored successfully',
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Restore failed', 
          data: result 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Backup API] Error restoring backup:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
