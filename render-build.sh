#!/bin/bash
echo "🚀 Build IMENA-GEST pour Render"

# Installation avec legacy peer deps
echo "📦 Installation des dépendances..."
npm install --legacy-peer-deps

# Build du frontend
echo "🔨 Build du frontend..."
npm run build

# Vérification que dist existe
if [ -d "dist" ]; then
    echo "✅ Build réussi - dossier dist créé"
    ls -la dist/
else
    echo "❌ Erreur - dossier dist non créé"
    exit 1
fi

echo "✅ Build terminé avec succès !"
