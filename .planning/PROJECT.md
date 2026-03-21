# BarterBobs Shopify Theme

## What This Is

A production-ready custom Shopify OS 2.0 theme for BarterBobs, a curated Trader Joe's subscription delivery service. The theme faithfully implements the provided Figma design exports: three homepage variants, a product listing page, product detail page, and shopping cart — all sharing a "modern provisions editorial" aesthetic with warm typography and tonal layering.

## Core Value

A shopper should be able to land, browse curated products, select a subscription frequency, and check out — with every page feeling like a premium editorial food publication, not a generic e-commerce store.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Theme uses Shopify OS 2.0 architecture (JSON templates, sections everywhere)
- [ ] All sections are customizable via Theme Editor (settings_schema, section schema blocks)
- [ ] Design tokens (colors, fonts, spacing) extracted from Figma exports and defined as CSS custom properties
- [ ] Homepage built from barterbobs_main_landing_page + barterbobs_landing_page_1/2 exports
- [ ] Product Listing Page (PLP) built from product_listing_page_plp export with collection filtering
- [ ] Product Detail Page (PDP) built from product_detail_page_pdp export with variant selector, image gallery, subscription frequency selector, add-to-cart
- [ ] Cart implemented as a drawer (from shopping_cart export) — no page redirect
- [ ] Header and Footer built as sections with Theme Editor support
- [ ] Static pages covered: About, 404
- [ ] Mobile-first responsive layout verified at 375px, 768px, 1280px
- [ ] Semantic HTML5 with accessible markup (ARIA labels, alt text hooks)
- [ ] Vanilla JS only — no jQuery
- [ ] Lazy loading for images, optimized for Core Web Vitals
- [ ] `shopify theme check` passes with zero errors and warnings

### Out of Scope

- Harvest Hearth / Rustic Pantry design variants — reference only, not implemented
- Password / coming-soon page — standard Shopify default acceptable
- Blog / article templates — not in design exports
- Third-party app integrations (reviews, loyalty) — not in design scope
- Mobile app — web only

## Context

**Design exports location:** `stitch_barterbobs_landing_page/` in project root

**Design source files (authoritative):**
- `barterbobs_main_landing_page/code.html` — primary homepage
- `barterbobs_landing_page_1/code.html` — homepage variant 1
- `barterbobs_landing_page_2/code.html` — homepage variant 2
- `product_detail_page_pdp/code.html` — PDP
- `product_listing_page_plp/code.html` — PLP
- `shopping_cart/code.html` — cart

**Reference docs (design philosophy only):**
- `harvest_hearth/DESIGN.md`
- `rustic_pantry/DESIGN.md`

**Design aesthetic:** Modern provisions editorial — premium subscription grocery. Warm reds (#8d1008 / #b5092d range), earthy greens, creamy off-white surfaces. Newsreader serif for display/headlines, Inter/Plus Jakarta Sans for body. No borders (tonal layering only), intentional asymmetry, editorial white space (12–20rem section gaps), glassmorphism nav, subtle grain texture, rounded corners (0.75–1.5rem minimum), micro-interactions (scale 1.02x on hover).

**Shopify store type:** Subscription grocery delivery. Products are Trader Joe's items; key UX pattern is subscription frequency selection (weekly/biweekly/monthly) on PDP and cart.

## Constraints

- **Architecture**: Shopify OS 2.0 (JSON templates, sections everywhere) — Dawn as structural reference, fully custom visuals
- **JS**: Vanilla JS only, no jQuery, minimal dependencies
- **CSS**: Custom properties for all design tokens, no Tailwind or CSS frameworks in production theme
- **CLI**: `shopify theme check` must pass clean before delivery
- **Images**: Lazy loading required, Core Web Vitals targets

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use barterbobs_* HTML exports as design source | User explicitly scoped to these files | — Pending |
| Cart as drawer, not page | User brief + design export confirms cart drawer pattern | — Pending |
| No CSS framework in theme | Figma exports use Tailwind inline; production theme uses CSS custom properties | — Pending |
| Newsreader + Inter as primary type stack | Dominant across all page exports | — Pending |

---
*Last updated: 2026-03-20 after initialization*
