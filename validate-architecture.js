/**
 * Script de validation de la nouvelle architecture
 * Vérifie que tous les fichiers sont présents et correctement structurés
 */

import fs from 'fs';
import path from 'path';

const requiredFiles = [
  // Services
  'src/services/storageService.ts',
  'src/services/patientService.ts',
  'src/services/hotLabService.ts',
  
  // Stores
  'src/stores/appStore.ts',
  'src/stores/patientStore.ts',
  'src/stores/hotLabStore.ts',
  
  // Hooks
  'src/hooks/useApp.ts',
  'src/hooks/usePatients.ts',
  'src/hooks/useHotLab.ts',
  'src/hooks/useDebounce.ts',
  'src/hooks/useVirtualization.ts',
  
  // Composants
  'src/components/ErrorBoundary.tsx',
  'src/components/optimized/MemoizedRoomsOverview.tsx',
  
  // App
  'src/App.new.tsx',
  'src/index.new.tsx',
  
  // Documentation
  'ARCHITECTURE-MIGRATION.md'
];

console.log('🔍 Validation de la nouvelle architecture IMENA-GEST...\n');

let allFilesExist = true;
let totalSize = 0;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(1);
    totalSize += stats.size;
    console.log(`✅ ${file} (${sizeKB} KB)`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
    allFilesExist = false;
  }
});

console.log(`\n📊 Statistiques:`);
console.log(`- Fichiers requis: ${requiredFiles.length}`);
console.log(`- Fichiers présents: ${requiredFiles.filter(f => fs.existsSync(f)).length}`);
console.log(`- Taille totale: ${(totalSize / 1024).toFixed(1)} KB`);

// Vérification de la structure
const directories = [
  'src/services',
  'src/stores', 
  'src/hooks',
  'src/components/optimized'
];

console.log(`\n📁 Structure des dossiers:`);
directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    console.log(`✅ ${dir}/ (${files.length} fichiers)`);
  } else {
    console.log(`❌ ${dir}/ - MANQUANT`);
    allFilesExist = false;
  }
});

// Vérification des dépendances
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = packageJson.dependencies || {};
  
  console.log(`\n📦 Dépendances requises:`);
  
  const requiredDeps = ['zustand', 'immer'];
  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`✅ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`❌ ${dep} - MANQUANT`);
      allFilesExist = false;
    }
  });
}

// Analyse du code
console.log(`\n🔬 Analyse du code:`);

// Compter les lignes de App.new.tsx vs App.tsx
if (fs.existsSync('src/App.new.tsx')) {
  const newAppContent = fs.readFileSync('src/App.new.tsx', 'utf8');
  const newAppLines = newAppContent.split('\n').length;
  console.log(`📏 App.new.tsx: ${newAppLines} lignes`);
  
  if (fs.existsSync('App.tsx')) {
    const oldAppContent = fs.readFileSync('App.tsx', 'utf8');
    const oldAppLines = oldAppContent.split('\n').length;
    console.log(`📏 App.tsx (ancien): ${oldAppLines} lignes`);
    console.log(`📈 Réduction: ${oldAppLines - newAppLines} lignes (${((oldAppLines - newAppLines) / oldAppLines * 100).toFixed(1)}%)`);
  }
}

// Vérifier la séparation des responsabilités
const serviceFiles = requiredFiles.filter(f => f.includes('services/')).filter(f => fs.existsSync(f));
const storeFiles = requiredFiles.filter(f => f.includes('stores/')).filter(f => fs.existsSync(f));
const hookFiles = requiredFiles.filter(f => f.includes('hooks/')).filter(f => fs.existsSync(f));

console.log(`\n🏗️ Séparation des responsabilités:`);
console.log(`📋 Services: ${serviceFiles.length} fichiers`);
console.log(`🗄️ Stores: ${storeFiles.length} fichiers`);  
console.log(`🎣 Hooks: ${hookFiles.length} fichiers`);

// Résultat final
console.log(`\n🎯 Résultat de la validation:`);
if (allFilesExist) {
  console.log(`✅ ARCHITECTURE VALIDE - Tous les fichiers sont présents`);
  console.log(`🚀 Prêt pour le test et déploiement`);
  process.exit(0);
} else {
  console.log(`❌ ARCHITECTURE INCOMPLÈTE - Fichiers manquants détectés`);
  console.log(`⚠️ Veuillez compléter l'implémentation avant le test`);
  process.exit(1);
}
