#!/bin/bash
set -e

echo "========================================"
echo "🚀 InsightGov Africa - Démarrage"
echo "========================================"
echo ""

# Function to generate Prisma client
generate_prisma() {
    echo "📦 Génération client Prisma..."
    npx prisma generate
    echo "✅ Client Prisma généré"
}

# Function to check database
check_db() {
    echo "⏳ Vérification connexion base de données..."
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if npx prisma db push --skip-generate 2>/dev/null; then
            echo "✅ Base de données connectée!"
            return 0
        fi
        attempt=$((attempt + 1))
        echo "   Tentative $attempt/$max_attempts..."
        sleep 2
    done
    echo "⚠️  Impossible de se connecter à la base de données"
    return 1
}

# Generate Prisma client first
generate_prisma

# Run database setup
check_db

echo ""
echo "🎯 Démarrage du serveur Next.js..."
echo "   URL: http://localhost:3000"
echo ""

# Start Next.js development server
exec npm run dev
