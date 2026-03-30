/**
 * InsightGov Africa - Z-AI SDK Client
 * =====================================
 * Client IA utilisant le SDK z-ai-web-dev-sdk intégré
 * Fallback automatique si Groq/OpenAI non configurés
 */

import ZAI from 'z-ai-web-dev-sdk';

// Instance singleton
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

/**
 * Obtient l'instance du client Z-AI
 */
export async function getZAIClient() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

/**
 * Modèles disponibles via Z-AI SDK
 */
export const ZAI_MODELS = {
  default: 'glm-4-plus',
  fast: 'glm-4-flash',
  advanced: 'glm-4-plus',
};

/**
 * Paramètres par défaut pour les complétions
 */
export const DEFAULT_ZAI_PARAMS = {
  model: ZAI_MODELS.default,
  temperature: 0.3,
  max_tokens: 4000,
};

/**
 * Crée une complétion de chat via Z-AI SDK
 */
export async function createChatCompletion(params: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  model?: string;
}) {
  const zai = await getZAIClient();

  const response = await zai.chat.completions.create({
    messages: params.messages,
    temperature: params.temperature ?? DEFAULT_ZAI_PARAMS.temperature,
    max_tokens: params.max_tokens ?? DEFAULT_ZAI_PARAMS.max_tokens,
  });

  return response;
}

/**
 * Génère du texte simple
 */
export async function generateText(
  prompt: string,
  options?: { temperature?: number; max_tokens?: number }
): Promise<string> {
  const response = await createChatCompletion({
    messages: [{ role: 'user', content: prompt }],
    ...options,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Génère une réponse JSON structurée
 */
export async function generateJSON<T = unknown>(
  prompt: string,
  systemPrompt?: string,
  options?: { temperature?: number; max_tokens?: number }
): Promise<T | null> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await createChatCompletion({
    messages,
    ...options,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    return null;
  }

  try {
    // Essayer de parser le JSON
    // Parfois le modèle ajoute du texte avant/après le JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return JSON.parse(content) as T;
  } catch {
    console.error('Failed to parse JSON response:', content);
    return null;
  }
}

export default {
  getZAIClient,
  createChatCompletion,
  generateText,
  generateJSON,
  ZAI_MODELS,
  DEFAULT_ZAI_PARAMS,
};
