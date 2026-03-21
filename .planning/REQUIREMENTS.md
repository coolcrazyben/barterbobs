# Requirements: BarterBobs Shopify Theme

**Defined:** 2026-03-20
**Core Value:** A shopper can land, browse curated products, select a subscription frequency, and check out — every page feeling like a premium editorial food publication.

## v1 Requirements

### Foundation

- [ ] **FNDX-01**: Theme uses Shopify OS 2.0 architecture — all templates are JSON files referencing section liquid files; no markup in template files
- [ ] **FNDX-02**: CSS design tokens (color palette, typography scale, spacing system) extracted from Figma exports and defined as CSS custom properties in `snippets/css-variables.liquid`
- [ ] **FNDX-03**: Global JS infrastructure implemented as vanilla web components (`customElements.define`) with pubsub utility and `shopify:section:load`/`shopify:section:unload` handlers on every interactive section
- [ ] **FNDX-04**: Every section exposes its settings via section schema blocks so merchants can customize content and appearance through the Shopify Theme Editor
- [ ] **FNDX-05**: `config/settings_schema.json` defines global theme settings (colors, fonts, spacing) that populate CSS custom properties via `snippets/css-variables.liquid`
- [ ] **FNDX-06**: `.shopifyignore` includes `config/settings_data.json` to prevent CLI overwrites of live store content

### Navigation

- [ ] **NAVX-01**: Header renders as a section group with glassmorphism effect (semi-transparent surface, 12px backdrop blur) and sticks to the top of the viewport on scroll
- [ ] **NAVX-02**: Header includes cart icon with dynamic item count badge that updates without page reload when items are added
- [ ] **NAVX-03**: Mobile navigation collapses to a hamburger icon that opens a full-height off-canvas drawer with menu links
- [ ] **NAVX-04**: Footer renders as a section group with navigation links, brand identity, and merchant-configurable content blocks

### Homepage

- [ ] **HOME-01**: Hero section displays large display headline (Newsreader serif), supporting subheadline (Inter), one or two CTA buttons, and a hero product/lifestyle image — all fields configurable in Theme Editor
- [ ] **HOME-02**: Hero section image uses `loading="eager"` (not lazy) when the section is in the first two positions on the page to avoid LCP penalty
- [ ] **HOME-03**: Featured products / bento grid section renders a curated product grid with mixed card sizes, sourcing products from a merchant-selected collection
- [ ] **HOME-04**: "How It Works" section renders a 3-step flow with numbered circles, icons (Material Symbols), and step descriptions — all configurable in Theme Editor
- [ ] **HOME-05**: Testimonials section renders quote cards with customer name, quote text, star rating, and optional avatar image — supports multiple testimonial blocks via Theme Editor

### Product Listing Page

- [ ] **PLPX-01**: Collection page uses a responsive grid layout (4 columns at 1280px, 2 columns at 768px, 1 column at 375px) matching the Figma PLP export
- [ ] **PLPX-02**: Product card snippet renders product image (hover scale 1.05x), title, price, and CTA button with rounded corners and tonal elevation (no border)
- [ ] **PLPX-03**: Collection page includes filtering via Shopify Search & Discovery app-compatible filter UI with sidebar categories on desktop, collapsible on mobile
- [ ] **PLPX-04**: Product card includes a Quick Add button that adds the product to the cart via AJAX and opens the cart drawer without navigating away from the collection

### Product Detail Page

- [ ] **PDPX-01**: Product page renders the hero product image with hover scale animation and a subtle editorial rotation treatment matching the Figma PDP export
- [ ] **PDPX-02**: Variant selector renders product options (size, flavor, etc.) as chip-style buttons and updates price display and available selling plans without page reload
- [ ] **PDPX-03**: Subscription frequency selector renders selling plan options as radio inputs (one-time purchase + subscription frequencies) with one-time pre-selected by default, per Shopify subscription UX guidelines
- [ ] **PDPX-04**: Subscription frequency selector updates a hidden `<input name="selling_plan">` field when a selling plan is selected so that subscription intent is included in the cart POST
- [ ] **PDPX-05**: Add to cart button submits the form via AJAX, adds the item with correct selling plan to the cart, and opens the cart drawer
- [ ] **PDPX-06**: Related products row renders below the PDP content sourcing from a merchant-configured collection or Shopify product recommendations API

### Cart

- [ ] **CART-01**: Cart renders as a slide-in drawer (not a cart page redirect) triggered by header cart icon and Quick Add / ATC events
- [ ] **CART-02**: Cart drawer fetches updated cart HTML via the Section Rendering API (`/?sections=cart-drawer`) after every add/remove/quantity change, replacing inner DOM without full reload
- [ ] **CART-03**: Cart line items display product image, title, variant, quantity controls (increment/decrement/remove), and line price
- [ ] **CART-04**: Subscription items in the cart display their delivery frequency (selling plan name) beneath the product title
- [ ] **CART-05**: Cart drawer displays subtotal and a checkout CTA button linking to `/checkout`
- [ ] **CART-06**: Cart drawer is keyboard-accessible (focus trap while open, Escape to close, focus returns to trigger on close) per WCAG 2.1 AA

### Static Pages

- [ ] **PAGE-01**: Generic `page.json` template renders static content (About, etc.) with merchant-editable content via Theme Editor rich text section
- [ ] **PAGE-02**: `404.json` template renders a custom not-found page with brand styling, a message, and navigation links back to home and collection

## v2 Requirements

### Search

- **SRCH-01**: Predictive search dropdown in header with product results as user types
- **SRCH-02**: Full search results page (`search.json` template)

### Account

- **ACCT-01**: Customer login / register pages with brand styling
- **ACCT-02**: Customer account dashboard (orders, subscription management link)

### Notifications

- **NOTF-01**: Toast / snackbar notification when item is successfully added to cart
- **NOTF-02**: Error messaging on cart/checkout failures

### Performance

- **PERF-01**: Critical CSS inlined in `<head>` for above-the-fold content
- **PERF-02**: Font preloading for Newsreader and Inter

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dark mode | Tailwind `dark:` classes in Figma exports are scaffolding artifacts, not a design requirement |
| Blog / article templates | Not in design exports; not part of BarterBobs v1 |
| Password / coming-soon page | Shopify default acceptable |
| Mobile app | Web-only scope |
| Third-party app integrations (reviews, loyalty) | Not in design scope; left to app embed blocks |
| Harvest Hearth / Rustic Pantry theme switching | Reference docs only; one visual identity implemented |
| Multi-image product gallery / carousel | PDP export shows single hero image — carousel adds complexity for zero design value |
| Customer subscription portal | Handled by subscription app (Recharge/Shopify Subscriptions) not the theme |
| Real-time inventory / stock indicators | Not in design exports |

## Traceability

*Populated during roadmap creation.*

| Requirement | Phase | Status |
|-------------|-------|--------|
| FNDX-01 | — | Pending |
| FNDX-02 | — | Pending |
| FNDX-03 | — | Pending |
| FNDX-04 | — | Pending |
| FNDX-05 | — | Pending |
| FNDX-06 | — | Pending |
| NAVX-01 | — | Pending |
| NAVX-02 | — | Pending |
| NAVX-03 | — | Pending |
| NAVX-04 | — | Pending |
| HOME-01 | — | Pending |
| HOME-02 | — | Pending |
| HOME-03 | — | Pending |
| HOME-04 | — | Pending |
| HOME-05 | — | Pending |
| PLPX-01 | — | Pending |
| PLPX-02 | — | Pending |
| PLPX-03 | — | Pending |
| PLPX-04 | — | Pending |
| PDPX-01 | — | Pending |
| PDPX-02 | — | Pending |
| PDPX-03 | — | Pending |
| PDPX-04 | — | Pending |
| PDPX-05 | — | Pending |
| PDPX-06 | — | Pending |
| CART-01 | — | Pending |
| CART-02 | — | Pending |
| CART-03 | — | Pending |
| CART-04 | — | Pending |
| CART-05 | — | Pending |
| CART-06 | — | Pending |
| PAGE-01 | — | Pending |
| PAGE-02 | — | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 0
- Unmapped: 32 ⚠️

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
