#!/bin/bash

# ===========================================
# Plan de Reprise d'Activité IMENA-GEST
# Restoration automatisée et tests DR
# ===========================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_BASE_DIR="${BACKUP_DIR:-/opt/imena-gest/backups}"
RESTORE_DIR="${RESTORE_DIR:-/opt/imena-gest/restore}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
DR_MODE="${1:-restore}"  # restore, test, validate

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables pour le suivi
RECOVERY_LOG="$RESTORE_DIR/recovery_$(date +%Y%m%d_%H%M%S).log"
RECOVERY_START_TIME=$(date +%s)

# Fonction de logging
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        ERROR)   echo -e "${RED}[$timestamp] ERROR: $message${NC}" | tee -a "$RECOVERY_LOG" ;;
        WARN)    echo -e "${YELLOW}[$timestamp] WARN: $message${NC}" | tee -a "$RECOVERY_LOG" ;;
        INFO)    echo -e "${GREEN}[$timestamp] INFO: $message${NC}" | tee -a "$RECOVERY_LOG" ;;
        DEBUG)   echo -e "${BLUE}[$timestamp] DEBUG: $message${NC}" | tee -a "$RECOVERY_LOG" ;;
    esac
}

# Affichage de l'aide
show_help() {
    cat << EOF
🏥 IMENA-GEST - Plan de Reprise d'Activité

Usage: $0 [MODE] [OPTIONS]

MODES:
  restore           Restoration complète depuis sauvegarde
  test              Test de restoration (sans impact production)
  validate          Validation d'une sauvegarde
  list              Liste des sauvegardes disponibles

OPTIONS RESTORE:
  --backup-date     Date de la sauvegarde (YYYYMMDD_HHMMSS)
  --backup-path     Chemin vers la sauvegarde
  --target-env      Environnement cible (test|staging|production)
  --dry-run         Simulation sans modification
  --force           Forcer sans confirmation

OPTIONS TEST:
  --parallel        Test en parallèle (conteneurs temporaires)
  --quick           Test rapide (validations essentielles)

EXEMPLES:
  $0 restore --backup-date 20241215_143000
  $0 test --parallel --backup-date 20241215_143000
  $0 validate --backup-path /backups/20241215_143000
  $0 list

VARIABLES D'ENVIRONNEMENT:
  BACKUP_DIR                Répertoire des sauvegardes
  BACKUP_ENCRYPTION_KEY     Clé de déchiffrement
  RESTORE_DIR              Répertoire de restoration
  DR_NOTIFICATION_WEBHOOK   Webhook pour notifications
EOF
}

# Fonction de validation des prérequis
check_prerequisites() {
    log INFO "Vérification des prérequis DR..."
    
    # Vérifier les outils
    local tools=("docker" "docker-compose" "pg_restore" "tar" "gzip")
    if [[ -n "$ENCRYPTION_KEY" ]]; then
        tools+=("openssl")
    fi
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log ERROR "Outil manquant: $tool"
            exit 1
        fi
    done
    
    # Créer les répertoires nécessaires
    mkdir -p "$RESTORE_DIR"
    chmod 700 "$RESTORE_DIR"
    
    log INFO "Prérequis DR OK"
}

# Liste des sauvegardes disponibles
list_backups() {
    log INFO "Sauvegardes disponibles:"
    log INFO "========================"
    
    if [[ ! -d "$BACKUP_BASE_DIR" ]]; then
        log ERROR "Répertoire de sauvegarde non trouvé: $BACKUP_BASE_DIR"
        exit 1
    fi
    
    local backup_count=0
    find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "20*" | sort -r | while read -r backup_dir; do
        local backup_name=$(basename "$backup_dir")
        local manifest_file="$backup_dir/backup_manifest.json"
        
        if [[ -f "$manifest_file" ]]; then
            local size=$(jq -r '.total_size' "$manifest_file" 2>/dev/null | numfmt --to=iec 2>/dev/null || echo "N/A")
            local app_version=$(jq -r '.application.version' "$manifest_file" 2>/dev/null || echo "N/A")
            local encrypted=$(jq -r '.backup_info.encrypted' "$manifest_file" 2>/dev/null || echo "N/A")
            
            printf "  📁 %-20s | 📊 %-10s | 🏥 %-8s | 🔒 %s\n" \
                "$backup_name" "$size" "$app_version" "$encrypted"
        else
            printf "  📁 %-20s | ❌ Manifest manquant\n" "$backup_name"
        fi
        
        ((backup_count++))
    done
    
    if [[ $backup_count -eq 0 ]]; then
        log WARN "Aucune sauvegarde trouvée"
    else
        log INFO "Total: $backup_count sauvegarde(s)"
    fi
}

# Validation d'une sauvegarde
validate_backup() {
    local backup_path=$1
    log INFO "Validation de la sauvegarde: $backup_path"
    
    if [[ ! -d "$backup_path" ]]; then
        log ERROR "Sauvegarde non trouvée: $backup_path"
        return 1
    fi
    
    local manifest_file="$backup_path/backup_manifest.json"
    if [[ ! -f "$manifest_file" ]]; then
        log ERROR "Manifest manquant: $manifest_file"
        return 1
    fi
    
    log INFO "Validation du manifest..."
    if ! jq . "$manifest_file" > /dev/null 2>&1; then
        log ERROR "Manifest JSON invalide"
        return 1
    fi
    
    # Vérifier l'intégrité des fichiers
    log INFO "Vérification de l'intégrité des fichiers..."
    local files_valid=true
    
    jq -r '.files[] | "\(.name) \(.sha256)"' "$manifest_file" | while read -r filename expected_hash; do
        local file_path="$backup_path/$filename"
        
        if [[ -f "$file_path" ]]; then
            local actual_hash=$(sha256sum "$file_path" | cut -d' ' -f1)
            
            if [[ "$actual_hash" == "$expected_hash" ]]; then
                log DEBUG "✅ $filename: OK"
            else
                log ERROR "❌ $filename: Checksum invalide"
                files_valid=false
            fi
        else
            log ERROR "❌ $filename: Fichier manquant"
            files_valid=false
        fi
    done
    
    if [[ "$files_valid" == true ]]; then
        log INFO "✅ Validation réussie"
        return 0
    else
        log ERROR "❌ Validation échouée"
        return 1
    fi
}

# Déchiffrement des sauvegardes
decrypt_backup() {
    local backup_path=$1
    local decrypted_path="$RESTORE_DIR/decrypted_$(basename "$backup_path")"
    
    if [[ -z "$ENCRYPTION_KEY" ]]; then
        log INFO "Pas de chiffrement, copie directe"
        cp -r "$backup_path" "$decrypted_path"
        echo "$decrypted_path"
        return 0
    fi
    
    log INFO "Déchiffrement de la sauvegarde..."
    mkdir -p "$decrypted_path"
    
    # Déchiffrer chaque fichier .enc
    for encrypted_file in "$backup_path"/*.enc; do
        if [[ -f "$encrypted_file" ]]; then
            local filename=$(basename "$encrypted_file" .enc)
            local decrypted_file="$decrypted_path/$filename"
            
            if openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
                -in "$encrypted_file" -out "$decrypted_file" -k "$ENCRYPTION_KEY" 2>> "$RECOVERY_LOG"; then
                log DEBUG "Déchiffré: $filename"
            else
                log ERROR "Échec déchiffrement: $filename"
                return 1
            fi
        fi
    done
    
    # Copier les fichiers non chiffrés
    for file in "$backup_path"/*; do
        if [[ -f "$file" && ! "$file" =~ \.enc$ ]]; then
            cp "$file" "$decrypted_path/"
        fi
    done
    
    log INFO "Déchiffrement terminé: $decrypted_path"
    echo "$decrypted_path"
}

# Restoration de la base de données
restore_database() {
    local backup_path=$1
    local target_env=${2:-test}
    
    log INFO "Restoration de la base de données..."
    
    local db_file="$backup_path/database.sql"
    if [[ ! -f "$db_file" ]]; then
        log ERROR "Fichier de base de données non trouvé: $db_file"
        return 1
    fi
    
    # Configuration selon l'environnement cible
    local db_container="imena-postgresql-$target_env"
    local db_name="imena_gest_$target_env"
    local db_user="imena_user_$target_env"
    
    if [[ "$target_env" == "production" ]]; then
        db_container="imena-postgresql"
        db_name="${POSTGRES_DB:-imena_gest}"
        db_user="${POSTGRES_USER:-imena_user}"
        
        # Confirmation obligatoire pour la production
        read -p "⚠️  ATTENTION: Restoration en PRODUCTION. Confirmer (oui/non): " -r
        if [[ ! $REPLY =~ ^oui$ ]]; then
            log INFO "Restoration annulée par l'utilisateur"
            exit 0
        fi
    fi
    
    log INFO "Cible: $db_container ($db_name)"
    
    # Vérifier que le conteneur de base de données est prêt
    if ! docker ps | grep -q "$db_container"; then
        log ERROR "Conteneur de base de données non trouvé: $db_container"
        return 1
    fi
    
    # Créer une sauvegarde de sécurité avant restoration
    if [[ "$target_env" == "production" ]]; then
        log INFO "Sauvegarde de sécurité avant restoration..."
        local safety_backup="$RESTORE_DIR/safety_backup_$(date +%Y%m%d_%H%M%S).sql"
        docker exec "$db_container" pg_dump -U "$db_user" -d "$db_name" \
            --format=custom --compress=9 > "$safety_backup"
        log INFO "Sauvegarde de sécurité: $safety_backup"
    fi
    
    # Terminer les connexions actives
    log INFO "Fermeture des connexions actives..."
    docker exec "$db_container" psql -U "$db_user" -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$db_name' AND pid <> pg_backend_pid();" \
        2>> "$RECOVERY_LOG" || true
    
    # Supprimer et recréer la base de données
    log INFO "Recréation de la base de données..."
    docker exec "$db_container" psql -U "$db_user" -d postgres -c "DROP DATABASE IF EXISTS $db_name;" 2>> "$RECOVERY_LOG"
    docker exec "$db_container" psql -U "$db_user" -d postgres -c "CREATE DATABASE $db_name;" 2>> "$RECOVERY_LOG"
    
    # Restoration depuis le dump
    log INFO "Restoration des données..."
    if docker exec -i "$db_container" pg_restore -U "$db_user" -d "$db_name" \
        --verbose --clean --if-exists --no-owner --no-privileges < "$db_file" 2>> "$RECOVERY_LOG"; then
        log INFO "✅ Base de données restaurée"
    else
        log ERROR "❌ Échec restoration base de données"
        return 1
    fi
    
    # Vérification post-restoration
    local table_count=$(docker exec "$db_container" psql -U "$db_user" -d "$db_name" -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    
    log INFO "Tables restaurées: $table_count"
    
    if [[ $table_count -gt 0 ]]; then
        log INFO "✅ Vérification base de données OK"
    else
        log ERROR "❌ Aucune table trouvée après restoration"
        return 1
    fi
}

# Restoration des données Redis
restore_redis() {
    local backup_path=$1
    local target_env=${2:-test}
    
    log INFO "Restoration des données Redis..."
    
    local redis_file="$backup_path/redis_dump.rdb"
    if [[ ! -f "$redis_file" ]]; then
        log WARN "Pas de données Redis à restaurer"
        return 0
    fi
    
    local redis_container="imena-redis-$target_env"
    if [[ "$target_env" == "production" ]]; then
        redis_container="imena-redis"
    fi
    
    if docker ps | grep -q "$redis_container"; then
        # Arrêter Redis pour la restoration
        docker exec "$redis_container" redis-cli SHUTDOWN NOSAVE 2>/dev/null || true
        sleep 2
        
        # Copier le fichier RDB
        docker cp "$redis_file" "$redis_container:/data/dump.rdb"
        
        # Redémarrer Redis
        docker restart "$redis_container"
        sleep 5
        
        # Vérifier la restoration
        if docker exec "$redis_container" redis-cli ping > /dev/null 2>&1; then
            log INFO "✅ Redis restauré"
        else
            log ERROR "❌ Échec restoration Redis"
            return 1
        fi
    else
        log WARN "Conteneur Redis non trouvé: $redis_container"
    fi
}

# Restoration des données applicatives
restore_application_data() {
    local backup_path=$1
    local target_env=${2:-test}
    
    log INFO "Restoration des données applicatives..."
    
    local restore_base="/opt/imena-gest-$target_env"
    if [[ "$target_env" == "production" ]]; then
        restore_base="/opt/imena-gest"
    fi
    
    # Créer les répertoires cibles
    mkdir -p "$restore_base/data"
    mkdir -p "$restore_base/logs"
    mkdir -p "$restore_base/ssl"
    
    # Restaurer chaque archive de données
    for tar_file in "$backup_path"/app_data_*.tar.gz; do
        if [[ -f "$tar_file" ]]; then
            local archive_name=$(basename "$tar_file")
            log DEBUG "Extraction: $archive_name"
            
            # Extraire dans un répertoire temporaire
            local temp_dir="$RESTORE_DIR/temp_$(basename "$tar_file" .tar.gz)"
            mkdir -p "$temp_dir"
            
            if tar -xzf "$tar_file" -C "$temp_dir" 2>> "$RECOVERY_LOG"; then
                # Copier vers la destination finale
                cp -r "$temp_dir"/* "$restore_base/" 2>> "$RECOVERY_LOG" || true
                rm -rf "$temp_dir"
                log DEBUG "✅ $archive_name restauré"
            else
                log ERROR "❌ Échec extraction: $archive_name"
                return 1
            fi
        fi
    done
    
    log INFO "✅ Données applicatives restaurées"
}

# Test de restoration en parallèle
test_restore_parallel() {
    local backup_path=$1
    log INFO "Test de restoration en parallèle..."
    
    # Créer un environnement de test isolé
    local test_env="dr-test-$(date +%s)"
    local test_dir="$RESTORE_DIR/$test_env"
    mkdir -p "$test_dir"
    
    log INFO "Environnement de test: $test_env"
    
    # Démarrer des conteneurs de test
    cat > "$test_dir/docker-compose.test.yml" <<EOF
version: '3.8'
services:
  postgresql-test:
    image: postgres:15-alpine
    container_name: postgresql-$test_env
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    tmpfs:
      - /var/lib/postgresql/data
    
  redis-test:
    image: redis:7-alpine
    container_name: redis-$test_env
    tmpfs:
      - /data
EOF
    
    # Démarrer l'environnement de test
    log INFO "Démarrage de l'environnement de test..."
    docker-compose -f "$test_dir/docker-compose.test.yml" up -d
    
    # Attendre que les services soient prêts
    sleep 30
    
    # Tester la restoration
    local test_success=true
    
    # Test restoration base de données
    if restore_database "$backup_path" "test-$test_env"; then
        log INFO "✅ Test restoration base de données OK"
    else
        log ERROR "❌ Test restoration base de données échoué"
        test_success=false
    fi
    
    # Test restoration Redis
    if restore_redis "$backup_path" "test-$test_env"; then
        log INFO "✅ Test restoration Redis OK"
    else
        log ERROR "❌ Test restoration Redis échoué"
        test_success=false
    fi
    
    # Nettoyage de l'environnement de test
    log INFO "Nettoyage de l'environnement de test..."
    docker-compose -f "$test_dir/docker-compose.test.yml" down -v
    rm -rf "$test_dir"
    
    if [[ "$test_success" == true ]]; then
        log INFO "✅ Test de restoration réussi"
        return 0
    else
        log ERROR "❌ Test de restoration échoué"
        return 1
    fi
}

# Génération du rapport de recovery
generate_recovery_report() {
    local end_time=$(date +%s)
    local duration=$((end_time - RECOVERY_START_TIME))
    
    log INFO "========================================="
    log INFO "RAPPORT DE RECOVERY"
    log INFO "========================================="
    log INFO "Mode: $DR_MODE"
    log INFO "Durée: ${duration}s ($(printf "%02d:%02d:%02d" $((duration/3600)) $((duration%3600/60)) $((duration%60))))"
    log INFO "Log complet: $RECOVERY_LOG"
    log INFO "========================================="
}

# Fonction principale
main() {
    local backup_date=""
    local backup_path=""
    local target_env="test"
    local dry_run=false
    local force=false
    local parallel=false
    local quick=false
    
    # Parse des arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup-date)
                backup_date="$2"
                shift 2
                ;;
            --backup-path)
                backup_path="$2"
                shift 2
                ;;
            --target-env)
                target_env="$2"
                shift 2
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            --parallel)
                parallel=true
                shift
                ;;
            --quick)
                quick=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log ERROR "Option inconnue: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Initialisation
    mkdir -p "$RESTORE_DIR"
    check_prerequisites
    
    log INFO "========================================="
    log INFO "PLAN DE REPRISE D'ACTIVITÉ IMENA-GEST"
    log INFO "Mode: $DR_MODE"
    log INFO "========================================="
    
    case $DR_MODE in
        "list")
            list_backups
            ;;
            
        "validate")
            if [[ -n "$backup_path" ]]; then
                validate_backup "$backup_path"
            elif [[ -n "$backup_date" ]]; then
                validate_backup "$BACKUP_BASE_DIR/$backup_date"
            else
                log ERROR "Spécifier --backup-date ou --backup-path"
                exit 1
            fi
            ;;
            
        "test")
            if [[ -z "$backup_date" && -z "$backup_path" ]]; then
                log ERROR "Spécifier --backup-date ou --backup-path"
                exit 1
            fi
            
            local test_backup_path="$backup_path"
            if [[ -z "$test_backup_path" ]]; then
                test_backup_path="$BACKUP_BASE_DIR/$backup_date"
            fi
            
            validate_backup "$test_backup_path"
            
            if [[ "$parallel" == true ]]; then
                test_restore_parallel "$test_backup_path"
            else
                log INFO "Test de restoration en mode standard non implémenté"
                exit 1
            fi
            ;;
            
        "restore")
            if [[ -z "$backup_date" && -z "$backup_path" ]]; then
                log ERROR "Spécifier --backup-date ou --backup-path"
                exit 1
            fi
            
            local restore_backup_path="$backup_path"
            if [[ -z "$restore_backup_path" ]]; then
                restore_backup_path="$BACKUP_BASE_DIR/$backup_date"
            fi
            
            # Validation de la sauvegarde
            validate_backup "$restore_backup_path"
            
            # Déchiffrement si nécessaire
            local decrypted_path=$(decrypt_backup "$restore_backup_path")
            
            if [[ "$dry_run" == true ]]; then
                log INFO "Mode dry-run: simulation de restoration"
                log INFO "Sauvegarde: $restore_backup_path"
                log INFO "Environnement cible: $target_env"
            else
                # Confirmation pour la production
                if [[ "$target_env" == "production" && "$force" != true ]]; then
                    read -p "⚠️  ATTENTION: Restoration en PRODUCTION. Confirmer (oui/non): " -r
                    if [[ ! $REPLY =~ ^oui$ ]]; then
                        log INFO "Restoration annulée par l'utilisateur"
                        exit 0
                    fi
                fi
                
                # Exécution de la restoration
                restore_database "$decrypted_path" "$target_env"
                restore_redis "$decrypted_path" "$target_env"
                restore_application_data "$decrypted_path" "$target_env"
                
                log INFO "✅ Restoration complète terminée"
            fi
            ;;
            
        *)
            log ERROR "Mode invalide: $DR_MODE"
            show_help
            exit 1
            ;;
    esac
    
    generate_recovery_report
}

# Point d'entrée
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
