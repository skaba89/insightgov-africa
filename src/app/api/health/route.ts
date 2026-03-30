/**
 * InsightGov Africa - Health Check API
 * ======================================
 * Comprehensive endpoint for checking application status
 */

import { NextResponse } from 'next/server';
import { prisma, isDatabaseAvailable } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: string; message?: string; latency?: number }> = {};
  
  // Check database connection
  try {
    const dbStart = Date.now();
    const dbStatus = await isDatabaseAvailable();
    checks.database = {
      status: dbStatus ? 'connected' : 'disconnected',
      latency: Date.now() - dbStart,
      message: dbStatus ? 'PostgreSQL connection OK' : 'Cannot connect to PostgreSQL',
    };
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
  
  // Check environment variables
  const envVars = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
  };
  
  const missingEnvVars = Object.entries(envVars)
    .filter(([, has]) => !has)
    .map(([key]) => key);
  
  checks.environment = {
    status: missingEnvVars.length === 0 ? 'ok' : 'missing',
    message: missingEnvVars.length > 0 
      ? `Missing: ${missingEnvVars.join(', ')}`
      : 'All required variables set',
  };
  
  // Check Prisma client
  checks.prisma = {
    status: prisma ? 'initialized' : 'not_initialized',
    message: prisma ? 'Prisma client ready' : 'Prisma client not available',
  };
  
  // Check AI configuration
  checks.ai = {
    status: process.env.GROQ_API_KEY ? 'configured' : 'not_configured',
    message: process.env.AI_PROVIDER || 'groq',
  };
  
  // Determine overall status
  const isHealthy = checks.database.status === 'connected' && missingEnvVars.length === 0;
  const isDegraded = checks.database.status === 'disconnected' || missingEnvVars.length > 0;
  
  const health = {
    status: isHealthy ? 'healthy' : (isDegraded ? 'degraded' : 'unhealthy'),
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    hostname: process.env.HOSTNAME || 'localhost',
    checks,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? '***' : undefined,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AI_PROVIDER: process.env.AI_PROVIDER,
    },
    responseTime: `${Date.now() - startTime}ms`,
  };
  
  const statusCode = isHealthy ? 200 : (isDegraded ? 200 : 503);
  
  return NextResponse.json(health, { status: statusCode });
}
