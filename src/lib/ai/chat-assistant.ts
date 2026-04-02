/**
 * InsightGov Africa - AI Chat Assistant
 * ======================================
 * Assistant IA conversationnel pour interagir avec les données et tableaux de bord.
 * Permet aux utilisateurs de poser des questions en langage naturel.
 */

import { getOpenAIClient, OPENAI_MODEL } from './openai';
import type { DashboardConfig, KPIConfig, ColumnMetadata } from '@/types';

/**
 * Message de conversation
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    chartData?: unknown;
    kpiReferenced?: string;
    action?: 'query' | 'filter' | 'export' | 'explain' | 'recommend';
    confidence?: number;
  };
}

/**
 * Contexte de conversation
 */
export interface ChatContext {
  organizationType: string;
  sector: string;
  dashboardConfig: DashboardConfig | null;
  columnsMetadata: ColumnMetadata[];
  dataSample: Record<string, unknown>[];
  conversationHistory: ChatMessage[];
}

/**
 * Résultat de l'assistant
 */
export interface ChatAssistantResult {
  response: string;
  action?: {
    type: 'filter' | 'highlight' | 'export' | 'drilldown' | 'none';
    payload?: unknown;
  };
  suggestedQuestions?: string[];
  relatedKPIs?: string[];
  confidence: number;
}

/**
 * Système de prompt pour l'assistant chat
 */
const CHAT_SYSTEM_PROMPT = `Tu es un assistant IA expert en analyse de données pour organisations africaines.
Tu aides les utilisateurs à comprendre leurs données et tableaux de bord InsightGov Africa.

CAPACITÉS:
- Répondre aux questions sur les données et KPIs
- Expliquer les tendances et insights
- Suggérer des filtres ou analyses supplémentaires
- Aider à interpréter les graphiques
- Recommander des actions basées sur les données

CONTEXTE AFRICAIN:
- Tu comprends le contexte spécifique des Ministères, ONG et entreprises africaines
- Tu connais les défis de développement en Afrique
- Tu es familier avec les indicateurs de développement (ODD, etc.)
- Tu peux suggérer des solutions adaptées au contexte local

STYLE DE RÉPONSE:
- Réponses concises mais informatives (2-4 phrases max pour les réponses simples)
- Utilise des listes à puces pour les explications complexes
- Propose toujours des actions concrètes
- Pose des questions de clarification si nécessaire
- Adapte le niveau technique au profil utilisateur

FORMAT DE RÉPONSE:
Réponds en JSON avec cette structure:
{
  "response": "Ta réponse textuelle",
  "action": {
    "type": "filter|highlight|export|drilldown|none",
    "payload": { /* données spécifiques à l'action */ }
  },
  "suggestedQuestions": ["Question suggérée 1", "Question suggérée 2"],
  "relatedKPIs": ["id_kpi_1", "id_kpi_2"],
  "confidence": 0.85
}`;

/**
 * Génère une réponse de l'assistant chat
 */
export async function generateChatResponse(
  userMessage: string,
  context: ChatContext
): Promise<ChatAssistantResult> {
  const openai = getOpenAIClient();
  
  // Construire le contexte pour GPT
  const contextMessage = buildContextMessage(context);
  
  // Construire l'historique de conversation
  const conversationMessages = context.conversationHistory
    .slice(-10) // Limiter aux 10 derniers messages
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      { role: 'system', content: contextMessage },
      ...conversationMessages,
      { role: 'user', content: userMessage },
    ],
    temperature: 0.4,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  
  if (!content) {
    return {
      response: "Je n'ai pas pu traiter votre demande. Veuillez réessayer.",
      confidence: 0,
    };
  }

  try {
    const parsed = JSON.parse(content);
    return {
      response: parsed.response || "Je n'ai pas compris votre demande.",
      action: parsed.action || { type: 'none' },
      suggestedQuestions: parsed.suggestedQuestions || [],
      relatedKPIs: parsed.relatedKPIs || [],
      confidence: parsed.confidence || 0.7,
    };
  } catch {
    return {
      response: content,
      confidence: 0.6,
    };
  }
}

/**
 * Construit le message de contexte pour GPT
 */
function buildContextMessage(context: ChatContext): string {
  const parts: string[] = [];

  // Type d'organisation et secteur
  parts.push(`ORGANISATION:
- Type: ${context.organizationType}
- Secteur: ${context.sector}`);

  // Colonnes disponibles
  if (context.columnsMetadata.length > 0) {
    const columnsInfo = context.columnsMetadata
      .slice(0, 20) // Limiter à 20 colonnes
      .map(col => `- ${col.cleanName} (${col.dataType}): ${col.description}`)
      .join('\n');
    parts.push(`\nCOLONNES DISPONIBLES:\n${columnsInfo}`);
  }

  // KPIs configurés
  if (context.dashboardConfig?.kpis) {
    const kpisInfo = context.dashboardConfig.kpis
      .map(kpi => `- ${kpi.title} (${kpi.chartType}): ${kpi.description}`)
      .join('\n');
    parts.push(`\nKPIs CONFIGURÉS:\n${kpisInfo}`);
    
    if (context.dashboardConfig.executiveSummary) {
      parts.push(`\nRÉSUMÉ EXÉCUTIF:\n${context.dashboardConfig.executiveSummary}`);
    }
    
    if (context.dashboardConfig.keyInsights?.length > 0) {
      parts.push(`\nINSIGHTS CLÉS:\n${context.dashboardConfig.keyInsights.map(i => `- ${i}`).join('\n')}`);
    }
  }

  // Échantillon de données (limité)
  if (context.dataSample.length > 0) {
    const sampleRows = context.dataSample.slice(0, 3);
    parts.push(`\nÉCHANTILLON DE DONNÉES (3 premières lignes):\n${JSON.stringify(sampleRows, null, 2)}`);
  }

  return parts.join('\n');
}

/**
 * Génère des suggestions de questions basées sur le contexte
 */
export async function generateQuestionSuggestions(
  context: Omit<ChatContext, 'conversationHistory'>
): Promise<string[]> {
  const openai = getOpenAIClient();
  
  const contextMessage = buildContextMessage(context);

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content: `Tu es un assistant qui génère des questions pertinentes pour l'analyse de données.
Génère 5 questions en français qu'un utilisateur pourrait poser sur ses données.
Les questions doivent être spécifiques au contexte et aux données disponibles.
Réponds uniquement avec un tableau JSON de questions.`,
      },
      { role: 'user', content: contextMessage },
    ],
    temperature: 0.7,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  
  if (!content) {
    return getDefaultSuggestions(context.sector);
  }

  try {
    const parsed = JSON.parse(content);
    return parsed.questions || parsed.suggestions || getDefaultSuggestions(context.sector);
  } catch {
    return getDefaultSuggestions(context.sector);
  }
}

/**
 * Suggestions par défaut par secteur
 */
function getDefaultSuggestions(sector: string): string[] {
  const suggestions: Record<string, string[]> = {
    health: [
      "Quelle est la tendance des consultations ce mois ?",
      "Quels sont les indicateurs de performance les plus critiques ?",
      "Comment comparer les résultats entre différentes régions ?",
      "Y a-t-il des anomalies dans les données de vaccination ?",
      "Quelles recommandations pour améliorer les KPIs ?",
    ],
    education: [
      "Quel est le taux de scolarisation par région ?",
      "Comment évoluent les résultats aux examens ?",
      "Quelles écoles ont les meilleures performances ?",
      "Y a-t-il des écarts entre zones urbaines et rurales ?",
      "Quelles actions prioritaires recommandez-vous ?",
    ],
    agriculture: [
      "Quelle est la production totale par culture ?",
      "Comment les rendements évoluent-ils dans le temps ?",
      "Quelles régions ont les meilleurs résultats ?",
      "Y a-t-il des cultures sous-performantes ?",
      "Quels investissements prioriser ?",
    ],
    finance: [
      "Quelle est l'évolution des recettes ce trimestre ?",
      "Quels sont les postes de dépenses les plus importants ?",
      "Y a-t-il des écarts budgétaires significatifs ?",
      "Comment optimiser la collecte de recettes ?",
      "Quelles tendances prévoyez-vous ?",
    ],
    default: [
      "Quelles sont les tendances principales dans mes données ?",
      "Quels sont les KPIs les plus importants ?",
      "Y a-t-il des anomalies ou points d'attention ?",
      "Comment puis-je améliorer mes performances ?",
      "Quelles analyses supplémentaires recommandez-vous ?",
    ],
  };

  return suggestions[sector] || suggestions.default;
}

/**
 * Analyse une requête utilisateur pour détecter l'intention
 */
export function detectIntent(message: string): {
  intent: 'query' | 'filter' | 'export' | 'explain' | 'recommend' | 'unknown';
  entities: string[];
} {
  const lowerMessage = message.toLowerCase();
  
  // Patterns de détection d'intention
  const patterns = {
    filter: /\b(filtrer|montrer|afficher|seulement|où|dont)\b/i,
    export: /\b(exporter|télécharger|générer rapport|pdf|excel)\b/i,
    explain: /\b(pourquoi|comment|expliquer|signifie|interpréter)\b/i,
    recommend: /\b(conseil|recommandation|suggérer|améliorer|optimiser|action)\b/i,
    query: /\b(combien|quel|quelle|total|moyenne|somme|maximum|minimum|tendance|évolution)\b/i,
  };

  for (const [intent, pattern] of Object.entries(patterns)) {
    if (pattern.test(lowerMessage)) {
      // Extraire les entités (noms de colonnes, valeurs, etc.)
      const entities = extractEntities(message);
      return { intent: intent as typeof intent, entities };
    }
  }

  return { intent: 'unknown', entities: [] };
}

/**
 * Extrait les entités d'un message
 */
function extractEntities(message: string): string[] {
  // Détecter les mots entre guillemets
  const quoted = message.match(/["']([^"']+)["']/g);
  if (quoted) {
    return quoted.map(q => q.replace(/["']/g, ''));
  }
  
  // Détecter les nombres
  const numbers = message.match(/\d+(?:[.,]\d+)?/g);
  if (numbers) {
    return numbers;
  }
  
  return [];
}

/**
 * Génère un résumé des données pour l'assistant
 */
export async function generateDataSummary(
  columnsMetadata: ColumnMetadata[],
  sampleData: Record<string, unknown>[]
): Promise<string> {
  const openai = getOpenAIClient();
  
  const columnStats = columnsMetadata
    .filter(col => col.statistics)
    .map(col => `${col.cleanName}: min=${col.statistics?.min}, max=${col.statistics?.max}, avg=${col.statistics?.mean?.toFixed(2)}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content: 'Tu es un expert en analyse de données. Génère un résumé concis des données en 2-3 phrases.',
      },
      {
        role: 'user',
        content: `Colonne: ${columnsMetadata.length} colonnes\n${columnStats}\n\nÉchantillon:\n${JSON.stringify(sampleData.slice(0, 5), null, 2)}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content || 'Données chargées avec succès.';
}
