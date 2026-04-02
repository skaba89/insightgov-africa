# ============================================
# InsightGov Africa - Makefile
# ============================================
# Commandes utiles pour le développement et le déploiement

.PHONY: dev build start clean db-reset db-seed db-studio test lint help

# Développement
dev:
	bun run dev

build:
	bun run build

start:
	bun run start

lint:
	bun run lint

# Base de données
db-generate:
	bunx prisma generate

db-push:
	bunx prisma db push

db-reset:
	bunx prisma migrate reset --force

db-seed:
	bun run db:seed

db-studio:
	bunx prisma studio

db-migrate:
	bunx prisma migrate dev

# Migration PostgreSQL
migrate-postgres:
	DATABASE_URL=$(POSTGRES_URL) bash scripts/migrate-to-postgres.sh

# Docker
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f app

# Tests
test:
	bun test

test-e2e:
	bunx playwright test

# Utilitaires
clean:
	rm -rf .next node_modules bun.lock
	bun install

quick-start:
	bash scripts/quick-start.sh

# Aide
help:
	@echo "InsightGov Africa - Commandes disponibles:"
	@echo ""
	@echo "  make dev          - Démarrer le serveur de développement"
	@echo "  make build        - Build de production"
	@echo "  make start        - Démarrer en mode production"
	@echo "  make lint         - Vérifier le code"
	@echo ""
	@echo "Base de données:"
	@echo "  make db-generate  - Générer le client Prisma"
	@echo "  make db-push      - Pousser le schéma vers la DB"
	@echo "  make db-reset     - Réinitialiser la DB"
	@echo "  make db-seed      - Remplir avec des données de test"
	@echo "  make db-studio    - Ouvrir Prisma Studio"
	@echo "  make db-migrate   - Créer une migration"
	@echo ""
	@echo "Migration:"
	@echo "  make migrate-postgres - Migrer vers PostgreSQL"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up    - Démarrer les conteneurs"
	@echo "  make docker-down  - Arrêter les conteneurs"
	@echo "  make docker-logs  - Voir les logs"
	@echo ""
	@echo "Tests:"
	@echo "  make test         - Exécuter les tests unitaires"
	@echo "  make test-e2e     - Exécuter les tests E2E"
	@echo ""
	@echo "Utilitaires:"
	@echo "  make clean        - Nettoyer et réinstaller"
	@echo "  make quick-start  - Démarrage rapide"
