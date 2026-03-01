# QuoteCraft — Project Status

Cross-reference: [PROJECT_PLAN.md](./PROJECT_PLAN.md) · [REQUIREMENTS.md](./REQUIREMENTS.md)

Last updated: 2026-02-28

---

## Table of Contents

### [Phase 1: MVP](#phase-1-mvp)

- [INFR — Infrastructure & Backend Foundation](#infr--infrastructure--backend-foundation)
- [BLDR — Visual Calculator Builder](#bldr--visual-calculator-builder)
- [CALC — Formula Engine & Results](#calc--formula-engine--results)
- [STYL — Styling & Branding](#styl--styling--branding)
- [WDGT — Embeddable Widget](#wdgt--embeddable-widget)
- [TMPL — Templates](#tmpl--templates)

### [Phase 2: Growth](#phase-2-growth)

- [LEAD — Lead Capture & Submissions](#lead--lead-capture--submissions)
- [SEOP — SEO Pages & Template Gallery](#seop--seo-pages--template-gallery)
- [WSEO — Widget SEO Enhancements](#wseo--widget-seo-enhancements)

### [Phase 3: Monetization](#phase-3-monetization)

- [BILL — Billing & Subscriptions](#bill--billing--subscriptions)
- [PROT — Pro Tier Features](#prot--pro-tier-features)
- [BSNS — Business Tier Features](#bsns--business-tier-features)
- [AGCY — Agency Tier Features](#agcy--agency-tier-features)

### [Phase 4: Expansion](#phase-4-expansion)

- [PLAT — Platform Integrations](#plat--platform-integrations)
- [EMBD — Advanced Embed Modes](#embd--advanced-embed-modes)
- [I18N — Multi-Language Support](#i18n--multi-language-support)

---

# Phase 1: MVP

## INFR — Infrastructure & Backend Foundation

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#infr--infrastructure--backend-foundation)

### ✅ [INFR-US1: Project Scaffolding & Developer Experience](./PROJECT_PLAN.md#infr-us1-project-scaffolding--developer-experience-p0) (P0)

**Requirements:** Infrastructure prerequisite — no direct functional requirement

| Status | ID | Task | P | Completed |
|--------|----|------|---|-----------|
| ✅ | INFR-US1-A001 | Initialize monorepo with pnpm workspaces | 0 | 2026-02-21 |
| ✅ | INFR-US1-A002 | Create root Makefile with `bootstrap` target (Homebrew Brewfile) | 0 | 2026-02-21 |
| ✅ | INFR-US1-A003 | Create Docker Compose for local dev services (PostgreSQL) | 0 | 2026-02-21 |
| ✅ | INFR-US1-A004 | Add root Makefile targets for service lifecycle | 0 | 2026-02-21 |
| ✅ | INFR-US1-A005 | Initialize Go API server module with air hot-reload + Makefile | 0 | 2026-02-21 |
| ✅ | INFR-US1-A006 | Scaffold dashboard Next.js app via create-next-app + Makefile | 0 | 2026-02-21 |
| ✅ | INFR-US1-A007 | Create widget package stub with TypeScript bundler + Makefile | 0 | 2026-02-21 |
| ✅ | INFR-US1-A008 | Create shared TypeScript package stubs + Makefile | 0 | 2026-02-21 |
| ✅ | INFR-US1-A009 | Configure shared TypeScript, ESLint, and Prettier configs | 0 | 2026-02-21 |
| ✅ | INFR-US1-A010 | Add root Makefile targets for database management | 0 | 2026-02-21 |
| ✅ | INFR-US1-A011 | Add root Makefile target for full-stack dev-watch mode | 0 | 2026-02-21 |
| ✅ | INFR-US1-A012 | Set up CI pipeline with GitHub Actions | 0 | 2026-02-21 |

### ✅ [INFR-US2: Database & Migrations](./PROJECT_PLAN.md#infr-us2-database--migrations-p0) (P0)

**Requirements:** [1.9.2](./REQUIREMENTS.md#19-backend-api--data-storage), [1.9.8](./REQUIREMENTS.md#19-backend-api--data-storage)

| Status | ID            | Task                                                   | P   | Completed |
| ------ | ------------- | ------------------------------------------------------ | --- | --------- |
| ✅ | INFR-US2-A001 | Choose and configure migration tool                    | 0   | 2026-02-21 |
| ✅ | INFR-US2-A002 | Write initial migration: users table                   | 0   | 2026-02-21 |
| ✅ | INFR-US2-A003 | Write initial migration: calculators table             | 0   | 2026-02-21 |
| ✅ | INFR-US2-A004 | Write initial migration: sessions table                | 0   | 2026-02-21 |
| ✅ | INFR-US2-A005 | Configure CI to run migrations against a test database | 0   | 2026-02-21 |

### ✅ [INFR-US3: API Server Skeleton](./PROJECT_PLAN.md#infr-us3-api-server-skeleton-p0) (P0)

**Requirements:** [1.9.1](./REQUIREMENTS.md#19-backend-api--data-storage), [1.9.7](./REQUIREMENTS.md#19-backend-api--data-storage), [1.9.9](./REQUIREMENTS.md#19-backend-api--data-storage)

| Status | ID            | Task                                                                    | P   | Completed |
| ------ | ------------- | ----------------------------------------------------------------------- | --- | --------- |
| ✅ | INFR-US3-A001 | Set up API server with router and middleware stack                      | 0   | 2026-02-22 |
| ✅ | INFR-US3-A002 | Implement structured JSON logging with trace_id propagation             | 0   | 2026-02-22 |
| ✅ | INFR-US3-A003 | Implement consistent error response format                              | 0   | 2026-02-22 |
| ✅ | INFR-US3-A004 | Implement `GET /healthz` with DB connectivity check                     | 0   | 2026-02-22 |
| ✅ | INFR-US3-A005 | Configure CORS: wildcard for public endpoints, restricted for dashboard | 0   | 2026-02-22 |

### [INFR-US4: Authentication](./PROJECT_PLAN.md#infr-us4-authentication-p0) (P0)

**Requirements:** [1.1.1](./REQUIREMENTS.md#11-authentication--user-accounts), [1.1.2](./REQUIREMENTS.md#11-authentication--user-accounts), [1.1.3](./REQUIREMENTS.md#11-authentication--user-accounts), [1.1.4](./REQUIREMENTS.md#11-authentication--user-accounts), [1.1.5](./REQUIREMENTS.md#11-authentication--user-accounts), [1.1.6](./REQUIREMENTS.md#11-authentication--user-accounts), [1.1.7](./REQUIREMENTS.md#11-authentication--user-accounts)

| Status | ID            | Task                                                                        | P   | Completed |
| ------ | ------------- | --------------------------------------------------------------------------- | --- | --------- |
| ✅ | INFR-US4-A001 | Implement email+password registration with password hashing                 | 0   | 2026-02-22 |
| ✅ | INFR-US4-A002 | Implement login endpoint with session token issuance                        | 0   | 2026-02-22 |
| ✅ | INFR-US4-A003 | Implement logout with server-side token invalidation                        | 0   | 2026-02-22 |
| ✅ | INFR-US4-A004 | Implement auth middleware that validates session tokens on protected routes | 0   | 2026-02-22 |
|        | INFR-US4-A005 | Implement password reset flow (forgot + reset endpoints)                    | 1   |           |
|        | INFR-US4-A006 | Implement Google OAuth with PKCE                                            | 1   |           |
|        | INFR-US4-A007 | Add rate limiting on auth endpoints                                         | 1   |           |

### [INFR-US5: Calculator CRUD API](./PROJECT_PLAN.md#infr-us5-calculator-crud-api-p0) (P0)

**Requirements:** [1.2.1–1.2.9](./REQUIREMENTS.md#12-calculator-crud), [1.9.3](./REQUIREMENTS.md#19-backend-api--data-storage), [1.9.4](./REQUIREMENTS.md#19-backend-api--data-storage), [1.9.5](./REQUIREMENTS.md#19-backend-api--data-storage), [1.9.6](./REQUIREMENTS.md#19-backend-api--data-storage)

| Status | ID            | Task                                                               | P   | Completed |
| ------ | ------------- | ------------------------------------------------------------------ | --- | --------- |
| ✅ | INFR-US5-A001 | Implement create calculator endpoint                               | 0   | 2026-02-22 |
| ✅ | INFR-US5-A002 | Implement list calculators endpoint (scoped to authenticated user) | 0   | 2026-02-23 |
| ✅ | INFR-US5-A003 | Implement get single calculator endpoint (ownership-gated)         | 0   | 2026-02-23 |
| ✅ | INFR-US5-A004 | Implement update calculator endpoint with config schema validation | 0   | 2026-02-23 |
| ✅ | INFR-US5-A005 | Implement soft-delete calculator endpoint                          | 0   | 2026-02-23 |
|        | INFR-US5-A006 | Implement duplicate calculator endpoint                            | 1   |           |
| ✅ | INFR-US5-A007 | Implement public config endpoint with cache headers                | 0   | 2026-02-23 |
|        | INFR-US5-A008 | Add rate limiting on public config endpoint                        | 1   |           |

### ✅ [INFR-US6: Object Storage & CDN](./PROJECT_PLAN.md#infr-us6-object-storage--cdn-p0) (P0)

**Requirements:** [1.8.5](./REQUIREMENTS.md#18-embeddable-widget), [1.3.7](./REQUIREMENTS.md#13-visual-builder--field-types)

| Status | ID            | Task                                                                                                      | P   | Completed |
| ------ | ------------- | --------------------------------------------------------------------------------------------------------- | --- | --------- |
| ✅ | INFR-US6-A001 | Define `Storage` interface and implement S3-compatible adapter (works with MinIO and AWS S3)               | 0   | 2026-02-23 |
| ✅ | INFR-US6-A002 | Implement filesystem storage adapter for CI/test environments                                             | 0   | 2026-02-23 |
| ✅ | INFR-US6-A003 | Add MinIO to Docker Compose with health check, persistent volume, and default bucket creation             | 0   | 2026-02-23 |
| ✅ | INFR-US6-A004 | Add `storage` and `cdn` configuration sections to `config.yaml` with local dev defaults                   | 0   | 2026-02-23 |
| ✅ | INFR-US6-A005 | Implement dev-mode static file handler (`/static/*` route) for serving widget bundle and assets locally   | 0   | 2026-02-23 |
|        | INFR-US6-A006 | Implement image upload endpoint with type/size validation using the `Storage` interface                   | 1   |           |
| ✅ | INFR-US6-A007 | Set up widget bundle build pipeline that outputs content-hashed filename to local build directory          | 0   | 2026-02-23 |
| ✅ | INFR-US6-A008 | Update developer documentation and ensure Makefiles support a complete development experience              | 0   | 2026-02-28 |

---

## BLDR — Visual Calculator Builder

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#bldr--visual-calculator-builder)

### [BLDR-US1: Dashboard Shell & Navigation](./PROJECT_PLAN.md#bldr-us1-dashboard-shell--navigation-p0) (P0) ✅ 2026-02-28

**Requirements:** [1.1.3](./REQUIREMENTS.md#11-authentication--user-accounts), [1.2.2](./REQUIREMENTS.md#12-calculator-crud), [1.2.4](./REQUIREMENTS.md#12-calculator-crud)

| Status | ID            | Task                                                             | P   | Completed |
| ------ | ------------- | ---------------------------------------------------------------- | --- | --------- |
| ✅ | BLDR-US1-A001 | Set up React app with routing and auth state management          | 0   | 2026-02-28 |
| ✅ | BLDR-US1-A002 | Build login and registration screens                             | 0   | 2026-02-28 |
| ✅ | BLDR-US1-A003 | Build calculator list view with create, open, and delete actions | 0   | 2026-02-28 |
| ✅ | BLDR-US1-A004 | Implement API client module for authenticated requests           | 0   | 2026-02-28 |

### [BLDR-US2: Field Type Palette & Configuration](./PROJECT_PLAN.md#bldr-us2-field-type-palette--configuration-p0) (P0)

**Requirements:** [1.3.1–1.3.11](./REQUIREMENTS.md#13-visual-builder--field-types)

| Status | ID            | Task                                                                                   | P   | Completed |
| ------ | ------------- | -------------------------------------------------------------------------------------- | --- | --------- |
| ✅ | BLDR-US2-A001 | Build field type palette component                                                     | 0   | 2026-02-28 |
| ✅ | BLDR-US2-A002 | Implement shared field configuration panel (label, help text, required, variable name) | 0   | 2026-02-28 |
| ✅ | BLDR-US2-A003 | Implement Dropdown field type with option list editor                                  | 0   | 2026-03-01 |
| ✅ | BLDR-US2-A004 | Implement Radio Button field type with option list editor                              | 0   | 2026-03-01 |
| ✅ | BLDR-US2-A005 | Implement Checkbox field type with option list editor                                  | 0   | 2026-03-01 |
| ✅ | BLDR-US2-A006 | Implement Number Input field type with min/max/step/default config                     | 0   | 2026-03-01 |
| ✅ | BLDR-US2-A007 | Implement Slider/Range field type with min/max/step/default config                     | 0   | 2026-03-01 |
|        | BLDR-US2-A008 | Implement Text Input field type                                                        | 1   |           |
|        | BLDR-US2-A009 | Implement Image Select field type with image upload                                    | 2   |           |
|        | BLDR-US2-A010 | Implement drag-and-drop field reordering                                               | 1   |           |
|        | BLDR-US2-A011 | Implement field deletion                                                               | 0   |           |

### [BLDR-US3: Layout & Conditional Flow](./PROJECT_PLAN.md#bldr-us3-layout--conditional-flow-p1) (P1)

**Requirements:** [1.4.1–1.4.7](./REQUIREMENTS.md#14-visual-builder--layout--flow)

| Status | ID            | Task                                                      | P   | Completed |
| ------ | ------------- | --------------------------------------------------------- | --- | --------- |
|        | BLDR-US3-A001 | Implement layout mode toggle (single-page vs multi-step)  | 1   |           |
|        | BLDR-US3-A002 | Build step manager: assign fields to steps, reorder steps | 1   |           |
|        | BLDR-US3-A003 | Implement progress bar component for multi-step mode      | 1   |           |
|        | BLDR-US3-A004 | Build conditional visibility rule editor UI               | 2   |           |
|        | BLDR-US3-A005 | Implement AND/OR rule combinators                         | 2   |           |
|        | BLDR-US3-A006 | Wire conditional logic into the live preview              | 2   |           |

### [BLDR-US4: Live Preview Pane](./PROJECT_PLAN.md#bldr-us4-live-preview-pane-p0) (P0)

**Requirements:** [1.3.11](./REQUIREMENTS.md#13-visual-builder--field-types), [1.5.9](./REQUIREMENTS.md#15-formula-engine)

| Status | ID            | Task                                                                            | P   | Completed |
| ------ | ------------- | ------------------------------------------------------------------------------- | --- | --------- |
|        | BLDR-US4-A001 | Build preview pane container with style isolation                               | 0   |           |
|        | BLDR-US4-A002 | Wire shared field renderers into the preview                                    | 0   |           |
|        | BLDR-US4-A003 | Wire shared formula engine into the preview                                     | 0   |           |
|        | BLDR-US4-A004 | Implement real-time reactivity: config changes propagate to preview immediately | 0   |           |

### [BLDR-US5: Save & Auto-Save](./PROJECT_PLAN.md#bldr-us5-save--auto-save-p0) (P0)

**Requirements:** [1.2.3](./REQUIREMENTS.md#12-calculator-crud)

| Status | ID            | Task                                                               | P   | Completed |
| ------ | ------------- | ------------------------------------------------------------------ | --- | --------- |
|        | BLDR-US5-A001 | Implement debounced auto-save that PUTs config to the API          | 0   |           |
|        | BLDR-US5-A002 | Build save status indicator component                              | 0   |           |
|        | BLDR-US5-A003 | Implement retry logic with user notification on persistent failure | 1   |           |

---

## CALC — Formula Engine & Results

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#calc--formula-engine--results)

### [CALC-US1: Formula Engine Core](./PROJECT_PLAN.md#calc-us1-formula-engine-core-p0) (P0)

**Requirements:** [1.5.1–1.5.5](./REQUIREMENTS.md#15-formula-engine), [1.5.10–1.5.13](./REQUIREMENTS.md#15-formula-engine)

| Status | ID            | Task                                                                  | P   | Completed |
| ------ | ------------- | --------------------------------------------------------------------- | --- | --------- |
|        | CALC-US1-A001 | Implement tokenizer/lexer for formula expressions                     | 0   |           |
|        | CALC-US1-A002 | Implement parser that produces a restricted AST                       | 0   |           |
|        | CALC-US1-A003 | Implement AST evaluator with arithmetic, comparisons, and parentheses | 0   |           |
|        | CALC-US1-A004 | Add IF/THEN/ELSE conditional expression support                       | 0   |           |
|        | CALC-US1-A005 | Add variable reference resolution against field value map             | 0   |           |
|        | CALC-US1-A006 | Add MIN, MAX, ABS, ROUND function support                             | 1   |           |
|        | CALC-US1-A007 | Implement execution timeout (100ms abort)                             | 1   |           |
|        | CALC-US1-A008 | Implement error messages with "did you mean?" suggestions             | 1   |           |
|        | CALC-US1-A009 | Write comprehensive unit tests for edge cases                         | 0   |           |

### [CALC-US2: Formula Editor UI](./PROJECT_PLAN.md#calc-us2-formula-editor-ui-p0) (P0)

**Requirements:** [1.5.6](./REQUIREMENTS.md#15-formula-engine), [1.5.7](./REQUIREMENTS.md#15-formula-engine), [1.5.8](./REQUIREMENTS.md#15-formula-engine), [1.5.9](./REQUIREMENTS.md#15-formula-engine)

| Status | ID            | Task                                                                     | P   | Completed |
| ------ | ------------- | ------------------------------------------------------------------------ | --- | --------- |
|        | CALC-US2-A001 | Build formula output list UI (add/remove/reorder output values)          | 0   |           |
|        | CALC-US2-A002 | Build formula text input with inline validation and error display        | 0   |           |
|        | CALC-US2-A003 | Implement live result preview using current field defaults               | 0   |           |
|        | CALC-US2-A004 | Add rounding configuration per output value                              | 1   |           |
|        | CALC-US2-A005 | Build tiered pricing UI (define quantity brackets and per-bracket rates) | 2   |           |

### [CALC-US3: Results Display Configuration](./PROJECT_PLAN.md#calc-us3-results-display-configuration-p1) (P1)

**Requirements:** [1.6.1–1.6.9](./REQUIREMENTS.md#16-results-display)

| Status | ID            | Task                                                                | P   | Completed |
| ------ | ------------- | ------------------------------------------------------------------- | --- | --------- |
|        | CALC-US3-A001 | Build results display mode selector (single value, range, itemized) | 1   |           |
|        | CALC-US3-A002 | Implement currency and number formatting configuration              | 1   |           |
|        | CALC-US3-A003 | Build custom result message editor (restricted rich text)           | 2   |           |
|        | CALC-US3-A004 | Build conditional message rules (value range → message)             | 2   |           |
|        | CALC-US3-A005 | Implement CTA button configuration (label + URL)                    | 1   |           |
|        | CALC-US3-A006 | Implement restart button on results page                            | 1   |           |

---

## STYL — Styling & Branding

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#styl--styling--branding)

### [STYL-US1: Theme & Appearance Controls](./PROJECT_PLAN.md#styl-us1-theme--appearance-controls-p1) (P1)

**Requirements:** [1.7.1–1.7.8](./REQUIREMENTS.md#17-styling--branding)

| Status | ID            | Task                                                                            | P   | Completed |
| ------ | ------------- | ------------------------------------------------------------------------------- | --- | --------- |
|        | STYL-US1-A001 | Build color picker controls for primary, secondary, background, and text colors | 1   |           |
|        | STYL-US1-A002 | Build font selector with Google Fonts integration                               | 2   |           |
|        | STYL-US1-A003 | Build border radius, padding, and shadow controls                               | 2   |           |
|        | STYL-US1-A004 | Implement light/dark mode toggle                                                | 2   |           |
|        | STYL-US1-A005 | Implement logo upload with preview                                              | 2   |           |
|        | STYL-US1-A006 | Implement custom CSS textarea with sanitization on save                         | 3   |           |
|        | STYL-US1-A007 | Wire all styling controls into the live preview                                 | 1   |           |

### [STYL-US2: Powered-by Badge](./PROJECT_PLAN.md#styl-us2-powered-by-badge-p0) (P0)

**Requirements:** [1.7.9](./REQUIREMENTS.md#17-styling--branding)

| Status | ID            | Task                                                         | P   | Completed |
| ------ | ------------- | ------------------------------------------------------------ | --- | --------- |
|        | STYL-US2-A001 | Implement badge component in the shared field renderers      | 0   |           |
|        | STYL-US2-A002 | Wire badge visibility to the feature flag in config response | 0   |           |
|        | STYL-US2-A003 | Add CSS sanitization rule to prevent badge hiding            | 1   |           |

---

## WDGT — Embeddable Widget

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#wdgt--embeddable-widget)

### [WDGT-US1: Widget Bundle & Loader](./PROJECT_PLAN.md#wdgt-us1-widget-bundle--loader-p0) (P0)

**Requirements:** [1.8.1–1.8.10](./REQUIREMENTS.md#18-embeddable-widget), [1.8.12–1.8.14](./REQUIREMENTS.md#18-embeddable-widget)

| Status | ID            | Task                                                                    | P   | Completed |
| ------ | ------------- | ----------------------------------------------------------------------- | --- | --------- |
|        | WDGT-US1-A001 | Build widget loader script (< 2KB, async bundle fetch)                  | 0   |           |
|        | WDGT-US1-A002 | Build widget bundle build pipeline (vanilla JS, tree-shaken, < 50KB gz) | 0   |           |
|        | WDGT-US1-A003 | Implement Shadow DOM container and style injection                      | 0   |           |
|        | WDGT-US1-A004 | Implement config fetch with retry and backoff                           | 0   |           |
|        | WDGT-US1-A005 | Wire shared field renderers into the widget                             | 0   |           |
|        | WDGT-US1-A006 | Wire shared formula engine into the widget                              | 0   |           |
|        | WDGT-US1-A007 | Implement responsive layout (320px–2560px)                              | 1   |           |
|        | WDGT-US1-A008 | Implement keyboard navigation and ARIA labels                           | 1   |           |
|        | WDGT-US1-A009 | Implement graceful fallback message on config fetch failure             | 1   |           |
|        | WDGT-US1-A010 | Build embed code snippet UI in dashboard with copy-to-clipboard         | 0   |           |
|        | WDGT-US1-A011 | Cross-browser testing (Chrome, Firefox, Safari, Edge)                   | 1   |           |

### [WDGT-US2: iFrame Embed Fallback](./PROJECT_PLAN.md#wdgt-us2-iframe-embed-fallback-p2) (P2)

**Requirements:** [1.8.11](./REQUIREMENTS.md#18-embeddable-widget)

| Status | ID            | Task                                                       | P   | Completed |
| ------ | ------------- | ---------------------------------------------------------- | --- | --------- |
|        | WDGT-US2-A001 | Build hosted calculator page for iFrame embedding          | 2   |           |
|        | WDGT-US2-A002 | Implement postMessage-based auto-resize                    | 2   |           |
|        | WDGT-US2-A003 | Add iFrame embed code option to dashboard embed snippet UI | 2   |           |

### [WDGT-US3: Widget Error Reporting](./PROJECT_PLAN.md#wdgt-us3-widget-error-reporting-p1) (P1)

**Requirements:** Derived from [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) — Observability/Error Tracking

| Status | ID            | Task                                                       | P   | Completed |
| ------ | ------------- | ---------------------------------------------------------- | --- | --------- |
|        | WDGT-US3-A001 | Implement widget error boundary with fallback UI           | 1   |           |
|        | WDGT-US3-A002 | Implement fire-and-forget error reporting POST             | 1   |           |
|        | WDGT-US3-A003 | Build API endpoint to receive and log widget error reports | 1   |           |

---

## TMPL — Templates

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#tmpl--templates)

### [TMPL-US1: Template System & Starter Set](./PROJECT_PLAN.md#tmpl-us1-template-system--starter-set-p1) (P1)

**Requirements:** [1.10.1–1.10.6](./REQUIREMENTS.md#110-templates)

| Status | ID            | Task                                                                 | P   | Completed |
| ------ | ------------- | -------------------------------------------------------------------- | --- | --------- |
|        | TMPL-US1-A001 | Implement template storage (system-owned configs with template flag) | 1   |           |
|        | TMPL-US1-A002 | Build template browser UI with previews                              | 1   |           |
|        | TMPL-US1-A003 | Implement "copy template to my account" action                       | 1   |           |
|        | TMPL-US1-A004 | Author template: Plumbing Estimate                                   | 2   |           |
|        | TMPL-US1-A005 | Author template: Web Design Quote                                    | 2   |           |
|        | TMPL-US1-A006 | Author template: Moving Cost Estimator                               | 2   |           |
|        | TMPL-US1-A007 | Author template: Cleaning Service Quote                              | 2   |           |
|        | TMPL-US1-A008 | Author template: Landscaping Estimate                                | 3   |           |
|        | TMPL-US1-A009 | Author template: Home Renovation Calculator                          | 3   |           |
|        | TMPL-US1-A010 | Author template: Freelance Hourly Rate                               | 3   |           |
|        | TMPL-US1-A011 | Author template: Event/Venue Rental Estimate                         | 3   |           |
|        | TMPL-US1-A012 | Author template: Printing & Signage Quote                            | 3   |           |
|        | TMPL-US1-A013 | Author template: SaaS Pricing Calculator                             | 3   |           |

---

# Phase 2: Growth

## LEAD — Lead Capture & Submissions

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#lead--lead-capture--submissions)

### [LEAD-US1: Submission Pipeline](./PROJECT_PLAN.md#lead-us1-submission-pipeline-p0) (P0)

**Requirements:** [2.3.1](./REQUIREMENTS.md#23-submission-log--email-notifications-lead-capture), [2.3.2](./REQUIREMENTS.md#23-submission-log--email-notifications-lead-capture), [2.3.11](./REQUIREMENTS.md#23-submission-log--email-notifications-lead-capture), [1.9.5](./REQUIREMENTS.md#19-backend-api--data-storage), [1.9.6](./REQUIREMENTS.md#19-backend-api--data-storage)

| Status | ID            | Task                                                               | P   | Completed |
| ------ | ------------- | ------------------------------------------------------------------ | --- | --------- |
|        | LEAD-US1-A001 | Write migration: submissions table                                 | 0   |           |
|        | LEAD-US1-A002 | Implement submission POST endpoint with rate limiting              | 0   |           |
|        | LEAD-US1-A003 | Implement widget submission flow (collect, POST, retry on failure) | 0   |           |
|        | LEAD-US1-A004 | Add localStorage retry queue in widget                             | 1   |           |

### [LEAD-US2: Submission Dashboard](./PROJECT_PLAN.md#lead-us2-submission-dashboard-p1) (P1)

**Requirements:** [2.3.3](./REQUIREMENTS.md#23-submission-log--email-notifications-lead-capture), [2.3.4](./REQUIREMENTS.md#23-submission-log--email-notifications-lead-capture), [2.3.5](./REQUIREMENTS.md#23-submission-log--email-notifications-lead-capture)

| Status | ID            | Task                                                                                | P   | Completed |
| ------ | ------------- | ----------------------------------------------------------------------------------- | --- | --------- |
|        | LEAD-US2-A001 | Implement submissions list API endpoint (paginated, ownership-gated, 30-day filter) | 1   |           |
|        | LEAD-US2-A002 | Build submission list view in dashboard                                             | 1   |           |
|        | LEAD-US2-A003 | Build submission detail view                                                        | 1   |           |

### [LEAD-US3: Lead Capture Form](./PROJECT_PLAN.md#lead-us3-lead-capture-form-p1) (P1)

**Requirements:** [2.3.6](./REQUIREMENTS.md#23-submission-log--email-notifications-lead-capture), [2.3.7](./REQUIREMENTS.md#23-submission-log--email-notifications-lead-capture)

| Status | ID            | Task                                                                            | P   | Completed |
| ------ | ------------- | ------------------------------------------------------------------------------- | --- | --------- |
|        | LEAD-US3-A001 | Add lead capture configuration UI in the builder                                | 1   |           |
|        | LEAD-US3-A002 | Implement lead capture form rendering in the widget (gated and non-gated modes) | 1   |           |
|        | LEAD-US3-A003 | Include lead_info in submission payload and storage                             | 1   |           |

### [LEAD-US4: Email Notifications](./PROJECT_PLAN.md#lead-us4-email-notifications-p1) (P1)

**Requirements:** [2.3.8](./REQUIREMENTS.md#23-submission-log--email-notifications-lead-capture), [2.3.9](./REQUIREMENTS.md#23-submission-log--email-notifications-lead-capture), [2.3.10](./REQUIREMENTS.md#23-submission-log--email-notifications-lead-capture)

| Status | ID            | Task                                                  | P   | Completed |
| ------ | ------------- | ----------------------------------------------------- | --- | --------- |
|        | LEAD-US4-A001 | Set up job queue for async processing                 | 1   |           |
|        | LEAD-US4-A002 | Integrate transactional email service                 | 1   |           |
|        | LEAD-US4-A003 | Build lead notification email template                | 1   |           |
|        | LEAD-US4-A004 | Implement notification toggle in builder settings     | 2   |           |
|        | LEAD-US4-A005 | Wire submission pipeline to enqueue notification jobs | 1   |           |

---

## SEOP — SEO Pages & Template Gallery

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#seop--seo-pages--template-gallery)

### [SEOP-US1: Template Gallery Pages](./PROJECT_PLAN.md#seop-us1-template-gallery-pages-p1) (P1)

**Requirements:** [2.1.1–2.1.9](./REQUIREMENTS.md#21-template-gallery-public-seo-pages)

| Status | ID            | Task                                                                            | P   | Completed |
| ------ | ------------- | ------------------------------------------------------------------------------- | --- | --------- |
|        | SEOP-US1-A001 | Build SSR/static template landing page component                                | 1   |           |
|        | SEOP-US1-A002 | Implement meta tag generation (title, description, canonical, OG, Twitter Card) | 1   |           |
|        | SEOP-US1-A003 | Add Schema.org structured data (FAQPage, HowTo)                                 | 2   |           |
|        | SEOP-US1-A004 | Embed live demo calculator on each template page                                | 1   |           |
|        | SEOP-US1-A005 | Build gallery index page with categories and search/filter                      | 2   |           |
|        | SEOP-US1-A006 | Implement XML sitemap generation                                                | 1   |           |

### [SEOP-US2: Blog Infrastructure](./PROJECT_PLAN.md#seop-us2-blog-infrastructure-p2) (P2)

**Requirements:** [2.2.1–2.2.6](./REQUIREMENTS.md#22-blog--content-marketing-infrastructure)

| Status | ID            | Task                                                | P   | Completed |
| ------ | ------------- | --------------------------------------------------- | --- | --------- |
|        | SEOP-US2-A001 | Build blog post rendering with markdown/MDX support | 2   |           |
|        | SEOP-US2-A002 | Implement category and tag taxonomy                 | 3   |           |
|        | SEOP-US2-A003 | Enable inline calculator demo embedding in posts    | 3   |           |
|        | SEOP-US2-A004 | Add blog posts to XML sitemap                       | 2   |           |
|        | SEOP-US2-A005 | Implement RSS feed                                  | 3   |           |

---

## WSEO — Widget SEO Enhancements

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#wseo--widget-seo-enhancements)

### [WSEO-US1: Widget Search Engine Compatibility](./PROJECT_PLAN.md#wseo-us1-widget-search-engine-compatibility-p2) (P2)

**Requirements:** [2.4.1–2.4.4](./REQUIREMENTS.md#24-widget-seo-enhancements)

| Status | ID            | Task                                                      | P   | Completed |
| ------ | ------------- | --------------------------------------------------------- | --- | --------- |
|        | WSEO-US1-A001 | Audit widget output for semantic HTML and ARIA compliance | 2   |           |
|        | WSEO-US1-A002 | Implement `<noscript>` fallback content generation        | 2   |           |
|        | WSEO-US1-A003 | Add OG meta tags to standalone calculator pages           | 3   |           |

---

# Phase 3: Monetization

## BILL — Billing & Subscriptions

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#bill--billing--subscriptions)

### [BILL-US1: Stripe Integration & Plan Management](./PROJECT_PLAN.md#bill-us1-stripe-integration--plan-management-p0) (P0)

**Requirements:** [3.1.1–3.1.8](./REQUIREMENTS.md#31-billing--subscription-management)

| Status | ID            | Task                                                                                         | P   | Completed |
| ------ | ------------- | -------------------------------------------------------------------------------------------- | --- | --------- |
|        | BILL-US1-A001 | Write migration: subscriptions table, plans table with feature_flags jsonb                   | 0   |           |
|        | BILL-US1-A002 | Configure Stripe products and prices (3 plans, monthly + annual)                             | 0   |           |
|        | BILL-US1-A003 | Implement checkout session creation endpoint                                                 | 0   |           |
|        | BILL-US1-A004 | Implement Stripe webhook handler with signature verification and event deduplication         | 0   |           |
|        | BILL-US1-A005 | Implement subscription status sync (checkout complete, payment failed, subscription deleted) | 0   |           |
|        | BILL-US1-A006 | Implement server-side feature gating middleware                                              | 0   |           |
|        | BILL-US1-A007 | Implement grace period logic for failed payments                                             | 1   |           |
|        | BILL-US1-A008 | Build billing page in dashboard (current plan, upgrade/downgrade/cancel, invoices)           | 1   |           |
|        | BILL-US1-A009 | Implement graceful downgrade: re-enable badge, disable paid features, no data deletion       | 1   |           |

---

## PROT — Pro Tier Features

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#prot--pro-tier-features)

### [PROT-US1: Branding Removal](./PROJECT_PLAN.md#prot-us1-branding-removal-p1) (P1)

**Requirements:** [3.2.1](./REQUIREMENTS.md#32-pro-tier-features)

| Status | ID            | Task                                                                    | P   | Completed |
| ------ | ------------- | ----------------------------------------------------------------------- | --- | --------- |
|        | PROT-US1-A001 | Add branding feature flag to config response based on subscription tier | 1   |           |
|        | PROT-US1-A002 | Update widget to conditionally render badge based on flag               | 1   |           |

### [PROT-US2: PDF Quote Generation](./PROJECT_PLAN.md#prot-us2-pdf-quote-generation-p2) (P2)

**Requirements:** [3.2.2](./REQUIREMENTS.md#32-pro-tier-features), [3.2.3](./REQUIREMENTS.md#32-pro-tier-features)

| Status | ID            | Task                                                                              | P   | Completed |
| ------ | ------------- | --------------------------------------------------------------------------------- | --- | --------- |
|        | PROT-US2-A001 | Build PDF branding configuration UI in dashboard                                  | 2   |           |
|        | PROT-US2-A002 | Implement server-side PDF renderer (stateless, receives data, outputs PDF binary) | 2   |           |
|        | PROT-US2-A003 | Wire submission pipeline to enqueue PDF generation jobs for Pro+ users            | 2   |           |
|        | PROT-US2-A004 | Build PDF preview in dashboard                                                    | 3   |           |

### [PROT-US3: Custom Redirects & Tracking](./PROJECT_PLAN.md#prot-us3-custom-redirects--tracking-p2) (P2)

**Requirements:** [3.2.4](./REQUIREMENTS.md#32-pro-tier-features), [3.2.5](./REQUIREMENTS.md#32-pro-tier-features)

| Status | ID            | Task                                                                        | P   | Completed |
| ------ | ------------- | --------------------------------------------------------------------------- | --- | --------- |
|        | PROT-US3-A001 | Add redirect URL and tracking ID fields to builder settings (feature-gated) | 2   |           |
|        | PROT-US3-A002 | Implement post-submission redirect in widget                                | 2   |           |
|        | PROT-US3-A003 | Implement GA and Meta Pixel event firing in widget                          | 2   |           |

### [PROT-US4: Unlimited Submission History](./PROJECT_PLAN.md#prot-us4-unlimited-submission-history-p2) (P2)

**Requirements:** [3.2.6](./REQUIREMENTS.md#32-pro-tier-features)

| Status | ID            | Task                                                                        | P   | Completed |
| ------ | ------------- | --------------------------------------------------------------------------- | --- | --------- |
|        | PROT-US4-A001 | Update submissions query to conditionally apply 30-day filter based on plan | 2   |           |
|        | PROT-US4-A002 | Update data retention cleanup job to skip Pro+ users                        | 2   |           |

---

## BSNS — Business Tier Features

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#bsns--business-tier-features)

### [BSNS-US1: CRM & Webhook Integrations](./PROJECT_PLAN.md#bsns-us1-crm--webhook-integrations-p3) (P3)

**Requirements:** [3.3.1](./REQUIREMENTS.md#33-business-tier-features), [3.3.2](./REQUIREMENTS.md#33-business-tier-features)

| Status | ID            | Task                                                                   | P   | Completed |
| ------ | ------------- | ---------------------------------------------------------------------- | --- | --------- |
|        | BSNS-US1-A001 | Implement webhook URL configuration with SSRF validation               | 3   |           |
|        | BSNS-US1-A002 | Wire submission pipeline to fire outbound webhooks for Business+ users | 3   |           |
|        | BSNS-US1-A003 | Implement HubSpot OAuth + contact creation integration                 | 4   |           |
|        | BSNS-US1-A004 | Implement Salesforce OAuth + lead creation integration                 | 5   |           |
|        | BSNS-US1-A005 | Implement Pipedrive OAuth + deal creation integration                  | 5   |           |

### [BSNS-US2: A/B Testing](./PROJECT_PLAN.md#bsns-us2-ab-testing-p4) (P4)

**Requirements:** [3.3.3](./REQUIREMENTS.md#33-business-tier-features), [3.3.4](./REQUIREMENTS.md#33-business-tier-features)

| Status | ID            | Task                                                                   | P   | Completed |
| ------ | ------------- | ---------------------------------------------------------------------- | --- | --------- |
|        | BSNS-US2-A001 | Write migration: ab_test_variants table                                | 4   |           |
|        | BSNS-US2-A002 | Build A/B test creation UI in dashboard                                | 4   |           |
|        | BSNS-US2-A003 | Implement variant selection logic in widget (deterministic by session) | 4   |           |
|        | BSNS-US2-A004 | Track impressions and completions per variant                          | 4   |           |
|        | BSNS-US2-A005 | Build A/B test results dashboard with per-variant metrics              | 4   |           |

### [BSNS-US3: Team Management](./PROJECT_PLAN.md#bsns-us3-team-management-p3) (P3)

**Requirements:** [3.3.5](./REQUIREMENTS.md#33-business-tier-features), [3.3.6](./REQUIREMENTS.md#33-business-tier-features)

| Status | ID            | Task                                                              | P   | Completed |
| ------ | ------------- | ----------------------------------------------------------------- | --- | --------- |
|        | BSNS-US3-A001 | Write migration: teams table, team_members table with role column | 3   |           |
|        | BSNS-US3-A002 | Implement invite-by-email flow with invitation acceptance         | 3   |           |
|        | BSNS-US3-A003 | Implement role-based access control in API middleware             | 3   |           |
|        | BSNS-US3-A004 | Build team management UI in dashboard                             | 3   |           |
|        | BSNS-US3-A005 | Implement seat limit enforcement with Stripe quantity updates     | 4   |           |

### [BSNS-US4: Submission Analytics Dashboard](./PROJECT_PLAN.md#bsns-us4-submission-analytics-dashboard-p4) (P4)

**Requirements:** [3.3.9](./REQUIREMENTS.md#33-business-tier-features)

| Status | ID            | Task                                                                                | P   | Completed |
| ------ | ------------- | ----------------------------------------------------------------------------------- | --- | --------- |
|        | BSNS-US4-A001 | Implement widget-side event tracking (view, start, step_complete, complete, submit) | 4   |           |
|        | BSNS-US4-A002 | Build analytics event ingestion endpoint                                            | 4   |           |
|        | BSNS-US4-A003 | Build funnel visualization component                                                | 5   |           |
|        | BSNS-US4-A004 | Build average quote value chart                                                     | 5   |           |
|        | BSNS-US4-A005 | Build field engagement breakdown                                                    | 5   |           |

### [BSNS-US5: Custom Domain for Standalone Pages](./PROJECT_PLAN.md#bsns-us5-custom-domain-for-standalone-pages-p4) (P4)

**Requirements:** [3.3.7](./REQUIREMENTS.md#33-business-tier-features)

| Status | ID            | Task                                                                  | P   | Completed |
| ------ | ------------- | --------------------------------------------------------------------- | --- | --------- |
|        | BSNS-US5-A001 | Build custom domain configuration UI with CNAME instructions          | 4   |           |
|        | BSNS-US5-A002 | Implement DNS verification endpoint (check CNAME resolution)          | 4   |           |
|        | BSNS-US5-A003 | Implement automated SSL certificate provisioning for custom domains   | 4   |           |
|        | BSNS-US5-A004 | Implement request routing to serve calculator pages on custom domains | 4   |           |
|        | BSNS-US5-A005 | Gate custom domain feature by Business tier in API middleware         | 4   |           |

### [BSNS-US6: Conditional Email Sequences](./PROJECT_PLAN.md#bsns-us6-conditional-email-sequences-p4) (P4)

**Requirements:** [3.3.8](./REQUIREMENTS.md#33-business-tier-features)

| Status | ID            | Task                                                                | P   | Completed |
| ------ | ------------- | ------------------------------------------------------------------- | --- | --------- |
|        | BSNS-US6-A001 | Build conditional email rule editor UI (condition + template pairs) | 4   |           |
|        | BSNS-US6-A002 | Build email template editor (subject, rich text body, sender name)  | 4   |           |
|        | BSNS-US6-A003 | Implement rule evaluation engine in the submission pipeline         | 4   |           |
|        | BSNS-US6-A004 | Wire conditional email dispatch into the async job queue            | 4   |           |
|        | BSNS-US6-A005 | Implement email template preview in dashboard                       | 5   |           |

---

## AGCY — Agency Tier Features

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#agcy--agency-tier-features)

### [AGCY-US1: White-Label & Sub-Accounts](./PROJECT_PLAN.md#agcy-us1-white-label--sub-accounts-p5) (P5)

**Requirements:** [3.4.1](./REQUIREMENTS.md#34-agency-tier-features), [3.4.2](./REQUIREMENTS.md#34-agency-tier-features)

| Status | ID            | Task                                                                                          | P   | Completed |
| ------ | ------------- | --------------------------------------------------------------------------------------------- | --- | --------- |
|        | AGCY-US1-A001 | Implement white-label flag that strips QuoteCraft branding from widget, dashboard, and emails | 5   |           |
|        | AGCY-US1-A002 | Build client sub-account creation and management                                              | 5   |           |
|        | AGCY-US1-A003 | Build account switcher UI                                                                     | 5   |           |
|        | AGCY-US1-A004 | Implement data isolation between sub-accounts                                                 | 5   |           |

### [AGCY-US2: Public API & Webhooks](./PROJECT_PLAN.md#agcy-us2-public-api--webhooks-p5) (P5)

**Requirements:** [3.4.3](./REQUIREMENTS.md#34-agency-tier-features), [3.4.4](./REQUIREMENTS.md#34-agency-tier-features), [3.4.5](./REQUIREMENTS.md#34-agency-tier-features)

| Status | ID            | Task                                                                        | P   | Completed |
| ------ | ------------- | --------------------------------------------------------------------------- | --- | --------- |
|        | AGCY-US2-A001 | Implement API key generation, hashed storage, and authentication middleware | 5   |           |
|        | AGCY-US2-A002 | Expose calculator CRUD and submission read endpoints via API key auth       | 5   |           |
|        | AGCY-US2-A003 | Build API documentation (auto-generated from route definitions)             | 6   |           |
|        | AGCY-US2-A004 | Implement per-calculator webhook configuration and dispatch                 | 5   |           |

### [AGCY-US3: Bulk Operations](./PROJECT_PLAN.md#agcy-us3-bulk-operations-p6) (P6)

**Requirements:** [3.4.6](./REQUIREMENTS.md#34-agency-tier-features)

| Status | ID            | Task                                                       | P   | Completed |
| ------ | ------------- | ---------------------------------------------------------- | --- | --------- |
|        | AGCY-US3-A001 | Implement bulk update API endpoint with atomic transaction | 6   |           |
|        | AGCY-US3-A002 | Build bulk selection and update UI in dashboard            | 6   |           |

### [AGCY-US4: SSO / SAML Support](./PROJECT_PLAN.md#agcy-us4-sso--saml-support-p6) (P6)

**Requirements:** [3.4.7](./REQUIREMENTS.md#34-agency-tier-features)

| Status | ID            | Task                                                                        | P   | Completed |
| ------ | ------------- | --------------------------------------------------------------------------- | --- | --------- |
|        | AGCY-US4-A001 | Build SAML IdP configuration UI in dashboard (metadata URL or manual entry) | 6   |           |
|        | AGCY-US4-A002 | Implement SAML assertion consumer service (ACS) endpoint                    | 6   |           |
|        | AGCY-US4-A003 | Implement SAML assertion validation (signature, audience, time bounds)      | 6   |           |
|        | AGCY-US4-A004 | Implement just-in-time user provisioning from SAML attributes               | 6   |           |
|        | AGCY-US4-A005 | Write migration: saml_configurations table                                  | 6   |           |

---

# Phase 4: Expansion

## PLAT — Platform Integrations

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#plat--platform-integrations)

### [PLAT-US1: WordPress Plugin](./PROJECT_PLAN.md#plat-us1-wordpress-plugin-p4) (P4)

**Requirements:** [4.1.1](./REQUIREMENTS.md#41-platform-integrations)

| Status | ID            | Task                                                    | P   | Completed |
| ------ | ------------- | ------------------------------------------------------- | --- | --------- |
|        | PLAT-US1-A001 | Build WordPress plugin with settings page and auth flow | 4   |           |
|        | PLAT-US1-A002 | Implement Gutenberg block for calculator embedding      | 4   |           |
|        | PLAT-US1-A003 | Implement shortcode fallback                            | 5   |           |
|        | PLAT-US1-A004 | Submit to WordPress plugin directory                    | 5   |           |

### [PLAT-US2: Zapier Native Integration](./PROJECT_PLAN.md#plat-us2-zapier-native-integration-p5) (P5)

**Requirements:** [4.1.3](./REQUIREMENTS.md#41-platform-integrations)

| Status | ID            | Task                                                     | P   | Completed |
| ------ | ------------- | -------------------------------------------------------- | --- | --------- |
|        | PLAT-US2-A001 | Build Zapier integration app with New Submission trigger | 5   |           |
|        | PLAT-US2-A002 | Implement Zapier authentication flow (API key based)     | 5   |           |
|        | PLAT-US2-A003 | Submit to Zapier app directory                           | 6   |           |

### [PLAT-US3: Shopify App](./PROJECT_PLAN.md#plat-us3-shopify-app-p5) (P5)

**Requirements:** [4.1.2](./REQUIREMENTS.md#41-platform-integrations)

| Status | ID            | Task                                                                   | P   | Completed |
| ------ | ------------- | ---------------------------------------------------------------------- | --- | --------- |
|        | PLAT-US3-A001 | Scaffold Shopify app with OAuth authentication flow                    | 5   |           |
|        | PLAT-US3-A002 | Implement QuoteCraft account linking within the Shopify app            | 5   |           |
|        | PLAT-US3-A003 | Build Shopify app block for embedding calculators via the theme editor | 5   |           |
|        | PLAT-US3-A004 | Submit to Shopify app store                                            | 6   |           |

### [PLAT-US4: Make (Integromat) Native Integration](./PROJECT_PLAN.md#plat-us4-make-integromat-native-integration-p5) (P5)

**Requirements:** [4.1.4](./REQUIREMENTS.md#41-platform-integrations)

| Status | ID            | Task                                                   | P   | Completed |
| ------ | ------------- | ------------------------------------------------------ | --- | --------- |
|        | PLAT-US4-A001 | Build Make integration app with New Submission trigger | 5   |           |
|        | PLAT-US4-A002 | Implement Make authentication flow (API key based)     | 5   |           |
|        | PLAT-US4-A003 | Submit to Make app directory                           | 6   |           |

---

## EMBD — Advanced Embed Modes

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#embd--advanced-embed-modes)

### [EMBD-US1: Popup & Slide-In Modes](./PROJECT_PLAN.md#embd-us1-popup--slide-in-modes-p3) (P3)

**Requirements:** [4.2.1](./REQUIREMENTS.md#42-advanced-embed-modes), [4.2.2](./REQUIREMENTS.md#42-advanced-embed-modes), [4.2.4](./REQUIREMENTS.md#42-advanced-embed-modes)

| Status | ID            | Task                                                         | P   | Completed |
| ------ | ------------- | ------------------------------------------------------------ | --- | --------- |
|        | EMBD-US1-A001 | Implement popup modal container and trigger button in widget | 3   |           |
|        | EMBD-US1-A002 | Implement slide-in panel with scroll-depth trigger           | 4   |           |
|        | EMBD-US1-A003 | Add embed mode selector to builder settings                  | 3   |           |
|        | EMBD-US1-A004 | Generate mode-specific embed code snippets                   | 3   |           |

### [EMBD-US2: Standalone Hosted Pages](./PROJECT_PLAN.md#embd-us2-standalone-hosted-pages-p4) (P4)

**Requirements:** [4.2.3](./REQUIREMENTS.md#42-advanced-embed-modes)

| Status | ID            | Task                                   | P   | Completed |
| ------ | ------------- | -------------------------------------- | --- | --------- |
|        | EMBD-US2-A001 | Build hosted calculator page route     | 4   |           |
|        | EMBD-US2-A002 | Add OG meta tags for social sharing    | 4   |           |
|        | EMBD-US2-A003 | Add "Copy shareable link" to dashboard | 4   |           |

---

## I18N — Multi-Language Support

[Epic in PROJECT_PLAN.md](./PROJECT_PLAN.md#i18n--multi-language-support)

### [I18N-US1: Widget Localization](./PROJECT_PLAN.md#i18n-us1-widget-localization-p5) (P5)

**Requirements:** [4.3.1–4.3.4](./REQUIREMENTS.md#43-multi-language-support)

| Status | ID            | Task                                                  | P   | Completed |
| ------ | ------------- | ----------------------------------------------------- | --- | --------- |
|        | I18N-US1-A001 | Implement locale configuration in calculator settings | 5   |           |
|        | I18N-US1-A002 | Extract all widget UI strings into a translation map  | 5   |           |
|        | I18N-US1-A003 | Create translation files for top 10 languages         | 6   |           |
|        | I18N-US1-A004 | Implement RTL layout support in widget CSS            | 6   |           |
|        | I18N-US1-A005 | Wire currency formatting to locale settings           | 5   |           |
