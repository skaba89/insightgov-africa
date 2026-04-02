/**
 * InsightGov Africa - AI Query API Route
 * ========================================
 * API pour les requêtes en langage naturel sur les données.
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeNaturalLanguageQuery, generateQuerySuggestions } from '@/lib/ai/natural-language-query';
import { requireAuth } from '@/lib/auth-middleware';
import type { ColumnMetadata } from '@/types';

/**
 * POST /api/ai/query
 * Exécute une requête en langage naturel
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  const authResult = await requireAuth(request, 'read');
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const auth = authResult.auth;

  try {
    const body = await request.json();
    const { query, data, columns, datasetId } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Requête requise' },
        { status: 400 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucune donnée disponible' },
        { status: 400 }
      );
    }

    // Journalisation pour audit
    console.log(`[AI Query] User ${auth.email} (${auth.userId}) executed query: "${query.substring(0, 100)}..."`);

    // Execute the natural language query
    const result = await executeNaturalLanguageQuery(query, data, columns as ColumnMetadata[]);

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Erreur exécution requête:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'exécution de la requête',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/query
 * Génère des suggestions de requêtes
 */
export async function GET(request: NextRequest) {
  // Vérifier l'authentification
  const authResult = await requireAuth(request, 'read');
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const auth = authResult.auth;

  try {
    const { searchParams } = new URL(request.url);
    const columnsJson = searchParams.get('columns');
    const currentQuery = searchParams.get('query') || '';

    if (!columnsJson) {
      return NextResponse.json(
        { success: false, error: 'Colonnes requises' },
        { status: 400 }
      );
    }

    const columns = JSON.parse(columnsJson) as ColumnMetadata[];
    const suggestions = await generateQuerySuggestions(columns, currentQuery);

    return NextResponse.json({
      success: true,
      suggestions,
      metadata: {
        userId: auth.userId,
        organizationId: auth.organizationId,
      },
    });
  } catch (error) {
    console.error('Erreur génération suggestions:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération des suggestions' },
      { status: 500 }
    );
  }
}
