/**
 * InsightGov Africa - Chat API Endpoint
 * ======================================
 * API pour l'assistant conversationnel IA
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import {
  generateChatResponse,
  generateQuestionSuggestions,
  type ChatContext,
  type ChatMessage,
} from '@/lib/ai/chat-assistant';
import { db } from '@/lib/db';
import { parseJsonField } from '@/lib/parsers';

// ============================================
// POST /api/ai/chat
// Envoie un message à l'assistant chat
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (write pour utiliser l'IA)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { message, context, conversationHistory } = body as {
      message: string;
      context: {
        organizationType: string;
        sector: string;
        datasetId?: string;
        dashboardConfig?: unknown;
      };
      conversationHistory?: ChatMessage[];
    };

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message requis' },
        { status: 400 }
      );
    }

    // Récupérer les métadonnées du dataset si disponible
    let columnsMetadata: unknown[] = [];
    let dataSample: Record<string, unknown>[] = [];

    if (context?.datasetId && db) {
      // Validation UUID
      const uuidError = validateUUID(context.datasetId);
      if (uuidError) return uuidError;

      // Vérifier que le dataset appartient à l'organisation
      const dataset = await db.dataset.findUnique({
        where: { id: context.datasetId },
        select: {
          organizationId: true,
          columnsMetadata: true,
        },
      });

      if (!dataset) {
        return NextResponse.json(
          { success: false, error: 'Dataset non trouvé.' },
          { status: 404 }
        );
      }

      // Vérifier l'appartenance
      if (auth.role !== 'owner' && auth.role !== 'admin') {
        if (dataset.organizationId !== auth.organizationId) {
          return NextResponse.json(
            { success: false, error: 'Accès refusé.' },
            { status: 403 }
          );
        }
      }

      columnsMetadata = parseJsonField(dataset.columnsMetadata, []);
      dataSample = columnsMetadata.slice(0, 3).map((col: any) => ({
        [col.cleanName]: col.sampleValues?.[0] || 'N/A',
      }));
    }

    const chatContext: ChatContext = {
      organizationType: context?.organizationType || 'enterprise',
      sector: context?.sector || 'other',
      dashboardConfig: context?.dashboardConfig as ChatContext['dashboardConfig'],
      columnsMetadata: columnsMetadata as ChatContext['columnsMetadata'],
      dataSample,
      conversationHistory: conversationHistory || [],
    };

    const result = await generateChatResponse(message, chatContext);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur chat API:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du traitement du message' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/ai/chat/suggestions
// Génère des suggestions de questions
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector') || 'other';
    const organizationType = searchParams.get('organizationType') || 'enterprise';
    const datasetId = searchParams.get('datasetId');

    let columnsMetadata: unknown[] = [];
    let dashboardConfig = null;

    if (datasetId && db) {
      // Validation UUID
      const uuidError = validateUUID(datasetId);
      if (uuidError) return uuidError;

      // Vérifier que le dataset appartient à l'organisation
      const dataset = await db.dataset.findUnique({
        where: { id: datasetId },
        select: {
          organizationId: true,
          columnsMetadata: true,
        },
      });

      if (!dataset) {
        return NextResponse.json(
          { success: false, error: 'Dataset non trouvé.' },
          { status: 404 }
        );
      }

      // Vérifier l'appartenance
      if (auth.role !== 'owner' && auth.role !== 'admin') {
        if (dataset.organizationId !== auth.organizationId) {
          return NextResponse.json(
            { success: false, error: 'Accès refusé.' },
            { status: 403 }
          );
        }
      }

      columnsMetadata = parseJsonField(dataset.columnsMetadata, []);
    }

    const suggestions = await generateQuestionSuggestions({
      organizationType,
      sector,
      dashboardConfig,
      columnsMetadata: columnsMetadata as any[],
      dataSample: [],
    });

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Erreur suggestions API:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération des suggestions' },
      { status: 500 }
    );
  }
}
