# Script de configuration de la base de données IMENA GEST
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration BDD IMENA GEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Variables de configuration
$dbName = "imena_gest"
$dbUser = "imena_user"
$dbPassword = "imena_password_2024"
$pgPassword = "postgres"

# Trouver psql.exe
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
    "C:\PostgreSQL\16\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        break
    }
}

# Si psql n'est pas trouvé dans les chemins standards, chercher dans PATH
if (-not $psqlPath) {
    $psqlCommand = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlCommand) {
        $psqlPath = $psqlCommand.Path
    }
}

if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL n'est pas installé ou psql n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer PostgreSQL d'abord." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL trouvé : $psqlPath" -ForegroundColor Green
Write-Host ""

# Fonction pour exécuter des commandes PostgreSQL
function Execute-PgCommand {
    param(
        [string]$Command,
        [string]$Database = "postgres"
    )
    
    $env:PGPASSWORD = $pgPassword
    & "$psqlPath" -U postgres -d $Database -c $Command 2>&1
    $env:PGPASSWORD = $null
}

# 1. Créer l'utilisateur
Write-Host "1️⃣ Création de l'utilisateur $dbUser..." -ForegroundColor Yellow
$createUserCmd = "CREATE USER $dbUser WITH PASSWORD '$dbPassword';"
$result = Execute-PgCommand -Command $createUserCmd
if ($result -match "already exists") {
    Write-Host "   ℹ️ L'utilisateur existe déjà" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ Utilisateur créé" -ForegroundColor Green
}

# 2. Créer la base de données
Write-Host ""
Write-Host "2️⃣ Création de la base de données $dbName..." -ForegroundColor Yellow
$createDbCmd = "CREATE DATABASE $dbName OWNER $dbUser;"
$result = Execute-PgCommand -Command $createDbCmd
if ($result -match "already exists") {
    Write-Host "   ℹ️ La base de données existe déjà" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ Base de données créée" -ForegroundColor Green
}

# 3. Donner tous les privilèges
Write-Host ""
Write-Host "3️⃣ Attribution des privilèges..." -ForegroundColor Yellow
Execute-PgCommand -Command "GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;" | Out-Null
Write-Host "   ✅ Privilèges attribués" -ForegroundColor Green

# 4. Créer le fichier .env
Write-Host ""
Write-Host "4️⃣ Création du fichier .env..." -ForegroundColor Yellow

$envContent = @"
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$dbName
DB_USER=$dbUser
DB_PASSWORD=$dbPassword

# JWT Secrets (GÉNÉRER DES CLÉS UNIQUES EN PRODUCTION)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars-imena-gest
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-imena-gest
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis Session Store (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Session Secret
SESSION_SECRET=your-session-secret-min-32-chars-imena-gest

# Application
NODE_ENV=development
PORT=3001
API_VERSION=v1
CORS_ORIGIN=http://localhost:5174

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Sécurité
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME_MINUTES=15

# Logs
LOG_LEVEL=info
LOG_FILE=logs/app.log

# SSL/TLS (Production)
SSL_KEY_PATH=
SSL_CERT_PATH=
SSL_CA_PATH=
"@

$envPath = "backend\.env"
$envContent | Out-File -FilePath $envPath -Encoding UTF8
Write-Host "   ✅ Fichier .env créé" -ForegroundColor Green

# 5. Test de connexion
Write-Host ""
Write-Host "5️⃣ Test de connexion..." -ForegroundColor Yellow
$env:PGPASSWORD = $dbPassword
$testResult = & "$psqlPath" -U $dbUser -d $dbName -c "SELECT version();" 2>&1
$env:PGPASSWORD = $null

if ($testResult -match "PostgreSQL") {
    Write-Host "   ✅ Connexion réussie !" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Configuration terminée avec succès !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Informations de connexion :" -ForegroundColor Cyan
    Write-Host "   Base de données : $dbName" -ForegroundColor White
    Write-Host "   Utilisateur : $dbUser" -ForegroundColor White
    Write-Host "   Mot de passe : $dbPassword" -ForegroundColor White
    Write-Host "   Host : localhost" -ForegroundColor White
    Write-Host "   Port : 5432" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Prochaines étapes :" -ForegroundColor Yellow
    Write-Host "   1. cd backend" -ForegroundColor White
    Write-Host "   2. npm run migrate" -ForegroundColor White
    Write-Host "   3. npm run seed (optionnel)" -ForegroundColor White
    Write-Host "   4. npm run dev" -ForegroundColor White
} else {
    Write-Host "   ❌ Échec de la connexion" -ForegroundColor Red
    Write-Host "   Erreur : $testResult" -ForegroundColor Red
}

