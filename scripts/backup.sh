#!/bin/bash

# ===========================================
# Script de Sauvegarde Automatisé IMENA-GEST
# Sauvegarde complète avec chiffrement et versioning
# ===========================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_BASE_DIR="${BACKUP_DIR:-/opt/imena-gest/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
S3_BUCKET="${S3_BACKUP_BUCKET:-}"
NOTIFICATION_WEBHOOK="${BACKUP_NOTIFICATION_WEBHOOK:-}"

# Variables dynamiques
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$TIMESTAMP"
LOG_FILE="$BACKUP_BASE_DIR/backup_$TIMESTAMP.log"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonction de logging
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        ERROR)   echo -e "${RED}[$timestamp] ERROR: $message${NC}" | tee -a "$LOG_FILE" ;;
        WARN)    echo -e "${YELLOW}[$timestamp] WARN: $message${NC}" | tee -a "$LOG_FILE" ;;
        INFO)    echo -e "${GREEN}[$timestamp] INFO: $message${NC}" | tee -a "$LOG_FILE" ;;
        DEBUG)   echo -e "${BLUE}[$timestamp] DEBUG: $message${NC}" | tee -a "$LOG_FILE" ;;
    esac
}

# Fonction de notification
notify() {
    local status=$1
    local message=$2
    
    if [[ -n "$NOTIFICATION_WEBHOOK" ]]; then
        curl -X POST -H 'Content-Type: application/json' \
            -d "{\"text\":\"🏥 IMENA-GEST Backup [$status]: $message\"}" \
            "$NOTIFICATION_WEBHOOK" 2>/dev/null || true
    fi
}

# Fonction de nettoyage en cas d'erreur
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log ERROR "Échec de la sauvegarde (code: $exit_code)"
        notify "FAILED" "Sauvegarde échouée - Vérifier les logs"
        
        # Nettoyage des fichiers partiels
        if [[ -d "$BACKUP_DIR" ]]; then
            rm -rf "$BACKUP_DIR"
            log INFO "Nettoyage des fichiers partiels"
        fi
    fi
    exit $exit_code
}

trap cleanup EXIT

# Vérification des prérequis
check_prerequisites() {
    log INFO "Vérification des prérequis..."
    
    # Vérifier les outils nécessaires
    local tools=("docker" "pg_dump" "tar" "gzip")
    if [[ -n "$ENCRYPTION_KEY" ]]; then
        tools+=("openssl")
    fi
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log ERROR "Outil manquant: $tool"
            exit 1
        fi
    done
    
    # Vérifier l'espace disque (minimum 5GB)
    local available_space=$(df "$BACKUP_BASE_DIR" | tail -1 | awk '{print $4}')
    local min_space=$((5 * 1024 * 1024)) # 5GB en KB
    
    if [[ $available_space -lt $min_space ]]; then
        log ERROR "Espace disque insuffisant: $(($available_space / 1024 / 1024))GB disponibles, 5GB requis"
        exit 1
    fi
    
    # Créer le répertoire de sauvegarde
    mkdir -p "$BACKUP_DIR"
    chmod 700 "$BACKUP_DIR"
    
    log INFO "Prérequis OK - Espace disponible: $(($available_space / 1024 / 1024))GB"
}

# Sauvegarde de la base de données PostgreSQL
backup_database() {
    log INFO "Sauvegarde de la base de données PostgreSQL..."
    
    local db_container="imena-postgresql"
    local db_name="${POSTGRES_DB:-imena_gest}"
    local db_user="${POSTGRES_USER:-imena_user}"
    
    # Vérifier que le conteneur est en cours d'exécution
    if ! docker ps | grep -q "$db_container"; then
        log ERROR "Conteneur PostgreSQL non trouvé ou arrêté: $db_container"
        return 1
    fi
    
    # Sauvegarde avec pg_dump
    local dump_file="$BACKUP_DIR/database.sql"
    
    if docker exec "$db_container" pg_dump -U "$db_user" -d "$db_name" \
        --verbose --no-password --format=custom --compress=9 \
        --file="/tmp/database_backup.dump" 2>> "$LOG_FILE"; then
        
        # Copier le dump depuis le conteneur
        docker cp "$db_container:/tmp/database_backup.dump" "$dump_file"
        docker exec "$db_container" rm -f "/tmp/database_backup.dump"
        
        # Vérifier l'intégrité du dump
        if file "$dump_file" | grep -q "PostgreSQL custom database dump"; then
            log INFO "Sauvegarde base de données OK: $(du -h "$dump_file" | cut -f1)"
        else
            log ERROR "Fichier de sauvegarde invalide"
            return 1
        fi
    else
        log ERROR "Échec de la sauvegarde PostgreSQL"
        return 1
    fi
    
    # Sauvegarde additionnelle des schémas
    local schema_file="$BACKUP_DIR/database_schema.sql"
    docker exec "$db_container" pg_dump -U "$db_user" -d "$db_name" \
        --schema-only --no-password > "$schema_file" 2>> "$LOG_FILE"
    
    log INFO "Schéma de base de données sauvegardé: $(du -h "$schema_file" | cut -f1)"
}

# Sauvegarde des données Redis
backup_redis() {
    log INFO "Sauvegarde des données Redis..."
    
    local redis_container="imena-redis"
    
    if docker ps | grep -q "$redis_container"; then
        # Forcer la sauvegarde Redis
        docker exec "$redis_container" redis-cli BGSAVE
        sleep 5
        
        # Attendre la fin de la sauvegarde
        while docker exec "$redis_container" redis-cli LASTSAVE | \
              docker exec "$redis_container" redis-cli GET last_save_time | grep -q "$(docker exec "$redis_container" redis-cli LASTSAVE)"; do
            sleep 1
        done
        
        # Copier le fichier RDB
        local redis_file="$BACKUP_DIR/redis_dump.rdb"
        docker cp "$redis_container:/data/dump.rdb" "$redis_file" 2>/dev/null || true
        
        if [[ -f "$redis_file" ]]; then
            log INFO "Sauvegarde Redis OK: $(du -h "$redis_file" | cut -f1)"
        else
            log WARN "Aucune donnée Redis à sauvegarder"
        fi
    else
        log WARN "Conteneur Redis non trouvé, skip"
    fi
}

# Sauvegarde des fichiers de l'application
backup_application_data() {
    log INFO "Sauvegarde des données applicatives..."
    
    local app_data_sources=(
        "/opt/imena-gest/data/app:/app/data"
        "/opt/imena-gest/data/uploads:/app/uploads"
        "/opt/imena-gest/ssl:/app/ssl"
        "/opt/imena-gest/logs:/app/logs"
    )
    
    for source_dest in "${app_data_sources[@]}"; do
        local source="${source_dest%:*}"
        local dest_name="${source_dest#*:}"
        local dest_name="${dest_name//\//_}"
        
        if [[ -d "$source" ]]; then
            local tar_file="$BACKUP_DIR/app_data_${dest_name}.tar.gz"
            
            if tar -czf "$tar_file" -C "$(dirname "$source")" "$(basename "$source")" 2>> "$LOG_FILE"; then
                log INFO "Sauvegarde $dest_name OK: $(du -h "$tar_file" | cut -f1)"
            else
                log ERROR "Échec sauvegarde $dest_name"
                return 1
            fi
        else
            log WARN "Répertoire non trouvé: $source"
        fi
    done
}

# Sauvegarde de la configuration
backup_configuration() {
    log INFO "Sauvegarde de la configuration..."
    
    local config_file="$BACKUP_DIR/configuration.tar.gz"
    local config_sources=(
        "docker-compose.production.yml"
        "nginx/nginx.production.conf"
        "nginx/conf.d"
        ".env.production"
        "monitoring"
        "scripts"
    )
    
    # Créer une archive de configuration
    if tar -czf "$config_file" -C "$SCRIPT_DIR/.." "${config_sources[@]}" 2>> "$LOG_FILE"; then
        log INFO "Configuration sauvegardée: $(du -h "$config_file" | cut -f1)"
    else
        log ERROR "Échec sauvegarde configuration"
        return 1
    fi
}

# Chiffrement des sauvegardes
encrypt_backup() {
    if [[ -z "$ENCRYPTION_KEY" ]]; then
        log INFO "Pas de clé de chiffrement, sauvegarde non chiffrée"
        return 0
    fi
    
    log INFO "Chiffrement des sauvegardes..."
    
    # Chiffrer chaque fichier de sauvegarde
    for file in "$BACKUP_DIR"/*; do
        if [[ -f "$file" && ! "$file" =~ \.enc$ ]]; then
            local encrypted_file="${file}.enc"
            
            if openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
                -in "$file" -out "$encrypted_file" -k "$ENCRYPTION_KEY" 2>> "$LOG_FILE"; then
                
                # Supprimer le fichier non chiffré
                rm "$file"
                log DEBUG "Fichier chiffré: $(basename "$encrypted_file")"
            else
                log ERROR "Échec chiffrement: $(basename "$file")"
                return 1
            fi
        fi
    done
    
    log INFO "Chiffrement terminé"
}

# Création d'un manifest de sauvegarde
create_manifest() {
    log INFO "Création du manifest de sauvegarde..."
    
    local manifest_file="$BACKUP_DIR/backup_manifest.json"
    
    # Collecter les informations sur les fichiers
    local files_info="["
    local first=true
    
    for file in "$BACKUP_DIR"/*; do
        if [[ -f "$file" && "$(basename "$file")" != "backup_manifest.json" ]]; then
            if [[ "$first" == true ]]; then
                first=false
            else
                files_info+=","
            fi
            
            local filename=$(basename "$file")
            local size=$(stat -c%s "$file")
            local checksum=$(sha256sum "$file" | cut -d' ' -f1)
            
            files_info+="{\"name\":\"$filename\",\"size\":$size,\"sha256\":\"$checksum\"}"
        fi
    done
    files_info+="]"
    
    # Créer le manifest JSON
    cat > "$manifest_file" <<EOF
{
    "backup_info": {
        "timestamp": "$TIMESTAMP",
        "version": "1.0",
        "hostname": "$(hostname)",
        "backup_type": "full",
        "encrypted": $([ -n "$ENCRYPTION_KEY" ] && echo "true" || echo "false")
    },
    "database": {
        "engine": "postgresql",
        "version": "$(docker exec imena-postgresql psql --version | grep -oP '\\d+\\.\\d+' | head -1)",
        "name": "${POSTGRES_DB:-imena_gest}"
    },
    "application": {
        "name": "IMENA-GEST",
        "version": "$(cat "$SCRIPT_DIR/../package.json" | grep version | cut -d'"' -f4)"
    },
    "files": $files_info,
    "total_size": $(du -sb "$BACKUP_DIR" | cut -f1),
    "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
}
EOF
    
    log INFO "Manifest créé: $manifest_file"
}

# Upload vers S3 (optionnel)
upload_to_s3() {
    if [[ -z "$S3_BUCKET" ]]; then
        log INFO "Pas de bucket S3 configuré, sauvegarde locale uniquement"
        return 0
    fi
    
    log INFO "Upload vers S3: s3://$S3_BUCKET/..."
    
    # Créer une archive complète
    local archive_name="imena-gest-backup-$TIMESTAMP.tar.gz"
    local archive_path="$BACKUP_BASE_DIR/$archive_name"
    
    if tar -czf "$archive_path" -C "$BACKUP_BASE_DIR" "$(basename "$BACKUP_DIR")" 2>> "$LOG_FILE"; then
        log INFO "Archive créée: $archive_name ($(du -h "$archive_path" | cut -f1))"
        
        # Upload avec AWS CLI (si disponible)
        if command -v aws &> /dev/null; then
            if aws s3 cp "$archive_path" "s3://$S3_BUCKET/backups/" --storage-class STANDARD_IA 2>> "$LOG_FILE"; then
                log INFO "Upload S3 réussi"
                rm "$archive_path"  # Supprimer l'archive locale
            else
                log ERROR "Échec upload S3"
                return 1
            fi
        else
            log WARN "AWS CLI non disponible, upload S3 ignoré"
        fi
    else
        log ERROR "Échec création archive S3"
        return 1
    fi
}

# Nettoyage des anciennes sauvegardes
cleanup_old_backups() {
    log INFO "Nettoyage des sauvegardes anciennes (> $RETENTION_DAYS jours)..."
    
    local deleted_count=0
    
    # Supprimer les répertoires de sauvegarde anciens
    find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "20*" -mtime +$RETENTION_DAYS | while read -r old_backup; do
        if rm -rf "$old_backup" 2>> "$LOG_FILE"; then
            log INFO "Supprimé: $(basename "$old_backup")"
            ((deleted_count++))
        else
            log WARN "Impossible de supprimer: $(basename "$old_backup")"
        fi
    done
    
    # Supprimer les logs anciens
    find "$BACKUP_BASE_DIR" -name "backup_*.log" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    log INFO "Nettoyage terminé ($deleted_count sauvegardes supprimées)"
}

# Génération du rapport de sauvegarde
generate_report() {
    local end_time=$(date +%s)
    local start_time_file="$BACKUP_DIR/.start_time"
    local duration=0
    
    if [[ -f "$start_time_file" ]]; then
        local start_time=$(cat "$start_time_file")
        duration=$((end_time - start_time))
    fi
    
    local total_size=$(du -sb "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0")
    local file_count=$(find "$BACKUP_DIR" -type f | wc -l)
    
    log INFO "========================================="
    log INFO "RAPPORT DE SAUVEGARDE"
    log INFO "========================================="
    log INFO "Timestamp: $TIMESTAMP"
    log INFO "Durée: ${duration}s ($(printf "%02d:%02d:%02d" $((duration/3600)) $((duration%3600/60)) $((duration%60))))"
    log INFO "Taille totale: $(numfmt --to=iec "$total_size")"
    log INFO "Nombre de fichiers: $file_count"
    log INFO "Répertoire: $BACKUP_DIR"
    log INFO "Chiffrement: $([ -n "$ENCRYPTION_KEY" ] && echo "OUI" || echo "NON")"
    log INFO "Upload S3: $([ -n "$S3_BUCKET" ] && echo "OUI" || echo "NON")"
    log INFO "========================================="
    
    # Notification de succès
    notify "SUCCESS" "Sauvegarde terminée - ${duration}s, $(numfmt --to=iec "$total_size"), $file_count fichiers"
}

# Fonction principale
main() {
    log INFO "========================================="
    log INFO "DÉMARRAGE SAUVEGARDE IMENA-GEST"
    log INFO "Timestamp: $TIMESTAMP"
    log INFO "========================================="
    
    # Enregistrer l'heure de début
    echo "$(date +%s)" > "$BACKUP_DIR/.start_time"
    
    # Exécution des étapes de sauvegarde
    check_prerequisites
    backup_database
    backup_redis
    backup_application_data
    backup_configuration
    encrypt_backup
    create_manifest
    upload_to_s3
    cleanup_old_backups
    generate_report
    
    log INFO "✅ Sauvegarde terminée avec succès"
}

# Gestion des signaux
trap 'log ERROR "Sauvegarde interrompue"; exit 130' INT TERM

# Point d'entrée
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
