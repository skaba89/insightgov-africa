/**
 * InsightGov Africa - Readiness Probe
 * ====================================
 * Checks if the application is ready to receive traffic.
 * This includes database connectivity check.
 *
 * Use /api/health/live for liveness (is the server running?)
 * Use /api/health/ready for readiness (can we serve requests?)
 * Use /api/health for full health report
 */

import { NextResponse } from 'next/server';
import { prisma, isDatabaseAvailable } from '@/lib/db';

/**
 * GET /api/health/ready
 * Readiness probe - checks database connectivity
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity
    const dbAvailable = await isDatabaseAvailable();

    if (!dbAvailable) {
      return NextResponse.json(
        {
          status: 'not_ready',
          reason: 'database_unavailable',
          timestamp: new Date().toISOString(),
          responseTime: `${Date.now() - startTime}ms`,
        },
        {
          status: 503,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'X-Health-Check': 'ready',
            'X-Health-Status': 'not_ready',
          },
        }
      );
    }

    // Optional: Run a simple query to verify database is responsive
    if (prisma) {
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (dbError) {
        return NextResponse.json(
          {
            status: 'not_ready',
            reason: 'database_query_failed',
            error: dbError instanceof Error ? dbError.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            responseTime: `${Date.now() - startTime}ms`,
          },
          {
            status: 503,
            headers: {
              'Cache-Control': 'no-store, max-age=0',
              'X-Health-Check': 'ready',
              'X-Health-Status': 'not_ready',
            },
          }
        );
      }
    }

    return NextResponse.json(
      {
        status: 'ready',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        checks: {
          database: 'healthy',
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Health-Check': 'ready',
          'X-Health-Status': 'ready',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not_ready',
        reason: 'internal_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Health-Check': 'ready',
          'X-Health-Status': 'not_ready',
        },
      }
    );
  }
}

/**
 * HEAD /api/health/ready
 * Lightweight readiness probe
 */
export async function HEAD() {
  try {
    const dbAvailable = await isDatabaseAvailable();

    if (!dbAvailable) {
      return new NextResponse(null, {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Health-Check': 'ready',
          'X-Health-Status': 'not_ready',
        },
      });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Health-Check': 'ready',
        'X-Health-Status': 'ready',
      },
    });
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Health-Check': 'ready',
        'X-Health-Status': 'not_ready',
      },
    });
  }
}
