# Guide de Déploiement - InsightGov Africa

## Table des matières

1. [Architecture](#architecture)
2. [Prérequis](#prérequis)
3. [Déploiement avec Docker](#déploiement-avec-docker)
4. [Déploiement sur Render](#déploiement-sur-render)
5. [Configuration des services](#configuration-des-services)
6. [Monitoring et logs](#monitoring-et-logs)
7. [Backup et restauration](#backup-et-restauration)
8. [Dépannage](#dépannage)

---

## Architecture

```
                        ┌─────────────────┐
                        │   Load Balancer │
                        │   (Render)      │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
        ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
        │  App #1   │      │  App #2   │      │  App #3   │
        │  Next.js  │      │  Next.js  │      │  Next.js  │
        │  :3000    │      │  :3000    │      │  :3000    │
        └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
        ┌─────▼─────┐                        ┌──────▼──────┐
        │ PostgreSQL│                        │    Redis    │
        │    :5432  │                        │    :6379    │
        │ Primary   │                        │   Cache     │
        └───────────┘                        └─────────────┘
```

### Composants

| Service | Role | Plan Render | Coût estimé |
|---------|------|-------------|-------------|
| Web Service | Application Next.js | Standard ($25/mois) | $25-75/mois |
| PostgreSQL | Base de données | Standard ($7/mois) | $7/mois |
| Redis | Cache et sessions | Starter (gratuit) | $0-15/mois |
| **Total** | | | **$32-97/mois** |

---

## Prérequis

### Outils requis

```bash
# Docker
docker --version  # Docker version 24.0+

# Docker Compose
docker-compose --version  # v2.20+

# Node.js (pour développement local)
node --version  # v18+

# CLI Render (optionnel)
npm install -g render-cli
```

### Comptes nécessaires

- [ ] Compte Render (render.com)
- [ ] Compte GitHub
- [ ] Clé API Groq (console.groq.com)
- [ ] Compte Orange Money Developer (optionnel)
- [ ] Compte MTN Money Developer (optionnel)
- [ ] Compte Africa's Talking (africastalking.com)
- [ ] Compte Resend (resend.com) pour les emails

---

## Déploiement avec Docker

### Développement local

```bash
# 1. Cloner le repository
git clone https://github.com/skaba89/insightgov-africa.git
cd insightgov-africa

# 2. Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Lancer avec Docker Compose
docker-compose up -d

# 4. Vérifier les services
docker-compose ps

# 5. Voir les logs
docker-compose logs -f app
```

### Production avec Docker

```bash
# Build production image
docker build -t insightgov-africa:latest .

# Run production container
docker run -d \
  --name insightgov-app \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://votre-domaine.com" \
  insightgov-africa:latest

# Avec Docker Compose Production
docker-compose -f docker-compose.prod.yml up -d
```

### Commandes Docker utiles

```bash
# Voir les logs
docker-compose logs -f app

# Redémarrer un service
docker-compose restart app

# Reconstruire après changement
docker-compose up -d --build app

# Arrêter tous les services
docker-compose down

# Supprimer les volumes (attention: perte de données)
docker-compose down -v

# Accéder au container
docker-compose exec app sh

# Exécuter les migrations
docker-compose exec app npx prisma migrate deploy

# Voir l'état des services
docker-compose ps
```

---

## Déploiement sur Render

### Méthode 1: Via le Dashboard Render

1. **Créer un compte** sur [render.com](https://render.com)

2. **Connecter GitHub**
   - Aller dans "Account Settings" → "Connected Accounts"
   - Autoriser l'accès au repository `skaba89/insightgov-africa`

3. **Créer une nouvelle ressource**
   - Cliquer sur "New" → "Blueprint"
   - Sélectionner le repository
   - Render détecte automatiquement le fichier `render.yaml`

4. **Configurer les variables sensibles**
   - Dans le dashboard, aller dans "Environment"
   - Ajouter les variables marquées `sync: false`:
     - `GROQ_API_KEY`
     - `ORANGE_MONEY_API_KEY`
     - `MTN_MONEY_API_KEY`
     - `AFRICAS_TALKING_API_KEY`
     - `RESEND_API_KEY`

5. **Déployer**
   - Cliquer sur "Apply"
   - Le déploiement commence automatiquement

### Méthode 2: Via Render CLI

```bash
# Installer Render CLI
npm install -g render-cli

# Se connecter
render login

# Déployer
render blueprint apply

# Voir les logs
render logs -f insightgov-africa
```

### Configuration du domaine personnalisé

1. Dans le dashboard Render, aller dans "Settings" → "Custom Domains"
2. Ajouter votre domaine (ex: `insightgov.africa`)
3. Configurer les DNS:
   ```
   Type: CNAME
   Name: www
   Value: insightgov-africa.onrender.com
   
   Type: ALIAS (ou A)
   Name: @
   Value: insightgov-africa.onrender.com
   ```

---

## Configuration des services

### Variables d'environnement essentielles

```env
# Base de données
DATABASE_URL=postgresql://user:password@host:5432/db

# Authentification
NEXTAUTH_SECRET=générer-avec-openssl-rand-base64-32
NEXTAUTH_URL=https://votre-domaine.com

# IA
AI_PROVIDER=groq
GROQ_API_KEY=gsk_xxxxx
AI_MODEL=llama-3.3-70b-versatile

# Application
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
NEXT_PUBLIC_APP_NAME=InsightGov Africa
```

### Configuration Orange Money (Guinée)

```env
# Orange Money API
ORANGE_MONEY_API_KEY=your_api_key
ORANGE_MONEY_API_SECRET=your_api_secret
ORANGE_MONEY_MERCHANT_CODE=YOUR_MERCHANT_CODE
ORANGE_MONEY_WEBHOOK_SECRET=your_webhook_secret
ORANGE_MONEY_ENVIRONMENT=production  # ou 'sandbox'
```

### Configuration MTN Money (Guinée)

```env
# MTN Money API
MTN_MONEY_API_KEY=your_api_key
MTN_MONEY_API_SECRET=your_api_secret
MTN_MONEY_MERCHANT_CODE=YOUR_MERCHANT_CODE
MTN_MONEY_WEBHOOK_SECRET=your_webhook_secret
MTN_MONEY_ENVIRONMENT=production  # ou 'sandbox'
```

### Configuration SMS Africa's Talking

```env
# Africa's Talking
AFRICAS_TALKING_API_KEY=ats_xxxxx
AFRICAS_TALKING_USERNAME=insightgov  # ou 'sandbox' pour les tests
AFRICAS_TALKING_SENDER_ID=InsightGov
SMS_PROVIDER=africas_talking
```

---

## Monitoring et logs

### Health Check

L'application expose un endpoint de santé:

```bash
curl https://votre-domaine.com/api/health
```

Réponse attendue:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2024-06-15T10:30:00Z"
}
```

### Logs Render

```bash
# Via CLI
render logs -f insightgov-africa

# Via Dashboard
# Dashboard → Service → Logs
```

### Sentry (Monitoring des erreurs)

1. Créer un projet sur [sentry.io](https://sentry.io)
2. Ajouter la variable d'environnement:
   ```env
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   SENTRY_ENVIRONMENT=production
   ```

### Métriques Render

Le dashboard Render fournit:
- CPU usage
- Memory usage
- Request count
- Response time

---

## Backup et restauration

### Backup automatique (Render)

Render effectue des backups quotidiens automatiques pour PostgreSQL (plan Standard+).

### Backup manuel

```bash
# Via script
./scripts/backup.sh

# Via Docker
docker-compose exec postgres pg_dump -U insightgov insightgov > backup.sql

# Via Render CLI
render database:backup insightgov-db
```

### Restauration

```bash
# Restaurer depuis un fichier
docker-compose exec -T postgres psql -U insightgov insightgov < backup.sql

# Via Render
render database:restore insightgov-db --from-backup <backup-id>
```

---

## Dépannage

### Erreur: "Database connection failed"

**Cause**: La base de données n'est pas prête.

**Solution**:
```bash
# Vérifier l'état de la DB
docker-compose ps postgres

# Attendre que la DB soit healthy
docker-compose up -d --wait postgres

# Vérifier les logs
docker-compose logs postgres
```

### Erreur: "Prisma Client not found"

**Cause**: Le client Prisma n'a pas été généré.

**Solution**:
```bash
# Générer le client
docker-compose exec app npx prisma generate

# Ou rebuild le container
docker-compose up -d --build app
```

### Erreur: "Memory limit exceeded"

**Cause**: L'application consomme trop de mémoire.

**Solution**:
1. Augmenter la mémoire allouée dans Render
2. Optimiser les requêtes Prisma
3. Vérifier les fuites mémoire

### Erreur: "502 Bad Gateway"

**Cause**: L'application ne répond pas.

**Solution**:
```bash
# Vérifier les logs
docker-compose logs app

# Redémarrer
docker-compose restart app

# Vérifier le health check
curl http://localhost:3000/api/health
```

### Logs utiles

```bash
# Logs application
docker-compose logs -f app --tail=100

# Logs base de données
docker-compose logs -f postgres --tail=50

# Logs nginx
docker-compose logs -f nginx --tail=50

# Logs redis
docker-compose logs -f redis --tail=20
```

---

## Commandes de maintenance

```bash
# Migration de base de données
docker-compose exec app npx prisma migrate deploy

# Seed de la base (données initiales)
docker-compose exec app npx prisma db seed

# Reset complet (attention!)
docker-compose exec app npx prisma migrate reset

# Regénérer le client Prisma
docker-compose exec app npx prisma generate

# Ouvrir Prisma Studio
docker-compose exec app npx prisma studio
```

---

## Support

- **Documentation**: `/docs`
- **GitHub Issues**: [github.com/skaba89/insightgov-africa/issues](https://github.com/skaba89/insightgov-africa/issues)
- **Email**: support@insightgov.africa

---

*Dernière mise à jour: Juin 2024*
