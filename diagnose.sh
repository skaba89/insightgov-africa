#!/bin/bash
# =============================================================================
# InsightGov Africa - Diagnostic Script
# =============================================================================
# Ce script vérifie l'état de l'application et diagnostique les problèmes
# =============================================================================

echo "=========================================="
echo "🔍 InsightGov Africa - Diagnostic"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
echo "📦 Vérification Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker installé${NC}"

# Check Docker daemon
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon ne fonctionne pas${NC}"
    echo "   Démarrez Docker Desktop et réessayez"
    exit 1
fi
echo -e "${GREEN}✅ Docker daemon actif${NC}"

# Check .env file
echo ""
echo "📄 Vérification configuration..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Fichier .env manquant${NC}"
    echo "   Copie de .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Veuillez éditer .env avec votre GROQ_API_KEY${NC}"
else
    echo -e "${GREEN}✅ Fichier .env présent${NC}"
fi

# Check GROQ_API_KEY
if grep -q "gsk_" .env 2>/dev/null; then
    echo -e "${GREEN}✅ GROQ_API_KEY configurée${NC}"
else
    echo -e "${YELLOW}⚠️  GROQ_API_KEY non configurée${NC}"
    echo "   Obtenez une clé sur: https://console.groq.com/keys"
fi

# Check containers
echo ""
echo "🐳 Vérification conteneurs..."
POSTGRES_RUNNING=$(docker ps --filter "name=insightgov-db" --filter "status=running" -q | wc -l)
APP_RUNNING=$(docker ps --filter "name=insightgov-app" --filter "status=running" -q | wc -l)

if [ "$POSTGRES_RUNNING" -gt 0 ]; then
    echo -e "${GREEN}✅ PostgreSQL conteneur actif${NC}"
else
    echo -e "${RED}❌ PostgreSQL conteneur inactif${NC}"
fi

if [ "$APP_RUNNING" -gt 0 ]; then
    echo -e "${GREEN}✅ App conteneur actif${NC}"
else
    echo -e "${RED}❌ App conteneur inactif${NC}"
fi

# Check ports
echo ""
echo "🔌 Vérification ports..."
if netstat -tuln 2>/dev/null | grep -q ":3000 " || ss -tuln 2>/dev/null | grep -q ":3000 "; then
    echo -e "${GREEN}✅ Port 3000 disponible${NC}"
else
    echo -e "${YELLOW}⚠️  Port 3000 non détecté (app pas démarrée ?)${NC}"
fi

# Show logs if app is running but not responding
if [ "$APP_RUNNING" -gt 0 ]; then
    echo ""
    echo "📋 Dernières logs de l'application:"
    echo "----------------------------------------"
    docker-compose logs app --tail=30 2>/dev/null || docker compose logs app --tail=30
fi

echo ""
echo "=========================================="
echo "🏁 Diagnostic terminé"
echo "=========================================="
echo ""
echo "Commandes utiles:"
echo "  Démarrer:     docker-compose up -d"
echo "  Logs:         docker-compose logs -f app"
echo "  Redémarrer:   docker-compose restart app"
echo "  Reconstruire: docker-compose build --no-cache && docker-compose up -d"
