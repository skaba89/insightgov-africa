# =============================================================================
# InsightGov Africa - Production Dockerfile
# =============================================================================
# Multi-stage build optimisé pour la production avec Prisma
# =============================================================================

# Stage 1: Dependencies
FROM oven/bun:1 AS deps
WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN bun install --frozen-lockfile
RUN bunx prisma generate

# Stage 2: Builder
FROM oven/bun:1 AS builder
WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1 AS runner
WORKDIR /app

# Install OpenSSL for Prisma runtime and curl for health checks
RUN apt-get update && apt-get install -y \
    openssl \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

# Copy startup script
COPY docker-start-production.sh ./
RUN chmod +x docker-start-production.sh

# Set correct ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application with startup script
CMD ["./docker-start-production.sh"]
