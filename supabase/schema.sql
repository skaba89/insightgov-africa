-- =============================================================================
-- InsightGov Africa - Supabase SQL Schema
-- =============================================================================
-- Plateforme SaaS de génération de dashboards automatisés
-- Ce script crée toutes les tables nécessaires dans Supabase (PostgreSQL)
-- Version: 1.0.0
-- =============================================================================

-- =============================================================================
-- EXTENSIONS REQUISES
-- =============================================================================

-- Activer l'extension UUID pour générer des identifiants uniques
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Activer l'extension pour la recherche textuelle
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- TYPES ÉNUMÉRÉS
-- =============================================================================

-- Types d'organisation
CREATE TYPE organization_type AS ENUM (
    'ministry',    -- Ministère / Gouvernement
    'ngo',         -- ONG / Organisation Internationale
    'enterprise'   -- Entreprise Privée
);

-- Secteurs d'activité
CREATE TYPE sector_type AS ENUM (
    'health',        -- Santé
    'education',     -- Éducation
    'agriculture',   -- Agriculture
    'finance',       -- Finance
    'infrastructure', -- Infrastructure
    'energy',        -- Énergie
    'social',        -- Affaires Sociales
    'environment',   -- Environnement
    'trade',         -- Commerce
    'mining',        -- Mines & Ressources
    'transport',     -- Transport
    'telecom',       -- Télécommunications
    'other'          -- Autre
);

-- Niveaux d'abonnement
CREATE TYPE subscription_tier AS ENUM (
    'free',
    'starter',
    'professional',
    'enterprise'
);

-- Statut du dataset
CREATE TYPE dataset_status AS ENUM (
    'uploading',
    'pending',
    'analyzing',
    'ready',
    'error'
);

-- Types de fichiers
CREATE TYPE file_type AS ENUM (
    'csv',
    'xlsx',
    'xls'
);

-- Rôle utilisateur
CREATE TYPE user_role AS ENUM (
    'owner',
    'admin',
    'analyst',
    'viewer'
);

-- Statut abonnement
CREATE TYPE subscription_status AS ENUM (
    'active',
    'canceled',
    'expired',
    'past_due'
);

-- Format d'export
CREATE TYPE export_format AS ENUM (
    'pdf',
    'excel',
    'image'
);

-- =============================================================================
-- TABLE: organizations
-- =============================================================================
-- Organisation cliente (Ministère, ONG, Entreprise)
-- Chaque organisation peut avoir plusieurs utilisateurs et datasets

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type organization_type NOT NULL,
    sector sector_type NOT NULL,
    subscription_tier subscription_tier DEFAULT 'free',
    logo_url TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    phone VARCHAR(50),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT organizations_name_check CHECK (char_length(name) >= 2),
    CONSTRAINT organizations_email_check CHECK (website IS NULL OR website ~* '^https?://')
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_sector ON organizations(sector);
CREATE INDEX idx_organizations_subscription ON organizations(subscription_tier);
CREATE INDEX idx_organizations_country ON organizations(country);
CREATE INDEX idx_organizations_created_at ON organizations(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: users
-- =============================================================================
-- Utilisateurs de la plateforme
-- Liés à une organisation avec un rôle spécifique

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role user_role DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT true,
    email_verified TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Trigger updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: sessions
-- =============================================================================
-- Sessions d'authentification
-- Gestion des tokens de connexion

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- =============================================================================
-- TABLE: accounts
-- =============================================================================
-- Comptes OAuth pour les connexions externes
-- (Google, Microsoft, GitHub, etc.)

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,  -- 'google', 'microsoft', 'github'
    provider_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un provider ne peut être lié qu'une fois à un utilisateur
    CONSTRAINT accounts_provider_unique UNIQUE (provider, provider_id)
);

-- Index
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider);

-- =============================================================================
-- TABLE: datasets
-- =============================================================================
-- Fichiers de données uploadés par les utilisateurs
-- Contient les métadonnées des colonnes analysées par l'IA

CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,  -- Taille en bytes
    file_type file_type NOT NULL,
    row_count INTEGER DEFAULT 0,
    column_count INTEGER DEFAULT 0,
    columns_metadata JSONB DEFAULT '[]'::jsonb,  -- Array de ColumnMetadata
    status dataset_status DEFAULT 'pending',
    error_message TEXT,
    analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_datasets_organization ON datasets(organization_id);
CREATE INDEX idx_datasets_status ON datasets(status);
CREATE INDEX idx_datasets_created_at ON datasets(created_at DESC);
CREATE INDEX idx_datasets_file_type ON datasets(file_type);

-- Index GIN pour rechercher dans les métadonnées JSON
CREATE INDEX idx_datasets_metadata ON datasets USING GIN (columns_metadata);

-- Trigger updated_at
CREATE TRIGGER update_datasets_updated_at
    BEFORE UPDATE ON datasets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: kpis
-- =============================================================================
-- Configurations KPI générées par l'IA
-- Stocke la configuration JSON du dashboard

CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    config_json JSONB NOT NULL,  -- DashboardConfig complet
    is_published BOOLEAN DEFAULT false,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_kpis_dataset ON kpis(dataset_id);
CREATE INDEX idx_kpis_published ON kpis(is_published);
CREATE INDEX idx_kpis_generated_at ON kpis(generated_at DESC);

-- Index GIN pour rechercher dans la config JSON
CREATE INDEX idx_kpis_config ON kpis USING GIN (config_json);

-- Trigger updated_at
CREATE TRIGGER update_kpis_updated_at
    BEFORE UPDATE ON kpis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: subscriptions
// =============================================================================
-- Gestion des abonnements et facturation Paystack

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL,
    status subscription_status DEFAULT 'active',
    price DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'EUR',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',  -- 'monthly' | 'yearly'
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    paystack_customer_id VARCHAR(255),
    paystack_subscription_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_paystack ON subscriptions(paystack_subscription_id);

-- Trigger updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: report_exports
// =============================================================================
-- Historique des exports de rapports générés

CREATE TABLE report_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    format export_format NOT NULL,
    file_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'processing' | 'completed' | 'error'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_exports_dataset ON report_exports(dataset_id);
CREATE INDEX idx_exports_user ON report_exports(user_id);
CREATE INDEX idx_exports_status ON report_exports(status);
CREATE INDEX idx_exports_created_at ON report_exports(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
// =============================================================================
// Politiques de sécurité au niveau des lignes
// Les utilisateurs ne peuvent voir que les données de leur organisation

-- Activer RLS sur toutes les tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leur propre organisation
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Politique: Les owners/admins peuvent modifier leur organisation
CREATE POLICY "Admins can update organization" ON organizations
    FOR UPDATE USING (id IN (
        SELECT organization_id FROM users 
        WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

-- Politique: Les utilisateurs peuvent voir les utilisateurs de leur organisation
CREATE POLICY "Users can view org members" ON users
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Politique: Les utilisateurs peuvent voir les datasets de leur organisation
CREATE POLICY "Users can view org datasets" ON datasets
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Politique: Les utilisateurs peuvent créer des datasets
CREATE POLICY "Users can create datasets" ON datasets
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Politique: Les utilisateurs peuvent voir les KPIs de leur organisation
CREATE POLICY "Users can view org kpis" ON kpis
    FOR SELECT USING (dataset_id IN (
        SELECT id FROM datasets WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    ));

-- =============================================================================
// FONCTIONS UTILES
// =============================================================================

-- Fonction pour obtenir le nombre de datasets par organisation
CREATE OR REPLACE FUNCTION get_dataset_count(org_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM datasets WHERE organization_id = org_id);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir l'utilisation du stockage par organisation
CREATE OR REPLACE FUNCTION get_storage_usage(org_id UUID)
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COALESCE(SUM(file_size), 0) FROM datasets WHERE organization_id = org_id);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
// VIEWS
// =============================================================================

-- Vue: Résumé de l'organisation avec statistiques
CREATE VIEW organization_summary AS
SELECT 
    o.id,
    o.name,
    o.type,
    o.sector,
    o.subscription_tier,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT d.id) as dataset_count,
    COALESCE(SUM(d.file_size), 0) as total_storage_bytes,
    MAX(d.created_at) as last_dataset_upload
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
LEFT JOIN datasets d ON d.organization_id = o.id
GROUP BY o.id;

-- Vue: Datasets avec le nombre de KPIs
CREATE VIEW dataset_with_kpis AS
SELECT 
    d.*,
    COUNT(k.id) as kpi_count,
    MAX(k.generated_at) as last_kpi_generated
FROM datasets d
LEFT JOIN kpis k ON k.dataset_id = d.id
GROUP BY d.id;

-- =============================================================================
// DONNÉES INITIALES (SEED)
// =============================================================================

-- Insérer une organisation de démo
INSERT INTO organizations (id, name, type, sector, subscription_tier, country)
VALUES (
    uuid_generate_v4(),
    'Ministère de la Santé - Démo',
    'ministry',
    'health',
    'professional',
    'Sénégal'
);

-- =============================================================================
// FIN DU SCRIPT
// =============================================================================
