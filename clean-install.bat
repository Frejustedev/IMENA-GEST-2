@echo off
echo 🧹 Nettoyage complet...

REM Supprimer node_modules et package-lock.json
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo 📦 Installation propre...
npm cache clean --force
npm install --legacy-peer-deps

echo 🔨 Build...
npm run build

echo ✅ Terminé !
pause
