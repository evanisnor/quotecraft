# QuoteCraft — Widget Sub-project Makefile

.DEFAULT_GOAL := help

.PHONY: help build test lint dev

## help: Print this help message
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /'

## build: Bundle the widget for production (outputs dist/widget.js)
build:
	pnpm run build

## test: Run all tests
test:
	pnpm run test

## lint: Run ESLint and TypeScript type checking
lint:
	pnpm run lint
	pnpm run typecheck

## dev: Start watch mode for development
dev:
	pnpm run dev
