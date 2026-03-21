# Project Research Summary

**Project:** BarterBobs Shopify OS 2.0 Custom Theme
**Domain:** Subscription grocery delivery — premium editorial brand
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

BarterBobs is a custom Shopify Online Store 2.0 theme for a subscription-based premium grocery delivery service. The theme is built from scratch — not from a base theme — using Liquid, vanilla JavaScript (Web Components), CSS Custom Properties, and no build pipeline. Shopify CLI 3.92.x is the sole toolchain. Dawn v15.4.1 is used as a structural reference only; BarterBobs' editorial aesthetic (asymmetric layouts, glassmorphism nav, grain textures, Newsreader serif display) makes a Dawn-derived codebase impractical. The entire deployment pipeline is `shopify theme push`.

The most critical technical complexity is the subscription layer. Every feature that touches recurring delivery — the PDP frequency selector, cart line item display, cart summary panel, and add-to-cart form submission — depends on a Shopify selling plan app being installed (Shopify Subscriptions native, Recharge, or Skio) and configured before theme development can be fully tested. The theme provides the UI; the app provides the billing infrastructure. This dependency must be resolved before PDP work begins. The architecture follows a strict 7-layer dependency chain: settings schema and CSS tokens must exist before sections, sections before templates, and global JS infrastructure before interactive components.

The five most dangerous pitfalls — LCP hero lazy-loading, JS not re-initializing after Theme Editor section loads, the missing `selling_plan` hidden input, cart drawer AJAX race conditions, and `settings_data.json` being overwritten on deploy — are all well-documented, entirely preventable, and catastrophic if discovered late. All five must be addressed as foundation standards in Phase 1 before any feature section is coded. The good news: every aspect of this build uses exclusively official Shopify APIs and patterns that are stable, well-documented, and battle-tested in production themes.

## Key Findings

### Recommended Stack

The stack is deliberately minimal. Shopify CLI 3.92.x handles all development operations: hot-reload (`shopify theme dev`), linting (`shopify theme check`), and deployment (`shopify theme push`). There is no build pipeline — Shopify's CDN serves assets directly, CSS Custom Properties handle all dynamic theming from Theme Editor settings, and Vanilla JS ES modules load as `type="module"` without transpilation. Two dev dependencies only: Prettier with `@shopify/prettier-plugin-liquid` for consistent formatting, and the Shopify Liquid VS Code extension for IntelliSense. Node.js 20.x LTS is required to run Shopify CLI.

**Core technologies:**
- **Shopify CLI 3.92.x**: Dev server, linting, deployment — the only toolchain needed; no alternatives exist for OS 2.0
- **Liquid (current Shopify platform)**: Server-side templating — mandatory, no substitutes within Shopify theme runtime
- **Vanilla JS (ES2020+) with Web Components**: Interactive UI following Dawn's architecture — zero bundle cost, scope isolation, native browser API
- **CSS Custom Properties**: Design token system — bridges Liquid/Theme Editor settings into CSS without any JS; single source of truth for colors, fonts, spacing
- **Node.js 20.x LTS**: Required CLI runtime; minimum 18.20

**What to explicitly avoid:** jQuery, Tailwind CSS (in theme), React/Vue, Webpack/Vite, `{% include %}` tag, `.js.liquid`/`.css.liquid` assets, global `window.*` variables, `loading="lazy"` on hero images.

### Expected Features

The PDP subscription frequency selector and cart drawer are the two highest-complexity, highest-value features. Everything else follows established patterns with well-documented implementations.

**Must have — table stakes (launch blockers):**
- Glassmorphism sticky nav with cart icon, search, mobile hamburger
- Cart drawer (AJAX, Section Rendering API, selling plan name display)
- Subscription frequency selector on PDP (radio inputs for 3 options: weekly/biweekly/monthly)
- Product card grid with Quick Add (PLP)
- Collection sidebar filters (Shopify Search & Discovery app — free, zero-cost dependency)
- Homepage: hero, category browsing, How It Works, brand story, testimonials, CTA sections
- PDP: single hero image, subscription selector, Bob's Recommendation editorial card, Related Favorites
- Cart subscription summary panel + cart upsell grid
- Mobile-first responsive at 375/768/1280px
- Full OS 2.0 Theme Editor customizability for all sections
- Lazy loading (non-LCP), `image_tag` srcset, `fetchpriority="high"` on hero

**Should have — differentiators (add post-launch):**
- Predictive search flyout (v1.x — after catalog is indexed and search behavior validated)
- Cart upsell with algorithmic Shopify recommendations API (v1.x — needs order history)
- Schema markup JSON-LD for Product and BreadcrumbList (v1.x — SEO, add after core is stable)
- Announcement bar marquee scroll animation (v1.x — polish, not conversion-critical)

**Defer — v2+:**
- Dark mode — doubles CSS surface area; no design requirement; demand unconfirmed
- Blog/editorial recipes — high content-marketing value for food brand; explicitly out of PROJECT.md scope
- Customer subscription portal (manage/skip/cancel) — owned by subscription app, not the theme
- Wishlist / Save for Later — requires customer accounts; adds JS complexity for low return
- Loyalty perks UI — requires app integration

**Hard anti-features — never build:**
- Multi-image product gallery — design specifies single hero image; grocery products do not need a carousel
- Product image zoom — CSS `transform: scale(1.05)` hover is sufficient for grocery
- Infinite scroll — breaks back-button, analytics, and footer; use load-more button
- Third-party search app (Boost, Searchanise) — BarterBobs catalog is ~124 items; native Search & Discovery is sufficient

### Architecture Approach

The architecture follows the canonical OS 2.0 pattern: a single `layout/theme.liquid` HTML shell wraps section groups (header, footer) and `{{ content_for_layout }}` populated by JSON templates. Every page type is a JSON template that references only section types by name — all markup lives in section files. Snippets are reusable Liquid fragments called exclusively via `{% render %}` with explicit parameter passing. JavaScript is exclusively Web Components (`customElements.define`) communicating via native `CustomEvent` dispatch on `document` — no framework, no shared global state, no cross-component imports.

**Major components and responsibilities:**

1. **`layout/theme.liquid`** — HTML shell; loads base.css, global.js (deferred), outputs CSS custom property tokens; references section groups
2. **`sections/header-group.json` + `sections/header.liquid`** — glassmorphism sticky nav; triggers cart drawer and mobile nav via custom events
3. **`sections/cart-drawer.liquid` + `assets/cart-drawer.js`** — AJAX cart with Section Rendering API re-render; ARIA dialog; iOS scroll lock; request queue to prevent race conditions
4. **`sections/main-product.liquid` + `assets/variant-selects.js` + `assets/subscription-form.js`** — PDP with variant picker, frequency selector, and ATC form; most complex section by dependency count
5. **`sections/main-collection.liquid` + `snippets/product-card.liquid`** — PLP grid with Quick Add, sidebar filters via `collection.filters` (Search & Discovery)
6. **`assets/global.js`** — Web component base classes, pub/sub helper, trapFocus utility; loaded before all interactive components
7. **`config/settings_schema.json` + `snippets/css-variables.liquid`** — theme-wide design token definitions and output; foundation for all CSS custom properties

**Key architectural patterns:** JSON template + dedicated main section per page type; section groups for header/footer via `{% sections %}` plural tag; component CSS in `{% stylesheet %}` tags (not monolithic files); variant data serialized to JS at page load via `{{ product.variants | json }}`; cart state updated exclusively via Section Rendering API (never stale Liquid re-reads).

### Critical Pitfalls

1. **LCP hero lazy-loading** — Applying `loading="lazy"` to the hero image causes Lighthouse LCP failures (> 2.5s). Use `section.index <= 2` conditional to apply `loading="eager"` + `fetchpriority="high"` on above-fold sections. Establish this as a code standard in Phase 1 before any section images are coded.

2. **JS not re-initializing after Theme Editor section load** — JavaScript tied to `DOMContentLoaded` breaks silently when merchants add/remove/reorder sections in the Theme Editor. Every interactive section must register `document.addEventListener('shopify:section:load', ...)` re-init handlers. Establish as an architecture standard in Phase 1.

3. **Missing `selling_plan` hidden input** — The subscription frequency selector renders visually but items silently add as one-time purchases if `<input type="hidden" name="selling_plan" value="">` is absent from the product form, or if JS does not update its value on every selection change. Verify with Network tab inspection on every PDP build.

4. **Cart drawer AJAX race conditions** — Rapid quantity changes fire concurrent `POST /cart/change.js` calls; responses arrive out of order, corrupting cart state. Use `AbortController` to cancel in-flight requests and bundle section re-render into the same response as the mutation.

5. **`settings_data.json` overwritten on deploy** — `shopify theme push` overwrites the live store's merchant-configured content with the developer's local copy. Add `config/settings_data.json` to `.shopifyignore` during Phase 1 dev tooling setup. Recovery requires Shopify's version history.

## Implications for Roadmap

Architecture research explicitly documents a 7-layer dependency chain. This constrains phase ordering: nothing can render without the foundation layer, and the most complex sections (PDP) must be built last among sections. The phase structure below follows these hard dependencies.

### Phase 1: Foundation and Dev Environment

**Rationale:** The 7-layer architecture has strict ordering — CSS tokens, layout shell, section groups, and global JS must exist before any section or template can render. Five pitfalls (LCP image loading, Theme Editor re-init, deprecated filter linting, glassmorphism nav compatibility, `settings_data.json` protection) must be standards before a single feature section is coded. Getting this wrong cascades into every subsequent phase.

**Delivers:** A deployable theme skeleton — navigable, themeable, lintable — with no feature sections yet. Standards for image loading, JS architecture, and deployment safety established.

**Addresses:** Dev tooling setup (Shopify CLI, Prettier, `.shopifyignore`), `settings_schema.json` (design tokens), `base.css` (CSS custom properties), `theme.liquid` (HTML shell), header section (glassmorphism nav, mobile hamburger), footer section, section groups, `global.js` (web component base + pub/sub), `en.default.json` locales.

**Avoids:** LCP lazy-load pitfall (establish `section.index` pattern), Theme Editor re-init pitfall (establish `shopify:section:load` standard), deprecated `img_url` filter (establish `shopify theme check` in pre-commit), glassmorphism `-webkit-backdrop-filter` (implement correctly on first build), `settings_data.json` overwrite (`.shopifyignore` before any content is configured).

**Research flag:** Standard patterns — no phase research needed. Shopify CLI, section groups, and CSS custom property patterns are thoroughly documented in official sources with HIGH confidence.

---

### Phase 2: Homepage Sections

**Rationale:** Homepage sections have zero external app dependencies (no selling plan app needed) and represent the brand's editorial identity. They are the best vehicle for proving out the section schema, CSS custom property, and Theme Editor customizability patterns before touching complex interactive components.

**Delivers:** Fully functioning, Theme Editor-configurable homepage with hero, category browsing, How It Works, brand story, testimonials, and CTA sections.

**Addresses:** `section-hero.liquid` (asymmetric bento layout, `section.index`-based eager loading), `section-category-grid.liquid` (visual category browsing with staggered offsets), `section-how-it-works.liquid` (3-step numbered columns), `section-brand-story.liquid` (2-col editorial + 2x2 image grid), `section-testimonials.liquid`, `section-cta.liquid`, `section-announcement-bar.liquid`. All sections require complete schema (image pickers, text fields, color pickers, CTAs) per Theme Editor completeness requirement.

**Avoids:** Section schema gaps pitfall — every section built in this phase must pass the "no hardcoded values" checklist before merge.

**Research flag:** Standard patterns — editorial section schema and CSS layouts are well-documented in official Shopify docs.

---

### Phase 3: Product Listing Page (PLP)

**Rationale:** PLP requires the `product-card.liquid` snippet and collection filter infrastructure that PDP and cart also depend on. Building PLP before PDP forces the reusable snippet to be built correctly (isolated scope, explicit parameters) before it is inherited by the most complex section.

**Delivers:** Browsable collection page with editorial product grid, Quick Add buttons (opens cart drawer stub), sidebar filters, product badges, and load-more pagination.

**Addresses:** `snippets/product-card.liquid` (with badge logic via product tags), `snippets/price.liquid`, `main-collection.liquid` (grid, pagination), Quick Add AJAX (requires cart drawer stub from Phase 4 — may need to coordinate), `collection.filters` (requires Shopify Search & Discovery app installed in dev store).

**Dependency note:** Quick Add must open the cart drawer. If cart drawer is not yet implemented, Quick Add can add to cart and show a success toast as a temporary stub. Cart drawer Phase 4 then fully integrates it. Coordinate with development schedule.

**Avoids:** Snippet scope leakage — product-card uses `{% render %}` with explicit parameters only. Image dimensions on all product card images (explicit `width`/`height` attributes) for CLS prevention.

**Research flag:** Standard patterns — Shopify collection loops, filter API, and product-card conventions are thoroughly documented.

---

### Phase 4: Cart Drawer

**Rationale:** Cart drawer is a cross-cutting concern that Quick Add (Phase 3) and the full PDP ATC flow (Phase 5) both depend on. Building it as a dedicated phase ensures the AJAX infrastructure, Section Rendering API integration, ARIA accessibility, iOS scroll lock, and race condition prevention are complete before any other features try to use it.

**Delivers:** Fully functional, accessible cart drawer — AJAX add/update/remove, Section Rendering API re-render, selling plan name on line items, cart subscription summary panel, cart upsell grid, ARIA dialog semantics, iOS scroll lock, keyboard navigation, focus trap.

**Addresses:** `sections/cart-drawer.liquid`, `assets/cart-drawer.js`, `snippets/cart-line-item.liquid`, cart subscription summary panel, cart upsell placeholder grid, header cart count badge (`cart:updated` CustomEvent).

**Avoids:** AJAX race conditions pitfall (AbortController + request queue from day one), cart drawer accessibility pitfall (`role="dialog"`, `aria-modal`, focus trap, Escape handler, `aria-live` announcements), iOS scroll lock pitfall (`position: fixed` body scroll preservation pattern).

**Research flag:** Needs attention — Dawn's Section Rendering API cart pattern is documented but implementation details (bundled section render in mutation response, locale-aware URL routing) require careful reference to Dawn source. Consider a Phase 4 research-phase pass on cart AJAX patterns before implementation.

---

### Phase 5: Product Detail Page (PDP)

**Rationale:** PDP is the most complex section by dependency count — it requires price snippet, product-media snippet, variant-picker snippet, subscription-selector snippet, variant-selects.js, and subscription-form.js, plus a working cart drawer (Phase 4) for ATC to deliver to. Building it last among core pages ensures all dependencies are stable.

**Delivers:** Complete PDP: single hero image with hover scale, subscription frequency selector (radio inputs, `selling_plan` hidden input with JS sync, savings % display), variant selection with URL sync, Add to Box ATC, Bob's Recommendation editorial card, "Pantry Story" description + ingredient grid, Related Favorites 4-up grid.

**Addresses:** `sections/main-product.liquid`, `snippets/subscription-selector.liquid`, `snippets/variant-picker.liquid`, `snippets/product-media.liquid`, `snippets/quantity-input.liquid`, `assets/variant-selects.js`, `assets/subscription-form.js`, `templates/product.json`.

**Dependency:** Shopify Subscriptions app (or Recharge/Bold) must be installed and configured in the dev store with at least one product having selling plans configured before subscription selector development can be verified.

**Avoids:** Missing `selling_plan` hidden input pitfall (verified via Network tab on every test), subscription UX anti-patterns pitfall (radio inputs not buttons, one-time pre-selected by default, percentage savings not dollar amounts), variant data serialization pitfall (all variant data via `{{ product.variants | json }}` at page load).

**Research flag:** Needs research-phase pass — subscription selling plan Liquid objects (`selling_plan_group`, `selling_plan_allocation`) and the interaction between variant selection and plan availability are complex enough to warrant a focused research session before coding the selector component.

---

### Phase 6: Static Pages, Search, and Account Templates

**Rationale:** Remaining templates (About, 404, Search, Account) are low complexity with no cross-feature dependencies. Building them after all interactive pages ensures shared snippets (product-card, price) are stable and the JSON template pattern is established.

**Delivers:** `templates/page.json` + `sections/main-page.liquid` (About page), `templates/404.json` + `sections/main-404.liquid`, `templates/search.json` + `sections/main-search.liquid`, `templates/customers/` (account, login, register), `templates/cart.json` (fallback cart page).

**Addresses:** Static semantic HTML with proper ARIA, 404 recovery UX, basic account flows, search results page as prerequisite for predictive search (v1.x).

**Research flag:** Standard patterns — no research needed. These templates follow the same JSON template + main section convention established in prior phases.

---

### Phase 7: Polish, Performance, and Launch Hardening

**Rationale:** Cross-cutting concerns that require all sections to exist before they can be verified — Core Web Vitals audit, accessibility audit across all interactive components, `shopify theme check` zero-error verification, `.shopifyignore` deployment confirmation, and font loading optimization.

**Delivers:** Production-ready theme passing `shopify theme check` (zero errors, zero warnings), Lighthouse mobile LCP < 2.5s, CLS < 0.1, keyboard-only navigation verified on cart drawer and subscription selector, all Figma-to-Liquid deprecated code eliminated, font preconnect and weight optimization.

**Addresses:** PageSpeed Insights audit and remediation, the "Looks Done But Isn't" checklist from PITFALLS.md in full, `settings_data.json` in `.shopifyignore` verification, iOS Safari glassmorphism nav test, physical device scroll jank test, VoiceOver/NVDA keyboard nav audit.

**Research flag:** Standard patterns — performance and accessibility verification follows documented Shopify best practices.

---

### Phase Ordering Rationale

- **Foundation before everything** — Architecture's 7-layer dependency chain makes this non-negotiable. CSS tokens must exist before sections can render; global.js must exist before interactive components work.
- **Homepage before PLP before PDP** — Increasing complexity order. Homepage has zero external dependencies. PLP produces the product-card snippet PDP needs. PDP is built last because it has the highest dependency count.
- **Cart Drawer as a standalone phase** — Cart drawer is consumed by Quick Add (PLP) and PDP ATC. Treating it as a dedicated phase prevents both consumers from building on unstable infrastructure.
- **Static pages last** — No other feature depends on About/404/Search. Deferring them avoids distraction and allows the JSON template pattern to be proved before applying it to lower-stakes pages.
- **Polish phase as its own phase** — Performance and accessibility verification cannot be done incrementally. It requires the full theme to exist. Forcing it as a phase prevents it from being skipped under time pressure.

### Research Flags

**Phases needing deeper research before implementation:**

- **Phase 4 (Cart Drawer):** Section Rendering API bundled mutation + re-render pattern, AbortController request queue implementation, and iOS Safari `position: fixed` scroll lock edge cases are worth a focused research pass. Dawn's `cart-drawer.js` source is the primary reference.
- **Phase 5 (PDP — Subscription):** Selling plan group Liquid objects, `selling_plan_allocation` conditional pricing, and the JS bridge between variant selection and available plan options are sufficiently complex to warrant pre-implementation research. Shopify's official "Add subscriptions to your theme" guide plus a test store with plans configured is required.

**Phases with standard, well-documented patterns (skip research-phase):**

- **Phase 1 (Foundation):** Shopify CLI, section groups, CSS custom properties, and `.shopifyignore` are all in official HIGH-confidence documentation.
- **Phase 2 (Homepage):** OS 2.0 section schema, image loading, and Theme Editor patterns are thoroughly covered.
- **Phase 3 (PLP):** Collection loops, product-card snippets, `collection.filters` with Search & Discovery, and Quick Add AJAX follow Dawn's patterns exactly.
- **Phase 6 (Static pages):** Lowest complexity phase; JSON template + section convention is established by Phase 2.
- **Phase 7 (Polish):** Shopify performance and accessibility docs are comprehensive.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All stack decisions sourced from official Shopify docs and verified GitHub releases. Shopify CLI 3.92.1 current as of March 2026. Dawn v15.4.1 confirmed. No experimental or community-only tools. |
| Features | HIGH | Design exports analyzed directly (primary source). Shopify subscription UX guidelines verified from official docs. Feature scope confirmed against PROJECT.md. |
| Architecture | HIGH | Sourced exclusively from shopify.dev official docs and Dawn reference theme (both HIGH confidence). 7-layer build order derived directly from documented dependency model. |
| Pitfalls | HIGH | 9 of 10 critical pitfalls sourced from official Shopify docs or documented CLI issues. Three community sources (MEDIUM) independently verified against official docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **Subscription app selection:** Which subscription app (Shopify Subscriptions native vs. Recharge vs. Skio vs. Bold) is installed determines which Liquid objects are available and whether "Next Delivery" date is surfaceable in the cart. The research treats this as a resolved dependency but the specific app must be confirmed before Phase 5 begins. If Shopify Subscriptions native is used, "Next Delivery" date may not be available via Liquid — fallback to "Your frequency: [plan name]" is documented in FEATURES.md.

- **Selling plan test data:** The subscription frequency selector cannot be functionally verified without a test store that has a subscription app installed and at least one product configured with selling plans. This is a dev environment prerequisite, not a theme code issue, but it must be confirmed before Phase 5 sprint planning.

- **Font sourcing — Newsreader and Inter:** ARCHITECTURE.md notes Newsreader (serif display) and Inter as brand fonts loaded via Google Fonts / Shopify Font Library. The exact weights to load (FEATURES.md competitor analysis mentions "Newsreader 400/600/700 italic, Inter 400/500") and whether to use Google Fonts or the Shopify font picker are not locked in. This should be resolved in Phase 1 when `settings_schema.json` is written. PITFALLS.md documents the Google Fonts preconnect requirement.

- **`collection.filters` product tag taxonomy:** Dietary preference filters (Gluten-Free, Vegan, Organic Only) require product tags or metafields to be set up consistently in the Shopify admin before collection filters work. This is a merchant data task, not a theme task, but it blocks Phase 3 filter development verification.

## Sources

### Primary (HIGH confidence)

- Shopify CLI Releases (GitHub) — version 3.92.1 confirmed current March 2026
- Shopify CLI official docs (shopify.dev) — Node requirements, installation, dev/push/pull commands
- Dawn v15.4.1 releases (GitHub) — section schema conventions, web component architecture patterns
- Shopify theme architecture docs (shopify.dev) — directory structure, JSON templates, section groups, section limits
- Shopify Liquid render tag docs — render vs. include scope isolation
- Shopify subscription UX guidelines (shopify.dev) — radio inputs, pre-selection, savings display requirements
- Add subscriptions to theme docs (shopify.dev) — selling plan Liquid objects, hidden form input pattern
- Shopify Cart AJAX API reference (shopify.dev) — endpoints, locale routing
- Shopify Section Rendering API docs (shopify.dev) — bundled section re-render, 5-section limit
- Shopify theme performance best practices (shopify.dev) — LCP, CLS, font loading
- Shopify accessibility best practices (shopify.dev) — ARIA dialog, focus management
- Shopify theme check docs (shopify.dev) — linting rules, DeprecatedFilter, ImgLazyLoading
- Shopify CLI issue #2467 (GitHub) — `settings_data.json` overwrite on push
- BarterBobs design exports (`stitch_barterbobs_landing_page/`) — authoritative design source

### Secondary (MEDIUM confidence)

- Shopify community: cart AJAX race conditions — verified against official AJAX API docs
- Dawn GitHub issue #1660 — iOS cart drawer background scroll (pattern verified against WCAG)
- nickdrishinski.com: Dawn Section Rendering API cart pattern — verified against official docs
- EcomIdeas: `section.index` LCP fix — verified against shopify.dev performance blog
- loopwork.co: Best Shopify themes for subscription boxes — competitor feature analysis

### Tertiary (LOW confidence)

- Shopify community: Tailwind in themes — consensus view; no single authoritative source; recommendation (avoid Tailwind in OS 2.0 themes) is consistent with official buildless workflow guidance

---

*Research completed: 2026-03-20*
*Ready for roadmap: yes*
