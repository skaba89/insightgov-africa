#!/bin/bash

# =============================================================================
# InsightGov Africa - Setup Script
# =============================================================================
# Ce script vous guide dans la configuration du projet
# =============================================================================

set -e

echo "🚀 InsightGov Africa - Configuration"
echo "===================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
success() { echo -e "${GREEN}✓ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; exit 1; }

# Vérifier si bun ou npm est installé
echo "📋 Vérification des prérequis..."
if command -v bun &> /dev/null; then
    PKG_MANAGER="bun"
    success "Bun détecté"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    success "npm détecté"
else
    error "Node.js ou Bun est requis. Installez-le depuis https://nodejs.org ou https://bun.sh"
fi

# Vérifier si .env.local existe
echo ""
echo "📄 Configuration des variables d'environnement..."
if [ -f ".env.local" ]; then
    warning ".env.local existe déjà"
    read -p "Voulez-vous le remplacer ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Configuration annulée. Modifiez .env.local manuellement."
    else
        cp .env.example .env.local
        success ".env.local créé"
    fi
else
    cp .env.example .env.local
    success ".env.local créé depuis .env.example"
fi

# Installer les dépendances
echo ""
echo "📦 Installation des dépendances..."
if [ "$PKG_MANAGER" = "bun" ]; then
    bun install
else
    npm install
fi
success "Dépendances installées"

# Générer Prisma Client
echo ""
echo "🔧 Génération du client Prisma..."
if [ "$PKG_MANAGER" = "bun" ]; then
    bunx prisma generate
else
    npx prisma generate
fi
success "Client Prisma généré"

# Afficher les instructions
echo ""
echo "===================================="
echo "🎉 Configuration terminée !"
echo "===================================="
echo ""
echo "📋 PROCHAINES ÉTAPES :"
echo ""
echo "1. 📝 Configurez vos variables d'environnement :"
echo "   Ouvrez .env.local et ajoutez vos clés API"
echo ""
echo "   Variables requises :"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - OPENAI_API_KEY"
echo ""
echo "2. 🗄️ Configurez Supabase :"
echo "   a. Créez un projet sur https://supabase.com"
echo "   b. Allez dans SQL Editor"
echo "   c. Exécutez le contenu de supabase/schema.sql"
echo ""
echo "3. 🚀 Lancez le serveur de développement :"
if [ "$PKG_MANAGER" = "bun" ]; then
    echo "   bun dev"
else
    echo "   npm run dev"
fi
echo ""
echo "4. 🌐 Ouvrez http://localhost:3000"
echo ""
echo "📖 Documentation complète : docs/SETUP.md"
echo ""
