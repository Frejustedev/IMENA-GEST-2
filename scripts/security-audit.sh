#!/bin/bash

# ===========================================
# Script d'audit de sécurité IMENA-GEST
# Vérifie les vulnérabilités et configurations
# ===========================================

set -euo pipefail

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Compteurs pour le rapport final
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  AUDIT DE SÉCURITÉ - IMENA-GEST${NC}"
echo -e "${BLUE}===========================================${NC}"
echo

# Fonction pour logger les résultats
log_result() {
    local status=$1
    local message=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    case $status in
        "PASS")
            echo -e "${GREEN}✅ PASS:${NC} $message"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL:${NC} $message"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARN:${NC} $message"
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  INFO:${NC} $message"
            ;;
    esac
}

# 1. Vérification des dépendances et vulnérabilités
echo -e "${PURPLE}🔍 1. AUDIT DES DÉPENDANCES${NC}"
echo "----------------------------------------"

if command -v npm &> /dev/null; then
    # Audit npm frontend
    echo "Frontend (React):"
    if npm audit --audit-level=moderate --prefix . > /tmp/frontend-audit.txt 2>&1; then
        log_result "PASS" "Aucune vulnérabilité critique détectée (Frontend)"
    else
        VULN_COUNT=$(grep -c "vulnerabilities" /tmp/frontend-audit.txt || echo "0")
        if [ "$VULN_COUNT" -gt 0 ]; then
            log_result "FAIL" "Vulnérabilités détectées dans les dépendances frontend"
            echo "   📄 Détails dans /tmp/frontend-audit.txt"
        else
            log_result "PASS" "Audit frontend terminé sans problème critique"
        fi
    fi
    
    # Audit npm backend
    echo "Backend (Node.js):"
    if [ -d "backend" ]; then
        if npm audit --audit-level=moderate --prefix backend > /tmp/backend-audit.txt 2>&1; then
            log_result "PASS" "Aucune vulnérabilité critique détectée (Backend)"
        else
            log_result "FAIL" "Vulnérabilités détectées dans les dépendances backend"
            echo "   📄 Détails dans /tmp/backend-audit.txt"
        fi
    else
        log_result "WARN" "Dossier backend introuvable"
    fi
else
    log_result "WARN" "npm non trouvé - audit des dépendances ignoré"
fi

echo

# 2. Vérification des fichiers sensibles
echo -e "${PURPLE}🔐 2. FICHIERS SENSIBLES${NC}"
echo "----------------------------------------"

# Vérifier .env
if [ -f ".env" ]; then
    log_result "WARN" "Fichier .env présent - Vérifier qu'il n'est pas commité"
    
    # Vérifier les secrets par défaut
    if grep -q "change_me\|password_here\|your-secret" .env 2>/dev/null; then
        log_result "FAIL" "Secrets par défaut détectés dans .env"
    else
        log_result "PASS" "Aucun secret par défaut trouvé dans .env"
    fi
else
    log_result "INFO" "Fichier .env absent (normal en production)"
fi

# Vérifier backend/.env
if [ -f "backend/.env" ]; then
    log_result "WARN" "Fichier backend/.env présent"
    if grep -q "change_me\|password_here\|your-secret" backend/.env 2>/dev/null; then
        log_result "FAIL" "Secrets par défaut détectés dans backend/.env"
    fi
else
    log_result "INFO" "Fichier backend/.env absent"
fi

# Vérifier .gitignore
if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        log_result "PASS" "Fichiers .env ignorés par git"
    else
        log_result "FAIL" "Fichiers .env NON ignorés par git"
    fi
else
    log_result "FAIL" "Fichier .gitignore manquant"
fi

echo

# 3. Vérification de la configuration de sécurité
echo -e "${PURPLE}🛡️  3. CONFIGURATION DE SÉCURITÉ${NC}"
echo "----------------------------------------"

# Vérifier les certificats SSL
if [ -d "nginx/ssl" ]; then
    if [ -f "nginx/ssl/certificate.crt" ] && [ -f "nginx/ssl/private.key" ]; then
        log_result "PASS" "Certificats SSL présents"
        
        # Vérifier l'expiration du certificat
        if command -v openssl &> /dev/null; then
            EXPIRY_DATE=$(openssl x509 -enddate -noout -in nginx/ssl/certificate.crt | cut -d= -f2)
            EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null || echo "0")
            CURRENT_TIMESTAMP=$(date +%s)
            DAYS_LEFT=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
            
            if [ $DAYS_LEFT -lt 30 ]; then
                log_result "WARN" "Certificat SSL expire dans $DAYS_LEFT jours"
            else
                log_result "PASS" "Certificat SSL valide ($DAYS_LEFT jours restants)"
            fi
        fi
    else
        log_result "WARN" "Certificats SSL manquants"
    fi
else
    log_result "INFO" "Dossier SSL non configuré (développement?)"
fi

# Vérifier la configuration Docker
if [ -f "docker-compose.yml" ]; then
    log_result "PASS" "Configuration Docker présente"
    
    # Vérifier les secrets par défaut dans docker-compose
    if grep -q "change_me\|password_here" docker-compose.yml; then
        log_result "FAIL" "Mots de passe par défaut dans docker-compose.yml"
    else
        log_result "PASS" "Aucun mot de passe par défaut dans docker-compose.yml"
    fi
else
    log_result "INFO" "Docker Compose non configuré"
fi

echo

# 4. Vérification des ports et services
echo -e "${PURPLE}🌐 4. PORTS ET SERVICES${NC}"
echo "----------------------------------------"

# Vérifier les ports ouverts dangereux
if command -v netstat &> /dev/null; then
    DANGEROUS_PORTS="22 23 3389 5432 6379 27017"
    for port in $DANGEROUS_PORTS; do
        if netstat -ln 2>/dev/null | grep -q ":$port "; then
            case $port in
                22) log_result "WARN" "Port SSH ($port) ouvert - Sécuriser l'accès" ;;
                23) log_result "FAIL" "Port Telnet ($port) ouvert - Service non sécurisé" ;;
                3389) log_result "WARN" "Port RDP ($port) ouvert - Vérifier la sécurité" ;;
                5432) log_result "WARN" "Port PostgreSQL ($port) ouvert - Limiter l'accès" ;;
                6379) log_result "WARN" "Port Redis ($port) ouvert - Configurer l'authentification" ;;
                27017) log_result "WARN" "Port MongoDB ($port) ouvert - Sécuriser l'accès" ;;
            esac
        fi
    done
else
    log_result "INFO" "netstat non disponible - vérification des ports ignorée"
fi

echo

# 5. Vérification du code source
echo -e "${PURPLE}💻 5. ANALYSE DU CODE SOURCE${NC}"
echo "----------------------------------------"

# Rechercher des secrets hardcodés
SECRET_PATTERNS=("password.*=" "secret.*=" "key.*=" "token.*=" "api.*key")
for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r -i "$pattern" src/ backend/src/ 2>/dev/null | grep -v ".test." | grep -v "example" | head -1 > /dev/null; then
        log_result "WARN" "Possible secret hardcodé trouvé (pattern: $pattern)"
    fi
done

# Vérifier les console.log en production
if find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | xargs grep -l "console\.log" | head -1 > /dev/null; then
    log_result "WARN" "console.log détectés - Nettoyer pour la production"
else
    log_result "PASS" "Aucun console.log détecté"
fi

# Vérifier les TODO de sécurité
if grep -r -i "TODO.*secur\|FIXME.*secur\|hack\|temporary" src/ backend/src/ 2>/dev/null | head -1 > /dev/null; then
    log_result "WARN" "TODOs de sécurité détectés dans le code"
else
    log_result "PASS" "Aucun TODO de sécurité critique"
fi

echo

# 6. Vérification des headers de sécurité
echo -e "${PURPLE}🔒 6. HEADERS DE SÉCURITÉ${NC}"
echo "----------------------------------------"

# Vérifier la configuration Nginx
if [ -f "nginx/frontend.conf" ]; then
    SECURITY_HEADERS=("X-Frame-Options" "X-Content-Type-Options" "X-XSS-Protection" "Content-Security-Policy")
    for header in "${SECURITY_HEADERS[@]}"; do
        if grep -q "$header" nginx/frontend.conf; then
            log_result "PASS" "Header $header configuré"
        else
            log_result "FAIL" "Header $header manquant"
        fi
    done
else
    log_result "INFO" "Configuration Nginx non trouvée"
fi

echo

# 7. Tests de sécurité automatisés
echo -e "${PURPLE}🧪 7. TESTS DE SÉCURITÉ${NC}"
echo "----------------------------------------"

if [ -d "backend/src/tests" ]; then
    if [ -f "backend/src/tests/auth.test.ts" ]; then
        log_result "PASS" "Tests d'authentification présents"
    else
        log_result "WARN" "Tests d'authentification manquants"
    fi
    
    # Exécuter les tests de sécurité si npm est disponible
    if command -v npm &> /dev/null && [ -f "backend/package.json" ]; then
        echo "Exécution des tests de sécurité..."
        if cd backend && npm test 2>/dev/null; then
            log_result "PASS" "Tests de sécurité réussis"
        else
            log_result "WARN" "Certains tests de sécurité ont échoué"
        fi
        cd ..
    fi
else
    log_result "WARN" "Dossier de tests manquant"
fi

echo

# 8. Rapport final
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  RAPPORT FINAL DE SÉCURITÉ${NC}"
echo -e "${BLUE}===========================================${NC}"
echo
echo -e "Total des vérifications: $TOTAL_CHECKS"
echo -e "${GREEN}✅ Réussies: $PASSED_CHECKS${NC}"
echo -e "${YELLOW}⚠️  Avertissements: $WARNING_CHECKS${NC}"
echo -e "${RED}❌ Échecs: $FAILED_CHECKS${NC}"
echo

# Calcul du score de sécurité
SECURITY_SCORE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
echo -e "Score de sécurité: ${SECURITY_SCORE}%"

if [ $SECURITY_SCORE -ge 90 ]; then
    echo -e "${GREEN}🎉 Excellent niveau de sécurité!${NC}"
elif [ $SECURITY_SCORE -ge 75 ]; then
    echo -e "${YELLOW}⚡ Bon niveau de sécurité, quelques améliorations possibles${NC}"
elif [ $SECURITY_SCORE -ge 60 ]; then
    echo -e "${YELLOW}⚠️  Niveau de sécurité acceptable, améliorations recommandées${NC}"
else
    echo -e "${RED}🚨 Niveau de sécurité insuffisant, actions correctives requises${NC}"
fi

echo
echo -e "${BLUE}📊 Recommandations:${NC}"

if [ $FAILED_CHECKS -gt 0 ]; then
    echo -e "1. ${RED}Corriger les échecs critiques en priorité${NC}"
fi

if [ $WARNING_CHECKS -gt 0 ]; then
    echo -e "2. ${YELLOW}Examiner les avertissements de sécurité${NC}"
fi

echo -e "3. ${BLUE}Exécuter cet audit régulièrement${NC}"
echo -e "4. ${BLUE}Maintenir les dépendances à jour${NC}"
echo -e "5. ${BLUE}Réviser les logs de sécurité${NC}"

echo
echo -e "${GREEN}Audit terminé. Consultez les détails ci-dessus.${NC}"

# Code de sortie basé sur les résultats
if [ $FAILED_CHECKS -gt 0 ]; then
    exit 1
elif [ $WARNING_CHECKS -gt 3 ]; then
    exit 2
else
    exit 0
fi
