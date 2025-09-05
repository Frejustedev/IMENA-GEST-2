#!/bin/bash

# ===========================================
# Docker Entrypoint pour IMENA-GEST Production
# Initialisation sécurisée et monitoring
# ===========================================

set -euo pipefail

# Variables d'environnement par défaut
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"
export HOST="${HOST:-0.0.0.0}"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] [ENTRYPOINT]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR]${NC} $1"
}

# Fonction de vérification des variables d'environnement requises
check_required_env() {
    local required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Variables d'environnement manquantes:"
        for var in "${missing_vars[@]}"; do
            log_error "  - $var"
        done
        exit 1
    fi
}

# Vérification de la connectivité base de données
check_database() {
    log "Vérification de la connectivité base de données..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if node -e "
            const { Client } = require('pg');
            const client = new Client('${DATABASE_URL}');
            client.connect()
                .then(() => {
                    console.log('Database connection successful');
                    process.exit(0);
                })
                .catch(err => {
                    console.error('Database connection failed:', err.message);
                    process.exit(1);
                });
        " 2>/dev/null; then
            log_success "Base de données accessible"
            return 0
        fi
        
        log_warning "Tentative $attempt/$max_attempts - Base de données non accessible, nouvelle tentative dans 5s..."
        sleep 5
        ((attempt++))
    done
    
    log_error "Impossible de se connecter à la base de données après $max_attempts tentatives"
    exit 1
}

# Exécution des migrations de base de données
run_migrations() {
    log "Exécution des migrations de base de données..."
    
    cd /app/backend
    
    if npm run migrate 2>/dev/null; then
        log_success "Migrations exécutées avec succès"
    else
        log_error "Échec des migrations de base de données"
        exit 1
    fi
}

# Initialisation des données de base (si nécessaire)
seed_database() {
    if [[ "${SEED_DATABASE:-false}" == "true" ]]; then
        log "Initialisation des données de base..."
        
        cd /app/backend
        
        if npm run seed 2>/dev/null; then
            log_success "Données de base initialisées"
        else
            log_warning "Échec de l'initialisation des données de base (peut être normal)"
        fi
    fi
}

# Vérification de l'espace disque
check_disk_space() {
    log "Vérification de l'espace disque..."
    
    local available_space
    available_space=$(df /app | awk 'NR==2 {print $4}')
    local required_space=1048576 # 1GB en KB
    
    if [[ $available_space -lt $required_space ]]; then
        log_error "Espace disque insuffisant. Disponible: ${available_space}KB, Requis: ${required_space}KB"
        exit 1
    fi
    
    log_success "Espace disque suffisant: ${available_space}KB disponible"
}

# Vérification des permissions
check_permissions() {
    log "Vérification des permissions des fichiers..."
    
    local dirs_to_check=("/app/logs" "/app/uploads" "/app/temp")
    
    for dir in "${dirs_to_check[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log "Dossier créé: $dir"
        fi
        
        if [[ ! -w "$dir" ]]; then
            log_error "Permissions d'écriture manquantes sur: $dir"
            exit 1
        fi
    done
    
    log_success "Permissions vérifiées"
}

# Configuration du monitoring
setup_monitoring() {
    log "Configuration du monitoring..."
    
    # Création du fichier de PID
    echo $$ > /app/logs/application.pid
    
    # Configuration des logs
    export LOG_LEVEL="${LOG_LEVEL:-info}"
    export LOG_FORMAT="${LOG_FORMAT:-json}"
    export LOG_FILE="/app/logs/application.log"
    
    log_success "Monitoring configuré"
}

# Optimisations de performance
optimize_performance() {
    log "Application des optimisations de performance..."
    
    # Configuration Node.js pour production
    export UV_THREADPOOL_SIZE="${UV_THREADPOOL_SIZE:-16}"
    export NODE_OPTIONS="${NODE_OPTIONS:-"--max-old-space-size=2048 --optimize-for-size"}"
    
    # Préchargement des modules critiques
    export NODE_PRESERVE_SYMLINKS=1
    
    log_success "Optimisations appliquées"
}

# Gestion gracieuse de l'arrêt
setup_signal_handlers() {
    log "Configuration des gestionnaires de signaux..."
    
    # Fonction de nettoyage
    cleanup() {
        log "Arrêt gracieux en cours..."
        
        # Arrêt du serveur Node.js
        if [[ -f /app/logs/application.pid ]]; then
            local pid=$(cat /app/logs/application.pid)
            if kill -0 "$pid" 2>/dev/null; then
                log "Arrêt du processus principal (PID: $pid)..."
                kill -TERM "$pid"
                
                # Attendre l'arrêt gracieux
                local timeout=30
                while kill -0 "$pid" 2>/dev/null && [[ $timeout -gt 0 ]]; do
                    sleep 1
                    ((timeout--))
                done
                
                if kill -0 "$pid" 2>/dev/null; then
                    log_warning "Arrêt forcé du processus principal"
                    kill -KILL "$pid"
                fi
            fi
            rm -f /app/logs/application.pid
        fi
        
        log_success "Arrêt terminé"
        exit 0
    }
    
    # Association des signaux
    trap cleanup SIGTERM SIGINT SIGQUIT
    
    log_success "Gestionnaires de signaux configurés"
}

# Vérification de la sécurité
security_check() {
    log "Vérification de la configuration de sécurité..."
    
    # Vérifier que les secrets sont définis
    if [[ ${#JWT_SECRET} -lt 32 ]]; then
        log_error "JWT_SECRET trop court (minimum 32 caractères)"
        exit 1
    fi
    
    # Vérifier que nous ne sommes pas en mode debug
    if [[ "${DEBUG:-false}" == "true" ]] && [[ "$NODE_ENV" == "production" ]]; then
        log_warning "Mode debug activé en production (non recommandé)"
    fi
    
    # Vérifier les en-têtes de sécurité
    export HELMET_ENABLED="${HELMET_ENABLED:-true}"
    export CORS_ENABLED="${CORS_ENABLED:-true}"
    
    log_success "Configuration de sécurité vérifiée"
}

# Fonction principale
main() {
    log "===========================================" 
    log "DÉMARRAGE IMENA-GEST PRODUCTION"
    log "Version: ${VITE_APP_VERSION:-unknown}"
    log "Build: ${VITE_BUILD_TIME:-unknown}"
    log "Node.js: $(node --version)"
    log "Environnement: $NODE_ENV"
    log "==========================================="
    
    # Vérifications préalables
    check_required_env
    check_disk_space
    check_permissions
    security_check
    
    # Configuration
    setup_signal_handlers
    setup_monitoring
    optimize_performance
    
    # Base de données
    check_database
    run_migrations
    seed_database
    
    log_success "Initialisation terminée, démarrage de l'application..."
    
    # Démarrage de l'application
    cd /app/backend
    exec node dist/server.js
}

# Exécution
main "$@"