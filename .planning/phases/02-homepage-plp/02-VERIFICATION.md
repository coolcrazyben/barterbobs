---
phase: 02-homepage-plp
verified: 2026-03-22T22:30:00Z
status: human_needed
score: 13/13 must-haves verified
human_verification:
  - test: "Open homepage in dev store at 1280px and confirm all 8 sections render in order: Hero, Curation Pillars, Category Browse, Featured Products, Brand Story, How It Works, Testimonials, CTA Banner — no blank or error sections"
    expected: "All 8 sections visible, matching Figma order, no Liquid errors"
    why_human: "Section rendering depends on live Shopify runtime; cannot verify template JSON wiring produces correct on-screen output without a browser"
  - test: "Inspect the hero <img> tag in DevTools and confirm loading='eager' and fetchpriority='high' attributes are present"
    expected: "Hero image tag has both attributes explicitly set"
    why_human: "Attribute presence in rendered HTML requires browser DevTools inspection"
  - test: "Verify Category Browse section: 2nd and 4th cards are visually offset ~3rem downward relative to 1st and 3rd (staggered grid design signature)"
    expected: "Asymmetric stagger visible at 1280px viewport"
    why_human: "CSS :nth-child(even) margin-top is present in code but visual correctness requires browser render"
  - test: "Open Shopify Theme Editor (Customize) — confirm all 8 homepage sections appear in the sidebar, edit a testimonial block text, and verify the change reflects in the preview"
    expected: "All 8 sections listed, block edits reflect instantly in preview"
    why_human: "Theme Editor integration requires live Shopify admin access"
  - test: "On the collection page at 375px: tap the Filters button, confirm the filter drawer slides up from the bottom, then tap X or Apply — confirm it closes"
    expected: "Mobile filter drawer animates in from bottom, closes correctly"
    why_human: "CSS transform animation and tap interaction require browser"
  - test: "Click Quick Add on a single-variant product on the collection page — confirm the cart count badge increments and the cart:open event fires (check console for [MainCollection] errors)"
    expected: "Cart badge increments, no console errors"
    why_human: "AJAX cart add requires a live Shopify storefront with real products"
  - test: "Click Quick Add on a multi-variant product — confirm a chip popover appears near the card, click a chip, click Add to Cart — verify cart badge increments and popover closes"
    expected: "Popover appears, chip selection works, add succeeds, popover closes"
    why_human: "Requires live store with multi-variant products"
---

# Phase 2: Homepage + PLP Verification Report

**Phase Goal:** Implement the homepage (8 sections) and Product Listing Page (PLP) with filter sidebar and Quick Add functionality.
**Verified:** 2026-03-22T22:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Homepage renders all 8 sections in Figma order via templates/index.json | VERIFIED | index.json `order` array: hero, curation-pillars, category-browse, featured-products, brand-story, how-it-works, testimonials, cta-banner (8 entries); all 8 section liquid files exist with full markup |
| 2 | Hero image uses loading='eager' and fetchpriority='high' | VERIFIED | section-hero.liquid line 35: `image_tag: ... loading: 'eager', fetchpriority: 'high'` — explicit attributes confirmed |
| 3 | Featured Products grid pulls from merchant-selected collection | VERIFIED | section-featured-products.liquid: `{%- assign featured_collection = section.settings.collection -%}` with `for product in featured_collection.products limit: 4` and `{% render 'product-card', product: product %}` |
| 4 | How It Works renders 3 numbered gradient-circle steps, all Theme Editor configurable | VERIFIED | section-how-it-works.liquid has `<ol class="steps-list">` block loop; component-how-it-works.css line 46: `.step-number { background: linear-gradient(135deg, var(--color-brand-primary), ...) }` — gradient circle confirmed; schema has step block type with step_number, step_headline, step_body |
| 5 | Testimonials renders star-rated quote cards with name and location via Theme Editor blocks | VERIFIED | section-testimonials.liquid has rating loop rendering `&#9733;`/`&#9734;` stars, blockquote, customer_name, location, avatar; schema has testimonial block type, max_blocks: 12 |
| 6 | Collection page renders a 4/2/1 responsive product grid | VERIFIED | component-collection.css: `repeat(4, 1fr)` at default, `repeat(2, 1fr)` at max-width 1023px, `1fr` at max-width 767px — all three breakpoints present |
| 7 | Product cards have hover scale 1.05x on image with 200ms ease transition | VERIFIED | component-product-card.css lines 33-39: `.product-card__image { transition: transform var(--transition-base) }` and `.product-card:hover .product-card__image { transform: scale(1.05) }` |
| 8 | Desktop filter sidebar with Categories, Dietary Prefs, and Price Range renders from collection.filters | VERIFIED | snippets/filter-groups.liquid iterates `collection.filters`, handles both `list` type (checkboxes) and `price_range` type (dual-thumb slider); rendered inside `.filter-sidebar` in main-collection.liquid |
| 9 | Mobile filter button opens slide-up drawer from bottom of viewport | VERIFIED | main-collection.liquid has `.mobile-filter-drawer` scaffold with `aria-hidden="true"`; component-collection.css: `.mobile-filter-drawer { position: fixed; bottom: 0; transform: translateY(100%) }` + `[aria-hidden="false"] { transform: translateY(0) }`; JS `openMobileFilter()` toggles aria-hidden |
| 10 | Filter selection narrows grid without full page reload (AJAX Section Rendering API) | VERIFIED | main-collection.liquid JS: `fetchFilteredGrid()` fetches `${url.pathname}?${url.searchParams}&sections=main-collection`, parses JSON response with DOMParser, replaces `.collection-grid` innerHTML — AbortController prevents race conditions |
| 11 | Quick Add on single-variant adds to cart via AJAX, updates CartCountBubble, emits cart:open | VERIFIED | main-collection.liquid `addToCart()`: POST to `/cart/add.js`, then GET `/cart.js`, then `window.BarterBobs.publish('cart:updated', { itemCount: cart.item_count })` + `window.BarterBobs.publish('cart:open', {})` |
| 12 | Quick Add on multi-variant product opens chip popover; selecting chip and clicking Add triggers same AJAX flow | VERIFIED | `handleQuickAdd()` branches on `variantsCount === 1` vs. multi; `openVariantPopover()` fetches `/products/${productId}.js`, renders `.variant-chip` buttons in popover, positions popover viewport-aware; chip click sets `_selectedVariantId`, popoverAddBtn calls `addToCart()` |
| 13 | snippets/product-card.liquid is the shared card — reused by both featured products and PLP | VERIFIED | section-featured-products.liquid uses `{% render 'product-card', product: product %}`; main-collection.liquid uses same render tag; snippet has complete image, badge, title, price, Quick Add button with data-product-id and data-variants-count |

**Score:** 13/13 truths verified

---

### Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `templates/index.json` | Homepage JSON template: all 8 sections in Figma order | VERIFIED | 128 lines; order array has all 8 section keys; block presets seeded |
| `sections/section-hero.liquid` | Hero with eager LCP image, CTA buttons, Theme Editor schema | VERIFIED | 89 lines; loading='eager', fetchpriority='high', full schema, conditional CTA render |
| `sections/section-curation-pillars.liquid` | Curation Pillars 3-block grid with Material Symbols | VERIFIED | 82 lines; Material Symbols span, block loop, full schema with pillar block type |
| `sections/section-category-browse.liquid` | Staggered 4-card portrait grid with hover scale | VERIFIED | 84 lines; 3:4 aspect-ratio, block loop, full schema with card block type |
| `sections/section-featured-products.liquid` | 4-col product grid from merchant-selected collection | VERIFIED | 72 lines; collection setting, product loop limit 4, render product-card, placeholder fallback |
| `sections/section-brand-story.liquid` | 2-col editorial with pull-quote and 2x2 image grid | VERIFIED | 90 lines; headline, richtext body, blockquote, loop over image_1..image_4 |
| `sections/section-how-it-works.liquid` | How It Works 3-step flow with gradient circles | VERIFIED | 80 lines; ol.steps-list block loop, step-number div, full schema |
| `sections/section-testimonials.liquid` | Testimonials star-rated quote cards | VERIFIED | 113 lines; star rating loop, blockquote, cite, avatar, full schema max_blocks:12 |
| `sections/section-cta-banner.liquid` | CTA Banner red rounded card with white CTA button | VERIFIED | 62 lines; .cta-banner__inner, btn--white, full schema |
| `snippets/product-card.liquid` | Shared product card with Quick Add data attributes | VERIFIED | 38 lines; image, badge, title, price, Quick Add button with data-product-id and data-variants-count |
| `templates/collection.json` | Collection template referencing main-collection section | VERIFIED | 9 lines; `"type": "main-collection"` — correct wiring |
| `sections/main-collection.liquid` | PLP section: grid, filter sidebar, mobile drawer, Quick Add, AJAX filter | VERIFIED | 309 lines; complete MainCollection web component; all four JS concerns implemented |
| `assets/component-collection.css` | PLP grid layout, filter sidebar, mobile drawer, chip styles | VERIFIED | 338 lines; all layout regions covered |
| `assets/component-hero.css` | Hero 2-col grid, headline, buttons | VERIFIED | 115 lines; full implementation |
| `assets/component-product-card.css` | Shared card styles including hover scale 1.05x | VERIFIED | 105 lines; full implementation |
| `assets/component-category-browse.css` | Staggered grid with :nth-child(even) offset | VERIFIED | 99 lines; `.category-card:nth-child(even) { margin-top: 3rem }` — stagger present |
| `assets/component-how-it-works.css` | 3-col steps, gradient circle step-number | VERIFIED | 85 lines; gradient background on .step-number confirmed |
| `assets/component-curation-pillars.css` | 3-col grid, responsive | VERIFIED | Exists with content |
| `assets/component-featured-products.css` | 4-col grid, responsive | VERIFIED | 50 lines |
| `assets/component-brand-story.css` | 2-col editorial, 2x2 image grid | VERIFIED | 93 lines |
| `assets/component-testimonials.css` | Flex-wrap cards, star colors | VERIFIED | 110 lines |
| `assets/component-cta-banner.css` | Red rounded inner, btn--white | VERIFIED | 61 lines |
| `snippets/filter-groups.liquid` | Filter markup for list and price_range types | VERIFIED | 73 lines; both filter types handled |
| `snippets/icon-filter.liquid` | Filter funnel SVG icon | VERIFIED | Exists in snippets/ |
| `locales/en.default.json` | products.quick_add and products.quick_add_label keys | VERIFIED | Keys confirmed: `{ "quick_add": "Quick add {{ title }}", "quick_add_label": "Quick Add" }` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `templates/index.json` | `sections/section-hero.liquid` (and all 8 sections) | JSON `"type": "section-hero"` reference | VERIFIED | All 8 type keys confirmed: section-hero, section-curation-pillars, section-category-browse, section-featured-products, section-brand-story, section-how-it-works, section-testimonials, section-cta-banner |
| `sections/section-featured-products.liquid` | `snippets/product-card.liquid` | `{% render 'product-card', product: product %}` | VERIFIED | Line 23: exact render call confirmed |
| `sections/section-hero.liquid` | `assets/component-hero.css` | `{{ 'component-hero.css' \| asset_url \| stylesheet_tag }}` | VERIFIED | Line 6 of section-hero.liquid |
| `templates/collection.json` | `sections/main-collection.liquid` | `"type": "main-collection"` | VERIFIED | collection.json line 4: `"type": "main-collection"` |
| `sections/main-collection.liquid` (Quick Add) | `/cart/add.js` | `fetch('/cart/add.js', { method: 'POST', ... })` in `addToCart()` | VERIFIED | main-collection.liquid line 272: `fetch('/cart/add.js', { method: 'POST', ... })` |
| `sections/main-collection.liquid` (QuickAdd) | `window.BarterBobs.publish('cart:updated', { itemCount })` | pubsub publish after AJAX success | VERIFIED | Line 279: `window.BarterBobs.publish('cart:updated', { itemCount: cart.item_count })` |
| `sections/main-collection.liquid` (QuickAdd) | `window.BarterBobs.publish('cart:open', {})` | pubsub after successful cart add | VERIFIED | Line 280: `window.BarterBobs.publish('cart:open', {})` |
| `sections/main-collection.liquid` (FilterSidebar) | `/?sections=main-collection` | Section Rendering API fetch with `sections=main-collection` param | VERIFIED | Line 159: `` `${url.pathname}?${url.searchParams.toString()}&sections=main-collection` `` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| HOME-01 | 02-01 | Hero section: display headline (Newsreader serif), subheadline (Inter), CTA buttons, hero image — all Theme Editor configurable | SATISFIED | section-hero.liquid has h1.hero__headline with font-family: var(--font-display), p.hero__subheadline, btn--primary and btn--outline CTAs, hero_image setting. Full schema confirmed. |
| HOME-02 | 02-01 | Hero image uses loading="eager" (not lazy) to avoid LCP penalty | SATISFIED | section-hero.liquid line 35 explicitly sets `loading: 'eager'` and `fetchpriority: 'high'` on image_tag call |
| HOME-03 | 02-01 | Featured products / bento grid sourcing from merchant-selected collection | SATISFIED | section-featured-products.liquid: collection schema setting, `featured_collection.products` loop, `{% render 'product-card' %}` |
| HOME-04 | 02-01 | How It Works: 3-step flow with numbered circles, Material Symbols icons, Theme Editor configurable | SATISFIED | section-how-it-works.liquid has ol.steps-list, .step-number gradient circle; schema has step block type with step_number, step_headline, step_body; gradient CSS confirmed in component-how-it-works.css |
| HOME-05 | 02-01 | Testimonials: quote cards with customer name, quote, star rating, optional avatar — multiple Theme Editor blocks | SATISFIED | section-testimonials.liquid has star loop, blockquote, cite, avatar image_tag; schema has testimonial block type, max_blocks: 12 |
| PLPX-01 | 02-02 | Collection page: responsive grid 4-col at 1280px, 2-col at 768px, 1-col at 375px | SATISFIED | component-collection.css: repeat(4,1fr) default, repeat(2,1fr) at max-width:1023px, 1fr at max-width:767px |
| PLPX-02 | 02-02 | Product card: hover scale 1.05x on image, rounded corners, tonal elevation | SATISFIED | component-product-card.css: transform: scale(1.05) on :hover, border-radius: var(--radius-md), box-shadow on :hover |
| PLPX-03 | 02-02 | Collection filtering: filter sidebar on desktop, collapsible on mobile — Search & Discovery app compatible | SATISFIED | snippets/filter-groups.liquid uses collection.filters (Shopify Search & Discovery API); desktop sidebar in main-collection.liquid; mobile drawer with slide-up animation; AJAX fetch updates grid without reload |
| PLPX-04 | 02-02 | Quick Add: AJAX add to cart, opens cart drawer without page navigation | SATISFIED | handleQuickAdd() handles single-variant direct add and multi-variant chip popover; addToCart() POSTs to /cart/add.js; publishes cart:updated and cart:open after success |

All 9 Phase 2 requirements (HOME-01 through HOME-05, PLPX-01 through PLPX-04) are SATISFIED by code evidence.

No orphaned requirements found — all 9 phase 2 requirement IDs appear in plan frontmatter (02-01 claims HOME-01..05, 02-02 claims PLPX-01..04). REQUIREMENTS.md traceability table marks all 9 as Phase 2, Complete.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| Multiple sections | Various | `placeholder_svg_tag` calls | Info | Legitimate Shopify-standard fallback when merchant has not yet uploaded images in Theme Editor. Expected pattern, not a stub. |

No TODO, FIXME, HACK, or implementation-deferred stubs found in any phase 2 file. All section files have complete HTML/Liquid markup and full Theme Editor schemas. All CSS files have complete styles. No return null / return {} / return [] stub patterns found in JS.

---

### Commit Verification

All four documented commits exist in git history:

| Commit | Message | Status |
|--------|---------|--------|
| `fa52bf0` | feat(02-01): section stubs, CSS files, product card snippet, and index.json update | FOUND |
| `48c5140` | feat(02-01): implement all 8 homepage sections and CSS | FOUND |
| `c33b6f4` | feat(02-homepage-plp-02): PLP collection.json, main-collection section, CSS grid | FOUND |
| `eabe139` | feat(02-homepage-plp-02): filter-groups snippet and MainCollection JS | FOUND |

---

### Human Verification Required

All automated checks pass. The following items require human verification in the Shopify dev store:

#### 1. Homepage Section Order and Visual Render

**Test:** Run `shopify theme dev`, open the homepage at 1280px viewport width.
**Expected:** All 8 sections render in order (Hero, Curation Pillars, Category Browse, Featured Products, Brand Story, How It Works, Testimonials, CTA Banner) with no blank sections or Liquid errors. Newsreader serif on headlines, Inter on body text, red brand color on CTAs.
**Why human:** Section rendering requires a live Shopify runtime to resolve JSON template → section file chain.

#### 2. Hero Image LCP Attributes

**Test:** Inspect the hero `<img>` tag in DevTools.
**Expected:** `loading="eager"` and `fetchpriority="high"` attributes are present on the rendered img element.
**Why human:** Image tag attribute rendering must be confirmed in the browser's Element inspector.

#### 3. Category Browse Staggered Grid

**Test:** View Category Browse section at 1280px viewport.
**Expected:** 2nd and 4th cards are visually offset ~3rem downward relative to 1st and 3rd cards — asymmetric stagger visible.
**Why human:** CSS :nth-child(even) layout correctness requires visual confirmation in a browser.

#### 4. Theme Editor Integration

**Test:** Open Shopify Theme Editor (Customize), navigate to the homepage.
**Expected:** All 8 sections appear in the sidebar. Add a testimonial block, edit the hero headline — changes reflect in the preview.
**Why human:** Theme Editor integration requires live Shopify admin access.

#### 5. Mobile Filter Drawer

**Test:** Open the collection page at 375px viewport, tap Filters button.
**Expected:** Filter drawer slides up from the bottom. Tapping X or Apply Filters closes the drawer with correct animation. Escape key also closes the drawer.
**Why human:** CSS transform animation and touch interaction require a browser.

#### 6. Quick Add Single-Variant AJAX Flow

**Test:** Click Quick Add on a single-variant product on the collection page.
**Expected:** Cart count badge in header increments immediately. No console errors. Network tab shows POST to /cart/add.js (not a page navigation).
**Why human:** Requires a live Shopify storefront with real products in a collection.

#### 7. Quick Add Multi-Variant Chip Popover

**Test:** Click Quick Add on a multi-variant product. Select a variant chip. Click Add to Cart.
**Expected:** Chip popover appears anchored near the card. Selected chip highlights. Cart badge increments. Popover closes after successful add.
**Why human:** Requires live store with multi-variant products; popover positioning is viewport-aware and requires real browser geometry.

---

### Gaps Summary

No automated gaps found. All 13 must-have truths verified from code. All 9 requirements have implementation evidence. All 25 artifacts exist with substantive content and correct wiring. No stub patterns detected.

The 7 human verification items are standard live-store checks for animation, visual layout, and AJAX behavior — none are blockers that indicate missing code. The code for all these behaviors is present and complete; human verification confirms they function end-to-end in the Shopify runtime.

---

_Verified: 2026-03-22T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
