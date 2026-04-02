#!/bin/bash
# =============================================================================
# InsightGov Africa - Script de Déploiement Automatisé
# =============================================================================
# Usage:
#   ./scripts/deploy.sh [environment] [action]
#
# Environments:
#   dev     - Développement local
#   staging - Environnement de test
#   prod    - Production
#
# Actions:
#   build   - Construire les images
#   push    - Pousser les images vers le registry
#   deploy  - Déployer sur l'environnement
#   all     - Build + Push + Deploy
#   rollback- Revenir à la version précédente
#
# Exemples:
#   ./scripts/deploy.sh prod build
#   ./scripts/deploy.sh staging all
#   ./scripts/deploy.sh prod rollback
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
NC='\033[0m' # No Color

# Nom du projet
PROJECT_NAME="insightgov-africa"
REGISTRY="${REGISTRY:-ghcr.io}"  # GitHub Container Registry par défaut
IMAGE_NAME="${REGISTRY}/${PROJECT_NAME}"

# Version (basée sur git commit ou paramètre)
VERSION="${APP_VERSION:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Fichiers de configuration Docker
DOCKERFILE="Dockerfile"
COMPOSE_FILE="docker-compose.prod.yml"

# =============================================================================
# FONCTIONS UTILITAIRES
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  dev      - Développement local"
    echo "  staging  - Environnement de test"
    echo "  prod     - Production"
    echo ""
    echo "Actions:"
    echo "  build    - Construire les images Docker"
    echo "  push     - Pousser les images vers le registry"
    echo "  deploy   - Déployer sur l'environnement cible"
    echo "  all      - Build + Push + Deploy"
    echo "  rollback - Revenir à la version précédente"
    echo ""
    echo "Exemples:"
    echo "  $0 prod build    # Construire l'image de production"
    echo "  $0 staging all   # Déploiement complet staging"
    echo "  $0 prod rollback # Annuler le dernier déploiement"
}

check_requirements() {
    log_info "Vérification des prérequis..."

    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi

    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi

    # Vérifier les fichiers nécessaires
    if [ ! -f "$DOCKERFILE" ]; then
        log_error "Dockerfile non trouvé"
        exit 1
    fi

    # Vérifier les variables d'environnement en production
    if [ "$ENV" == "prod" ] && [ ! -f ".env.production" ]; then
        log_warning "Fichier .env.production non trouvé"
        log_info "Assurez-vous que les variables d'environnement sont définies"
    fi

    log_success "Prérequis OK"
}

# =============================================================================
# ACTIONS
# =============================================================================

build_image() {
    log_info "Construction de l'image Docker..."
    log_info "Version: $VERSION"
    log_info "Date: $BUILD_DATE"

    # Build multi-architecture (AMD64 et ARM64)
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg VERSION="$VERSION" \
        --tag "${IMAGE_NAME}:${VERSION}" \
        --tag "${IMAGE_NAME}:latest" \
        --file "$DOCKERFILE" \
        --load \
        .

    if [ $? -eq 0 ]; then
        log_success "Image construite: ${IMAGE_NAME}:${VERSION}"
    else
        log_error "Échec de la construction de l'image"
        exit 1
    fi
}

push_image() {
    log_info "Push de l'image vers le registry..."

    # Vérifier si on est connecté au registry
    if [ "$REGISTRY" == "ghcr.io" ]; then
        if [ -z "$GITHUB_TOKEN" ]; then
            log_warning "GITHUB_TOKEN non défini, tentative de connexion..."
        fi
    fi

    # Pousser l'image
    docker push "${IMAGE_NAME}:${VERSION}"
    docker push "${IMAGE_NAME}:latest"

    log_success "Image poussée: ${IMAGE_NAME}:${VERSION}"
}

deploy_dev() {
    log_info "Déploiement en développement..."

    docker-compose up -d --build

    log_success "Application démarrée en développement"
    log_info "URL: http://localhost:3000"
}

deploy_staging() {
    log_info "Déploiement en staging..."

    export APP_VERSION=$VERSION
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml \
        -p insightgov-staging up -d

    log_success "Application déployée en staging"
}

deploy_prod() {
    log_info "Déploiement en production..."

    # Vérifier que l'image existe
    if ! docker image inspect "${IMAGE_NAME}:${VERSION}" &> /dev/null; then
        log_error "L'image ${IMAGE_NAME}:${VERSION} n'existe pas. Lancez 'build' d'abord."
        exit 1
    fi

    # Déploiement avec docker-compose
    export APP_VERSION=$VERSION
    docker-compose -f "$COMPOSE_FILE" -p insightgov-prod up -d

    # Attendre que l'application soit prête
    log_info "Attente du démarrage de l'application..."
    sleep 10

    # Health check
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            log_success "Application en ligne!"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "L'application n'a pas démarré dans les temps"
            exit 1
        fi
        sleep 2
    done

    log_success "Déploiement production terminé"
}

rollback() {
    log_warning "Rollback vers la version précédente..."

    # Obtenir la version précédente
    PREVIOUS_VERSION=$(docker images "${IMAGE_NAME}" --format "{{.Tag}}" | grep -v latest | head -2 | tail -1)

    if [ -z "$PREVIOUS_VERSION" ]; then
        log_error "Aucune version précédente trouvée"
        exit 1
    fi

    log_info "Rollback vers: $PREVIOUS_VERSION"

    export APP_VERSION=$PREVIOUS_VERSION
    docker-compose -f "$COMPOSE_FILE" -p insightgov-prod up -d

    log_success "Rollback terminé vers $PREVIOUS_VERSION"
}

run_migrations() {
    log_info "Exécution des migrations de base de données..."

    docker-compose -f "$COMPOSE_FILE" exec app npx prisma migrate deploy

    log_success "Migrations exécutées"
}

# =============================================================================
# MAIN
# =============================================================================

# Vérifier les arguments
if [ $# -lt 2 ]; then
    show_usage
    exit 1
fi

ENV=$1
ACTION=$2

# Valider l'environnement
case $ENV in
    dev|development)
        ENV="dev"
        ;;
    staging|stage)
        ENV="staging"
        ;;
    prod|production)
        ENV="prod"
        ;;
    *)
        log_error "Environnement invalide: $ENV"
        show_usage
        exit 1
        ;;
esac

# Valider l'action
case $ACTION in
    build)
        check_requirements
        build_image
        ;;
    push)
        push_image
        ;;
    deploy)
        case $ENV in
            dev)
                deploy_dev
                ;;
            staging)
                deploy_staging
                ;;
            prod)
                deploy_prod
                ;;
        esac
        ;;
    all)
        check_requirements
        build_image
        push_image
        case $ENV in
            dev)
                deploy_dev
                ;;
            staging)
                deploy_staging
                ;;
            prod)
                deploy_prod
                ;;
        esac
        ;;
    rollback)
        rollback
        ;;
    migrate)
        run_migrations
        ;;
    *)
        log_error "Action invalide: $ACTION"
        show_usage
        exit 1
        ;;
esac

log_success "Opération terminée avec succès!"
