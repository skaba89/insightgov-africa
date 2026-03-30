/**
 * InsightGov Africa - Chat API Endpoint
 * ======================================
 * API pour l'assistant conversationnel IA
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateChatResponse,
  generateQuestionSuggestions,
  type ChatContext,
  type ChatMessage,
} from '@/lib/ai/chat-assistant';
import { getDataset } from '@/lib/db';
import { parseJsonField } from '@/lib/parsers';

/**
 * POST /api/ai/chat
 * Envoie un message à l'assistant chat
 */
export async function POST(request: NextRequest) {
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
        { error: 'Message requis' },
        { status: 400 }
      );
    }

    // Récupérer les métadonnées du dataset si disponible
    let columnsMetadata: unknown[] = [];
    let dataSample: Record<string, unknown>[] = [];

    if (context?.datasetId) {
      try {
        const dataset = await getDataset(context.datasetId);
        if (dataset) {
          columnsMetadata = parseJsonField(dataset.columnsMetadata, []);
          // Pour un vrai système, on chargerait un échantillon des données
          // Ici on simule avec les valeurs d'exemple des métadonnées
          dataSample = columnsMetadata.slice(0, 3).map((col: any) => ({
            [col.cleanName]: col.sampleValues?.[0] || 'N/A',
          }));
        }
      } catch (e) {
        console.error('Erreur chargement dataset:', e);
      }
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
      { error: 'Erreur lors du traitement du message' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/chat/suggestions
 * Génère des suggestions de questions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector') || 'other';
    const organizationType = searchParams.get('organizationType') || 'enterprise';
    const datasetId = searchParams.get('datasetId');

    let columnsMetadata: unknown[] = [];
    let dashboardConfig = null;

    if (datasetId) {
      try {
        const dataset = await getDataset(datasetId);
        if (dataset) {
          columnsMetadata = parseJsonField(dataset.columnsMetadata, []);
        }
      } catch (e) {
        console.error('Erreur chargement dataset:', e);
      }
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
      { error: 'Erreur lors de la génération des suggestions' },
      { status: 500 }
    );
  }
}
