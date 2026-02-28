# QuoteCraft — Root Makefile
#
# Run 'make help' to see available targets.
# Complex multi-step logic lives in scripts/ — targets stay thin.

.DEFAULT_GOAL := help

.PHONY: help bootstrap dev widget-build \
        services-up services-down services-status services-logs \
        db-migrate db-seed db-reset

## help: Print this help message
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /'

## bootstrap: Install all development tools (requires Homebrew)
bootstrap:
	@bash scripts/bootstrap.sh

## dev: Start the full development stack (Docker services + API + dashboard + widget)
dev:
	@bash scripts/dev.sh

## widget-build: Build the widget bundle (outputs content-hashed file to widget/dist/)
widget-build:
	$(MAKE) -C widget build

# ── Local Services ────────────────────────────────────────────────────────────

## services-up: Start local Docker Compose services (PostgreSQL, MinIO)
services-up:
	docker compose up -d

## services-down: Stop and remove local Docker Compose services
services-down:
	docker compose down

## services-status: Show status of local Docker Compose services
services-status:
	docker compose ps

## services-logs: Tail logs from local Docker Compose services
services-logs:
	docker compose logs -f

# ── Database ───────────────────────────────────────────────────────────────────

## db-migrate: Run all pending database migrations
db-migrate:
	$(MAKE) -C api db-migrate

## db-seed: Seed the database with initial data
db-seed:
	$(MAKE) -C api db-seed

## db-reset: Drop, recreate, migrate, and seed the database
db-reset:
	$(MAKE) -C api db-reset
