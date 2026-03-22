---
phase: 02-homepage-plp
plan: 02
subsystem: ui
tags: [shopify, liquid, css-grid, ajax, cart, pubsub, web-components, plp, collection, filters, quick-add, variant-popover]

# Dependency graph
requires:
  - phase: 02-01
    provides: product-card snippet with Quick Add button data attributes, component-product-card.css
  - phase: 01-foundation
    provides: window.BarterBobs pubsub, ShopifySection base class, global CSS custom properties

provides:
  - templates/collection.json (collection page template wiring main-collection section)
  - sections/main-collection.liquid (PLP section with responsive grid, filter sidebar, mobile drawer, Quick Add, AJAX filter fetch)
  - snippets/filter-groups.liquid (shared filter markup for list and price_range types)
  - snippets/icon-filter.liquid (filter funnel SVG icon)
  - assets/component-collection.css (PLP grid layout, filter sidebar, mobile drawer, chip styles, price range slider)

affects:
  - 03-pdp-cart (subscribes to cart:updated + cart:open, cart drawer integration)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Section Rendering API AJAX filter fetch with AbortController for race condition prevention
    - MainCollection web component extending window.BarterBobs.ShopifySection inline in section script[type=module]
    - filter-groups.liquid rendered in both desktop sidebar and mobile drawer (DRY snippet pattern)
    - Variant popover positioned via fixed viewport-aware coordinates (above/below based on available space)
    - Debounced price range change (300ms) before triggering AJAX filter fetch
    - aria-hidden toggle pattern for drawer and popover visibility

key-files:
  created:
    - templates/collection.json
    - sections/main-collection.liquid
    - snippets/filter-groups.liquid
    - snippets/icon-filter.liquid
    - assets/component-collection.css
  modified: []

key-decisions:
  - "MainCollection JS defined inline in section script[type=module] — consistent with Phase 01-03 pattern, keeps behavior co-located and avoids cross-module boundary issues"
  - "Filter AJAX uses AbortController to cancel in-flight requests on rapid filter change — prevents race conditions and stale result injection"
  - "filter-groups.liquid rendered in both desktop sidebar and mobile drawer — DRY pattern, JS targets .filter-checkbox within main-collection scope"
  - "Variant popover uses viewport-aware fixed positioning (above card if insufficient space below) — avoids popover clipping at bottom of viewport"
  - "Price range slider uses 300ms debounce on change event — prevents request flooding while dragging thumb"

patterns-established:
  - "AJAX Section Rendering API pattern: fetch `${path}?${params}&sections=section-name`, parse JSON, swap innerHTML, rebind handlers"
  - "AbortController pattern for cancelling in-flight requests: abort previous before new fetch"
  - "Quick Add pattern: data-product-id + data-variants-count drive single vs. multi-variant flow"
  - "Variant chip popover pattern: fetch /products/{id}.js, render chips, position relative to trigger button viewport-aware"

requirements-completed: [PLPX-01, PLPX-02, PLPX-03, PLPX-04]

# Metrics
duration: 35min
completed: 2026-03-22
---

# Phase 02 Plan 02: Product Listing Page (PLP) Summary

**Responsive 4/2/1-column product grid with AJAX Section Rendering API filter sidebar, mobile bottom-sheet drawer, and Quick Add variant chip popover — integrated via cart:updated/cart:open pubsub**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-03-22T21:30:00Z
- **Completed:** 2026-03-22T22:10:00Z
- **Tasks:** 3 (2 auto + 1 human-verify, approved)
- **Files modified:** 5

## Accomplishments

- Complete PLP template: templates/collection.json wires collection page to main-collection section
- Responsive product grid (4-col at 1280px, 2-col at 768px, 1-col at 375px) matching PLPX-01
- Desktop filter sidebar + mobile slide-up drawer sharing filter-groups.liquid snippet
- AJAX filter fetch using Section Rendering API with AbortController for race condition prevention
- Quick Add: single-variant direct AJAX add, multi-variant chip popover with viewport-aware positioning
- cart:updated and cart:open pubsub emitted after every successful add — Phase 3 cart drawer ready
- shopify theme check: 31 files inspected, zero offenses

## Task Commits

Each task was committed atomically:

1. **Task 1: collection.json, main-collection section structure, CSS grid** - `c33b6f4` (feat)
2. **Task 2: filter-groups snippet and MainCollection JS** - `eabe139` (feat)
3. **Task 3: Verify PLP grid, filters, and Quick Add in dev store** - human-verify approved

**Plan metadata:** `643fdb1` (docs: checkpoint pending human verify — pre-approval)

## Files Created/Modified

- `templates/collection.json` - Collection page template referencing main-collection section
- `sections/main-collection.liquid` - PLP section: responsive product grid, desktop filter sidebar, mobile slide-up drawer, variant picker popover, MainCollection web component with AJAX filter fetch and Quick Add
- `snippets/filter-groups.liquid` - Shared filter markup rendered in both desktop sidebar and mobile drawer; handles list type (checkboxes) and price_range type (dual-thumb slider)
- `snippets/icon-filter.liquid` - SVG filter funnel icon for the mobile filter toggle button
- `assets/component-collection.css` - All PLP layout styles: collection grid (280px sidebar + 1fr), 4/2/1 product grid, sticky filter sidebar, mobile drawer slide-up transform animation, variant chip styles, dual-thumb price range slider

## Decisions Made

- MainCollection JS defined inline in `<script type="module">` in the section file — consistent with Phase 01-03 NavDrawer pattern; keeps behavior co-located and avoids dynamic import boundary issues
- Filter AJAX uses AbortController: abort previous in-flight request before firing new fetch — prevents stale results from slow connections on rapid filter interactions
- filter-groups.liquid is a shared snippet rendered in both desktop sidebar and mobile drawer — single source of truth avoids duplication, JS targets `.filter-checkbox` within main-collection element scope
- Variant chip popover uses fixed positioning with viewport-aware placement: renders above trigger if less than 180px space below, otherwise below
- Price range slider debounces (300ms) the change event before triggering filter fetch — prevents request flooding during slider drag

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Structure] Both JS and structure implemented in single Task 1 pass, filter-groups split into Task 2**
- **Found during:** Task 1 (main-collection.liquid structure)
- **Issue:** The plan specified Task 1 as structure/CSS and Task 2 as JS/filter snippet. Since main-collection.liquid needed the complete JS to pass shopify theme check (custom element class inline in file), the JS was written in Task 1's file creation pass.
- **Fix:** Committed two logical commits reflecting plan intent: Task 1 commit (c33b6f4) contains structure files, Task 2 commit (eabe139) contains filter-groups.liquid.
- **Files modified:** sections/main-collection.liquid, snippets/filter-groups.liquid
- **Verification:** shopify theme check passed zero errors after both commits
- **Committed in:** eabe139 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (structural commit ordering)
**Impact on plan:** No scope creep. All planned functionality delivered as specified. Split was commit organization only, not behavioral difference.

## Issues Encountered

None - all files implemented per plan spec. shopify theme check passed zero errors/warnings at every stage (31 files inspected).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PLP complete: collection page fully functional for product discovery, AJAX filtering, and cart adds
- cart:updated pubsub ready: CartCountBubble badge updates on Quick Add
- cart:open pubsub ready: Phase 3 cart drawer component subscribes to open on cart add
- Phase 3 PDP/Cart can begin; subscription app (Shopify Subscriptions vs. Recharge vs. Skio) must be confirmed before selling plan Liquid objects can be verified

## Self-Check: PASSED

Files verified:
- templates/collection.json: FOUND
- sections/main-collection.liquid: FOUND
- snippets/filter-groups.liquid: FOUND
- snippets/icon-filter.liquid: FOUND
- assets/component-collection.css: FOUND

Commits verified:
- c33b6f4: FOUND
- eabe139: FOUND
- 643fdb1: FOUND

shopify theme check: 31 files inspected, zero offenses

---
*Phase: 02-homepage-plp*
*Completed: 2026-03-22*
