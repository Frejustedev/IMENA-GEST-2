# 🚀 **GUIDE DE DÉPLOIEMENT PRODUCTION IMENA-GEST**

## 📋 **SOMMAIRE**

1. [Prérequis et Architecture](#prérequis-et-architecture)
2. [Installation et Configuration](#installation-et-configuration)
3. [Sécurité et Conformité](#sécurité-et-conformité)
4. [Monitoring et Surveillance](#monitoring-et-surveillance)
5. [Sauvegarde et Récupération](#sauvegarde-et-récupération)
6. [Maintenance et Mise à Jour](#maintenance-et-mise-à-jour)
7. [Dépannage et Support](#dépannage-et-support)
8. [Procédures d'Urgence](#procédures-durgence)

---

## 🏗️ **PRÉREQUIS ET ARCHITECTURE**

### **Infrastructure Minimale Production**

#### **Serveur Principal**
- **CPU**: 8 cores minimum (16 cores recommandé)
- **RAM**: 32 GB minimum (64 GB recommandé)
- **Stockage**: 1 TB SSD minimum (RAID 10 recommandé)
- **Réseau**: 1 Gbps minimum, 10 Gbps recommandé

#### **Base de Données**
- **PostgreSQL 15+** sur serveur dédié
- **CPU**: 4 cores minimum
- **RAM**: 16 GB minimum
- **Stockage**: 500 GB SSD (RAID 1 + 0)

#### **Stockage Images Médicales**
- **Stockage**: 10 TB minimum (extensible)
- **RAID**: RAID 6 ou équivalent cloud
- **Sauvegarde**: Réplication géographique

#### **Réseau et Sécurité**
- **Firewall**: WAF + DDoS protection
- **SSL/TLS**: Certificats Let's Encrypt ou CA
- **VPN**: Accès administrateur sécurisé
- **Monitoring**: SIEM + SOC 24/7

### **Architecture Haute Disponibilité**

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx + SSL Termination]
    end
    
    subgraph "Application Tier"
        APP1[IMENA-GEST Instance 1]
        APP2[IMENA-GEST Instance 2]
        APP3[IMENA-GEST Instance 3]
    end
    
    subgraph "Database Tier"
        DB1[PostgreSQL Master]
        DB2[PostgreSQL Standby]
        REDIS[Redis Cluster]
    end
    
    subgraph "Storage Tier"
        S3[Object Storage]
        BACKUP[Backup Storage]
    end
    
    subgraph "Monitoring"
        PROM[Prometheus]
        GRAF[Grafana]
        ALERT[AlertManager]
    end
    
    LB --> APP1
    LB --> APP2
    LB --> APP3
    
    APP1 --> DB1
    APP2 --> DB1
    APP3 --> DB1
    
    DB1 --> DB2
    
    APP1 --> REDIS
    APP2 --> REDIS
    APP3 --> REDIS
    
    APP1 --> S3
    APP2 --> S3
    APP3 --> S3
    
    S3 --> BACKUP
```

---

## ⚙️ **INSTALLATION ET CONFIGURATION**

### **1. Préparation de l'Environnement**

#### **Installation Docker et Kubernetes**
```bash
# Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installation Kubernetes (k3s)
curl -sfL https://get.k3s.io | sh -

# Vérification
sudo kubectl get nodes
```

#### **Configuration des Variables d'Environnement**
```bash
# Créer le fichier de configuration
sudo mkdir -p /etc/imena-gest
sudo cat > /etc/imena-gest/production.env << 'EOF'
# Base de données
DATABASE_URL=postgresql://username:password@db-host:5432/imena_gest
DATABASE_SSL=true
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://redis-host:6379
REDIS_PASSWORD=your_redis_password

# JWT et Sécurité
JWT_SECRET=your_super_secure_jwt_secret_key_here
ENCRYPTION_KEY=your_256_bit_encryption_key_here
SESSION_SECRET=your_session_secret_here

# Email SMTP
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=noreply@imena-gest.com
SMTP_PASSWORD=your_smtp_password

# Stockage
STORAGE_PROVIDER=s3
S3_BUCKET=imena-gest-production
S3_REGION=eu-west-1
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key

# Monitoring
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
SENTRY_DSN=your_sentry_dsn

# Performance
NODE_OPTIONS=--max-old-space-size=4096
UV_THREADPOOL_SIZE=16

# Conformité
GDPR_ENABLED=true
HDS_COMPLIANCE=true
AUDIT_ENABLED=true
EOF

# Sécuriser le fichier
sudo chmod 600 /etc/imena-gest/production.env
sudo chown root:root /etc/imena-gest/production.env
```

### **2. Déploiement avec Docker Compose**

#### **Fichier docker-compose.production.yml**
```yaml
version: '3.8'

services:
  # Application principale
  imena-gest:
    image: ghcr.io/your-org/imena-gest:latest
    restart: unless-stopped
    env_file:
      - /etc/imena-gest/production.env
    ports:
      - "3000:3000"
    volumes:
      - /var/log/imena-gest:/app/logs
      - /var/lib/imena-gest/uploads:/app/uploads
      - /var/lib/imena-gest/temp:/app/temp
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "/usr/local/bin/health-check.sh"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G
        reservations:
          cpus: '2.0'
          memory: 4G

  # Reverse Proxy Nginx
  nginx:
    image: ghcr.io/your-org/imena-gest-nginx:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/log/nginx:/var/log/nginx
    depends_on:
      - imena-gest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  # Base de données PostgreSQL
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    env_file:
      - /etc/imena-gest/production.env
    environment:
      POSTGRES_DB: imena_gest
      POSTGRES_USER: imena_gest_user
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - /var/backups/postgres:/var/backups
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U imena_gest_user -d imena_gest"]
      interval: 30s
      timeout: 5s
      retries: 5

  # Redis pour les sessions et cache
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 3s
      retries: 5

  # Monitoring Prometheus
  prometheus:
    image: prom/prometheus:latest
    restart: unless-stopped
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=15d'
      - '--web.enable-lifecycle'

  # Dashboard Grafana
  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_INSTALL_PLUGINS: grafana-piechart-panel
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  default:
    driver: bridge
```

### **3. Commandes de Déploiement**

```bash
# Télécharger les images
docker-compose -f docker-compose.production.yml pull

# Démarrer les services
docker-compose -f docker-compose.production.yml up -d

# Vérifier le statut
docker-compose -f docker-compose.production.yml ps

# Voir les logs
docker-compose -f docker-compose.production.yml logs -f imena-gest

# Migration base de données
docker-compose -f docker-compose.production.yml exec imena-gest npm run migrate

# Seed des données initiales
docker-compose -f docker-compose.production.yml exec imena-gest npm run seed
```

---

## 🔒 **SÉCURITÉ ET CONFORMITÉ**

### **Configuration Sécurité SSL/TLS**

#### **Certificats Let's Encrypt**
```bash
# Installation Certbot
sudo apt install certbot python3-certbot-nginx

# Génération certificat
sudo certbot --nginx -d imena-gest.com -d www.imena-gest.com

# Renouvellement automatique
sudo crontab -e
# Ajouter: 0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

#### **Configuration Nginx Sécurisée**
```nginx
# /etc/nginx/sites-available/imena-gest.com
server {
    listen 443 ssl http2;
    server_name imena-gest.com www.imena-gest.com;

    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/imena-gest.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/imena-gest.com/privkey.pem;

    # Configuration SSL sécurisée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # Headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # CSP pour médecine nucléaire
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'self';" always;

    # Proxy vers l'application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gestion des uploads
    location /api/upload {
        client_max_body_size 100M;
        proxy_pass http://localhost:3000;
        proxy_request_buffering off;
    }

    # Fichiers statiques
    location /static/ {
        alias /var/www/imena-gest/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name imena-gest.com www.imena-gest.com;
    return 301 https://$server_name$request_uri;
}
```

### **Audit de Sécurité**

#### **Script d'Audit Automatisé**
```bash
#!/bin/bash
# /opt/imena-gest/scripts/security-audit.sh

echo "🔍 AUDIT DE SÉCURITÉ IMENA-GEST"
echo "================================"

# Vérification des ports ouverts
echo "1. Ports ouverts:"
nmap -sS localhost

# Vérification des certificats SSL
echo "2. Certificats SSL:"
openssl s509 -in /etc/letsencrypt/live/imena-gest.com/fullchain.pem -noout -dates

# Vérification des permissions
echo "3. Permissions critiques:"
find /etc/imena-gest -type f -exec ls -la {} \;

# Vérification des logs de sécurité
echo "4. Tentatives d'intrusion récentes:"
grep "Failed password" /var/log/auth.log | tail -10

# Test de vulnérabilités
echo "5. Scan de vulnérabilités:"
nikto -h https://imena-gest.com

# Rapport final
echo "Audit terminé le $(date)"
```

### **Conformité RGPD/HDS**

#### **Configuration Audit Trail**
```typescript
// Exemple de configuration audit
const auditConfig = {
  retention: {
    patientData: '10 years',
    auditLogs: '3 years',
    backups: '7 years'
  },
  encryption: {
    algorithm: 'AES-256-GCM',
    keyRotation: '90 days'
  },
  access: {
    logAllAccess: true,
    anonymizeAfter: '30 days',
    purgeAfter: '10 years'
  }
};
```

---

## 📊 **MONITORING ET SURVEILLANCE**

### **Configuration Prometheus**

#### **prometheus.yml**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'imena-gest'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

### **Règles d'Alerte**

#### **rules/applications.yml**
```yaml
groups:
  - name: imena-gest.rules
    rules:
      - alert: ApplicationDown
        expr: up{job="imena-gest"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "IMENA-GEST Application is down"
          description: "Application has been down for more than 1 minute"

      - alert: HighResponseTime
        expr: http_request_duration_seconds{quantile="0.95"} > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"

      - alert: DatabaseConnectionHigh
        expr: postgres_stat_activity_count > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database has {{ $value }} active connections"

      - alert: DiskSpaceWarning
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 15
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space"
          description: "Disk space is below 15%: {{ $value }}%"

      - alert: MemoryUsageHigh
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%: {{ $value }}%"
```

### **Dashboard Grafana**

#### **Métriques Principales à Surveiller**
- **Application**: Temps de réponse, taux d'erreur, throughput
- **Infrastructure**: CPU, RAM, disque, réseau
- **Base de données**: Connexions, requêtes lentes, locks
- **Sécurité**: Tentatives de connexion, alertes sécurité
- **Médical**: Examens traités, temps de traitement, erreurs

---

## 💾 **SAUVEGARDE ET RÉCUPÉRATION**

### **Stratégie de Sauvegarde 3-2-1**

#### **Script de Sauvegarde Automatisé**
```bash
#!/bin/bash
# /opt/imena-gest/scripts/backup.sh

BACKUP_DIR="/var/backups/imena-gest"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Création des dossiers
mkdir -p "$BACKUP_DIR"/{database,files,config}

# Sauvegarde base de données
echo "🗄️ Sauvegarde base de données..."
pg_dump -h localhost -U imena_gest_user -d imena_gest | gzip > "$BACKUP_DIR/database/db_$DATE.sql.gz"

# Sauvegarde fichiers utilisateur
echo "📁 Sauvegarde fichiers..."
tar -czf "$BACKUP_DIR/files/files_$DATE.tar.gz" /var/lib/imena-gest/uploads

# Sauvegarde configuration
echo "⚙️ Sauvegarde configuration..."
tar -czf "$BACKUP_DIR/config/config_$DATE.tar.gz" /etc/imena-gest

# Synchronisation vers stockage distant (AWS S3)
echo "☁️ Synchronisation cloud..."
aws s3 sync "$BACKUP_DIR" s3://imena-gest-backups/

# Nettoyage des anciennes sauvegardes
echo "🧹 Nettoyage..."
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete

# Vérification intégrité
echo "✅ Vérification intégrité..."
for backup in "$BACKUP_DIR"/*/*.gz; do
    if ! gzip -t "$backup"; then
        echo "❌ Erreur intégrité: $backup"
        exit 1
    fi
done

echo "✅ Sauvegarde terminée: $DATE"
```

#### **Programmation Cron**
```bash
# Sauvegarde complète quotidienne à 2h00
0 2 * * * /opt/imena-gest/scripts/backup.sh >> /var/log/backup.log 2>&1

# Sauvegarde incrémentale toutes les 4 heures
0 */4 * * * /opt/imena-gest/scripts/backup-incremental.sh >> /var/log/backup.log 2>&1

# Test de restauration hebdomadaire
0 4 * * 0 /opt/imena-gest/scripts/test-restore.sh >> /var/log/restore-test.log 2>&1
```

### **Procédure de Restauration**

#### **Restauration Complète**
```bash
#!/bin/bash
# /opt/imena-gest/scripts/restore.sh

BACKUP_DATE=$1
BACKUP_DIR="/var/backups/imena-gest"

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <BACKUP_DATE> (format: YYYYMMDD_HHMMSS)"
    exit 1
fi

echo "🔄 Restauration IMENA-GEST ($BACKUP_DATE)"
echo "========================================"

# Arrêt des services
echo "⏹️ Arrêt des services..."
docker-compose -f docker-compose.production.yml stop

# Restauration base de données
echo "🗄️ Restauration base de données..."
gunzip -c "$BACKUP_DIR/database/db_$BACKUP_DATE.sql.gz" | psql -h localhost -U imena_gest_user -d imena_gest

# Restauration fichiers
echo "📁 Restauration fichiers..."
tar -xzf "$BACKUP_DIR/files/files_$BACKUP_DATE.tar.gz" -C /

# Restauration configuration
echo "⚙️ Restauration configuration..."
tar -xzf "$BACKUP_DIR/config/config_$BACKUP_DATE.tar.gz" -C /

# Redémarrage des services
echo "▶️ Redémarrage des services..."
docker-compose -f docker-compose.production.yml start

# Vérification santé
echo "✅ Vérification santé..."
sleep 30
curl -f http://localhost/health || echo "❌ Problème détecté"

echo "✅ Restauration terminée"
```

---

## 🔧 **MAINTENANCE ET MISE À JOUR**

### **Procédure de Mise à Jour**

#### **Mise à Jour Application**
```bash
#!/bin/bash
# /opt/imena-gest/scripts/update.sh

NEW_VERSION=$1
CURRENT_VERSION=$(docker inspect ghcr.io/your-org/imena-gest:latest | jq -r '.[0].Config.Labels.version')

echo "🚀 MISE À JOUR IMENA-GEST"
echo "========================="
echo "Version actuelle: $CURRENT_VERSION"
echo "Nouvelle version: $NEW_VERSION"

# Sauvegarde préventive
echo "💾 Sauvegarde préventive..."
/opt/imena-gest/scripts/backup.sh

# Téléchargement nouvelle image
echo "📥 Téléchargement nouvelle version..."
docker pull ghcr.io/your-org/imena-gest:$NEW_VERSION

# Test sur environnement staging
echo "🧪 Test staging..."
docker run --rm -e NODE_ENV=staging ghcr.io/your-org/imena-gest:$NEW_VERSION npm test

# Mise à jour production
echo "🔄 Mise à jour production..."
sed -i "s/imena-gest:latest/imena-gest:$NEW_VERSION/" docker-compose.production.yml
docker-compose -f docker-compose.production.yml up -d --no-deps imena-gest

# Vérification santé
echo "✅ Vérification post-déploiement..."
sleep 60
if curl -f http://localhost/health; then
    echo "✅ Mise à jour réussie"
    # Nettoyage ancienne image
    docker image rm ghcr.io/your-org/imena-gest:latest
else
    echo "❌ Problème détecté, rollback..."
    /opt/imena-gest/scripts/rollback.sh
fi
```

### **Maintenance Préventive**

#### **Checklist Mensuelle**
```bash
#!/bin/bash
# /opt/imena-gest/scripts/monthly-maintenance.sh

echo "🔧 MAINTENANCE MENSUELLE IMENA-GEST"
echo "==================================="

# Nettoyage logs
echo "📝 Nettoyage logs..."
find /var/log/imena-gest -name "*.log" -mtime +30 -delete
logrotate /etc/logrotate.d/imena-gest

# Optimisation base de données
echo "🗄️ Optimisation base de données..."
docker-compose exec postgres psql -U imena_gest_user -d imena_gest -c "VACUUM ANALYZE;"
docker-compose exec postgres psql -U imena_gest_user -d imena_gest -c "REINDEX DATABASE imena_gest;"

# Nettoyage Docker
echo "🐳 Nettoyage Docker..."
docker system prune -f
docker volume prune -f

# Mise à jour certificats
echo "🔒 Vérification certificats..."
certbot renew --dry-run

# Test de récupération
echo "🔄 Test de récupération..."
/opt/imena-gest/scripts/test-restore.sh

# Audit sécurité
echo "🔍 Audit sécurité..."
/opt/imena-gest/scripts/security-audit.sh

# Génération rapport
echo "📊 Génération rapport maintenance..."
{
    echo "Rapport de maintenance - $(date)"
    echo "================================"
    echo "Espace disque: $(df -h /)"
    echo "Utilisation mémoire: $(free -h)"
    echo "Processus: $(ps aux | grep imena-gest)"
    echo "Services Docker: $(docker-compose ps)"
} > "/var/log/maintenance-$(date +%Y%m).log"

echo "✅ Maintenance terminée"
```

---

## 🚨 **PROCÉDURES D'URGENCE**

### **Plan de Continuité d'Activité (PCA)**

#### **Contacts d'Urgence**
```
🚨 CONTACTS D'URGENCE IMENA-GEST
================================

Niveau 1 (Astreinte 24/7):
- Administrateur Système: +33 6 XX XX XX XX
- DBA Senior: +33 6 YY YY YY YY
- Responsable Sécurité: +33 6 ZZ ZZ ZZ ZZ

Niveau 2 (Escalade):
- Directeur Technique: +33 1 XX XX XX XX
- Responsable IT: +33 1 YY YY YY YY

Partenaires:
- Support Hébergeur: +33 X XX XX XX XX
- Support Cloud: +33 Y YY YY YY YY
- Support Réseau: +33 Z ZZ ZZ ZZ ZZ

Contacts Métier:
- Responsable Médical: +33 6 AA AA AA AA
- Direction Hôpital: +33 1 BB BB BB BB
```

#### **Procédure d'Incident Majeur**
```bash
#!/bin/bash
# /opt/imena-gest/scripts/emergency-response.sh

INCIDENT_TYPE=$1
SEVERITY=$2

echo "🚨 PROCÉDURE D'URGENCE IMENA-GEST"
echo "================================="
echo "Type: $INCIDENT_TYPE"
echo "Sévérité: $SEVERITY"
echo "Heure: $(date)"

case $INCIDENT_TYPE in
    "outage")
        echo "1. Basculement site de secours..."
        /opt/imena-gest/scripts/failover.sh
        
        echo "2. Notification équipe d'urgence..."
        /opt/imena-gest/scripts/alert-team.sh "OUTAGE MAJEUR" "$SEVERITY"
        
        echo "3. Communication utilisateurs..."
        /opt/imena-gest/scripts/status-page-update.sh "Service temporairement indisponible"
        ;;
        
    "security")
        echo "1. Isolation système..."
        iptables -A INPUT -j DROP
        
        echo "2. Analyse forensique..."
        /opt/imena-gest/scripts/forensic-capture.sh
        
        echo "3. Notification RSSI..."
        /opt/imena-gest/scripts/security-alert.sh "$SEVERITY"
        ;;
        
    "data_corruption")
        echo "1. Arrêt immédiat services..."
        docker-compose -f docker-compose.production.yml stop
        
        echo "2. Sauvegarde état actuel..."
        /opt/imena-gest/scripts/emergency-backup.sh
        
        echo "3. Restauration dernière sauvegarde saine..."
        /opt/imena-gest/scripts/emergency-restore.sh
        ;;
esac

echo "✅ Procédure d'urgence terminée"
echo "📞 Contacter astreinte pour suivi"
```

### **Rollback d'Urgence**
```bash
#!/bin/bash
# /opt/imena-gest/scripts/emergency-rollback.sh

echo "🔄 ROLLBACK D'URGENCE"
echo "====================="

# Arrêt services
docker-compose -f docker-compose.production.yml stop

# Restauration version précédente
docker tag ghcr.io/your-org/imena-gest:previous ghcr.io/your-org/imena-gest:latest
sed -i 's/imena-gest:.*$/imena-gest:latest/' docker-compose.production.yml

# Restauration base de données
LATEST_BACKUP=$(ls -t /var/backups/imena-gest/database/ | head -1)
gunzip -c "/var/backups/imena-gest/database/$LATEST_BACKUP" | psql -h localhost -U imena_gest_user -d imena_gest

# Redémarrage
docker-compose -f docker-compose.production.yml start

echo "✅ Rollback terminé"
```

---

## 📞 **SUPPORT ET CONTACTS**

### **Support Technique 24/7**
- **Email**: support@imena-gest.com
- **Téléphone**: +33 1 XX XX XX XX
- **Ticket System**: https://support.imena-gest.com
- **Documentation**: https://docs.imena-gest.com

### **Escalade Incidents**
1. **Niveau 1**: Support technique (0-2h)
2. **Niveau 2**: Expertise avancée (2-4h)
3. **Niveau 3**: Développement core (4-8h)
4. **Niveau 4**: Architecture/Direction (8h+)

### **SLA Production**
- **Disponibilité**: 99.9% (8h46min/an maximum)
- **Temps de réponse**: < 2 secondes (95e percentile)
- **Résolution P1**: < 4 heures
- **Résolution P2**: < 24 heures
- **Résolution P3**: < 72 heures

---

> **📚 Documentation générée pour IMENA-GEST v1.0.0**  
> **Dernière mise à jour**: $(date +"%d/%m/%Y")  
> **Statut**: Production Ready ✅
