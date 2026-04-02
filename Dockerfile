# =============================================================================
# InsightGov Africa - Production Dockerfile (Multi-stage Optimisé)
# =============================================================================
# Support ARM64 (Apple Silicon) et AMD64 (x86_64)
# Security hardening avec non-root user
# Cache optimisé pour les layers Docker
# =============================================================================

# Étape 1: Dépendances de base
FROM node:20-alpine AS base

# Installer les dépendances système essentielles
# OpenSSL: requis pour Prisma
# curl: pour les health checks
RUN apk add --no-cache \
    openssl \
    curl \
    libc6-compat \
    && rm -rf /var/cache/apk/*

# =============================================================================
# Étape 2: Installation des dépendances (avec cache)
FROM base AS deps

WORKDIR /app

# Copier les fichiers de dépendances en premier (meilleur cache)
COPY package.json package-lock.json* ./

# Installer les dépendances avec npm
# --legacy-peer-deps pour la compatibilité React 19
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# Copier le schéma Prisma et générer le client
COPY prisma ./prisma/
RUN npx prisma generate

# =============================================================================
# Étape 3: Build de l'application
FROM base AS builder

WORKDIR /app

# Copier les dépendances installées
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

# Copier le code source
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_BUILD_ID=production

# Désactiver les analyses pendant le build
ENV SKIP_ENV_VALIDATION=1

# Build de l'application Next.js
# standalone: crée un serveur autonome
RUN npm run build

# =============================================================================
# Étape 4: Image de production minimale
FROM base AS runner

WORKDIR /app

# Variables d'environnement de production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# =============================================================================
# SECURITY HARDENING
# =============================================================================

# Créer un utilisateur non-root pour la sécurité
# UID/GID 1001: standard pour les applications Node.js
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Créer les répertoires nécessaires avec les bonnes permissions
RUN mkdir -p /app/.next /app/public /app/uploads /app/logs && \
    chown -R nextjs:nodejs /app

# =============================================================================
# COPIE DES FICHIERS DE PRODUCTION
# =============================================================================

# Copier les fichiers statiques publics
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copier l'application standalone Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copier les fichiers statiques générés
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copier Prisma pour les migrations runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copier le script de démarrage
COPY --chown=nextjs:nodejs docker-start-production.sh ./
RUN chmod +x docker-start-production.sh

# =============================================================================
# CONFIGURATION RÉSEAU
# =============================================================================

# Exposer le port de l'application
EXPOSE 3000

# Variables de port
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# =============================================================================
# HEALTH CHECK
# =============================================================================

# Health check intégré pour Docker et orchestrateurs
# Intervalle: 30s entre les checks
# Timeout: 10s pour répondre
# Start period: 40s pour le démarrage initial
# Retries: 3 avant de marquer unhealthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# =============================================================================
# DÉMARRAGE
# =============================================================================

# Passer à l'utilisateur non-root
USER nextjs

# Démarrer l'application avec le script de démarrage
CMD ["./docker-start-production.sh"]
