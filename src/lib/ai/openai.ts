/**
 * InsightGov Africa - AI Client
 * ==================================
 * Client IA pour l'analyse sémantique des données et génération de KPIs.
 * Supporte Groq (par défaut) et OpenAI.
 */

import OpenAI from 'openai';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Détermine quel provider IA utiliser
 * Groq est le défaut (plus rapide et moins cher)
 */
const AI_PROVIDER = (process.env.AI_PROVIDER || 'groq').toLowerCase();

/**
 * Configuration selon le provider
 */
const AI_CONFIG = {
  groq: {
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
    baseURL: undefined, // Default OpenAI URL
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
  return AI_CONFIG[AI_PROVIDER as keyof typeof AI_CONFIG] || AI_CONFIG.groq;
}

// =============================================================================
// CLIENT IA
// =============================================================================

/**
 * Crée le client IA configuré
 */
export function createAIClient() {
  const config = getConfig();
  
  if (!config.apiKey) {
    throw new Error(
      `Clé API manquante. Définissez ${AI_PROVIDER === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY'} dans vos variables d'environnement.`
    );
  }
  
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}

// Instance singleton
let aiClient: OpenAI | null = null;

/**
 * Retourne l'instance singleton du client IA
 */
export function getAIClient(): OpenAI {
  if (!aiClient) {
    aiClient = createAIClient();
  }
  return aiClient;
}

// Alias pour compatibilité
export const getOpenAIClient = getAIClient;
export const createOpenAIClient = createAIClient;

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
