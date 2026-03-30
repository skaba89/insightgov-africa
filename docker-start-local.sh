#!/bin/bash
# =============================================================================
# InsightGov Africa - Docker Local Startup
# =============================================================================

echo "🐳 Démarrage d'InsightGov Africa avec Docker..."
echo ""

# Check if .env exists
if [ ! -f .env.docker ]; then
    echo "📝 Création du fichier .env.docker..."
    cat > .env.docker << ENVEOF
# Database
DATABASE_URL=postgresql://insightgov:insightgov123@postgres:5432/insightgov?schema=public

# NextAuth
NEXTAUTH_SECRET=local_dev_secret_change_in_production_12345
NEXTAUTH_URL=http://localhost:3000

# AI
AI_PROVIDER=groq
GROQ_API_KEY=gsk_demo_key_for_local_testing
AI_MODEL=llama-3.3-70b-versatile

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=InsightGov Africa
NODE_ENV=development

# Email (Resend)
RESEND_API_KEY=re_demo_key

# Paystack
PAYSTACK_SECRET_KEY=sk_test_demo
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_demo

# Demo
DEMO_MODE=true
ENVEOF
fi

echo "🚀 Lancement des containers..."
docker-compose --env-file .env.docker up -d

echo ""
echo "⏳ Attente du démarrage..."
sleep 10

echo ""
echo "✅ InsightGov Africa est en cours de démarrage!"
echo ""
echo "📱 Accès:"
echo "   - Application: http://localhost:3000"
echo "   - Adminer (DB): http://localhost:8080"
echo ""
echo "📋 Commandes utiles:"
echo "   - Logs: docker-compose logs -f app"
echo "   - Stop: docker-compose down"
echo "   - Restart: docker-compose restart app"
echo ""
