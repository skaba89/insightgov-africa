/**
 * InsightGov Africa - Liveness Probe
 * ===================================
 * Ultra-simple endpoint for container orchestration health checks.
 * This endpoint is designed to be fast and lightweight for Kubernetes/Docker probes.
 *
 * Use /api/health for detailed health information.
 * Use /api/health/live for simple liveness probes.
 */

import { NextResponse } from 'next/server';

/**
 * GET /api/health/live
 * Simple liveness probe - returns 200 if the server is running
 */
export async function GET() {
  return NextResponse.json(
    { status: 'alive', timestamp: new Date().toISOString() },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Health-Check': 'live',
      },
    }
  );
}

/**
 * HEAD /api/health/live
 * Even lighter probe for frequent health checks
 */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Health-Check': 'live',
    },
  });
}
