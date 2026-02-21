#!/bin/sh

# QuoteCraft pre-commit hook
#
# Installation (symlink — do not copy):
#   ln -sf ../../scripts/pre-commit.sh .git/hooks/pre-commit
#
# Or run: make setup-hooks

set -e

# ===========================================================================
# Directory configuration
# Edit these arrays when sub-projects are added or renamed.
# ===========================================================================

# TypeScript sub-projects (pnpm, prettier, eslint, tsc)
TS_PROJECTS="dashboard widget shared"

# Go sub-projects (gofmt, golangci-lint, go test)
GO_PROJECTS="api"

# ===========================================================================
# Helpers
# ===========================================================================

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    exit 0
fi

echo "Running pre-commit checks on staged files..."

PROJECT_ROOT=$(git rev-parse --show-toplevel)

filter_files() {
    echo "$STAGED_FILES" | grep "^$1/" || true
}

# ===========================================================================
# TypeScript / Node sub-projects
# ===========================================================================

check_ts_project() {
    dir="$1"
    FILES=$(filter_files "$dir")
    if [ -z "$FILES" ]; then return; fi

    echo "--- $dir ---"
    cd "$PROJECT_ROOT/$dir" || exit 1

    REL_FILES=$(echo "$FILES" | sed "s|^${dir}/||")
    LINT_FILES=$(echo "$REL_FILES" | grep -E '\.(js|jsx|ts|tsx)$' || true)

    if [ -n "$LINT_FILES" ]; then
        echo "Formatting staged files..."
        echo "$LINT_FILES" | xargs pnpm exec prettier --write
        # Re-stage formatted files (use repo root for git add since we cd'd into a subdir)
        echo "$FILES" | grep -E '\.(js|jsx|ts|tsx)$' | xargs git -C "$PROJECT_ROOT" add

        echo "Linting staged files..."
        echo "$LINT_FILES" | xargs pnpm exec eslint
    fi

    if echo "$REL_FILES" | grep -qE '\.(ts|tsx)$'; then
        echo "Type checking..."
        pnpm run typecheck || exit 1
    fi

    echo "Running tests (related to changes)..."
    pnpm test -- --onlyChanged --passWithNoTests --watchAll=false || exit 1

    cd "$PROJECT_ROOT"
}

for project in $TS_PROJECTS; do
    check_ts_project "$project"
done

# ===========================================================================
# Go sub-projects
# ===========================================================================

check_go_project() {
    dir="$1"
    FILES=$(filter_files "$dir")
    if [ -z "$FILES" ]; then return; fi

    echo "--- $dir ---"
    cd "$PROJECT_ROOT/$dir" || exit 1

    REL_FILES=$(echo "$FILES" | sed "s|^${dir}/||")
    GO_FILES=$(echo "$REL_FILES" | grep '\.go$' || true)

    if [ -z "$GO_FILES" ]; then
        cd "$PROJECT_ROOT"
        return
    fi

    echo "Formatting staged Go files..."
    echo "$GO_FILES" | xargs gofmt -w
    echo "$FILES" | grep '\.go$' | xargs git -C "$PROJECT_ROOT" add

    # Ensure GOCACHE is writable. Falls back to TMPDIR in environments where the
    # default cache directory is not writable (e.g. CI, sandboxed dev environments).
    EFFECTIVE_GOCACHE="${GOCACHE:-$(go env GOCACHE)}"
    if ! mkdir -p "$EFFECTIVE_GOCACHE" 2>/dev/null || ! touch "$EFFECTIVE_GOCACHE/.write-test" 2>/dev/null; then
        EFFECTIVE_GOCACHE="${TMPDIR:-/tmp}/go-build-cache"
        mkdir -p "$EFFECTIVE_GOCACHE"
    fi
    rm -f "$EFFECTIVE_GOCACHE/.write-test" 2>/dev/null
    export GOCACHE="$EFFECTIVE_GOCACHE"

    echo "Linting..."
    # golangci-lint is run as a soft gate: failures warn but do not block commits.
    # This handles toolchain version mismatches (e.g. golangci-lint built with an
    # older Go than the system toolchain). CI enforces golangci-lint as a hard gate.
    GOLANGCI_BIN=""
    if command -v golangci-lint >/dev/null 2>&1; then
        GOLANGCI_BIN="golangci-lint"
    elif [ -f "$(go env GOPATH)/bin/golangci-lint" ]; then
        GOLANGCI_BIN="$(go env GOPATH)/bin/golangci-lint"
    fi
    if [ -n "$GOLANGCI_BIN" ]; then
        LINT_OUT=$($GOLANGCI_BIN run --new-from-rev=HEAD 2>&1) || {
            # Filter out known cache noise; show only real lint issues.
            REAL_ISSUES=$(echo "$LINT_OUT" | grep -v "Failed to persist" | grep -v "operation not permitted" || true)
            if [ -n "$REAL_ISSUES" ]; then
                echo "golangci-lint issues:"
                echo "$REAL_ISSUES"
            fi
            echo "WARNING: golangci-lint reported issues or failed. Run 'make lint' to investigate."
            echo "         CI enforces golangci-lint as a hard gate."
        }
    fi

    echo "Running tests for changed packages..."
    DIRS=$(echo "$GO_FILES" | xargs dirname | sort | uniq)
    for d in $DIRS; do
        echo "Testing ./$d..."
        go test -v -short -race "./$d" || exit 1
    done

    cd "$PROJECT_ROOT"
}

for project in $GO_PROJECTS; do
    check_go_project "$project"
done

echo "All checks passed."