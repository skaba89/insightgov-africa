-- =============================================================================
-- InsightGov Africa - Script d'initialisation PostgreSQL
-- =============================================================================
-- Ce script est exécuté lors de la première création du conteneur PostgreSQL
-- =============================================================================

-- Créer l'extension UUID (nécessaire pour Prisma)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer l'extension pour les requêtes full-text
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Créer l'extension pour l'indexation avancée
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Configurer les paramètres par défaut pour la base
ALTER DATABASE insightgov SET timezone TO 'Africa/Conakry';
ALTER DATABASE insightgov SET client_encoding TO 'UTF8';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Base de données InsightGov Africa initialisée';
    RAISE NOTICE '📍 Timezone: Africa/Conakry';
    RAISE NOTICE '🔧 Extensions activées: uuid-ossp, pg_trgm, btree_gin';
END $$;
