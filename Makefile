# QuoteCraft — Root Makefile
#
# Run 'make help' to see available targets.
# Complex multi-step logic lives in scripts/ — targets stay thin.

.DEFAULT_GOAL := help

.PHONY: help bootstrap

## help: Print this help message
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /'

## bootstrap: Install all development tools (requires Homebrew)
bootstrap:
	@bash scripts/bootstrap.sh
