// =============================================================================
// InsightGov Africa - Backup Configuration API
// =============================================================================
// GET: Get backup configuration
// PUT: Update backup configuration
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { backupScheduler } from '@/lib/backup/scheduler';

// =============================================================================
// GET - Get Backup Configuration
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || null;

    let config = null;

    if (db) {
      config = await db.backupConfig.findFirst({
        where: organizationId ? { organizationId } : { organizationId: null },
      });
    }

    // Return default config if not found
    const defaultConfig = {
      defaultStorageBackend: 'local',
      defaultCompressionType: 'gzip',
      defaultEncryptionEnabled: false,
      dailyRetentionDays: 7,
      weeklyRetentionDays: 28,
      monthlyRetentionDays: 365,
      archiveRetentionYears: 7,
      enableDailyBackups: true,
      enableWeeklyBackups: true,
      enableMonthlyBackups: true,
      notifyOnBackupComplete: true,
      notifyOnBackupFailure: true,
      notifyOnRestore: true,
      maxConcurrentBackups: 3,
      backupTimeoutMinutes: 60,
      requireEncryption: false,
      allowedStorageBackends: ['local'],
    };

    // Parse JSON fields if config exists
    const parsedConfig = config ? {
      ...config,
      allowedStorageBackends: JSON.parse(config.allowedStorageBackends || '["local"]'),
    } : defaultConfig;

    // Get retention policy
    const retentionPolicy = backupScheduler.getRetentionPolicy();

    return NextResponse.json({
      success: true,
      data: {
        config: parsedConfig,
        retentionPolicy,
      },
    });
  } catch (error: any) {
    console.error('[Backup Config API] Error getting config:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT - Update Backup Configuration
// =============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    const organizationId = body.organizationId || null;

    // Find existing config
    let config = await db.backupConfig.findFirst({
      where: organizationId ? { organizationId } : { organizationId: null },
    });

    // Prepare update data
    const updateData: any = {
      defaultStorageBackend: body.defaultStorageBackend,
      defaultCompressionType: body.defaultCompressionType,
      defaultEncryptionEnabled: body.defaultEncryptionEnabled,
      dailyRetentionDays: body.dailyRetentionDays,
      weeklyRetentionDays: body.weeklyRetentionDays,
      monthlyRetentionDays: body.monthlyRetentionDays,
      archiveRetentionYears: body.archiveRetentionYears,
      enableDailyBackups: body.enableDailyBackups,
      enableWeeklyBackups: body.enableWeeklyBackups,
      enableMonthlyBackups: body.enableMonthlyBackups,
      notificationEmail: body.notificationEmail,
      notifyOnBackupComplete: body.notifyOnBackupComplete,
      notifyOnBackupFailure: body.notifyOnBackupFailure,
      notifyOnRestore: body.notifyOnRestore,
      maxConcurrentBackups: body.maxConcurrentBackups,
      backupTimeoutMinutes: body.backupTimeoutMinutes,
      requireEncryption: body.requireEncryption,
      allowedStorageBackends: body.allowedStorageBackends 
        ? JSON.stringify(body.allowedStorageBackends) 
        : undefined,
      // Cloud storage configs (should be encrypted in production)
      s3Config: body.s3Config ? JSON.stringify(body.s3Config) : undefined,
      gcsConfig: body.gcsConfig ? JSON.stringify(body.gcsConfig) : undefined,
      azureConfig: body.azureConfig ? JSON.stringify(body.azureConfig) : undefined,
      sftpConfig: body.sftpConfig ? JSON.stringify(body.sftpConfig) : undefined,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    if (config) {
      // Update existing config
      config = await db.backupConfig.update({
        where: { id: config.id },
        data: updateData,
      });
    } else {
      // Create new config
      config = await db.backupConfig.create({
        data: {
          organizationId,
          ...updateData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        allowedStorageBackends: JSON.parse(config.allowedStorageBackends || '["local"]'),
      },
      message: 'Backup configuration updated successfully',
    });
  } catch (error: any) {
    console.error('[Backup Config API] Error updating config:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Setup Default Configuration and Schedules
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Setup default schedules
    await backupScheduler.setupDefaultSchedules(body.organizationId);

    return NextResponse.json({
      success: true,
      message: 'Default backup schedules created successfully',
    });
  } catch (error: any) {
    console.error('[Backup Config API] Error setting up defaults:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
