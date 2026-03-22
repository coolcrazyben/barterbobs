---
phase: 02-homepage-plp
plan: 02
subsystem: product-listing-page
status: checkpoint-pending
tags: [plp, collection, filters, quick-add, ajax, variant-popover]

dependency_graph:
  requires:
    - 02-01 (product-card.liquid snippet)
    - 01-03 (window.BarterBobs pubsub, ShopifySection base class)
  provides:
    - templates/collection.json (collection page template)
    - sections/main-collection.liquid (PLP section with grid, filters, Quick Add)
    - snippets/filter-groups.liquid (shared filter markup)
    - snippets/icon-filter.liquid (filter funnel SVG)
    - assets/component-collection.css (PLP layout, filter, drawer, chip styles)
  affects:
    - Phase 3 cart drawer (subscribes to cart:open pubsub emitted by Quick Add)

tech_stack:
  added: []
  patterns:
    - Shopify Section Rendering API (AJAX filter fetch)
    - AbortController for cancellable fetch requests
    - Dual-thumb range slider with debounced change handler
    - Web component extending ShopifySection base class
    - aria-hidden toggle pattern for drawer and popover visibility

key_files:
  created:
    - templates/collection.json
    - sections/main-collection.liquid
    - snippets/filter-groups.liquid
    - snippets/icon-filter.liquid
    - assets/component-collection.css
  modified: []

decisions:
  - MainCollection JS defined inline in section script[type=module] — consistent with Phase 01-03 pattern, avoids cross-module boundary issues
  - Filter AJAX uses AbortController to cancel in-flight requests on rapid filter change — prevents race conditions and stale result injection
  - Price range slider uses 300ms debounce on change event — prevents request flooding while dragging thumb
  - Variant popover uses viewport-aware positioning (above card if insufficient space below) — avoids popover clipping at bottom of viewport
  - filter-groups.liquid rendered in both desktop sidebar and mobile drawer (DRY) — JS targets .filter-checkbox within main-collection element scope

metrics:
  duration: 2 min
  completed_date: "2026-03-22"
  tasks_completed: 2
  tasks_total: 3
  files_created: 5
  files_modified: 0
---

# Phase 2 Plan 02: Product Listing Page (PLP) Summary

**One-liner:** PLP with 4/2/1 responsive grid, AJAX Section Rendering API filters with AbortController, and Quick Add variant chip popover using window.BarterBobs pubsub.

## Status

Tasks 1 and 2 complete. Task 3 is a human-verify checkpoint — awaiting user confirmation in dev store.

## What Was Built

**templates/collection.json** — Wires the collection template to `main-collection` section.

**sections/main-collection.liquid** — Full PLP section:
- Responsive product grid (4 col at 1280px, 2 col at 768px, 1 col at 375px) via CSS Grid
- Products loop inside `{%- paginate -%}` block using `{% render 'product-card' %}`
- Desktop filter sidebar rendering `{% render 'filter-groups' %}`
- Mobile filter drawer (slide-up bottom sheet) also rendering `{% render 'filter-groups' %}`
- Variant picker popover (hidden, positioned by JS)
- `MainCollection` web component extending `window.BarterBobs.ShopifySection`
- Mobile drawer: open/close with Escape key, focus management, body scroll lock
- AJAX filter fetch: Section Rendering API, AbortController, aria-busy during load
- Price range slider: dual-thumb with clamping, fill bar, 300ms debounce
- Quick Add: single-variant direct AJAX add; multi-variant chip popover with viewport-aware positioning
- `addToCart` publishes `cart:updated` and `cart:open` via `window.BarterBobs.publish`

**snippets/filter-groups.liquid** — Shared filter markup for both sidebar and mobile drawer. Handles `list` type (checkboxes) and `price_range` type (dual-thumb slider).

**snippets/icon-filter.liquid** — SVG funnel icon for the mobile filter toggle button.

**assets/component-collection.css** — All layout styles: collection layout grid (280px sidebar + 1fr), 4/2/1 product grid, filter sidebar sticky positioning, mobile drawer slide-up transform animation, variant chip styles, dual-thumb price range slider.

## Verification

`shopify theme check` ran after all files created: **31 files inspected, zero offenses**.

## Key Links Implemented

| From | To | Via |
|------|----|-----|
| MainCollection QuickAdd | /cart/add.js | fetch POST |
| MainCollection QuickAdd | window.BarterBobs.publish('cart:updated') | pubsub after AJAX success |
| MainCollection QuickAdd | window.BarterBobs.publish('cart:open') | pubsub after AJAX success |
| MainCollection FilterSidebar | /?sections=main-collection | Section Rendering API fetch |
| templates/collection.json | sections/main-collection.liquid | "type": "main-collection" |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | c33b6f4 | PLP collection.json, main-collection section structure, icon-filter, component-collection.css |
| Task 2 | eabe139 | filter-groups snippet and MainCollection JS (all JS inline in Task 1 file) |

## Deviations from Plan

**1. [Rule 1 - Structure] Both tasks implemented in single atomic pass**
- Found during: Task 1
- Issue: The plan specified Task 1 as structure/CSS and Task 2 as JS/filter snippet. Since `main-collection.liquid` needed the complete JS to pass `shopify theme check` properly (custom element class referenced in the file), the JS was written as part of Task 1's file creation, then `filter-groups.liquid` committed separately in Task 2.
- Fix: Committed two logical commits reflecting the plan split: Task 1 commit contains structure files, Task 2 commit contains filter-groups.liquid.
- Files modified: sections/main-collection.liquid, snippets/filter-groups.liquid

## Checkpoint Status

**Task 3 is a human-verify checkpoint.** Awaiting user to run `shopify theme dev` and verify:
1. 4/2/1 responsive grid
2. Product card hover scale 1.05x
3. Mobile filter drawer slide-up
4. Filter AJAX (no page reload, Network tab shows sections= fetch)
5. Quick Add single-variant increments cart badge
6. Quick Add multi-variant opens chip popover

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
