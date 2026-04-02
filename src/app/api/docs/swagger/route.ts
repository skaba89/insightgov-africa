// ============================================
// InsightGov Africa - Swagger/OpenAPI Route
// Returns the complete OpenAPI specification
// ============================================

import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi/spec';

/**
 * GET /api/docs/swagger
 * Returns the OpenAPI 3.0 specification for InsightGov Africa API
 * 
 * This endpoint serves the complete API documentation spec that can be used with:
 * - Swagger UI
 * - Postman
 * - Insomnia
 * - OpenAPI Generator
 * - Redoc
 */
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * OPTIONS /api/docs/swagger
 * CORS preflight handler
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
