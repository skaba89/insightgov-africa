// ============================================
// InsightGov Africa - Sentry Edge Configuration
// Edge runtime error tracking and monitoring
// ============================================

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: SENTRY_DSN || '',

  // Environment
  environment: process.env.NODE_ENV || 'development',
  release: process.env.SENTRY_RELEASE || process.env.npm_package_version || '1.0.0',

  // Performance monitoring (lower sampling for edge)
  tracesSampleRate: isProduction ? 0.1 : 1.0,

  // Debug mode
  debug: isDevelopment,

  // Edge-specific integrations (limited set available in edge runtime)
  integrations: [
    // HTTP integration
    Sentry.httpIntegration({
      tracing: true,
    }),

    // Deduplicate errors
    Sentry.dedupeIntegration(),

    // Request data integration
    Sentry.requestDataIntegration({
      ip: false,
    }),
  ],

  // Edge-specific ignore errors
  ignoreErrors: [
    // Network errors
    'NetworkError',
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',

    // Edge-specific errors
    'WorkerScriptError',

    // Next.js specific
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',

    // Auth errors
    'Unauthorized',
    'Invalid token',
  ],

  // Ignore specific transactions
  ignoreTransactions: [
    'GET /api/health',
    '/_next/*',
  ],

  // Trace propagation
  tracePropagationTargets: [
    'localhost',
    /^\//,
    'insightgov.africa',
    /\.insightgov\.africa$/,
  ],

  // Before send hook
  beforeSend(event) {
    // Don't send in development unless explicitly enabled
    if (isDevelopment && !process.env.SENTRY_SEND_IN_DEV) {
      return null;
    }

    // Filter sensitive information
    if (event.request?.headers) {
      const headers = event.request.headers as Record<string, string>;
      delete headers['authorization'];
      delete headers['cookie'];
      delete headers['x-api-key'];
    }

    return event;
  },

  // Normalize depth (lower for edge runtime)
  normalizeDepth: 3,

  // Attach stacktraces
  attachStacktrace: true,

  // Don't send default PII
  sendDefaultPii: false,

  // Max breadcrumbs (lower for edge)
  maxBreadcrumbs: 30,
});

// Edge-specific helper functions

/**
 * Capture error in edge context
 */
export function captureEdgeError(
  error: Error,
  request?: {
    method?: string;
    path?: string;
    ip?: string;
    userAgent?: string;
  }
) {
  if (request) {
    Sentry.setContext('request', request);

    if (request.path) {
      Sentry.setTag('api.endpoint', request.path);
    }
    if (request.method) {
      Sentry.setTag('api.method', request.method);
    }
  }

  return Sentry.captureException(error);
}

/**
 * Add breadcrumb in edge context
 */
export function addEdgeBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

/**
 * Track middleware operations
 */
export function trackMiddlewareOperation(
  operation: string,
  path: string,
  result: 'allowed' | 'redirected' | 'blocked',
  duration?: number
) {
  addEdgeBreadcrumb('middleware', `${operation}: ${path}`, {
    result,
    duration: duration ? `${duration}ms` : undefined,
  });

  Sentry.setTag('middleware.operation', operation);
  Sentry.setTag('middleware.result', result);
}

export default Sentry;
