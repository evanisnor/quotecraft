# QuoteCraft — Root Makefile
#
# Run 'make help' to see available targets.
# Complex multi-step logic lives in scripts/ — targets stay thin.

.DEFAULT_GOAL := help

.PHONY: help bootstrap \
        services-up services-down services-status services-logs

## help: Print this help message
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /'

## bootstrap: Install all development tools (requires Homebrew)
bootstrap:
	@bash scripts/bootstrap.sh

# ── Local Services ────────────────────────────────────────────────────────────

## services-up: Start local Docker Compose services (PostgreSQL)
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
