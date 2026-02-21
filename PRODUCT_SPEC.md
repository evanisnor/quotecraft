# Product Spec: QuoteCraft — Free Embeddable Quote Calculator Builder

## Context

Small business owners (contractors, agencies, freelancers, service providers) need interactive pricing/quote calculators on their websites to convert visitors into leads. The current market is dominated by tools that paywall aggressively after trivial free tiers:

- **Outgrow**: No free plan at all (7-day trial only). Essentials at $22/mo, Business at $720/mo for full features.
- **ConvertCalculator**: Free plan capped at 100 visits/month — effectively unusable.
- **Calconic**: Free plan allows 5 calculators / 500 impressions per month — marginal.
- **Elfsight**: Free plan limited to 200 views/month and 1 widget.
- **involve.me**: Freemium with heavy branding and limited submissions.

The gap: **There is no genuinely free, full-featured, embeddable quote calculator builder.** Every competitor gates the product behind view/submission caps that make the free tier a demo, not a tool. A plumber who gets 1,000 site visits/month is already over every free tier limit.

Interactive calculators increase on-page time, reduce bounce rates, and improve SEO rankings. Sites with calculators report ~50% higher conversion rates on landing pages and ~10% uplift in organic traffic ([source](https://moversdev.com/seo-benefits-of-featuring-an-instant-quote-calculator-on-your-moving-website/)). Calculator pages are the highest-traffic category in free tool sites — 8.6x more pageviews than dashboards ([source](https://www.taskade.com/blog/best-calculator-builders)).

---

## Product Overview

**QuoteCraft** is a free, no-code, embeddable quote/pricing calculator builder. Users build a calculator in a visual editor, customize its appearance, and embed it on any website with a single `<script>` tag. The free tier is genuinely usable — unlimited views, unlimited submissions, unlimited calculators — with a "Powered by QuoteCraft" badge that drives organic discovery (the [Tawk.to playbook](https://www.growbo.com/best-sales-funnel-examples/)).

### One-Liner
Build and embed a custom quote calculator on your website in 5 minutes. No code. No view limits. Free.

---

## Users & Use Cases

### Primary Users (Calculator Builders)

These are the people who come to QuoteCraft to create calculators:

| Persona | Example Use Case |
|---------|-----------------|
| **Home service contractors** | Plumber builds a "Get an estimate" widget: # bathrooms, type of work, urgency → price range |
| **Freelancers & agencies** | Design agency builds a project quote tool: scope, timeline, deliverables → estimated cost |
| **SaaS companies** | Startup builds a pricing calculator: # users, plan tier, annual vs monthly → total cost |
| **E-commerce / custom products** | Print shop builds a quote tool: quantity, paper stock, size, finishing → per-unit price |
| **Professional services** | Accountant builds a "tax prep estimate" tool: filing status, income sources, complexity → fee |
| **Real estate / mortgage** | Agent builds an affordability calculator: income, debts, down payment → max budget |
| **Event planners / venues** | Venue builds a rental estimate: date, guest count, catering, AV needs → total |

### End Users (Calculator Visitors)

These are the people who interact with the embedded calculators on the builder's website:

- A homeowner getting a rough plumbing estimate before calling
- A startup founder estimating agency costs before reaching out
- A potential customer comparing SaaS pricing tiers
- A bride estimating venue costs for her wedding

**End user value:** Transparent, instant pricing reduces friction. They get a number without having to call, email, or fill out a "request a quote" form and wait 3 days.

**Builder value:** Pre-qualified leads (visitors who've already seen pricing and still want to proceed), reduced time on back-and-forth quoting, professional appearance.

---

## Core Features (Free Tier)

### 1. Visual Calculator Builder (Drag-and-Drop)

The editor where builders create their calculator. No code required.

**Input field types:**
- Dropdown / Select
- Radio buttons (single choice)
- Checkboxes (multi-choice)
- Number input (with min/max/step)
- Slider / Range
- Text input (for non-numeric context, e.g., project description)
- Image select (choose from visual options — e.g., flooring types)

**Layout:**
- Multi-step (wizard-style, one question per page) or single-page
- Conditional steps — show/hide fields based on prior answers
- Progress bar for multi-step flows
- Responsive by default — works on mobile, tablet, desktop

### 2. Formula Engine

The calculation logic that determines the output.

- Basic arithmetic: `+`, `-`, `*`, `/`, `%`
- Conditional logic: `IF/THEN/ELSE` — e.g., "if urgency = 'emergency', multiply by 1.5"
- Tiered pricing: quantity breakpoints, volume discounts
- Variable references: use any field's value in any formula
- Multiple output values: show subtotal, tax, discount, and total simultaneously
- Rounding controls: nearest dollar, cent, or custom precision
- Formula preview: see calculated result update live as you build

### 3. Results Display

What the end user sees after completing the calculator.

- Price / quote range display (e.g., "$2,400 – $3,100")
- Itemized breakdown: show line items that contributed to the total
- Custom result messages based on value (e.g., "That's a medium-sized project — we typically complete these in 2-3 weeks")
- Conditional result pages: different messaging/CTAs based on the calculated output
- Call-to-action button: "Book a consultation", "Request formal quote", "Call us"

### 4. Styling & Branding

- Color theme picker (primary, secondary, background, text)
- Font selection from web-safe + Google Fonts
- Border radius, padding, shadow controls
- Custom CSS override for advanced users
- Light/dark mode support
- Logo upload

### 5. Embedding

- `<script>` tag embed (single line of code, works on any website)
- Popup / slide-in trigger mode (button click opens calculator)
- iFrame fallback for restrictive platforms

Stretch goals:
- WordPress plugin
- Direct link (standalone page hosted by QuoteCraft)

### 6. Lead Capture

Builders can optionally gate the results behind a lightweight lead capture form:

- Name, email, phone fields (configurable — pick which to require)
- Shown after calculation but before revealing the result
- Or shown alongside the result (non-gated, just "want us to email you this quote?")
- Email notification to the builder when a lead submits
- Basic submission log viewable in the QuoteCraft dashboard

### 7. SEO Features

These features help QuoteCraft rank and drive traffic, and help builders' embedded calculators contribute to their own SEO:

**For the QuoteCraft site (driving our traffic):**
- Template gallery: pre-built calculators for high-search-volume niches ("plumbing cost calculator", "web design quote calculator", "moving cost estimator") — each gets its own SEO-optimized landing page
- Blog content targeting "[industry] cost calculator" and "how much does [service] cost" keywords
- Schema.org structured data on template pages (FAQs, HowTo)
- Each template page has a working live demo calculator above the fold

**For the builder's embedded calculator:**
- Calculator renders real HTML content (not iFrame-only) so search engines can index it
- Semantic HTML with appropriate headings and ARIA labels
- Optional `<noscript>` fallback content for crawlers
- Open Graph meta tags for shared calculator links

---

## Free Tier Limits (What We DON'T Cap)

This is the strategic differentiator. Where every competitor caps views/submissions on free:

| Feature | QuoteCraft Free | Outgrow Free | ConvertCalculator Free | Calconic Free | Elfsight Free |
|---------|----------------|-------------|----------------------|---------------|---------------|
| Monthly views | **Unlimited** | No free plan | 100 | 500 | 200 |
| Submissions | **Unlimited** | No free plan | 100 | 500 | 200 |
| Calculators | **Unlimited** | No free plan | 1 | 5 | 1 |
| Branding | "Powered by QuoteCraft" | N/A | Yes | Yes | Yes |

**What the free tier includes:**
- Unlimited calculators, views, and submissions
- Full visual builder with all field types
- Full formula engine with conditional logic
- Responsive embed on any website
- Basic lead capture (email notification)
- Submission log (last 30 days)
- "Powered by QuoteCraft" badge on the widget

---

## Paid Tier Features (Upsell Path)

### Tier 1: Pro ($19/mo)

For individual businesses that want the professional edge:

- **Remove "Powered by QuoteCraft" branding**
- **PDF quote generation** — end user gets a branded PDF emailed to them (with the builder's logo, contact info, and the itemized breakdown). This is a huge differentiator — turns a widget into a sales tool.
- **Custom thank-you redirect** — send users to a specific URL after submission (booking page, Calendly link, Stripe checkout)
- **Google Analytics / Meta Pixel integration** — fire conversion events on submission
- **Unlimited submission history** (not just 30 days)
- **Priority email support**

### Tier 2: Business ($49/mo)

For agencies and growing businesses:

- Everything in Pro, plus:
- **CRM integrations** — push leads directly to HubSpot, Salesforce, Pipedrive, or via Zapier/Make webhook
- **A/B testing** — run two calculator variants, see which converts better
- **Team seats** (3 included, add more for $5/seat)
- **Custom domain** for standalone calculator pages (quotes.yourbusiness.com)
- **Conditional email sequences** — auto-send different follow-up emails based on the calculated value (e.g., high-value leads get a personal outreach email)
- **Submission analytics dashboard** — conversion funnel, drop-off points, average quote values, field-level engagement

### Tier 3: Agency ($99/mo)

For agencies managing calculators for multiple clients:

- Everything in Business, plus:
- **White-label** — completely remove all QuoteCraft references, use as your own tool
- **Client sub-accounts** — manage calculators across multiple client sites from one dashboard
- **API access** — programmatically create/update calculators and retrieve submissions
- **Webhook on submission** — real-time POST to any endpoint
- **Bulk embed management** — update calculator logic across all embeds from one place
- **SSO / SAML** support

---

## Upsell Strategy Analysis

### Why This Freemium Model Works

The free tier is designed around the **Tawk.to playbook**: give away the core product for free, make it genuinely good, and let the "Powered by" badge drive organic acquisition. Every embedded calculator is an ad for QuoteCraft on someone else's website.

**Natural upsell triggers (moments when free users hit a wall they'll pay to solve):**

1. **Branding removal** — the single biggest driver. Small business owners embed the calculator, love it, then want it to look fully "theirs." This is the lightest-touch upsell (just remove a badge) and historically converts at the highest rate in widget-based SaaS.

2. **PDF quotes** — builders start getting submissions and realize they still have to manually create quotes to send. The moment they want to automate that last mile (calculator → professional PDF in the customer's inbox), they upgrade.

3. **CRM integration** — once a builder is getting 10+ leads/week through the calculator, manually checking a submission log becomes painful. The natural next step is pushing leads into their existing CRM.

4. **A/B testing** — after the calculator is working and generating leads, the next question is always "could I get MORE leads?" Testing is the answer.

5. **Agency white-label** — web agencies discover QuoteCraft by seeing a client's calculator. They want to offer it as a service to all their clients under their own brand.

### Revenue Modeling

Conservative assumptions:
- Free "Powered by" badge drives 40% of new signups (organic/viral loop)
- 5% of free users convert to Pro ($19/mo) within 6 months
- 1% convert to Business ($49/mo)
- 0.2% convert to Agency ($99/mo)
- At 10,000 free users: ~$12,500 MRR

This aligns with [industry benchmarks](https://www.growbo.com/freemium-upsell/) showing 8-20% freemium conversion rates for well-designed products, with our blended rate of ~6.2% being conservative.

### Competitive Moat

- **Free tier generosity** — unlimited everything means builders never leave because they "outgrew the free plan." They leave because they want *more*, not because they were forced out.
- **Network effect** — every embedded calculator is a distribution channel. More free users = more badges = more discovery.
- **Switching cost** — once a builder has configured conditional logic, formulas, and styling, they won't redo it elsewhere unless the product breaks.
- **SEO compound effect** — template gallery pages accumulate backlinks and traffic over time. "[industry] cost calculator" keywords are evergreen.

---

## Technical Architecture (High Level)

### Builder (Dashboard)
- React SPA
- Visual drag-and-drop editor (likely using dnd-kit or similar)
- Formula engine: parsed/evaluated client-side with a sandboxed expression evaluator
- Preview pane: live rendering as you build

### Embeddable Widget
- Vanilla JS bundle (no framework dependency) — small footprint, loads fast
- Renders into a shadow DOM to avoid CSS conflicts with host site
- Communicates with QuoteCraft API for: submission logging, lead capture, analytics
- Works without API connectivity for the calculation itself (all math is client-side)
- `<script>` tag loads asynchronously and non-blocking

### Backend
- REST API for: user auth, calculator CRUD, submission storage, embed config
- PostgreSQL for structured data (calculators, submissions, users)
- CDN-served widget bundle (CloudFront or similar)
- Email service integration (SendGrid/Postmark) for lead notifications and PDF delivery

### SEO Infrastructure
- Static/SSR template gallery pages (Next.js or similar)
- Programmatic SEO: auto-generate landing pages from template metadata
- Schema.org markup on all public pages
- Sitemap generation for template pages

---

## Launch Strategy

### Phase 1: MVP (Build)
- Visual builder with core field types (text, email, phone, dropdown, number, slider, radio, checkbox)
- Formula engine with arithmetic + conditionals
- Single-step and multi-step layouts
- Embed via `<script>` tag
- Basic styling (color theme, font)
- "Powered by QuoteCraft" badge
- 10 pre-built templates for high-search-volume niches

### Phase 2: Growth (SEO + Virality)
- Template gallery with 50+ industry-specific calculators
- Blog targeting "[industry] cost calculator" keywords
- Submission log + email notifications (lead capture)
- Google Analytics integration (Pro tier)

### Phase 3: Monetization
- Pro tier: branding removal, PDF quotes, custom redirects
- Business tier: CRM integrations, A/B testing, analytics
- Agency tier: white-label, sub-accounts, API

### Phase 4: Expansion
- WordPress plugin
- Shopify app
- Zapier/Make native integration
- Embeddable as popup/slide-in
- Multi-language support

---

## Success Metrics

| Metric | Target (6 months post-launch) |
|--------|------------------------------|
| Free signups | 5,000 |
| Calculators created | 8,000 |
| Calculators actively embedded | 3,000 |
| Monthly widget impressions (across all embeds) | 500,000 |
| Template gallery organic traffic | 20,000 visits/mo |
| Pro conversions | 250 ($4,750 MRR) |
| Business conversions | 50 ($2,450 MRR) |
| Agency conversions | 10 ($990 MRR) |
| **Total MRR** | **~$8,190** |

---

## Competitive Summary

| | QuoteCraft | Outgrow | ConvertCalculator | Calconic | Elfsight |
|---|---|---|---|---|---|
| Free plan | Unlimited views/calcs | None | 100 views | 500 impressions | 200 views |
| Visual builder | Yes | Yes | Yes | Yes | Yes |
| Conditional logic | Yes | Yes (paid) | Yes | Limited | Limited |
| Multi-step | Yes | Yes | Yes | Yes | No |
| PDF quotes | Pro ($19) | Business ($720) | No | No | No |
| CRM integration | Business ($49) | Business ($720) | Growth ($49) | Premium ($39) | No |
| White-label | Agency ($99) | Not available | Enterprise | Not available | Not available |
| Branding removal | Pro ($19) | Essentials ($22) | Basic ($18) | Light ($5) | Basic ($6) |
| A/B testing | Business ($49) | Business ($720) | No | No | No |

The positioning is clear: QuoteCraft is the only tool where the free tier is actually usable for a real business. Everyone else uses the free tier as a bait-and-switch demo.
