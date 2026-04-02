#!/bin/bash
# =============================================================================
# InsightGov Africa - Script de Démarrage Production
# =============================================================================
# Ce script est exécuté au démarrage du conteneur en production.
#
# Fonctionnalités:
#   - Attente de la base de données
#   - Exécution automatique des migrations
#   - Seed initial si configuré
#   - Health check interne
#   - Démarrage du serveur Next.js
#   - Gestion des signaux pour arrêt propre
# =============================================================================

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
MAX_DB_RETRIES=${MAX_DB_RETRIES:-30}
DB_RETRY_INTERVAL=${DB_RETRY_INTERVAL:-2}
HEALTH_CHECK_PORT=${PORT:-3000}

# =============================================================================
# FONCTIONS UTILITAIRES
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# =============================================================================
# ATTENTE DE LA BASE DE DONNÉES
# =============================================================================

wait_for_database() {
    log_info "⏳ Attente de la connexion à la base de données..."

    local attempt=0

    while [ $attempt -lt $MAX_DB_RETRIES ]; do
        attempt=$((attempt + 1))

        # Tester la connexion avec prisma migrate deploy
        if npx prisma migrate deploy --schema=./prisma/schema.prisma 2>/dev/null; then
            log_success "✅ Base de données connectée et migrations appliquées!"
            return 0
        fi

        log_info "Tentative $attempt/$MAX_DB_RETRIES - Nouvelle tentative dans ${DB_RETRY_INTERVAL}s..."

        # Vérifier si c'est une erreur de connexion
        if [ $attempt -eq 5 ]; then
            log_warning "La base de données ne répond pas encore..."
        fi

        sleep $DB_RETRY_INTERVAL
    done

    log_warning "⚠️  Impossible de se connecter à la base de données après $MAX_DB_RETRIES tentatives"
    log_warning "Démarrage quand même - les migrations seront retentées..."

    return 1
}

# =============================================================================
# MIGRATIONS
# =============================================================================

run_migrations() {
    log_info "🔄 Exécution des migrations Prisma..."

    # Exécuter les migrations
    if npx prisma migrate deploy --schema=./prisma/schema.prisma; then
        log_success "✅ Migrations exécutées avec succès"
    else
        log_error "❌ Échec des migrations"
        log_info "Tentative avec db push..."
        npx prisma db push --accept-data-loss --skip-generate || true
    fi
}

# =============================================================================
# SEED INITIAL
# =============================================================================

run_seed() {
    # Exécuter le seed seulement si ADMIN_EMAIL est défini
    if [ -n "$ADMIN_EMAIL" ]; then
        log_info "🌱 Vérification du seed initial..."

        # Vérifier si le fichier de seed existe
        if [ -f "./prisma/seed-production.ts" ]; then
            if npx tsx ./prisma/seed-production.ts; then
                log_success "✅ Seed initialisé"
            else
                log_warning "⚠️  Seed déjà effectué ou erreur non critique"
            fi
        else
            log_warning "Fichier de seed non trouvé"
        fi
    fi
}

# =============================================================================
# HEALTH CHECK INTERNE
# =============================================================================

start_health_check() {
    log_info "🏥 Configuration du health check interne..."

    # Le health check est géré par Docker, mais on peut ajouter
    # un monitoring interne si nécessaire

    # Vérifier que le port est disponible
    if command -v curl &> /dev/null; then
        log_info "Health check disponible sur /api/health"
    fi
}

# =============================================================================
# GESTION DES SIGNAUX
# =============================================================================

cleanup() {
    log_info "🛑 Arrêt du serveur en cours..."

    # Tuer les processus enfants
    if [ -n "$PID" ]; then
        kill -TERM $PID 2>/dev/null || true
        wait $PID 2>/dev/null || true
    fi

    log_success "Serveur arrêté proprement"
    exit 0
}

# Capturer les signaux d'arrêt
trap cleanup SIGTERM SIGINT SIGQUIT

# =============================================================================
# VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT CRITIQUES
# =============================================================================

check_env_vars() {
    log_info "🔍 Vérification des variables d'environnement..."

    local missing_vars=()

    # Variables obligatoires
    [ -z "$DATABASE_URL" ] && missing_vars+=("DATABASE_URL")
    [ -z "$NEXTAUTH_SECRET" ] && missing_vars+=("NEXTAUTH_SECRET")
    [ -z "$NEXTAUTH_URL" ] && missing_vars+=("NEXTAUTH_URL")

    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Variables d'environnement manquantes: ${missing_vars[*]}"
        log_error "L'application risque de ne pas fonctionner correctement"
    else
        log_success "✅ Variables d'environnement critiques présentes"
    fi

    # Variables optionnelles pour les paiements
    if [ -n "$ORANGE_MONEY_API_KEY" ]; then
        log_info "Orange Money configuré"
    fi

    if [ -n "$MTN_MONEY_API_KEY" ]; then
        log_info "MTN Money configuré"
    fi

    if [ -n "$PAYSTACK_SECRET_KEY" ]; then
        log_info "Paystack configuré"
    fi
}

# =============================================================================
# PRÉPARATION DU RUNTIME
# =============================================================================

prepare_runtime() {
    log_info "⚙️  Préparation du runtime..."

    # Créer les répertoires nécessaires
    mkdir -p /app/uploads /app/logs 2>/dev/null || true

    # Régénérer Prisma Client si nécessaire
    if [ -d "./node_modules/.prisma" ]; then
        log_info "Prisma Client disponible"
    else
        log_info "Génération de Prisma Client..."
        npx prisma generate --schema=./prisma/schema.prisma
    fi

    # Vérifier le build Next.js
    if [ -f "./server.js" ]; then
        log_success "✅ Build Next.js trouvé"
    else
        log_error "❌ Build Next.js non trouvé - l'application risque de ne pas démarrer"
    fi
}

# =============================================================================
# DÉMARRAGE DU SERVEUR
# =============================================================================

start_server() {
    log_info "🚀 Démarrage du serveur Next.js..."
    log_info "Port: $HEALTH_CHECK_PORT"
    log_info "Environnement: ${NODE_ENV:-production}"

    # Démarrer le serveur en arrière-plan pour capturer le PID
    node server.js &
    PID=$!

    # Attendre que le serveur soit prêt
    log_info "⏳ Attente du démarrage du serveur..."

    local attempt=0
    local max_attempts=30

    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))

        # Vérifier si le processus est toujours en cours
        if ! kill -0 $PID 2>/dev/null; then
            log_error "❌ Le serveur s'est arrêté de manière inattendue"
            exit 1
        fi

        # Tester le health endpoint
        if curl -f "http://localhost:${HEALTH_CHECK_PORT}/api/health" 2>/dev/null; then
            log_success "✅ Serveur démarré avec succès!"
            log_success "🌟 InsightGov Africa est en ligne sur le port $HEALTH_CHECK_PORT"
            break
        fi

        sleep 1
    done

    if [ $attempt -eq $max_attempts ]; then
        log_warning "⚠️  Health check non répondant, mais serveur en cours..."
    fi

    # Attendre le processus principal
    wait $PID
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    echo ""
    echo "========================================"
    echo "  🌍 InsightGov Africa"
    echo "  Production Server"
    echo "========================================"
    echo ""

    # 1. Vérifier les variables d'environnement
    check_env_vars

    # 2. Préparer le runtime
    prepare_runtime

    # 3. Attendre la base de données
    wait_for_database

    # 4. Exécuter les migrations
    run_migrations

    # 5. Exécuter le seed si configuré
    run_seed

    # 6. Configurer le health check
    start_health_check

    # 7. Démarrer le serveur
    start_server
}

# Exécuter le main
main
