#!/bin/bash
# ============================================
# InsightGov Africa - Migration Script
# ============================================
# Script de migration de SQLite vers PostgreSQL
# Usage: ./scripts/migrate-to-postgres.sh

set -e

echo "========================================"
echo "InsightGov Africa - Migration PostgreSQL"
echo "========================================"

# Vérifier les variables d'environnement
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erreur: DATABASE_URL n'est pas défini"
    echo "Exemple: export DATABASE_URL=postgresql://user:password@host:5432/insightgov"
    exit 1
fi

# Vérifier que c'est une URL PostgreSQL
if [[ ! "$DATABASE_URL" =~ ^postgres ]]; then
    echo "❌ Erreur: DATABASE_URL doit être une URL PostgreSQL"
    echo "URL actuelle: $DATABASE_URL"
    exit 1
fi

echo ""
echo "📊 Configuration détectée:"
echo "   DATABASE_URL: ${DATABASE_URL:0:30}..."
echo ""

# Demander confirmation
read -p "Voulez-vous continuer avec la migration? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration annulée."
    exit 0
fi

# 1. Sauvegarder les données SQLite
echo ""
echo "📦 Étape 1: Sauvegarde des données SQLite..."
if [ -f "db/custom.db" ]; then
    cp db/custom.db "db/custom.db.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Sauvegarde créée"
else
    echo "⚠️  Aucune base SQLite trouvée, création d'une nouvelle base PostgreSQL"
fi

# 2. Changer le schéma Prisma
echo ""
echo "📋 Étape 2: Configuration du schéma PostgreSQL..."
cp prisma/schema.prisma prisma/schema.sqlite.prisma.backup
cp prisma/schema.postgresql.prisma prisma/schema.prisma
echo "✅ Schéma PostgreSQL activé"

# 3. Générer le client Prisma
echo ""
echo "🔧 Étape 3: Génération du client Prisma..."
bunx prisma generate
echo "✅ Client Prisma généré"

# 4. Créer la migration
echo ""
echo "🚀 Étape 4: Création des tables PostgreSQL..."
bunx prisma migrate dev --name init_postgresql
echo "✅ Migration créée"

# 5. Optionnel: Migrer les données
echo ""
echo "📊 Étape 5: Migration des données..."
read -p "Voulez-vous migrer les données existantes? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration des données en cours..."
    # TODO: Implémenter la migration des données avec un script Node.js
    echo "⚠️  Migration des données non implémentée - utilisez prisma db seed"
fi

echo ""
echo "========================================"
echo "✅ Migration terminée avec succès!"
echo "========================================"
echo ""
echo "Prochaines étapes:"
echo "1. Vérifiez que l'application fonctionne: bun run dev"
echo "2. Exécutez les seeds: bun run db:seed:prod"
echo "3. Déployez en production"
echo ""
