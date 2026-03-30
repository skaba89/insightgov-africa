# Guide de Configuration - InsightGov Africa

Ce guide vous accompagne dans la configuration complète du projet InsightGov Africa avec **Render**, **PostgreSQL** et **Groq AI**.

## 📋 Prérequis

- Node.js 18+ ou Bun
- Base de données PostgreSQL (Neon, Railway, ou locale)
- Compte [Groq](https://console.groq.com) (gratuit)
- Compte [Render](https://render.com) (pour le déploiement)
- Compte [Paystack](https://paystack.com) (optionnel, pour les paiements)

---

## 1. Configuration PostgreSQL

### Option A : Neon (Recommandé - Gratuit)

Neon offre une base de données PostgreSQL serverless gratuite, parfaite pour démarrer.

#### Étape 1.1 : Créer un compte Neon

1. Allez sur [neon.tech](https://neon.tech)
2. Cliquez sur **"Sign up"**
3. Connectez-vous avec GitHub ou email

#### Étape 1.2 : Créer un projet

1. Cliquez sur **"Create a project"**
2. Remplissez les informations :
   - **Name** : `insightgov-africa`
   - **Region** : `AWS Europe (Frankfurt)` - le plus proche de l'Afrique
3. Cliquez sur **"Create project"**

#### Étape 1.3 : Récupérer la chaîne de connexion

1. Dans le dashboard, copiez la **Connection string**
2. Elle ressemble à : `postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

### Option B : Railway

1. Allez sur [railway.app](https://railway.app)
2. Créez un compte et un projet
3. Ajoutez une base de données PostgreSQL
4. Copiez la variable `DATABASE_URL`

### Option C : PostgreSQL Local

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
sudo -u postgres createdb insightgov
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'votre_mot_de_passe';"

# macOS (Homebrew)
brew install postgresql
brew services start postgresql
createdb insightgov

# Variable d'environnement
DATABASE_URL=postgresql://postgres:votre_mot_de_passe@localhost:5432/insightgov
```

---

## 2. Configuration NextAuth.js

### Étape 2.1 : Générer une clé secrète

```bash
# Linux/macOS
openssl rand -base64 32

# Ou utilisez un générateur en ligne
```

### Étape 2.2 : Configurer les variables

```env
NEXTAUTH_SECRET=votre_secret_genere_ici
NEXTAUTH_URL=http://localhost:3000
```

En production, remplacez `NEXTAUTH_URL` par votre domaine :
```env
NEXTAUTH_URL=https://votre-app.onrender.com
```

---

## 3. Configuration Groq AI (Gratuit)

Groq est **gratuit**, **ultra-rapide** et parfait pour démarrer !

### Étape 3.1 : Créer un compte Groq

1. Allez sur [console.groq.com](https://console.groq.com)
2. Connectez-vous avec Google ou GitHub
3. C'est gratuit !

### Étape 3.2 : Créer une clé API

1. Allez dans **API Keys** > **Create API Key**
2. Nommez-la : `insightgov-africa`
3. Copiez la clé (commence par `gsk-...`)

### Étape 3.3 : Modèles disponibles

Groq utilise des modèles Llama et Mixtral :

| Modèle | Description | Usage |
|--------|-------------|-------|
| `llama-3.3-70b-versatile` | Le plus polyvalent | **Recommandé** |
| `llama-3.1-8b-instant` | Le plus rapide | Tâches simples |
| `mixtral-8x7b-32768` | Grande fenêtre de contexte | Documents longs |

---

## 4. Configuration Paystack (Optionnel)

### Étape 4.1 : Créer un compte Paystack

1. Allez sur [paystack.com](https://paystack.com)
2. Créez un compte business
3. Complétez la vérification du compte

### Étape 4.2 : Récupérer les clés API

1. Allez dans **Settings** > **API Keys & Webhooks**
2. Copiez :
   - **Public Key** : `pk_test_...` (test) ou `pk_live_...` (production)
   - **Secret Key** : `sk_test_...` (test) ou `sk_live_...` (production)

### Étape 4.3 : Configurer les Webhooks

1. Dans **Settings** > **API Keys & Webhooks**
2. Ajoutez un webhook :
   - **URL** : `https://votre-domaine.onrender.com/api/paystack/webhook`
   - **Events** : Sélectionnez `charge.success`, `subscription.create`

---

## 5. Variables d'Environnement

### Étape 5.1 : Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet :

```bash
cp .env.example .env.local
```

### Étape 5.2 : Remplir les variables

```env
# ============================================
# DATABASE (PostgreSQL)
# ============================================
DATABASE_URL=postgresql://user:password@host.neon.tech/neondb?sslmode=require

# ============================================
# NEXTAUTH.JS
# ============================================
NEXTAUTH_SECRET=votre_secret_tres_long_et_securise
NEXTAUTH_URL=http://localhost:3000

# ============================================
# AI PROVIDER
# ============================================
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
AI_MODEL=llama-3.3-70b-versatile

# ============================================
# PAYSTACK (Optionnel)
# ============================================
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=InsightGov Africa
```

---

## 6. Installation Locale

```bash
# Cloner le repository
git clone https://github.com/skaba89/insightgov-africa.git
cd insightgov-africa

# Installer les dépendances
bun install
# ou
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env.local
# Éditez .env.local avec vos valeurs

# Initialiser la base de données
bunx prisma migrate dev
# ou
npx prisma migrate dev

# Lancer en développement
bun dev
# ou
npm run dev
```

Le site sera disponible sur : **http://localhost:3000**

---

## 7. Déploiement sur Render

### Étape 7.1 : Préparer le repository

1. Forkez le repository sur votre GitHub
2. Assurez-vous que le fichier `render.yaml` est présent

### Étape 7.2 : Créer le service sur Render

1. Allez sur [render.com](https://render.com)
2. **New** > **Blueprint**
3. Connectez votre GitHub
4. Sélectionnez le repository `insightgov-africa`
5. Render détectera automatiquement `render.yaml`

### Étape 7.3 : Configurer les variables d'environnement

Dans le Blueprint, ajoutez :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `postgresql://...` (de Neon) |
| `NEXTAUTH_SECRET` | Votre secret généré |
| `NEXTAUTH_URL` | `https://votre-app.onrender.com` |
| `GROQ_API_KEY` | `gsk-...` |
| `PAYSTACK_SECRET_KEY` | `sk_test_...` (optionnel) |

### Étape 7.4 : Déployer

1. Cliquez sur **Apply**
2. Attendez 5-10 minutes (le build Docker prend du temps)
3. Votre site est en ligne ! 🎉

---

## 8. Configuration Post-Déploiement

### Vérifier le déploiement

```bash
curl https://votre-app.onrender.com/api
```

Réponse attendue :
```json
{
  "status": "ok",
  "checks": {
    "database": "connected",
    "ai": "groq_configured"
  }
}
```

### Initialiser la base de données en production

Si les tables ne sont pas créées automatiquement :

```bash
# En local, avec la DATABASE_URL de production
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## 9. Vérification

### Checklist de déploiement

- [ ] PostgreSQL : Base de données créée sur Neon/Railway
- [ ] DATABASE_URL : Copiée dans les variables
- [ ] NextAuth : Secret généré et configuré
- [ ] Groq : Compte créé et clé API récupérée
- [ ] Variables d'environnement : Toutes configurées
- [ ] Render : Service créé et déployé
- [ ] Migration : Base de données initialisée

### Test de l'application

1. **Page d'accueil** : Accessible
2. **Inscription** : Fonctionne
3. **Connexion** : Fonctionne
4. **Upload CSV** : Fonctionne
5. **Analyse IA** : Groq génère des KPIs
6. **Export PDF** : Fonctionne

---

## 🆘 Dépannage

### Erreur : "GROQ_API_KEY not found"
- Vérifiez que la clé est correctement copiée
- Vérifiez qu'elle commence par `gsk_`

### Erreur : "Database connection failed"
- Vérifiez la chaîne DATABASE_URL
- Vérifiez que la base n'est pas en pause (Neon free tier)
- Vérifiez les IP autorisées (Neon autorise tout par défaut)

### Erreur : "Authentication failed"
- Vérifiez NEXTAUTH_SECRET et NEXTAUTH_URL
- Vérifiez que NEXTAUTH_URL correspond à votre domaine

### Erreur : "Prisma Client not found"
- Exécutez `npx prisma generate`
- En production, le build le fait automatiquement

### Build failed sur Render
- Consultez les logs : Render > Service > Logs
- Vérifiez que toutes les variables sont définies
- Vérifiez le Dockerfile

---

## 💰 Coûts

| Service | Plan | Coût mensuel |
|---------|------|--------------|
| Render | Starter | **Gratuit** |
| Neon | Free | **Gratuit** |
| Groq | Free Tier | **Gratuit** |
| Paystack | Standard | Commission uniquement |

**Total : 0€/mois pour démarrer** 🎉

---

## 📞 Support

- **GitHub Issues** : https://github.com/skaba89/insightgov-africa/issues
- **Documentation Render** : https://render.com/docs
- **Documentation Groq** : https://console.groq.com/docs
- **Documentation Neon** : https://neon.tech/docs
