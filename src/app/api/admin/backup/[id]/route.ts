// =============================================================================
// InsightGov Africa - Backup API - Single Backup Operations
// =============================================================================
// GET: Get backup details
// DELETE: Delete backup
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { backupService } from '@/services/backup-service';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';

// =============================================================================
// GET - Get Backup Details (Admin Only)
// =============================================================================

export async function GET(
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
// DELETE - Delete Backup (Admin Only)
// =============================================================================

export async function DELETE(
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

    // Vérifier d'abord que le backup existe et appartient à l'organisation
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
