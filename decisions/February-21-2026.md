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

---

## Task: INFR-US1-A007 — Create widget package stub with TypeScript bundler + Makefile

**Requirements:** Infrastructure prerequisite (no direct functional requirement ID)

### Decisions

**Build script extension — `build.mts` not `build.ts`:** The build script uses top-level `await` (required by esbuild's context API for watch mode). When `tsx` runs a `.ts` file without `"type": "module"` in `package.json`, it defaults to CJS, which does not support top-level await. Naming the file `build.mts` forces ESM treatment unconditionally without adding `"type": "module"` to `package.json` (which would break Jest's CommonJS transformation pipeline).

**No `"type": "module"` in `package.json`:** Adding `"type": "module"` would require Jest to use an ESM transform setup, which is more complex. Keeping CJS as the default and using `.mts` only for the build script keeps Jest straightforward.

**ESLint targeting JS files only — deferring TypeScript linting to A009:** ESLint v9 with only `@eslint/js` (the baseline JS config) uses the Espree parser, which cannot parse TypeScript syntax (e.g., `private shadow: ShadowRoot`). Adding `@typescript-eslint/parser` is deferred to INFR-US1-A009 (shared ESLint config task). For this stub, the `lint` script uses `--no-error-on-unmatched-pattern` targeting `src/**/*.{js,mjs}` so there are no errors on a TypeScript-only source directory. The `typecheck` script (`tsc --noEmit`) provides type-safety checking in the interim.

**`globals` package added as devDependency:** The ESLint flat config references `globals` to declare browser and Jest globals. The package exists in root `node_modules` (pulled in by ESLint transitively) but must be explicitly declared in `widget/package.json` for reliable workspace resolution.

**Jest configuration — `ts-jest` with CommonJS override:** `jest.config.ts` uses `ts-jest` with `{ tsconfig: { module: 'CommonJS' } }` to override the `module: "ESNext"` in the main `tsconfig.json`. This allows Jest to import TypeScript files without needing full ESM test support.

**`jest-environment-jsdom` v30:** Jest v30 dropped built-in jsdom support. The `jest-environment-jsdom` package must be installed separately. It provides the DOM globals (`document`, `customElements`) required to test Custom Elements.

### Technical Challenges

**Top-level await in build script not supported with CJS output:** `tsx build.ts` failed because esbuild (v0.24, resolved as the widget's direct dependency) itself processes `build.ts` as CJS when `"type": "module"` is absent, then rejects top-level await. The resolution was renaming to `build.mts` so Node.js and tsx treat it as ESM natively.

**ESLint cannot parse TypeScript class field syntax:** The `private shadow: ShadowRoot` class field declaration fails Espree parsing. Since `@typescript-eslint/parser` is deferred to A009, the lint script is scoped to JS/MJS files only for this task. TypeScript correctness is enforced by `tsc --noEmit` (the `typecheck` script), which `make lint` also runs.

---

## Task: INFR-US1-A008 — Create shared TypeScript package stubs with sub-project Makefile

**Requirements:** Infrastructure prerequisite (no direct functional requirement ID)

### Decisions

**Three packages:** `@quotecraft/formula-engine`, `@quotecraft/config-schema`, `@quotecraft/field-renderers` — matching the decisions documented in INFR-US1-A001.

**`main`/`exports` points to TypeScript source:** All three packages set `"main": "./src/index.ts"` instead of a compiled `dist/` path. Dashboard (Next.js) and widget (esbuild) both handle TypeScript natively, so a separate build step is not needed for development. The `tsc --project tsconfig.build.json` target produces `dist/` for any future toolchain that requires pre-compiled output.

**Separate `tsconfig.build.json`:** Extends `tsconfig.json` but enables `declaration`, `declarationMap`, `sourceMap`, and sets `outDir: dist`. Excludes `**/*.test.ts` so test files are not compiled into the library output.

**No `dev` target in Makefiles:** These are libraries, not apps. Libraries don't have dev servers. Only `build`, `test`, `lint`.

**field-renderers depends on config-schema:** `FieldRenderProps.field` is typed as `FieldConfig` from `@quotecraft/config-schema`. Declared as a `dependencies` (not `devDependencies`) entry since it's a runtime import, not a build tool.

**`FieldRenderer<TOutput>` is generic:** The widget renders to `HTMLElement`, the dashboard to React elements. The generic type parameter lets each environment provide its own output type without duplicating the props interface.

**formula-engine stub:** `evaluate()` parameters use `_expression` and `_context` naming to suppress unused-variable warnings while making the stub nature explicit. Full implementation is in CALC-US1.

### Technical challenges

**ts-jest + jest version pairing:** Code reviewer flagged `jest@^30` with `ts-jest@^29` as a potential incompatibility. Confirmed via `npm info ts-jest peerDependencies` that ts-jest@29 explicitly supports `jest: '^29.0.0 || ^30.0.0'`. No change required.

**Test files in dist:** Initial `tsconfig.build.json` files did not exclude test files, causing `.test.js` and `.test.d.ts` files to appear in `dist/`. Fixed by adding `"**/*.test.ts"` to `exclude` in all three `tsconfig.build.json` files.

---

## Task: INFR-US1-A009 — Configure shared TypeScript, ESLint, and Prettier configs

**Requirements:** Infrastructure prerequisite (no direct functional requirement ID)

### Decisions

**`tsconfig.base.json` at root:** Centralizes the options shared by all TypeScript packages: `target: "ES2020"`, `module: "ESNext"`, `moduleResolution: "bundler"`, `strict: true`, `skipLibCheck: true`, `isolatedModules: true`, `esModuleInterop: true`, `resolveJsonModule: true`. Sub-projects extend it and add only what's specific to them (e.g., widget adds `lib: ["dom", "esnext"]`).

**`dashboard/tsconfig.json` not extended:** The dashboard tsconfig is owned by Next.js (`create-next-app` generated it; the `next` TypeScript plugin injects into it). Extending the base would break Next.js-specific options (`target: "ES2017"` required by Next.js 15+, `plugins`, `paths`). Left as-is intentionally.

**Root `tsconfig.json` = solution file:** Uses `"files": []` + `"references": [...]` pattern so it acts as a project reference aggregator only and never compiles source directly. References point to `tsconfig.build.json` files (not `tsconfig.json`) since those are the composite-enabled configs.

**`composite: true` added to `tsconfig.build.json`:** Required for TypeScript project references. Enables incremental builds via `.tsbuildinfo` files (which go to `dist/`, already gitignored). `field-renderers/tsconfig.build.json` adds a reference to `config-schema/tsconfig.build.json` to enforce build ordering.

**TypeScript added to root devDependencies:** Required for `tsc --build` to work from the monorepo root when using project references. Each package also has TypeScript in its own devDependencies for local `tsc` invocations.

**ESLint hoisting via `.npmrc`:** `public-hoist-pattern[]=@typescript-eslint/*` makes TypeScript ESLint packages resolvable from any workspace package. This avoids duplicating `@typescript-eslint/parser` and `@typescript-eslint/plugin` across every package's devDependencies while still allowing sub-project `eslint.config.mjs` files to import them. `eslint`, `globals`, and `@eslint/js` are also in root devDependencies for root-level config resolution.

**Root `eslint.config.mjs` scope:** Covers `packages/*/src/**/*.ts` and widget TypeScript files. Does not cover `dashboard/` (which has its own Next.js ESLint config) or test files with Jest globals for the widget (the widget's local config handles that). This is an acceptable split since `pnpm -r run lint` delegates to each sub-project's config.

**`@typescript-eslint/no-unused-vars` rule:** Overrides the recommended rule to allow underscore-prefixed arguments (`argsIgnorePattern: '^_'`). This is the established convention for stub parameters in this codebase (e.g., `_expression`, `_context` in `evaluate.ts`).

**Prettier config:** Standard settings — `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`. Excludes `.claude/` (agent definitions), `decisions/`, and project documentation Markdown files from formatting since these have author-controlled formatting.

### No blocking technical challenges

---

## Task: INFR-US1-A010 — Add root Makefile targets for database management

**Requirements:** Infrastructure prerequisite (no direct functional requirement ID)

### Decisions

**Delegation via `$(MAKE) -C api`:** Root targets stay thin — they change into the `api/` directory and invoke the corresponding target in the API sub-project Makefile. This is consistent with the monorepo's established convention (e.g., how CI would delegate per sub-project).

**API stubs exit 1:** The three stub targets in `api/Makefile` print an informative message referencing INFR-US2 and immediately exit with a non-zero status. This makes misuse visible: any developer (or CI step) that invokes these before INFR-US2 is implemented will get a clear error rather than a silent no-op.

### No technical challenges

---

## Task: INFR-US1-A011 — Add root Makefile target for full-stack dev-watch mode

**Requirements:** Infrastructure prerequisite (no direct functional requirement ID)

### Decisions

**`scripts/dev.sh` for complex orchestration:** Consistent with `bootstrap`, the multi-step logic lives in a script. The Makefile `dev` target stays thin (`@bash scripts/dev.sh`).

**`EXIT` trap in addition to `INT`/`TERM`:** The script traps `EXIT` so that if any background child exits non-zero (e.g., `air` fails to start because Go toolchain is missing), all remaining sibling processes are killed rather than left as orphans. `wait "${pids[@]}"` in `cleanup` waits for the specific tracked PIDs rather than all children.

**Docker services start synchronously before watchers:** `docker compose up -d` completes before any background process is spawned. This ensures the API watcher sees a running database container from the start, though the DB health check takes a few seconds; the API will handle that via retries.

### No technical challenges

---

## Task: INFR-US2-A001 — Choose and configure migration tool

**Requirements:** [1.9.2](./REQUIREMENTS.md#19-backend-api--data-storage), [1.9.8](./REQUIREMENTS.md#19-backend-api--data-storage)

### Decisions

**Migration tool: golang-migrate v4 with file source and postgres driver**

`github.com/golang-migrate/migrate/v4` was selected as the migration library. It is the most widely adopted Go migration tool, supports numbered up/down migration files, and integrates directly with `database/sql`. The CLI binary (`golang-migrate` formula via Homebrew) handles developer invocations from `make db-migrate`. The Go library (`golang-migrate/migrate/v4`) is used programmatically for integration tests in INFR-US2-A005.

**Driver registration via blank imports**

Both `github.com/golang-migrate/migrate/v4/database/postgres` and `github.com/golang-migrate/migrate/v4/source/file` register themselves in `init()`. They are imported with blank identifiers in `migrate.go`. This is the idiomatic pattern for golang-migrate drivers and avoids the caller needing to know about driver registration.

**`Migrator` interface defined in the `db` package (consumer)**

Per the Go skill convention, interfaces are defined where consumed, not where implemented. `Migrator` lives in `internal/db` because that is the boundary that callers will depend on. Application-layer code will depend on `db.Migrator`, not `*db.FileMigrator`.

**`runner` unexported interface for seam injection**

`*migrate.Migrate` cannot be instantiated without a database connection, making it unsuitable for unit tests. An unexported `runner` interface isolates `FileMigrator` from the real golang-migrate type, allowing `stubRunner` in tests to exercise all branches without network I/O. This follows the skill's "interfaces where consumed" pattern — `runner` is the internal seam, not a public contract.

**`migrateFactory` function type for `NewFileMigrator` coverage**

The success path of `NewFileMigrator` (`return &FileMigrator{r: m}, nil`) cannot be reached in a unit test because `migrate.New()` requires both a readable migrations directory and a reachable database. To achieve 100% line and branch coverage without integration infrastructure, the internal `newFileMigratorWithFactory` constructor accepts an injectable `migrateFactory` function. `NewFileMigrator` delegates to it using `defaultFactory`. Tests use a stub factory that returns a `stubRunner`. This avoids real database connections while keeping the public API clean — callers only ever see `NewFileMigrator`.

**`DATABASE_URL` default in api/Makefile**

The default `postgres://quotecraft:quotecraft@localhost:5432/quotecraft?sslmode=disable` matches the credentials and port in `compose.yaml` for local development. Override by setting `DATABASE_URL` in the environment.

**`db-seed` and `db-reset` remain as stubs**

Seed data and the reset flow depend on migration content (INFR-US2-A002 through A004). They remain as `exit 1` stubs with informative messages referencing INFR-US2.

### Technical challenges

**`go mod tidy` pruned dependencies before source files existed**

`go get` was run to add the three golang-migrate packages and `lib/pq`, then `go mod tidy` was run. Because no Go source file imported those packages at that point, `tidy` removed them from `go.mod`. After creating `migrate.go`, `go get` was run again. Lesson: run `go mod tidy` only after all source files importing the new packages are in place.

**100% coverage on `NewFileMigrator` required a factory abstraction**

Initial approach tested `NewFileMigrator` only with an invalid URL (hitting the error branch at 75% coverage). The success return statement was unreachable without a real database. Introduced `newFileMigratorWithFactory` as the internal constructor with an injectable `migrateFactory` function type. This achieved 100% coverage on every function in `migrate.go` while keeping the implementation hermetic.

---

## Task: INFR-US1-A012 — Set up CI pipeline with GitHub Actions

**Requirements:** Infrastructure prerequisite (no direct functional requirement ID)

### Decisions

**Two parallel jobs — `api` and `node`:** Go and TypeScript work is independent so both jobs run concurrently. This keeps CI fast and provides clear separation of failure signal.

**Go job steps:** `go mod verify` (module integrity check per SYSTEM_DESIGN.md security audit requirement), then `make -C api lint` (go vet + gofmt), then `make -C api test`, then `make -C api build`. Build is included so compilation errors are caught even when no tests cover new code paths.

**Node job steps:** `pnpm install --frozen-lockfile` (lockfile as source of truth), `pnpm audit --audit-level=high` (dependency vulnerability scan per SYSTEM_DESIGN.md), `pnpm -r run lint` (ESLint for all packages), `pnpm -r run typecheck` (tsc --noEmit for all packages), `pnpm -r run test` (Jest for all packages). Type-check is a separate step from lint because each package's `lint` script only runs ESLint.

**`pnpm/action-setup@v4` with explicit `version: 9`:** Matches the workspace's pnpm@9. Could be read from `packageManager` in `package.json`, but explicit version is more predictable in CI.

**`go-version-file: api/go.mod`:** Go version derives from the module file rather than being hardcoded in the workflow, so updating go.mod automatically updates the CI Go version.

**`on.push.branches: ['**']`:** CI runs on every push to any branch, satisfying the acceptance criterion. Pull request trigger is scoped to `main` only, which matches the expected branching model.

### No technical challenges
