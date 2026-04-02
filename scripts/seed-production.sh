#!/bin/bash
# ============================================
# InsightGov Africa - Production Seed Script
# ============================================
# Script pour initialiser les données de production

# Ce script est appelé via: bun run db:seed:prod
# Il crée les données minimales nécessaires pour la production

echo "🌱 Seeding production data..."

bun run prisma/seed-production.ts

echo "✅ Production seed completed!"
