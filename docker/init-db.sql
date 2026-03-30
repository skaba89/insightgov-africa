-- =============================================================================
-- InsightGov Africa - PostgreSQL Initialization
-- =============================================================================
-- This runs automatically when PostgreSQL container starts for the first time
-- =============================================================================

-- Already created by POSTGRES_DB env var
-- CREATE DATABASE insightgov;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE insightgov TO insightgov;

-- Connect to the database
\c insightgov;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO insightgov;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'InsightGov Africa database initialized successfully!';
END
$$;
