---
phase: 02-homepage-plp
plan: 01
subsystem: ui
tags: [shopify, liquid, css-custom-properties, homepage, sections, product-card, shopify-sections, os2]

# Dependency graph
requires:
  - phase: 01-foundation/01-01
    provides: snippets/css-variables.liquid (design tokens), locales/en.default.json (translation strings)
  - phase: 01-foundation/01-02
    provides: layout/theme.liquid (content_for_layout renders section JSON templates), assets/global.js (ShopifySection base class, pub/sub)
  - phase: 01-foundation/01-03
    provides: sections/header.liquid and footer.liquid (shell complete), .theme-check.yml (RemoteAsset/AssetPreload disabled)

provides:
  - templates/index.json — homepage JSON template referencing all 8 sections in Figma order
  - sections/section-hero.liquid — Hero with eager-loaded LCP image, CTA buttons, Theme Editor schema
  - sections/section-curation-pillars.liquid — 3-block pillar grid with Material Symbol icons
  - sections/section-category-browse.liquid — staggered 4-card portrait grid (even cards offset 3rem)
  - sections/section-featured-products.liquid — 4-col product grid from merchant-selected collection
  - sections/section-brand-story.liquid — 2-col editorial with pull-quote and 2x2 image grid
  - sections/section-how-it-works.liquid — 3-step flow with numbered gradient circles
  - sections/section-testimonials.liquid — star-rated quote cards, flex-wrap layout
  - sections/section-cta-banner.liquid — full-width rounded red card with white CTA button
  - snippets/product-card.liquid — shared product card with Quick Add data attributes (reused by PLP)
  - 9 CSS component files using CSS custom properties only

affects:
  - Plan 02-02 (PLP) — snippets/product-card.liquid shared directly; product-card CSS applies to collection grid
  - Phase 3 (Cart) — product-card Quick Add button dispatches cart:updated via data attributes; section JS in Plan 02-02

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "image_tag filter with named params does not support | escape inline in multi-line form — assign escaped alt to variable first"
    - "Section CSS stylesheet_tag at top of liquid file — Shopify deduplicates repeated asset_url references automatically"
    - "Product card uses data-product-id and data-variants-count attributes — section JS in Plan 02-02 handles click events"
    - "Staggered grid via CSS :nth-child(even) margin-top — no JS required for offset layout"

key-files:
  created:
    - templates/index.json
    - sections/section-hero.liquid
    - sections/section-curation-pillars.liquid
    - sections/section-category-browse.liquid
    - sections/section-featured-products.liquid
    - sections/section-brand-story.liquid
    - sections/section-how-it-works.liquid
    - sections/section-testimonials.liquid
    - sections/section-cta-banner.liquid
    - snippets/product-card.liquid
    - assets/component-hero.css
    - assets/component-curation-pillars.css
    - assets/component-category-browse.css
    - assets/component-featured-products.css
    - assets/component-brand-story.css
    - assets/component-how-it-works.css
    - assets/component-testimonials.css
    - assets/component-cta-banner.css
    - assets/component-product-card.css
  modified:
    - locales/en.default.json (added products.quick_add and products.quick_add_label keys)

key-decisions:
  - "image_tag filter with | escape in multi-line named-params form causes LiquidHTMLSyntaxError — assign alt to a variable first, then pass the variable: {%- assign hero_image_alt = image.alt | escape -%}"
  - "section-featured-products includes both component-featured-products.css and component-product-card.css via stylesheet_tag — product card styles are shared and must load wherever the card is rendered"
  - "Staggered category grid implemented via .category-card:nth-child(even) { margin-top: 3rem } — pure CSS, no JS needed"
  - "Quick Add button carries data-product-id and data-variants-count attributes on the button element — section JS in Plan 02-02 will delegate click handling via the data attributes"

patterns-established:
  - "All image alt text must be assigned to a variable before use in image_tag multi-line named params"
  - "Section CSS loads at top of liquid file via {{ 'component-name.css' | asset_url | stylesheet_tag }}"
  - "Shared snippets (product-card) render with {% render 'product-card', product: product %} — no parameters beyond the product object"

requirements-completed: [HOME-01, HOME-02, HOME-03, HOME-04, HOME-05]

# Metrics
duration: 6min
completed: 2026-03-22
---

# Phase 2 Plan 01: Homepage Sections and Shared Product Card Summary

**8 merchant-configurable homepage sections in Figma order — Hero with eager LCP image, staggered Category Browse, Featured Products pulling from collection, gradient-circle How It Works, Testimonials — plus shared product-card snippet for PLP reuse**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-22T21:36:29Z
- **Completed:** 2026-03-22T21:42:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint — approved)
- **Files modified:** 20

## Accomplishments

- `templates/index.json` updated to reference all 8 sections in Figma order, replacing the placeholder `main-page-content`
- 8 complete Liquid section files with full HTML markup, Theme Editor schemas (settings + block types), and inline CSS asset references
- Hero section: `loading="eager"` + `fetchpriority="high"` on hero image to satisfy HOME-02 LCP requirement
- Category Browse: staggered design signature via `.category-card:nth-child(even) { margin-top: 3rem }` — pure CSS, no JS
- Featured Products: sources from `section.settings.collection` via `{% render 'product-card', product: product %}` — shared with PLP
- `snippets/product-card.liquid` with `data-product-id` and `data-variants-count` on Quick Add button — ready for Plan 02-02 JS
- 9 CSS component files using CSS custom properties only (no hardcoded hex except `#fff` for white-on-red contrast where token unavailable)
- `locales/en.default.json` updated with `products.quick_add` and `products.quick_add_label` keys
- `shopify theme check`: 27 files inspected, zero errors, zero warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Section stubs, CSS files, product card snippet, and index.json update** - `fa52bf0` (feat)
2. **Task 2: Implement all 8 homepage sections and CSS** - `48c5140` (feat)
3. **Task 3: Verify homepage sections match Figma and Theme Editor works** - approved (human-verify checkpoint passed)

**Plan metadata:** (committed with state updates)

## Files Created/Modified

- `templates/index.json` — homepage JSON template: all 8 sections in order, with blocks pre-seeded for Theme Editor
- `sections/section-hero.liquid` — eager hero image (loading=eager fetchpriority=high), 2-col grid, CTA buttons
- `sections/section-curation-pillars.liquid` — 3-col grid, Material Symbols icon span, pillar blocks
- `sections/section-category-browse.liquid` — 4-card staggered portrait grid with hover scale, :nth-child(even) offset
- `sections/section-featured-products.liquid` — collection-sourced grid, {% render 'product-card' %}, placeholder fallback
- `sections/section-brand-story.liquid` — 2-col editorial, richtext body, blockquote pull-quote, 2x2 image grid
- `sections/section-how-it-works.liquid` — `<ol>` step list, gradient circle `.step-number`, 3-col horizontal
- `sections/section-testimonials.liquid` — star rating loop (filled/empty &#9733;/&#9734;), testimonial blocks, avatar image
- `sections/section-cta-banner.liquid` — `.cta-banner__inner` red rounded card, white `.btn--white` CTA
- `snippets/product-card.liquid` — shared card: image with lazy loading, badge, title, price, Quick Add button
- `assets/component-hero.css` — 2-col grid, clamp headline, btn/btn--primary/btn--outline
- `assets/component-curation-pillars.css` — 3-col grid, icon wrapper circle, responsive
- `assets/component-category-browse.css` — 4-col staggered grid, :nth-child(even), hover scale, 2-col/1-col breakpoints
- `assets/component-featured-products.css` — 4-col grid, responsive 2-col/1-col
- `assets/component-brand-story.css` — 2-col editorial, 2x2 image grid, brand-primary blockquote border
- `assets/component-how-it-works.css` — 3-col steps, gradient circle step-number, responsive
- `assets/component-testimonials.css` — flex-wrap cards, star colors, cite/name/location styling
- `assets/component-cta-banner.css` — red rounded inner, btn--white, responsive padding
- `assets/component-product-card.css` — shared card styles, hover scale, badge, quick-add button
- `locales/en.default.json` — added products.quick_add and products.quick_add_label keys

## Decisions Made

- `image_tag` named parameters in multi-line form do not accept `| escape` inline — the `escape` filter has trailing characters that confuse the parser. Fix: assign `alt` to a variable first (`{%- assign hero_image_alt = image.alt | escape -%}`) then pass the variable as the `alt` named param. Applied consistently across all sections.
- `section-featured-products.liquid` includes both `component-featured-products.css` and `component-product-card.css` via `stylesheet_tag` — product card styles are shared and must load wherever the card renders. Shopify deduplicates repeated `asset_url` requests automatically so this is safe.
- Staggered category grid implemented via pure CSS `.category-card:nth-child(even) { margin-top: 3rem }` — no JavaScript required. The stagger is removed at mobile breakpoints to avoid layout issues in single-column flow.
- Quick Add button carries `data-product-id` and `data-variants-count` as data attributes on the button element — no inline `onclick` or JS in the snippet itself. Section JS (Plan 02-02) will delegate click handling by querying these attributes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed LiquidHTMLSyntaxError in snippets/product-card.liquid**
- **Found during:** Task 1 (shopify theme check run)
- **Issue:** `product.featured_image.alt | escape` used inline as named parameter in multi-line `image_tag` call — the filter's trailing comma causes `LiquidHTMLSyntaxError: Filter 'escape' has trailing characters`
- **Fix:** Assigned `{%- assign product_image_alt = product.featured_image.alt | escape -%}` and passed `product_image_alt` as the `alt` param; collapsed image_tag to single line
- **Files modified:** snippets/product-card.liquid
- **Verification:** shopify theme check passes zero errors after fix
- **Committed in:** `fa52bf0` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed same LiquidHTMLSyntaxError in 3 section files**
- **Found during:** Task 2 (shopify theme check run)
- **Issue:** Same `| escape` inline filter pattern repeated in section-hero.liquid, section-category-browse.liquid, section-brand-story.liquid, and section-testimonials.liquid
- **Fix:** Applied same variable-assign pattern to all four sections
- **Files modified:** sections/section-hero.liquid, sections/section-category-browse.liquid, sections/section-brand-story.liquid, sections/section-testimonials.liquid
- **Verification:** shopify theme check: 27 files, zero errors, zero warnings
- **Committed in:** `48c5140` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug, same root cause)
**Impact on plan:** Both fixes required for theme check to pass (plan's core must_have). Root cause is a Shopify theme check parser constraint: `| escape` cannot appear inside named parameter lists in multi-line `image_tag` calls. Pattern documented for all future sections.

## Issues Encountered

- `image_tag` multi-line named params do not support Liquid filters inline (`alt: image.alt | escape` fails). The workaround (pre-assign alt to a variable) is now established as a project pattern for all future sections using `image_tag`.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 8 homepage sections are complete and wired into `templates/index.json`
- `snippets/product-card.liquid` is ready for reuse in Plan 02-02 PLP (`main-collection.liquid`)
- `component-product-card.css` styles are shared — PLP only needs to add `{{ 'component-product-card.css' | asset_url | stylesheet_tag }}`
- Quick Add JS (Plan 02-02) should delegate from the `.featured-products` section element, listening for clicks on `[data-product-id]` buttons and calling `window.BarterBobs.publish('cart:updated', ...)`
- Task 3 (human verify) approved — user confirmed sections match Figma, Theme Editor works, mobile responsive verified

---
*Phase: 02-homepage-plp*
*Completed: 2026-03-22*

## Self-Check: PASSED

- FOUND: templates/index.json
- FOUND: sections/section-hero.liquid
- FOUND: sections/section-curation-pillars.liquid
- FOUND: sections/section-category-browse.liquid
- FOUND: sections/section-featured-products.liquid
- FOUND: sections/section-brand-story.liquid
- FOUND: sections/section-how-it-works.liquid
- FOUND: sections/section-testimonials.liquid
- FOUND: sections/section-cta-banner.liquid
- FOUND: snippets/product-card.liquid
- FOUND: assets/component-hero.css
- FOUND: assets/component-curation-pillars.css
- FOUND: assets/component-category-browse.css
- FOUND: assets/component-featured-products.css
- FOUND: assets/component-brand-story.css
- FOUND: assets/component-how-it-works.css
- FOUND: assets/component-testimonials.css
- FOUND: assets/component-cta-banner.css
- FOUND: assets/component-product-card.css
- FOUND: .planning/phases/02-homepage-plp/02-01-SUMMARY.md
- FOUND commit: fa52bf0 (feat(02-01): section stubs, CSS files, product card snippet, and index.json update)
- FOUND commit: 48c5140 (feat(02-01): implement all 8 homepage sections and CSS)
- shopify theme check: 27 files, zero errors, zero warnings
