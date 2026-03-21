# Architecture Research

**Domain:** Shopify OS 2.0 Custom Theme (BarterBobs — subscription grocery)
**Researched:** 2026-03-20
**Confidence:** HIGH — primary sources are shopify.dev official docs and Dawn reference theme

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SHOPIFY PLATFORM                                │
│  (product, collection, cart, customer objects served via Liquid context) │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │ Liquid render pipeline
┌───────────────────────────▼─────────────────────────────────────────────┐
│                     layout/theme.liquid                                  │
│  <head>: CSS tokens, base.css, global.js (deferred)                     │
│  <body>: {% sections 'header-group' %}                                   │
│           {{ content_for_layout }}   ← templates inject here            │
│           {% sections 'footer-group' %}                                  │
└───────┬───────────────────┬──────────────────────┬───────────────────────┘
        │                   │                      │
┌───────▼──────┐   ┌────────▼──────────┐  ┌───────▼──────────────┐
│ sections/    │   │ templates/*.json  │  │ sections/            │
│ header-group │   │ (JSON templates)  │  │ footer-group.json    │
│ .json        │   │ index.json        │  │ (section group)      │
│ (sect.group) │   │ product.json      │  └──────────────────────┘
└───────┬──────┘   │ collection.json   │
        │          │ cart.json         │
        │          │ page.json         │
        │          └────────┬──────────┘
        │                   │ references sections by type + ID
        │         ┌─────────▼──────────────────────────────────────┐
        │         │              sections/*.liquid                  │
        │         │  main-product.liquid   section-hero.liquid      │
        │         │  main-collection.liquid  section-featured.liquid│
        │         │  cart-drawer.liquid    section-about.liquid     │
        │         │  (each has {% schema %} block at bottom)        │
        │         └─────────┬──────────────────────────────────────┘
        │                   │ {% render 'snippet-name', var: val %}
        │         ┌─────────▼──────────────────────────────────────┐
        │         │             snippets/*.liquid                   │
        │         │  product-card.liquid    icon-*.liquid           │
        │         │  price.liquid           product-media.liquid    │
        │         │  variant-picker.liquid  quantity-input.liquid   │
        │         └────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────────────┐
│                          assets/                                         │
│  base.css          — global resets, typography scale, CSS custom props  │
│  component-*.css   — per-component styles (loaded via section schema)   │
│  global.js         — web component definitions, helpers, pubsub         │
│  cart-drawer.js    — cart drawer web component + AJAX logic             │
│  variant-selects.js — variant picker web component                      │
│  subscription-form.js — frequency selector logic (BarterBobs-specific) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Location | Responsibility | Communicates With |
|-----------|----------|----------------|-------------------|
| `theme.liquid` | `layout/` | HTML shell, global CSS/JS, head meta | section groups, all templates |
| `header-group.json` | `sections/` | Section group container for header + nav | `sections/header.liquid` |
| `footer-group.json` | `sections/` | Section group container for footer | `sections/footer.liquid` |
| `header.liquid` | `sections/` | Glassmorphism nav, logo, cart icon, menu | cart drawer (custom event), nav drawer |
| `footer.liquid` | `sections/` | Footer links, brand copy, social | none |
| JSON templates (`index.json`, `product.json`, etc.) | `templates/` | Page assembly — declares which sections render in order | sections by type |
| `main-product.liquid` | `sections/` | PDP: gallery, variant picker, subscription form, ATC | `snippets/price.liquid`, `snippets/variant-picker.liquid`, `snippets/product-media.liquid` |
| `main-collection.liquid` | `sections/` | PLP: product grid, filters, pagination | `snippets/product-card.liquid`, `snippets/price.liquid` |
| `cart-drawer.liquid` | `sections/` | Slide-in cart: line items, totals, checkout CTA | Cart AJAX API, Section Rendering API |
| `section-hero.liquid` | `sections/` | Homepage hero (editorial banner) | none |
| `section-featured-products.liquid` | `sections/` | Homepage curated product row | `snippets/product-card.liquid` |
| `product-card.liquid` | `snippets/` | Reusable product tile (image, title, price) | `snippets/price.liquid` |
| `price.liquid` | `snippets/` | Price display with compare-at, sale badge | none |
| `variant-picker.liquid` | `snippets/` | Variant selector radio/select inputs | `variant-selects.js` (web component) |
| `product-media.liquid` | `snippets/` | Image gallery / media display logic | none |
| `quantity-input.liquid` | `snippets/` | Quantity stepper +/- | `global.js` QuantityInput web component |
| `global.js` | `assets/` | Web component definitions, helpers, pubsub | all interactive components |
| `cart-drawer.js` | `assets/` | Cart drawer open/close, AJAX calls, DOM swap | Cart AJAX API, Section Rendering API |
| `variant-selects.js` | `assets/` | Variant selection logic, URL + form update | product form, price snippet |
| `subscription-form.js` | `assets/` | Frequency selector (weekly/biweekly/monthly), selling plan | Cart AJAX API |

---

## Recommended Project Structure

```
barterbobs-theme/
├── assets/
│   ├── base.css                     # Global resets, CSS custom properties (design tokens)
│   ├── component-cart-drawer.css    # Cart drawer styles
│   ├── component-product-form.css   # PDP form, variant picker, subscription selector
│   ├── component-collection.css     # PLP grid + filters
│   ├── component-header.css         # Glassmorphism nav styles
│   ├── component-hero.css           # Homepage hero styles
│   ├── global.js                    # Web component base classes, helpers, pubsub
│   ├── cart-drawer.js               # Cart drawer component + AJAX cart logic
│   ├── variant-selects.js           # Variant selector web component
│   └── subscription-form.js         # Subscription frequency selector
│
├── config/
│   ├── settings_schema.json         # Global theme settings for Theme Editor
│   └── settings_data.json           # Saved merchant settings (auto-managed)
│
├── layout/
│   └── theme.liquid                 # Single layout file — HTML shell
│
├── locales/
│   ├── en.default.json              # All UI strings in English
│   └── en.default.schema.json       # Schema label translations
│
├── sections/
│   ├── header-group.json            # Section group: header area
│   ├── footer-group.json            # Section group: footer area
│   ├── header.liquid                # Nav, logo, cart trigger
│   ├── footer.liquid                # Footer links + copy
│   ├── cart-drawer.liquid           # Slide-in cart drawer
│   ├── main-product.liquid          # PDP section
│   ├── main-collection.liquid       # PLP section
│   ├── main-page.liquid             # Generic page (About, etc.)
│   ├── main-404.liquid              # 404 error page
│   ├── section-hero.liquid          # Homepage hero banner
│   ├── section-featured-products.liquid  # Curated product row
│   ├── section-editorial-text.liquid     # Full-width text/copy blocks
│   ├── section-image-banner.liquid       # Image + text overlay
│   └── section-announcement-bar.liquid  # Top banner (optional)
│
├── snippets/
│   ├── product-card.liquid          # Reusable product tile
│   ├── price.liquid                 # Price + compare-at display
│   ├── variant-picker.liquid        # Variant selector inputs
│   ├── product-media.liquid         # Gallery / image display
│   ├── quantity-input.liquid        # +/- stepper
│   ├── cart-line-item.liquid        # Single cart item row
│   ├── subscription-selector.liquid # Frequency radio buttons
│   ├── icon-cart.liquid             # SVG icon
│   ├── icon-close.liquid            # SVG icon
│   └── meta-tags.liquid             # SEO head tags
│
└── templates/
    ├── index.json                   # Homepage
    ├── product.json                 # PDP (default)
    ├── collection.json              # PLP / collection
    ├── cart.json                    # Cart page (fallback, not primary UX)
    ├── page.json                    # Generic pages (About)
    ├── 404.json                     # 404 error
    ├── search.json                  # Search results
    └── customers/
        ├── account.json
        ├── login.json
        └── register.json
```

### Structure Rationale

- **`sections/` contains all merchant-editable content:** Everything a merchant can configure in the Theme Editor lives here. No Liquid logic lives directly in templates.
- **`snippets/` contains reusable non-configurable fragments:** Product card, price, icons — these are called from sections with `{% render %}` and accept explicit parameters. They do not appear in the Theme Editor.
- **`assets/` is split into base + component files:** `base.css` holds global tokens and resets. Component CSS files are referenced inside their corresponding section via `{% stylesheet %}` so Shopify deduplicates automatically. JS follows the same pattern.
- **Section groups for header/footer:** `header-group.json` and `footer-group.json` live in `sections/` and are referenced in `theme.liquid` with `{% sections 'header-group' %}`. This enables merchant customization of header/footer without touching layout code.
- **CSS custom properties in `base.css`:** All design tokens (colors, fonts, spacing, radius) defined as `--bb-color-*`, `--bb-font-*`, etc., sourced from `settings_schema.json` color/font pickers where applicable.

---

## Architectural Patterns

### Pattern 1: JSON Template + Dedicated Main Section

**What:** Every page type gets a JSON template that references exactly one "main" section. The main section handles the primary page content; additional sections above/below are purely editorial (banners, featured products, etc.).

**When to use:** Every page type — product, collection, page, 404, homepage.

**Why OS 2.0 specific:** In OS 1.0 patterns, Liquid templates contained markup directly. In OS 2.0, the template is pure JSON data; all markup lives in sections. This is required for Theme Editor drag-and-drop support.

```json
// templates/product.json
{
  "sections": {
    "main": {
      "type": "main-product",
      "blocks": {
        "vendor": { "type": "text", "settings": {} },
        "title": { "type": "title", "settings": {} },
        "price": { "type": "price", "settings": {} },
        "subscription": { "type": "subscription-selector", "settings": {} },
        "quantity": { "type": "quantity-selector", "settings": {} },
        "buy-buttons": { "type": "buy-buttons", "settings": {} },
        "description": { "type": "description", "settings": {} }
      },
      "block_order": ["vendor", "title", "price", "subscription", "quantity", "buy-buttons", "description"]
    }
  },
  "order": ["main"]
}
```

### Pattern 2: Section Groups for Layout-Level Areas

**What:** Header and footer are `section group` JSON files in `sections/`. They are referenced in `theme.liquid` with the `{% sections %}` plural tag, not the singular `{% section %}` tag.

**When to use:** Any content that wraps all page templates — header, footer, aside.

**Why it matters:** Without section groups, header and footer cannot be edited via the Theme Editor (OS 1.0 limitation). Section groups bring them into the "sections everywhere" model.

```liquid
{{- /* layout/theme.liquid */ -}}
{% sections 'header-group' %}
<main id="MainContent">
  {{ content_for_layout }}
</main>
{% sections 'footer-group' %}
```

```json
// sections/header-group.json
{
  "type": "header",
  "name": "Header",
  "sections": {
    "header": {
      "type": "header",
      "settings": {}
    }
  },
  "order": ["header"]
}
```

### Pattern 3: Web Components for Interactive UI

**What:** JavaScript behaviour is encapsulated as native Web Components (`customElements.define`). Each component extends `HTMLElement`, manages its own state, and communicates via `CustomEvent` dispatched on the document.

**When to use:** Any interactive UI element — cart drawer, variant selector, quantity stepper, subscription frequency picker, nav drawer.

**Why vanilla JS / no framework:** Shopify theme constraint (BarterBobs requirement). Web components give component isolation without a framework. Dawn uses this pattern throughout `global.js`.

```javascript
// assets/cart-drawer.js
class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', this.onButtonClick.bind(this));
  }

  open() {
    this.setAttribute('open', '');
    document.body.classList.add('overflow-hidden');
    trapFocus(this);
  }

  close() {
    this.removeAttribute('open');
    document.body.classList.remove('overflow-hidden');
    removeTrapFocus();
  }

  // Re-render via Section Rendering API after cart mutation
  async renderContents(parsedState) {
    const response = await fetch(
      `${window.Shopify.routes.root}?sections=cart-drawer`
    );
    const sectionsData = await response.json();
    this.innerHTML = new DOMParser()
      .parseFromString(sectionsData['cart-drawer'], 'text/html')
      .querySelector('.cart-drawer__content').innerHTML;
  }
}
customElements.define('cart-drawer', CartDrawer);
```

### Pattern 4: Cart Drawer with Section Rendering API

**What:** Add-to-cart submits via AJAX to `/cart/add.js`. The response includes cart data. A follow-up request (or bundled `sections` parameter) fetches re-rendered cart section HTML via the Section Rendering API. The HTML replaces the cart drawer's inner DOM without a page reload.

**When to use:** Cart drawer implementation — the only cart UX pattern for BarterBobs.

**Request flow:**
```
User clicks "Add to Cart"
    ↓
POST /cart/add.js  { items: [{ id: variantId, quantity: N, selling_plan: planId }] }
    ↓
Response: line item JSON (confirms added)
    ↓
GET /?sections=cart-drawer  (Section Rendering API)
    ↓
Response: { "cart-drawer": "<html string of re-rendered section>" }
    ↓
Replace cart-drawer inner HTML + open drawer
    ↓
Dispatch CustomEvent('cart:updated') for cart count badge in header
```

**Key constraint:** Section Rendering API renders up to 5 sections per call. For BarterBobs, only `cart-drawer` needs re-rendering on ATC. The header cart count badge updates via the `cart:updated` custom event handled in header JS.

### Pattern 5: Snippet Isolation via render Tag

**What:** Snippets are included with `{% render %}` (not the deprecated `{% include %}`). Snippets have isolated scope — they cannot access variables from the calling template unless explicitly passed as parameters.

**When to use:** All snippet inclusions.

**Why it matters (OS 2.0 specific):** `{% include %}` is deprecated and leaks scope. `{% render %}` enforces isolation. Snippets can still access global Liquid objects (`product`, `collection`, `cart`) because those are context objects, not template variables.

```liquid
{{- /* Pass explicit parameters — never rely on leaked scope */ -}}
{% render 'product-card',
   product: product,
   show_vendor: section.settings.show_vendor,
   lazy_load: forloop.index > 2
%}
```

---

## Data Flow

### Shopify Object Model → Liquid → Rendered HTML

```
Shopify Platform
  └── product object (title, variants, media, metafields, selling_plan_groups)
  └── collection object (title, products, filters)
  └── cart object (items, total_price, item_count)
  └── shop object (name, currency, locale)
        ↓
  layout/theme.liquid
  (has access to: shop, cart, customer, request)
        ↓
  JSON template (product.json / collection.json / index.json)
  (declares section list + stored settings)
        ↓
  sections/*.liquid
  (has access to: section.settings, section.blocks, product, collection, cart)
        ↓ {% render 'snippet', product: product %}
  snippets/*.liquid
  (has access to: explicitly passed parameters + global context objects)
        ↓
  Rendered HTML served to browser
        ↓
  Web components hydrate (CartDrawer, VariantSelects, SubscriptionForm)
  Client-side state: cart count, selected variant, selected selling plan
```

### Key Data Flows

1. **PDP variant selection:** User selects variant option → `VariantSelects` web component updates selected variant → updates URL params, updates price display, updates ATC button state, updates product images. All via DOM manipulation and JS; no Liquid re-render needed.

2. **PDP subscription frequency:** User selects frequency → `SubscriptionForm` captures `selling_plan` ID from radio button data attribute → selling_plan ID passed in cart/add.js payload.

3. **Add to cart → drawer open:** ATC button submit → JS intercepts form submit → POST `/cart/add.js` → GET `/?sections=cart-drawer` → replace drawer HTML → open drawer → dispatch `cart:updated` event → header cart count badge re-reads from cart object (via small fetch to `/cart.js`).

4. **PLP collection filtering:** URL param updated by filter form → page reload with filtered `collection` object → `main-collection.liquid` re-renders grid. (Standard Shopify filter behavior; no AJAX needed for MVP.)

5. **Settings data flow:** `settings_schema.json` defines global settings (colors, fonts, social links) → `config/settings_data.json` stores merchant values → accessible in Liquid via `settings.color_primary`, etc. → CSS custom properties set inline in `theme.liquid` head.

### State Management

```
Client-Side State (JavaScript)
  CartDrawer.isOpen    — managed by web component attribute
  selected variant     — managed by VariantSelects, stored in form hidden input
  selling_plan ID      — managed by SubscriptionForm, stored in form hidden input
  cart item count      — fetched from /cart.js on cart:updated event

Server-Side State (Shopify / Liquid)
  cart contents        — authoritative via Shopify session
  product variants     — from product object, serialized to JS via JSON filter
  section settings     — from settings_data.json, section schema

Cross-Boundary Events (CustomEvent on document)
  'cart:updated'       — dispatched after any cart mutation; header badge listens
  'variant:change'     — dispatched by VariantSelects; price snippet, media listen
```

---

## OS 2.0 vs OS 1.0 Distinctions

These are the architectural decisions that are OS 2.0 specific and must not be confused with older patterns:

| Aspect | OS 1.0 (old, avoid) | OS 2.0 (required) |
|--------|---------------------|-------------------|
| Templates | `product.liquid` with markup | `product.json` referencing sections |
| Sections on non-homepage | Not supported | Supported everywhere ("sections everywhere") |
| Header/footer customization | Hardcoded in `theme.liquid` | Section groups (`{% sections 'header-group' %}`) |
| Dynamic sections | Homepage only | All JSON templates |
| Section tag (singular) | Used for all sections | Only for statically placed single sections |
| Sections tag (plural) | Did not exist | Required for section groups |
| Cart drawer data update | Full page reload or custom AJAX | Section Rendering API + bundled section rendering |
| App blocks | Not supported | `"blocks": [{ "type": "@app" }]` in section schema |

---

## Build Order (Recommended Phase Sequence)

The architecture has a strict dependency chain. Lower layers must exist before upper layers can render correctly.

```
LAYER 1 — Foundation (no dependencies)
  ├── config/settings_schema.json     (defines CSS custom property sources)
  ├── assets/base.css                 (CSS custom properties, resets, typography)
  ├── layout/theme.liquid             (HTML shell — needs base.css, section groups)
  ├── locales/en.default.json         (all UI strings)
  └── locales/en.default.schema.json

LAYER 2 — Layout Frame (depends on Layer 1)
  ├── sections/header-group.json      (section group container)
  ├── sections/footer-group.json      (section group container)
  ├── sections/header.liquid          (nav + cart icon)
  └── sections/footer.liquid          (links + copy)

LAYER 3 — Global JS Infrastructure (depends on Layer 1)
  ├── assets/global.js               (web component base, helpers, pubsub)
  └── assets/cart-drawer.js          (depends on global.js utilities)

LAYER 4 — Core Snippets (depends on Layers 1-2)
  ├── snippets/price.liquid
  ├── snippets/product-media.liquid
  ├── snippets/product-card.liquid   (depends on price, product-media)
  ├── snippets/variant-picker.liquid
  ├── snippets/quantity-input.liquid
  ├── snippets/subscription-selector.liquid
  └── snippets/cart-line-item.liquid

LAYER 5 — Page Sections (depends on Layers 1-4)
  ├── sections/cart-drawer.liquid     (depends on cart-line-item snippet + cart-drawer.js)
  ├── sections/main-product.liquid    (depends on price, media, variant-picker, subscription-selector)
  ├── sections/main-collection.liquid (depends on product-card)
  ├── sections/main-page.liquid
  ├── sections/main-404.liquid
  ├── sections/section-hero.liquid
  └── sections/section-featured-products.liquid

LAYER 6 — Component JS (depends on Layers 3, 5)
  ├── assets/variant-selects.js      (depends on main-product section existing)
  └── assets/subscription-form.js    (depends on main-product section existing)

LAYER 7 — JSON Templates (depends on Layers 5-6)
  ├── templates/index.json
  ├── templates/product.json
  ├── templates/collection.json
  ├── templates/cart.json
  ├── templates/page.json
  └── templates/404.json
```

**Practical implication for phases:**
- Phase 1 can only be: settings schema + base CSS + theme.liquid shell + section groups + header/footer. Nothing else will render without this foundation.
- Cart drawer depends on global.js being loaded — build JS infrastructure before interactive components.
- main-product.liquid is the most complex section (highest dependency count). Build it last among sections but before product.json template.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Shopify Cart AJAX API | `fetch('/cart/add.js')`, `fetch('/cart/change.js')`, `fetch('/cart.js')` | Always use `window.Shopify.routes.root` prefix for locale-awareness |
| Shopify Section Rendering API | `fetch('/?sections=cart-drawer')` | Renders sections server-side, returns HTML strings keyed by section ID. Limit: 5 sections per request |
| Shopify Selling Plans (subscriptions) | `selling_plan` ID passed in cart add payload; `product.selling_plan_groups` iterated in Liquid | Selling plan IDs are dynamic — serialize to JS via `{{ product.selling_plan_groups | json }}` |
| Shopify Theme Editor (customizer) | `section.settings`, `section.blocks`, `settings.*` objects in Liquid | Real-time updates require sections to be self-contained and re-renderable |
| Google Fonts / Shopify Font Library | `font_picker` setting type in settings_schema.json | Newsreader and Inter/Plus Jakarta Sans; use `font_face` filter for @font-face output |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `theme.liquid` ↔ sections | `{% sections 'group-name' %}` and `{{ content_for_layout }}` | Layout never renders section markup directly — always via these two mechanisms |
| Sections ↔ snippets | `{% render 'snippet', param: value %}` | Strict scope isolation; always pass required data explicitly |
| JS ↔ Liquid | `{{ product | json }}` serialized to `<script>` data block or `data-*` attributes | One-way bridge at page render time; no Liquid in JS files |
| JS components ↔ each other | `document.dispatchEvent(new CustomEvent('cart:updated'))` | Pub/sub pattern using native browser events; no shared global state objects |
| Cart drawer ↔ header badge | `cart:updated` CustomEvent → header JS fetches `/cart.js` for count | Loose coupling; header and cart drawer don't import each other |
| Variant picker ↔ price display | `variant:change` CustomEvent with variant data payload | Price snippet listens and updates; decoupled from picker implementation |

---

## Scaling Considerations

This is a Shopify theme — scaling is Shopify's infrastructure concern, not the theme's. The theme's performance concerns are about browser-side rendering and asset loading.

| Concern | Approach |
|---------|----------|
| CSS bundle size | Component CSS in `{% stylesheet %}` tags; Shopify deduplicates; target < 50KB total |
| JS bundle size | No frameworks; web components only; target < 30KB gzipped |
| Image loading | `loading="lazy"` + `srcset` via `image_tag` filter; explicit `width`/`height` attributes |
| LCP (Largest Contentful Paint) | Hero image preloaded in `<head>`; defer all non-critical JS with `defer` attribute |
| CLS (Cumulative Layout Shift) | Explicit aspect ratios on all image containers; no dynamic insertion above fold |
| Theme Editor performance | Sections must re-render in isolation; avoid cross-section JS dependencies that break on section re-render |

---

## Anti-Patterns

### Anti-Pattern 1: Markup in JSON Templates

**What people do:** Write Liquid markup directly in `templates/product.liquid` instead of converting to `product.json` + sections.

**Why it's wrong:** Blocks Theme Editor customization. Sections can't be added/removed/reordered. App blocks cannot be inserted. The entire OS 2.0 architecture is bypassed.

**Do this instead:** All markup in `sections/main-product.liquid`. Template is `templates/product.json` with section reference only.

### Anti-Pattern 2: Hardcoding Header/Footer in theme.liquid

**What people do:** Put header and footer markup directly in `layout/theme.liquid` with `{% section 'header' %}` (singular).

**Why it's wrong:** Static section rendered via singular `{% section %}` tag cannot be extended with additional sections in the Theme Editor. Merchants cannot add announcement bars, promo banners, etc. above or below header/footer.

**Do this instead:** Use `{% sections 'header-group' %}` (plural) and a `sections/header-group.json` section group file.

### Anti-Pattern 3: Using {% include %} Instead of {% render %}

**What people do:** Use `{% include 'snippet-name' %}` which is the OS 1.0 pattern.

**Why it's wrong:** `{% include %}` is deprecated and leaks parent scope into the snippet. Creates invisible dependencies. Will eventually be removed by Shopify.

**Do this instead:** `{% render 'snippet-name', explicit_var: value %}`. Pass all required data explicitly.

### Anti-Pattern 4: Monolithic CSS/JS Files

**What people do:** Put all CSS in one `theme.css` and all JS in one `theme.js` loaded globally.

**Why it's wrong:** Every page loads all CSS and JS even for components not on that page. Defeats Shopify's asset bundling optimization. Hard to maintain.

**Do this instead:** Component CSS in `{% stylesheet %}` tags inside section files. Component JS in dedicated files (`cart-drawer.js`, `variant-selects.js`) loaded only where needed.

### Anti-Pattern 5: Serializing Variant Data Incorrectly

**What people do:** Try to access variant-specific data (prices, metafields) in Liquid after a variant change without a page reload.

**Why it's wrong:** Liquid is server-rendered once at page load. Variant changes happen client-side. Liquid cannot re-run on variant switch.

**Do this instead:** Serialize all variant data to JavaScript at page load via `{{ product.variants | json }}`. The JS variant selector reads from this pre-loaded data object to update prices, availability, and images without any server roundtrip.

```liquid
{{- /* In main-product.liquid — serialize all variant data once */ -}}
<script>
  window.productVariants = {{ product.variants | json }};
  window.sellingPlanGroups = {{ product.selling_plan_groups | json }};
</script>
```

### Anti-Pattern 6: Inline Styles Instead of CSS Custom Properties

**What people do:** Hard-code color values (`color: #8d1008`) or use Tailwind utility classes from the Figma export inline in Liquid.

**Why it's wrong:** BarterBobs requires CSS custom properties for all design tokens. Inline styles bypass Theme Editor color pickers. Tailwind classes are not present in production theme CSS.

**Do this instead:** Define all colors as `--bb-color-*` custom properties in `base.css`, sourced from `settings_schema.json` where merchant-configurable. Use only CSS custom property references in component styles.

---

## Sources

- [Shopify Theme Architecture — shopify.dev](https://shopify.dev/docs/storefronts/themes/architecture) — HIGH confidence (official)
- [JSON Templates — shopify.dev](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates) — HIGH confidence (official)
- [Section Groups — shopify.dev](https://shopify.dev/docs/storefronts/themes/architecture/section-groups) — HIGH confidence (official)
- [Section Rendering API — shopify.dev](https://shopify.dev/docs/api/ajax/section-rendering) — HIGH confidence (official)
- [Cart AJAX API — shopify.dev](https://shopify.dev/docs/api/ajax/reference/cart) — HIGH confidence (official)
- [settings_schema.json — shopify.dev](https://shopify.dev/docs/storefronts/themes/architecture/config/settings-schema-json) — HIGH confidence (official)
- [Layouts — shopify.dev](https://shopify.dev/docs/storefronts/themes/architecture/layouts) — HIGH confidence (official)
- [render tag — shopify.dev](https://shopify.dev/docs/api/liquid/tags/render) — HIGH confidence (official)
- [JS and stylesheet tags best practices — shopify.dev](https://shopify.dev/docs/storefronts/themes/best-practices/javascript-and-stylesheet-tags) — HIGH confidence (official)
- [Dawn reference theme — github.com/Shopify/dawn](https://github.com/Shopify/dawn) — HIGH confidence (official Shopify reference)
- [Dawn global.js structure](https://github.com/Shopify/dawn/blob/main/assets/global.js) — HIGH confidence (official)
- [Dawn theme.liquid structure](https://github.com/Shopify/dawn/blob/main/layout/theme.liquid) — HIGH confidence (official)
- [Section Rendering API for cart — nickdrishinski.com](https://nickdrishinski.com/blogs/shopify/how-dawn-theme-uses-section-rendering-api-for-cart-refresh) — MEDIUM confidence (community, verified against official docs)
- [Shopify theme CLAUDE.md conventions — gist by karimmtarek](https://gist.github.com/karimmtarek/3a8a636a05ae1c349ad0bba9d10425f0) — MEDIUM confidence (community best practices, consistent with official docs)
- [Make Sections Really Everywhere With Section Groups — shopify.com/partners](https://www.shopify.com/partners/blog/section-groups) — HIGH confidence (official Shopify blog)

---

*Architecture research for: BarterBobs Shopify OS 2.0 Custom Theme*
*Researched: 2026-03-20*
