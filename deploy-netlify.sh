#!/bin/bash

echo "🚀 Déploiement IMENA-GEST sur Netlify"

# Installation des dépendances avec legacy peer deps
echo "📦 Installation des dépendances..."
npm install --legacy-peer-deps

# Build de l'application
echo "🔨 Build de l'application..."
npm run build

# Déploiement sur Netlify
echo "🌐 Déploiement sur Netlify..."
npx netlify-cli deploy --prod --dir=dist

echo "✅ Déploiement terminé !"
