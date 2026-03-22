# Phase 2: Homepage + PLP - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

A shopper can land on the homepage and browse the full product catalog — every section matches the Figma exports, content is configurable in the Theme Editor, and the product grid supports Quick Add with a mini variant picker. Creating the cart drawer (Phase 3) and product detail page (Phase 3) are out of scope, but Quick Add must wire up correctly to them.

</domain>

<decisions>
## Implementation Decisions

### Homepage section scope
- **8 sections total**, following `barterbobs_main_landing_page` Figma order with the product grid inserted from `barterbobs_landing_page_1`:
  1. Hero
  2. Curation Pillars ("Curation with Care" — 3 blocks with icon, headline, body)
  3. Category Browse ("Browse Our Pantry" — 4 editorial portrait cards linking to collections)
  4. Featured Product Grid ("This Month's Favorites" — 4 Shopify products from merchant-selected collection)
  5. Brand Story (2-col editorial: large headline + body/pull-quote + 2×2 image grid)
  6. How It Works (3-step flow with numbered gradient circles)
  7. Testimonials ("Loved by Bob-scribers" — quote cards with stars, name, location)
  8. CTA Banner (full-width rounded red card, headline + offer copy + single CTA button)
- All sections are merchant-configurable via Theme Editor section schema blocks
- Section order fixed as above — Theme Editor drag-and-drop allows merchant to reorder if needed

### Category Browse section (editorial cards)
- 4 portrait cards at 3:4 aspect ratio
- Staggered offset layout: alternate cards pushed down `margin-top: ~3rem` to create Figma asymmetry
- Each card: background image, category label, hover scale 1.05x on image
- Merchant configures: image, label text, link URL — via repeatable Theme Editor blocks
- No Shopify product data — purely editorial links to collection pages

### Featured Product Grid section (Shopify products)
- Pulls products from a merchant-selected collection via `collection.products` or Liquid section `type: product_list`
- Square (1:1) aspect ratio product images
- 4-column uniform grid (matching `barterbobs_landing_page_1` "This Month's Favorites")
- Each card: product image (hover scale 1.05x), badge label, product title, price, Quick Add button
- Merchant configures: which collection to source from, section headline and subheadline

### Quick Add behavior
- **Single-variant products**: AJAX add directly, no picker needed
- **Multi-variant products**: open a mini variant picker **popover anchored to the product card** (positioning: above or below the card, viewport-aware)
  - Popover shows variant chips (same chip-style pattern as PDPX-02 variant selector, for design consistency)
  - Shopper selects a variant, then clicks Add — AJAX adds the item
  - Clicking outside the popover closes it without adding
- **After successful add** (both single and multi-variant):
  - AJAX POST to `/cart/add.js`
  - Update cart count badge (`CartCountBubble` custom element from Phase 1)
  - Emit `cart:open` event via pubsub — Phase 3 cart drawer will subscribe and open
  - Phase 2: badge updates, event fires — no drawer yet since it's Phase 3 work

### PLP filter behavior
- **Desktop sidebar** (≥768px): fixed-width left sidebar with three filter groups stacked vertically
  - Categories: text links with product counts (from `collection.filters` Liquid)
  - Dietary Prefs: custom-styled checkboxes (Gluten-Free, Vegan, Organic Only — from product tags via Search & Discovery)
  - Price Range: dual-thumb custom range slider (CSS + vanilla JS, no library)
- **Mobile sidebar** (<768px): filter button above the product grid → tapping opens a **slide-up drawer** from the bottom of the viewport with all three filter groups; "Apply Filters" button closes drawer and applies
- **Filter AJAX**: selecting any filter updates URL params (`?filter.p.tag=vegan&filter.v.price.gte=0`), fetches updated collection HTML via `fetch()`, and replaces the product grid DOM in-place — no full page reload, shareable/bookmarkable filtered URLs, supports browser back/forward
- Requires Shopify Search & Discovery app installed in dev store (pre-Phase 2 blocker from STATE.md)

### Product card snippet
- Shared `snippets/product-card.liquid` used by both the homepage product grid AND the PLP product grid
- Accepts a `product` object — renders image, title, price, badge, and Quick Add button
- Quick Add JS lives in the section that renders the cards (not in the snippet itself) — snippet outputs a `<button data-product-id>` and the section handles the click

### Claude's Discretion
- Exact dual-thumb price slider implementation (CSS approach, JS range calculation)
- Variant picker popover positioning logic (viewport collision detection)
- Loading skeleton or spinner while AJAX filter fetch is in progress
- Error state for Quick Add AJAX failure
- Exact responsive breakpoints for the 4-column product grid collapse on the homepage

</decisions>

<specifics>
## Specific Ideas

- The staggered category cards (alternate cards offset down) is a design signature from the main Figma — preserve it exactly, not a uniform grid
- The CTA banner ("Ready to elevate your pantry? Get $20 off your first two boxes") uses the same `hero-gradient` treatment as the hero CTA buttons — full-width rounded red card with white text and a white outlined/filled button
- Quick Add variant picker chips should visually match the Phase 3 PDP variant selector for design consistency — build the chip component once in Phase 2, Phase 3 reuses the same CSS
- The price range slider in the Figma uses a custom dual-thumb design with primary brand color fill — not the browser's native `<input type="range">`
- "Bob-scribers" is intentional brand wordplay — not a typo

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `assets/global.js`: `publish()` / `subscribe()` pubsub, `trapFocus()`, `ShopifySection` base class — Quick Add and filter components should extend ShopifySection and use pubsub for cart events
- `assets/base.css`: Reset, typography, image defaults using CSS custom properties — no overrides needed
- `snippets/css-variables.liquid`: All design tokens available (`--color-brand-primary`, `--color-surface`, `--transition-base`, `--section-gap`, etc.)
- `snippets/icon-*.liquid`: SVG snippet pattern established — add any new icons (e.g., filter icon, check icon) as new icon snippets
- `CartCountBubble` custom element from Phase 1 header — Quick Add AJAX triggers badge update via `publish('cart:updated', { count })`

### Established Patterns
- **CSS**: Section-specific styles in `assets/component-{section-name}.css`, imported with `{{ 'component-hero.css' | asset_url | stylesheet_tag }}`
- **JS**: Section-specific JS inline in `<script type="module">` at the bottom of the section liquid file — extends `window.BarterBobs.ShopifySection`
- **Events**: `cart:updated`, `cart:open`, `drawer:close` — defined and established in Phase 1. Quick Add must use `cart:open` to trigger the Phase 3 cart drawer
- **Web components**: `customElements.define('section-name', class extends window.BarterBobs.ShopifySection {...})`
- **Hover animation**: `--transition-base` (200ms ease) for all hover states; scale 1.05x pattern on images
- **Section spacing**: `--section-gap` (12rem) between sections, `--section-gap-sm` (6rem) for compact variants

### Integration Points
- Cart: Phase 3 will build the cart drawer that listens to `cart:open`. Phase 2 Quick Add must emit `cart:open` via pubsub so Phase 3 integration is seamless with no changes to Phase 2 code.
- Shopify Search & Discovery: `collection.filters` Liquid object provides filter data. Filter URL params format: `?filter.p.tag=vegan` (tags), `?filter.v.price.gte=0&filter.v.price.lte=50` (price). Requires Search & Discovery app installed in dev store.
- `collection.filters` with dietary tags (Gluten-Free, Vegan, Organic Only) requires products tagged in Shopify admin before Phase 2 filter UI can be verified (existing blocker from STATE.md)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 2 scope.

</deferred>

---

*Phase: 02-homepage-plp*
*Context gathered: 2026-03-22*
