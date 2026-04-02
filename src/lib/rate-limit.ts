// ============================================
// InsightGov Africa - Rate Limiting
// Protection contre les abus API
// ============================================

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// TYPES
// ============================================

interface RateLimitConfig {
  windowMs: number;       // Fenêtre de temps en ms
  maxRequests: number;    // Max requêtes par fenêtre
  message?: string;       // Message d'erreur personnalisé
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// ============================================
// STORE EN MÉMOIRE (pour production: utiliser Redis)
// ============================================

const store: RateLimitStore = {};

// Nettoyer les entrées expirées toutes les minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000);

// ============================================
// CONFIGURATIONS PAR DÉFAUT
// ============================================

export const RATE_LIMITS = {
  // API générale
  API: {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 100,        // 100 req/min
    message: 'Trop de requêtes. Veuillez réessayer dans une minute.',
  },

  // Authentification
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 tentatives
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  },

  // Upload de fichiers
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 20,          // 20 uploads/heure
    message: 'Limite d\'uploads atteinte. Réessayez plus tard.',
  },

  // Export PDF
  EXPORT: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 50,          // 50 exports/heure
    message: 'Limite d\'exports atteinte.',
  },

  // Démonstration
  DEMO: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 10,          // 10 démos/heure
    message: 'Limite de démonstrations atteinte.',
  },

  // Paiement
  PAYMENT: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 10,          // 10 tentatives/heure
    message: 'Trop de tentatives de paiement.',
  },
};

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Middleware de rate limiting
 */
export function rateLimit(config: RateLimitConfig) {
  return async function (
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Obtenir l'IP du client
    const ip = req.headers.get('x-forwarded-for') ||
               req.headers.get('x-real-ip') ||
               'unknown';

    // Obtenir l'ID utilisateur si authentifié
    const userId = req.headers.get('x-user-id') || '';

    // Clé unique pour le rate limiting
    const key = `${ip}:${userId}:${req.nextUrl.pathname}`;

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Récupérer ou créer l'entrée
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    // Incrémenter le compteur
    store[key].count++;

    // Vérifier la limite
    if (store[key].count > config.maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);

      return NextResponse.json(
        {
          error: config.message || 'Rate limit exceeded',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(store[key].resetTime),
          },
        }
      );
    }

    // Exécuter le handler
    const response = await handler();

    // Ajouter les headers de rate limiting
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set(
      'X-RateLimit-Remaining',
      String(Math.max(0, config.maxRequests - store[key].count))
    );
    response.headers.set('X-RateLimit-Reset', String(store[key].resetTime));

    return response;
  };
}

// ============================================
// WRAPPER POUR API ROUTES
// ============================================

/**
 * Wrapper pour protéger une API route avec rate limiting
 */
export function withRateLimit(
  configKey: keyof typeof RATE_LIMITS,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  const config = RATE_LIMITS[configKey];
  const limiter = rateLimit(config);

  return async (req: NextRequest) => {
    return limiter(req, () => handler(req));
  };
}

// ============================================
// HELPER POUR OBTENIR LES STATS
// ============================================

export function getRateLimitStats(key: string): {
  count: number;
  resetTime: number;
  remaining: number;
} | null {
  const entry = store[key];
  if (!entry || entry.resetTime < Date.now()) {
    return null;
  }

  return {
    count: entry.count,
    resetTime: entry.resetTime,
    remaining: 0, // Would need config to calculate
  };
}
