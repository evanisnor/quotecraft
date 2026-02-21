# QuoteCraft — API Sub-project Makefile

.DEFAULT_GOAL := help

.PHONY: help build test lint dev

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
	air
