#!/usr/bin/env node
/**
 * InsightGov Africa - Daily Reports Generator
 * ===========================================
 * Generates daily summary reports and sends them to administrators.
 *
 * Usage:
 *   node scripts/generate-daily-reports.js
 *
 * Environment variables required:
 *   - DATABASE_URL: PostgreSQL connection string
 *   - RESEND_API_KEY: For sending emails (optional)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateDailyReport() {
  console.log('📊 Generating daily report...');
  console.log(`   Date: ${new Date().toISOString().split('T')[0]}`);
  console.log('');

  try {
    // Get date range (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    // Gather statistics
    const [
      totalUsers,
      newUsers,
      activeUsers,
      totalDatasets,
      newDatasets,
      totalExports,
      failedLogins,
      activeSubscriptions,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // New users in last 24h
      prisma.user.count({
        where: { createdAt: { gte: yesterday } },
      }),

      // Active users in last 24h
      prisma.user.count({
        where: { lastLoginAt: { gte: yesterday } },
      }),

      // Total datasets
      prisma.dataset.count(),

      // New datasets in last 24h
      prisma.dataset.count({
        where: { createdAt: { gte: yesterday } },
      }),

      // Total exports in last 24h
      prisma.reportExport.count({
        where: { createdAt: { gte: yesterday } },
      }),

      // Failed logins in last 24h
      prisma.activityLog.count({
        where: {
          action: 'login_failed',
          createdAt: { gte: yesterday },
        },
      }),

      // Active subscriptions
      prisma.subscription.count({
        where: { status: 'active' },
      }),
    ]);

    // Build report
    const report = {
      date: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      statistics: {
        users: {
          total: totalUsers,
          new: newUsers,
          active: activeUsers,
        },
        datasets: {
          total: totalDatasets,
          new: newDatasets,
        },
        activity: {
          exports: totalExports,
          failedLogins,
        },
        subscriptions: {
          active: activeSubscriptions,
        },
      },
    };

    // Print report
    console.log('📈 Daily Statistics Report');
    console.log('='.repeat(40));
    console.log(`Date: ${report.date}`);
    console.log('');
    console.log('👥 Users:');
    console.log(`   Total: ${totalUsers}`);
    console.log(`   New (24h): ${newUsers}`);
    console.log(`   Active (24h): ${activeUsers}`);
    console.log('');
    console.log('📁 Datasets:');
    console.log(`   Total: ${totalDatasets}`);
    console.log(`   New (24h): ${newDatasets}`);
    console.log('');
    console.log('📊 Activity (24h):');
    console.log(`   Exports: ${totalExports}`);
    console.log(`   Failed Logins: ${failedLogins}`);
    console.log('');
    console.log('💰 Subscriptions:');
    console.log(`   Active: ${activeSubscriptions}`);
    console.log('');
    console.log('='.repeat(40));

    // TODO: Send email report if RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY && process.env.REPORT_EMAIL) {
      console.log('📧 Sending report email...');
      // Email sending logic would go here
      console.log('   (Email sending not implemented yet)');
    }

    return report;
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  generateDailyReport()
    .then(() => {
      console.log('\n✅ Report generated successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed to generate report:', error);
      process.exit(1);
    });
}

module.exports = { generateDailyReport };
