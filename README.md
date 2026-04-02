# InsightGov Africa

**Plateforme SaaS de Data Visualization et Analytics pour l'Afrique**

InsightGov Africa est une plateforme no-code permettant aux ministères, ONGs et entreprises africaines de transformer automatiquement leurs données en tableaux de bord interactifs grâce à l'IA.

## 🚀 Fonctionnalités

### Core Features
- **Upload Intelligent** - Import CSV/Excel avec détection automatique des types de données
- **Analyse IA** - Groq AI analyse vos données et génère des KPIs pertinents
- **Dashboards Automatiques** - 8 types de graphiques générés automatiquement
- **Export Multi-format** - PDF professionnel et Excel avec mise en forme

### AI Automation
- **Requêtes en Langage Naturel** - Posez des questions en français/anglais sur vos données
- **Nettoyage Automatique** - Détection et correction des anomalies
- **Insights Prédictifs** - Projections et tendances basées sur l'IA
- **Assistant Chat** - Assistant IA pour explorer vos données

### Business Features
- **Authentification** - NextAuth.js avec credentials et OAuth
- **Paiements** - Intégration Paystack pour l'Afrique
- **API REST** - Accès programmatique à vos données
- **Collaboration** - Commentaires et notifications en temps réel
- **Templates** - Galerie de modèles de rapports prédéfinis

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 16)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Onboarding │  │  Dashboard  │  │   Export    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (Next.js)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ /upload │ │/analyze │ │ /kpis   │ │ /export │ │ /ai/*   │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │    Groq AI      │ │    Paystack     │
│   + NextAuth    │ │  (LLaMA 3.3)    │ │   (Payments)    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Charts | Tremor.so, Recharts |
| State | Zustand, React Context |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Neon, Railway, etc.) |
| Auth | NextAuth.js |
| AI | **Groq** (LLaMA 3.3 70B) |
| Payments | Paystack |
| Export | @react-pdf/renderer, xlsx |
| Deployment | **Render** |

## 📁 Structure du Projet

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Pages d'authentification
│   ├── (dashboard)/         # Routes protégées
│   ├── api/                 # API Routes
│   │   ├── ai/              # Endpoints IA (Groq)
│   │   ├── datasets/        # CRUD datasets
│   │   ├── export/          # Export PDF/Excel
│   │   └── auth/            # NextAuth endpoints
│   └── page.tsx             # Page d'accueil
├── components/              # Composants React
├── contexts/                # React Contexts
├── lib/                     # Services & Utilitaires
│   ├── ai/                  # Intégration Groq
│   ├── auth.ts              # Configuration NextAuth
│   └── db.ts                # Prisma Client
├── stores/                  # Zustand Stores
└── types/                   # Types TypeScript
```

---

## 🐳 Démarrage avec Docker (Recommandé)

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé
- Clé API [Groq](https://console.groq.com) (gratuite)

### Installation en 3 étapes

#### 1. Cloner le projet
```bash
git clone https://github.com/skaba89/insightgov-africa.git
cd insightgov-africa
```

#### 2. Configurer les variables
```bash
# Créer le fichier .env
cp .env.example .env

# Éditer et ajouter votre clé Groq
# GROQ_API_KEY=gsk_votre_cle_api
```

#### 3. Lancer avec Docker

**Windows (PowerShell) :**
```powershell
# Démarrer tous les services
.\docker-start.bat start

# Initialiser la base de données
.\docker-start.bat setup
```

**Linux/macOS :**
```bash
# Démarrer tous les services
chmod +x docker-start.sh
./docker-start.sh start

# Initialiser la base de données
./docker-start.sh setup
```

### 🎉 C'est prêt !

- **Application** : http://localhost:3000
- **Admin Base de Données** : http://localhost:8080

### Commandes Docker

| Commande | Description |
|----------|-------------|
| `docker-start start` | Démarrer les services |
| `docker-start stop` | Arrêter les services |
| `docker-start rebuild` | Reconstruire les conteneurs |
| `docker-start logs` | Voir les logs |
| `docker-start clean` | Nettoyer tout |

---

## 💻 Développement Local (sans Docker)

### Prérequis
- Node.js 18+ ou Bun
- Base de données PostgreSQL (Neon, Railway, local)
- Compte Groq (gratuit)

### Installation

```bash
# Cloner
git clone https://github.com/skaba89/insightgov-africa.git
cd insightgov-africa

# Installer
bun install

# Configurer
cp .env.example .env.local
# Éditez .env.local avec vos clés

# Initialiser la base de données
bunx prisma migrate dev

# Lancer
bun dev
```

### Variables d'environnement requises

```env
# Base de données PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/db

# Authentification
NEXTAUTH_SECRET=votre_secret_tres_long
NEXTAUTH_URL=http://localhost:3000

# IA (Groq - Gratuit)
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
```

---

## 📊 Types de Graphiques

| Type | Description | Use Case |
|------|-------------|----------|
| Line Chart | Évolution temporelle | Tendances |
| Bar Chart | Comparaisons | Données catégorielles |
| Pie Chart | Proportions | Répartition |
| Area Chart | Volume temporel | Cumuls |
| Scatter Plot | Corrélations | Relations |
| Radar Chart | Multi-dimensionnel | KPIs multiples |
| Treemap | Hiérarchies | Structure |
| Gauge | Indicateurs | Performance |

## 🚀 Déploiement sur Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/skaba89/insightgov-africa)

1. Cliquez sur le bouton ci-dessus
2. Connectez votre GitHub
3. Configurez les variables d'environnement
4. Déployez !

Voir [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) pour plus de détails.

## 💰 Tarification

| Plan | Prix | Fonctionnalités |
|------|------|-----------------|
| Starter | $49/mois | 5 datasets, 10K lignes |
| Professional | $149/mois | 25 datasets, API |
| Enterprise | Sur devis | Illimité |

## 💰 Coûts d'infrastructure

| Service | Coût |
|---------|------|
| Render (Starter) | **Gratuit** |
| Neon PostgreSQL | **Gratuit** |
| Groq (Free Tier) | **Gratuit** |
| **Total** | **0€/mois** |

## 📖 Documentation

- [Guide de Setup](docs/SETUP.md)
- [Guide de Déploiement](docs/DEPLOYMENT.md)

## 🤝 Contribution

```bash
# Fork le projet
git checkout -b feature/amazing-feature

# Commit
git commit -m 'Add amazing feature'

# Push
git push origin feature/amazing-feature

# Ouvrir une Pull Request
```

## 📄 Licence

MIT License

## 📞 Contact

- **Email**: contact@insightgov.africa
- **GitHub**: https://github.com/skaba89/insightgov-africa

---

Développé avec ❤️ pour l'Afrique
