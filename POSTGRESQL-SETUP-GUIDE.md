# 🐘 Guide d'installation PostgreSQL pour IMENA GEST

## 📋 Option 1 : Installation Automatique (Recommandée)

### Prérequis
- Windows 10/11
- PowerShell en mode Administrateur

### Étapes

1. **Ouvrir PowerShell en tant qu'administrateur**
   - Clic droit sur le menu Démarrer
   - Sélectionner "Windows PowerShell (Admin)"

2. **Exécuter le script d'installation**
   ```powershell
   .\install-postgresql.ps1
   ```

3. **Configurer la base de données**
   ```powershell
   .\setup-database.ps1
   ```

---

## 📋 Option 2 : Installation Manuelle

### 1. Télécharger PostgreSQL

1. Visitez : https://www.postgresql.org/download/windows/
2. Cliquez sur "Download the installer"
3. Choisissez **PostgreSQL 16** pour Windows x86-64

### 2. Installer PostgreSQL

Lors de l'installation :
- **Port** : 5432 (par défaut)
- **Mot de passe superuser** : `postgres`
- **Locale** : French, France

### 3. Créer la base de données

Après l'installation, ouvrez **pgAdmin 4** ou **SQL Shell (psql)** :

```sql
-- Se connecter en tant que postgres
-- Mot de passe : postgres

-- Créer l'utilisateur
CREATE USER imena_user WITH PASSWORD 'imena_password_2024';

-- Créer la base de données
CREATE DATABASE imena_gest OWNER imena_user;

-- Donner les privilèges
GRANT ALL PRIVILEGES ON DATABASE imena_gest TO imena_user;
```

### 4. Créer le fichier .env

Créez le fichier `backend/.env` avec ce contenu :

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=imena_gest
DB_USER=imena_user
DB_PASSWORD=imena_password_2024

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars-imena-gest
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-imena-gest
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=development
PORT=3001
API_VERSION=v1
CORS_ORIGIN=http://localhost:5174

# Autres configurations...
```

---

## 🚀 Lancer l'application

### 1. Installer les dépendances du backend
```bash
cd backend
npm install
```

### 2. Lancer les migrations
```bash
npm run migrate
```

### 3. (Optionnel) Ajouter des données de test
```bash
npm run seed
```

### 4. Démarrer le serveur backend
```bash
npm run dev
```

### 5. Dans un nouveau terminal, démarrer le frontend
```bash
cd ..
npm run dev
```

---

## 🔧 Dépannage

### PostgreSQL n'est pas reconnu
Ajoutez PostgreSQL au PATH :
1. Variables d'environnement système
2. Modifier PATH
3. Ajouter : `C:\Program Files\PostgreSQL\16\bin`

### Erreur de connexion
Vérifiez :
- PostgreSQL est démarré (services Windows)
- Les identifiants dans `.env` sont corrects
- Le port 5432 n'est pas bloqué

### Permission denied
- Assurez-vous que l'utilisateur `imena_user` a les bons privilèges
- Relancez le script `setup-database.ps1`

---

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. **Backend** : http://localhost:3001/health
2. **Frontend** : http://localhost:5174
3. **Connexion** : test@imena-gest.com / password123

