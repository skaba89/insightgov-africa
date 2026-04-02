/**
 * InsightGov Africa - Health Check API
 * ======================================
 * Endpoint de santé pour Render et les load balancers
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'insightgov-africa',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: await checkDatabaseConnection(),
      ai: checkAIConfig(),
      auth: checkAuthConfig(),
    }
  };

  return NextResponse.json(health, { status: 200 });
}

/**
 * Vérifie la connexion à la base de données
 */
async function checkDatabaseConnection(): Promise<string> {
  try {
    if (!process.env.DATABASE_URL) {
      return 'not_configured';
    }

    // Try a simple query
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch (error) {
    console.error('Database check failed:', error);
    return 'connection_error';
  }
}

/**
 * Vérifie la configuration IA
 */
function checkAIConfig(): string {
  const provider = process.env.AI_PROVIDER || 'groq';

  if (provider === 'groq' && process.env.GROQ_API_KEY) {
    return 'groq_configured';
  }

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return 'openai_configured';
  }

  return 'not_configured';
}

/**
 * Vérifie la configuration NextAuth
 */
function checkAuthConfig(): string {
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL) {
    return 'configured';
  }
  return 'not_configured';
}
