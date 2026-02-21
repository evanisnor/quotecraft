# QuoteCraft — Requirements Document

Cross-reference: [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)

---

## Summary

| Phase | Functional Areas | Requirement Count |
|-------|-----------------|-------------------|
| Phase 1: MVP | Auth, Calculator CRUD, Field Types, Layout, Formula Engine, Results, Styling, Widget, Backend, Templates | 78 |
| Phase 2: Growth | Template Gallery, Blog, Lead Capture, Widget SEO | 24 |
| Phase 3: Monetization | Billing, Pro, Business, Agency | 30 |
| Phase 4: Expansion | Platform Integrations, Advanced Embed, Multi-Language | 12 |
| **Total** | **17 functional areas** | **144 requirements** |

---

## Dependency Map

```
Phase 1 (MVP)
  1.1 Auth
   └─► 1.2 Calculator CRUD
        ├─► 1.3 Field Types
        │    ├─► 1.4 Layout & Flow
        │    │    └─► 1.6 Results Display ─► 1.8 Widget
        │    └─► 1.5 Formula Engine
        │         └─► 1.6 Results Display
        └─► 1.7 Styling ─► 1.8 Widget
   └─► 1.9 Backend API
        └─► 1.8 Widget
   1.10 Templates (depends on 1.2–1.7)

Phase 2 (Growth)
  1.10 Templates ─► 2.1 Template Gallery ─► 2.2 Blog
  1.8 Widget ─► 2.3 Lead Capture / Submissions
  1.8 Widget ─► 2.4 Widget SEO

Phase 3 (Monetization)
  1.1 Auth ─► 3.1 Billing
               ├─► 3.2 Pro (+ 2.3)
               │    └─► 3.3 Business
               │         └─► 3.4 Agency
               └───────────────┘

Phase 4 (Expansion)
  1.8 Widget ─► 4.1 Platform Integrations
  1.8 Widget ─► 4.2 Advanced Embed Modes
  1.8 + 1.3  ─► 4.3 Multi-Language
```

---

## Phase 1: MVP

The minimum viable product. Everything here must ship before the first public user touches QuoteCraft. The goal is a working end-to-end flow: sign up → build a calculator → embed it → collect a submission.

### 1.1 Authentication & User Accounts

Foundation for all other functional areas. Nothing works without this.

**Depends on:** Nothing
**Depended on by:** 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8

| ID | Requirement | Status |
|----|-------------|--------|
| 1.1.1 | User can sign up with email + password | |
| 1.1.2 | User can sign up with Google OAuth | |
| 1.1.3 | User can log in and receive a session token (JWT or equivalent) | |
| 1.1.4 | User can log out, invalidating their session | |
| 1.1.5 | User can reset their password via email link | |
| 1.1.6 | API endpoints reject unauthenticated requests with 401 | |
| 1.1.7 | Rate limiting on auth endpoints (prevent brute force) | |

### 1.2 Calculator CRUD

The ability to create, read, update, and delete calculator definitions. This is the data model backbone.

**Depends on:** 1.1
**Depended on by:** 1.3, 1.4, 1.5, 1.6, 1.7

| ID | Requirement | Status |
|----|-------------|--------|
| 1.2.1 | User can create a new calculator (assigned a unique ID) | |
| 1.2.2 | User can view a list of all their calculators | |
| 1.2.3 | User can update a calculator's configuration (fields, formulas, styling) | |
| 1.2.4 | User can delete a calculator | |
| 1.2.5 | User can duplicate an existing calculator | |
| 1.2.6 | Calculator definition is stored as a structured JSON schema (fields, layout, formulas, styling, settings) | |
| 1.2.7 | Calculator has metadata: name, description, created date, last modified date | |
| 1.2.8 | Deleting a calculator immediately stops it from rendering on any embed | |
| 1.2.9 | No limit on number of calculators per account | |

### 1.3 Visual Builder — Field Types

The drag-and-drop editor for adding and configuring input fields. Each field type has its own configuration surface.

**Depends on:** 1.1, 1.2
**Depended on by:** 1.4, 1.5, 1.6

| ID | Requirement | Status |
|----|-------------|--------|
| 1.3.1 | Builder supports Dropdown / Select fields with configurable options (label + value pairs) | |
| 1.3.2 | Builder supports Radio Button fields with configurable options (label + value pairs) | |
| 1.3.3 | Builder supports Checkbox fields (multi-select, each option has a label + value) | |
| 1.3.4 | Builder supports Number Input fields with configurable min, max, step, default value, and placeholder | |
| 1.3.5 | Builder supports Slider / Range fields with configurable min, max, step, and default value | |
| 1.3.6 | Builder supports Text Input fields (non-numeric, for context like "project description") | |
| 1.3.7 | Builder supports Image Select fields (user uploads option images, each has a label + value) | |
| 1.3.8 | Every field has: label, help text (optional), required toggle, and a unique variable name for formula reference | |
| 1.3.9 | Fields can be reordered via drag-and-drop | |
| 1.3.10 | Fields can be deleted from the builder | |
| 1.3.11 | Field configuration changes are reflected in the live preview immediately | |

### 1.4 Visual Builder — Layout & Flow

Controls how fields are organized and how the calculator progresses.

**Depends on:** 1.3
**Depended on by:** 1.6

| ID | Requirement | Status |
|----|-------------|--------|
| 1.4.1 | Builder supports single-page layout (all fields visible at once) | |
| 1.4.2 | Builder supports multi-step layout (wizard-style, one or more fields per step, with Next/Back navigation) | |
| 1.4.3 | Builder can switch between single-page and multi-step layout at any time without losing field configuration | |
| 1.4.4 | Multi-step layout shows a progress bar indicating current step / total steps | |
| 1.4.5 | Conditional visibility: fields or steps can be shown/hidden based on the value of other fields (e.g., "show field X only if field Y = 'commercial'") | |
| 1.4.6 | Conditional visibility rules are configurable in the builder UI (not code-only) | |
| 1.4.7 | Multiple conditions can be combined with AND/OR logic | |

### 1.5 Formula Engine

The calculation logic that computes output values from user inputs. Runs client-side in both the builder preview and the embedded widget.

**Depends on:** 1.3
**Depended on by:** 1.6

| ID | Requirement | Status |
|----|-------------|--------|
| 1.5.1 | Supports arithmetic operators: `+`, `-`, `*`, `/`, `%` | |
| 1.5.2 | Supports parentheses for operation grouping | |
| 1.5.3 | Supports conditional expressions: `IF(condition, then_value, else_value)` | |
| 1.5.4 | Supports comparison operators: `=`, `!=`, `>`, `<`, `>=`, `<=` | |
| 1.5.5 | Supports variable references by field name (e.g., `{num_bathrooms} * 500`) | |
| 1.5.6 | Supports tiered/bracket pricing (e.g., "first 10 units at $5, next 20 at $4, remainder at $3") | |
| 1.5.7 | Supports multiple output values (e.g., subtotal, tax, discount, total — each with its own formula) | |
| 1.5.8 | Supports rounding controls: round to nearest integer, to N decimal places, floor, ceil | |
| 1.5.9 | Formula editor shows live preview of the calculated result as the builder configures it | |
| 1.5.10 | Formula engine runs entirely client-side (no server round-trip for calculation) | |
| 1.5.11 | Formula engine is sandboxed — no access to DOM, network, or host page (prevents injection) | |
| 1.5.12 | Invalid formulas show clear error messages in the builder (e.g., "Unknown variable: {numbathrooms}. Did you mean {num_bathrooms}?") | |
| 1.5.13 | Supports `MIN()`, `MAX()`, `ABS()`, `ROUND()` math functions | |

### 1.6 Results Display

What the end user sees after completing the calculator.

**Depends on:** 1.4, 1.5
**Depended on by:** 1.8

| ID | Requirement | Status |
|----|-------------|--------|
| 1.6.1 | Results page displays one or more calculated output values with labels | |
| 1.6.2 | Results can show a price range (e.g., "$2,400 – $3,100") by defining a low and high formula | |
| 1.6.3 | Results can show an itemized breakdown (list of line items with individual values that sum to the total) | |
| 1.6.4 | Results page supports a custom message (rich text) that the builder configures | |
| 1.6.5 | Results page supports conditional messages (different text shown based on the calculated value — e.g., different messaging for quotes above/below $5,000) | |
| 1.6.6 | Results page includes a configurable CTA button (label + URL — e.g., "Book a consultation" → Calendly link) | |
| 1.6.7 | Currency formatting: builder chooses currency symbol and position (e.g., "$1,234" or "1.234 €") | |
| 1.6.8 | Number formatting: builder chooses thousands separator and decimal separator | |
| 1.6.9 | End user can restart the calculator from the results page | |

### 1.7 Styling & Branding

Appearance customization so the embedded calculator matches the builder's website.

**Depends on:** 1.2
**Depended on by:** 1.8

| ID | Requirement | Status |
|----|-------------|--------|
| 1.7.1 | Builder can set primary color, secondary color, background color, and text color | |
| 1.7.2 | Builder can select a font from a curated list of web-safe + Google Fonts | |
| 1.7.3 | Builder can adjust border radius (sharp to fully rounded) | |
| 1.7.4 | Builder can adjust padding and shadow intensity | |
| 1.7.5 | Builder can toggle light/dark mode base theme | |
| 1.7.6 | Builder can upload a logo to display in the calculator header | |
| 1.7.7 | Builder can enter custom CSS that overrides default widget styles | |
| 1.7.8 | Style changes are reflected immediately in the live preview | |
| 1.7.9 | Free tier displays a "Powered by QuoteCraft" badge at the bottom of the widget. Badge links to QuoteCraft homepage. Badge cannot be removed or hidden on free tier. | |

### 1.8 Embeddable Widget

The JavaScript bundle that renders the calculator on the builder's website.

**Depends on:** 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
**Depended on by:** 2.3

| ID | Requirement | Status |
|----|-------------|--------|
| 1.8.1 | Widget is embedded via a single `<script>` tag with a `data-calculator-id` attribute | |
| 1.8.2 | Script loads asynchronously and non-blocking (does not delay host page rendering) | |
| 1.8.3 | Widget renders inside a Shadow DOM to prevent CSS conflicts with the host page | |
| 1.8.4 | Widget is a vanilla JS bundle with no external framework dependencies | |
| 1.8.5 | Widget bundle is served from a CDN with cache headers | |
| 1.8.6 | Widget bundle is < 50KB gzipped | |
| 1.8.7 | Widget fetches calculator configuration from the QuoteCraft API on load | |
| 1.8.8 | Widget is fully responsive — renders correctly on viewports from 320px to 2560px | |
| 1.8.9 | Widget is keyboard-navigable and meets WCAG 2.1 AA accessibility requirements | |
| 1.8.10 | Widget works in all modern browsers (Chrome, Firefox, Safari, Edge — last 2 major versions) | |
| 1.8.11 | iFrame embed fallback is available for platforms that block external scripts | |
| 1.8.12 | Dashboard provides a copy-to-clipboard embed code snippet for each calculator | |
| 1.8.13 | All calculations run client-side — widget functions even if API is temporarily unreachable (except submission logging) | |
| 1.8.14 | Widget renders semantic HTML with ARIA labels (not canvas/image-based) | |

### 1.9 Backend API & Data Storage

The server-side infrastructure supporting all other areas.

**Depends on:** 1.1
**Depended on by:** 1.2, 1.8, 2.3, 2.4

| ID | Requirement | Status |
|----|-------------|--------|
| 1.9.1 | REST API with endpoints for: auth, calculator CRUD, submission storage, embed config retrieval | |
| 1.9.2 | PostgreSQL database with tables for: users, calculators, submissions, sessions | |
| 1.9.3 | Calculator config endpoint is publicly accessible (no auth) — required for widget to load | |
| 1.9.4 | Calculator config endpoint returns JSON with appropriate cache headers (short TTL, e.g., 5 min) | |
| 1.9.5 | Submission endpoint accepts POST from the widget (CORS-enabled for any origin) | |
| 1.9.6 | Submission endpoint is rate-limited per calculator ID (prevent abuse) | |
| 1.9.7 | API responses follow consistent error format (status code, error code, human-readable message) | |
| 1.9.8 | Database migrations are versioned and reproducible | |
| 1.9.9 | API has health check endpoint for monitoring | |

### 1.10 Templates

Pre-built calculator templates that new users can start from instead of building from scratch.

**Depends on:** 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
**Depended on by:** 2.1, 2.2

| ID | Requirement | Status |
|----|-------------|--------|
| 1.10.1 | System ships with at least 10 pre-built templates covering high-search-volume niches | |
| 1.10.2 | Templates include: plumbing estimate, web design quote, moving cost, cleaning service, landscaping, home renovation, freelance hourly rate, event/venue rental, printing/signage, and SaaS pricing | |
| 1.10.3 | User can preview a template before selecting it | |
| 1.10.4 | Selecting a template creates a copy in the user's account (does not modify the original) | |
| 1.10.5 | Template includes pre-configured fields, formulas, results display, and styling | |
| 1.10.6 | User can modify every aspect of a template after selecting it | |

---

## Phase 2: Growth

SEO and virality features that drive organic traffic and user acquisition. Builds on the MVP to make QuoteCraft discoverable and the embedded calculators a growth engine.

### 2.1 Template Gallery (Public SEO Pages)

Public-facing pages on the QuoteCraft website that showcase templates and drive organic search traffic.

**Depends on:** 1.10
**Depended on by:** 2.2

| ID | Requirement | Status |
|----|-------------|--------|
| 2.1.1 | Each template has a dedicated public landing page with a unique, keyword-optimized URL slug (e.g., `/templates/plumbing-cost-calculator`) | |
| 2.1.2 | Landing page includes: H1 with target keyword, description text, a working live demo of the calculator, and a CTA to sign up and customize | |
| 2.1.3 | Template gallery index page lists all templates with thumbnails, categories, and search/filter | |
| 2.1.4 | Pages are server-side rendered (SSR) or statically generated for search engine crawlability | |
| 2.1.5 | Each page has unique `<title>`, `<meta description>`, and canonical URL | |
| 2.1.6 | Schema.org structured data on each template page (FAQPage, HowTo as appropriate) | |
| 2.1.7 | Open Graph and Twitter Card meta tags on each page (image, title, description) | |
| 2.1.8 | Template gallery pages are included in an auto-generated XML sitemap | |
| 2.1.9 | Gallery scales to 50+ templates without manual page creation (pages generated from template metadata) | |

### 2.2 Blog / Content Marketing Infrastructure

Blog targeting "[industry] cost calculator" and "how much does [service] cost" long-tail keywords.

**Depends on:** 2.1
**Depended on by:** Nothing (standalone growth driver)

| ID | Requirement | Status |
|----|-------------|--------|
| 2.2.1 | Blog section at `/blog` with category and tag support | |
| 2.2.2 | Blog posts are SSR/statically generated with proper meta tags | |
| 2.2.3 | Blog posts can embed live QuoteCraft calculator demos inline | |
| 2.2.4 | Blog posts are included in the XML sitemap | |
| 2.2.5 | Blog has an RSS feed | |
| 2.2.6 | Each blog post has a CTA linking to the relevant template or the sign-up page | |

### 2.3 Submission Log & Email Notifications (Lead Capture)

The free-tier lead capture system that gives builders a reason to check their QuoteCraft dashboard daily.

**Depends on:** 1.8, 1.9
**Depended on by:** 3.1, 3.4

| ID | Requirement | Status |
|----|-------------|--------|
| 2.3.1 | When an end user completes a calculator and submits, the submission is stored in the database | |
| 2.3.2 | Submission record includes: calculator ID, all input field values, all calculated output values, timestamp, and referrer URL | |
| 2.3.3 | Builder can view a submission log in the dashboard — list view with date, calculated total, and lead info | |
| 2.3.4 | Submission log shows the last 30 days of data (free tier limit) | |
| 2.3.5 | Builder can click into a submission to see full detail (all inputs and outputs) | |
| 2.3.6 | Builder can configure optional lead capture fields on the calculator: name, email, phone (each independently togglable and optionally required) | |
| 2.3.7 | Lead capture form can be positioned: (a) before results (gated — must fill to see quote), or (b) alongside results (non-gated — optional "email me this quote") | |
| 2.3.8 | Builder receives an email notification when a new submission with lead info comes in | |
| 2.3.9 | Email notification includes: lead name/email/phone, calculated values, and a link to the full submission in the dashboard | |
| 2.3.10 | Builder can toggle email notifications on/off per calculator | |
| 2.3.11 | Submissions respect rate limits — no more than N submissions per IP per calculator per hour (prevent spam) | |

### 2.4 Widget SEO Enhancements

Features that make embedded calculators contribute to the builder's website SEO.

**Depends on:** 1.8
**Depended on by:** Nothing

| ID | Requirement | Status |
|----|-------------|--------|
| 2.4.1 | Widget renders real HTML elements (not canvas or image) so content is indexable by search engines | |
| 2.4.2 | Widget outputs semantic HTML (headings, labels, fieldsets) with ARIA attributes | |
| 2.4.3 | `<noscript>` fallback renders a static description of the calculator for crawlers and users with JS disabled | |
| 2.4.4 | Standalone calculator pages (direct link) include Open Graph meta tags so they preview correctly when shared on social media | |

---

## Phase 3: Monetization

Paid tier features that turn free users into paying customers. Each tier builds on the previous.

### 3.1 Billing & Subscription Management

The payment infrastructure underlying all paid features.

**Depends on:** 1.1
**Depended on by:** 3.2, 3.3, 3.4

| ID | Requirement | Status |
|----|-------------|--------|
| 3.1.1 | Integration with Stripe for subscription billing | |
| 3.1.2 | Three paid plans: Pro ($19/mo), Business ($49/mo), Agency ($99/mo) | |
| 3.1.3 | User can upgrade, downgrade, or cancel from the dashboard | |
| 3.1.4 | Downgrading disables paid features gracefully (e.g., branding badge reappears, PDF generation stops, but no data is deleted) | |
| 3.1.5 | Failed payment triggers a grace period (7 days) before downgrading to free | |
| 3.1.6 | Billing page shows current plan, next billing date, payment method, and invoice history | |
| 3.1.7 | Annual billing option with discount (e.g., 2 months free) | |
| 3.1.8 | Feature access is enforced server-side based on plan tier (not just UI hiding) | |

### 3.2 Pro Tier Features

**Depends on:** 3.1, 2.3
**Depended on by:** 3.3

| ID | Requirement | Status |
|----|-------------|--------|
| 3.2.1 | Pro users can remove the "Powered by QuoteCraft" badge from all their calculators | |
| 3.2.2 | Pro users can generate branded PDF quotes: end user receives a PDF via email with the builder's logo, contact info, itemized breakdown, and calculated totals | |
| 3.2.3 | PDF template is clean and professional with configurable header (logo, company name, contact info) | |
| 3.2.4 | Pro users can set a custom thank-you redirect URL (end user is sent to a specific page after submission — e.g., Calendly, Stripe checkout) | |
| 3.2.5 | Pro users can configure Google Analytics and/or Meta Pixel tracking IDs; the widget fires conversion events on submission | |
| 3.2.6 | Pro users have unlimited submission history (not limited to 30 days) | |
| 3.2.7 | Pro users receive priority email support (tagged in support system for faster response) | |

### 3.3 Business Tier Features

**Depends on:** 3.2
**Depended on by:** 3.4

| ID | Requirement | Status |
|----|-------------|--------|
| 3.3.1 | Business users can connect CRM integrations: HubSpot, Salesforce, Pipedrive — submissions auto-push as leads/contacts | |
| 3.3.2 | Business users can configure a Zapier/Make webhook URL — each submission triggers a POST with all field data | |
| 3.3.3 | Business users can run A/B tests: create two variants of a calculator, traffic is split, dashboard shows conversion rate for each variant | |
| 3.3.4 | A/B test shows: impressions, completions, submission rate, and average quote value per variant | |
| 3.3.5 | Business users can invite team members (3 seats included). Additional seats at $5/seat/mo | |
| 3.3.6 | Team members have role-based access: Admin (full access), Editor (edit calculators, view submissions), Viewer (read-only) | |
| 3.3.7 | Business users can configure a custom domain for standalone calculator pages (e.g., `quotes.yourbusiness.com` via CNAME) | |
| 3.3.8 | Business users can set up conditional email sequences: different follow-up emails triggered based on the calculated output value (e.g., high-value quotes get a personal outreach email, low-value get a self-service link) | |
| 3.3.9 | Submission analytics dashboard: conversion funnel visualization (views → starts → completions → submissions), drop-off by step, average quote value, and field-level engagement metrics | |

### 3.4 Agency Tier Features

**Depends on:** 3.3
**Depended on by:** Nothing

| ID | Requirement | Status |
|----|-------------|--------|
| 3.4.1 | Agency users can white-label the product: remove all QuoteCraft branding from the widget, dashboard, and emails | |
| 3.4.2 | Agency users can create client sub-accounts, each with its own set of calculators and submissions, managed from a single parent dashboard | |
| 3.4.3 | Agency users have API access: programmatically create, read, update, and delete calculators; list and retrieve submissions | |
| 3.4.4 | API documentation is publicly available with authentication via API key | |
| 3.4.5 | Agency users can configure a webhook URL per calculator — real-time POST on every submission | |
| 3.4.6 | Agency users can bulk-update calculator settings across all calculators (e.g., change a formula, update styling, or push a new field to all calculators at once) | |
| 3.4.7 | SSO / SAML support for enterprise agency accounts | |

---

## Phase 4: Expansion

Platform distribution and internationalization. These extend QuoteCraft's reach into new channels and markets.

### 4.1 Platform Integrations

Native integrations for the most popular website platforms.

**Depends on:** 1.8 (widget), 3.1 (billing, for premium integration features)
**Depended on by:** Nothing

| ID | Requirement | Status |
|----|-------------|--------|
| 4.1.1 | WordPress plugin: install from WP plugin directory, authenticate with QuoteCraft account, select a calculator, and insert it into any page/post via shortcode or Gutenberg block | |
| 4.1.2 | Shopify app: install from Shopify app store, embed calculator on product pages or standalone pages via app block | |
| 4.1.3 | Zapier native integration: "New Submission" trigger that outputs all field values and calculated results (replaces raw webhook for non-technical users) | |
| 4.1.4 | Make (Integromat) native integration: equivalent to Zapier trigger | |

### 4.2 Advanced Embed Modes

Additional ways to present the calculator beyond inline embed.

**Depends on:** 1.8
**Depended on by:** Nothing

| ID | Requirement | Status |
|----|-------------|--------|
| 4.2.1 | Popup mode: calculator appears in a centered modal overlay triggered by a button click. Builder configures button text and style. | |
| 4.2.2 | Slide-in mode: calculator slides in from the bottom-right corner, triggered by button click or scroll depth | |
| 4.2.3 | Standalone page mode: calculator is hosted on a QuoteCraft URL (e.g., `quotecraft.com/c/abc123`) and can be shared as a direct link | |
| 4.2.4 | All embed modes share the same calculator configuration — no duplication needed | |

### 4.3 Multi-Language Support

Internationalization for both the builder interface and the embedded widget.

**Depends on:** 1.8, 1.3
**Depended on by:** Nothing

| ID | Requirement | Status |
|----|-------------|--------|
| 4.3.1 | Builder can set the language/locale for an individual calculator (affects labels like "Next", "Back", "Submit", number formatting) | |
| 4.3.2 | Widget supports RTL (right-to-left) layout for Arabic, Hebrew, etc. | |
| 4.3.3 | Builder dashboard is available in English (additional languages as demand warrants) | |
| 4.3.4 | Currency formatting respects locale (symbol, position, separators) | |
