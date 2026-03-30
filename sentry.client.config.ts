// ============================================
// InsightGov Africa - Sentry Client Configuration
// Browser-side error tracking and monitoring
// ============================================

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: SENTRY_DSN || '',

  // Environment
  environment: process.env.NODE_ENV || 'development',
  release: process.env.SENTRY_RELEASE || process.env.npm_package_version || '1.0.0',

  // Performance monitoring
  tracesSampleRate: isProduction ? 0.1 : 1.0,

  // Session Replay - captures user sessions for debugging
  replaysSessionSampleRate: isProduction ? 0.1 : 0.5,
  replaysOnErrorSampleRate: 1.0, // Always capture on error

  // Debug mode
  debug: isDevelopment,

  // Client-specific integrations
  integrations: [
    // Browser Session Replay
    Sentry.replayIntegration({
      // Additional Replay settings
      maskAllText: false,
      maskAllInputs: true, // Mask sensitive form inputs
      blockAllMedia: false,
      // Network details
      networkDetailAllowUrls: [
        window.location.origin,
        'api.paystack.co',
        'api.openai.com',
      ],
      networkCaptureBodies: true,
    }),

    // Browser Tracing
    Sentry.browserTracingIntegration({
      traceFetch: true,
      traceXHR: true,
      enableInp: true, // Interaction to Next Paint metric
      instrumentPageLoad: true,
      instrumentNavigation: true,
    }),

    // Global error handlers
    Sentry.globalHandlersIntegration({
      onunhandledrejection: true,
      onerror: true,
    }),

    // Deduplicate errors
    Sentry.dedupeIntegration(),

    // Console breadcrumbs
    Sentry.consoleIntegration({
      levels: ['warn', 'error'],
    }),

    // Extra error data
    Sentry.extraErrorDataIntegration({
      depth: 3,
    }),

    // Feedback integration
    Sentry.feedbackIntegration({
      colorScheme: 'system',
      isEmailRequired: false,
      showBranding: false,
      showEmail: true,
      showName: true,
      useFormSubmit: false,
      autoInject: false,
      triggerLabel: 'Signaler un problème',
      formTitle: 'Signaler un problème',
      submitButtonLabel: 'Envoyer',
      cancelButtonLabel: 'Annuler',
      messageLabel: 'Description du problème',
      messagePlaceholder: 'Décrivez le problème rencontré...',
      emailLabel: 'Email',
      emailPlaceholder: 'votre@email.com',
      nameLabel: 'Nom',
      namePlaceholder: 'Votre nom',
      successMessageText: 'Merci pour votre retour !',
    }),
  ],

  // Ignore common browser errors
  ignoreErrors: [
    // Network errors (often user-side issues)
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_RESET',
    'ERR_CONNECTION_TIMED_OUT',

    // Browser extension errors
    'Non-Error promise rejection captured',
    'Extension context invalidated',
    'safari-extension',

    // ResizeObserver errors (harmless)
    'ResizeObserver loop completed with undelivered notifications',
    'ResizeObserver loop limit exceeded',

    // Chunk loading errors
    'ChunkLoadError',
    'Loading chunk',
    'Loading CSS chunk',

    // Cancelled requests
    'Request aborted',
    'canceled',
    'cancelled',

    // React specific
    'Minified React error',
  ],

  // Ignore specific transactions
  ignoreTransactions: [
    // Static assets
    '*.js',
    '*.css',
    '*.png',
    '*.svg',
    // Health checks
    'GET /api/health',
  ],

  // Trace propagation for linked services
  tracePropagationTargets: [
    'localhost',
    /^\//,
    window.location.origin,
    'api.paystack.co',
    'api.openai.com',
  ],

  // Before send hook for client events
  beforeSend(event) {
    // Don't send in development unless explicitly enabled
    if (isDevelopment && !process.env.NEXT_PUBLIC_SENTRY_SEND_IN_DEV) {
      return null;
    }

    // Sanitize request data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        const headers = event.request.headers as Record<string, string>;
        delete headers['authorization'];
        delete headers['cookie'];
        delete headers['x-api-key'];
      }

      // Remove sensitive query params
      if (event.request.query_string) {
        const query = event.request.query_string as string;
        const sanitizedQuery = query
          .replace(/token=[^&]*/gi, 'token=REDACTED')
          .replace(/password=[^&]*/gi, 'password=REDACTED')
          .replace(/key=[^&]*/gi, 'key=REDACTED');
        event.request.query_string = sanitizedQuery;
      }
    }

    // Remove sensitive cookies
    if (event.request?.cookies) {
      const cookies = event.request.cookies as Record<string, string>;
      delete cookies['session'];
      delete cookies['auth_token'];
      delete cookies['access_token'];
      delete cookies['refresh_token'];
    }

    return event;
  },

  // Before send transaction
  beforeSendTransaction(event) {
    if (isDevelopment && !process.env.NEXT_PUBLIC_SENTRY_SEND_IN_DEV) {
      return null;
    }

    // Filter out health check transactions
    if (event.transaction?.includes('/api/health')) {
      return null;
    }

    return event;
  },

  // Normalize data depth
  normalizeDepth: 5,

  // Attach stack traces to messages
  attachStacktrace: true,

  // Don't send default PII
  sendDefaultPii: false,

  // Max breadcrumbs to keep
  maxBreadcrumbs: 50,
});

// Export for use in client components
export function reportError(
  error: Error,
  context?: Record<string, unknown>,
  tags?: Record<string, string>
) {
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

  Sentry.captureException(error);
}

export function reportMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

export function identifyUser(user: {
  id: string;
  email: string;
  name?: string;
  role?: string;
  organizationId?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });

  Sentry.setTag('user.role', user.role);
  Sentry.setTag('organization.id', user.organizationId);

  Sentry.setContext('user', user);
}

export function clearUser() {
  Sentry.setUser(null);
}

export default Sentry;
