// =============================================================================
// InsightGov Africa - Backup Scheduler
// =============================================================================
// Automated backup scheduling with retention policies
// Supports: Daily incremental, Weekly full, Monthly archive backups
// =============================================================================

import { db } from '@/lib/db';
import { backupService, type BackupOptions, type BackupType } from '@/services/backup-service';

// =============================================================================
// TYPES
// =============================================================================

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type RetentionCategory = 'daily' | 'weekly' | 'monthly' | 'archive';

export interface ScheduleConfig {
  id?: string;
  name: string;
  description?: string;
  frequency: ScheduleFrequency;
  cronExpression?: string;
  backupType: BackupType;
  category: 'database' | 'files' | 'config' | 'full_system';
  retentionDays: number;
  retentionCategory: RetentionCategory;
  includedTables?: string[];
  includedFiles?: string[];
  compressionType?: 'none' | 'gzip' | 'brotli' | 'lz4';
  encrypted?: boolean;
  storageBackend?: 'local' | 's3' | 'gcs' | 'azure';
  storagePath?: string;
  isActive: boolean;
  notifyOnSuccess?: boolean;
  notifyOnFailure?: boolean;
  notificationEmail?: string;
}

export interface ScheduleRunResult {
  scheduleId: string;
  backupId: string;
  status: 'success' | 'failed' | 'skipped';
  timestamp: Date;
  error?: string;
}

export interface RetentionPolicy {
  daily: number;    // Keep daily backups for X days
  weekly: number;   // Keep weekly backups for X days
  monthly: number;  // Keep monthly backups for X days
  archive: number;  // Keep archive backups for X years
}

// =============================================================================
// DEFAULT RETENTION POLICIES
// =============================================================================

const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  daily: 7,      // Keep daily backups for 7 days
  weekly: 28,    // Keep weekly backups for 4 weeks (28 days)
  monthly: 365,  // Keep monthly backups for 12 months (365 days)
  archive: 7,    // Keep archive backups for 7 years
};

// =============================================================================
// BACKUP SCHEDULER CLASS
// =============================================================================

export class BackupScheduler {
  private static instance: BackupScheduler;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  private constructor() {}

  static getInstance(): BackupScheduler {
    if (!BackupScheduler.instance) {
      BackupScheduler.instance = new BackupScheduler();
    }
    return BackupScheduler.instance;
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[BackupScheduler] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[BackupScheduler] Starting backup scheduler...');

    // Load and start all active schedules
    await this.loadSchedules();

    // Start the main scheduler loop (check every minute)
    const mainInterval = setInterval(() => {
      this.checkSchedules();
    }, 60000); // 1 minute

    this.intervals.set('__main__', mainInterval);

    console.log('[BackupScheduler] Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    console.log('[BackupScheduler] Stopping scheduler...');
    
    for (const [key, interval] of this.intervals) {
      clearInterval(interval);
      this.intervals.delete(key);
    }

    this.isRunning = false;
    console.log('[BackupScheduler] Scheduler stopped');
  }

  /**
   * Load schedules from database
   */
  private async loadSchedules(): Promise<void> {
    if (!db) {
      console.log('[BackupScheduler] Database not available, using default schedules');
      return;
    }

    const schedules = await db.backupSchedule.findMany({
      where: { isActive: true },
    });

    console.log(`[BackupScheduler] Loaded ${schedules.length} active schedules`);

    // Calculate next run times
    for (const schedule of schedules) {
      const nextRun = this.calculateNextRun(schedule.frequency, schedule.cronExpression);
      if (nextRun) {
        await db.backupSchedule.update({
          where: { id: schedule.id },
          data: { nextRunAt: nextRun },
        });
      }
    }
  }

  /**
   * Check schedules and run pending backups
   */
  private async checkSchedules(): Promise<void> {
    if (!db) return;

    const now = new Date();

    // Find schedules that need to run
    const pendingSchedules = await db.backupSchedule.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
      },
    });

    for (const schedule of pendingSchedules) {
      try {
        await this.runSchedule(schedule.id);
      } catch (error: any) {
        console.error(`[BackupScheduler] Error running schedule ${schedule.id}:`, error);
      }
    }

    // Cleanup expired backups
    await this.cleanupExpiredBackups();
  }

  /**
   * Run a specific schedule
   */
  async runSchedule(scheduleId: string): Promise<ScheduleRunResult> {
    const timestamp = new Date();

    if (!db) {
      return {
        scheduleId,
        backupId: '',
        status: 'failed',
        timestamp,
        error: 'Database not available',
      };
    }

    const schedule = await db.backupSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return {
        scheduleId,
        backupId: '',
        status: 'failed',
        timestamp,
        error: 'Schedule not found',
      };
    }

    console.log(`[BackupScheduler] Running schedule: ${schedule.name}`);

    try {
      // Create backup options
      const backupOptions: BackupOptions = {
        organizationId: schedule.organizationId || undefined,
        backupType: schedule.backupType as BackupType,
        category: schedule.category as 'database' | 'files' | 'config' | 'full_system',
        storageBackend: schedule.storageBackend as 'local' | 's3' | 'gcs' | 'azure' | undefined,
        compressionType: schedule.compressionType as 'none' | 'gzip' | 'brotli' | 'lz4' | undefined,
        encryption: {
          enabled: schedule.encrypted,
          type: 'aes-256-gcm',
        },
        retentionDays: schedule.retentionDays,
        retentionCategory: schedule.retentionCategory as 'daily' | 'weekly' | 'monthly' | 'archive',
        includedTables: JSON.parse(schedule.includedTables || '[]'),
        includedFiles: JSON.parse(schedule.includedFiles || '[]'),
        triggerType: 'scheduled',
        scheduleId: schedule.id,
      };

      // Run the backup
      const result = await backupService.createBackup(backupOptions);

      // Update schedule status
      const nextRun = this.calculateNextRun(schedule.frequency, schedule.cronExpression);
      await db.backupSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: timestamp,
          lastRunStatus: result.status === 'completed' ? 'success' : 'failed',
          lastRunBackupId: result.id,
          nextRunAt: nextRun,
        },
      });

      // Send notification if configured
      if (result.status === 'completed' && schedule.notifyOnSuccess && schedule.notificationEmail) {
        await this.sendNotification(schedule.notificationEmail, 'success', result);
      } else if (result.status === 'failed' && schedule.notifyOnFailure && schedule.notificationEmail) {
        await this.sendNotification(schedule.notificationEmail, 'failure', result);
      }

      return {
        scheduleId,
        backupId: result.id,
        status: result.status === 'completed' ? 'success' : 'failed',
        timestamp,
        error: result.error,
      };
    } catch (error: any) {
      // Update schedule status
      await db.backupSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: timestamp,
          lastRunStatus: 'failed',
        },
      });

      return {
        scheduleId,
        backupId: '',
        status: 'failed',
        timestamp,
        error: error.message,
      };
    }
  }

  /**
   * Create a new schedule
   */
  async createSchedule(config: ScheduleConfig, organizationId?: string): Promise<{ id: string; success: boolean; error?: string }> {
    if (!db) {
      return { id: '', success: false, error: 'Database not available' };
    }

    try {
      const nextRun = this.calculateNextRun(config.frequency, config.cronExpression);

      const schedule = await db.backupSchedule.create({
        data: {
          organizationId: organizationId || null,
          name: config.name,
          description: config.description || null,
          frequency: config.frequency,
          cronExpression: config.cronExpression || null,
          backupType: config.backupType,
          category: config.category,
          retentionDays: config.retentionDays,
          retentionCategory: config.retentionCategory,
          includedTables: JSON.stringify(config.includedTables || []),
          includedFiles: JSON.stringify(config.includedFiles || []),
          compressionType: config.compressionType || 'gzip',
          encrypted: config.encrypted || false,
          storageBackend: config.storageBackend || 'local',
          storagePath: config.storagePath || null,
          storageBucket: null,
          isActive: config.isActive,
          nextRunAt: nextRun,
          notifyOnSuccess: config.notifyOnSuccess || false,
          notifyOnFailure: config.notifyOnFailure ?? true,
          notificationEmail: config.notificationEmail || null,
        },
      });

      return { id: schedule.id, success: true };
    } catch (error: any) {
      return { id: '', success: false, error: error.message };
    }
  }

  /**
   * Update a schedule
   */
  async updateSchedule(scheduleId: string, config: Partial<ScheduleConfig>): Promise<{ success: boolean; error?: string }> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const updateData: any = {};

      if (config.name !== undefined) updateData.name = config.name;
      if (config.description !== undefined) updateData.description = config.description;
      if (config.frequency !== undefined) {
        updateData.frequency = config.frequency;
        updateData.nextRunAt = this.calculateNextRun(config.frequency, config.cronExpression);
      }
      if (config.cronExpression !== undefined) updateData.cronExpression = config.cronExpression;
      if (config.backupType !== undefined) updateData.backupType = config.backupType;
      if (config.category !== undefined) updateData.category = config.category;
      if (config.retentionDays !== undefined) updateData.retentionDays = config.retentionDays;
      if (config.retentionCategory !== undefined) updateData.retentionCategory = config.retentionCategory;
      if (config.includedTables !== undefined) updateData.includedTables = JSON.stringify(config.includedTables);
      if (config.includedFiles !== undefined) updateData.includedFiles = JSON.stringify(config.includedFiles);
      if (config.compressionType !== undefined) updateData.compressionType = config.compressionType;
      if (config.encrypted !== undefined) updateData.encrypted = config.encrypted;
      if (config.storageBackend !== undefined) updateData.storageBackend = config.storageBackend;
      if (config.storagePath !== undefined) updateData.storagePath = config.storagePath;
      if (config.isActive !== undefined) updateData.isActive = config.isActive;
      if (config.notifyOnSuccess !== undefined) updateData.notifyOnSuccess = config.notifyOnSuccess;
      if (config.notifyOnFailure !== undefined) updateData.notifyOnFailure = config.notifyOnFailure;
      if (config.notificationEmail !== undefined) updateData.notificationEmail = config.notificationEmail;

      await db.backupSchedule.update({
        where: { id: scheduleId },
        data: updateData,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<{ success: boolean; error?: string }> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      await db.backupSchedule.delete({
        where: { id: scheduleId },
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List schedules
   */
  async listSchedules(organizationId?: string): Promise<any[]> {
    if (!db) return [];

    return db.backupSchedule.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<any | null> {
    if (!db) return null;

    return db.backupSchedule.findUnique({
      where: { id: scheduleId },
    });
  }

  /**
   * Setup default schedules for an organization
   */
  async setupDefaultSchedules(organizationId?: string): Promise<void> {
    console.log('[BackupScheduler] Setting up default schedules...');

    // Daily incremental backup
    await this.createSchedule({
      name: 'Daily Incremental Backup',
      description: 'Daily incremental database backup',
      frequency: 'daily',
      backupType: 'incremental',
      category: 'database',
      retentionDays: DEFAULT_RETENTION_POLICY.daily,
      retentionCategory: 'daily',
      compressionType: 'gzip',
      isActive: true,
      notifyOnFailure: true,
    }, organizationId);

    // Weekly full backup
    await this.createSchedule({
      name: 'Weekly Full Backup',
      description: 'Weekly full system backup',
      frequency: 'weekly',
      backupType: 'full',
      category: 'full_system',
      retentionDays: DEFAULT_RETENTION_POLICY.weekly,
      retentionCategory: 'weekly',
      compressionType: 'gzip',
      encrypted: true,
      isActive: true,
      notifyOnFailure: true,
    }, organizationId);

    // Monthly archive backup
    await this.createSchedule({
      name: 'Monthly Archive Backup',
      description: 'Monthly archive backup with long retention',
      frequency: 'monthly',
      backupType: 'full',
      category: 'full_system',
      retentionDays: DEFAULT_RETENTION_POLICY.monthly,
      retentionCategory: 'monthly',
      compressionType: 'gzip',
      encrypted: true,
      isActive: true,
      notifyOnSuccess: true,
      notifyOnFailure: true,
    }, organizationId);

    console.log('[BackupScheduler] Default schedules created');
  }

  /**
   * Calculate next run time based on frequency
   */
  private calculateNextRun(frequency: ScheduleFrequency, cronExpression?: string | null): Date | null {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        // Run at 2 AM next day
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0);
        return tomorrow;

      case 'weekly':
        // Run at 2 AM on Sunday
        const nextSunday = new Date(now);
        const daysUntilSunday = (7 - nextSunday.getDay()) % 7 || 7;
        nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
        nextSunday.setHours(2, 0, 0, 0);
        return nextSunday;

      case 'monthly':
        // Run at 2 AM on the 1st of next month
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(2, 0, 0, 0);
        return nextMonth;

      case 'custom':
        // Parse cron expression (simplified - would use cron parser in production)
        if (cronExpression) {
          // For now, default to daily
          const custom = new Date(now);
          custom.setDate(custom.getDate() + 1);
          custom.setHours(2, 0, 0, 0);
          return custom;
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Cleanup expired backups
   */
  private async cleanupExpiredBackups(): Promise<void> {
    const result = await backupService.cleanupExpiredBackups();
    
    if (result.deleted > 0) {
      console.log(`[BackupScheduler] Cleaned up ${result.deleted} expired backups`);
    }

    if (result.errors.length > 0) {
      console.error('[BackupScheduler] Cleanup errors:', result.errors);
    }
  }

  /**
   * Send notification email
   */
  private async sendNotification(
    email: string,
    type: 'success' | 'failure',
    result: any
  ): Promise<void> {
    // In production, would integrate with email service
    console.log(`[BackupScheduler] Sending ${type} notification to ${email}`);
    console.log(`[BackupScheduler] Backup ID: ${result.id}, Status: ${result.status}`);
  }

  /**
   * Get retention policy
   */
  getRetentionPolicy(): RetentionPolicy {
    return { ...DEFAULT_RETENTION_POLICY };
  }

  /**
   * Apply retention policy to existing backups
   */
  async applyRetentionPolicy(organizationId?: string): Promise<{
    deleted: number;
    retained: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let deleted = 0;
    let retained = 0;

    if (!db) {
      return { deleted: 0, retained: 0, errors: ['Database not available'] };
    }

    const now = new Date();
    const policy = this.getRetentionPolicy();

    // Get all backups for the organization
    const backups = await db.backup.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    for (const backup of backups) {
      const age = Math.floor((now.getTime() - backup.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const retentionDays = this.getRetentionDays(backup.retentionCategory as RetentionCategory, policy);

      if (age > retentionDays) {
        try {
          const result = await backupService.deleteBackup(backup.id);
          if (result.success) {
            deleted++;
          } else {
            errors.push(`Failed to delete backup ${backup.backupNumber}: ${result.error}`);
          }
        } catch (error: any) {
          errors.push(`Error deleting backup ${backup.backupNumber}: ${error.message}`);
        }
      } else {
        retained++;
      }
    }

    return { deleted, retained, errors };
  }

  /**
   * Get retention days based on category
   */
  private getRetentionDays(category: RetentionCategory, policy: RetentionPolicy): number {
    switch (category) {
      case 'daily':
        return policy.daily;
      case 'weekly':
        return policy.weekly;
      case 'monthly':
        return policy.monthly;
      case 'archive':
        return policy.archive * 365; // Convert years to days
      default:
        return policy.daily;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; activeSchedules: number; lastCheck: Date } {
    return {
      isRunning: this.isRunning,
      activeSchedules: this.intervals.size - 1, // Subtract main interval
      lastCheck: new Date(),
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const backupScheduler = BackupScheduler.getInstance();
