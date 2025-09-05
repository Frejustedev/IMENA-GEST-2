# Script d'installation PostgreSQL pour IMENA GEST
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation PostgreSQL pour IMENA GEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si l'utilisateur a les droits administrateur
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Ce script nécessite des privilèges administrateur." -ForegroundColor Red
    Write-Host "Veuillez relancer PowerShell en tant qu'administrateur." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Privilèges administrateur détectés" -ForegroundColor Green
Write-Host ""

# Option 1: Utiliser Chocolatey si disponible
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if ($chocoInstalled) {
    Write-Host "📦 Chocolatey détecté. Installation via Chocolatey..." -ForegroundColor Green
    choco install postgresql16 --yes --params '/Password:postgres'
    
    # Attendre que PostgreSQL soit installé
    Start-Sleep -Seconds 10
    
    # Ajouter PostgreSQL au PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
} else {
    Write-Host "📦 Chocolatey non détecté." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options d'installation :" -ForegroundColor Cyan
    Write-Host "1. Installer Chocolatey puis PostgreSQL (recommandé)" -ForegroundColor White
    Write-Host "2. Télécharger manuellement PostgreSQL" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Votre choix (1 ou 2)"
    
    if ($choice -eq "1") {
        # Installer Chocolatey
        Write-Host "Installation de Chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Rafraîchir l'environnement
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Installer PostgreSQL
        Write-Host "Installation de PostgreSQL..." -ForegroundColor Yellow
        choco install postgresql16 --yes --params '/Password:postgres'
    } else {
        Write-Host ""
        Write-Host "📥 Téléchargement manuel requis :" -ForegroundColor Yellow
        Write-Host "1. Visitez : https://www.postgresql.org/download/windows/" -ForegroundColor White
        Write-Host "2. Téléchargez PostgreSQL 16" -ForegroundColor White
        Write-Host "3. Lors de l'installation :" -ForegroundColor White
        Write-Host "   - Mot de passe postgres : postgres" -ForegroundColor Green
        Write-Host "   - Port : 5432 (par défaut)" -ForegroundColor Green
        Write-Host "4. Relancez ce script après installation" -ForegroundColor White
        exit 0
    }
}

Write-Host ""
Write-Host "✅ PostgreSQL installé !" -ForegroundColor Green
Write-Host ""

