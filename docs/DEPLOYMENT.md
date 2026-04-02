# InsightGov Africa - Guide de Déploiement

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration de l'environnement](#configuration-de-lenvironnement)
3. [Base de données PostgreSQL](#base-de-données-postgresql)
4. [Services externes](#services-externes)
5. [Déploiement](#déploiement)
6. [Monitoring](#monitoring)
7. [Sécurité](#sécurité)

---

## Prérequis

### Logiciels requis
- **Node.js** 18+ ou **Bun** 1.0+
- **PostgreSQL** 14+ (ou service cloud)
- **Git**

### Comptes services externes
- [Groq](https://console.groq.com) - IA (gratuit)
- [Resend](https://resend.com) - Emails (gratuit pour débuter)
- [Paystack](https://paystack.com) - Paiements (Afrique)

---

## Configuration de l'environnement

### 1. Cloner le repository

```bash
git clone https://github.com/votre-org/insightgov-africa.git
cd insightgov-africa
bun install
```

### 2. Variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.production.example .env

# Éditer les variables
nano .env
```

### Variables obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Clé secrète | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL de l'app | `https://votre-domaine.com` |
| `GROQ_API_KEY` | Clé API Groq | `gsk_xxx...` |

### Variables optionnelles

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Envoi d'emails |
| `PAYSTACK_SECRET_KEY` | Paiements |
| `SENTRY_DSN` | Monitoring |

---

## Base de données PostgreSQL

### Option 1: Neon (Recommandé - Gratuit)

```bash
# 1. Créer un compte sur https://neon.tech
# 2. Créer un projet
# 3. Copier l'URL de connexion

DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
```

### Option 2: Railway

```bash
# 1. Créer un compte sur https://railway.app
# 2. Déployer PostgreSQL
# 3. Copier les variables

DATABASE_URL=postgresql://postgres:pass@xxx.railway.app:5432/railway
```

### Option 3: Supabase

```bash
# 1. Créer un projet sur https://supabase.com
# 2. Settings > Database > Connection string

DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
```

### Migration initiale

```bash
# Générer le client Prisma
bunx prisma generate

# Appliquer les migrations
bunx prisma migrate deploy

# Seeder les données initiales
bun run db:seed:prod
```

---

## Services externes

### Groq (IA)

1. Aller sur [console.groq.com](https://console.groq.com)
2. Créer une clé API
3. Configurer:

```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_votre_cle
AI_MODEL=llama-3.3-70b-versatile
```

### Resend (Emails)

1. Aller sur [resend.com](https://resend.com)
2. Créer une clé API
3. Vérifier votre domaine

```env
RESEND_API_KEY=re_votre_cle
EMAIL_FROM=InsightGov Africa <noreply@votre-domaine.com>
```

### Paystack (Paiements)

1. Aller sur [dashboard.paystack.com](https://dashboard.paystack.com)
2. Obtenir les clés API (Settings > Developer)
3. Configurer les webhooks

```env
# Mode test
PAYSTACK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Mode production
PAYSTACK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx
```

---

## Déploiement

### Option 1: Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

Configuration `vercel.json`:

```json
{
  "buildCommand": "bun run build",
  "installCommand": "bun install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "GROQ_API_KEY": "@groq_api_key"
  }
}
```

### Option 2: Railway

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Login et déployer
railway login
railway init
railway up
```

### Option 3: Docker

```bash
# Build
docker build -t insightgov-africa .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL=xxx \
  -e NEXTAUTH_SECRET=xxx \
  insightgov-africa
```

### Option 4: Serveur VPS

```bash
# 1. Installer Node.js/Bun
curl -fsSL https://bun.sh/install | bash

# 2. Cloner et installer
git clone https://github.com/votre-org/insightgov-africa.git
cd insightgov-africa
bun install

# 3. Configurer l'environnement
cp .env.production.example .env
nano .env

# 4. Build et démarrer
bun run build
bun run start

# 5. Configurer systemd (optionnel)
sudo nano /etc/systemd/system/insightgov.service
```

---

## Monitoring

### Sentry (Erreurs)

```bash
# Installer Sentry
bun add @sentry/nextjs

# Configurer
npx @sentry/wizard@latest -i nextjs
```

### Logs

```bash
# Vercel
vercel logs --follow

# Railway
railway logs

# Docker
docker logs -f container_id
```

---

## Sécurité

### Checklist de production

- [ ] HTTPS activé
- [ ] NEXTAUTH_SECRET unique et sécurisé
- [ ] Base de données avec SSL
- [ ] Variables d'environnement sécurisées
- [ ] Rate limiting configuré
- [ ] CORS configuré
- [ ] CSP headers activés
- [ ] Backups automatiques

### Headers de sécurité

Les headers sont configurés dans `src/lib/security.ts`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy
- Referrer-Policy

---

## Maintenance

### Mise à jour

```bash
# Pull les changements
git pull origin main

# Installer les dépendances
bun install

# Appliquer les migrations
bunx prisma migrate deploy

# Rebuild
bun run build

# Redémarrer
# (selon votre plateforme)
```

### Backups

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restaurer
psql $DATABASE_URL < backup_20240101.sql
```

---

## Support

- **Documentation**: `/docs`
- **Email**: support@insightgov.africa
- **GitHub Issues**: [Créer un ticket](https://github.com/votre-org/insightgov-africa/issues)
