/**
 * InsightGov Africa - AI Client
 * ==================================
 * Client IA pour l'analyse sémantique des données et génération de KPIs.
 * Supporte z-ai-sdk (par défaut), Groq et OpenAI.
 */

import OpenAI from 'openai';
import ZAI from 'z-ai-web-dev-sdk';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Détermine quel provider IA utiliser
 * z-ai-sdk est le défaut (intégré et toujours disponible)
 */
const AI_PROVIDER = (process.env.AI_PROVIDER || 'z-ai-sdk').toLowerCase();

/**
 * Configuration selon le provider
 */
const AI_CONFIG = {
  'z-ai-sdk': {
    type: 'z-ai-sdk' as const,
    defaultModel: 'glm-4-plus',
    models: {
      fast: 'glm-4-flash',
      balanced: 'glm-4-plus',
      advanced: 'glm-4-plus',
    }
  },
  groq: {
    type: 'openai' as const,
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
    defaultModel: 'llama-3.3-70b-versatile',
    models: {
      fast: 'llama-3.1-8b-instant',
      balanced: 'llama-3.3-70b-versatile',
      advanced: 'llama-3.3-70b-versatile',
    }
  },
  openai: {
    type: 'openai' as const,
    baseURL: undefined,
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: 'gpt-4o',
    models: {
      fast: 'gpt-4o-mini',
      balanced: 'gpt-4o',
      advanced: 'gpt-4o',
    }
  }
};

/**
 * Obtient la configuration actuelle
 */
function getConfig() {
  const config = AI_CONFIG[AI_PROVIDER as keyof typeof AI_CONFIG];
  if (config) return config;

  // Fallback vers z-ai-sdk si le provider demandé n'est pas configuré
  if (AI_PROVIDER === 'groq' && !process.env.GROQ_API_KEY) {
    console.log('[AI] GROQ_API_KEY non configuré, utilisation de z-ai-sdk');
    return AI_CONFIG['z-ai-sdk'];
  }
  if (AI_PROVIDER === 'openai' && !process.env.OPENAI_API_KEY) {
    console.log('[AI] OPENAI_API_KEY non configuré, utilisation de z-ai-sdk');
    return AI_CONFIG['z-ai-sdk'];
  }

  return AI_CONFIG['z-ai-sdk'];
}

// =============================================================================
// CLIENT IA UNIFIÉ
// =============================================================================

/**
 * Interface unifiée pour les clients IA
 */
interface UnifiedAIClient {
  chat: {
    completions: {
      create: (params: {
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
        model?: string;
        temperature?: number;
        max_tokens?: number;
        response_format?: { type: 'json_object' | 'text' };
      }) => Promise<{
        choices: Array<{
          message: {
            content: string | null;
            role: string;
          };
          finish_reason: string;
        }>;
        model: string;
        usage?: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
      }>;
    };
  };
}

// Instance singleton pour OpenAI
let openaiClient: OpenAI | null = null;

// Instance singleton pour Z-AI
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

/**
 * Crée le client Z-AI SDK
 */
async function createZAIClient(): Promise<UnifiedAIClient> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }

  return {
    chat: {
      completions: {
        create: async (params) => {
          const response = await zaiInstance!.chat.completions.create({
            messages: params.messages,
            temperature: params.temperature,
            max_tokens: params.max_tokens,
          });

          return {
            choices: response.choices.map(choice => ({
              message: {
                content: choice.message.content,
                role: choice.message.role,
              },
              finish_reason: choice.finish_reason || 'stop',
            })),
            model: response.model || 'glm-4-plus',
            usage: response.usage,
          };
        },
      },
    },
  };
}

/**
 * Crée le client OpenAI/Groq
 */
function createOpenAIClient(baseURL?: string, apiKey?: string): UnifiedAIClient {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });
  }

  return {
    chat: {
      completions: {
        create: async (params) => {
          const response = await openaiClient!.chat.completions.create({
            messages: params.messages,
            model: params.model || 'default',
            temperature: params.temperature,
            max_tokens: params.max_tokens,
            response_format: params.response_format,
          });

          return {
            choices: response.choices.map(choice => ({
              message: {
                content: choice.message.content,
                role: choice.message.role,
              },
              finish_reason: choice.finish_reason,
            })),
            model: response.model,
            usage: response.usage ? {
              prompt_tokens: response.usage.prompt_tokens,
              completion_tokens: response.usage.completion_tokens,
              total_tokens: response.usage.total_tokens,
            } : undefined,
          };
        },
      },
    },
  };
}

// Client unifié en cache
let unifiedClient: UnifiedAIClient | null = null;
let clientType: 'z-ai-sdk' | 'openai' = 'z-ai-sdk';

/**
 * Retourne l'instance du client IA (synchrone pour compatibilité)
 * Utilise z-ai-sdk par défaut car toujours disponible
 */
export function getAIClient(): UnifiedAIClient {
  const config = getConfig();

  if (config.type === 'z-ai-sdk') {
    // Pour z-ai-sdk, on retourne un client qui fera l'init async
    clientType = 'z-ai-sdk';
    if (!unifiedClient) {
      // Retourne un proxy qui initialise le client à la première utilisation
      unifiedClient = {
        chat: {
          completions: {
            create: async (params) => {
              if (!zaiInstance) {
                zaiInstance = await ZAI.create();
              }
              const response = await zaiInstance.chat.completions.create({
                messages: params.messages,
                temperature: params.temperature,
                max_tokens: params.max_tokens,
              });
              return {
                choices: response.choices.map(choice => ({
                  message: {
                    content: choice.message.content,
                    role: choice.message.role,
                  },
                  finish_reason: choice.finish_reason || 'stop',
                })),
                model: response.model || 'glm-4-plus',
                usage: response.usage,
              };
            },
          },
        },
      };
    }
    return unifiedClient;
  }

  // Pour OpenAI/Groq
  if (!config.apiKey) {
    console.log('[AI] Clé API non configurée, fallback vers z-ai-sdk');
    return getAIClient(); // Récursion avec fallback
  }

  clientType = 'openai';
  if (!unifiedClient) {
    unifiedClient = createOpenAIClient(config.baseURL, config.apiKey);
  }
  return unifiedClient;
}

// Alias pour compatibilité
export const getOpenAIClient = getAIClient;

// =============================================================================
// MODÈLES
// =============================================================================

/**
 * Modèle IA à utiliser
 */
const config = getConfig();
export const AI_MODEL = process.env.AI_MODEL || config.defaultModel;
export const OPENAI_MODEL = AI_MODEL; // Alias pour compatibilité

/**
 * Modèles disponibles selon le cas d'usage
 */
export const AI_MODELS = {
  fast: process.env.AI_MODEL_FAST || config.models.fast,
  balanced: process.env.AI_MODEL_BALANCED || config.models.balanced,
  advanced: process.env.AI_MODEL_ADVANCED || config.models.advanced,
};

// =============================================================================
// PROMPTS SYSTÈME
// =============================================================================

export const SYSTEM_PROMPTS = {
  /**
   * Prompt pour l'analyse des colonnes d'un dataset
   */
  COLUMN_ANALYSIS: `Tu es un expert en analyse de données pour le secteur public et les organisations en Afrique.
Ton rôle est d'analyser les colonnes d'un fichier de données et de suggérer les KPIs et visualisations les plus pertinents.

Contexte important:
- Les données proviennent d'organisations africaines (Ministères, ONG, Entreprises)
- Les montants sont souvent en Francs CFA (XOF/XAF), Euros ou Dollars
- Les dates peuvent être dans différents formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
- Les noms de colonnes peuvent être en français, anglais ou langues locales

Pour chaque colonne, tu dois:
1. Identifier le type de données (numérique, texte, date, catégorie, devise, pourcentage)
2. Détecter l'unité si applicable (FCFA, EUR, USD, kg, km, %, etc.)
3. Calculer des statistiques de base
4. Évaluer la qualité des données (valeurs nulles, doublons, incohérences)
5. Suggérer des visualisations pertinentes`,

  /**
   * Prompt pour la génération de dashboard
   */
  DASHBOARD_GENERATION: `Tu es un expert en visualisation de données et en conception de tableaux de bord pour organisations africaines.
Tu dois générer une configuration JSON complète pour un dashboard adapté au secteur et type d'organisation.

Règles de conception:
1. Limiter à 8-12 KPIs maximum pour éviter la surcharge
2. Prioriser les métriques clés (Key Performance Indicators)
3. Utiliser des graphiques adaptés au type de données:
   - Bar charts pour les comparaisons
   - Line charts pour les tendances temporelles
   - Donut/Pie charts pour les répartitions (max 6 catégories)
   - KPI cards pour les métriques principales
4. Grouper les KPIs par thématique
5. Suggérer des couleurs cohérentes avec la charte africaine (tons terre, vert, orange)

Le JSON généré doit être valide et suivre exactement le schéma fourni.`,

  /**
   * Prompt pour générer un résumé exécutif
   */
  EXECUTIVE_SUMMARY: `Tu es un consultant senior spécialisé dans l'analyse de données pour le secteur public africain.
Rédige un résumé exécutif concis (3-5 phrases) qui:
1. Met en évidence les tendances principales
2. Identifie les points d'attention (positifs et négatifs)
3. Propose des recommandations actionnables
Le ton doit être professionnel et adapté à un public de décideurs.`
};

// =============================================================================
// PARAMÈTRES PAR DÉFAUT
// =============================================================================

export const DEFAULT_OPENAI_PARAMS = {
  model: AI_MODEL,
  temperature: 0.3,
  max_tokens: 4000,
  response_format: { type: 'json_object' as const },
};

/**
 * Paramètres optimisés selon le type de tâche
 */
export const TASK_PARAMS = {
  analysis: {
    model: AI_MODELS.balanced,
    temperature: 0.2,
    max_tokens: 4000,
  },
  generation: {
    model: AI_MODELS.balanced,
    temperature: 0.4,
    max_tokens: 4000,
  },
  chat: {
    model: AI_MODELS.fast,
    temperature: 0.7,
    max_tokens: 2000,
  },
  insights: {
    model: AI_MODELS.advanced,
    temperature: 0.5,
    max_tokens: 3000,
  },
};
