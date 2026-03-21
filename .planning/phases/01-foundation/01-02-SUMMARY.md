---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [shopify, liquid, javascript, web-components, custom-events, es-modules]

# Dependency graph
requires:
  - phase: 01-foundation/01-01
    provides: snippets/css-variables.liquid (token style block rendered in head), assets/base.css (base styles), config/settings_schema.json (theme settings including favicon)

provides:
  - layout/theme.liquid — Shopify OS 2.0 HTML shell with font loading, token rendering, and section groups
  - assets/global.js — ShopifySection base class, publish/subscribe utilities, CartCountBubble web component, trapFocus helper

affects:
  - 01-03 (header/footer sections extend ShopifySection; rendered inside sections 'header-group' / sections 'footer-group')
  - All Phase 2/3 sections (extend ShopifySection for Theme Editor lifecycle)
  - Phase 3 cart drawer (dispatches cart:updated; CartCountBubble subscribes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shopify OS 2.0 section groups via plural {% sections %} tag for Theme Editor extensibility"
    - "Google Fonts preload + print/onload swap pattern for LCP-critical fonts (Newsreader)"
    - "ES module script loading via <script type=module> — NOT | script_tag filter (no module support)"
    - "CustomEvent pub/sub on document (not window) for cross-component messaging"
    - "ShopifySection HTMLElement base class with shopify:section:load/unload lifecycle"
    - "event.target.contains(this) guard for per-section event scoping"
    - "subscribe() returns unsubscribe function for cleanup in onSectionUnload"
    - "window.BarterBobs namespace exposes shared utilities without import chains"

key-files:
  created:
    - layout/theme.liquid
    - assets/global.js
  modified: []

key-decisions:
  - "Use <script type=module src=...> for global.js — the | script_tag Liquid filter does not emit type=module, making it incompatible with ES module semantics"
  - "Newsreader loaded via preload + print/onload swap (not simple stylesheet) to prevent LCP regression while still avoiding render-blocking"
  - "Inter loaded as standard stylesheet (no preload) — it is not needed for above-the-fold content"
  - "section groups use plural {% sections %} tag exclusively — singular {% section %} does not support Theme Editor section management"
  - "window.BarterBobs namespace chosen over ES module exports because section-specific scripts are separate <script type=module> tags that cannot import from a sibling module tag without dynamic import"

patterns-established:
  - "All interactive sections extend ShopifySection and register via customElements.define"
  - "Cart state updates flow via publish('cart:updated', { itemCount }) — never via direct DOM coupling"
  - "Focus traps created with trapFocus(container) which returns a cleanup fn; always call cleanup in onSectionUnload"

requirements-completed: [FNDX-03, FNDX-04]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 1 Plan 02: HTML Shell and JS Foundation Summary

**Shopify OS 2.0 theme.liquid shell with Google Fonts LCP strategy and global.js ES module defining ShopifySection base class, pub/sub, CartCountBubble, and trapFocus**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T03:17:07Z
- **Completed:** 2026-03-21T03:20:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `layout/theme.liquid` — complete OS 2.0 shell: doctype, preconnect, Newsreader preload/swap, Inter stylesheet, css-variables token render, base.css, content_for_header, skip link, section groups, content_for_layout, global.js module script
- `assets/global.js` — full JS foundation: publish/subscribe on document, trapFocus with cleanup, ShopifySection HTMLElement base class with Theme Editor lifecycle, CartCountBubble web component, window.BarterBobs namespace
- Section groups use plural `{% sections %}` tag (required for Theme Editor block management) — not singular `{% section %}`

## Task Commits

Each task was committed atomically:

1. **Task 1: layout/theme.liquid HTML shell with fonts, tokens, and section groups** - `c354f88` (feat)
2. **Task 2: assets/global.js — ShopifySection base class, pub/sub, CartCountBubble, trapFocus** - `dfaad04` (feat)

**Plan metadata:** (pending — committed after SUMMARY)

## Files Created/Modified

- `layout/theme.liquid` — Shopify OS 2.0 HTML shell: font loading strategy, CSS token injection, section groups, global.js module load
- `assets/global.js` — JS foundation: publish/subscribe, trapFocus, ShopifySection, CartCountBubble, window.BarterBobs namespace

## Decisions Made

- `<script type="module" src="{{ 'global.js' | asset_url }}" defer>` — the Liquid `| script_tag` filter outputs a plain `<script src>` tag with no `type="module"` attribute, breaking ES module semantics. Direct `<script>` tag with explicit `type="module"` is required.
- Newsreader uses the preload + `media="print" onload="this.media='all'"` swap pattern (not a direct `<link rel="stylesheet">`) so the font request starts immediately without blocking rendering. `<noscript>` fallback included.
- Inter uses a plain stylesheet link — it is not render-blocking for the hero because it is not the LCP display font.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `layout/theme.liquid` and `assets/global.js` are both in place; Plan 01-03 (header/footer sections) can now be written — header renders inside `{% sections 'header-group' %}`, footer inside `{% sections 'footer-group' %}`
- All Phase 2/3 sections can extend `ShopifySection` and register with `customElements.define`
- Cart drawer (Phase 3) should dispatch `publish('cart:updated', { itemCount })` — `CartCountBubble` is already subscribed
- Blocker remains: `sections/header-group.json` and `sections/footer-group.json` must be created in Plan 01-03 before `shopify theme check` returns zero errors on theme.liquid

---
*Phase: 01-foundation*
*Completed: 2026-03-21*

## Self-Check: PASSED

- FOUND: layout/theme.liquid
- FOUND: assets/global.js
- FOUND: .planning/phases/01-foundation/01-02-SUMMARY.md
- FOUND commit: c354f88 (feat(01-02): layout/theme.liquid)
- FOUND commit: dfaad04 (feat(01-02): assets/global.js)
