// =============================================================================
// InsightGov Africa - Backup API - Single Backup Operations
// =============================================================================
// GET: Get backup details
// DELETE: Delete backup
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { backupService } from '@/services/backup-service';

// =============================================================================
// GET - Get Backup Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const backup = await backupService.getBackupDetails(id);

    if (!backup) {
      return NextResponse.json(
        { success: false, error: 'Backup not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const backupWithParsedFields = {
      ...backup,
      includedTables: JSON.parse(backup.includedTables || '[]'),
      includedFiles: JSON.parse(backup.includedFiles || '[]'),
      metadata: JSON.parse(backup.metadata || '{}'),
    };

    return NextResponse.json({
      success: true,
      data: backupWithParsedFields,
    });
  } catch (error: any) {
    console.error('[Backup API] Error getting backup:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete Backup
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await backupService.deleteBackup(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully',
    });
  } catch (error: any) {
    console.error('[Backup API] Error deleting backup:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
