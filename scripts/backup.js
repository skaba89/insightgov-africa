#!/usr/bin/env node
/**
 * InsightGov Africa - Database Backup Script
 * ==========================================
 * Creates a backup of the PostgreSQL database and uploads to S3.
 *
 * Usage:
 *   node scripts/backup.js
 *
 * Environment variables required:
 *   - DATABASE_URL: PostgreSQL connection string
 *   - AWS_ACCESS_KEY_ID: AWS access key
 *   - AWS_SECRET_ACCESS_KEY: AWS secret key
 *   - S3_BUCKET: S3 bucket name for backups
 *   - AWS_REGION: AWS region (default: us-east-1)
 */

const { exec } = require('child_process');
const { promisify } = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || '/tmp/backups';
const S3_BUCKET = process.env.S3_BUCKET;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const DATABASE_URL = process.env.DATABASE_URL;

// Generate backup filename
function getBackupFilename() {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `insightgov-backup-${dateStr}-${timeStr}.sql`;
}

async function createBackup() {
  console.log('🗄️  Starting database backup...');
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log('');

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const backupFile = path.join(BACKUP_DIR, getBackupFilename());
  console.log(`   Output: ${backupFile}`);

  try {
    // Create backup directory
    console.log('\n📁 Creating backup directory...');
    await execAsync(`mkdir -p ${BACKUP_DIR}`);

    // Parse database URL for pg_dump
    const dbUrl = new URL(DATABASE_URL);
    const dbName = dbUrl.pathname.slice(1);
    const dbHost = dbUrl.hostname;
    const dbPort = dbUrl.port || '5432';
    const dbUser = dbUrl.username;

    console.log(`   Database: ${dbName}`);
    console.log(`   Host: ${dbHost}:${dbPort}`);

    // Create environment for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: dbUrl.password,
    };

    // Run pg_dump
    console.log('\n💾 Creating database dump...');
    const { stdout, stderr } = await execAsync(
      `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f ${backupFile}`,
      { env, maxBuffer: 1024 * 1024 * 100 } // 100MB buffer
    );

    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('   Warning:', stderr);
    }

    console.log('   ✅ Database dump created');

    // Compress backup
    console.log('\n📦 Compressing backup...');
    await execAsync(`gzip -f ${backupFile}`);
    const compressedFile = `${backupFile}.gz`;
    console.log(`   ✅ Compressed: ${compressedFile}`);

    // Get file size
    const { stdout: sizeOutput } = await execAsync(`du -h ${compressedFile} | cut -f1`);
    console.log(`   Size: ${sizeOutput.trim()}`);

    // Upload to S3 if configured
    if (S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
      console.log('\n☁️  Uploading to S3...');
      const s3Key = `backups/${path.basename(compressedFile)}`;
      const s3Path = `s3://${S3_BUCKET}/${s3Key}`;

      await execAsync(
        `aws s3 cp ${compressedFile} ${s3Path} --region ${AWS_REGION}`
      );

      console.log(`   ✅ Uploaded to: ${s3Path}`);

      // Clean up local file
      await execAsync(`rm -f ${compressedFile}`);
      console.log('   🧹 Cleaned up local backup');
    } else {
      console.log('\n⚠️  S3 not configured, backup saved locally');
      console.log(`   Location: ${compressedFile}`);
    }

    // Clean up old backups (keep last 7 days)
    console.log('\n🧹 Cleaning up old backups...');
    await execAsync(`find ${BACKUP_DIR} -name "*.gz" -mtime +7 -delete`);
    console.log('   ✅ Old backups cleaned');

    console.log('\n✅ Backup completed successfully!');
    console.log(`   Finished at: ${new Date().toISOString()}`);

    return { success: true, file: compressedFile };
  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createBackup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Backup failed:', error);
      process.exit(1);
    });
}

module.exports = { createBackup };
