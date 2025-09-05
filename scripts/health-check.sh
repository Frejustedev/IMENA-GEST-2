#!/bin/bash

# ===========================================
# Health Check Script pour IMENA-GEST
# Vérification complète de l'état de l'application
# ===========================================

set -euo pipefail

# Configuration
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3000/api/health}"
TIMEOUT="${HEALTH_CHECK_TIMEOUT:-10}"
MAX_RETRIES="${HEALTH_CHECK_RETRIES:-3}"

# Codes de sortie
EXIT_SUCCESS=0
EXIT_WARNING=1
EXIT_CRITICAL=2
EXIT_UNKNOWN=3

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >&2
}

log_success() {
    echo -e "${GREEN}[HEALTH CHECK SUCCESS]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[HEALTH CHECK WARNING]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[HEALTH CHECK ERROR]${NC} $1" >&2
}

# Vérification de la disponibilité de l'API
check_api_health() {
    local response
    local http_code
    local response_time
    
    for attempt in $(seq 1 $MAX_RETRIES); do
        log "Tentative $attempt/$MAX_RETRIES - Vérification API health endpoint..."
        
        # Mesure du temps de réponse
        local start_time=$(date +%s%3N)
        
        if response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" \
                          --max-time "$TIMEOUT" \
                          --fail \
                          "$HEALTH_CHECK_URL" 2>/dev/null); then
            
            local end_time=$(date +%s%3N)
            http_code=$(echo "$response" | cut -d: -f1)
            response_time=$(echo "$response" | cut -d: -f2)
            
            if [[ "$http_code" == "200" ]]; then
                local response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "unknown")
                log_success "API accessible (HTTP $http_code) - Temps de réponse: ${response_time_ms}ms"
                return $EXIT_SUCCESS
            else
                log_warning "API retourne HTTP $http_code (tentative $attempt/$MAX_RETRIES)"
            fi
        else
            log_warning "API non accessible (tentative $attempt/$MAX_RETRIES)"
        fi
        
        if [[ $attempt -lt $MAX_RETRIES ]]; then
            sleep 2
        fi
    done
    
    log_error "API non accessible après $MAX_RETRIES tentatives"
    return $EXIT_CRITICAL
}

# Vérification de la base de données
check_database() {
    log "Vérification de la connectivité base de données..."
    
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_warning "DATABASE_URL non définie, saut de la vérification DB"
        return $EXIT_WARNING
    fi
    
    # Test de connexion simple avec timeout
    if timeout "$TIMEOUT" node -e "
        const { Client } = require('pg');
        const client = new Client('${DATABASE_URL}');
        
        const start = Date.now();
        client.connect()
            .then(() => client.query('SELECT 1 as health'))
            .then(() => {
                const duration = Date.now() - start;
                console.log('Database OK (' + duration + 'ms)');
                process.exit(0);
            })
            .catch(err => {
                console.error('Database Error:', err.message);
                process.exit(1);
            })
            .finally(() => client.end());
    " 2>/dev/null; then
        log_success "Base de données accessible"
        return $EXIT_SUCCESS
    else
        log_error "Base de données non accessible"
        return $EXIT_CRITICAL
    fi
}

# Vérification de l'utilisation mémoire
check_memory_usage() {
    log "Vérification de l'utilisation mémoire..."
    
    # Obtenir l'utilisation mémoire du processus
    if [[ -f /app/logs/application.pid ]]; then
        local pid=$(cat /app/logs/application.pid)
        
        if kill -0 "$pid" 2>/dev/null; then
            local memory_usage
            memory_usage=$(ps -o pid,vsz,rss,pmem -p "$pid" | tail -n 1 | awk '{print $4}')
            
            if [[ -n "$memory_usage" ]]; then
                local memory_percent=${memory_usage%.*}
                
                if [[ $memory_percent -gt 90 ]]; then
                    log_error "Utilisation mémoire critique: ${memory_usage}%"
                    return $EXIT_CRITICAL
                elif [[ $memory_percent -gt 80 ]]; then
                    log_warning "Utilisation mémoire élevée: ${memory_usage}%"
                    return $EXIT_WARNING
                else
                    log_success "Utilisation mémoire normale: ${memory_usage}%"
                    return $EXIT_SUCCESS
                fi
            fi
        fi
    fi
    
    log_warning "Impossible de déterminer l'utilisation mémoire"
    return $EXIT_WARNING
}

# Vérification de l'espace disque
check_disk_space() {
    log "Vérification de l'espace disque..."
    
    local usage
    usage=$(df /app 2>/dev/null | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ -n "$usage" ]]; then
        if [[ $usage -gt 95 ]]; then
            log_error "Espace disque critique: ${usage}% utilisé"
            return $EXIT_CRITICAL
        elif [[ $usage -gt 85 ]]; then
            log_warning "Espace disque faible: ${usage}% utilisé"
            return $EXIT_WARNING
        else
            log_success "Espace disque suffisant: ${usage}% utilisé"
            return $EXIT_SUCCESS
        fi
    else
        log_warning "Impossible de déterminer l'espace disque"
        return $EXIT_WARNING
    fi
}

# Vérification des logs d'erreur récents
check_error_logs() {
    log "Vérification des erreurs récentes..."
    
    local log_file="/app/logs/application.log"
    
    if [[ -f "$log_file" ]]; then
        # Compter les erreurs dans les 5 dernières minutes
        local recent_errors
        recent_errors=$(grep -c "\"level\":\"error\"" "$log_file" 2>/dev/null | tail -100 || echo "0")
        
        if [[ $recent_errors -gt 10 ]]; then
            log_error "Trop d'erreurs récentes: $recent_errors dans les logs"
            return $EXIT_CRITICAL
        elif [[ $recent_errors -gt 5 ]]; then
            log_warning "Erreurs détectées dans les logs: $recent_errors"
            return $EXIT_WARNING
        else
            log_success "Pas d'erreurs critiques récentes"
            return $EXIT_SUCCESS
        fi
    else
        log_warning "Fichier de log non trouvé: $log_file"
        return $EXIT_WARNING
    fi
}

# Vérification des connexions réseau
check_network() {
    log "Vérification des connexions réseau..."
    
    # Vérifier que le port d'écoute est ouvert
    local port="${PORT:-3000}"
    
    if netstat -ln 2>/dev/null | grep -q ":$port.*LISTEN" || \
       ss -ln 2>/dev/null | grep -q ":$port.*LISTEN"; then
        log_success "Port $port en écoute"
        return $EXIT_SUCCESS
    else
        log_error "Port $port non accessible"
        return $EXIT_CRITICAL
    fi
}

# Vérification des certificats SSL (si applicable)
check_ssl_certificates() {
    log "Vérification des certificats SSL..."
    
    local cert_file="/app/nginx/ssl/certificate.crt"
    
    if [[ -f "$cert_file" ]]; then
        # Vérifier la date d'expiration
        if openssl x509 -in "$cert_file" -noout -checkend 86400 2>/dev/null; then
            local expiry_date
            expiry_date=$(openssl x509 -in "$cert_file" -noout -enddate 2>/dev/null | cut -d= -f2)
            log_success "Certificat SSL valide (expire: $expiry_date)"
            return $EXIT_SUCCESS
        else
            log_error "Certificat SSL expire dans moins de 24h"
            return $EXIT_CRITICAL
        fi
    else
        log_warning "Certificat SSL non trouvé (peut être normal en développement)"
        return $EXIT_WARNING
    fi
}

# Fonction principale de health check
perform_health_check() {
    local overall_status=$EXIT_SUCCESS
    local checks_performed=0
    local checks_passed=0
    local checks_warnings=0
    local checks_critical=0
    
    log "=========================================="
    log "DÉMARRAGE HEALTH CHECK IMENA-GEST"
    log "=========================================="
    
    # Liste des vérifications à effectuer
    local health_checks=(
        "check_api_health:API Health"
        "check_database:Database"
        "check_memory_usage:Memory"
        "check_disk_space:Disk Space"
        "check_network:Network"
        "check_error_logs:Error Logs"
        "check_ssl_certificates:SSL Certificates"
    )
    
    for check in "${health_checks[@]}"; do
        local check_function=$(echo "$check" | cut -d: -f1)
        local check_name=$(echo "$check" | cut -d: -f2)
        
        log "Exécution: $check_name"
        
        if $check_function; then
            case $? in
                $EXIT_SUCCESS)
                    ((checks_passed++))
                    ;;
                $EXIT_WARNING)
                    ((checks_warnings++))
                    if [[ $overall_status -eq $EXIT_SUCCESS ]]; then
                        overall_status=$EXIT_WARNING
                    fi
                    ;;
                $EXIT_CRITICAL)
                    ((checks_critical++))
                    overall_status=$EXIT_CRITICAL
                    ;;
            esac
        else
            case $? in
                $EXIT_WARNING)
                    ((checks_warnings++))
                    if [[ $overall_status -eq $EXIT_SUCCESS ]]; then
                        overall_status=$EXIT_WARNING
                    fi
                    ;;
                $EXIT_CRITICAL)
                    ((checks_critical++))
                    overall_status=$EXIT_CRITICAL
                    ;;
                *)
                    ((checks_critical++))
                    overall_status=$EXIT_CRITICAL
                    ;;
            esac
        fi
        
        ((checks_performed++))
    done
    
    log "=========================================="
    log "RÉSULTATS HEALTH CHECK"
    log "Total: $checks_performed"
    log "Succès: $checks_passed"
    log "Warnings: $checks_warnings" 
    log "Critiques: $checks_critical"
    log "=========================================="
    
    case $overall_status in
        $EXIT_SUCCESS)
            log_success "Health check PASSED - Application en bonne santé"
            ;;
        $EXIT_WARNING)
            log_warning "Health check WARNING - Application fonctionnelle avec avertissements"
            ;;
        $EXIT_CRITICAL)
            log_error "Health check FAILED - Application en état critique"
            ;;
    esac
    
    return $overall_status
}

# Gestion des arguments de ligne de commande
case "${1:-health}" in
    "health"|"")
        perform_health_check
        exit $?
        ;;
    "api")
        check_api_health
        exit $?
        ;;
    "database"|"db")
        check_database
        exit $?
        ;;
    "memory"|"mem")
        check_memory_usage
        exit $?
        ;;
    "disk")
        check_disk_space
        exit $?
        ;;
    "network"|"net")
        check_network
        exit $?
        ;;
    "ssl")
        check_ssl_certificates
        exit $?
        ;;
    "logs")
        check_error_logs
        exit $?
        ;;
    *)
        echo "Usage: $0 [health|api|database|memory|disk|network|ssl|logs]"
        echo "  health    - Effectue tous les checks (défaut)"
        echo "  api       - Vérifie l'API uniquement"
        echo "  database  - Vérifie la base de données"
        echo "  memory    - Vérifie l'utilisation mémoire"
        echo "  disk      - Vérifie l'espace disque"
        echo "  network   - Vérifie les connexions réseau"
        echo "  ssl       - Vérifie les certificats SSL"
        echo "  logs      - Vérifie les erreurs dans les logs"
        exit $EXIT_UNKNOWN
        ;;
esac
