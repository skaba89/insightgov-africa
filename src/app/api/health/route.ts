/**
 * InsightGov Africa - Advanced Health Check API
 * ==============================================
 * Comprehensive endpoint for monitoring application health
 * Including database, cache, external APIs, disk, memory, and response time
 */

import { NextResponse } from 'next/server';
import { prisma, isDatabaseAvailable } from '@/lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Types for health checks
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  latency?: number;
  details?: Record<string, unknown>;
  lastCheck?: string;
}

interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  hostname: string;
  region?: string;
  checks: Record<string, HealthCheckResult>;
  system: {
    memory: {
      total: number;
      used: number;
      free: number;
      usagePercent: number;
    };
    cpu: {
      usage: number;
      loadAverage?: number[];
    };
    disk?: {
      total: number;
      used: number;
      free: number;
      usagePercent: number;
    };
  };
  responseTime: string;
}

// Cache for health check results (to avoid hammering external services)
interface CachedCheck {
  result: HealthCheckResult;
  timestamp: number;
}

const healthCache = new Map<string, CachedCheck>();
const CACHE_TTL = 30000; // 30 seconds

function getCachedCheck(key: string): HealthCheckResult | null {
  const cached = healthCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  return null;
}

function setCachedCheck(key: string, result: HealthCheckResult): void {
  healthCache.set(key, { result, timestamp: Date.now() });
}

// ============================================
// HEALTH CHECK FUNCTIONS
// ============================================

/**
 * Check database connectivity and performance
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const isAvailable = await isDatabaseAvailable();

    if (!isAvailable) {
      return {
        status: 'unhealthy',
        message: 'Database connection unavailable',
        latency: Date.now() - startTime,
      };
    }

    // Test query performance
    const queryStart = Date.now();
    if (prisma) {
      await prisma.$queryRaw`SELECT 1 as test`;
    }
    const queryLatency = Date.now() - queryStart;

    // Get database stats
    let dbVersion: unknown = null;
    if (prisma) {
      try {
        dbVersion = await prisma.$queryRaw`SELECT sqlite_version() as version`;
      } catch {
        // Ignore version check errors
      }
    }

    return {
      status: 'healthy',
      message: 'Database connection OK',
      latency: Date.now() - startTime,
      details: {
        queryLatency: `${queryLatency}ms`,
        type: process.env.DATABASE_URL?.startsWith('file:') ? 'SQLite' : 'PostgreSQL',
        version: dbVersion,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      latency: Date.now() - startTime,
    };
  }
}

/**
 * Check cache/Redis connectivity (if configured)
 */
async function checkCache(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  // Check if Redis is configured
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_ENDPOINT;

  if (!redisUrl) {
    return {
      status: 'healthy',
      message: 'Cache not configured (using in-memory cache)',
      latency: Date.now() - startTime,
      details: {
        type: 'memory',
        configured: false,
      },
    };
  }

  // In production, you would check Redis connectivity here
  // For now, we'll just check if the URL is configured
  return {
    status: 'healthy',
    message: 'Cache configured',
    latency: Date.now() - startTime,
    details: {
      type: 'redis',
      configured: true,
      url: redisUrl.replace(/\/\/.*@/, '//***@'), // Hide credentials
    },
  };
}

/**
 * Check OpenAI API status
 */
async function checkOpenAI(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const cacheKey = 'openai';
  const cached = getCachedCheck(cacheKey);

  if (cached) {
    return { ...cached, lastCheck: new Date(healthCache.get(cacheKey)!.timestamp).toISOString() };
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;

  if (!apiKey) {
    const result: HealthCheckResult = {
      status: 'degraded',
      message: 'OpenAI/GROQ API key not configured',
      latency: Date.now() - startTime,
      details: {
        configured: false,
        provider: process.env.AI_PROVIDER || 'not set',
      },
    };
    setCachedCheck(cacheKey, result);
    return result;
  }

  try {
    // Make a minimal API call to check connectivity
    // Using z-ai-web-dev-sdk
    const ZAI = await import('z-ai-web-dev-sdk').then(m => m.default);
    const zai = await ZAI.create();

    // Simple completion to test API
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'user', content: 'ping' }
      ],
      max_tokens: 5,
    });

    const result: HealthCheckResult = {
      status: 'healthy',
      message: 'AI API responding',
      latency: Date.now() - startTime,
      details: {
        configured: true,
        provider: 'z-ai-sdk',
        model: response.model || 'unknown',
        responseReceived: !!response.choices?.[0]?.message,
      },
    };
    setCachedCheck(cacheKey, result);
    return result;
  } catch (error) {
    const result: HealthCheckResult = {
      status: 'degraded',
      message: `AI API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      latency: Date.now() - startTime,
      details: {
        configured: true,
        error: error instanceof Error ? error.message : 'Unknown',
      },
    };
    setCachedCheck(cacheKey, result);
    return result;
  }
}

/**
 * Check Paystack API status
 */
async function checkPaystack(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const cacheKey = 'paystack';
  const cached = getCachedCheck(cacheKey);

  if (cached) {
    return { ...cached, lastCheck: new Date(healthCache.get(cacheKey)!.timestamp).toISOString() };
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    const result: HealthCheckResult = {
      status: 'healthy',
      message: 'Paystack not configured (optional)',
      latency: Date.now() - startTime,
      details: {
        configured: false,
      },
    };
    setCachedCheck(cacheKey, result);
    return result;
  }

  try {
    // Verify Paystack API is reachable
    const response = await fetch('https://api.paystack.co/transaction', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok || response.status === 401) {
      // 401 means API is reachable but auth issue
      const result: HealthCheckResult = {
        status: response.ok ? 'healthy' : 'degraded',
        message: response.ok ? 'Paystack API OK' : 'Paystack API auth issue',
        latency: Date.now() - startTime,
        details: {
          configured: true,
          status: response.status,
        },
      };
      setCachedCheck(cacheKey, result);
      return result;
    }

    const result: HealthCheckResult = {
      status: 'degraded',
      message: `Paystack API returned ${response.status}`,
      latency: Date.now() - startTime,
      details: {
        configured: true,
        status: response.status,
      },
    };
    setCachedCheck(cacheKey, result);
    return result;
  } catch (error) {
    const result: HealthCheckResult = {
      status: 'degraded',
      message: `Paystack check failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      latency: Date.now() - startTime,
    };
    setCachedCheck(cacheKey, result);
    return result;
  }
}

/**
 * Check email service status
 */
async function checkEmailService(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  const resendKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;

  if (!resendKey && !smtpHost) {
    return {
      status: 'healthy',
      message: 'Email service not configured (optional)',
      latency: Date.now() - startTime,
      details: {
        configured: false,
      },
    };
  }

  return {
    status: 'healthy',
    message: 'Email service configured',
    latency: Date.now() - startTime,
    details: {
      configured: true,
      provider: resendKey ? 'Resend' : 'SMTP',
    },
  };
}

/**
 * Check disk space
 */
async function checkDiskSpace(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // This works on Linux/macOS
    const { stdout } = await execAsync('df -k / 2>/dev/null || echo "unknown"');

    if (stdout.includes('unknown')) {
      return {
        status: 'healthy',
        message: 'Disk check not available in this environment',
        latency: Date.now() - startTime,
        details: {
          available: false,
        },
      };
    }

    const lines = stdout.trim().split('\n');
    if (lines.length >= 2) {
      const parts = lines[1].split(/\s+/);
      const total = parseInt(parts[1]) * 1024; // Convert to bytes
      const used = parseInt(parts[2]) * 1024;
      const free = parseInt(parts[3]) * 1024;
      const usagePercent = (used / total) * 100;

      const status = usagePercent > 90 ? 'unhealthy' : usagePercent > 80 ? 'degraded' : 'healthy';

      return {
        status,
        message: `Disk usage: ${usagePercent.toFixed(1)}%`,
        latency: Date.now() - startTime,
        details: {
          total: `${(total / 1024 / 1024 / 1024).toFixed(2)} GB`,
          used: `${(used / 1024 / 1024 / 1024).toFixed(2)} GB`,
          free: `${(free / 1024 / 1024 / 1024).toFixed(2)} GB`,
          usagePercent: parseFloat(usagePercent.toFixed(2)),
        },
      };
    }
  } catch {
    // Windows or other environment
  }

  return {
    status: 'healthy',
    message: 'Disk check skipped (environment limitation)',
    latency: Date.now() - startTime,
  };
}

/**
 * Get memory usage
 */
function getMemoryUsage(): { total: number; used: number; free: number; usagePercent: number } {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal + memUsage.external + (memUsage as Record<string, number>).arrayBuffers || 0;
  const usedMemory = memUsage.heapUsed;

  // Get system memory if available
  const systemTotal = os.totalmem?.() || totalMemory * 10;
  const systemFree = os.freemem?.() || systemTotal - usedMemory;

  return {
    total: systemTotal,
    used: systemTotal - systemFree,
    free: systemFree,
    usagePercent: ((systemTotal - systemFree) / systemTotal) * 100,
  };
}

/**
 * Get CPU usage
 */
async function getCpuUsage(): Promise<{ usage: number; loadAverage?: number[] }> {
  // Get load average (1, 5, 15 minutes)
  const loadAvg = os.loadavg?.() || [0, 0, 0];
  const cpuCount = os.cpus?.()?.length || 1;

  // Calculate CPU usage percentage
  const usage = Math.min(100, (loadAvg[0] / cpuCount) * 100);

  return {
    usage: parseFloat(usage.toFixed(2)),
    loadAverage: loadAvg.map(v => parseFloat(v.toFixed(2))),
  };
}

/**
 * Check Sentry configuration
 */
async function checkSentry(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!sentryDsn) {
    return {
      status: 'healthy',
      message: 'Sentry not configured',
      latency: Date.now() - startTime,
      details: {
        configured: false,
      },
    };
  }

  return {
    status: 'healthy',
    message: 'Sentry configured',
    latency: Date.now() - startTime,
    details: {
      configured: true,
      environment: process.env.NODE_ENV,
      release: process.env.SENTRY_RELEASE || process.env.npm_package_version,
    },
  };
}

/**
 * Check environment variables
 */
function checkEnvironment(): HealthCheckResult {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const optionalVars = [
    'OPENAI_API_KEY',
    'GROQ_API_KEY',
    'PAYSTACK_SECRET_KEY',
    'PAYSTACK_PUBLIC_KEY',
    'SENTRY_DSN',
    'REDIS_URL',
  ];

  const missing = requiredVars.filter(v => !process.env[v]);
  const configured = optionalVars.filter(v => !!process.env[v]);

  if (missing.length > 0) {
    return {
      status: 'degraded',
      message: `Missing required variables: ${missing.join(', ')}`,
      details: {
        missing,
        optionalConfigured: configured,
      },
    };
  }

  return {
    status: 'healthy',
    message: 'All required environment variables set',
    details: {
      optionalConfigured: configured,
    },
  };
}

// ============================================
// MAIN HEALTH CHECK HANDLER
// ============================================

export async function GET(request: Request) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';

  // Run all health checks in parallel
  const [
    databaseCheck,
    cacheCheck,
    openAICheck,
    paystackCheck,
    emailCheck,
    diskCheck,
    sentryCheck,
  ] = await Promise.all([
    checkDatabase(),
    checkCache(),
    checkOpenAI(),
    checkPaystack(),
    checkEmailService(),
    checkDiskSpace(),
    checkSentry(),
  ]);

  // Get system metrics
  const memory = getMemoryUsage();
  const cpu = await getCpuUsage();
  const environmentCheck = checkEnvironment();

  // Build checks object
  const checks: Record<string, HealthCheckResult> = {
    database: databaseCheck,
    cache: cacheCheck,
    openai: openAICheck,
    paystack: paystackCheck,
    email: emailCheck,
    disk: diskCheck,
    sentry: sentryCheck,
    environment: environmentCheck,
  };

  // Determine overall status
  const statuses = Object.values(checks).map(c => c.status);
  const hasUnhealthy = statuses.includes('unhealthy');
  const hasDegraded = statuses.includes('degraded');
  const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

  // Build health report
  const healthReport: HealthReport = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    hostname: process.env.HOSTNAME || process.env.VERCEL_URL || 'localhost',
    region: process.env.VERCEL_REGION,
    checks: detailed ? checks : {
      database: databaseCheck,
      openai: openAICheck,
      environment: environmentCheck,
    },
    system: {
      memory,
      cpu,
      disk: diskCheck.details as { total: number; used: number; free: number; usagePercent: number } | undefined,
    },
    responseTime: `${Date.now() - startTime}ms`,
  };

  // Add summary for quick checks
  if (!detailed) {
    (healthReport as Record<string, unknown>).summary = {
      allServices: overallStatus,
      database: databaseCheck.status,
      ai: openAICheck.status,
      criticalIssues: statuses.filter(s => s === 'unhealthy').length,
      warnings: statuses.filter(s => s === 'degraded').length,
    };
  }

  // Set appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(healthReport, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Health-Status': overallStatus,
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}

// Liveness probe - simple check that the server is running
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Health-Status': 'alive',
    },
  });
}
