// ============================================
// InsightGov Africa - Sentry Server Configuration
// Server-side error tracking and monitoring
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

  // Server name
  serverName: process.env.VERCEL_URL || process.env.HOSTNAME || 'localhost',

  // Performance monitoring
  tracesSampleRate: isProduction ? 0.2 : 1.0,
  profilesSampleRate: isProduction ? 0.1 : 1.0,

  // Debug mode
  debug: isDevelopment,

  // Server-specific integrations
  integrations: [
    // HTTP integration for outgoing requests
    Sentry.httpIntegration({
      tracing: true,
    }),

    // Node context integration
    Sentry.nodeContextIntegration(),

    // On unhandled rejection
    Sentry.onUnhandledRejectionIntegration({
      mode: 'strict',
    }),

    // On uncaught exception
    Sentry.onUncaughtExceptionIntegration({
      captureErrorHandler: false,
    }),

    // Deduplicate errors
    Sentry.dedupeIntegration(),

    // Extra error data
    Sentry.extraErrorDataIntegration({
      depth: 5,
    }),

    // Local variables for debugging
    Sentry.localVariablesIntegration({
      captureAllExceptions: false,
    }),

    // Modules integration
    Sentry.modulesIntegration(),

    // Request data integration
    Sentry.requestDataIntegration({
      ip: false, // Don't capture IP by default
    }),

    // Prisma integration (if available)
    // Sentry.prismaIntegration(), // Uncomment if using @sentry/prisma
  ],

  // Server-specific ignore errors
  ignoreErrors: [
    // Network errors
    'NetworkError',
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EPIPE',
    'EHOSTUNREACH',

    // Next.js specific
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',

    // Auth errors (handled separately)
    'Unauthorized',
    'Invalid token',
    'Token expired',

    // File system errors (often transient)
    'ENOENT',
    'EMFILE',
    'ENFILE',

    // Database connection errors (handled by health checks)
    'PrismaClientInitializationError',
  ],

  // Ignore specific transactions
  ignoreTransactions: [
    // Health checks
    'GET /api/health',
    // Static assets
    '/_next/*',
  ],

  // Trace propagation
  tracePropagationTargets: [
    'localhost',
    /^\//,
    'insightgov.africa',
    /\.insightgov\.africa$/,
    'api.paystack.co',
    'api.openai.com',
  ],

  // Before send hook for server events
  beforeSend(event, hint) {
    // Don't send in development unless explicitly enabled
    if (isDevelopment && !process.env.SENTRY_SEND_IN_DEV) {
      return null;
    }

    // Filter sensitive information
    if (event.request) {
      // Sanitize headers
      if (event.request.headers) {
        const headers = event.request.headers as Record<string, string>;
        delete headers['authorization'];
        delete headers['cookie'];
        delete headers['x-api-key'];
        delete headers['x-auth-token'];
        delete headers['x-webhook-signature'];
      }

      // Sanitize request body
      if (event.request.data) {
        try {
          const data = typeof event.request.data === 'string'
            ? JSON.parse(event.request.data)
            : event.request.data;

          if (typeof data === 'object' && data !== null) {
            const sanitizedData = { ...data as Record<string, unknown> };
            delete sanitizedData['password'];
            delete sanitizedData['token'];
            delete sanitizedData['secret'];
            delete sanitizedData['apiKey'];
            delete sanitizedData['privateKey'];
            event.request.data = JSON.stringify(sanitizedData);
          }
        } catch {
          // If parsing fails, remove the data
          event.request.data = '[REDACTED]';
        }
      }
    }

    // Add server-specific tags
    event.tags = {
      ...event.tags,
      server_region: process.env.VERCEL_REGION || 'local',
      deployment_env: process.env.VERCEL_ENV || 'development',
    };

    return event;
  },

  // Before send transaction
  beforeSendTransaction(event) {
    if (isDevelopment && !process.env.SENTRY_SEND_IN_DEV) {
      return null;
    }

    // Filter health checks
    if (event.transaction?.includes('/api/health')) {
      return null;
    }

    return event;
  },

  // Normalize depth
  normalizeDepth: 6,

  // Attach stacktraces
  attachStacktrace: true,

  // Don't send default PII
  sendDefaultPii: false,

  // Max breadcrumbs
  maxBreadcrumbs: 100,

  // Transport options for batching
  transportOptions: {
    bufferSize: 50,
  },
});

// Server-side helper functions

/**
 * Capture API error with request context
 */
export function captureApiError(
  error: Error,
  request: {
    method: string;
    path: string;
    userId?: string;
    organizationId?: string;
    body?: Record<string, unknown>;
    query?: Record<string, string>;
  }
) {
  // Set request context
  Sentry.setContext('request', {
    method: request.method,
    path: request.path,
    query: request.query,
  });

  // Set tags
  Sentry.setTag('api.endpoint', request.path);
  Sentry.setTag('api.method', request.method);
  if (request.userId) {
    Sentry.setTag('user.id', request.userId);
  }
  if (request.organizationId) {
    Sentry.setTag('organization.id', request.organizationId);
  }

  // Capture the error
  return Sentry.captureException(error);
}

/**
 * Capture database error with query context
 */
export function captureDatabaseError(
  error: Error,
  context: {
    operation: string;
    table?: string;
    query?: string;
  }
) {
  Sentry.setContext('database', context);
  Sentry.setTag('error.type', 'database');
  Sentry.setTag('database.operation', context.operation);
  if (context.table) {
    Sentry.setTag('database.table', context.table);
  }

  return Sentry.captureException(error);
}

/**
 * Capture AI/external service error
 */
export function captureServiceError(
  error: Error,
  service: string,
  operation: string,
  metadata?: Record<string, unknown>
) {
  Sentry.setContext('service', {
    name: service,
    operation,
    ...metadata,
  });
  Sentry.setTag('error.type', 'external_service');
  Sentry.setTag('service.name', service);
  Sentry.setTag('service.operation', operation);

  return Sentry.captureException(error);
}

/**
 * Set user context on server
 */
export function setServerUserContext(user: {
  id: string;
  email: string;
  role?: string;
  organizationId?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });

  if (user.role) {
    Sentry.setTag('user.role', user.role);
  }
  if (user.organizationId) {
    Sentry.setTag('organization.id', user.organizationId);
  }

  Sentry.setContext('user', user);
}

/**
 * Add breadcrumb for server-side operations
 */
export function addServerBreadcrumb(
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
 * Track async operation with automatic error handling
 */
export async function withSentryMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  return Sentry.startSpan({ name: operation }, async (span) => {
    try {
      addServerBreadcrumb('operation', `Starting: ${operation}`, context);
      const result = await fn();
      span?.setStatus({ code: 1, message: 'ok' }); // OK
      addServerBreadcrumb('operation', `Completed: ${operation}`, context);
      return result;
    } catch (error) {
      span?.setStatus({ code: 2, message: 'unknown_error' }); // ERROR
      Sentry.captureException(error, {
        tags: { operation },
        extra: context,
      });
      throw error;
    }
  });
}

export default Sentry;
