---
phase: 2
slug: homepage-plp
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `shopify theme check` (Shopify CLI, bundled) |
| **Config file** | `.theme-check.yml` (created in Phase 1, Plan 01-01) |
| **Quick run command** | `shopify theme check` |
| **Full suite command** | `shopify theme check --category all` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `shopify theme check`
- **After every plan wave:** Run `shopify theme check --category all` + manual spot check in dev store
- **Before `/gsd:verify-work`:** Full suite must be green + all 9 success criteria verified in dev store
- **Max feedback latency:** ~5 seconds (automated); manual browser verification required for interactive behaviors

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 0 | HOME-01, HOME-02 | `shopify theme check` | `shopify theme check` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 0 | HOME-03 | `shopify theme check` | `shopify theme check` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 0 | HOME-04 | `shopify theme check` | `shopify theme check` | ❌ W0 | ⬜ pending |
| 2-01-04 | 01 | 0 | HOME-05 | `shopify theme check` | `shopify theme check` | ❌ W0 | ⬜ pending |
| 2-01-05 | 01 | 1 | HOME-01 through HOME-05 | manual + `shopify theme check` | `shopify theme check` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 0 | PLPX-02 | `shopify theme check` | `shopify theme check` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 0 | PLPX-01, PLPX-03, PLPX-04 | `shopify theme check` | `shopify theme check` | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 1 | PLPX-01 through PLPX-04 | manual + `shopify theme check` | `shopify theme check` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `sections/section-hero.liquid` — stubs for HOME-01, HOME-02
- [ ] `sections/section-curation-pillars.liquid` — homepage section stub
- [ ] `sections/section-category-browse.liquid` — homepage section stub
- [ ] `sections/section-featured-products.liquid` — stub for HOME-03
- [ ] `sections/section-brand-story.liquid` — homepage section stub
- [ ] `sections/section-how-it-works.liquid` — stub for HOME-04
- [ ] `sections/section-testimonials.liquid` — stub for HOME-05
- [ ] `sections/section-cta-banner.liquid` — homepage section stub
- [ ] `sections/main-collection.liquid` — stubs for PLPX-01, PLPX-02, PLPX-03, PLPX-04
- [ ] `snippets/product-card.liquid` — shared card snippet (PLPX-02, PLPX-04)
- [ ] `templates/collection.json` — required for collection page to render (currently missing)
- [ ] `templates/index.json` update — replace `main-page-content` with all 8 homepage sections
- [ ] `assets/component-hero.css` — hero section styles
- [ ] `assets/component-curation-pillars.css` — curation pillars styles
- [ ] `assets/component-category-browse.css` — category browse styles
- [ ] `assets/component-featured-products.css` — featured products styles
- [ ] `assets/component-brand-story.css` — brand story styles
- [ ] `assets/component-how-it-works.css` — how it works styles
- [ ] `assets/component-testimonials.css` — testimonials styles
- [ ] `assets/component-cta-banner.css` — CTA banner styles
- [ ] `assets/component-collection.css` — PLP grid + filter sidebar + mobile drawer
- [ ] `assets/component-product-card.css` — shared card CSS including variant chip styles

*External blockers (from STATE.md):*
- [ ] Search & Discovery app installed in dev store — required for `collection.filters` to populate
- [ ] Products tagged `Gluten-Free`, `Vegan`, `Organic Only` in Shopify admin — required to verify dietary filter options

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hero image LCP — Lighthouse reports no penalty | HOME-02 | Lighthouse audit requires live dev store | Run `shopify theme dev`, open Lighthouse in Chrome DevTools, verify LCP ≤ 2.5s with hero as LCP element |
| Homepage all 5 sections render per Figma | HOME-01 | Visual fidelity requires human review | Side-by-side Figma vs dev store at 1280px; verify section order, typography, colors |
| Featured products grid 4-column | HOME-03 | Grid layout requires browser | Resize to 1280px, verify 4 product cards in single row |
| How It Works 3 steps configurable in Theme Editor | HOME-04 | Theme Editor requires live dev store | Open Theme Editor, verify 3 step blocks are editable; change one, save, verify update |
| Testimonials multiple quote blocks | HOME-05 | Theme Editor requires live dev store | Open Theme Editor, add/remove testimonial blocks, verify render |
| 4/2/1 column grid at 1280/768/375px | PLPX-01 | Responsive layout requires browser resize | Resize browser to 1280px (4-col), 768px (2-col), 375px (1-col) on collection page |
| Product card hover scale 1.05x | PLPX-02 | Hover interaction requires browser | Hover over product card image, verify smooth scale transition |
| Filter sidebar narrows grid without reload, URL updates | PLPX-03 | AJAX filter requires dev store + Search & Discovery app | Apply filter, verify network tab shows section rendering API call (not page reload), verify URL params update |
| Quick Add adds to cart, badge updates, `cart:open` fires | PLPX-04 | AJAX cart add requires dev store | Click Quick Add on single-variant product, verify badge increments; open browser console, verify `cart:open` event published |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s (automated `shopify theme check`)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
