# Decisions — February 21, 2026

## Task: INFR-US1-A001 — Initialize monorepo with pnpm workspaces

**Requirements:** Infrastructure prerequisite (no direct functional requirement ID)

### Decisions

**Workspace package layout:**
- `dashboard/` — Next.js dashboard + marketing site (TypeScript/Node.js)
- `widget/` — Vanilla TypeScript widget (TypeScript/Node.js)
- `packages/formula-engine/` — Shared formula engine (TypeScript)
- `packages/config-schema/` — Shared config schema + types (TypeScript)
- `packages/field-renderers/` — Shared field renderer components (TypeScript)
- `api/` — Go API server (excluded from pnpm workspaces; Go module managed separately)

The Go API server is not a Node.js package, so it is not listed in `pnpm-workspace.yaml`. It lives at `api/` and is managed by its own `go.mod` (created in INFR-US1-A005).

**pnpm version:** Used `pnpm@9.0.0` as a baseline in `packageManager`. This will be updated to the exact version installed via the Brewfile once INFR-US1-A002 completes.

**Root `package.json` scripts:** Defined top-level `build`, `test`, `lint`, `typecheck`, `format`, and `format:check` scripts that delegate to sub-projects via `pnpm -r run <script>`. This keeps the root thin — actual implementations live in sub-project `package.json` files.

**`.gitignore`:** Extended the minimal existing `.gitignore` to cover Node.js artifacts (`node_modules`, build outputs, caches), Go artifacts (`api/bin`, `api/tmp`), environment files, editor/OS noise, and coverage reports.

**`.editorconfig`:** Standard configuration for consistent formatting across editors: UTF-8, LF line endings, trim trailing whitespace, 2-space indent for most files, tabs for Go and Makefile.

### No technical challenges or inconsistencies
This task is purely structural — no conflicting patterns or design decisions encountered.

---

## Task: INFR-US1-A002 — Create root Makefile with `bootstrap` target (Homebrew Brewfile)

**Requirements:** Infrastructure prerequisite (no direct functional requirement ID)

### Decisions

**Makefile stays thin:** Per the acceptance criteria convention, complex bootstrap logic lives in `scripts/bootstrap.sh`. The `make bootstrap` target simply delegates to this script.

**Brewfile tools:**
- `go` — Go language toolchain
- `node` — Node.js runtime
- `pnpm` — pnpm package manager
- `air` — Go hot-reload server (available in Homebrew core)
- `docker` (cask) — Docker Desktop for macOS

**`air` formula:** Used `brew "air"` from Homebrew core rather than the `cosmtrek/air` tap. As of late 2024, `air` is available in Homebrew core. If the formula is not found on a given system, fall back to `brew install cosmtrek/air/air`.

**`help` target:** Added a `help` target as `.DEFAULT_GOAL` that auto-documents targets via `grep` on `## ` comments. This is a low-friction convention for developer discoverability.

**Bootstrap sequence:** The script checks that Homebrew is present (errors clearly if not), then runs `brew bundle`, then installs root Node.js dependencies via `pnpm install`. This gives developers a complete environment in one command.

### No technical challenges
