// ============================================
// InsightGov Africa - Comprehensive Sentry Configuration
// Monitoring, Error Tracking, Performance & Session Replay
// ============================================

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// ============================================
// SENTRY CONFIGURATION OPTIONS
// ============================================

export const sentryConfig = {
  dsn: SENTRY_DSN || '',

  // Environment identification
  environment: process.env.NODE_ENV || 'development',
  release: process.env.SENTRY_RELEASE || process.env.npm_package_version || '1.0.0',

  // Sampling rates
  tracesSampleRate: isProduction ? 0.15 : 1.0, // 15% in prod, 100% in dev
  profilesSampleRate: isProduction ? 0.1 : 1.0, // 10% profiling in prod

  // Session Replay configuration
  replaysSessionSampleRate: isProduction ? 0.1 : 0.5, // 10% sessions in prod
  replaysOnErrorSampleRate: 1.0, // Always capture on error

  // Debug mode
  debug: isDevelopment,

  // Server name for identification
  serverName: process.env.VERCEL_URL || process.env.HOSTNAME || 'localhost',

  // Attach stack traces
  attachStacktrace: true,

  // Send default PII (personally identifiable information)
  sendDefaultPii: false,

  // Max breadcrumbs
  maxBreadcrumbs: 50,

  // Integrations configuration
  integrations: [
    // Session Replay
    Sentry.replayIntegration({
      maskAllText: false, // Keep text for better debugging
      maskAllInputs: true, // Mask sensitive inputs
      blockAllMedia: false, // Allow media for context
      block: ['.sentry-block'], // CSS selector for elements to block
      mask: ['.sentry-mask'], // CSS selector for elements to mask
      networkDetailAllowUrls: [
        'api.insightgov.africa',
        'api.stripe.com',
        'api.groq.com',
      ],
      networkCaptureBodies: true,
      networkRequestHeaders: ['X-Request-Id', 'X-Correlation-Id'],
      networkResponseHeaders: ['X-Response-Time', 'X-Cache-Status'],
    }),

    // HTTP client integration
    Sentry.httpClientIntegration({
      failedRequestStatusCodes: [[400, 599]], // Capture all HTTP errors
    }),

    // Browser tracing integration
    Sentry.browserTracingIntegration({
      traceFetch: true,
      traceXHR: true,
      enableInp: true, // Interaction to Next Paint
      instrumentPageLoad: true,
      instrumentNavigation: true,
    }),

    // Global handlers
    Sentry.globalHandlersIntegration({
      onunhandledrejection: true,
      onerror: true,
    }),

    // Deduplication
    Sentry.dedupeIntegration(),

    // Extra error data
    Sentry.extraErrorDataIntegration({
      depth: 3,
    }),

    // HttpRequest
    Sentry.httpIntegration({
      tracing: true,
    }),

    // OnUnhandledRejection
    Sentry.onUnhandledRejectionIntegration({
      mode: 'strict',
    }),

    // Console integration for breadcrumbs
    Sentry.consoleIntegration({
      levels: ['warn', 'error'],
    }),
  ],

  // Ignore common non-critical errors
  ignoreErrors: [
    // Network errors
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_RESET',
    'ERR_CONNECTION_TIMED_OUT',
    'ERR_NAME_NOT_RESOLVED',

    // Browser extension errors
    'Non-Error promise rejection captured',
    'CANCELLED',
    'Extension context invalidated',
    'webkitIndexedDB',

    // ResizeObserver errors (harmless)
    'ResizeObserver loop completed with undelivered notifications',
    'ResizeObserver loop limit exceeded',

    // Chunk loading errors (often due to network issues)
    'ChunkLoadError',
    'Loading chunk',
    'Loading CSS chunk',

    // Auth related
    'Unauthorized',
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',

    // Cancelled requests
    'Request aborted',
    'canceled',
    'cancelled',

    // Safari specific
    'safari-extension',

    // React specific
    'Minified React error',
  ],

  // Ignore transactions
  ignoreTransactions: [
    // Health checks
    'GET /api/health',
    // Static assets
    '*.js',
    '*.css',
    '*.png',
    '*.jpg',
    '*.svg',
    // Next.js internal
    '/_next/*',
  ],

  // Before send hook
  beforeSend(event, hint) {
    // Don't send events from localhost in development unless explicitly enabled
    if (isDevelopment && !process.env.SENTRY_SEND_IN_DEV) {
      return null;
    }

    // Filter out sensitive data
    if (event.request?.headers) {
      const headers = event.request.headers as Record<string, string>;
      delete headers['authorization'];
      delete headers['cookie'];
      delete headers['x-api-key'];
      delete headers['x-auth-token'];
    }

    // Add additional context
    event.tags = {
      ...event.tags,
      app_version: process.env.npm_package_version,
      environment: process.env.NODE_ENV,
      region: process.env.VERCEL_REGION || 'local',
    };

    return event;
  },

  // Before send transaction hook
  beforeSendTransaction(event) {
    // Don't send transactions from localhost in development
    if (isDevelopment && !process.env.SENTRY_SEND_IN_DEV) {
      return null;
    }

    // Filter out health check transactions
    if (event.transaction?.includes('/api/health')) {
      return null;
    }

    return event;
  },

  // Tracing configuration
  tracePropagationTargets: [
    'localhost',
    /^\//,
    'insightgov.africa',
    /\.insightgov\.africa$/,
    'api.stripe.com',
    'api.groq.com',
  ],

  // Normalize depth
  normalizeDepth: 5,

  // Transport options
  transportOptions: {
    // Batch events
    bufferSize: 30,
  },
};

// ============================================
// INITIALIZATION
// ============================================

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  Sentry.init(sentryConfig);
  console.log('[Sentry] ✅ Initialized successfully');
}

// ============================================
// USER CONTEXT MANAGEMENT
// ============================================

export interface SentryUser {
  id: string;
  email: string;
  username?: string;
  role?: string;
  organizationId?: string;
  organizationName?: string;
  plan?: string;
}

/**
 * Set comprehensive user context
 */
export function setUserContext(user: SentryUser) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username || user.email.split('@')[0],
  });

  // Set additional user context
  Sentry.setTag('user.role', user.role || 'user');
  Sentry.setTag('user.organization_id', user.organizationId);
  Sentry.setTag('organization.name', user.organizationName);
  Sentry.setTag('subscription.plan', user.plan || 'free');

  Sentry.setContext('user_details', {
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
    plan: user.plan,
  });
}

/**
 * Clear user context on logout
 */
export function clearUserContext() {
  Sentry.setUser(null);
  Sentry.setTag('user.role', undefined);
  Sentry.setTag('user.organization_id', undefined);
  Sentry.setTag('organization.name', undefined);
  Sentry.setTag('subscription.plan', undefined);
  Sentry.setContext('user_details', undefined);
}

/**
 * Update user context partially
 */
export function updateUserContext(updates: Partial<SentryUser>) {
  const currentUser = Sentry.getCurrentScope().getUser();
  if (currentUser) {
    setUserContext({
      id: currentUser.id || '',
      email: currentUser.email || '',
      username: currentUser.username,
      ...updates,
    } as SentryUser);
  }
}

// ============================================
// BREADCRUMB MANAGEMENT
// ============================================

export type BreadcrumbCategory =
  | 'auth'
  | 'api'
  | 'upload'
  | 'analysis'
  | 'export'
  | 'payment'
  | 'navigation'
  | 'user-action'
  | 'websocket'
  | 'query'
  | 'ai'
  | 'cache'
  | 'database';

export interface BreadcrumbData {
  category: BreadcrumbCategory;
  message: string;
  data?: Record<string, unknown>;
  level?: 'debug' | 'info' | 'warning' | 'error';
}

/**
 * Add a breadcrumb for tracking user actions
 */
export function addBreadcrumb(options: BreadcrumbData) {
  Sentry.addBreadcrumb({
    category: options.category,
    message: options.message,
    data: options.data,
    level: options.level || 'info',
    timestamp: Date.now() / 1000,
  });
}

// ============================================
// ACTION-SPECIFIC BREADCRUMB HELPERS
// ============================================

/**
 * Track authentication events
 */
export function trackAuthEvent(action: 'login' | 'logout' | 'signup' | 'password_reset' | 'session_expired', data?: Record<string, unknown>) {
  addBreadcrumb({
    category: 'auth',
    message: `Auth: ${action}`,
    data: { action, ...data },
    level: 'info',
  });
}

/**
 * Track API requests
 */
export function trackApiRequest(method: string, endpoint: string, status?: number, duration?: number) {
  addBreadcrumb({
    category: 'api',
    message: `${method.toUpperCase()} ${endpoint}`,
    data: {
      method: method.toUpperCase(),
      endpoint,
      status,
      duration: duration ? `${duration}ms` : undefined,
    },
    level: status && status >= 400 ? 'warning' : 'info',
  });
}

/**
 * Track file uploads
 */
export function trackUpload(filename: string, size: number, status: 'started' | 'completed' | 'failed') {
  addBreadcrumb({
    category: 'upload',
    message: `Upload: ${filename}`,
    data: {
      filename,
      size: `${(size / 1024).toFixed(2)} KB`,
      status,
    },
    level: status === 'failed' ? 'error' : 'info',
  });
}

/**
 * Track AI analysis operations
 */
export function trackAnalysis(datasetId: string, operation: string, status: 'started' | 'completed' | 'failed') {
  addBreadcrumb({
    category: 'analysis',
    message: `AI Analysis: ${operation}`,
    data: {
      datasetId,
      operation,
      status,
    },
    level: status === 'failed' ? 'error' : 'info',
  });
}

/**
 * Track export operations
 */
export function trackExport(format: string, datasetId: string, status: 'started' | 'completed' | 'failed') {
  addBreadcrumb({
    category: 'export',
    message: `Export: ${format.toUpperCase()}`,
    data: {
      format,
      datasetId,
      status,
    },
    level: status === 'failed' ? 'error' : 'info',
  });
}

/**
 * Track payment events
 */
export function trackPayment(action: 'initiated' | 'completed' | 'failed' | 'refunded', amount: number, currency: string = 'XOF') {
  addBreadcrumb({
    category: 'payment',
    message: `Payment: ${action}`,
    data: {
      action,
      amount,
      currency,
    },
    level: action === 'failed' ? 'error' : 'info',
  });
}

/**
 * Track navigation
 */
export function trackNavigation(from: string, to: string) {
  addBreadcrumb({
    category: 'navigation',
    message: `Navigate: ${from} -> ${to}`,
    data: { from, to },
    level: 'info',
  });
}

/**
 * Track WebSocket events
 */
export function trackWebSocketEvent(event: string, data?: Record<string, unknown>) {
  addBreadcrumb({
    category: 'websocket',
    message: `WebSocket: ${event}`,
    data,
    level: 'info',
  });
}

/**
 * Track AI interactions
 */
export function trackAIInteraction(operation: string, model: string, tokens?: number) {
  addBreadcrumb({
    category: 'ai',
    message: `AI: ${operation}`,
    data: {
      operation,
      model,
      tokens,
    },
    level: 'info',
  });
}

/**
 * Track database queries
 */
export function trackDatabaseQuery(operation: string, table: string, duration?: number) {
  addBreadcrumb({
    category: 'database',
    message: `DB: ${operation} on ${table}`,
    data: {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined,
    },
    level: 'info',
  });
}

/**
 * Track cache operations
 */
export function trackCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string) {
  addBreadcrumb({
    category: 'cache',
    message: `Cache: ${operation}`,
    data: {
      operation,
      key: key.substring(0, 50), // Truncate long keys
    },
    level: 'info',
  });
}

// ============================================
// ERROR CAPTURE
// ============================================

/**
 * Capture an error with context
 */
export function captureError(
  error: Error | unknown,
  context?: Record<string, unknown>,
  tags?: Record<string, string | number | boolean>
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // Add tags
  if (tags) {
    Object.entries(tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  }

  // Add context
  if (context) {
    Sentry.setContext('error_context', context);
  }

  // Add breadcrumb for the error
  addBreadcrumb({
    category: 'api',
    message: `Error: ${errorObj.message}`,
    data: context,
    level: 'error',
  });

  return Sentry.captureException(errorObj, {
    extra: context,
    tags: tags as Record<string, string>,
  });
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: Record<string, unknown>
) {
  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Capture feedback from users
 */
export function captureFeedback(
  message: string,
  email?: string,
  name?: string,
  replayId?: string
) {
  return Sentry.captureFeedback({
    message,
    email,
    name,
    associatedEventId: replayId,
  });
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

/**
 * Start a performance span
 */
export function startSpan<T>(
  options: {
    name: string;
    op?: string;
    attributes?: Record<string, string | number | boolean>;
  },
  callback: () => T | Promise<T>
): Promise<T> {
  return Sentry.startSpan(options, callback);
}

/**
 * Start a child span
 */
export function startChildSpan(parentSpan: Sentry.Span, options: {
  name: string;
  op?: string;
  attributes?: Record<string, string | number | boolean>;
}) {
  return parentSpan.startChild(options);
}

/**
 * Get current span
 */
export function getCurrentSpan() {
  return Sentry.getActiveSpan();
}

/**
 * Add attribute to current span
 */
export function addSpanAttribute(key: string, value: string | number | boolean) {
  const span = getCurrentSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}

// ============================================
// MONITORING WRAPPER
// ============================================

/**
 * Wrapper for async functions with automatic error capture and performance tracking
 */
export function withMonitoring<T>(
  name: string,
  fn: () => Promise<T>,
  options?: {
    tags?: Record<string, string>;
    context?: Record<string, unknown>;
    op?: string;
  }
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: options?.op || 'function',
      attributes: options?.context as Record<string, string | number | boolean>,
    },
    async () => {
      try {
        // Add tags if provided
        if (options?.tags) {
          Object.entries(options.tags).forEach(([key, value]) => {
            Sentry.setTag(key, value);
          });
        }

        const result = await fn();
        return result;
      } catch (error) {
        captureError(error as Error, options?.context, options?.tags);
        throw error;
      }
    }
  );
}

/**
 * Wrap an API handler with monitoring
 */
export function withApiMonitoring<T extends (...args: unknown[]) => Promise<unknown>>(
  name: string,
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();

    try {
      addBreadcrumb({
        category: 'api',
        message: `API Call: ${name}`,
        level: 'info',
      });

      const result = await handler(...args);

      trackApiRequest('CALL', name, 200, Date.now() - startTime);

      return result;
    } catch (error) {
      trackApiRequest('CALL', name, 500, Date.now() - startTime);
      captureError(error as Error, { handler: name });
      throw error;
    }
  }) as T;
}

// ============================================
// CONTEXT MANAGEMENT
// ============================================

/**
 * Set application context
 */
export function setApplicationContext(data: {
  version?: string;
  environment?: string;
  region?: string;
  deployment?: string;
}) {
  Sentry.setContext('application', {
    version: data.version || process.env.npm_package_version,
    environment: data.environment || process.env.NODE_ENV,
    region: data.region || process.env.VERCEL_REGION || 'local',
    deployment: data.deployment || process.env.VERCEL_ENV || 'development',
  });
}

/**
 * Set organization context
 */
export function setOrganizationContext(organization: {
  id: string;
  name: string;
  type: string;
  sector?: string;
  plan?: string;
}) {
  Sentry.setContext('organization', organization);
  Sentry.setTag('organization.id', organization.id);
  Sentry.setTag('organization.type', organization.type);
  Sentry.setTag('organization.sector', organization.sector);
  Sentry.setTag('organization.plan', organization.plan);
}

/**
 * Set feature flags context
 */
export function setFeatureFlags(flags: Record<string, boolean>) {
  Sentry.setContext('feature_flags', flags);
  Object.entries(flags).forEach(([key, value]) => {
    Sentry.setTag(`feature.${key}`, value);
  });
}

// ============================================
// UTILITIES
// ============================================

/**
 * Get the last event ID
 */
export function getLastEventId() {
  return Sentry.lastEventId();
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized() {
  return !!SENTRY_DSN;
}

/**
 * Flush events before shutdown
 */
export async function flushSentry(timeout: number = 2000): Promise<void> {
  if (SENTRY_DSN) {
    await Sentry.flush(timeout);
  }
}

/**
 * Close Sentry client
 */
export async function closeSentry(timeout: number = 2000): Promise<void> {
  if (SENTRY_DSN) {
    await Sentry.close(timeout);
  }
}

// Export default Sentry instance
export default Sentry;
