#!/bin/bash

# ===========================================
# Générateur de certificats SSL/TLS avancé
# IMENA-GEST - Sécurité Niveau Production
# Support: Dev, Test, Production avec Let's Encrypt
# ===========================================

set -euo pipefail

# Configuration Avancée
CERT_DIR="./nginx/ssl"
ENVIRONMENT="${1:-dev}" # dev, test, prod
DAYS=365
COUNTRY="FR"
STATE="France"
CITY="Paris"
ORG="IMENA-GEST"
ORG_UNIT="Medical Nuclear Imaging Department"
COMMON_NAME="localhost"

# Configuration par environnement
case $ENVIRONMENT in
    "dev")
        COMMON_NAME="localhost"
        DAYS=365
        echo -e "${BLUE}🔧 Mode DÉVELOPPEMENT${NC}"
        ;;
    "test")
        COMMON_NAME="test.imena-gest.local"
        DAYS=90
        echo -e "${YELLOW}🧪 Mode TEST${NC}"
        ;;
    "prod")
        COMMON_NAME="${2:-imena-gest.example.com}"
        DAYS=90
        echo -e "${RED}🏥 Mode PRODUCTION${NC}"
        echo -e "${RED}⚠️  ATTENTION: Certificat pour domaine réel!${NC}"
        ;;
    *)
        echo -e "${RED}❌ Environnement invalide. Utilisez: dev, test, ou prod${NC}"
        exit 1
        ;;
esac

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  Générateur de certificats SSL/TLS${NC}"
echo -e "${BLUE}  Pour IMENA-GEST (Développement)${NC}"
echo -e "${BLUE}===========================================${NC}"
echo

# Vérifier que OpenSSL est installé
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ OpenSSL n'est pas installé. Veuillez l'installer.${NC}"
    exit 1
fi

# Créer le dossier SSL s'il n'existe pas
mkdir -p "$CERT_DIR"

echo -e "${YELLOW}📁 Création du dossier: $CERT_DIR${NC}"

# Générer la clé privée
echo -e "${BLUE}🔑 Génération de la clé privée...${NC}"
openssl genrsa -out "$CERT_DIR/private.key" 2048

# Générer le certificat auto-signé
echo -e "${BLUE}📜 Génération du certificat auto-signé...${NC}"
openssl req -new -x509 -key "$CERT_DIR/private.key" -out "$CERT_DIR/certificate.crt" -days $DAYS -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/OU=$ORG_UNIT/CN=$COMMON_NAME"

# Générer le certificat avec SAN (Subject Alternative Names)
echo -e "${BLUE}🌐 Génération du certificat avec SAN...${NC}"
cat > "$CERT_DIR/openssl.conf" <<EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = $COUNTRY
ST = $STATE
L = $CITY
O = $ORG
OU = $ORG_UNIT
CN = $COMMON_NAME

[v3_req]
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
DNS.3 = imena-gest.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Régénérer le certificat avec la configuration SAN
openssl req -new -x509 -key "$CERT_DIR/private.key" -out "$CERT_DIR/certificate.crt" -days $DAYS -config "$CERT_DIR/openssl.conf" -extensions v3_req

# Générer le certificat au format PEM combiné
cat "$CERT_DIR/certificate.crt" "$CERT_DIR/private.key" > "$CERT_DIR/server.pem"

# Créer un certificat DH pour une sécurité renforcée
echo -e "${BLUE}🔐 Génération des paramètres Diffie-Hellman...${NC}"
openssl dhparam -out "$CERT_DIR/dhparam.pem" 2048

# Définir les permissions sécurisées
chmod 600 "$CERT_DIR/private.key"
chmod 644 "$CERT_DIR/certificate.crt"
chmod 600 "$CERT_DIR/server.pem"
chmod 644 "$CERT_DIR/dhparam.pem"

# Afficher les informations du certificat
echo -e "${GREEN}✅ Certificats générés avec succès!${NC}"
echo
echo -e "${YELLOW}📋 Informations du certificat:${NC}"
openssl x509 -in "$CERT_DIR/certificate.crt" -text -noout | grep -A 5 "Subject:"
echo
echo -e "${YELLOW}📅 Validité du certificat:${NC}"
openssl x509 -in "$CERT_DIR/certificate.crt" -noout -dates

echo
echo -e "${GREEN}📁 Fichiers générés dans $CERT_DIR:${NC}"
echo -e "  🔑 private.key     - Clé privée"
echo -e "  📜 certificate.crt - Certificat public"
echo -e "  📦 server.pem      - Certificat combiné"
echo -e "  🔐 dhparam.pem     - Paramètres DH"
echo -e "  ⚙️  openssl.conf   - Configuration OpenSSL"

echo
echo -e "${YELLOW}⚠️  ATTENTION - Certificat de développement uniquement:${NC}"
echo -e "  • Ce certificat est auto-signé et ne doit PAS être utilisé en production"
echo -e "  • Les navigateurs afficheront un avertissement de sécurité"
echo -e "  • Pour la production, utilisez un certificat d'une autorité de certification reconnue"

echo
echo -e "${BLUE}🚀 Pour utiliser HTTPS en développement:${NC}"
echo -e "  1. Démarrez l'application avec HTTPS activé"
echo -e "  2. Accédez à https://localhost:3000"
echo -e "  3. Acceptez l'avertissement de sécurité du navigateur"

echo
echo -e "${GREEN}✨ Configuration terminée avec succès!${NC}"
