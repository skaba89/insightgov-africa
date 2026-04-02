# Guide de Déploiement - InsightGov Africa

## 🚀 Option 1 : Vercel (Recommandé)

### Prérequis
- Compte Vercel (vercel.com)
- Repository GitHub

### Étapes

1. **Connecter le repository**
   ```bash
   # Installer Vercel CLI
   npm i -g vercel

   # Se connecter
   vercel login

   # Déployer
   vercel
   ```

2. **Configurer les variables d'environnement** (Vercel Dashboard)

   ```env
   # Database
   DATABASE_URL="postgresql://..."

   # NextAuth
   NEXTAUTH_SECRET="votre-secret-32-caracteres"
   NEXTAUTH_URL="https://votre-domaine.vercel.app"

   # OAuth Google (optionnel)
   GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

   # OAuth GitHub (optionnel)
   GITHUB_CLIENT_ID="Iv1.xxx"
   GITHUB_CLIENT_SECRET="xxx"

   # Paystack
   PAYSTACK_SECRET_KEY="sk_live_xxx"
   PAYSTACK_PUBLIC_KEY="pk_live_xxx"

   # IA
   ZAI_API_KEY="votre-cle-z-ai"
   ```

3. **Base de données Supabase**
   - Créer un projet sur supabase.com
   - Copier l'URL de connexion PostgreSQL
   - Exécuter les migrations :
   ```bash
   npx prisma db push
   ```

---

## 🚂 Option 2 : Railway

### Prérequis
- Compte Railway (railway.app)
- Repository GitHub

### Étapes

1. **Créer un nouveau projet**
   ```bash
   # Installer Railway CLI
   npm i -g @railway/cli

   # Se connecter
   railway login

   # Initialiser
   railway init
   ```

2. **Ajouter PostgreSQL**
   ```bash
   railway add --plugin postgresql
   ```

3. **Configurer les variables**
   ```bash
   railway variables set NEXTAUTH_SECRET="xxx"
   railway variables set PAYSTACK_SECRET_KEY="xxx"
   # ... etc
   ```

4. **Déployer**
   ```bash
   railway up
   ```

---

## 🐳 Option 3 : Docker / VPS

### Avec Docker Compose

```bash
# Cloner le repository
git clone https://github.com/skaba89/insightgov-africa.git
cd insightgov-africa

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Lancer
docker-compose up -d

# L'application est disponible sur http://localhost:3000
```

### Sur un VPS (Ubuntu)

```bash
# Installer Docker
curl -fsSL https://get.docker.com | sh

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cloner et configurer
git clone https://github.com/skaba89/insightgov-africa.git
cd insightgov-africa

# Variables d'environnement
cp .env.example .env
nano .env

# Build et démarrage
docker-compose -f docker-compose.yml up -d --build

# Configurer Nginx (optionnel)
sudo apt install nginx
sudo nano /etc/nginx/sites-available/insightgov.africa
```

**Configuration Nginx :**
```nginx
server {
    listen 80;
    server_name insightgov.africa www.insightgov.africa;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📧 Configuration Email (Resend)

1. Créer un compte sur resend.com
2. Obtenir une clé API
3. Configurer :
   ```env
   RESEND_API_KEY="re_xxx"
   EMAIL_FROM="InsightGov Africa <noreply@insightgov.africa>"
   ```

---

## 🔐 Configuration OAuth

### Google OAuth

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un projet ou sélectionner un existant
3. APIs & Services → Credentials → Create Credentials → OAuth client ID
4. Application type: Web application
5. Authorized redirect URIs:
   - `https://votre-domaine.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (dev)
6. Copier Client ID et Client Secret

### GitHub OAuth

1. Aller sur GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Homepage URL: `https://votre-domaine.com`
3. Authorization callback URL: `https://votre-domaine.com/api/auth/callback/github`
4. Copier Client ID et générer un Client Secret

---

## 💳 Configuration Paystack (Production)

1. Créer un compte business sur paystack.com
2. Compléter la vérification du compte
3. Settings → API Keys & Webhooks
4. Copier les clés Live (pas Test)
5. Configurer le webhook:
   - URL: `https://votre-domaine.com/api/payments/webhook`
   - Events: `charge.success`, `subscription.create`

---

## ✅ Checklist Pré-Déploiement

- [ ] Base de données PostgreSQL configurée
- [ ] Variables d'environnement définies
- [ ] NextAuth secret généré (32+ caractères)
- [ ] OAuth configuré (si utilisé)
- [ ] Paystack configuré (si paiements réels)
- [ ] Domaine personnalisé configuré
- [ ] SSL/HTTPS activé
- [ ] Emails configurés (Resend)

---

## 🔍 Monitoring

### Logs Vercel
```bash
vercel logs
```

### Logs Railway
```bash
railway logs
```

### Logs Docker
```bash
docker-compose logs -f app
```

---

## 🆘 Support

- **Documentation Next.js**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Paystack Docs**: https://paystack.com/docs
