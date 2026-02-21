# QuoteCraft — Dashboard Sub-project Makefile

.DEFAULT_GOAL := help

.PHONY: help build test lint dev

## help: Print this help message
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /'

## build: Build the dashboard for production
build:
	pnpm run build

## test: Run all tests
test:
	pnpm run test

## lint: Run ESLint and TypeScript type checking
lint:
	pnpm run lint
	pnpm run typecheck

## dev: Start the dashboard in development mode with hot-reload
dev:
	pnpm run dev
