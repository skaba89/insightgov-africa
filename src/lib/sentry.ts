// ============================================
// InsightGov Africa - Configuration Sentry
// Monitoring et error tracking
// ============================================

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust sampling in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Release version
    release: process.env.npm_package_version || '1.0.0',

    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Session replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Ignore common errors
    ignoreErrors: [
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'Non-Error promise rejection captured',
      'CANCELLED',
    ],

    // Filter transactions
    beforeSend(event) {
      // Don't send events from localhost in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      return event;
    },
  });
}

// ============================================
// HELPERS
// ============================================

/**
 * Capturer une erreur avec contexte
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capturer un message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Ajouter du contexte utilisateur
 */
export function setUserContext(user: { id: string; email: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.email,
    role: user.role,
  });
}

/**
 * Effacer le contexte utilisateur
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Ajouter des breadcrumbs
 */
export function addBreadcrumb(category: string, message: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

/**
 * Wrapper pour les fonctions async avec monitoring
 */
export function withMonitoring<T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return Sentry.startSpan({ name }, async () => {
    try {
      return await fn();
    } catch (error) {
      captureError(error as Error, { operation: name, ...context });
      throw error;
    }
  });
}

export default Sentry;
