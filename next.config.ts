import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",

  typescript: {
    ignoreBuildErrors: false,
  },

  reactStrictMode: true,

  // Fix for Prisma + Next.js 16 compatibility
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Turbopack config (Next.js 16 default)
  turbopack: {},

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

// Sentry webpack configuration (updated for Sentry SDK v10+)
const sentryConfig = {
  // Silent the Sentry webpack plugin output
  silent: process.env.NODE_ENV === 'development',

  // Use the new webpack namespace for configuration
  webpack: {
    // Enable automatic instrumentation
    automaticVercelMonitors: true,
    autoInstrumentMiddleware: true,
    autoInstrumentServerFunctions: true,
    reactComponentAnnotation: {
      enabled: true,
    },
  },

  // Source maps configuration
  widenClientFileUpload: true,

  // Transpile SDK packages
  transpileClientSDK: true,

  // Hide source maps from being served publicly
  hideSourceMaps: true,

  // Bundle size optimization
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeEmulator: true,
    excludeTracing: false,
    excludeReplayIframe: false,
    excludeReplayShadowDom: false,
    excludeReplayWorker: false,
  },

  // Sentry release information
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for Sentry CLI (for uploading source maps)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Set to true to enable Sentry
  enabled: !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
};

// Export with Sentry wrapper
const withSentry = withSentryConfig(nextConfig, sentryConfig);

export default withSentry;
