#!/bin/bash
# =============================================================================
# InsightGov Africa - Production Startup Script
# =============================================================================
# Ce script est exécuté au démarrage du conteneur en production
# =============================================================================

set -e

echo "🚀 Démarrage InsightGov Africa (Production)..."

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if bunx prisma migrate deploy 2>/dev/null; then
    echo "✅ Base de données prête!"
    break
  fi
  attempt=$((attempt + 1))
  echo "Tentative $attempt/$max_attempts..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "⚠️  Impossible de se connecter à la base de données, démarrage quand même..."
fi

# Exécuter le seed si nécessaire (seulement si ADMIN_EMAIL est défini)
if [ -n "$ADMIN_EMAIL" ]; then
  echo "🌱 Vérification du seeding..."
  bun run prisma/seed-production.ts 2>/dev/null || true
fi

# Démarrer l'application
echo "🎯 Démarrage du serveur..."
exec bun server.js
