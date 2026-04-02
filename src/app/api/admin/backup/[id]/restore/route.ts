// =============================================================================
// InsightGov Africa - Backup Restore API
// =============================================================================
// POST: Restore from backup
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { backupService } from '@/services/backup-service';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';

// =============================================================================
// POST - Restore from Backup (Admin Only)
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier l'authentification avec droits admin
  const authResult = await requireAuth(request, 'admin');
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const auth = authResult.auth;

  try {
    const { id } = await params;
    
    // Valider l'UUID
    const uuidError = validateUUID(id);
    if (uuidError) {
      return uuidError;
    }

    const body = await request.json().catch(() => ({}));

    // Validate backup exists
    const backup = await backupService.getBackupDetails(id);
    if (!backup) {
      return NextResponse.json(
        { success: false, error: 'Backup not found' },
        { status: 404 }
      );
    }

    // Vérifier l'appartenance à l'organisation (sauf pour les owners)
    if (auth.role !== 'owner' && backup.organizationId && auth.organizationId !== backup.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé. Cette ressource n\'appartient pas à votre organisation.' },
        { status: 403 }
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
    const dryRun = body.dryRun || false;
    const restoreOptions = {
      backupId: id,
      targetTables: body.targetTables,
      targetFiles: body.targetFiles,
      overwriteExisting: body.overwriteExisting || false,
      dryRun,
    };

    // Run restore
    const result = await backupService.restoreBackup(restoreOptions);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result,
        message: dryRun 
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
