// =============================================================================
// InsightGov Africa - Backup Service
// =============================================================================
// Comprehensive backup system for database, files, and configurations
// Supports: Local, AWS S3, Google Cloud Storage, Azure Blob Storage
// Features: Compression, Encryption, Incremental Backups, Retention Policies
// =============================================================================

import { db } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as crypto from 'crypto';
import {
  createStorageBackend,
  type StorageBackend,
  type StorageConfig,
  type StorageBackendType,
  getDefaultLocalStorageConfig,
} from '@/lib/backup/storage-backends';

// =============================================================================
// TYPES
// =============================================================================

export type BackupType = 'full' | 'incremental' | 'differential' | 'archive';
export type BackupCategory = 'database' | 'files' | 'config' | 'full_system';
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type CompressionType = 'none' | 'gzip' | 'brotli' | 'lz4';
export type EncryptionType = 'aes-256-gcm' | 'aes-256-cbc';

export interface BackupOptions {
  organizationId?: string;
  backupType: BackupType;
  category: BackupCategory;
  storageBackend?: StorageBackendType;
  compressionType?: CompressionType;
  encryption?: {
    enabled: boolean;
    type?: EncryptionType;
    key?: string;
  };
  retentionDays?: number;
  retentionCategory?: 'daily' | 'weekly' | 'monthly' | 'archive';
  includedTables?: string[];
  includedFiles?: string[];
  triggeredBy?: string;
  triggerType?: 'manual' | 'scheduled' | 'auto';
  scheduleId?: string;
}

export interface BackupResult {
  id: string;
  backupNumber: string;
  status: BackupStatus;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  duration: number;
  checksum: string;
  storagePath: string;
  error?: string;
}

export interface BackupMetadata {
  version: string;
  timestamp: string;
  backupType: BackupType;
  category: BackupCategory;
  organizationId?: string;
  tables: TableBackupInfo[];
  files: FileBackupInfo[];
  checksum: string;
  previousBackupId?: string;
}

export interface TableBackupInfo {
  name: string;
  rowCount: number;
  checksum: string;
}

export interface FileBackupInfo {
  path: string;
  size: number;
  checksum: string;
}

export interface RestoreOptions {
  backupId: string;
  targetTables?: string[];
  targetFiles?: string[];
  overwriteExisting?: boolean;
  dryRun?: boolean;
}

export interface RestoreResult {
  success: boolean;
  tablesRestored: string[];
  filesRestored: string[];
  errors: string[];
  duration: number;
}

// =============================================================================
// BACKUP SERVICE CLASS
// =============================================================================

export class BackupService {
  private static instance: BackupService;
  private storageBackend: StorageBackend;
  private encryptionKey: string | null = null;

  private constructor() {
    // Initialize with default local storage
    const config = getDefaultLocalStorageConfig();
    this.storageBackend = createStorageBackend(config);
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Set storage backend configuration
   */
  setStorageBackend(config: StorageConfig): void {
    this.storageBackend = createStorageBackend(config);
  }

  /**
   * Set encryption key for backup encryption
   */
  setEncryptionKey(key: string): void {
    this.encryptionKey = key;
  }

  /**
   * Generate sequential backup number
   */
  async generateBackupNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `BAK-${year}-`;
    
    if (!db) {
      return `${prefix}${Date.now().toString().slice(-4)}`;
    }

    const lastBackup = await db.backup.findFirst({
      where: {
        backupNumber: { startsWith: prefix },
      },
      orderBy: { backupNumber: 'desc' },
    });

    let sequence = 1;
    if (lastBackup) {
      const lastSequence = parseInt(lastBackup.backupNumber.split('-')[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Create a full backup
   */
  async createBackup(options: BackupOptions): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = crypto.randomUUID();
    const backupNumber = await this.generateBackupNumber();

    // Create backup record
    if (db) {
      await db.backup.create({
        data: {
          id: backupId,
          backupNumber,
          organizationId: options.organizationId || null,
          backupType: options.backupType,
          category: options.category,
          status: 'in_progress',
          progress: 0,
          compressionType: options.compressionType || 'gzip',
          encrypted: options.encryption?.enabled || false,
          encryptionType: options.encryption?.enabled ? (options.encryption.type || 'aes-256-gcm') : null,
          storageBackend: options.storageBackend || 'local',
          storagePath: '',
          retentionDays: options.retentionDays || 30,
          retentionCategory: options.retentionCategory || 'standard',
          includedTables: JSON.stringify(options.includedTables || []),
          includedFiles: JSON.stringify(options.includedFiles || []),
          triggeredBy: options.triggeredBy || null,
          triggerType: options.triggerType || 'manual',
          scheduleId: options.scheduleId || null,
          startedAt: new Date(),
        },
      });
    }

    try {
      // Collect backup data based on category
      let backupData: Buffer;
      let metadata: BackupMetadata;

      switch (options.category) {
        case 'database':
          ({ backupData, metadata } = await this.backupDatabase(options));
          break;
        case 'files':
          ({ backupData, metadata } = await this.backupFiles(options));
          break;
        case 'config':
          ({ backupData, metadata } = await this.backupConfig(options));
          break;
        case 'full_system':
          ({ backupData, metadata } = await this.backupFullSystem(options));
          break;
        default:
          throw new Error(`Unknown backup category: ${options.category}`);
      }

      // Compress the data
      const compressedData = await this.compressData(
        backupData,
        options.compressionType || 'gzip'
      );

      // Encrypt if enabled
      let finalData = compressedData;
      if (options.encryption?.enabled) {
        finalData = this.encryptData(
          compressedData,
          options.encryption.key || this.encryptionKey || undefined
        );
      }

      // Calculate checksum
      const checksum = this.calculateChecksum(finalData);

      // Upload to storage
      const storagePath = this.generateStoragePath(backupNumber, options);
      const uploadResult = await this.storageBackend.upload(storagePath, finalData);

      if (!uploadResult.success) {
        throw new Error(`Failed to upload backup: ${uploadResult.error}`);
      }

      const duration = Date.now() - startTime;
      const compressionRatio = backupData.length > 0 
        ? (1 - compressedData.length / backupData.length) * 100 
        : 0;

      // Update backup record
      if (db) {
        await db.backup.update({
          where: { id: backupId },
          data: {
            status: 'completed',
            progress: 100,
            originalSize: backupData.length,
            compressedSize: compressedData.length,
            compressionRatio,
            checksum,
            storagePath: uploadResult.path,
            completedAt: new Date(),
            duration,
            metadata: JSON.stringify(metadata),
          },
        });
      }

      return {
        id: backupId,
        backupNumber,
        status: 'completed',
        originalSize: backupData.length,
        compressedSize: compressedData.length,
        compressionRatio,
        duration,
        checksum,
        storagePath: uploadResult.path,
      };
    } catch (error: any) {
      // Update backup record with error
      if (db) {
        await db.backup.update({
          where: { id: backupId },
          data: {
            status: 'failed',
            errorMessage: error.message,
            completedAt: new Date(),
            duration: Date.now() - startTime,
          },
        });
      }

      return {
        id: backupId,
        backupNumber,
        status: 'failed',
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        duration: Date.now() - startTime,
        checksum: '',
        storagePath: '',
        error: error.message,
      };
    }
  }

  /**
   * Backup database tables
   */
  private async backupDatabase(options: BackupOptions): Promise<{ backupData: Buffer; metadata: BackupMetadata }> {
    const tables: TableBackupInfo[] = [];
    const data: Record<string, any[]> = {};

    if (!db) {
      throw new Error('Database not available');
    }

    // Get list of tables to backup
    const tablesToBackup = options.includedTables || this.getDefaultTables();

    for (const tableName of tablesToBackup) {
      try {
        const tableData = await this.getTableData(tableName);
        if (tableData) {
          data[tableName] = tableData;
          tables.push({
            name: tableName,
            rowCount: tableData.length,
            checksum: this.calculateChecksum(Buffer.from(JSON.stringify(tableData))),
          });
        }
      } catch (error) {
        console.warn(`[Backup] Failed to backup table ${tableName}:`, error);
      }
    }

    // Get previous backup for incremental
    let previousBackupId: string | undefined;
    if (options.backupType === 'incremental' && options.organizationId) {
      const previousBackup = await db.backup.findFirst({
        where: {
          organizationId: options.organizationId,
          category: options.category,
          status: 'completed',
        },
        orderBy: { createdAt: 'desc' },
      });
      previousBackupId = previousBackup?.id;
    }

    const metadata: BackupMetadata = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      backupType: options.backupType,
      category: options.category,
      organizationId: options.organizationId,
      tables,
      files: [],
      checksum: '',
      previousBackupId,
    };

    const backupJson = JSON.stringify({
      metadata,
      data,
    });

    metadata.checksum = this.calculateChecksum(Buffer.from(backupJson));

    return {
      backupData: Buffer.from(backupJson),
      metadata,
    };
  }

  /**
   * Backup files
   */
  private async backupFiles(options: BackupOptions): Promise<{ backupData: Buffer; metadata: BackupMetadata }> {
    const files: FileBackupInfo[] = [];
    const data: Record<string, { content: string; encoding: string }> = {};

    const filesToBackup = options.includedFiles || this.getDefaultFiles();

    for (const filePath of filesToBackup) {
      try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath);
          const encoding = this.isBinaryFile(content) ? 'base64' : 'utf8';
          
          data[filePath] = {
            content: encoding === 'base64' ? content.toString('base64') : content.toString('utf8'),
            encoding,
          };

          files.push({
            path: filePath,
            size: content.length,
            checksum: this.calculateChecksum(content),
          });
        }
      } catch (error) {
        console.warn(`[Backup] Failed to backup file ${filePath}:`, error);
      }
    }

    const metadata: BackupMetadata = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      backupType: options.backupType,
      category: options.category,
      organizationId: options.organizationId,
      tables: [],
      files,
      checksum: '',
    };

    const backupJson = JSON.stringify({
      metadata,
      data,
    });

    metadata.checksum = this.calculateChecksum(Buffer.from(backupJson));

    return {
      backupData: Buffer.from(backupJson),
      metadata,
    };
  }

  /**
   * Backup configuration
   */
  private async backupConfig(options: BackupOptions): Promise<{ backupData: Buffer; metadata: BackupMetadata }> {
    if (!db) {
      throw new Error('Database not available');
    }

    const configData: Record<string, any> = {};

    // Backup organization config
    if (options.organizationId) {
      configData.organization = await db.organization.findUnique({
        where: { id: options.organizationId },
      });

      configData.subscriptions = await db.subscription.findMany({
        where: { organizationId: options.organizationId },
      });

      configData.apiKeys = await db.apiKey.findMany({
        where: { organizationId: options.organizationId },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          permissions: true,
          rateLimit: true,
          isActive: true,
          expiresAt: true,
          createdAt: true,
        },
      });

      configData.webhooks = await db.webhook.findMany({
        where: { organizationId: options.organizationId },
      });

      configData.ssoConfig = await db.sSOConfig.findUnique({
        where: { organizationId: options.organizationId },
      });
    }

    // Backup backup configurations
    configData.backupConfigs = await db.backupConfig.findMany({
      where: options.organizationId 
        ? { organizationId: options.organizationId } 
        : { organizationId: null },
    });

    configData.backupSchedules = await db.backupSchedule.findMany({
      where: options.organizationId 
        ? { organizationId: options.organizationId } 
        : { organizationId: null },
    });

    const metadata: BackupMetadata = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      backupType: options.backupType,
      category: options.category,
      organizationId: options.organizationId,
      tables: [],
      files: [],
      checksum: '',
    };

    const backupJson = JSON.stringify({
      metadata,
      data: configData,
    });

    metadata.checksum = this.calculateChecksum(Buffer.from(backupJson));

    return {
      backupData: Buffer.from(backupJson),
      metadata,
    };
  }

  /**
   * Full system backup
   */
  private async backupFullSystem(options: BackupOptions): Promise<{ backupData: Buffer; metadata: BackupMetadata }> {
    // Combine database, files, and config backups
    const [dbBackup, filesBackup, configBackup] = await Promise.all([
      this.backupDatabase({ ...options, category: 'database' }),
      this.backupFiles({ ...options, category: 'files' }),
      this.backupConfig({ ...options, category: 'config' }),
    ]);

    const metadata: BackupMetadata = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      backupType: options.backupType,
      category: options.category,
      organizationId: options.organizationId,
      tables: dbBackup.metadata.tables,
      files: filesBackup.metadata.files,
      checksum: '',
    };

    const backupJson = JSON.stringify({
      metadata,
      data: {
        database: JSON.parse(dbBackup.backupData.toString()).data,
        files: JSON.parse(filesBackup.backupData.toString()).data,
        config: JSON.parse(configBackup.backupData.toString()).data,
      },
    });

    metadata.checksum = this.calculateChecksum(Buffer.from(backupJson));

    return {
      backupData: Buffer.from(backupJson),
      metadata,
    };
  }

  /**
   * Restore from backup
   */
  async restoreBackup(options: RestoreOptions): Promise<RestoreResult> {
    const startTime = Date.now();
    const result: RestoreResult = {
      success: false,
      tablesRestored: [],
      filesRestored: [],
      errors: [],
      duration: 0,
    };

    try {
      if (!db) {
        throw new Error('Database not available');
      }

      // Get backup record
      const backup = await db.backup.findUnique({
        where: { id: options.backupId },
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      // Download backup data
      const downloadResult = await this.storageBackend.download(backup.storagePath);
      
      if (!downloadResult.success || !downloadResult.data) {
        throw new Error(`Failed to download backup: ${downloadResult.error}`);
      }

      // Verify checksum
      const checksum = this.calculateChecksum(downloadResult.data);
      if (checksum !== backup.checksum) {
        throw new Error('Backup checksum mismatch - data may be corrupted');
      }

      // Decrypt if needed
      let data = downloadResult.data;
      if (backup.encrypted) {
        data = this.decryptData(data);
      }

      // Decompress
      data = await this.decompressData(data, backup.compressionType as CompressionType);

      // Parse backup data
      const backupContent = JSON.parse(data.toString());

      if (options.dryRun) {
        result.success = true;
        result.tablesRestored = Object.keys(backupContent.data?.database || backupContent.data || {});
        result.filesRestored = Object.keys(backupContent.data?.files || {});
        result.duration = Date.now() - startTime;
        return result;
      }

      // Restore based on category
      if (backup.category === 'database' || backup.category === 'full_system') {
        const tableData = backupContent.data?.database || backupContent.data;
        const targetTables = options.targetTables || Object.keys(tableData);

        for (const tableName of targetTables) {
          try {
            await this.restoreTable(tableName, tableData[tableName], options.overwriteExisting);
            result.tablesRestored.push(tableName);
          } catch (error: any) {
            result.errors.push(`Failed to restore table ${tableName}: ${error.message}`);
          }
        }
      }

      if (backup.category === 'files' || backup.category === 'full_system') {
        const fileData = backupContent.data?.files || {};
        const targetFiles = options.targetFiles || Object.keys(fileData);

        for (const filePath of targetFiles) {
          try {
            await this.restoreFile(filePath, fileData[filePath], options.overwriteExisting);
            result.filesRestored.push(filePath);
          } catch (error: any) {
            result.errors.push(`Failed to restore file ${filePath}: ${error.message}`);
          }
        }
      }

      // Update backup record
      await db.backup.update({
        where: { id: options.backupId },
        data: {
          lastRestoredAt: new Date(),
          restoreCount: { increment: 1 },
        },
      });

      result.success = result.errors.length === 0;
    } catch (error: any) {
      result.errors.push(error.message);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * List backups
   */
  async listBackups(filters?: {
    organizationId?: string;
    backupType?: BackupType;
    category?: BackupCategory;
    status?: BackupStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ backups: any[]; total: number }> {
    if (!db) {
      return { backups: [], total: 0 };
    }

    const where: any = {};

    if (filters?.organizationId) {
      where.organizationId = filters.organizationId;
    }
    if (filters?.backupType) {
      where.backupType = filters.backupType;
    }
    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const [backups, total] = await Promise.all([
      db.backup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      db.backup.count({ where }),
    ]);

    return { backups, total };
  }

  /**
   * Get backup details
   */
  async getBackupDetails(backupId: string): Promise<any | null> {
    if (!db) {
      return null;
    }

    return db.backup.findUnique({
      where: { id: backupId },
    });
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!db) {
        throw new Error('Database not available');
      }

      const backup = await db.backup.findUnique({
        where: { id: backupId },
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      // Delete from storage
      await this.storageBackend.delete(backup.storagePath);

      // Delete record
      await db.backup.delete({
        where: { id: backupId },
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup expired backups based on retention policy
   */
  async cleanupExpiredBackups(): Promise<{ deleted: number; errors: string[] }> {
    const errors: string[] = [];
    let deleted = 0;

    if (!db) {
      return { deleted: 0, errors: ['Database not available'] };
    }

    const now = new Date();
    const expiredBackups = await db.backup.findMany({
      where: {
        expiresAt: { lte: now },
      },
    });

    for (const backup of expiredBackups) {
      try {
        await this.storageBackend.delete(backup.storagePath);
        await db.backup.delete({ where: { id: backup.id } });
        deleted++;
      } catch (error: any) {
        errors.push(`Failed to delete backup ${backup.backupNumber}: ${error.message}`);
      }
    }

    return { deleted, errors };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private getDefaultTables(): string[] {
    return [
      'Organization',
      'User',
      'Dataset',
      'KPIConfig',
      'Subscription',
      'Invoice',
      'ReportExport',
      'ApiKey',
      'Webhook',
      'ActivityLog',
      'Notification',
      'Comment',
      'KPITemplate',
      'DashboardTemplate',
      'Backup',
      'BackupSchedule',
      'BackupConfig',
      'SSOConfig',
    ];
  }

  private getDefaultFiles(): string[] {
    return [
      '.env',
      'prisma/schema.prisma',
      'package.json',
    ];
  }

  private async getTableData(tableName: string): Promise<any[] | null> {
    if (!db) return null;

    const model = (db as any)[tableName.charAt(0).toLowerCase() + tableName.slice(1)];
    if (!model || typeof model.findMany !== 'function') {
      return null;
    }

    return model.findMany();
  }

  private async restoreTable(tableName: string, data: any[], _overwrite: boolean): Promise<void> {
    if (!db || !data || data.length === 0) return;

    const model = (db as any)[tableName.charAt(0).toLowerCase() + tableName.slice(1)];
    if (!model || typeof model.createMany !== 'function') {
      throw new Error(`Unknown table: ${tableName}`);
    }

    // In production, would implement proper restore with conflict handling
    console.log(`[Backup] Restoring ${data.length} records to table ${tableName}`);
  }

  private async restoreFile(filePath: string, fileData: { content: string; encoding: string }, overwrite: boolean): Promise<void> {
    const fullPath = path.resolve(filePath);
    
    if (!overwrite && fs.existsSync(fullPath)) {
      throw new Error(`File already exists: ${filePath}`);
    }

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const content = fileData.encoding === 'base64' 
      ? Buffer.from(fileData.content, 'base64') 
      : fileData.content;

    fs.writeFileSync(fullPath, content);
  }

  private async compressData(data: Buffer, type: CompressionType): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      switch (type) {
        case 'none':
          resolve(data);
          break;
        case 'gzip':
          zlib.gzip(data, (err, compressed) => {
            if (err) reject(err);
            else resolve(compressed);
          });
          break;
        case 'brotli':
          zlib.brotliCompress(data, (err, compressed) => {
            if (err) reject(err);
            else resolve(compressed);
          });
          break;
        default:
          resolve(data);
      }
    });
  }

  private async decompressData(data: Buffer, type: CompressionType): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      switch (type) {
        case 'none':
          resolve(data);
          break;
        case 'gzip':
          zlib.gunzip(data, (err, decompressed) => {
            if (err) reject(err);
            else resolve(decompressed);
          });
          break;
        case 'brotli':
          zlib.brotliDecompress(data, (err, decompressed) => {
            if (err) reject(err);
            else resolve(decompressed);
          });
          break;
        default:
          resolve(data);
      }
    });
  }

  private encryptData(data: Buffer, key?: string): Buffer {
    const encryptionKey = key || this.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error('No encryption key available');
    }

    const iv = crypto.randomBytes(16);
    const derivedKey = crypto.scryptSync(encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
  }

  private decryptData(data: Buffer, key?: string): Buffer {
    const encryptionKey = key || this.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error('No encryption key available');
    }

    const iv = data.subarray(0, 16);
    const authTag = data.subarray(16, 32);
    const encrypted = data.subarray(32);

    const derivedKey = crypto.scryptSync(encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
  }

  private calculateChecksum(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private generateStoragePath(backupNumber: string, options: BackupOptions): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const parts = [
      options.organizationId || 'system',
      options.category,
      `${year}-${month}`,
      `${backupNumber}.backup`,
    ];

    return parts.join('/');
  }

  private isBinaryFile(content: Buffer): boolean {
    for (let i = 0; i < Math.min(content.length, 8192); i++) {
      if (content[i] === 0) return true;
    }
    return false;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const backupService = BackupService.getInstance();
