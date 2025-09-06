#!/bin/bash
set -e

echo "🚀 Railway Build Script Starting..."

# Install dependencies with legacy peer deps
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build the frontend
echo "🔨 Building frontend..."
npm run build

echo "✅ Build completed successfully!"
