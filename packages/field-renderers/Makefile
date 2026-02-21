# QuoteCraft — field-renderers Sub-project Makefile

.DEFAULT_GOAL := help

.PHONY: help build test lint

## help: Print this help message
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /'

## build: Compile TypeScript and emit declaration files
build:
	pnpm run build

## test: Run all tests
test:
	pnpm run test

## lint: Run ESLint and TypeScript type checking
lint:
	pnpm run lint
	pnpm run typecheck
