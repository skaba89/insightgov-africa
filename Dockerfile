# =============================================================================
# InsightGov Africa - Production Dockerfile (Multi-stage Optimisé)
# =============================================================================
# Support ARM64 (Apple Silicon) et AMD64 (x86_64)
# Security hardening avec non-root user
# Utilise Bun pour les performances optimales
# =============================================================================

# Étape 1: Dépendances de base
FROM oven/bun:1 AS base

# Installer les dépendances système essentielles
# OpenSSL: requis pour Prisma
# curl: pour les health checks
RUN apt-get update && apt-get install -y \
    openssl \
    curl \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Étape 2: Installation des dépendances (avec cache)
FROM base AS deps

WORKDIR /app

# Copier les fichiers de dépendances en premier (meilleur cache)
COPY package.json bun.lock* ./

# Copier le schéma Prisma
COPY prisma ./prisma/

# Utiliser le schéma PostgreSQL pour la production
RUN if [ -f "./prisma/schema.postgresql.prisma" ]; then \
    cp ./prisma/schema.postgresql.prisma ./prisma/schema.prisma; \
    fi

# Installer les dépendances avec Bun
RUN bun install --frozen-lockfile

# Générer le client Prisma
RUN bunx prisma generate

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
RUN bun run build

# =============================================================================
# Étape 4: Image de production minimale
FROM oven/bun:1 AS runner

WORKDIR /app

# Installer OpenSSL pour Prisma runtime, curl pour health checks, et bash pour les scripts
RUN apt-get update && apt-get install -y \
    openssl \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Variables d'environnement de production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# =============================================================================
# SECURITY HARDENING
# =============================================================================

# Créer un utilisateur non-root pour la sécurité
# UID/GID 1001: standard pour les applications Node.js
# Utiliser groupadd/useradd (Debian) au lieu de addgroup/adduser (Alpine)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --shell /bin/bash nextjs

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
