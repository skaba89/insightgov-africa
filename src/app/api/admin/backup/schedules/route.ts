// =============================================================================
// InsightGov Africa - Backup Schedules API
// =============================================================================
// GET: List backup schedules
// POST: Create a new backup schedule
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { backupScheduler, type ScheduleFrequency } from '@/lib/backup/scheduler';
import { requireAuth } from '@/lib/auth-middleware';

// =============================================================================
// GET - List Schedules (Admin Only)
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
    
    // Restreindre à l'organisation de l'utilisateur (sauf owners)
    const organizationId = auth.role === 'owner' 
      ? (searchParams.get('organizationId') || undefined)
      : (auth.organizationId || undefined);

    const schedules = await backupScheduler.listSchedules(organizationId);

    // Parse JSON fields in response
    const parsedSchedules = schedules.map(schedule => ({
      ...schedule,
      includedTables: JSON.parse(schedule.includedTables || '[]'),
      includedFiles: JSON.parse(schedule.includedFiles || '[]'),
    }));

    return NextResponse.json({
      success: true,
      data: parsedSchedules,
    });
  } catch (error: any) {
    console.error('[Backup Schedules API] Error listing schedules:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Schedule (Admin Only)
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
    if (!body.name || !body.frequency || !body.backupType || !body.category) {
      return NextResponse.json(
        { success: false, error: 'name, frequency, backupType, and category are required' },
        { status: 400 }
      );
    }

    // Validate frequency
    const validFrequencies: ScheduleFrequency[] = ['daily', 'weekly', 'monthly', 'custom'];
    if (!validFrequencies.includes(body.frequency)) {
      return NextResponse.json(
        { success: false, error: `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}` },
        { status: 400 }
      );
    }

    // Restreindre l'organizationId à l'organisation de l'utilisateur (sauf owners)
    const organizationId = auth.role === 'owner' 
      ? body.organizationId 
      : auth.organizationId;

    // Create schedule
    const result = await backupScheduler.createSchedule({
      name: body.name,
      description: body.description,
      frequency: body.frequency,
      cronExpression: body.cronExpression,
      backupType: body.backupType,
      category: body.category,
      retentionDays: body.retentionDays || 30,
      retentionCategory: body.retentionCategory || 'standard',
      includedTables: body.includedTables,
      includedFiles: body.includedFiles,
      compressionType: body.compressionType || 'gzip',
      encrypted: body.encrypted || false,
      storageBackend: body.storageBackend || 'local',
      storagePath: body.storagePath,
      isActive: body.isActive ?? true,
      notifyOnSuccess: body.notifyOnSuccess || false,
      notifyOnFailure: body.notifyOnFailure ?? true,
      notificationEmail: body.notificationEmail,
    }, organizationId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: result.id },
      message: 'Backup schedule created successfully',
    });
  } catch (error: any) {
    console.error('[Backup Schedules API] Error creating schedule:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
