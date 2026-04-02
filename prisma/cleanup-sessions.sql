-- =============================================================================
-- InsightGov Africa - PostgreSQL Session Cleanup Script
-- =============================================================================
-- Ce script nettoie les sessions expirées et les anciens tokens.
-- À exécuter régulièrement via cron job.
--
-- Utilisation:
--   npx prisma db execute --file=./prisma/cleanup-sessions.sql --schema=./prisma/schema.prisma
-- =============================================================================

BEGIN;

-- Nettoyer les sessions expirées
DELETE FROM "Session"
WHERE "expires" < NOW();

-- Nettoyer les tokens de vérification expirés
DELETE FROM "VerificationToken"
WHERE "expires" < NOW();

-- Nettoyer les anciennes tentatives de login (ActivityLog plus de 30 jours)
DELETE FROM "ActivityLog"
WHERE "action" = 'login_failed'
  AND "createdAt" < NOW() - INTERVAL '30 days';

-- Nettoyer les anciens logs d'activité (plus de 90 jours)
DELETE FROM "ActivityLog"
WHERE "createdAt" < NOW() - INTERVAL '90 days';

-- Nettoyer les notifications lues (plus de 30 jours)
DELETE FROM "Notification"
WHERE "isRead" = true
  AND "readAt" < NOW() - INTERVAL '30 days';

-- Nettoyer les anciennes sessions SSO expirées
DELETE FROM "SSOSession"
WHERE "expiresAt" < NOW();

-- Nettoyer les tokens 2FA expirés
DELETE FROM "TwoFactorToken"
WHERE "expiresAt" < NOW();

-- Nettoyer les invitations expirées
UPDATE "TeamInvitation"
SET "status" = 'expired'
WHERE "expiresAt" < NOW()
  AND "status" = 'pending';

-- Analyser les tables pour optimiser les requêtes
ANALYZE "Session";
ANALYZE "ActivityLog";
ANALYZE "Notification";

COMMIT;

-- Afficher le résultat
SELECT 'Cleanup completed at ' || NOW() as status;
