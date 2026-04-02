#!/bin/bash
# =============================================================================
# InsightGov Africa - Script de Backup Database
# =============================================================================
# Usage:
#   ./scripts/backup.sh [options]
#
# Options:
#   --full         Backup complet de la base de données
#   --incremental  Backup incrémental (seulement les changements)
#   --upload       Upload vers S3 après le backup local
#   --restore FILE Restaurer depuis un fichier de backup
#   --list         Lister les backups disponibles
#   --cleanup      Nettoyer les vieux backups
#   --help         Afficher l'aide
#
# Configuration via variables d'environnement:
#   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
#   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET
#   BACKUP_RETENTION_DAYS (défaut: 30)
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

# Configuration de la base de données
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-insightgov}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-insightgov}"

# Configuration S3
AWS_REGION="${AWS_REGION:-eu-west-3}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-backups/postgres}"

# Configuration des backups
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/insightgov_${BACKUP_DATE}.sql.gz"

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

show_help() {
    echo "InsightGov Africa - Script de Backup Database"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --full         Backup complet de la base de données"
    echo "  --incremental  Backup incrémental (WAL archiving)"
    echo "  --upload       Upload vers S3 après le backup local"
    echo "  --restore FILE Restaurer depuis un fichier de backup"
    echo "  --list         Lister les backups disponibles"
    echo "  --cleanup      Nettoyer les vieux backups"
    echo "  --schedule     Configurer les backups automatiques (cron)"
    echo "  --help         Afficher cette aide"
    echo ""
    echo "Configuration via variables d'environnement:"
    echo "  DB_HOST          Hôte PostgreSQL (défaut: localhost)"
    echo "  DB_PORT          Port PostgreSQL (défaut: 5432)"
    echo "  DB_USER          Utilisateur PostgreSQL"
    echo "  DB_PASSWORD      Mot de passe PostgreSQL"
    echo "  DB_NAME          Nom de la base de données"
    echo "  S3_BUCKET        Bucket S3 pour les backups"
    echo "  BACKUP_RETENTION_DAYS  Jours de rétention (défaut: 30)"
    echo ""
    echo "Exemples:"
    echo "  $0 --full                    # Backup complet local"
    echo "  $0 --full --upload           # Backup et upload S3"
    echo "  $0 --restore backup.sql.gz   # Restaurer un backup"
    echo "  $0 --list                    # Lister les backups"
}

check_requirements() {
    # Vérifier pg_dump
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump n'est pas installé"
        exit 1
    fi

    # Vérifier que le répertoire de backup existe
    mkdir -p "$BACKUP_DIR"
}

check_s3() {
    if [ -z "$S3_BUCKET" ]; then
        log_warning "S3_BUCKET non configuré, upload désactivé"
        return 1
    fi

    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        log_warning "Identifiants AWS non configurés"
        return 1
    fi

    # Vérifier aws-cli
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI n'est pas installé"
        return 1
    fi

    return 0
}

# =============================================================================
# ACTIONS
# =============================================================================

backup_full() {
    log_info "Démarrage du backup complet..."
    log_info "Base de données: $DB_NAME"
    log_info "Hôte: $DB_HOST:$DB_PORT"

    # Créer le répertoire de backup
    mkdir -p "$BACKUP_DIR"

    # Variables d'environnement pour pg_dump
    export PGPASSWORD="$DB_PASSWORD"

    # Backup avec pg_dump
    # --format=custom : format de backup PostgreSQL (compressé)
    # --verbose : afficher la progression
    # --no-owner : ne pas inclure les infos de propriétaire
    # --no-acl : ne pas inclure les ACLs
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=plain \
        --no-owner \
        --no-acl \
        --verbose \
        | gzip > "$BACKUP_FILE"

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_success "Backup créé: $BACKUP_FILE ($SIZE)"
    else
        log_error "Échec du backup"
        rm -f "$BACKUP_FILE"
        exit 1
    fi

    # Nettoyer le mot de passe de l'environnement
    unset PGPASSWORD
}

backup_incremental() {
    log_info "Configuration du backup incrémental (WAL archiving)..."

    # Le backup incrémental nécessite une configuration PostgreSQL
    # Cette fonction configure l'archivage WAL

    log_warning "Le backup incrémental nécessite une configuration PostgreSQL"
    log_info "Pour activer l'archivage WAL, ajoutez à postgresql.conf:"
    echo ""
    echo "  wal_level = replica"
    echo "  archive_mode = on"
    echo "  archive_command = 'cp %p $BACKUP_DIR/wal/%f'"
    echo ""
    log_info "Puis redémarrez PostgreSQL"
}

upload_to_s3() {
    if ! check_s3; then
        return
    fi

    log_info "Upload vers S3..."
    log_info "Bucket: $S3_BUCKET"
    log_info "Fichier: $BACKUP_FILE"

    # Upload vers S3
    local S3_PATH="s3://${S3_BUCKET}/${S3_PREFIX}/$(basename $BACKUP_FILE)"

    aws s3 cp "$BACKUP_FILE" "$S3_PATH" \
        --region "$AWS_REGION" \
        --storage-class STANDARD_IA

    if [ $? -eq 0 ]; then
        log_success "Backup uploadé: $S3_PATH"

        # Créer un fichier de métadonnées
        echo "$(date -Iseconds),$DB_NAME,$(basename $BACKUP_FILE)" >> "$BACKUP_DIR/backup_log.csv"
    else
        log_error "Échec de l'upload S3"
    fi
}

restore_backup() {
    local RESTORE_FILE=$1

    if [ -z "$RESTORE_FILE" ]; then
        log_error "Fichier de backup non spécifié"
        exit 1
    fi

    if [ ! -f "$RESTORE_FILE" ]; then
        # Essayer de télécharger depuis S3
        if check_s3; then
            log_info "Téléchargement depuis S3..."
            aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/${RESTORE_FILE}" "$RESTORE_FILE"
        else
            log_error "Fichier non trouvé: $RESTORE_FILE"
            exit 1
        fi
    fi

    log_warning "ATTENTION: Cette opération va écraser la base de données actuelle!"
    read -p "Êtes-vous sûr? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        log_info "Restauration annulée"
        exit 0
    fi

    log_info "Restauration depuis: $RESTORE_FILE"

    # Variables d'environnement pour psql
    export PGPASSWORD="$DB_PASSWORD"

    # Restaurer le backup
    if [[ $RESTORE_FILE == *.gz ]]; then
        gunzip -c "$RESTORE_FILE" | psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            -v ON_ERROR_STOP=1
    else
        psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            -f "$RESTORE_FILE" \
            -v ON_ERROR_STOP=1
    fi

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_success "Restauration terminée avec succès"
    else
        log_error "Échec de la restauration"
        exit 1
    fi

    unset PGPASSWORD
}

list_backups() {
    log_info "Backups locaux disponibles:"
    echo ""

    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || log_info "Aucun backup local"
    else
        log_info "Répertoire de backup non configuré"
    fi

    # Lister aussi les backups S3
    if check_s3; then
        echo ""
        log_info "Backups S3 disponibles:"
        aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" --region "$AWS_REGION" || true
    fi
}

cleanup_old_backups() {
    log_info "Nettoyage des backups de plus de $BACKUP_RETENTION_DAYS jours..."

    # Nettoyer les backups locaux
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$BACKUP_RETENTION_DAYS -exec rm -f {} \; 2>/dev/null || true

    # Nettoyer les backups S3
    if check_s3; then
        log_info "Nettoyage S3..."
        aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" --region "$AWS_REGION" | \
        while read -r line; do
            FILE_DATE=$(echo "$line" | awk '{print $1}')
            FILE_NAME=$(echo "$line" | awk '{print $4}')

            # Convertir la date et vérifier l'âge
            FILE_TIMESTAMP=$(date -d "$FILE_DATE" +%s 2>/dev/null || echo "0")
            CURRENT_TIMESTAMP=$(date +%s)
            AGE_DAYS=$(( ($CURRENT_TIMESTAMP - $FILE_TIMESTAMP) / 86400 ))

            if [ $AGE_DAYS -gt $BACKUP_RETENTION_DAYS ]; then
                log_info "Suppression S3: $FILE_NAME"
                aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${FILE_NAME}"
            fi
        done
    fi

    log_success "Nettoyage terminé"
}

schedule_backups() {
    log_info "Configuration des backups automatiques..."

    # Créer une entrée cron
    CRON_JOB="0 2 * * * $(pwd)/$0 --full --upload >> $(pwd)/backup.log 2>&1"

    # Vérifier si le cron existe déjà
    if crontab -l 2>/dev/null | grep -q "backup.sh"; then
        log_warning "Un cron de backup existe déjà"
        crontab -l
    else
        # Ajouter le cron
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        log_success "Cron ajouté: backup quotidien à 2h00"
        crontab -l
    fi
}

# =============================================================================
# MAIN
# =============================================================================

# Parser les arguments
ACTION=""

while [ $# -gt 0 ]; do
    case $1 in
        --full)
            ACTION="full"
            shift
            ;;
        --incremental)
            ACTION="incremental"
            shift
            ;;
        --upload)
            UPLOAD=true
            shift
            ;;
        --restore)
            ACTION="restore"
            RESTORE_FILE=$2
            shift 2
            ;;
        --list)
            ACTION="list"
            shift
            ;;
        --cleanup)
            ACTION="cleanup"
            shift
            ;;
        --schedule)
            ACTION="schedule"
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Exécuter l'action
case $ACTION in
    full)
        check_requirements
        backup_full
        if [ "$UPLOAD" = true ]; then
            upload_to_s3
        fi
        ;;
    incremental)
        backup_incremental
        ;;
    restore)
        check_requirements
        restore_backup "$RESTORE_FILE"
        ;;
    list)
        list_backups
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    schedule)
        schedule_backups
        ;;
    "")
        show_help
        ;;
esac

log_success "Opération terminée"
