# QuoteCraft — Project Plan

Cross-reference: [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) · [REQUIREMENTS.md](./REQUIREMENTS.md) · [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) · [PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

## Table of Contents

### [Phase 1: MVP](#phase-1-mvp)

- [INFR — Infrastructure & Backend Foundation](#infr--infrastructure--backend-foundation)
  - [INFR-US1: Project Scaffolding (P0)](#infr-us1-project-scaffolding-p0)
  - [INFR-US2: Database & Migrations (P0)](#infr-us2-database--migrations-p0)
  - [INFR-US3: API Server Skeleton (P0)](#infr-us3-api-server-skeleton-p0)
  - [INFR-US4: Authentication (P0)](#infr-us4-authentication-p0)
  - [INFR-US5: Calculator CRUD API (P0)](#infr-us5-calculator-crud-api-p0)
  - [INFR-US6: Object Storage & CDN (P0)](#infr-us6-object-storage--cdn-p0)
- [BLDR — Visual Calculator Builder](#bldr--visual-calculator-builder)
  - [BLDR-US1: Dashboard Shell & Navigation (P0)](#bldr-us1-dashboard-shell--navigation-p0)
  - [BLDR-US2: Field Type Palette & Configuration (P0)](#bldr-us2-field-type-palette--configuration-p0)
  - [BLDR-US3: Layout & Conditional Flow (P1)](#bldr-us3-layout--conditional-flow-p1)
  - [BLDR-US4: Live Preview Pane (P0)](#bldr-us4-live-preview-pane-p0)
  - [BLDR-US5: Save & Auto-Save (P0)](#bldr-us5-save--auto-save-p0)
- [CALC — Formula Engine & Results](#calc--formula-engine--results)
  - [CALC-US1: Formula Engine Core (P0)](#calc-us1-formula-engine-core-p0)
  - [CALC-US2: Formula Editor UI (P0)](#calc-us2-formula-editor-ui-p0)
  - [CALC-US3: Results Display Configuration (P1)](#calc-us3-results-display-configuration-p1)
- [STYL — Styling & Branding](#styl--styling--branding)
  - [STYL-US1: Theme & Appearance Controls (P1)](#styl-us1-theme--appearance-controls-p1)
  - [STYL-US2: Powered-by Badge (P0)](#styl-us2-powered-by-badge-p0)
- [WDGT — Embeddable Widget](#wdgt--embeddable-widget)
  - [WDGT-US1: Widget Bundle & Loader (P0)](#wdgt-us1-widget-bundle--loader-p0)
  - [WDGT-US2: iFrame Embed Fallback (P2)](#wdgt-us2-iframe-embed-fallback-p2)
  - [WDGT-US3: Widget Error Reporting (P1)](#wdgt-us3-widget-error-reporting-p1)
- [TMPL — Templates](#tmpl--templates)
  - [TMPL-US1: Template System & Starter Set (P1)](#tmpl-us1-template-system--starter-set-p1)

### [Phase 2: Growth](#phase-2-growth)

- [LEAD — Lead Capture & Submissions](#lead--lead-capture--submissions)
  - [LEAD-US1: Submission Pipeline (P0)](#lead-us1-submission-pipeline-p0)
  - [LEAD-US2: Submission Dashboard (P1)](#lead-us2-submission-dashboard-p1)
  - [LEAD-US3: Lead Capture Form (P1)](#lead-us3-lead-capture-form-p1)
  - [LEAD-US4: Email Notifications (P1)](#lead-us4-email-notifications-p1)
- [SEOP — SEO Pages & Template Gallery](#seop--seo-pages--template-gallery)
  - [SEOP-US1: Template Gallery Pages (P1)](#seop-us1-template-gallery-pages-p1)
  - [SEOP-US2: Blog Infrastructure (P2)](#seop-us2-blog-infrastructure-p2)
- [WSEO — Widget SEO Enhancements](#wseo--widget-seo-enhancements)
  - [WSEO-US1: Widget Search Engine Compatibility (P2)](#wseo-us1-widget-search-engine-compatibility-p2)

### [Phase 3: Monetization](#phase-3-monetization)

- [BILL — Billing & Subscriptions](#bill--billing--subscriptions)
  - [BILL-US1: Stripe Integration & Plan Management (P0)](#bill-us1-stripe-integration--plan-management-p0)
- [PROT — Pro Tier Features](#prot--pro-tier-features)
  - [PROT-US1: Branding Removal (P1)](#prot-us1-branding-removal-p1)
  - [PROT-US2: PDF Quote Generation (P2)](#prot-us2-pdf-quote-generation-p2)
  - [PROT-US3: Custom Redirects & Tracking (P2)](#prot-us3-custom-redirects--tracking-p2)
  - [PROT-US4: Unlimited Submission History (P2)](#prot-us4-unlimited-submission-history-p2)
- [BSNS — Business Tier Features](#bsns--business-tier-features)
  - [BSNS-US1: CRM & Webhook Integrations (P3)](#bsns-us1-crm--webhook-integrations-p3)
  - [BSNS-US2: A/B Testing (P4)](#bsns-us2-ab-testing-p4)
  - [BSNS-US3: Team Management (P3)](#bsns-us3-team-management-p3)
  - [BSNS-US4: Submission Analytics Dashboard (P4)](#bsns-us4-submission-analytics-dashboard-p4)
  - [BSNS-US5: Custom Domain for Standalone Pages (P4)](#bsns-us5-custom-domain-for-standalone-pages-p4)
  - [BSNS-US6: Conditional Email Sequences (P4)](#bsns-us6-conditional-email-sequences-p4)
- [AGCY — Agency Tier Features](#agcy--agency-tier-features)
  - [AGCY-US1: White-Label & Sub-Accounts (P5)](#agcy-us1-white-label--sub-accounts-p5)
  - [AGCY-US2: Public API & Webhooks (P5)](#agcy-us2-public-api--webhooks-p5)
  - [AGCY-US3: Bulk Operations (P6)](#agcy-us3-bulk-operations-p6)
  - [AGCY-US4: SSO / SAML Support (P6)](#agcy-us4-sso--saml-support-p6)

### [Phase 4: Expansion](#phase-4-expansion)

- [PLAT — Platform Integrations](#plat--platform-integrations)
  - [PLAT-US1: WordPress Plugin (P4)](#plat-us1-wordpress-plugin-p4)
  - [PLAT-US2: Zapier Native Integration (P5)](#plat-us2-zapier-native-integration-p5)
  - [PLAT-US3: Shopify App (P5)](#plat-us3-shopify-app-p5)
  - [PLAT-US4: Make (Integromat) Native Integration (P5)](#plat-us4-make-integromat-native-integration-p5)
- [EMBD — Advanced Embed Modes](#embd--advanced-embed-modes)
  - [EMBD-US1: Popup & Slide-In Modes (P3)](#embd-us1-popup--slide-in-modes-p3)
  - [EMBD-US2: Standalone Hosted Pages (P4)](#embd-us2-standalone-hosted-pages-p4)
- [I18N — Multi-Language Support](#i18n--multi-language-support)
  - [I18N-US1: Widget Localization (P5)](#i18n-us1-widget-localization-p5)

### [Appendix: Requirement Traceability](#appendix-requirement-traceability)

---

# Phase 1: MVP

Everything here ships before the first public user. The end-to-end flow: sign up → build a calculator → embed it → see it render.

---

## INFR — Infrastructure & Backend Foundation

The API server, database, authentication, and deployment pipeline. Every other epic depends on this.

### INFR-US1: Project Scaffolding (P0)

**As a** developer, **I need** a monorepo with build tooling, linting, testing, and CI so that all subsequent work has a consistent foundation.

**Depends on:** Nothing
**Requirements:** Infrastructure prerequisite — no direct functional requirement. Enables all subsequent work.
**Acceptance Criteria:**
- Monorepo contains separate packages for: API server, dashboard (React), widget, and shared libraries (formula engine, config schema, field renderers)
- Build, lint, and test commands work for each package
- CI pipeline runs on every push: lint, type-check, unit tests
- README documents local dev setup

| ID | Task | P |
|----|------|---|
| INFR-US1-A001 | Initialize monorepo with package manager workspaces | 0 |
| INFR-US1-A002 | Configure TypeScript, linting, and formatting rules | 0 |
| INFR-US1-A003 | Set up CI pipeline (lint, type-check, test) | 0 |
| INFR-US1-A004 | Create package stubs for api, dashboard, widget, and shared | 0 |

### INFR-US2: Database & Migrations (P0)

**As a** developer, **I need** a PostgreSQL database with a migration system so that schema changes are versioned and reproducible.

**Depends on:** INFR-US1
**Requirements:** 1.9.2, 1.9.8
**Acceptance Criteria:**
- PostgreSQL database is provisioned (local dev + hosted)
- Migration tool is configured and can run up/down migrations
- Initial migration creates tables: users, calculators, sessions
- Migrations run automatically in CI against a test database

| ID | Task | P |
|----|------|---|
| INFR-US2-A001 | Choose and configure migration tool | 0 |
| INFR-US2-A002 | Write initial migration: users table (id, email, password_hash, oauth_provider, oauth_id, created_at) | 0 |
| INFR-US2-A003 | Write initial migration: calculators table (id, user_id, config jsonb, config_version, is_deleted, created_at, updated_at) | 0 |
| INFR-US2-A004 | Write initial migration: sessions table | 0 |
| INFR-US2-A005 | Configure CI to run migrations against a test database | 0 |

### INFR-US3: API Server Skeleton (P0)

**As a** developer, **I need** a running API server with routing, middleware, error handling, and health checks so that endpoints can be added incrementally.

**Depends on:** INFR-US2
**Requirements:** 1.9.1, 1.9.7, 1.9.9
**Acceptance Criteria:**
- API server starts and listens on a configurable port
- Router supports versioned routes (`/v1/*`)
- Middleware stack: request logging, CORS, JSON body parsing, error handler
- `GET /healthz` returns 200 with database connectivity status
- All responses follow a consistent JSON envelope (data, error, meta)
- Structured logging (JSON) with fields from SYSTEM_DESIGN.md

| ID | Task | P |
|----|------|---|
| INFR-US3-A001 | Set up API server with router and middleware stack | 0 |
| INFR-US3-A002 | Implement structured JSON logging with trace_id propagation | 0 |
| INFR-US3-A003 | Implement consistent error response format | 0 |
| INFR-US3-A004 | Implement `GET /healthz` with DB connectivity check | 0 |
| INFR-US3-A005 | Configure CORS: wildcard for public endpoints, restricted for dashboard endpoints | 0 |

### INFR-US4: Authentication (P0)

**As a** builder, **I need** to create an account and log in so that I can create and manage calculators tied to my identity.

**Depends on:** INFR-US3
**Requirements:** 1.1.1, 1.1.2, 1.1.3, 1.1.4, 1.1.5, 1.1.6, 1.1.7
**Acceptance Criteria:**
- `POST /v1/auth/register` creates a user with email + hashed password, returns session token
- `POST /v1/auth/login` validates credentials, returns session token
- `POST /v1/auth/logout` invalidates the session
- `POST /v1/auth/forgot-password` sends a reset email with a single-use, time-limited token
- `POST /v1/auth/reset-password` accepts the token and sets new password
- `POST /v1/auth/google` handles Google OAuth flow with PKCE
- Auth middleware extracts session token from Authorization header, rejects invalid/expired tokens with 401
- Auth endpoints are rate-limited (10 attempts/min/IP)

| ID | Task | P |
|----|------|---|
| INFR-US4-A001 | Implement email+password registration with password hashing | 0 |
| INFR-US4-A002 | Implement login endpoint with session token issuance | 0 |
| INFR-US4-A003 | Implement logout with server-side token invalidation | 0 |
| INFR-US4-A004 | Implement auth middleware that validates session tokens on protected routes | 0 |
| INFR-US4-A005 | Implement password reset flow (forgot + reset endpoints) | 1 |
| INFR-US4-A006 | Implement Google OAuth with PKCE | 1 |
| INFR-US4-A007 | Add rate limiting on auth endpoints | 1 |

### INFR-US5: Calculator CRUD API (P0)

**As a** builder, **I need** API endpoints to create, read, update, delete, and duplicate calculators so that the dashboard can persist my work.

**Depends on:** INFR-US4
**Requirements:** 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5, 1.2.6, 1.2.7, 1.2.8, 1.2.9, 1.9.3, 1.9.4, 1.9.5, 1.9.6
**Acceptance Criteria:**
- `POST /v1/calculators` creates a calculator, returns its UUID
- `GET /v1/calculators` lists all calculators owned by the authenticated user
- `GET /v1/calculators/:id` returns a single calculator (ownership-gated)
- `PUT /v1/calculators/:id` updates the calculator's config JSON (validated against schema)
- `DELETE /v1/calculators/:id` soft-deletes the calculator
- `POST /v1/calculators/:id/duplicate` creates a copy with a new UUID
- `GET /v1/calculators/:id/config` (public, no auth) returns the config for widget rendering
- Config endpoint returns cache headers (5-minute TTL)
- All mutations are ownership-gated at the query level

| ID | Task | P |
|----|------|---|
| INFR-US5-A001 | Implement create calculator endpoint | 0 |
| INFR-US5-A002 | Implement list calculators endpoint (scoped to authenticated user) | 0 |
| INFR-US5-A003 | Implement get single calculator endpoint (ownership-gated) | 0 |
| INFR-US5-A004 | Implement update calculator endpoint with config schema validation | 0 |
| INFR-US5-A005 | Implement soft-delete calculator endpoint | 0 |
| INFR-US5-A006 | Implement duplicate calculator endpoint | 1 |
| INFR-US5-A007 | Implement public config endpoint with cache headers | 0 |
| INFR-US5-A008 | Add rate limiting on public config endpoint | 1 |

### INFR-US6: Object Storage & CDN (P0)

**As a** developer, **I need** object storage for user-uploaded assets (logos, images) and a CDN to serve the widget bundle and static assets so that the system performs well at scale.

**Depends on:** INFR-US1
**Requirements:** 1.8.5, 1.3.7 (image upload for Image Select fields)
**Acceptance Criteria:**
- Object storage bucket is provisioned with content-addressed filenames
- Upload endpoint accepts images, validates type/size, stores in object storage, returns CDN URL
- CDN is configured with caching rules per SYSTEM_DESIGN.md (long cache for assets, short for config)
- Widget bundle is served from CDN with content-hashed filename

| ID | Task | P |
|----|------|---|
| INFR-US6-A001 | Provision object storage for user assets | 0 |
| INFR-US6-A002 | Implement image upload endpoint with type/size validation | 1 |
| INFR-US6-A003 | Configure CDN with caching rules for widget bundle, static assets, and user assets | 0 |
| INFR-US6-A004 | Set up widget bundle build pipeline that outputs content-hashed filename to CDN | 0 |

---

## BLDR — Visual Calculator Builder

The React dashboard where builders create and configure calculators. This is the primary product surface.

### BLDR-US1: Dashboard Shell & Navigation (P0)

**As a** builder, **I need** a dashboard with login, navigation, and a calculator list view so that I have a place to manage my calculators.

**Depends on:** INFR-US4, INFR-US5
**Requirements:** 1.1.3 (login), 1.2.2 (list calculators), 1.2.4 (delete calculator)
**Acceptance Criteria:**
- Dashboard is a React SPA served from CDN
- Login/register screens call the auth API
- After login, user sees a list of their calculators (name, last modified, status)
- User can click "New Calculator" or click an existing one to open the editor
- User can delete a calculator from the list (with confirmation)

| ID | Task | P |
|----|------|---|
| BLDR-US1-A001 | Set up React app with routing and auth state management | 0 |
| BLDR-US1-A002 | Build login and registration screens | 0 |
| BLDR-US1-A003 | Build calculator list view with create, open, and delete actions | 0 |
| BLDR-US1-A004 | Implement API client module for authenticated requests | 0 |

### BLDR-US2: Field Type Palette & Configuration (P0)

**As a** builder, **I need** to add input fields to my calculator from a palette and configure each field's properties so that I can define what information to collect.

**Depends on:** BLDR-US1
**Requirements:** 1.3.1, 1.3.2, 1.3.3, 1.3.4, 1.3.5, 1.3.6, 1.3.7, 1.3.8, 1.3.9, 1.3.10, 1.3.11
**Acceptance Criteria:**
- Field palette offers: Dropdown, Radio, Checkbox, Number, Slider, Text, Image Select
- Clicking a field type adds it to the calculator
- Selecting a field opens a configuration panel: label, help text, required toggle, variable name
- Type-specific config: dropdown/radio/checkbox show option list editor (label + value pairs); number shows min/max/step/default; slider shows min/max/step/default; image select allows uploading option images
- Every field has a unique variable name (auto-generated from label, editable)
- Fields can be reordered via drag-and-drop
- Fields can be deleted
- All changes reflect immediately in the live preview pane

| ID | Task | P |
|----|------|---|
| BLDR-US2-A001 | Build field type palette component | 0 |
| BLDR-US2-A002 | Implement shared field configuration panel (label, help text, required, variable name) | 0 |
| BLDR-US2-A003 | Implement Dropdown field type with option list editor | 0 |
| BLDR-US2-A004 | Implement Radio Button field type with option list editor | 0 |
| BLDR-US2-A005 | Implement Checkbox field type with option list editor | 0 |
| BLDR-US2-A006 | Implement Number Input field type with min/max/step/default config | 0 |
| BLDR-US2-A007 | Implement Slider/Range field type with min/max/step/default config | 0 |
| BLDR-US2-A008 | Implement Text Input field type | 1 |
| BLDR-US2-A009 | Implement Image Select field type with image upload | 2 |
| BLDR-US2-A010 | Implement drag-and-drop field reordering | 1 |
| BLDR-US2-A011 | Implement field deletion | 0 |

### BLDR-US3: Layout & Conditional Flow (P1)

**As a** builder, **I need** to choose between single-page and multi-step layouts and define conditional visibility rules so that my calculator guides users through the right questions.

**Depends on:** BLDR-US2
**Requirements:** 1.4.1, 1.4.2, 1.4.3, 1.4.4, 1.4.5, 1.4.6, 1.4.7
**Acceptance Criteria:**
- Builder can toggle between single-page and multi-step layout without losing fields
- In multi-step mode, builder assigns fields to steps and reorders steps
- Multi-step mode shows a progress bar in preview
- Builder can add conditional visibility rules: "Show field X when field Y equals/is greater than/is less than Z"
- Rules support AND/OR combinators
- Conditional rules are configurable via UI controls (no code)
- Preview reflects conditional logic in real time

| ID | Task | P |
|----|------|---|
| BLDR-US3-A001 | Implement layout mode toggle (single-page vs multi-step) | 1 |
| BLDR-US3-A002 | Build step manager: assign fields to steps, reorder steps | 1 |
| BLDR-US3-A003 | Implement progress bar component for multi-step mode | 1 |
| BLDR-US3-A004 | Build conditional visibility rule editor UI | 2 |
| BLDR-US3-A005 | Implement AND/OR rule combinators | 2 |
| BLDR-US3-A006 | Wire conditional logic into the live preview | 2 |

### BLDR-US4: Live Preview Pane (P0)

**As a** builder, **I need** a live preview that shows exactly what my calculator will look like when embedded so that I can iterate without deploying.

**Depends on:** BLDR-US2, CALC-US1
**Requirements:** 1.3.11 (live preview of field changes), 1.5.9 (live formula preview)
**Acceptance Criteria:**
- Preview pane renders on the right side of the editor
- Preview uses the same shared field renderers and formula engine as the widget
- Preview updates in real time as fields, formulas, styling, and layout change
- Preview shows results when the user fills in the preview form and submits
- Preview is visually isolated (doesn't inherit dashboard styles)

| ID | Task | P |
|----|------|---|
| BLDR-US4-A001 | Build preview pane container with style isolation | 0 |
| BLDR-US4-A002 | Wire shared field renderers into the preview | 0 |
| BLDR-US4-A003 | Wire shared formula engine into the preview | 0 |
| BLDR-US4-A004 | Implement real-time reactivity: config changes propagate to preview immediately | 0 |

### BLDR-US5: Save & Auto-Save (P0)

**As a** builder, **I need** my calculator to save automatically so that I never lose work.

**Depends on:** BLDR-US2, INFR-US5
**Requirements:** 1.2.3 (update calculator config) — auto-save is the UX implementation of config persistence
**Acceptance Criteria:**
- Calculator config is auto-saved to the API after a debounced delay (e.g., 2 seconds after last change)
- Save status indicator shows: "Saved", "Saving...", or "Error saving"
- On error, auto-save retries. If retries exhaust, the user is notified.
- Manual "Save" button is available as a fallback

| ID | Task | P |
|----|------|---|
| BLDR-US5-A001 | Implement debounced auto-save that PUTs config to the API | 0 |
| BLDR-US5-A002 | Build save status indicator component | 0 |
| BLDR-US5-A003 | Implement retry logic with user notification on persistent failure | 1 |

---

## CALC — Formula Engine & Results

The shared formula engine and the results display configuration. The engine is the core intellectual property — it runs in both the builder preview and the embedded widget.

### CALC-US1: Formula Engine Core (P0)

**As a** builder, **I need** to write formulas that reference my fields and produce calculated outputs so that my calculator computes accurate quotes.

**Depends on:** INFR-US1 (shared library)
**Requirements:** 1.5.1, 1.5.2, 1.5.3, 1.5.4, 1.5.5, 1.5.10, 1.5.11, 1.5.12, 1.5.13
**Acceptance Criteria:**
- Formula engine parses expressions into a sandboxed AST
- Supports: arithmetic (`+`, `-`, `*`, `/`, `%`), parentheses, comparisons (`=`, `!=`, `>`, `<`, `>=`, `<=`), conditionals (`IF(cond, then, else)`), variable references (`{field_name}`), math functions (`MIN`, `MAX`, `ABS`, `ROUND`)
- Evaluator is a pure function: `(ast, variables) → number`
- No access to eval(), Function(), DOM, network, or browser globals
- Execution aborts if it exceeds 100ms
- Invalid formulas return clear error messages with suggestions (e.g., "Unknown variable: {numbathrooms}. Did you mean {num_bathrooms}?")
- Same engine code used in dashboard preview and widget

| ID | Task | P |
|----|------|---|
| CALC-US1-A001 | Implement tokenizer/lexer for formula expressions | 0 |
| CALC-US1-A002 | Implement parser that produces a restricted AST | 0 |
| CALC-US1-A003 | Implement AST evaluator with arithmetic, comparisons, and parentheses | 0 |
| CALC-US1-A004 | Add IF/THEN/ELSE conditional expression support | 0 |
| CALC-US1-A005 | Add variable reference resolution against field value map | 0 |
| CALC-US1-A006 | Add MIN, MAX, ABS, ROUND function support | 1 |
| CALC-US1-A007 | Implement execution timeout (100ms abort) | 1 |
| CALC-US1-A008 | Implement error messages with "did you mean?" suggestions for unknown variables | 1 |
| CALC-US1-A009 | Write comprehensive unit tests for edge cases (division by zero, nested IFs, deep nesting) | 0 |

### CALC-US2: Formula Editor UI (P0)

**As a** builder, **I need** an editor to define output formulas and see their results update live so that I can verify my pricing logic works correctly.

**Depends on:** CALC-US1, BLDR-US2
**Requirements:** 1.5.6, 1.5.7, 1.5.8, 1.5.9
**Acceptance Criteria:**
- Builder can define one or more output values, each with a name/label and a formula expression
- Formula text input shows syntax highlighting or inline validation
- Live preview shows the computed result using sample/default field values
- Errors are displayed inline next to the formula
- Builder can configure rounding (integer, N decimal places, floor, ceil) per output
- Builder can configure tiered/bracket pricing through a structured UI (not formula-only)

| ID | Task | P |
|----|------|---|
| CALC-US2-A001 | Build formula output list UI (add/remove/reorder output values) | 0 |
| CALC-US2-A002 | Build formula text input with inline validation and error display | 0 |
| CALC-US2-A003 | Implement live result preview using current field defaults | 0 |
| CALC-US2-A004 | Add rounding configuration per output value | 1 |
| CALC-US2-A005 | Build tiered pricing UI (define quantity brackets and per-bracket rates) | 2 |

### CALC-US3: Results Display Configuration (P1)

**As a** builder, **I need** to configure how the calculated results are presented to end users so that the output is clear and drives action.

**Depends on:** CALC-US2
**Requirements:** 1.6.1, 1.6.2, 1.6.3, 1.6.4, 1.6.5, 1.6.6, 1.6.7, 1.6.8, 1.6.9
**Acceptance Criteria:**
- Builder can configure results page to show: single value, price range (low/high), or itemized breakdown
- Builder can set currency symbol, position, thousands separator, and decimal separator
- Builder can write a custom result message (restricted rich text: bold, italic, links)
- Builder can define conditional messages (different text for different value ranges)
- Builder can add a CTA button with configurable label and URL
- End user can restart the calculator from the results page

| ID | Task | P |
|----|------|---|
| CALC-US3-A001 | Build results display mode selector (single value, range, itemized) | 1 |
| CALC-US3-A002 | Implement currency and number formatting configuration | 1 |
| CALC-US3-A003 | Build custom result message editor (restricted rich text) | 2 |
| CALC-US3-A004 | Build conditional message rules (value range → message) | 2 |
| CALC-US3-A005 | Implement CTA button configuration (label + URL) | 1 |
| CALC-US3-A006 | Implement restart button on results page | 1 |

---

## STYL — Styling & Branding

Visual customization so the calculator matches the builder's website.

### STYL-US1: Theme & Appearance Controls (P1)

**As a** builder, **I need** to customize colors, fonts, and layout properties so that the calculator looks like it belongs on my website.

**Depends on:** BLDR-US4
**Requirements:** 1.7.1, 1.7.2, 1.7.3, 1.7.4, 1.7.5, 1.7.6, 1.7.7, 1.7.8
**Acceptance Criteria:**
- Color picker controls for: primary, secondary, background, text colors
- Font selector from a curated list of web-safe + Google Fonts
- Border radius slider (sharp to fully rounded)
- Padding and shadow intensity controls
- Light/dark mode base theme toggle
- Logo upload that displays in the calculator header
- Custom CSS textarea for advanced overrides
- All changes reflect immediately in the live preview

| ID | Task | P |
|----|------|---|
| STYL-US1-A001 | Build color picker controls for primary, secondary, background, and text colors | 1 |
| STYL-US1-A002 | Build font selector with Google Fonts integration | 2 |
| STYL-US1-A003 | Build border radius, padding, and shadow controls | 2 |
| STYL-US1-A004 | Implement light/dark mode toggle | 2 |
| STYL-US1-A005 | Implement logo upload with preview | 2 |
| STYL-US1-A006 | Implement custom CSS textarea with sanitization on save | 3 |
| STYL-US1-A007 | Wire all styling controls into the live preview | 1 |

### STYL-US2: Powered-by Badge (P0)

**As** QuoteCraft, **we need** a "Powered by QuoteCraft" badge on all free-tier calculators so that embedded widgets drive organic discovery.

**Depends on:** STYL-US1
**Requirements:** 1.7.9
**Acceptance Criteria:**
- Badge renders at the bottom of every calculator
- Badge links to the QuoteCraft homepage
- Badge is rendered from the config's feature flags (server-controlled)
- Badge cannot be hidden via custom CSS (enforced in CSS sanitizer)
- Badge removal is gated by the Pro tier feature flag

| ID | Task | P |
|----|------|---|
| STYL-US2-A001 | Implement badge component in the shared field renderers | 0 |
| STYL-US2-A002 | Wire badge visibility to the feature flag in config response | 0 |
| STYL-US2-A003 | Add CSS sanitization rule to prevent badge hiding | 1 |

---

## WDGT — Embeddable Widget

The vanilla JS bundle that renders calculators on third-party sites. This is the most critical deployable.

### WDGT-US1: Widget Bundle & Loader (P0)

**As a** builder, **I need** a single `<script>` tag that renders my calculator on any website so that I can embed it without technical help.

**Depends on:** CALC-US1, BLDR-US2 (shared renderers), STYL-US2, INFR-US5 (config endpoint), INFR-US6 (CDN)
**Requirements:** 1.8.1, 1.8.2, 1.8.3, 1.8.4, 1.8.5, 1.8.6, 1.8.7, 1.8.8, 1.8.9, 1.8.10, 1.8.12, 1.8.13, 1.8.14
**Acceptance Criteria:**
- Widget is embedded via `<script src="cdn/widget-loader.js" data-calculator-id="UUID" async>`
- Loader is < 2KB, fetches the full widget bundle from CDN
- Widget bundle is < 50KB gzipped, vanilla JS, zero external dependencies
- Widget fetches calculator config from the public API endpoint
- Widget renders inside a Shadow DOM (no CSS conflicts with host page)
- Widget is fully responsive (320px to 2560px)
- Widget is keyboard-navigable and meets WCAG 2.1 AA
- Widget works in Chrome, Firefox, Safari, Edge (last 2 major versions)
- If config fetch fails, widget retries 3x with backoff, then shows a fallback message
- All calculations run client-side via the shared formula engine
- Dashboard provides a copy-to-clipboard embed snippet

| ID | Task | P |
|----|------|---|
| WDGT-US1-A001 | Build widget loader script (< 2KB, async bundle fetch) | 0 |
| WDGT-US1-A002 | Build widget bundle build pipeline (vanilla JS, tree-shaken, < 50KB gz) | 0 |
| WDGT-US1-A003 | Implement Shadow DOM container and style injection | 0 |
| WDGT-US1-A004 | Implement config fetch with retry and backoff | 0 |
| WDGT-US1-A005 | Wire shared field renderers into the widget | 0 |
| WDGT-US1-A006 | Wire shared formula engine into the widget | 0 |
| WDGT-US1-A007 | Implement responsive layout (320px–2560px) | 1 |
| WDGT-US1-A008 | Implement keyboard navigation and ARIA labels | 1 |
| WDGT-US1-A009 | Implement graceful fallback message on config fetch failure | 1 |
| WDGT-US1-A010 | Build embed code snippet UI in dashboard with copy-to-clipboard | 0 |
| WDGT-US1-A011 | Cross-browser testing (Chrome, Firefox, Safari, Edge) | 1 |

### WDGT-US2: iFrame Embed Fallback (P2)

**As a** builder using a platform that blocks external scripts, **I need** an iFrame embed option so that I can still use QuoteCraft.

**Depends on:** WDGT-US1
**Requirements:** 1.8.11
**Acceptance Criteria:**
- Dashboard offers an iFrame embed code as an alternative to the script tag
- iFrame points to a QuoteCraft-hosted page that renders the calculator
- iFrame auto-resizes to fit the calculator content (via postMessage)

| ID | Task | P |
|----|------|---|
| WDGT-US2-A001 | Build hosted calculator page for iFrame embedding | 2 |
| WDGT-US2-A002 | Implement postMessage-based auto-resize | 2 |
| WDGT-US2-A003 | Add iFrame embed code option to dashboard embed snippet UI | 2 |

### WDGT-US3: Widget Error Reporting (P1)

**As** QuoteCraft, **we need** visibility into widget failures on third-party sites so that we can detect and fix issues before builders report them.

**Depends on:** WDGT-US1
**Requirements:** None (derived from SYSTEM_DESIGN.md — Observability/Error Tracking section)
**Acceptance Criteria:**
- Widget wraps rendering in an error boundary
- On error, the widget sends a fire-and-forget POST to a reporting endpoint with: calculator ID, error message, stack trace (obfuscated), browser/OS, host page URL
- Error reporting never blocks the widget's rendering path
- API endpoint receives and logs error reports

| ID | Task | P |
|----|------|---|
| WDGT-US3-A001 | Implement widget error boundary with fallback UI | 1 |
| WDGT-US3-A002 | Implement fire-and-forget error reporting POST | 1 |
| WDGT-US3-A003 | Build API endpoint to receive and log widget error reports | 1 |

---

## TMPL — Templates

Pre-built calculators that reduce time-to-value for new users.

### TMPL-US1: Template System & Starter Set (P1)

**As a** new builder, **I need** pre-built calculator templates so that I can start with a working example instead of a blank canvas.

**Depends on:** BLDR-US2, BLDR-US3, CALC-US2, CALC-US3, STYL-US1
**Requirements:** 1.10.1, 1.10.2, 1.10.3, 1.10.4, 1.10.5, 1.10.6
**Acceptance Criteria:**
- Templates are stored as calculator config JSON in the database, flagged as system templates
- Dashboard shows a "Start from template" option during calculator creation
- User can preview a template before selecting it
- Selecting a template copies the config into the user's account (does not modify the template)
- User can modify every aspect after copying
- At least 10 templates ship: plumbing, web design, moving, cleaning, landscaping, home renovation, freelance rate, event/venue, printing/signage, SaaS pricing

| ID | Task | P |
|----|------|---|
| TMPL-US1-A001 | Implement template storage (system-owned calculator configs with a template flag) | 1 |
| TMPL-US1-A002 | Build template browser UI with previews | 1 |
| TMPL-US1-A003 | Implement "copy template to my account" action | 1 |
| TMPL-US1-A004 | Author template: Plumbing Estimate | 2 |
| TMPL-US1-A005 | Author template: Web Design Quote | 2 |
| TMPL-US1-A006 | Author template: Moving Cost Estimator | 2 |
| TMPL-US1-A007 | Author template: Cleaning Service Quote | 2 |
| TMPL-US1-A008 | Author template: Landscaping Estimate | 3 |
| TMPL-US1-A009 | Author template: Home Renovation Calculator | 3 |
| TMPL-US1-A010 | Author template: Freelance Hourly Rate | 3 |
| TMPL-US1-A011 | Author template: Event/Venue Rental Estimate | 3 |
| TMPL-US1-A012 | Author template: Printing & Signage Quote | 3 |
| TMPL-US1-A013 | Author template: SaaS Pricing Calculator | 3 |

---

# Phase 2: Growth

SEO, lead capture, and virality. Drives organic traffic and gives builders a reason to come back daily.

---

## LEAD — Lead Capture & Submissions

### LEAD-US1: Submission Pipeline (P0)

**As a** builder, **I need** the widget to log every completed calculation so that I can see who's getting quotes on my site.

**Depends on:** WDGT-US1, INFR-US5
**Requirements:** 2.3.1, 2.3.2, 2.3.11, 1.9.5, 1.9.6
**Acceptance Criteria:**
- Widget sends a POST to `/v1/submissions` on completion with: calculator ID, all input values, all output values, referrer URL
- API writes submission to the submissions table
- Submission endpoint is rate-limited per IP per calculator
- If POST fails, widget stores payload in localStorage and retries on next interaction
- Submissions table is indexed on calculator_id and created_at

| ID | Task | P |
|----|------|---|
| LEAD-US1-A001 | Write migration: submissions table (id, calculator_id, input_values, output_values, lead_info, referrer_url, ip_address, created_at) | 0 |
| LEAD-US1-A002 | Implement submission POST endpoint with rate limiting | 0 |
| LEAD-US1-A003 | Implement widget submission flow (collect, POST, retry on failure) | 0 |
| LEAD-US1-A004 | Add localStorage retry queue in widget | 1 |

### LEAD-US2: Submission Dashboard (P1)

**As a** builder, **I need** to view my submissions in a list with detail views so that I can follow up with leads.

**Depends on:** LEAD-US1
**Requirements:** 2.3.3, 2.3.4, 2.3.5
**Acceptance Criteria:**
- Dashboard shows a submission log per calculator (list view: date, total, lead info)
- Clicking a submission shows full detail (all inputs and outputs)
- Free tier shows last 30 days only
- Submissions are paginated

| ID | Task | P |
|----|------|---|
| LEAD-US2-A001 | Implement submissions list API endpoint (paginated, ownership-gated, 30-day filter) | 1 |
| LEAD-US2-A002 | Build submission list view in dashboard | 1 |
| LEAD-US2-A003 | Build submission detail view | 1 |

### LEAD-US3: Lead Capture Form (P1)

**As a** builder, **I need** to optionally collect name, email, and phone from end users so that I can follow up with interested prospects.

**Depends on:** LEAD-US1, WDGT-US1
**Requirements:** 2.3.6, 2.3.7
**Acceptance Criteria:**
- Builder can enable/disable lead capture fields: name, email, phone (each independently)
- Builder can set each field as required or optional
- Builder can position the form: before results (gated) or alongside results (non-gated)
- Lead data is included in the submission POST
- Lead data is stored in the submissions table's lead_info JSONB column

| ID | Task | P |
|----|------|---|
| LEAD-US3-A001 | Add lead capture configuration UI in the builder | 1 |
| LEAD-US3-A002 | Implement lead capture form rendering in the widget (gated and non-gated modes) | 1 |
| LEAD-US3-A003 | Include lead_info in submission payload and storage | 1 |

### LEAD-US4: Email Notifications (P1)

**As a** builder, **I need** to receive an email when a lead submits so that I can respond quickly.

**Depends on:** LEAD-US1
**Requirements:** 2.3.8, 2.3.9, 2.3.10
**Acceptance Criteria:**
- Builder can toggle email notifications on/off per calculator
- When a submission with lead info comes in, an email is sent to the builder
- Email includes: lead name/email/phone, calculated values, link to submission in dashboard
- Email sending is asynchronous (job queue) — never blocks the submission response
- Failed email sends are retried with backoff

| ID | Task | P |
|----|------|---|
| LEAD-US4-A001 | Set up job queue for async processing | 1 |
| LEAD-US4-A002 | Integrate transactional email service | 1 |
| LEAD-US4-A003 | Build lead notification email template | 1 |
| LEAD-US4-A004 | Implement notification toggle in builder settings | 2 |
| LEAD-US4-A005 | Wire submission pipeline to enqueue notification jobs | 1 |

---

## SEOP — SEO Pages & Template Gallery

### SEOP-US1: Template Gallery Pages (P1)

**As a** potential user discovering QuoteCraft via search, **I need** to see a live demo calculator on an SEO-optimized landing page so that I understand the value and sign up.

**Depends on:** TMPL-US1
**Requirements:** 2.1.1, 2.1.2, 2.1.3, 2.1.4, 2.1.5, 2.1.6, 2.1.7, 2.1.8, 2.1.9
**Acceptance Criteria:**
- Each template has a public landing page at `/templates/{slug}` (e.g., `/templates/plumbing-cost-calculator`)
- Pages are statically generated from template metadata
- Each page has: H1 with target keyword, description, live demo calculator, CTA to sign up
- Pages include `<title>`, `<meta description>`, canonical URL, Schema.org structured data, OG/Twitter meta
- Gallery index page lists all templates with thumbnails, categories, and search/filter
- All pages are in the XML sitemap
- System scales to 50+ templates without manual page creation

| ID | Task | P |
|----|------|---|
| SEOP-US1-A001 | Build SSR/static template landing page component | 1 |
| SEOP-US1-A002 | Implement meta tag generation (title, description, canonical, OG, Twitter Card) | 1 |
| SEOP-US1-A003 | Add Schema.org structured data (FAQPage, HowTo) | 2 |
| SEOP-US1-A004 | Embed live demo calculator on each template page | 1 |
| SEOP-US1-A005 | Build gallery index page with categories and search/filter | 2 |
| SEOP-US1-A006 | Implement XML sitemap generation | 1 |

### SEOP-US2: Blog Infrastructure (P2)

**As** QuoteCraft, **we need** a blog targeting "[industry] cost calculator" keywords so that we capture search traffic and funnel it to sign-ups.

**Depends on:** SEOP-US1
**Requirements:** 2.2.1, 2.2.2, 2.2.3, 2.2.4, 2.2.5, 2.2.6
**Acceptance Criteria:**
- Blog section at `/blog` with SSR/static pages
- Posts support categories, tags, and proper meta tags
- Posts can embed live calculator demos inline
- Posts are in the XML sitemap
- Blog has an RSS feed
- Each post has a CTA linking to the relevant template or sign-up

| ID | Task | P |
|----|------|---|
| SEOP-US2-A001 | Build blog post rendering with markdown/MDX support | 2 |
| SEOP-US2-A002 | Implement category and tag taxonomy | 3 |
| SEOP-US2-A003 | Enable inline calculator demo embedding in posts | 3 |
| SEOP-US2-A004 | Add blog posts to XML sitemap | 2 |
| SEOP-US2-A005 | Implement RSS feed | 3 |

---

## WSEO — Widget SEO Enhancements

### WSEO-US1: Widget Search Engine Compatibility (P2)

**As a** builder, **I need** my embedded calculator to be visible to search engines so that it contributes to my website's SEO rather than being invisible.

**Depends on:** WDGT-US1
**Requirements:** 2.4.1, 2.4.2, 2.4.3, 2.4.4
**Acceptance Criteria:**
- Widget renders real HTML (already satisfied by Shadow DOM approach — verify)
- Widget uses semantic HTML: headings, labels, fieldsets with ARIA attributes
- Script tag includes a `<noscript>` fallback that renders a static text description of the calculator
- Standalone calculator pages include OG meta tags for social sharing

| ID | Task | P |
|----|------|---|
| WSEO-US1-A001 | Audit widget output for semantic HTML and ARIA compliance | 2 |
| WSEO-US1-A002 | Implement `<noscript>` fallback content generation | 2 |
| WSEO-US1-A003 | Add OG meta tags to standalone calculator pages | 3 |

---

# Phase 3: Monetization

Paid tiers that convert free users to paying customers.

---

## BILL — Billing & Subscriptions

### BILL-US1: Stripe Integration & Plan Management (P0)

**As a** builder, **I need** to upgrade to a paid plan and manage my subscription so that I can access premium features.

**Depends on:** INFR-US4
**Requirements:** 3.1.1, 3.1.2, 3.1.3, 3.1.4, 3.1.5, 3.1.6, 3.1.7, 3.1.8
**Acceptance Criteria:**
- Three plans configured in Stripe: Pro ($19/mo), Business ($49/mo), Agency ($99/mo)
- Annual billing option with 2-months-free discount
- Builder clicks "Upgrade" in dashboard → redirected to Stripe hosted checkout → returns to dashboard
- Webhook handles: checkout.session.completed, invoice.payment_failed, customer.subscription.deleted, customer.subscription.updated
- Subscription status stored in local DB (subscription table)
- Failed payment triggers 7-day grace period before downgrade
- Builder can upgrade, downgrade, or cancel from billing page
- Billing page shows: current plan, next billing date, payment method, invoice history
- Feature access is enforced server-side via feature flags on the plan table

| ID | Task | P |
|----|------|---|
| BILL-US1-A001 | Write migration: subscriptions table, plans table with feature_flags jsonb | 0 |
| BILL-US1-A002 | Configure Stripe products and prices (3 plans, monthly + annual) | 0 |
| BILL-US1-A003 | Implement checkout session creation endpoint | 0 |
| BILL-US1-A004 | Implement Stripe webhook handler with signature verification and event deduplication | 0 |
| BILL-US1-A005 | Implement subscription status sync (checkout complete, payment failed, subscription deleted) | 0 |
| BILL-US1-A006 | Implement server-side feature gating middleware | 0 |
| BILL-US1-A007 | Implement grace period logic for failed payments | 1 |
| BILL-US1-A008 | Build billing page in dashboard (current plan, upgrade/downgrade/cancel, invoices) | 1 |
| BILL-US1-A009 | Implement graceful downgrade: re-enable badge, disable paid features, hide old submissions (no data deletion) | 1 |

---

## PROT — Pro Tier Features

### PROT-US1: Branding Removal (P1)

**As a** Pro builder, **I need** to remove the "Powered by QuoteCraft" badge so that my calculator looks fully custom.

**Depends on:** BILL-US1, STYL-US2
**Requirements:** 3.2.1
**Acceptance Criteria:**
- Config endpoint includes `branding_removable: true` for Pro+ users
- Widget reads the flag and hides the badge
- Downgrading re-enables the badge on next config fetch

| ID | Task | P |
|----|------|---|
| PROT-US1-A001 | Add branding feature flag to config response based on subscription tier | 1 |
| PROT-US1-A002 | Update widget to conditionally render badge based on flag | 1 |

### PROT-US2: PDF Quote Generation (P2)

**As a** Pro builder, **I need** to automatically send branded PDF quotes to end users so that they get a professional document without me doing manual work.

**Depends on:** BILL-US1, LEAD-US1, LEAD-US4
**Requirements:** 3.2.2, 3.2.3
**Acceptance Criteria:**
- Builder configures PDF branding: logo, company name, contact info
- On submission, a PDF is generated server-side with: builder's branding, itemized breakdown, calculated totals, date
- PDF is emailed to the end user's captured email address
- PDF generation is async (job queue) — never blocks the submission response
- Builder can preview a sample PDF from the dashboard

| ID | Task | P |
|----|------|---|
| PROT-US2-A001 | Build PDF branding configuration UI in dashboard | 2 |
| PROT-US2-A002 | Implement server-side PDF renderer (stateless, receives data, outputs PDF binary) | 2 |
| PROT-US2-A003 | Wire submission pipeline to enqueue PDF generation jobs for Pro+ users | 2 |
| PROT-US2-A004 | Build PDF preview in dashboard | 3 |

### PROT-US3: Custom Redirects & Tracking (P2)

**As a** Pro builder, **I need** to redirect users to a custom URL after submission and fire analytics events so that I can integrate the calculator into my sales funnel.

**Depends on:** BILL-US1, WDGT-US1
**Requirements:** 3.2.4, 3.2.5
**Acceptance Criteria:**
- Builder can set a custom thank-you redirect URL per calculator
- After submission, the widget redirects the end user to that URL (or shows default results if no URL set)
- Builder can enter Google Analytics measurement ID and/or Meta Pixel ID
- Widget fires a configurable conversion event on submission
- Tracking IDs and redirect URL are gated by Pro tier

| ID | Task | P |
|----|------|---|
| PROT-US3-A001 | Add redirect URL and tracking ID fields to builder settings (feature-gated) | 2 |
| PROT-US3-A002 | Implement post-submission redirect in widget | 2 |
| PROT-US3-A003 | Implement GA and Meta Pixel event firing in widget | 2 |

### PROT-US4: Unlimited Submission History (P2)

**As a** Pro builder, **I need** unlimited submission history so that I don't lose old leads.

**Depends on:** BILL-US1, LEAD-US2
**Requirements:** 3.2.6
**Acceptance Criteria:**
- The 30-day filter on the submissions API respects the user's plan
- Pro+ users see all submissions with no time limit
- The data retention cleanup job skips submissions owned by Pro+ users

| ID | Task | P |
|----|------|---|
| PROT-US4-A001 | Update submissions query to conditionally apply 30-day filter based on plan | 2 |
| PROT-US4-A002 | Update data retention cleanup job to skip Pro+ users | 2 |

---

## BSNS — Business Tier Features

### BSNS-US1: CRM & Webhook Integrations (P3)

**As a** Business builder, **I need** submissions to auto-push into my CRM so that leads flow directly into my sales pipeline.

**Depends on:** BILL-US1, LEAD-US1
**Requirements:** 3.3.1, 3.3.2
**Acceptance Criteria:**
- Builder can configure a Zapier/Make webhook URL per calculator
- Each submission triggers a POST to the webhook with all field data
- Builder can connect HubSpot, Salesforce, or Pipedrive via OAuth
- Submissions auto-create contacts/leads in the connected CRM
- Outbound webhook URLs are validated (HTTPS only, no private IPs — per SYSTEM_DESIGN security)

| ID | Task | P |
|----|------|---|
| BSNS-US1-A001 | Implement webhook URL configuration with SSRF validation | 3 |
| BSNS-US1-A002 | Wire submission pipeline to fire outbound webhooks for Business+ users | 3 |
| BSNS-US1-A003 | Implement HubSpot OAuth + contact creation integration | 4 |
| BSNS-US1-A004 | Implement Salesforce OAuth + lead creation integration | 5 |
| BSNS-US1-A005 | Implement Pipedrive OAuth + deal creation integration | 5 |

### BSNS-US2: A/B Testing (P4)

**As a** Business builder, **I need** to run two calculator variants side-by-side so that I can optimize for higher conversion.

**Depends on:** BILL-US1, WDGT-US1, LEAD-US1
**Requirements:** 3.3.3, 3.3.4
**Acceptance Criteria:**
- Builder can create two variants of a calculator (each with its own config)
- Widget splits traffic between variants based on configured weights
- Dashboard shows per-variant metrics: impressions, completions, submission rate, average quote value
- Builder can end the test and promote a winner

| ID | Task | P |
|----|------|---|
| BSNS-US2-A001 | Write migration: ab_test_variants table | 4 |
| BSNS-US2-A002 | Build A/B test creation UI in dashboard | 4 |
| BSNS-US2-A003 | Implement variant selection logic in widget (deterministic by session) | 4 |
| BSNS-US2-A004 | Track impressions and completions per variant | 4 |
| BSNS-US2-A005 | Build A/B test results dashboard with per-variant metrics | 4 |

### BSNS-US3: Team Management (P3)

**As a** Business builder, **I need** to invite team members with role-based access so that my team can collaborate on calculators.

**Depends on:** BILL-US1
**Requirements:** 3.3.5, 3.3.6
**Acceptance Criteria:**
- Builder can invite team members by email (3 seats included in Business, additional $5/seat)
- Roles: Admin (full access), Editor (edit calculators, view submissions), Viewer (read-only)
- Team members see shared calculators and submissions
- Seat limits are enforced server-side

| ID | Task | P |
|----|------|---|
| BSNS-US3-A001 | Write migration: teams table, team_members table with role column | 3 |
| BSNS-US3-A002 | Implement invite-by-email flow with invitation acceptance | 3 |
| BSNS-US3-A003 | Implement role-based access control in API middleware | 3 |
| BSNS-US3-A004 | Build team management UI in dashboard | 3 |
| BSNS-US3-A005 | Implement seat limit enforcement with Stripe quantity updates | 4 |

### BSNS-US4: Submission Analytics Dashboard (P4)

**As a** Business builder, **I need** to see conversion funnel analytics so that I understand where users drop off and how to improve.

**Depends on:** BILL-US1, LEAD-US1
**Requirements:** 3.3.9
**Acceptance Criteria:**
- Dashboard shows a funnel: widget views → calculator starts → completions → submissions
- Shows drop-off percentage by step (for multi-step calculators)
- Shows average quote value over time
- Shows field-level engagement (which fields are interacted with, which are skipped)

| ID | Task | P |
|----|------|---|
| BSNS-US4-A001 | Implement widget-side event tracking (view, start, step_complete, complete, submit) | 4 |
| BSNS-US4-A002 | Build analytics event ingestion endpoint | 4 |
| BSNS-US4-A003 | Build funnel visualization component | 5 |
| BSNS-US4-A004 | Build average quote value chart | 5 |
| BSNS-US4-A005 | Build field engagement breakdown | 5 |

### BSNS-US5: Custom Domain for Standalone Pages (P4)

**As a** Business builder, **I need** to configure a custom domain for my standalone calculator pages so that they appear under my own brand (e.g., `quotes.yourbusiness.com`).

**Depends on:** BILL-US1, EMBD-US2
**Requirements:** 3.3.7
**Acceptance Criteria:**
- Builder can enter a custom domain (e.g., `quotes.yourbusiness.com`) in the dashboard
- Dashboard shows CNAME instructions and verifies DNS configuration
- SSL certificate is provisioned automatically for the custom domain
- Standalone calculator pages are accessible via the custom domain
- Custom domain is gated by Business tier
- Removing or changing the domain cleans up the old certificate and routing

| ID | Task | P |
|----|------|---|
| BSNS-US5-A001 | Build custom domain configuration UI with CNAME instructions | 4 |
| BSNS-US5-A002 | Implement DNS verification endpoint (check CNAME resolution) | 4 |
| BSNS-US5-A003 | Implement automated SSL certificate provisioning for custom domains | 4 |
| BSNS-US5-A004 | Implement request routing to serve calculator pages on custom domains | 4 |
| BSNS-US5-A005 | Gate custom domain feature by Business tier in API middleware | 4 |

### BSNS-US6: Conditional Email Sequences (P4)

**As a** Business builder, **I need** to auto-send different follow-up emails based on the calculated output value so that high-value leads get personalized outreach and low-value leads get self-service options.

**Depends on:** BILL-US1, LEAD-US4
**Requirements:** 3.3.8
**Acceptance Criteria:**
- Builder can define email sequence rules: "If calculated total is [above/below/between] [value], send [email template]"
- Builder can create multiple email templates with subject, body (rich text), and sender name
- Multiple rules can be defined per calculator (evaluated in order, first match wins)
- Emails are sent asynchronously via the job queue — never blocks the submission response
- Conditional email sending is gated by Business tier
- Builder can preview each email template before activating

| ID | Task | P |
|----|------|---|
| BSNS-US6-A001 | Build conditional email rule editor UI (condition + template pairs) | 4 |
| BSNS-US6-A002 | Build email template editor (subject, rich text body, sender name) | 4 |
| BSNS-US6-A003 | Implement rule evaluation engine in the submission pipeline | 4 |
| BSNS-US6-A004 | Wire conditional email dispatch into the async job queue | 4 |
| BSNS-US6-A005 | Implement email template preview in dashboard | 5 |

---

## AGCY — Agency Tier Features

### AGCY-US1: White-Label & Sub-Accounts (P5)

**As an** Agency user, **I need** to remove all QuoteCraft branding and manage client accounts from one dashboard so that I can offer this as my own service.

**Depends on:** BILL-US1, BSNS-US3
**Requirements:** 3.4.1, 3.4.2
**Acceptance Criteria:**
- White-label mode removes all QuoteCraft references from widgets, dashboard, and emails
- Agency can create client sub-accounts, each with its own calculators and submissions
- Parent dashboard shows an account switcher to navigate between clients
- Sub-account data is fully isolated

| ID | Task | P |
|----|------|---|
| AGCY-US1-A001 | Implement white-label flag that strips QuoteCraft branding from widget, dashboard, and email templates | 5 |
| AGCY-US1-A002 | Build client sub-account creation and management | 5 |
| AGCY-US1-A003 | Build account switcher UI | 5 |
| AGCY-US1-A004 | Implement data isolation between sub-accounts | 5 |

### AGCY-US2: Public API & Webhooks (P5)

**As an** Agency user, **I need** API access and per-calculator webhooks so that I can programmatically manage calculators and integrate with my own systems.

**Depends on:** BILL-US1
**Requirements:** 3.4.3, 3.4.4, 3.4.5
**Acceptance Criteria:**
- Agency users can generate API keys from the dashboard (hashed storage, shown once)
- API supports: create/read/update/delete calculators, list/retrieve submissions
- API documentation is publicly available
- Per-calculator webhook URL configuration (real-time POST on submission)
- API keys are scoped (calculator CRUD + submission read only — no billing or account changes)

| ID | Task | P |
|----|------|---|
| AGCY-US2-A001 | Implement API key generation, hashed storage, and authentication middleware | 5 |
| AGCY-US2-A002 | Expose calculator CRUD and submission read endpoints via API key auth | 5 |
| AGCY-US2-A003 | Build API documentation (auto-generated from route definitions) | 6 |
| AGCY-US2-A004 | Implement per-calculator webhook configuration and dispatch | 5 |

### AGCY-US3: Bulk Operations (P6)

**As an** Agency user, **I need** to update calculator settings in bulk so that I can push changes across all client calculators at once.

**Depends on:** AGCY-US1
**Requirements:** 3.4.6
**Acceptance Criteria:**
- Agency user can select multiple calculators and apply a batch update (formula change, styling change, field addition)
- Bulk updates are applied atomically (all succeed or all fail)

| ID | Task | P |
|----|------|---|
| AGCY-US3-A001 | Implement bulk update API endpoint with atomic transaction | 6 |
| AGCY-US3-A002 | Build bulk selection and update UI in dashboard | 6 |

### AGCY-US4: SSO / SAML Support (P6)

**As an** Agency user with enterprise clients, **I need** SSO/SAML authentication so that my team can log in using their corporate identity provider.

**Depends on:** BILL-US1, INFR-US4
**Requirements:** 3.4.7
**Acceptance Criteria:**
- Agency users can configure a SAML identity provider (IdP) from the dashboard
- Dashboard accepts SAML metadata URL or manual configuration (entity ID, SSO URL, certificate)
- Users associated with the Agency account can authenticate via their IdP instead of email/password
- SAML assertion is validated server-side (signature verification, audience restriction, time bounds)
- Just-in-time provisioning: first SAML login creates the user account and assigns them to the Agency team
- SSO/SAML is gated by Agency tier

| ID | Task | P |
|----|------|---|
| AGCY-US4-A001 | Build SAML IdP configuration UI in dashboard (metadata URL or manual entry) | 6 |
| AGCY-US4-A002 | Implement SAML assertion consumer service (ACS) endpoint | 6 |
| AGCY-US4-A003 | Implement SAML assertion validation (signature, audience, time bounds) | 6 |
| AGCY-US4-A004 | Implement just-in-time user provisioning from SAML attributes | 6 |
| AGCY-US4-A005 | Write migration: saml_configurations table (entity_id, sso_url, certificate, agency_id) | 6 |

---

# Phase 4: Expansion

Platform distribution and internationalization.

---

## PLAT — Platform Integrations

### PLAT-US1: WordPress Plugin (P4)

**As a** builder using WordPress, **I need** a plugin to embed my calculator so that I don't have to manually paste script tags.

**Depends on:** WDGT-US1
**Requirements:** 4.1.1
**Acceptance Criteria:**
- Plugin installable from the WP plugin directory
- Plugin settings: authenticate with QuoteCraft account
- Gutenberg block and shortcode to embed a selected calculator
- Calculator renders identically to the script tag embed

| ID | Task | P |
|----|------|---|
| PLAT-US1-A001 | Build WordPress plugin with settings page and auth flow | 4 |
| PLAT-US1-A002 | Implement Gutenberg block for calculator embedding | 4 |
| PLAT-US1-A003 | Implement shortcode fallback | 5 |
| PLAT-US1-A004 | Submit to WordPress plugin directory | 5 |

### PLAT-US2: Zapier Native Integration (P5)

**As a** builder, **I need** a native Zapier integration with a "New Submission" trigger so that I can connect submissions to any app without writing code.

**Depends on:** LEAD-US1, BILL-US1
**Requirements:** 4.1.3
**Acceptance Criteria:**
- Zapier integration registered with a "New Submission" trigger
- Trigger outputs all field values and calculated results
- Replaces raw webhook for non-technical users

| ID | Task | P |
|----|------|---|
| PLAT-US2-A001 | Build Zapier integration app with New Submission trigger | 5 |
| PLAT-US2-A002 | Implement Zapier authentication flow (API key based) | 5 |
| PLAT-US2-A003 | Submit to Zapier app directory | 6 |

### PLAT-US3: Shopify App (P5)

**As a** builder using Shopify, **I need** an app to embed my calculator on product pages or standalone pages so that I can add quote functionality to my store without manual code editing.

**Depends on:** WDGT-US1
**Requirements:** 4.1.2
**Acceptance Criteria:**
- App installable from the Shopify app store
- App settings: authenticate with QuoteCraft account, select a calculator
- App block allows embedding a calculator on any page via the Shopify theme editor
- Calculator renders identically to the script tag embed
- App passes Shopify's app review requirements

| ID | Task | P |
|----|------|---|
| PLAT-US3-A001 | Scaffold Shopify app with OAuth authentication flow | 5 |
| PLAT-US3-A002 | Implement QuoteCraft account linking within the Shopify app | 5 |
| PLAT-US3-A003 | Build Shopify app block for embedding calculators via the theme editor | 5 |
| PLAT-US3-A004 | Submit to Shopify app store | 6 |

### PLAT-US4: Make (Integromat) Native Integration (P5)

**As a** builder, **I need** a native Make (Integromat) integration with a "New Submission" trigger so that I can connect submissions to any app using Make instead of Zapier.

**Depends on:** LEAD-US1, BILL-US1
**Requirements:** 4.1.4
**Acceptance Criteria:**
- Make integration registered with a "New Submission" trigger
- Trigger outputs all field values and calculated results
- Authentication via API key (same as Zapier integration)
- Equivalent functionality to the Zapier integration

| ID | Task | P |
|----|------|---|
| PLAT-US4-A001 | Build Make integration app with New Submission trigger | 5 |
| PLAT-US4-A002 | Implement Make authentication flow (API key based) | 5 |
| PLAT-US4-A003 | Submit to Make app directory | 6 |

---

## EMBD — Advanced Embed Modes

### EMBD-US1: Popup & Slide-In Modes (P3)

**As a** builder, **I need** my calculator to appear as a popup or slide-in panel so that it doesn't take up permanent space on my page.

**Depends on:** WDGT-US1
**Requirements:** 4.2.1, 4.2.2, 4.2.4
**Acceptance Criteria:**
- Builder can select embed mode: inline (default), popup, or slide-in
- Popup: calculator appears in a centered modal triggered by a button click. Builder configures button text and style.
- Slide-in: calculator slides from the bottom-right, triggered by button click or scroll depth
- All modes use the same calculator config (no duplication)
- Embed code adapts based on selected mode

| ID | Task | P |
|----|------|---|
| EMBD-US1-A001 | Implement popup modal container and trigger button in widget | 3 |
| EMBD-US1-A002 | Implement slide-in panel with scroll-depth trigger | 4 |
| EMBD-US1-A003 | Add embed mode selector to builder settings | 3 |
| EMBD-US1-A004 | Generate mode-specific embed code snippets | 3 |

### EMBD-US2: Standalone Hosted Pages (P4)

**As a** builder, **I need** a shareable direct link to my calculator so that I can send it via email or social media without embedding.

**Depends on:** WDGT-US1
**Requirements:** 4.2.3
**Acceptance Criteria:**
- Each calculator has a hosted page at `quotecraft.com/c/{id}`
- Page renders the calculator full-width with the builder's branding
- Page includes OG meta tags for social sharing previews

| ID | Task | P |
|----|------|---|
| EMBD-US2-A001 | Build hosted calculator page route | 4 |
| EMBD-US2-A002 | Add OG meta tags for social sharing | 4 |
| EMBD-US2-A003 | Add "Copy shareable link" to dashboard | 4 |

---

## I18N — Multi-Language Support

### I18N-US1: Widget Localization (P5)

**As a** builder serving non-English-speaking customers, **I need** to set the widget's language so that UI labels appear in my customers' language.

**Depends on:** WDGT-US1
**Requirements:** 4.3.1, 4.3.2, 4.3.3, 4.3.4
**Acceptance Criteria:**
- Builder can set a locale per calculator (affects "Next", "Back", "Submit", etc.)
- Widget ships with translation strings for top 10 languages
- Widget supports RTL layout for Arabic/Hebrew
- Currency formatting respects locale

| ID | Task | P |
|----|------|---|
| I18N-US1-A001 | Implement locale configuration in calculator settings | 5 |
| I18N-US1-A002 | Extract all widget UI strings into a translation map | 5 |
| I18N-US1-A003 | Create translation files for top 10 languages | 6 |
| I18N-US1-A004 | Implement RTL layout support in widget CSS | 6 |
| I18N-US1-A005 | Wire currency formatting to locale settings | 5 |

---

# Appendix: Requirement Traceability

## Coverage Summary

| Requirement Area | Req IDs | Covered By | Status |
|-----------------|---------|------------|--------|
| 1.1 Authentication | 1.1.1–1.1.7 | INFR-US4 | Covered |
| 1.2 Calculator CRUD | 1.2.1–1.2.9 | INFR-US5, BLDR-US1, BLDR-US5 | Covered |
| 1.3 Field Types | 1.3.1–1.3.11 | BLDR-US2, INFR-US6 (image upload) | Covered |
| 1.4 Layout & Flow | 1.4.1–1.4.7 | BLDR-US3 | Covered |
| 1.5 Formula Engine | 1.5.1–1.5.13 | CALC-US1, CALC-US2, BLDR-US4 | Covered |
| 1.6 Results Display | 1.6.1–1.6.9 | CALC-US3 | Covered |
| 1.7 Styling & Branding | 1.7.1–1.7.9 | STYL-US1, STYL-US2 | Covered |
| 1.8 Embeddable Widget | 1.8.1–1.8.14 | WDGT-US1, WDGT-US2 | Covered |
| 1.9 Backend API | 1.9.1–1.9.9 | INFR-US2, INFR-US3, INFR-US5, LEAD-US1 | Covered |
| 1.10 Templates | 1.10.1–1.10.6 | TMPL-US1 | Covered |
| 2.1 Template Gallery | 2.1.1–2.1.9 | SEOP-US1 | Covered |
| 2.2 Blog | 2.2.1–2.2.6 | SEOP-US2 | Covered |
| 2.3 Lead Capture | 2.3.1–2.3.11 | LEAD-US1, LEAD-US2, LEAD-US3, LEAD-US4 | Covered |
| 2.4 Widget SEO | 2.4.1–2.4.4 | WSEO-US1 | Covered |
| 3.1 Billing | 3.1.1–3.1.8 | BILL-US1 | Covered |
| 3.2 Pro Tier | 3.2.1–3.2.6 | PROT-US1, PROT-US2, PROT-US3, PROT-US4 | Partial — see note |
| 3.3 Business Tier | 3.3.1–3.3.9 | BSNS-US1, BSNS-US2, BSNS-US3, BSNS-US4, BSNS-US5, BSNS-US6 | Covered |
| 3.4 Agency Tier | 3.4.1–3.4.7 | AGCY-US1, AGCY-US2, AGCY-US3, AGCY-US4 | Covered |
| 4.1 Platform Integrations | 4.1.1–4.1.4 | PLAT-US1, PLAT-US2, PLAT-US3, PLAT-US4 | Covered |
| 4.2 Advanced Embed | 4.2.1–4.2.4 | EMBD-US1, EMBD-US2 | Covered |
| 4.3 Multi-Language | 4.3.1–4.3.4 | I18N-US1 | Covered |

## Remaining Gaps

| Req ID | Requirement | Status | Notes |
|--------|-------------|--------|-------|
| **3.2.7** | Pro users receive priority email support | Intentionally excluded | Operational process, not a code deliverable. Handled via support tooling/tagging outside the codebase. |

## User Stories Not Traced to Requirements

| User Story | Rationale |
|------------|-----------|
| **INFR-US1** (Project Scaffolding) | Infrastructure prerequisite — no functional requirement. Enables all subsequent work. |
| **WDGT-US3** (Widget Error Reporting) | Derived from SYSTEM_DESIGN.md (Observability/Error Tracking), not from a functional requirement in REQUIREMENTS.md. |
