# Phase 2: Homepage + PLP - Research

**Researched:** 2026-03-22
**Domain:** Shopify OS 2.0 section authoring — homepage editorial sections, collection PLP grid, AJAX Quick Add, Search & Discovery filter sidebar
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Homepage section scope**
- 8 sections total, following `barterbobs_main_landing_page` Figma order with the product grid inserted from `barterbobs_landing_page_1`:
  1. Hero
  2. Curation Pillars ("Curation with Care" — 3 blocks with icon, headline, body)
  3. Category Browse ("Browse Our Pantry" — 4 editorial portrait cards linking to collections)
  4. Featured Product Grid ("This Month's Favorites" — 4 Shopify products from merchant-selected collection)
  5. Brand Story (2-col editorial: large headline + body/pull-quote + 2x2 image grid)
  6. How It Works (3-step flow with numbered gradient circles)
  7. Testimonials ("Loved by Bob-scribers" — quote cards with stars, name, location)
  8. CTA Banner (full-width rounded red card, headline + offer copy + single CTA button)
- All sections are merchant-configurable via Theme Editor section schema blocks
- Section order fixed as above — Theme Editor drag-and-drop allows merchant to reorder if needed

**Category Browse section**
- 4 portrait cards at 3:4 aspect ratio
- Staggered offset layout: alternate cards pushed down `margin-top: ~3rem` to create Figma asymmetry
- Each card: background image, category label, hover scale 1.05x on image
- Merchant configures: image, label text, link URL via repeatable Theme Editor blocks
- No Shopify product data — purely editorial links to collection pages

**Featured Product Grid section**
- Pulls products from a merchant-selected collection via `collection.products` or Liquid section `type: product_list`
- Square (1:1) aspect ratio product images
- 4-column uniform grid (matching `barterbobs_landing_page_1` "This Month's Favorites")
- Each card: product image (hover scale 1.05x), badge label, product title, price, Quick Add button
- Merchant configures: which collection to source from, section headline and subheadline

**Quick Add behavior**
- Single-variant products: AJAX add directly, no picker needed
- Multi-variant products: open a mini variant picker popover anchored to the product card (viewport-aware positioning)
  - Popover shows variant chips (same chip-style pattern as PDPX-02 variant selector)
  - Shopper selects a variant, then clicks Add
  - Clicking outside closes without adding
- After successful add: AJAX POST to `/cart/add.js`, update cart count badge, emit `cart:open` via pubsub
- Phase 2: badge updates and event fires — no drawer yet (Phase 3)

**PLP filter behavior**
- Desktop sidebar (>=768px): fixed-width left sidebar with 3 filter groups (Categories, Dietary Prefs, Price Range)
- Mobile (<768px): filter button opens slide-up drawer from bottom with "Apply Filters" button
- Filter AJAX: update URL params, fetch updated collection HTML via Section Rendering API, replace product grid DOM in-place
- Filter URL format: `?filter.p.tag=vegan&filter.v.price.gte=0&filter.v.price.lte=50`

**Product card snippet**
- Shared `snippets/product-card.liquid` used by both homepage and PLP grids
- Accepts `product` object — renders image, title, price, badge, Quick Add button
- Quick Add JS in the section that renders cards (not in the snippet itself)

### Claude's Discretion
- Exact dual-thumb price slider implementation (CSS approach, JS range calculation)
- Variant picker popover positioning logic (viewport collision detection)
- Loading skeleton or spinner while AJAX filter fetch is in progress
- Error state for Quick Add AJAX failure
- Exact responsive breakpoints for the 4-column product grid collapse on the homepage

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 2 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOME-01 | Hero section: display headline (Newsreader), subheadline (Inter), 1-2 CTA buttons, hero image — all Theme Editor configurable | Figma extract confirms layout; Phase 1 CSS token patterns apply; `loading="eager"` for LCP |
| HOME-02 | Hero image uses `loading="eager"` when section is in first two page positions to avoid LCP penalty | Shopify `section.index` or position check; `loading` attr on `<img>` via Liquid conditional |
| HOME-03 | Featured products/bento grid section with mixed card sizes from merchant-selected collection | `type: collection` schema setting; `collection.products` Liquid; 4-column CSS grid |
| HOME-04 | "How It Works" section: 3-step flow with numbered circles, Material Symbols icons, step descriptions — Theme Editor configurable | Material Symbols font from Phase 1 globals; 3-block schema pattern |
| HOME-05 | Testimonials section: quote cards with name, quote, star rating, optional avatar — multiple blocks via Theme Editor | Block-based schema pattern; star rendering via Material Symbols or CSS |
| PLPX-01 | Collection page: 4-column at 1280px, 2-column at 768px, 1-column at 375px responsive grid | CSS Grid with `grid-template-columns`; media queries at breakpoints |
| PLPX-02 | Product card: image (hover scale 1.05x), title, price, CTA button; rounded corners, tonal elevation no border | `snippets/product-card.liquid`; CSS hover transition using `--transition-base` |
| PLPX-03 | Collection page filtering via Search & Discovery app-compatible filter UI; desktop sidebar, mobile collapsible | `collection.filters` Liquid object; Section Rendering API AJAX; slide-up mobile drawer |
| PLPX-04 | Product card Quick Add: AJAX cart add, open cart drawer without navigating away | `/cart/add.js` POST; `cart:open` pubsub event; `CartCountBubble` update via `cart:updated` |
</phase_requirements>

---

## Summary

Phase 2 builds on the complete Phase 1 foundation (design tokens, global JS infrastructure, header/footer) to add the full homepage content and the collection/PLP page. The work splits into three tracks: (1) eight homepage sections with Theme Editor schemas and editorial CSS, (2) a shared `snippets/product-card.liquid` with Quick Add AJAX that wires to the Phase 1 `CartCountBubble` and publishes `cart:open` for Phase 3, and (3) the collection template with a responsive product grid, Search & Discovery filter sidebar, and Section Rendering API-based AJAX filtering.

All eight homepage sections are authored as individual `sections/section-name.liquid` files with section-specific CSS in `assets/component-section-name.css`. The `templates/index.json` template will reference all eight sections in order. The PLP needs `templates/collection.json` as a new file (currently absent) and a `sections/main-collection.liquid` that wraps the sidebar + product grid. Quick Add JS lives inline in the sections that render cards, extending `window.BarterBobs.ShopifySection`, using `fetch('/cart/add.js')` for cart operations and `window.BarterBobs.publish('cart:updated', { itemCount })` for badge updates.

The staggered category browse cards, dual-thumb price slider, and variant picker popover are the three highest implementation-complexity items. Each requires CSS-only positioning before adding JS behavior. All interactive components must extend `ShopifySection` and use the established pubsub patterns from Phase 1.

**Primary recommendation:** Build sections in Figma-exact order, share the product-card snippet between homepage and PLP from the start to avoid divergence, and implement Quick Add as a single reusable class that both sections instantiate.

---

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Shopify Liquid | OS 2.0 | Section templates, schema, data binding | Platform requirement; already established in Phase 1 |
| Vanilla JS ES modules | Native | Section web components | Established in Phase 1; no build step, CDN-served |
| CSS custom properties | Native | All visual tokens | Established in Phase 1; `--color-brand-primary`, `--transition-base`, etc. |
| Material Symbols Outlined | Google Fonts CDN | Icons for How It Works steps, filter icon, check icon | Already loaded in theme.liquid (font `material-symbols-outlined`) |
| `shopify theme check` | Shopify CLI | Automated validation of Liquid/schema syntax | Established in Phase 1 validation strategy |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| Shopify Search & Discovery app | Latest | Provides `collection.filters` Liquid object | Required for PLPX-03; must be installed in dev store before Phase 2 filter UI can be tested |
| Section Rendering API | Platform | AJAX filter updates without page reload | Used by filter sidebar to replace product grid HTML |
| `/cart/add.js` AJAX endpoint | Platform | Quick Add cart operations | Used by Quick Add web component in every section rendering product cards |
| `window.Shopify.routes.root` | Platform | Locale-aware URL base for AJAX calls | Use as prefix for all fetch() calls to cart/section endpoints |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Section Rendering API for filter AJAX | Fetch full collection page HTML, parse it | Section API is targeted, faster, returns only needed HTML; full-page fetch is fragile |
| Custom dual-thumb range slider JS | Browser native `<input type="range">` overlay trick | Figma uses custom design with brand-color fill; native range is not stylable to match |
| Variant picker popover anchored to card | Modal overlay centered on viewport | Card-anchored matches the Figma pattern; modal would feel heavy for a single-variant selection |
| Material Symbols for star ratings | SVG inline icons | Material Symbols already loaded; no extra asset cost |

**Installation:** No npm packages needed for runtime. All libraries are platform-native or CDN-loaded.

---

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)

```
sections/
├── section-hero.liquid            # HOME-01, HOME-02
├── section-curation-pillars.liquid  # HOME (Curation with Care)
├── section-category-browse.liquid  # HOME (Browse Our Pantry)
├── section-featured-products.liquid # HOME-03
├── section-brand-story.liquid      # HOME (Brand Story)
├── section-how-it-works.liquid     # HOME-04
├── section-testimonials.liquid     # HOME-05
├── section-cta-banner.liquid       # HOME (CTA Banner)
├── main-collection.liquid          # PLPX-01, PLPX-02, PLPX-03, PLPX-04

assets/
├── component-hero.css
├── component-curation-pillars.css
├── component-category-browse.css
├── component-featured-products.css
├── component-brand-story.css
├── component-how-it-works.css
├── component-testimonials.css
├── component-cta-banner.css
├── component-collection.css        # PLP grid + filter sidebar + mobile drawer
├── component-product-card.css      # Shared card styles (used by homepage + PLP)

snippets/
├── product-card.liquid             # Shared card (image, title, price, badge, Quick Add btn)

templates/
├── index.json                      # Updated to reference all 8 homepage sections
├── collection.json                 # New — references main-collection section
```

### Pattern 1: OS 2.0 Section with Inline JS Web Component

**What:** Each interactive section defines its own web component class inline in a `<script type="module">` block at the bottom of the section liquid file. Static sections (no JS) omit the script block.

**When to use:** Every section with user interaction (Quick Add, filter sidebar, popover). Static sections (Curation Pillars, How It Works, Brand Story, Testimonials) need no JS.

**Example (established Phase 1 pattern):**
```liquid
{%- comment -%} sections/section-name.liquid {%- endcomment -%}
{{ 'component-section-name.css' | asset_url | stylesheet_tag }}

<section-name>
  <!-- HTML markup -->
</section-name>

<script type="module">
  class SectionName extends window.BarterBobs.ShopifySection {
    onSectionLoad() {
      // Query DOM, attach event listeners
    }
    onSectionUnload() {
      // Clean up document/window listeners only
    }
  }
  customElements.define('section-name', SectionName);
</script>

{% schema %}
{
  "name": "Section Name",
  "settings": [...],
  "blocks": [...],
  "presets": [{ "name": "Section Name" }]
}
{% endschema %}
```

### Pattern 2: Hero Section with `loading="eager"` (HOME-02)

**What:** The hero image `<img>` must use `loading="eager"` (not the default `lazy`) when the section is near the top of the page.

**When to use:** Only for the hero section. The `section.index` Liquid variable returns the 1-based position of the section on the page.

**Example:**
```liquid
{%- assign loading_strategy = 'lazy' -%}
{%- if section.index <= 2 -%}
  {%- assign loading_strategy = 'eager' -%}
{%- endif -%}

<img
  src="{{ section.settings.hero_image | image_url: width: 1200 }}"
  width="{{ section.settings.hero_image.width }}"
  height="{{ section.settings.hero_image.height }}"
  loading="{{ loading_strategy }}"
  alt="{{ section.settings.hero_image.alt | escape }}"
>
```

**Note:** Use `image_url: width: N` (not deprecated `img_url`). Provide explicit `width` and `height` attributes to prevent layout shift.

### Pattern 3: Product Card Snippet (PLPX-02, HOME-03, PLPX-04)

**What:** A single `snippets/product-card.liquid` renders the card for both the homepage featured grid and the PLP grid. The Quick Add button emits data attributes for the section's JS to handle.

**When to use:** Everywhere a product card appears.

**Example:**
```liquid
{%- comment -%} snippets/product-card.liquid
  Accepts: product (required), badge_label (optional string override)
{%- endcomment -%}

<div class="product-card" data-product-id="{{ product.id }}">
  <div class="product-card__image-wrap">
    {%- if badge_label != blank or product.metafields.custom.badge != blank -%}
      <span class="product-card__badge">
        {{ badge_label | default: product.metafields.custom.badge }}
      </span>
    {%- endif -%}
    <img
      src="{{ product.featured_image | image_url: width: 600 }}"
      width="600"
      height="600"
      loading="lazy"
      alt="{{ product.featured_image.alt | escape | default: product.title }}"
      class="product-card__img"
    >
  </div>
  <div class="product-card__info">
    <h3 class="product-card__title">{{ product.title }}</h3>
    <p class="product-card__price">{{ product.price | money }}</p>
    <button
      class="product-card__quick-add"
      data-product-id="{{ product.id }}"
      data-variant-id="{{ product.selected_or_first_available_variant.id }}"
      data-has-variants="{{ product.variants.size | minus: 1 | at_least: 1 }}"
      aria-label="{{ 'products.quick_add' | t }}: {{ product.title | escape }}"
    >
      {{ 'products.quick_add' | t }}
    </button>
  </div>
</div>
```

**Key:** `data-has-variants` is `"true"` when product has >1 variant. JS checks this to decide between direct AJAX add or opening the variant picker popover.

### Pattern 4: Quick Add AJAX (PLPX-04)

**What:** Section-level web component intercepts Quick Add button clicks, POSTs to `/cart/add.js`, updates cart badge, and fires `cart:open`.

**When to use:** In every section that renders product cards (Featured Products on homepage, main-collection on PLP).

**Example:**
```javascript
// Source: Shopify Ajax API docs — https://shopify.dev/docs/api/ajax/reference/cart
class QuickAddSection extends window.BarterBobs.ShopifySection {
  onSectionLoad() {
    this.addEventListener('click', this._handleClick.bind(this));
  }

  async _handleClick(event) {
    const btn = event.target.closest('[data-product-id]');
    if (!btn?.classList.contains('product-card__quick-add')) return;

    const hasVariants = btn.dataset.hasVariants === 'true';
    if (hasVariants) {
      this._openVariantPicker(btn);
      return;
    }

    await this._addToCart(btn.dataset.variantId, btn);
  }

  async _addToCart(variantId, triggerEl) {
    try {
      const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(variantId), quantity: 1 })
      });
      if (!response.ok) throw new Error('Cart add failed');
      const cartResponse = await fetch(`${window.Shopify.routes.root}cart.js`);
      const cart = await cartResponse.json();
      window.BarterBobs.publish('cart:updated', { itemCount: cart.item_count });
      window.BarterBobs.publish('cart:open', { trigger: triggerEl });
    } catch (err) {
      // Error state: Claude's discretion — show inline error message on btn
      console.error('Quick Add failed:', err);
    }
  }

  _openVariantPicker(btn) {
    // Viewport-aware popover — see Pattern 5
  }
}
```

**Critical notes:**
- `window.Shopify.routes.root` provides the locale-aware URL base — always prefix cart AJAX calls with it
- After `/cart/add.js` succeeds, fetch `/cart.js` to get accurate `item_count` for the badge
- `cart:updated` must pass `{ itemCount: N }` — matches `CartCountBubble` subscription in `global.js`
- `cart:open` fires regardless of whether drawer exists yet (Phase 3 subscribes to it)

### Pattern 5: Variant Picker Popover (Claude's Discretion)

**What:** A small popover anchored to the product card showing variant chip buttons. Appears above or below the card depending on available viewport space.

**Recommended approach:**
```javascript
_openVariantPicker(triggerBtn) {
  // Position calculation
  const cardRect = triggerBtn.closest('.product-card').getBoundingClientRect();
  const spaceBelow = window.innerHeight - cardRect.bottom;
  const popoverHeight = 160; // estimated
  const positionAbove = spaceBelow < popoverHeight;

  // Build popover
  const popover = document.createElement('div');
  popover.className = 'variant-picker-popover';
  popover.setAttribute('role', 'dialog');
  popover.setAttribute('aria-label', 'Select variant');
  popover.dataset.productId = triggerBtn.dataset.productId;

  // Position: above or below card
  popover.style.setProperty('--popover-top',
    positionAbove
      ? `${cardRect.top + window.scrollY - popoverHeight - 8}px`
      : `${cardRect.bottom + window.scrollY + 8}px`
  );
  popover.style.setProperty('--popover-left', `${cardRect.left}px`);

  document.body.appendChild(popover);

  // Outside click closes
  const closeOnOutside = (e) => {
    if (!popover.contains(e.target) && e.target !== triggerBtn) {
      popover.remove();
      document.removeEventListener('click', closeOnOutside);
    }
  };
  requestAnimationFrame(() => document.addEventListener('click', closeOnOutside));
}
```

**CSS (in component-product-card.css):**
```css
.variant-picker-popover {
  position: absolute;
  top: var(--popover-top);
  left: var(--popover-left);
  z-index: 300;
  background: var(--color-surface);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  padding: 1rem;
  box-shadow: 0 8px 32px rgba(18, 26, 51, 0.12);
  min-width: 180px;
}

.variant-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.75rem;
  border: 1.5px solid var(--color-outline-variant);
  border-radius: var(--radius-full);
  font-family: var(--font-body);
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color var(--transition-fast),
              background-color var(--transition-fast);
}

.variant-chip[aria-pressed="true"],
.variant-chip:focus {
  border-color: var(--color-brand-primary);
  background-color: var(--color-surface-mid);
}
```

### Pattern 6: Section Rendering API for AJAX Filters (PLPX-03)

**What:** When a filter changes, construct the new URL with updated filter params, fetch only the product grid section HTML, and replace the DOM.

**When to use:** Filter sidebar interactions (checkbox change, price slider release, category link click).

**Example:**
```javascript
// Source: Shopify Section Rendering API — https://shopify.dev/docs/api/ajax/section-rendering
async _applyFilters(filterParams) {
  const url = new URL(window.location.href);
  // Clear old filter params, apply new ones
  [...url.searchParams.keys()]
    .filter(k => k.startsWith('filter.'))
    .forEach(k => url.searchParams.delete(k));
  Object.entries(filterParams).forEach(([k, v]) => {
    if (v !== null && v !== '') url.searchParams.set(k, v);
  });

  // Fetch updated section HTML via Section Rendering API
  const sectionUrl = new URL(url.href);
  sectionUrl.searchParams.set('sections', 'main-collection');

  const response = await fetch(sectionUrl.href, { headers: { 'X-Requested-With': 'fetch' } });
  const data = await response.json();

  // Replace product grid HTML
  const parser = new DOMParser();
  const newDoc = parser.parseFromString(data['main-collection'], 'text/html');
  const newGrid = newDoc.querySelector('[data-product-grid]');
  this.querySelector('[data-product-grid]').replaceWith(newGrid);

  // Update browser URL without reload (shareable URL)
  history.pushState({}, '', url.href);
}
```

**Key:** The section must have an `id` that matches what's passed to `?sections=`. Shopify uses the section's rendered `id` attribute (e.g., `shopify-section-main-collection`). Request with `sections=main-collection` to match the section's schema `name` key.

### Pattern 7: Dual-Thumb Price Slider (Claude's Discretion)

**What:** Two `<input type="range">` elements overlaid on a shared track. CSS fills the track between thumbs using a gradient calculated in JS.

**Recommended implementation:**
```html
<div class="price-slider" data-price-slider>
  <div class="price-slider__track">
    <div class="price-slider__fill" data-slider-fill></div>
  </div>
  <input type="range" class="price-slider__input price-slider__input--min"
    min="0" max="{{ max_price }}" step="1" value="0"
    data-price-min aria-label="Minimum price">
  <input type="range" class="price-slider__input price-slider__input--max"
    min="0" max="{{ max_price }}" step="1" value="{{ max_price }}"
    data-price-max aria-label="Maximum price">
</div>
```

```css
.price-slider { position: relative; height: 1.5rem; }
.price-slider__track {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  width: 100%;
  background: var(--color-surface-high);
  border-radius: var(--radius-full);
}
.price-slider__fill {
  position: absolute;
  height: 100%;
  background: var(--color-brand-primary);
  border-radius: var(--radius-full);
  /* left and width set by JS */
}
/* Reset native input range appearance */
.price-slider__input {
  position: absolute;
  width: 100%;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  top: 50%;
  transform: translateY(-50%);
}
.price-slider__input::-webkit-slider-thumb {
  pointer-events: all;
  -webkit-appearance: none;
  width: 1rem; height: 1rem;
  border-radius: 50%;
  background: white;
  border: 2px solid var(--color-brand-primary);
  box-shadow: 0 2px 8px rgba(18, 26, 51, 0.12);
  cursor: pointer;
}
```

```javascript
_updateSliderFill() {
  const min = Number(this.minInput.value);
  const max = Number(this.maxInput.value);
  const range = Number(this.minInput.max) - Number(this.minInput.min);
  const fillEl = this.querySelector('[data-slider-fill]');
  fillEl.style.left = `${((min - Number(this.minInput.min)) / range) * 100}%`;
  fillEl.style.width = `${((max - min) / range) * 100}%`;
  // Prevent thumbs crossing
  if (min > max) this.minInput.value = max;
}
```

### Pattern 8: Category Browse Staggered Grid

**What:** 4-column grid where odd-indexed cards (2nd and 4th) are offset downward by ~3rem to create the Figma asymmetry.

**CSS approach (no JS required):**
```css
.category-browse__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  align-items: start; /* NOT stretch — critical for stagger to work */
}

/* Odd columns (2nd, 4th): stagger down */
.category-browse__card:nth-child(even) {
  margin-top: 3rem;
}

@media (max-width: 767px) {
  .category-browse__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  /* Keep stagger on mobile for 2-col layout */
  .category-browse__card:nth-child(even) {
    margin-top: 2rem;
  }
}

@media (max-width: 479px) {
  .category-browse__grid {
    grid-template-columns: 1fr;
  }
  .category-browse__card:nth-child(even) {
    margin-top: 0;
  }
}
```

### Pattern 9: `templates/collection.json` (New Template)

**What:** OS 2.0 collection template JSON. Currently missing — must be created in Phase 2.

```json
{
  "sections": {
    "main": {
      "type": "main-collection",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

### Pattern 10: `templates/index.json` Update

The current `index.json` only has `main-page-content`. Phase 2 replaces it with all 8 homepage sections:

```json
{
  "sections": {
    "hero": { "type": "section-hero", "settings": {} },
    "curation-pillars": { "type": "section-curation-pillars", "settings": {} },
    "category-browse": { "type": "section-category-browse", "settings": {} },
    "featured-products": { "type": "section-featured-products", "settings": {} },
    "brand-story": { "type": "section-brand-story", "settings": {} },
    "how-it-works": { "type": "section-how-it-works", "settings": {} },
    "testimonials": { "type": "section-testimonials", "settings": {} },
    "cta-banner": { "type": "section-cta-banner", "settings": {} }
  },
  "order": [
    "hero",
    "curation-pillars",
    "category-browse",
    "featured-products",
    "brand-story",
    "how-it-works",
    "testimonials",
    "cta-banner"
  ]
}
```

### Anti-Patterns to Avoid

- **`{% include %}` for snippets:** Use `{% render 'product-card', product: product %}` — `include` is deprecated and breaks snippet variable isolation
- **`img_url` filter:** Use `image_url: width: N` — `img_url` is deprecated and will throw theme check warnings
- **Hardcoded hex colors in CSS:** Always use CSS custom properties from `css-variables.liquid` — no raw `#b5092d` in CSS files
- **Global state objects (`window.myState`):** Use CustomEvent pub/sub via `window.BarterBobs.publish/subscribe`
- **`script_tag` filter for section JS:** Section JS is inline `<script type="module">` inside the section liquid — the `script_tag` filter cannot emit `type="module"`
- **Fetching full collection page for filter AJAX:** Use Section Rendering API (`?sections=main-collection`) — targeted, fast, no HTML parsing of full-page response
- **Direct mutation of `window.location.href` for filter updates:** Use `history.pushState()` — avoids full page reload while keeping URL shareable and back/forward functional
- **Attaching Quick Add click listeners to document:** Attach to `this` (the section element) via `addEventListener` — avoids listener leaks and scopes to section

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Filter AJAX product grid updates | Custom fetch + full HTML parse + regex DOM swap | Shopify Section Rendering API | Section API returns scoped section HTML directly; no page-level HTML parsing needed |
| Cart add with count refresh | Custom cart state management | `/cart/add.js` + `/cart.js` sequential fetch | Platform endpoints handle session, currency, locale; state lives in Shopify, not JS |
| Theme Editor section lifecycle | Custom `MutationObserver` watching DOM | `ShopifySection` base class from Phase 1 | `shopify:section:load/unload` events handle editor reload; already implemented |
| Focus trap for mobile filter drawer | Custom tabindex management | `window.BarterBobs.trapFocus()` from Phase 1 | Already implemented, tested, handles edge cases |
| Cross-component cart event bus | `window` property or `localStorage` | `window.BarterBobs.publish/subscribe` from Phase 1 | Already implemented; cleans up with unsubscribe pattern |
| Variant availability check | Extra Shopify API call | `product.selected_or_first_available_variant` in Liquid | Liquid resolves at render time; no extra JS fetch needed |

**Key insight:** Shopify's platform AJAX APIs (cart, Section Rendering) handle all the hard parts (session state, locale routing, section scoping). Custom solutions inevitably miss edge cases in currency formatting, locale prefixes, and section ID namespacing.

---

## Common Pitfalls

### Pitfall 1: `img_url` vs `image_url` Filter

**What goes wrong:** Using the deprecated `img_url` Liquid filter — `shopify theme check` raises `DeprecatedFilter` warning.
**Why it happens:** Legacy Shopify tutorial examples still use `img_url`; Figma HTML exports don't use Liquid at all.
**How to avoid:** Always use `{{ image | image_url: width: N }}`. Add `width` and `height` attributes to every `<img>` using the image object's dimensions to prevent layout shift.
**Warning signs:** `shopify theme check` output includes `DeprecatedFilter: 'img_url'`.

### Pitfall 2: `section.index` vs Section Position for LCP

**What goes wrong:** Assuming the hero is always `section.index == 1` — but Theme Editor lets merchants reorder sections. If a different section is dragged to position 1, the hero loses `loading="eager"`.
**Why it happens:** `templates/index.json` order is the default, not the enforced order.
**How to avoid:** Use `section.index <= 2` (first two positions) as the condition. `section.index` is dynamic and reflects the current rendering position.
**Warning signs:** Lighthouse reports LCP penalty from hero image being lazy-loaded.

### Pitfall 3: Section Rendering API Section ID Mismatch

**What goes wrong:** AJAX filter fetch returns null for the requested section ID.
**Why it happens:** Shopify wraps sections in `<div id="shopify-section-{section-id}">`. The Section Rendering API takes the bare section ID (e.g., `main-collection`), but the section file name must match exactly.
**How to avoid:** Name the section file `sections/main-collection.liquid`. Use `?sections=main-collection` in the fetch URL. After receiving the JSON response, the key in the response object is `main-collection` (the bare ID, not the wrapped `shopify-section-main-collection`).
**Warning signs:** `fetch()` response JSON has `"main-collection": null` or the key is missing entirely.

### Pitfall 4: `collection.filters` Requires Search & Discovery App

**What goes wrong:** `collection.filters` returns an empty array if the app is not installed; filter UI renders but shows no filter options.
**Why it happens:** The Liquid object exists in all themes but only populates when the app provides filter data AND the app is installed in the store.
**How to avoid:** Confirm Search & Discovery app is installed in the dev store before testing filter UI. Add a `{% if collection.filters.size > 0 %}` guard around the filter sidebar markup so it gracefully hides when empty.
**Warning signs:** Filter sidebar renders but `collection.filters` loop produces no output; browser console shows no network errors.

### Pitfall 5: Variant Picker Popover Z-index Conflicts

**What goes wrong:** The variant picker popover appears behind the sticky header or other elevated UI.
**Why it happens:** Shopify header has `z-index: 100` (Phase 1). The popover must be above the header but below any modal overlay.
**How to avoid:** Set popover `z-index: 300`. The Phase 1 z-index scale: header = 100, nav overlay = 199, nav drawer = 200. Popover at 300 is above all of these.
**Warning signs:** Popover is invisible or partially clipped when a product card is near the top of the viewport.

### Pitfall 6: Cart Badge Update Event Signature

**What goes wrong:** Cart badge does not update after Quick Add.
**Why it happens:** `CartCountBubble` in Phase 1 subscribes to `cart:updated` and reads `event.detail.itemCount`. If the publish call uses a different key (e.g., `count` instead of `itemCount`), the badge does not update.
**How to avoid:** Always publish with `window.BarterBobs.publish('cart:updated', { itemCount: cart.item_count })`. Check `global.js` line 138 for the exact property name consumed.
**Warning signs:** Badge stays at 0 or previous count after adding a product via Quick Add.

### Pitfall 7: Mobile Filter Drawer and `body.nav-open` Conflict

**What goes wrong:** Both the nav drawer and the mobile filter drawer try to set `body.nav-open` (which sets `position: fixed` on body to prevent scroll), causing the page to jump to top when one closes.
**Why it happens:** Phase 1 nav drawer uses `document.body.classList.add('nav-open')`. If the filter drawer uses the same class, closing one drawer removes the class while the other is still open.
**How to avoid:** Use a distinct class for the filter drawer: `body.filter-open`. Manage both classes independently. Only remove `filter-open` when the filter drawer closes, not when the nav drawer closes.
**Warning signs:** Page scrolls to top when closing one drawer while the other was recently opened.

### Pitfall 8: `type: product_list` vs `type: collection` Schema Setting

**What goes wrong:** Using `type: product_list` in section schema to allow merchant-selected products by ID, but discovering it does not work for sourcing from a collection.
**Why it happens:** `type: product_list` lets merchants pick individual products one-by-one. For "Featured Products" pulling from a whole collection, use `type: collection` which gives a collection handle, then access `section.settings.featured_collection.products` in Liquid.
**How to avoid:** Use `type: collection` for the Featured Products section schema. Access via `{% assign collection = section.settings.featured_collection %}`.
**Warning signs:** Section setting appears in Theme Editor but products are empty or do not reflect the collection contents.

---

## Code Examples

Verified patterns from official sources and established Phase 1 codebase:

### Fetching Cart Count After Add
```javascript
// Source: https://shopify.dev/docs/api/ajax/reference/cart
// Use window.Shopify.routes.root for locale-aware URLs
const addResponse = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: variantId, quantity: 1 })
});

if (!addResponse.ok) throw new Error('Add to cart failed');

const cartResponse = await fetch(`${window.Shopify.routes.root}cart.js`);
const cart = await cartResponse.json();

// Matches CartCountBubble subscription in global.js (line 138)
window.BarterBobs.publish('cart:updated', { itemCount: cart.item_count });
window.BarterBobs.publish('cart:open', {});
```

### Section Rendering API Filter Fetch
```javascript
// Source: https://shopify.dev/docs/api/ajax/section-rendering
// Append ?sections=section-id to the collection URL with filter params
const filterUrl = new URL(window.location.href);
filterUrl.searchParams.set('sections', 'main-collection');
filterUrl.searchParams.set('filter.p.tag', 'vegan'); // example filter

const response = await fetch(filterUrl.href);
const data = await response.json();
// data['main-collection'] contains the HTML string for the section
```

### Collection Schema Setting for Merchant-Selected Collection
```json
// In section schema settings array:
{
  "type": "collection",
  "id": "featured_collection",
  "label": "Featured collection"
}
```
```liquid
{%- assign featured = section.settings.featured_collection -%}
{%- for product in featured.products limit: 4 -%}
  {%- render 'product-card', product: product -%}
{%- endfor -%}
```

### Mobile Filter Drawer Slide-Up Pattern
```css
/* assets/component-collection.css */
.filter-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 250;
  background: var(--color-surface);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  max-height: 80vh;
  overflow-y: auto;
  transform: translateY(100%);
  transition: transform 350ms cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-drawer[aria-hidden="false"] {
  transform: translateY(0);
}

body.filter-open {
  overflow: hidden;
  position: fixed;
  width: 100%;
}
```

### How It Works — `section.index` Guard for Hero LCP
```liquid
{%- comment -%} sections/section-hero.liquid {%- endcomment -%}
{%- assign loading = 'lazy' -%}
{%- if section.index <= 2 -%}
  {%- assign loading = 'eager' -%}
{%- endif -%}
<img
  src="{{ section.settings.image | image_url: width: 1440 }}"
  width="{{ section.settings.image.width }}"
  height="{{ section.settings.image.height }}"
  loading="{{ loading }}"
  fetchpriority="{% if section.index == 1 %}high{% else %}auto{% endif %}"
  alt="{{ section.settings.image.alt | escape }}"
>
```

### `collection.filters` Liquid Iteration
```liquid
{%- comment -%} Requires Shopify Search & Discovery app installed {%- endcomment -%}
{%- if collection.filters.size > 0 -%}
  <aside class="filter-sidebar">
    {%- for filter in collection.filters -%}
      <div class="filter-group">
        <h3>{{ filter.label }}</h3>
        {%- if filter.type == 'list' -%}
          {%- for value in filter.values -%}
            <label>
              <input type="checkbox"
                name="{{ filter.param_name }}"
                value="{{ value.value }}"
                {%- if value.active %} checked{% endif -%}
                data-filter-input>
              {{ value.label }}
              {%- if value.count > 0 -%}
                <span>({{ value.count }})</span>
              {%- endif -%}
            </label>
          {%- endfor -%}
        {%- elsif filter.type == 'price_range' -%}
          {%- comment -%} Custom dual-thumb slider rendered here {%- endcomment -%}
          {%- assign min_price = filter.min_value.value | divided_by: 100 -%}
          {%- assign max_price = filter.max_value.value | divided_by: 100 -%}
          {%- comment -%} Shopify stores price in cents; divide by 100 for display {%- endcomment -%}
          <div class="price-slider" data-price-slider
            data-min="{{ min_price }}"
            data-max="{{ max_price }}"
            data-param-min="{{ filter.min_value.param_name }}"
            data-param-max="{{ filter.max_value.param_name }}">
          </div>
        {%- endif -%}
      </div>
    {%- endfor -%}
  </aside>
{%- endif -%}
```

**Note:** Shopify stores prices in cents in filter objects. `filter.min_value.value` and `filter.max_value.value` are in cents. Divide by 100 for display. Filter URL params `filter.v.price.gte` and `filter.v.price.lte` also take cent values.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `img_url` filter | `image_url: width: N` | Shopify OS 2.0 (2021) | Old filter raises theme check warning; new filter also generates srcset |
| `{% include %}` | `{% render %}` | Shopify OS 2.0 (2021) | `include` shares parent scope; `render` isolates variables (required for section safety) |
| Cart page redirect | AJAX `/cart/add.js` + cart drawer | OS 2.0 best practice | No page reload; better UX; Phase 3 cart drawer pattern |
| Full-page reload for filter | Section Rendering API + `history.pushState` | Introduced 2020, now standard | Shareable URLs + no page reload |
| `window.onload` for section JS | `customElements.define` + `connectedCallback` | OS 2.0 (2021) | Web components work with Theme Editor's dynamic section add/remove |
| `type: product_list` for homepage products | `type: collection` schema setting | Established pattern | Collection setting auto-syncs; product_list requires manual individual selection |

---

## Open Questions

1. **Material Symbols font weight — How It Works numbered circles**
   - What we know: Material Symbols font is loaded in `theme.liquid` via the established Phase 1 Google Fonts link. The `font-variation-settings` in the Figma CSS is `'FILL' 0, 'wght' 400`. The numbered circles in "How It Works" use Newsreader headline font (numbers 1, 2, 3) not Material Symbols.
   - What's unclear: Whether Material Symbols icons (e.g., `shopping_basket`, `calendar_month`, `local_shipping`) for the step icons in How It Works are included in the current font request weight range `100..700`.
   - Recommendation: Verify the current Google Fonts link in `theme.liquid` includes the Material Symbols weight range needed; it currently uses `wght,FILL@100..700,0..1` which covers all usage.

2. **Price filter cents vs. display units in URL params**
   - What we know: `filter.v.price.gte` and `filter.v.price.lte` URL params take cent values (Shopify internal representation). Display values divided by 100.
   - What's unclear: Some Shopify theme examples pass dollar values; official docs are not explicit about whether the API normalizes.
   - Recommendation: Use cent values in URL params to match `filter.min_value.param_name` and `filter.max_value.param_name` from the Liquid filter object. Test against dev store with Search & Discovery installed to confirm behavior.

3. **`templates/index.json` section key naming**
   - What we know: The current `index.json` uses `"main"` as the single section key. Multiple sections need unique keys. Keys can be arbitrary strings.
   - What's unclear: Whether the keys must match section type names or can be arbitrary.
   - Recommendation: Use the section type as the key (e.g., `"section-hero"` for `type: "section-hero"`). This is readable and avoids collisions. Confirmed pattern from Shopify's own Dawn theme.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `shopify theme check` (Shopify CLI, bundled) |
| Config file | `.theme-check.yml` (created in Phase 1, Plan 01-01) |
| Quick run command | `shopify theme check` |
| Full suite command | `shopify theme check --category all` |
| Estimated runtime | ~5 seconds |

**Manual verification (required for browser behavior):** `shopify theme dev --store YOUR_DEV_STORE.myshopify.com` — resize to 375/768/1280px breakpoints, test Quick Add AJAX, test filter sidebar, verify LCP in Lighthouse.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-01 | Hero section renders, all fields in Theme Editor | `shopify theme check` + manual Theme Editor | `shopify theme check` | ❌ Wave 0 |
| HOME-02 | Hero image `loading="eager"` at position <=2 | `shopify theme check` + manual Lighthouse run | `shopify theme check` | ❌ Wave 0 |
| HOME-03 | Featured products grid renders 4 cards from collection | `shopify theme check` + manual dev store | `shopify theme check` | ❌ Wave 0 |
| HOME-04 | How It Works renders 3 configurable steps | `shopify theme check` + manual Theme Editor | `shopify theme check` | ❌ Wave 0 |
| HOME-05 | Testimonials renders multiple quote blocks | `shopify theme check` + manual Theme Editor | `shopify theme check` | ❌ Wave 0 |
| PLPX-01 | 4/2/1 column grid at 1280/768/375px | manual browser resize | `shopify theme check` | ❌ Wave 0 |
| PLPX-02 | Product card image hover scale 1.05x | manual browser hover | `shopify theme check` | ❌ Wave 0 |
| PLPX-03 | Filter sidebar narrows grid without reload; URL updates | manual dev store + network tab | `shopify theme check` | ❌ Wave 0 |
| PLPX-04 | Quick Add adds to cart, badge updates, `cart:open` fires | manual dev store + browser console | `shopify theme check` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `shopify theme check`
- **Per wave merge:** `shopify theme check --category all` + manual spot check in dev store
- **Phase gate:** Full suite green + all 9 success criteria verified in dev store before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `sections/section-hero.liquid` — HOME-01, HOME-02
- [ ] `sections/section-curation-pillars.liquid` — homepage section
- [ ] `sections/section-category-browse.liquid` — homepage section
- [ ] `sections/section-featured-products.liquid` — HOME-03
- [ ] `sections/section-brand-story.liquid` — homepage section
- [ ] `sections/section-how-it-works.liquid` — HOME-04
- [ ] `sections/section-testimonials.liquid` — HOME-05
- [ ] `sections/section-cta-banner.liquid` — homepage section
- [ ] `sections/main-collection.liquid` — PLPX-01, PLPX-02, PLPX-03, PLPX-04
- [ ] `snippets/product-card.liquid` — shared card (PLPX-02, PLPX-04)
- [ ] `templates/collection.json` — required for collection page to render (currently missing)
- [ ] `templates/index.json` update — replace `main-page-content` with 8 homepage sections
- [ ] `assets/component-hero.css` through `assets/component-collection.css` — all section CSS files
- [ ] `assets/component-product-card.css` — shared card CSS including variant chip styles
- [ ] Search & Discovery app installed in dev store — required for `collection.filters` to populate (existing blocker from STATE.md)
- [ ] Products tagged `Gluten-Free`, `Vegan`, `Organic Only` in Shopify admin — required to verify dietary filter options (existing blocker from STATE.md)

---

## Sources

### Primary (HIGH confidence)

- Phase 1 codebase (`assets/global.js`, `sections/header.liquid`, `assets/component-header.css`) — established patterns for ShopifySection, pubsub, CSS tokens, section schema
- Phase 1 CONTEXT.md + Phase 2 CONTEXT.md — locked architectural decisions
- Figma export HTML files (`stitch_barterbobs_landing_page/` subdirectories) — authoritative design source for all visual specs
- [Shopify Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering) — AJAX filter pattern
- [Shopify Cart Ajax API](https://shopify.dev/docs/api/ajax/reference/cart) — Quick Add `/cart/add.js` endpoint
- [Shopify Liquid filter object](https://shopify.dev/docs/api/liquid/objects/filter) — `collection.filters` properties

### Secondary (MEDIUM confidence)

- [Shopify Liquid tag filtering](https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/tag-filtering) — confirmed `collection.all_tags` pattern; `collection.filters` (Search & Discovery) is separate API
- [Shopify section schema docs](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema) — `type: collection` setting confirmed

### Tertiary (LOW confidence)

- Dual-thumb range slider implementation — CSS overlay technique is community-standard but not officially documented by Shopify; implementation is Claude's discretion per CONTEXT.md
- `section.index` behavior in Theme Editor reorder scenarios — stated behavior from Shopify docs but not verified empirically in dev store

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools are established in Phase 1 or are Shopify platform APIs
- Architecture patterns: HIGH — Figma exports, Phase 1 codebase, and Shopify docs provide definitive guidance
- Pitfalls: HIGH — most drawn from Phase 1 learnings (documented in STATE.md) or official Shopify deprecation notices
- Dual-thumb slider: MEDIUM — implementation approach is well-established community pattern, but exact CSS browser compatibility (Safari range input) needs testing
- Filter AJAX cents vs dollars: MEDIUM — behavior derived from Liquid object structure; needs dev store verification

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (Shopify platform APIs are stable; Section Rendering API has been unchanged since 2020)
