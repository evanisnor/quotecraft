# QuoteCraft — API Sub-project Makefile

.DEFAULT_GOAL := help

GOBIN ?= $(shell go env GOPATH)/bin
DATABASE_URL ?= postgres://quotecraft:quotecraft@localhost:5432/quotecraft?sslmode=disable

.PHONY: help build test lint dev db-migrate db-seed db-reset

## help: Print this help message
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /'

## build: Compile the API server
build:
	go build ./...

## test: Run all tests
test:
	go test ./...

## lint: Run static analysis and formatting checks
lint:
	go vet ./...
	@if gofmt -l . | grep -q .; then \
		echo "gofmt: the following files need formatting:"; \
		gofmt -l .; \
		exit 1; \
	fi

## dev: Start API server with hot-reload (requires air)
dev:
	$(GOBIN)/air

# ── Database ───────────────────────────────────────────────────────────────────

## db-migrate: Run all pending database migrations
db-migrate:
	migrate -path migrations -database "$(DATABASE_URL)" up

## db-seed: Seed the database with alice/bob/charlie dev users (see cmd/db-seed/main.go)
db-seed:
	go run ./cmd/db-seed

## db-reset: Drop, recreate, migrate, and seed the database
db-reset:
	@echo "db-reset: not yet implemented (see INFR-US2)"
	@exit 1
