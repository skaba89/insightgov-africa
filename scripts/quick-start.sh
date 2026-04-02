#!/bin/bash
# ============================================
# InsightGov Africa - Quick Start Script
# ============================================
# Script de démarrage rapide pour le développement local

set -e

echo "========================================"
echo "🚀 InsightGov Africa - Quick Start"
echo "========================================"

# Vérifier Bun
if ! command -v bun &> /dev/null; then
    echo "❌ Bun n'est pas installé"
    echo "Installez-le: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Vérifier les dépendances
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    bun install
fi

# Vérifier la base de données
if [ ! -f "db/custom.db" ]; then
    echo "📊 Initialisation de la base de données..."
    bunx prisma generate
    bunx prisma db push
    bun run db:seed
fi

# Vérifier le fichier .env
if [ ! -f ".env" ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo "⚠️  Veuillez configurer vos clés API dans .env"
fi

echo ""
echo "========================================"
echo "✅ Prêt à démarrer!"
echo "========================================"
echo ""
echo "Commandes disponibles:"
echo ""
echo "  bun run dev       - Démarrer le serveur de développement"
echo "  bun run build     - Build de production"
echo "  bun run start     - Démarrer en mode production"
echo "  bun run db:studio - Ouvrir Prisma Studio"
echo "  bun run lint      - Vérifier le code"
echo ""
echo "Comptes de test:"
echo ""
echo "  Email: admin@sante.gouv.sn"
echo "  Mot de passe: password123"
echo ""
echo "========================================"

# Démarrer le serveur
echo "🚀 Démarrage du serveur..."
bun run dev
