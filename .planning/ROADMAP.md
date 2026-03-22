# Roadmap: BarterBobs Shopify Theme

## Overview

Build a production-ready custom Shopify OS 2.0 theme from Figma design exports in four phases. Phase 1 lays the architecture foundation — no feature code until the token system, global JS, and navigation shell are proven. Phase 2 delivers the browsable storefront surface (homepage + PLP). Phase 3 builds the two highest-complexity interactive features (PDP subscription selector + cart drawer) that together complete the purchase flow. Phase 4 finishes the remaining templates and hardens the theme for delivery. Every phase delivers something a merchant can open in a browser and evaluate against the Figma source.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Shopify OS 2.0 scaffold, design tokens, global JS, and navigation shell (completed 2026-03-22)
- [ ] **Phase 2: Homepage + PLP** - Editorial homepage sections and browsable product listing page
- [ ] **Phase 3: PDP + Cart** - Subscription frequency selector, variant picker, and AJAX cart drawer
- [ ] **Phase 4: Static Pages + Polish** - Remaining templates, accessibility, and theme check clean pass

## Phase Details

### Phase 1: Foundation
**Goal**: A deployable Shopify OS 2.0 theme skeleton exists with design tokens, global JS infrastructure, and a functional navigation shell — no feature sections yet, but the theme opens in a browser, passes `shopify theme check`, and every downstream section will have a correct, safe foundation to build on
**Depends on**: Nothing (first phase)
**Requirements**: FNDX-01, FNDX-02, FNDX-03, FNDX-04, FNDX-05, FNDX-06, NAVX-01, NAVX-02, NAVX-03, NAVX-04
**Success Criteria** (what must be TRUE):
  1. Opening the theme in a Shopify dev store renders a page with the glassmorphism sticky header, footer, and brand color palette — the visual identity is present before any content sections are added
  2. Clicking the cart icon in the header shows the dynamic item count badge; opening the Shopify Theme Editor shows header and footer settings are configurable
  3. Resizing the browser to 375px collapses the header to a hamburger icon that opens a full-height off-canvas drawer
  4. Running `shopify theme check` returns zero errors and zero warnings on the skeleton theme
  5. The `.shopifyignore` file prevents `config/settings_data.json` from being overwritten on `shopify theme push`
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Dev environment, project scaffold, settings schema, and CSS custom properties
- [ ] 01-02-PLAN.md — Global JS infrastructure (ShopifySection base class, pub/sub, CartCountBubble) and theme.liquid shell
- [ ] 01-03-PLAN.md — Header section (glassmorphism nav, cart badge, mobile hamburger drawer) and footer section

### Phase 2: Homepage + PLP
**Goal**: A shopper can land on the homepage and browse the full product catalog — every section matches the Figma exports, content is configurable in the Theme Editor, and the product grid supports Quick Add
**Depends on**: Phase 1
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, PLPX-01, PLPX-02, PLPX-03, PLPX-04
**Success Criteria** (what must be TRUE):
  1. The homepage renders all 8 sections (Hero, Curation Pillars, Category Browse, Featured Products, Brand Story, How It Works, Testimonials, CTA Banner) matching the barterbobs_main_landing_page Figma export — all fields are editable in the Theme Editor
  2. The hero image loads with `loading="eager"` (not lazy) and Lighthouse reports no LCP penalty from the hero
  3. The collection page renders a 4-column grid at 1280px, 2-column at 768px, and 1-column at 375px with product cards that have hover scale on images
  4. Clicking Quick Add on a product card adds the item to the cart via AJAX without leaving the collection page, and the cart item count badge in the header updates immediately
  5. The collection sidebar displays filter options from the Shopify Search and Discovery app; selecting a filter narrows the product grid without a full page reload
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — All 8 homepage sections (Hero, Curation Pillars, Category Browse, Featured Products, Brand Story, How It Works, Testimonials, CTA Banner) and shared product-card snippet
- [ ] 02-02-PLAN.md — PLP collection page with responsive grid, filter sidebar (desktop + mobile drawer), and Quick Add with variant picker

### Phase 3: PDP + Cart
**Goal**: A shopper can view a product, select a subscription frequency, add it to the cart via AJAX, and manage their cart in a drawer — the complete purchase flow works end-to-end without a page reload
**Depends on**: Phase 2
**Requirements**: PDPX-01, PDPX-02, PDPX-03, PDPX-04, PDPX-05, PDPX-06, CART-01, CART-02, CART-03, CART-04, CART-05, CART-06
**Success Criteria** (what must be TRUE):
  1. The PDP renders the hero product image with hover scale and a variant selector; selecting a different variant updates the price display and available selling plans without a page reload
  2. The subscription frequency selector shows radio inputs for one-time purchase and all available frequencies (weekly/biweekly/monthly); selecting a plan updates the hidden `selling_plan` input and a Network tab inspection confirms the correct selling plan ID is submitted with the cart POST
  3. Clicking Add to Cart on the PDP adds the item (with the selected selling plan) via AJAX and opens the cart drawer — no page redirect occurs
  4. The cart drawer shows each line item with product image, title, variant, quantity controls, and line price; subscription items show their delivery frequency beneath the product title
  5. The cart drawer is keyboard-accessible: Tab navigates all controls, Escape closes the drawer and returns focus to the trigger element, and focus cannot escape the drawer while it is open
**Plans**: TBD

Plans:
- [ ] 03-01: Cart drawer (AJAX, Section Rendering API, accessibility, race condition prevention)
- [ ] 03-02: PDP main section (hero image, variant picker, subscription frequency selector, ATC form)
- [ ] 03-03: Related products row and cart integration end-to-end verification

### Phase 4: Static Pages + Polish
**Goal**: All remaining page templates exist with brand styling, and the complete theme passes `shopify theme check` with zero errors and zero warnings, meets Core Web Vitals targets on mobile, and is verified accessible via keyboard navigation
**Depends on**: Phase 3
**Requirements**: PAGE-01, PAGE-02
**Success Criteria** (what must be TRUE):
  1. Navigating to a static page (About) renders merchant-editable rich text content in the brand's editorial style via the Theme Editor
  2. Navigating to a non-existent URL renders a custom 404 page with brand styling and navigation links back to the homepage and collection
  3. Running `shopify theme check` on the complete theme returns zero errors and zero warnings
  4. Lighthouse mobile audit reports LCP under 2.5s and CLS under 0.1 on the homepage and PDP
**Plans**: TBD

Plans:
- [ ] 04-01: Static page templates (page.json, 404.json) and final theme check + mobile QA pass

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete   | 2026-03-22 |
| 2. Homepage + PLP | 1/2 | In Progress|  |
| 3. PDP + Cart | 0/3 | Not started | - |
| 4. Static Pages + Polish | 0/1 | Not started | - |
