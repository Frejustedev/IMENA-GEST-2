#!/bin/bash
set -e

echo "🚀 Build IMENA-GEST pour Render"

# Installation avec legacy peer deps
echo "📦 Installation des dépendances..."
npm install --legacy-peer-deps

# Build du frontend
echo "🔨 Build du frontend..."
npm run build

echo "✅ Build terminé avec succès !"
