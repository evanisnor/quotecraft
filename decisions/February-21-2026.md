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

---

## Task: INFR-US1-A003 — Create Docker Compose for local dev services (PostgreSQL)

**Requirements:** Infrastructure prerequisite (no direct functional requirement ID)

### Decisions

**Compose file name:** Used `compose.yaml` (the modern canonical name, replacing `docker-compose.yml`).

**PostgreSQL version:** `postgres:16-alpine` — PostgreSQL 16 is the latest stable major version; Alpine variant keeps the image small.

**Credentials:** Hardcoded `quotecraft`/`quotecraft` for local dev only. Never used in production. Production credentials will be injected via environment variables.

**Port binding:** `5432:5432` — standard PostgreSQL port. If a local Postgres instance conflicts, developers can override via an `.env` file.

**Health check:** Uses `pg_isready` to verify PostgreSQL is accepting connections before dependent services start. `start_period: 10s` gives the container time to initialize before health checks are evaluated.

**Persistent volume:** `postgres-data` named volume preserves data across container restarts during development.

### No technical challenges

---

## Task: INFR-US1-A004 — Add root Makefile targets for service lifecycle

**Requirements:** Infrastructure prerequisite (no direct functional requirement ID)

### Decisions

**Targets are thin one-liners:** Unlike `bootstrap`, these targets have no multi-step logic, so they invoke `docker compose` directly rather than delegating to scripts.

**Services targeted:** All four acceptance criteria targets are present: `services-up`, `services-down`, `services-status`, `services-logs`. They operate on all services in `compose.yaml` (currently just PostgreSQL; more services may be added later).

**`services-down` preserves volume:** `docker compose down` removes containers but keeps the `postgres-data` volume. A developer wanting a clean slate can run `docker compose down -v` manually, or use `make db-reset` once it is implemented in INFR-US1-A010.

### No technical challenges

---

## Task: INFR-US1-A005 — Initialize Go API server module with air hot-reload + Makefile

**Requirements:** Infrastructure prerequisite (no direct functional requirement ID)

### Decisions

**Module path:** `github.com/evanisnor/quotecraft/api` — matches the repository path convention.

**Directory structure:** Follows the Golang skill's `cmd/` + `internal/` layout:
- `cmd/api/main.go` — Entrypoint
- `internal/` — Empty stub directory (preserved via `.gitkeep`) for future domain packages

**`slog` over `log.Println`:** Used `slog.NewJSONHandler` from the start rather than the suggested `log.Println` placeholder. Both the Golang skill and SYSTEM_DESIGN.md specify structured JSON logging. Using `slog` now avoids a throwaway replacement when the real server is implemented in INFR-US3.

**Minimal entrypoint:** `main.go` starts an HTTP server on `:8080` with a single log line. Real routing, middleware, and handlers are added in INFR-US3 tasks.

**Air configuration:** `.air.toml` watches Go files, builds to `./tmp/main`, and excludes `tmp/`, `vendor/`, and test files from the watch.

**Sub-project Makefile:** Thin targets — `build` (`go build ./...`), `test` (`go test ./...`), `lint` (`go vet ./...`), `dev` (`air`). No delegation to scripts needed since commands are single-liners.

### No technical challenges

---

## Task: INFR-US1-A006 — Scaffold dashboard Next.js app via create-next-app + Makefile

**Requirements:** Infrastructure prerequisite (no direct functional requirement ID)

### Decisions

**Next.js version:** `create-next-app` installed Next.js 16.1.6 (latest stable at time of scaffolding).

**App Router with `src/` layout:** Used `--src-dir` flag so Next.js App Router files live under `src/app/`. This allows FSD layers (`src/pages/`, `src/widgets/`, etc.) to coexist without conflicting with Next.js routing conventions. The `src/app/` directory is the Next.js routing entry point; the FSD `pages` layer lives at `src/pages/`.

**Feature-Sliced Design layer stubs:** Created empty directories with `.gitkeep` files for all FSD layers:
- `src/pages/` — FSD pages layer (page-level compositions)
- `src/widgets/` — Large self-contained UI blocks
- `src/features/` — User-facing capabilities
- `src/entities/` — Business domain objects
- `src/shared/ui/`, `src/shared/lib/`, `src/shared/api/`, `src/shared/config/`

**Import alias:** `@/*` maps to `./src/*` in `tsconfig.json`, consistent with the SKILL.md convention.

**Tailwind CSS v4:** create-next-app scaffolded with `@tailwindcss/postcss` (Tailwind v4 PostCSS plugin).

**Makefile targets:** `build` → `pnpm run build`, `test` → `pnpm jest --passWithNoTests`, `lint` → `pnpm run lint && pnpm tsc --noEmit`, `dev` → `pnpm run dev`.

**Jest included:** create-next-app included `jest@30.2.0` as a dev dependency. `--passWithNoTests` allows `make test` to succeed until tests are added in future tasks.

### Technical Challenges

**Duplicate lockfiles:** `create-next-app` generated a `pnpm-workspace.yaml` (with `ignoredBuiltDependencies`) and `pnpm-lock.yaml` inside `dashboard/`. This caused Next.js to warn about multiple lockfiles and confused workspace resolution.

**Resolution:** Merged `ignoredBuiltDependencies` into the root `pnpm-workspace.yaml`, deleted `dashboard/pnpm-workspace.yaml`, `dashboard/pnpm-lock.yaml`, and `dashboard/node_modules/`, then reinstalled from the monorepo root.
