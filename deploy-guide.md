# 🚀 GUIDE DE DÉPLOIEMENT IMENA-GEST

## 🎯 **OPTION RECOMMANDÉE : VERCEL + RAILWAY**

### **📋 Prérequis**
- Compte GitHub (gratuit)
- Compte Vercel (gratuit)
- Compte Railway (gratuit 5$/mois)

---

## 🔧 **ÉTAPES DE DÉPLOIEMENT**

### **1. 📤 Préparer le Repository Git**

```bash
# Si pas encore fait, initialiser Git
git init
git add .
git commit -m "Initial commit - IMENA-GEST ready for deployment"

# Créer un repo GitHub et pousser
git remote add origin https://github.com/VOTRE_USERNAME/imena-gest.git
git branch -M main
git push -u origin main
```

### **2. 🚀 Déployer le Backend sur Railway**

1. **Aller sur** https://railway.app
2. **Se connecter** avec GitHub
3. **Cliquer "New Project"** → **"Deploy from GitHub repo"**
4. **Sélectionner** votre repository `imena-gest`
5. **Configurer les variables d'environnement** :
   ```
   NODE_ENV=production
   JWT_SECRET=votre_secret_jwt_super_securise_2024
   DB_PATH=./database.sqlite
   PORT=$PORT
   CORS_ORIGIN=https://votre-app.vercel.app
   ```
6. **Déployer** - Railway détecte automatiquement `backend-simple.cjs`
7. **Noter l'URL** générée (ex: `https://imena-gest-backend.up.railway.app`)

### **3. 🌐 Déployer le Frontend sur Vercel**

1. **Aller sur** https://vercel.com
2. **Se connecter** avec GitHub  
3. **Cliquer "New Project"**
4. **Importer** votre repository `imena-gest`
5. **Configurer** :
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
6. **Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend-railway.up.railway.app/api/v1
   ```
7. **Déployer** - Vercel build automatiquement

### **4. ✅ Configuration CORS Backend**

Mettre à jour la variable `CORS_ORIGIN` sur Railway avec l'URL Vercel :
```
CORS_ORIGIN=https://votre-app.vercel.app
```

---

## 🌍 **OPTION ALTERNATIVE : NETLIFY + SUPABASE**

### **Frontend sur Netlify**
1. **Connecter** repository à Netlify
2. **Build settings** : `npm run build` → `dist`
3. **Variables env** : `VITE_API_URL=https://votre-projet.supabase.co`

### **Backend sur Supabase**
1. **Créer projet** Supabase
2. **Activer** Database + Edge Functions
3. **Migrer** les tables SQLite vers PostgreSQL
4. **Déployer** les API comme Edge Functions

---

## 🏥 **OPTION PROFESSIONNELLE : AWS/AZURE**

### **Architecture Recommandée**
- **Frontend** : AWS S3 + CloudFront
- **Backend** : AWS ECS ou Azure Container Instances  
- **Database** : AWS RDS PostgreSQL ou Azure Database
- **Storage** : AWS S3 ou Azure Blob Storage

### **Coût Estimé**
- **Développement** : ~50€/mois
- **Production** : ~200-500€/mois (selon charge)

---

## 📊 **COMPARAISON DES OPTIONS**

| Critère | Vercel+Railway | Netlify+Supabase | AWS/Azure |
|---------|----------------|------------------|-----------|
| **Temps déploiement** | 15 min | 25 min | 2-4h |
| **Coût mensuel** | 0-20€ | 0-25€ | 50-500€ |
| **Complexité** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Conformité HDS** | ❌ | ❌ | ✅ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Facilité maintenance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

---

## 🎯 **RECOMMANDATION FINALE**

### **Pour Tests et Démo : VERCEL + RAILWAY** 🥇
- **Déploiement immédiat** en 15 minutes
- **Gratuit** pour commencer
- **URL publique** accessible partout
- **HTTPS automatique**
- **Monitoring inclus**

### **Pour Production Hospitalière : AWS/Azure** 🏥
- **Conformité** réglementaire HDS
- **Sécurité** niveau entreprise
- **Performance** garantie
- **Support** professionnel

---

## 📞 **SUPPORT DÉPLOIEMENT**

Si vous voulez que je vous guide étape par étape :

1. **🔄 Choisissez votre option** préférée
2. **📧 Je vous fournis** les commandes exactes
3. **🤝 Je vous accompagne** pendant le déploiement
4. **✅ Je teste** l'application déployée avec vous

**Quelle option préférez-vous pour commencer ?**
- 🚀 **Vercel + Railway** (rapide, gratuit)
- 🌐 **Netlify + Supabase** (alternative)
- ☁️ **AWS/Azure** (professionnel)
- 📱 **Autre plateforme** (Render, DigitalOcean, etc.)
