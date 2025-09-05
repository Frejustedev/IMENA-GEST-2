# Script d'installation directe PostgreSQL pour IMENA GEST
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation PostgreSQL 16 pour IMENA GEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# URL de téléchargement PostgreSQL 16
$postgresUrl = "https://get.enterprisedb.com/postgresql/postgresql-16.1-1-windows-x64.exe"
$installerPath = "$env:TEMP\postgresql-installer.exe"

# Vérifier si PostgreSQL est déjà installé
$pgInstalled = Test-Path "C:\Program Files\PostgreSQL\16\bin\psql.exe"
if ($pgInstalled) {
    Write-Host "✅ PostgreSQL 16 est déjà installé!" -ForegroundColor Green
    exit 0
}

Write-Host "📥 Téléchargement de PostgreSQL 16..." -ForegroundColor Yellow
Write-Host "   Cela peut prendre quelques minutes..." -ForegroundColor Gray

try {
    # Télécharger PostgreSQL
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $postgresUrl -OutFile $installerPath -UseBasicParsing
    $ProgressPreference = 'Continue'
    
    Write-Host "✅ Téléchargement terminé!" -ForegroundColor Green
    Write-Host ""
    
    # Instructions pour l'installation manuelle
    Write-Host "📋 Instructions d'installation :" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. L'installateur a été téléchargé dans : " -ForegroundColor Yellow
    Write-Host "   $installerPath" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Double-cliquez sur le fichier pour lancer l'installation" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Pendant l'installation, utilisez ces paramètres :" -ForegroundColor Yellow
    Write-Host "   - Port : 5432 (par défaut)" -ForegroundColor Green
    Write-Host "   - Mot de passe superuser : postgres" -ForegroundColor Green
    Write-Host "   - Locale : Default" -ForegroundColor Green
    Write-Host ""
    Write-Host "4. Après l'installation, exécutez :" -ForegroundColor Yellow
    Write-Host "   .\setup-database.ps1" -ForegroundColor Cyan
    Write-Host ""
    
    # Ouvrir l'explorateur avec le fichier
    explorer.exe "/select,$installerPath"
    
} catch {
    Write-Host "❌ Erreur lors du téléchargement : $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative : Téléchargez manuellement depuis :" -ForegroundColor Yellow
    Write-Host "https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
}
