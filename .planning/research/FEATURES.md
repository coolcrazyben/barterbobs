# Feature Research

**Domain:** Shopify OS 2.0 theme — subscription grocery delivery (premium editorial brand)
**Researched:** 2026-03-20
**Confidence:** HIGH (design exports analyzed directly; Shopify official docs verified; subscription UX from shopify.dev/docs)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that users assume exist. Missing these = product feels broken or incomplete. For a premium subscription grocery store on Shopify, these are non-negotiable for launch.

| Feature | Why Expected | Complexity | Shopify Implementation Notes |
|---------|--------------|------------|------------------------------|
| **Glassmorphism sticky nav** | Design exports show `backdrop-filter: blur` fixed header across all pages; users expect persistent nav on any premium site | LOW | Native CSS `position: fixed` + `backdrop-filter` in header section Liquid; `settings_schema.json` toggle for sticky behavior; no JS needed for basic stickiness |
| **Cart drawer (not cart page)** | PROJECT.md explicitly requires drawer; design export `shopping_cart/code.html` is a full-page layout that must be converted to a slide-in drawer; industry standard for subscription e-commerce since 2022 | HIGH | Custom `<cart-drawer>` web component; Section Rendering API to re-render cart HTML after AJAX add-to-cart; POST to `/cart/add.js`, then fetch `/cart.js` and re-render the drawer section; vanilla JS, no external libraries |
| **Subscription frequency selector on PDP** | Core business model — weekly/biweekly/monthly delivery is BarterBobs' primary value proposition; Shopify selling plan API is the required mechanism | HIGH | Requires selling plan app (Shopify Subscriptions native, or Recharge/Bold); Liquid `selling_plan_group`, `selling_plan` objects in product form; hidden `<input name="selling_plan">` updated by JS on selection; radio buttons for <=4 options per Shopify UX guidelines; display savings as percentage not fixed price (currency safety) |
| **Subscription badge / savings display in PDP pricing** | Users must see the discount incentive at point of selection to convert; shopify.dev mandates showing a subscription badge with conditional savings language | LOW | Use `selling_plan_allocation.compare_at_price` vs `selling_plan_allocation.price`; display inline near the selector; update dynamically via JS when plan changes; do not hardcode dollar savings |
| **Selling plan name in cart and checkout** | Users must confirm their frequency choice persists through checkout; Shopify UX guidelines require `selling_plan.name` shown on line items | LOW | Access via `item.selling_plan_allocation.selling_plan.name` in cart Liquid; display below product title in cart drawer and cart summary panel |
| **Product card grid (PLP)** | Expected on any collection page; design export shows `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` with staggered bento-style layout | MEDIUM | Shopify `collection.products` loop in `main-collection-product-grid.liquid` section; product cards as reusable `snippets/product-card.liquid`; aspect-ratio 4:5 per design export |
| **Quick Add to cart from PLP** | Design export shows "Quick Add to Box" button on every PLP card; users expect to add without visiting PDP | MEDIUM | AJAX POST to `/cart/add.js` with variant ID; opens cart drawer on success; requires JS event handler on button click; for subscription products, must default to the lowest frequency selling plan or one-time if no default set |
| **Collection sidebar filters** | Design export shows left sidebar with Categories, Dietary Prefs (Gluten-Free, Vegan, Organic Only), and price range slider | MEDIUM | Native via Shopify Search & Discovery app (free); generates `filter.label` and `filter.values` available in Liquid via `collection.filters`; dietary prefs require product tags or metafields; price range is built-in; 25-filter hard cap applies but BarterBobs catalog is small |
| **Single hero image per PDP** | Design export PDP shows one hero image with hover scale, plus a floating decorative inset image; no multi-image gallery is shown | LOW | Single `product.featured_image` rendered with `image_tag` (srcset auto-generated); hover scale via CSS `transform: scale(1.05)`; floating accent image can be second media slot or a hardcoded design element |
| **Related products / "Complete Your Box"** | Design export PDP shows 4-column "Related Favorites" section at bottom; cross-sell is expected on any product detail page | MEDIUM | Shopify `product.collections.first.products` loop filtered to exclude current product, limited to 4; or use `recommendations` endpoint (`/recommendations/products.json?product_id=`) for algorithmic recommendations; section schema allows merchant to override |
| **"Don't Forget These" cart upsell** | Design export cart shows a 3-item cross-sell grid inside the cart page/drawer; standard on premium subscription carts | MEDIUM | AJAX fetch to `/recommendations/products.json` with cart product IDs; rendered inside drawer section; Section Rendering API re-renders on cart update |
| **Mobile hamburger nav** | Design export hides desktop nav at `md:hidden`; mobile users expect a full-screen or slide-in menu | MEDIUM | Custom `<details-modal>` or `<menu-drawer>` web component; toggle via `aria-expanded`; full-width overlay with nav links; account and cart icons visible at all times |
| **Footer with legal links** | All design exports show identical footer: Privacy, Shipping, Refer a Friend, Wholesale, copyright | LOW | Standard footer section with `settings_schema` link list; Theme Editor configurable nav menu; social icons via Material Symbols or SVG |
| **Search icon / predictive search** | Design exports show search icon in nav header; users expect instant search on any commerce site | MEDIUM | Shopify Predictive Search API (`/search/suggest.json`); custom `<predictive-search>` web component; results render products and collections; debounced on `input` event; no external library needed |
| **Mobile-first responsive at 375/768/1280px** | PROJECT.md requirement; standard expectation for any Shopify theme | LOW | CSS Grid + custom properties; test breakpoints in browser DevTools; Shopify's `image_tag` generates responsive srcset automatically |
| **Semantic HTML + ARIA** | PROJECT.md requirement; accessibility is a legal baseline in most markets | MEDIUM | `<nav aria-label>`, `<main>`, `<header>`, `<footer>`; ARIA `role="dialog"` and `aria-modal="true"` on cart drawer; focus trap in drawer; skip-to-content link |
| **Lazy loading (non-LCP images)** | PROJECT.md requirement; Core Web Vitals penalty if missing; Shopify best practices doc explicitly warns against lazy-loading hero/above-fold | LOW | `loading="lazy"` on all images except hero/LCP; Shopify `image_tag` filter handles `srcset`; hero image gets `fetchpriority="high"` |

---

### Differentiators (Competitive Advantage)

Features that set BarterBobs apart from generic Shopify themes and generic subscription boxes. These implement the "modern provisions editorial" brand.

| Feature | Value Proposition | Complexity | Shopify Implementation Notes |
|---------|-------------------|------------|------------------------------|
| **Asymmetric bento hero layout** | Design export homepage uses `grid md:grid-cols-2` with hero image rotated `rotate-2 scale-105` and a floating accent image `-bottom-6 -left-6`; feels editorial not e-commerce | MEDIUM | CSS `transform: rotate()` on image container; absolute-positioned inset image; no JS needed; Theme Editor settings for image, headline copy, CTA text; `aspect-square` enforced in Liquid |
| **"How it Works" numbered section** | Explicitly explains the subscription model (3 steps: Choose, Set Frequency, Receive); critical for converting first-time subscription shoppers who don't understand recurring delivery | LOW | Static 3-column section with numbered circles using `hero-gradient` background; section schema for step title/body copy; connector dashes via CSS border-dashed; fully Theme Editor–configurable |
| **Brand story / editorial content section** | Design export shows a 2-col layout: large editorial headline left, 2x2 image grid right, pull-quote with red left-border accent; positions brand as a food publication | MEDIUM | OS 2.0 section with `type: "image"` blocks and `type: "richtext"` blocks; pull-quote rendered via Liquid block; image grid is CSS Grid 2x2; section schema with up to 4 image settings |
| **Subscription summary panel in cart** | Design export cart shows sticky sidebar with "Next Delivery" date, subtotal, FREE shipping badge, member perks list — goes beyond standard cart totals | MEDIUM | Liquid `cart` object; `selling_plan_allocation` for frequency; "Next Delivery" date requires subscription app data (Recharge/Bold inject metafields on line items); member perks are static copy managed via section schema |
| **Visual category browsing section** | Design export homepage shows 4-column staggered category cards (`aspect-[3/4]`, `md:mt-12` alternating vertical offset) linking to collections | LOW | Section with up to 6 `type: "collection_card"` blocks; each block: collection picker, optional badge label, image override; CSS staggered offset via `:nth-child(even)` |
| **Testimonials section** | Design export homepage shows 3 editorial testimonial cards with star ratings, italic quote, avatar, name + city | LOW | Section with up to 6 `type: "testimonial"` blocks; each block: quote, name, location, star count (1–5); star rendering via Liquid loop; avatar placeholder as CSS circle |
| **Announcement bar with free shipping CTA** | Design export cart shows "Free shipping on Bob's Boxes over $35" inline; homepage CTA section offers "$20 off first two boxes"; sets conversion expectations immediately | LOW | Separate `announcement-bar` section (header group); scrolling marquee optional; schema settings: message text, background color, link; can be enabled/disabled in Theme Editor |
| **"Bob's Recommendation" editorial card on PDP** | Design export PDP shows a branded curator card (avatar, serif quote, name/title) as a sidebar element; humanizes the curation brand | LOW | Section block of type `richtext` within product section; schema settings: quote text, curator name, curator image, curator title; no dynamic data, merchant-editable |
| **Product badges (Seasonal, Top Pick, Vegan)** | Design export PLP shows colored pill badges overlaid on product images; signals curation and freshness without requiring user action | LOW | Product tags in Shopify (`seasonal`, `top-pick`, `vegan`, `gluten-free`); Liquid `product.tags contains` check in product card snippet; badge color mapped per tag in CSS custom properties |
| **CTA section with gradient background** | Design export homepage ends with a full-width `hero-gradient` rounded card offering "$20 off first two boxes"; drives subscription conversion from browse-to-subscribe | LOW | Section with primary gradient background, headline, subtext, CTA button; schema settings for all copy and button link; no JS needed |
| **Pantry Member Perks in cart** | Design export cart shows a small list of subscription perks ("15% off add-on items", "Priority seasonal access") at the bottom of the order summary; reinforces subscription value at highest-intent moment | LOW | Static list in cart summary section; Theme Editor–configurable via rich text block or list schema; updated by merchant, not dynamic |
| **Staggered product grid offsets on PLP** | Design export PLP uses `asymmetric-stack` class (`rotate(-1deg)`) and alternating vertical offsets on product images for editorial feel | LOW | CSS `transform: rotate(-1deg)` on product image wrapper; alternating `mt-4` via `:nth-child(even)` selector; no JS needed; degrades gracefully to standard grid on mobile |
| **OS 2.0 sections everywhere / Theme Editor** | Every section must be customizable via Theme Editor — headline copy, images, button links, background color; this is BarterBobs-specific because it enables non-developer content updates | MEDIUM | Every section needs a `schema` block with all text/image/color settings; use `settings_schema.json` for global design tokens (primary color, font); JSON template files for all pages |

---

### Anti-Features (Things to Deliberately NOT Build in v1)

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| **Customer subscription portal (manage/skip/cancel)** | Users want to self-service their subscription | This is the subscription app's responsibility (Recharge, Bold, Shopify Subscriptions all provide a hosted portal); building custom portal means owning billing logic, webhook handling, and payment retries — a separate product entirely | Link to app's native portal from account page; do not build custom portal in theme |
| **Filtering with third-party search app (Boost, Searchanise) in v1** | More filter options, instant search, analytics | Adds bundle weight, a monthly app fee, and integration complexity; BarterBobs has a small catalog (~124 items per PLP export); native Search & Discovery app covers dietary, category, and price filters with zero cost | Use Shopify Search & Discovery (free) for v1; re-evaluate when catalog exceeds 5,000 SKUs |
| **Product image zoom modal / lightbox** | Expected on fashion sites; some grocery/specialty food sites use it | For pantry/grocery items, zoom adds complexity (JS library or custom implementation) with low conversion impact; the design export shows a single contained image with `object-contain` and hover scale — not a zoom trigger | CSS `transform: scale(1.05)` on hover is sufficient for grocery products; skip zoom in v1 |
| **Multi-image product gallery with thumbnails** | Standard on apparel/electronics Shopify themes | Design export PDP shows ONE hero image plus a decorative floating accent, not a gallery carousel; grocery products typically have one primary image; building a full gallery adds JS complexity (Swiper, custom carousel) for no design value | Single image per PDP with optional secondary "lifestyle" floating image as designed; add gallery only if merchant adds multiple product photos |
| **Dark mode toggle** | Design exports include `dark:` Tailwind classes suggesting dark mode was considered | Figma exports are light-first; the `dark:` classes in the HTML exports are Tailwind scaffolding, not a design requirement; implementing dark mode doubles the CSS surface area and QA burden | Ignore `dark:` Tailwind classes from exports; implement light mode only with CSS custom properties; dark mode is a v2 enhancement if users request it |
| **Blog / article templates** | Content marketing is valuable for a food brand | PROJECT.md explicitly scopes this out; blog templates require additional JSON templates, section schemas, article cards, tag filtering, and author snippets | Use Shopify's default blog template as fallback; do not build custom blog in theme v1 |
| **Reviews section (custom)** | Social proof is critical for subscription conversion | Building a reviews UI means no actual review data; reviews require a third-party app (Judge.me, Yotpo, Okendo) that injects via app blocks; the PROJECT.md scopes out app integrations | Reserve app block slot in product section schema for reviews app; do not build custom review UI; the testimonials section covers static social proof for launch |
| **Loyalty / points display** | Subscription brands often have loyalty programs | Out of scope per PROJECT.md; requires app integration (Smile.io, LoyaltyLion); complex to implement without backend context | Theme should not reference loyalty; leave footer "Refer a Friend" link as a plain anchor to a future landing page |
| **Infinite scroll on PLP** | Feels modern; avoids pagination | Infinite scroll breaks browser back-button, breaks analytics, and makes footer inaccessible; for a curated grocery catalog (124 items), pagination or a "Discover More" load-more button is superior | Load-more button (per design export: "Discover More Favorites"); renders next page via Section Rendering API without full reload |
| **Variant swatches (color/size)** | Standard on apparel themes | Grocery/pantry products rarely have multiple variants in the same product; BarterBobs' product complexity is subscription frequency (weekly/biweekly/monthly), not product variants | Subscription frequency selector IS the variant UX; skip color/size swatches unless catalog requires it |

---

## Feature Dependencies

```
Cart Drawer (AJAX)
    └──requires──> Section Rendering API (Shopify native)
                       └──requires──> Cart Liquid section file

Subscription Frequency Selector (PDP)
    └──requires──> Selling Plan App (Shopify Subscriptions / Recharge / Bold)
                       └──required before theme development to test Liquid objects

Quick Add (PLP)
    └──requires──> Cart Drawer
                       └──requires──> AJAX add-to-cart JS

Selling Plan Name in Cart
    └──requires──> Subscription Frequency Selector (PDP)

Subscription Summary Panel (Cart)
    └──requires──> Selling Plan App (for "Next Delivery" date)
                       └──MEDIUM dependency: "Next Delivery" may need app line item property, not native Liquid

Cart Upsell ("Don't Forget These")
    └──requires──> Cart Drawer
    └──enhances──> Related Products (shared recommendations logic)

Collection Sidebar Filters
    └──requires──> Shopify Search & Discovery app (free, must be installed)
    └──requires──> Product tags or metafields (dietary: vegan, gluten-free, organic)

Product Badges (PLP)
    └──requires──> Product tags convention (must be documented for merchant)

OS 2.0 Sections Everywhere
    └──requires──> JSON templates for all page types (product, collection, page, index)
    └──requires──> section schema blocks in all Liquid section files

Predictive Search
    └──requires──> `<predictive-search>` web component (custom JS)
    └──requires──> Shopify Predictive Search API (enabled by default, no app)
```

### Dependency Notes

- **Subscription Frequency Selector requires Selling Plan App:** The Liquid objects `selling_plan_group`, `selling_plan`, and `selling_plan_allocation` only render when a subscription app has configured selling plans for a product. Theme development should use a test store with Shopify Subscriptions (native, free) installed to verify these objects exist before building the selector UI.
- **Quick Add requires Cart Drawer:** The Quick Add button's success handler opens the drawer. If Cart Drawer is not implemented first, Quick Add has nowhere to direct the user.
- **Collection Filters require Search & Discovery app:** The `collection.filters` Liquid object is only populated when the free Shopify Search & Discovery app is installed and filters are configured. This is a zero-cost dependency but must be installed in the store before filter UI is built.
- **"Next Delivery" date in cart summary has uncertain dependency:** Shopify's native cart Liquid does not expose a next delivery date. Recharge and Bold inject this as a line item property. If using Shopify Subscriptions (native), this date may not be surfaced in Liquid — display as "Your frequency: [plan name]" as a safe fallback.

---

## MVP Definition

### Launch With (v1)

These are the features BarterBobs needs to complete the core user journey: land → browse → select frequency → add to cart → checkout.

- [ ] Glassmorphism sticky nav with cart icon, search icon, hamburger (mobile) — all pages share this header
- [ ] Cart drawer with AJAX add-to-cart, line item quantity controls, selling plan name display, subscription summary panel, cart upsell grid
- [ ] Homepage: hero section, pillars/philosophy section, visual category browsing section, brand story section, "How it Works" section, testimonials section, CTA section
- [ ] PLP: editorial header, sidebar filters (category + dietary + price), product card grid with badges, Quick Add buttons, load-more button
- [ ] PDP: single hero image, product title/price/badge, subscription frequency selector (radio for <=4 plans, dropdown for more), Add to Box button, "Pantry Story" description + ingredient/nutrition grid, "Bob's Recommendation" editorial card, Related Favorites 4-up grid
- [ ] Announcement bar section (shipping/promo messaging)
- [ ] Footer section with nav links and copyright
- [ ] About page and 404 page (static, minimal)
- [ ] OS 2.0 JSON templates for all pages with full Theme Editor customizability
- [ ] Lazy loading (non-hero images), `image_tag` srcset, `fetchpriority="high"` on hero
- [ ] `shopify theme check` passing with zero errors and warnings

### Add After Validation (v1.x)

Features to add once the core is shipping and validated with real users.

- [ ] Predictive search flyout — add after launch when catalog is indexed; validates that users search rather than browse
- [ ] Cart upsell recommendations from Shopify recommendations API — v1 can use static featured products as a placeholder; switch to algorithmic after store has order history
- [ ] Announcement bar marquee scroll animation — nice-to-have polish, not conversion-critical
- [ ] Schema markup (JSON-LD for Product, BreadcrumbList) — SEO benefit; add after core pages are stable

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Dark mode — requires doubling CSS surface area; defer until brand feedback confirms demand
- [ ] Blog / editorial recipes section — high value for food brand but out of scope in PROJECT.md; requires article template, tag filtering, author section
- [ ] Wishlist / "Save for Later" — requires customer accounts to be meaningful; adds JS complexity for local storage fallback
- [ ] Customer subscription portal (manage frequency, skip, cancel) — owned by subscription app; only invest in custom UI if app's portal is a conversion problem
- [ ] Loyalty perks visible in UI — requires loyalty app integration; design space for it in footer/account area

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Cart drawer (AJAX) | HIGH | HIGH | P1 |
| Subscription frequency selector (PDP) | HIGH | HIGH | P1 |
| Homepage hero + category sections | HIGH | MEDIUM | P1 |
| Product card grid + Quick Add (PLP) | HIGH | MEDIUM | P1 |
| PDP layout + Bob's Recommendation card | HIGH | LOW | P1 |
| Sticky glassmorphism header | HIGH | LOW | P1 |
| Footer + announcement bar | MEDIUM | LOW | P1 |
| Collection sidebar filters | MEDIUM | MEDIUM | P1 |
| Related products (PDP) | MEDIUM | MEDIUM | P1 |
| Cart subscription summary panel | MEDIUM | MEDIUM | P1 |
| OS 2.0 sections / Theme Editor | HIGH | MEDIUM | P1 |
| Mobile hamburger nav | HIGH | MEDIUM | P1 |
| Lazy loading + srcset (Core Web Vitals) | HIGH | LOW | P1 |
| Product badges (PLP) | MEDIUM | LOW | P1 |
| Predictive search | MEDIUM | MEDIUM | P2 |
| Cart upsell (algorithmic) | MEDIUM | MEDIUM | P2 |
| Announcement bar marquee animation | LOW | LOW | P2 |
| Schema markup (JSON-LD) | MEDIUM | LOW | P2 |
| Blog / editorial section | HIGH | HIGH | P3 |
| Dark mode | LOW | HIGH | P3 |
| Customer subscription portal | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

Analyzed: Canopy (Clean Canvas), Local (Krown Themes), Shapes — the three most-cited premium Shopify themes for subscription/food brands. Also compared against Shopify's own Dawn and Horizon.

| Feature | Canopy / Local (Market Leaders) | Dawn / Horizon (Shopify Default) | BarterBobs Approach |
|---------|-------------------------------|----------------------------------|---------------------|
| Cart | Drawer with quantity controls | Drawer (Horizon), page (Dawn default) | Drawer — confirmed in PROJECT.md and design export |
| Subscription selector | Radio buttons, relies on app | Radio buttons, Shopify guidelines | Radio buttons (<=4 options), pill buttons for sub-frequency within plan, savings % shown inline |
| Collection filtering | Search & Discovery native + sidebar | Search & Discovery native | Search & Discovery native — adequate for <5,000 SKU catalog |
| Product gallery | Multi-image + zoom (Canopy) | Multi-image carousel (Horizon) | Single hero image — per design export; grocery products need one clear image not a gallery |
| Homepage sections | 12–20 configurable sections | 12+ sections (Horizon) | 7 focused sections matching design exports; merchant can reorder/hide via Theme Editor |
| Typography | Generic system fonts or Google Fonts picker | System fonts (Horizon) | Newsreader (serif display) + Inter (body) — hardcoded as brand fonts, not generic picker |
| Brand differentiation | Template-feel with color customization | Neutral, highly adaptable | Editorial asymmetry, grain texture, tonal layering — visual system not achievable in off-shelf themes |
| Subscription summary in cart | None (standard subtotal) | None (standard subtotal) | Subscription Summary panel: next delivery label, member perks, free shipping badge — differentiator |
| Product badges | Tag-based (standard) | Tag-based | Tag-based with brand-specific label taxonomy (Seasonal, Top Pick, Vegan) |

---

## Sources

- Shopify subscription UX guidelines: [https://shopify.dev/docs/storefronts/themes/pricing-payments/subscriptions/subscription-ux-guidelines](https://shopify.dev/docs/storefronts/themes/pricing-payments/subscriptions/subscription-ux-guidelines) — HIGH confidence (official Shopify docs)
- Shopify add subscriptions to theme: [https://shopify.dev/docs/storefronts/themes/pricing-payments/subscriptions/add-subscriptions-to-your-theme](https://shopify.dev/docs/storefronts/themes/pricing-payments/subscriptions/add-subscriptions-to-your-theme) — HIGH confidence (official Shopify docs)
- Shopify Cart AJAX API reference: [https://shopify.dev/docs/api/ajax/reference/cart](https://shopify.dev/docs/api/ajax/reference/cart) — HIGH confidence (official Shopify docs)
- Shopify collection filtering with metafields: [https://help.shopify.com/en/manual/custom-data/metafields/filtering-products](https://help.shopify.com/en/manual/custom-data/metafields/filtering-products) — HIGH confidence (official Shopify Help Center)
- Shopify predictive search: [https://shopify.dev/docs/storefronts/themes/navigation-search/search/predictive-search](https://shopify.dev/docs/storefronts/themes/navigation-search/search/predictive-search) — HIGH confidence (official Shopify docs)
- Shopify theme performance best practices: [https://shopify.dev/docs/storefronts/themes/best-practices/performance](https://shopify.dev/docs/storefronts/themes/best-practices/performance) — HIGH confidence (official Shopify docs)
- Shopify OS 2.0 architecture: [https://www.shopify.com/partners/blog/shopify-online-store](https://www.shopify.com/partners/blog/shopify-online-store) — HIGH confidence (official Shopify partners blog)
- Best Shopify subscription themes (competitor feature analysis): [https://www.loopwork.co/blog/best-shopify-themes-for-subscription-box-stores](https://www.loopwork.co/blog/best-shopify-themes-for-subscription-box-stores) — MEDIUM confidence (third-party analysis, multiple themes reviewed)
- BarterBobs design exports (primary source): `stitch_barterbobs_landing_page/` — HIGH confidence (authoritative design source per PROJECT.md)

---

*Feature research for: Shopify OS 2.0 theme, subscription grocery delivery, premium editorial brand*
*Researched: 2026-03-20*
