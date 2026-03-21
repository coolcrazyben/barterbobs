# Pitfalls Research

**Domain:** Custom Shopify OS 2.0 Theme — Subscription Grocery / Editorial Design
**Researched:** 2026-03-20
**Confidence:** HIGH (sources: Shopify official docs, Dawn theme analysis, verified community post-mortems)

---

## Critical Pitfalls

### Pitfall 1: Lazy-Loading the LCP Hero Image

**What goes wrong:**
The hero image — the Largest Contentful Paint (LCP) element — is given `loading="lazy"` because developers apply a blanket lazy-load strategy to all section images to be "safe." The browser defers fetching until scroll proximity, meaning it cannot start downloading the image until after parse + layout, blowing the LCP budget past 2.5s. On BarterBobs this is the full-bleed editorial hero on every homepage variant.

**Why it happens:**
Shopify's section model lets merchants reorder sections, so developers cannot know at authoring time which section renders above the fold. Before late 2023, there was no API to detect position, so teams defaulted to `loading="lazy"` everywhere. Figma-to-code exports (like the `stitch_barterbobs_landing_page/` files) typically also use inline `<img loading="lazy">` on every element.

**How to avoid:**
Use `section.index` (1-based) and `section.index0` (0-based) properties introduced in Shopify 2023 to conditionally apply loading attributes:

```liquid
{% assign loading = 'lazy' %}
{% assign fetchpriority = 'auto' %}
{% if section.index <= 2 %}
  {% assign loading = 'eager' %}
  {% assign fetchpriority = 'high' %}
{% endif %}
<img
  src="{{ image | image_url: width: 1500 }}"
  srcset="{{ image | image_url: width: 750 }} 750w, {{ image | image_url: width: 1500 }} 1500w"
  sizes="100vw"
  loading="{{ loading }}"
  fetchpriority="{{ fetchpriority }}"
  width="{{ image.width }}"
  height="{{ image.height }}"
  alt="{{ image.alt | escape }}"
>
```

Never use `fetchpriority="high"` together with `srcset` on the same element — browsers ignore `fetchpriority` when `srcset` is present. Use `fetchpriority` only on the single-`src` preload `<link>` in `<head>` for the hero.

Do not render the hero as a CSS `background-image`. That prevents HTTP preload, auto-srcset, and `fetchpriority`, and the browser cannot even start fetching the image until CSS is parsed.

**Warning signs:**
- PageSpeed Insights flags LCP image as lazy-loaded
- Hero section Liquid file contains `loading="lazy"` as a hardcoded string
- Lighthouse LCP > 2.5s on mobile throttled connection
- `section.index` not referenced anywhere in the hero section template

**Phase to address:** Foundation phase (CSS/Liquid base + homepage). Must be established before any section images are coded.

---

### Pitfall 2: JavaScript Not Re-Initializing After Theme Editor Section Load

**What goes wrong:**
JavaScript that attaches event listeners on `DOMContentLoaded` or `document.addEventListener('DOMContentLoaded', ...)` fires once on page load. When a merchant adds, removes, reorders, or re-renders a section in the Theme Editor, Shopify dynamically updates the DOM without a page reload. Any listeners or initialization code tied to the original DOM nodes are gone; new nodes have nothing attached. Result: sliders don't slide, subscription selectors don't update the hidden input, cart buttons don't open the drawer — in editor only.

**Why it happens:**
Developers test in a browser tab pointing at the storefront, not inside `?design_mode=true`. The editor uses `shopify:section:load`, `shopify:section:unload`, and `shopify:block:select` CustomEvents on `document`, which most developers are unaware of until a client reports broken editor behavior.

**How to avoid:**
Wrap all section initialization in a function that can be called both on page load and in response to editor events. Use `Shopify.designMode` to detect context:

```js
function initSubscriptionSelector(container) {
  const selector = container.querySelector('[data-selling-plan-select]');
  if (!selector) return;
  selector.addEventListener('change', onPlanChange);
}

// Page load
document.querySelectorAll('[data-section-type="pdp-subscription"]').forEach(initSubscriptionSelector);

// Theme editor re-init
document.addEventListener('shopify:section:load', (event) => {
  initSubscriptionSelector(event.target);
});

document.addEventListener('shopify:section:unload', (event) => {
  const selector = event.target.querySelector('[data-selling-plan-select]');
  if (selector) selector.removeEventListener('change', onPlanChange);
});
```

Reference Dawn's `theme-editor.js` asset as the canonical pattern. Also handle `shopify:block:select` for any per-block interactions.

**Warning signs:**
- Subscription selector or cart button requires page refresh to work after adding a section in editor
- No `shopify:section:load` listener appears anywhere in JS files
- Initialization logic lives entirely in a top-level IIFE or `DOMContentLoaded` handler
- No `Shopify.designMode` guard anywhere in codebase

**Phase to address:** Foundation phase (JS architecture), then enforced in every section's JS module.

---

### Pitfall 3: Missing `selling_plan` Hidden Input in Product Form

**What goes wrong:**
The subscription frequency selector (weekly/biweekly/monthly) renders visually and lets users pick an option, but the selected selling plan ID is never submitted with the form. The add-to-cart call silently drops the subscription, adding the product as a one-time purchase instead. This is invisible to the user on the PDP but breaks subscription billing entirely.

**Why it happens:**
The design export (`product_detail_page_pdp/code.html`) renders the frequency selector as a visual UI element. Translating it to Liquid focuses on appearance; developers forget that Shopify requires a hidden `<input name="selling_plan" value="">` inside the product form, with JavaScript keeping its `value` in sync with the user's choice.

**How to avoid:**
Inside the `{% form 'product', product %}` tag, include:

```html
<input type="hidden" name="selling_plan" id="selling-plan-{{ section.id }}" value="">
```

JavaScript must update this input on every selector change event. Also handle the `selling_plan_allocation` to display the correct discounted price when a plan is selected. Verify the hidden input value is populated before form submission:

```js
form.addEventListener('submit', (e) => {
  const planInput = form.querySelector('[name="selling_plan"]');
  if (planInput && planInput.value === '') {
    // Either the product requires a plan (reject) or it's one-time (allow)
    if (product.requires_selling_plan) {
      e.preventDefault();
      // show error
    }
  }
});
```

**Warning signs:**
- Cart items show as one-time purchase even when user selected a subscription frequency
- No `<input name="selling_plan">` in the product form Liquid
- No JS event listener targeting `[name="selling_plan"]` updates
- `product.selling_plan_groups` is iterated in the template but no sync code exists in JS

**Phase to address:** PDP phase (product form + subscription selector).

---

### Pitfall 4: Cart Drawer AJAX Race Conditions and Stale State

**What goes wrong:**
User rapidly increments quantity in the cart drawer. Each change fires a `POST /cart/change.js` AJAX call. Responses arrive out of order; the last response to arrive (not the last request sent) overwrites cart state. Drawer shows wrong quantity. Or: two concurrent calls overwrite each other's cart attributes, silently losing one update.

**Why it happens:**
Simple debounce or `setTimeout` solutions are applied to the UI input, but the underlying AJAX calls are still fired without request queuing or abort/cancel logic. The Shopify Cart AJAX API does not have built-in optimistic locking for the standard endpoints.

**How to avoid:**
Implement a request queue: serialize all cart mutation calls so only one is in-flight at a time. Use `AbortController` to cancel previous pending requests when a new quantity change arrives. Use bundled section rendering so that the cart HTML update is returned in the same response as the mutation — eliminating a separate fetch:

```js
async function updateCartItem(id, quantity) {
  if (this._pendingRequest) this._pendingRequest.abort();
  const controller = new AbortController();
  this._pendingRequest = controller;

  const body = JSON.stringify({
    id,
    quantity,
    sections: ['cart-drawer', 'cart-icon-bubble']
  });

  const response = await fetch(`${window.Shopify.routes.root}cart/change.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: controller.signal
  });

  const data = await response.json();
  // Update DOM from data.sections['cart-drawer']
}
```

Always use `window.Shopify.routes.root` as the base for AJAX URLs, not hardcoded `/` — this ensures locale-aware routing.

**Warning signs:**
- Cart total flickers or reverts after rapid quantity changes
- Console shows multiple concurrent `POST /cart/change.js` requests without abort
- Cart HTML is fetched in a separate GET request after a cart mutation
- Hardcoded `/cart/change.js` URL instead of `window.Shopify.routes.root + 'cart/change.js'`

**Phase to address:** Cart Drawer phase.

---

### Pitfall 5: Cart Drawer Missing Accessibility (Focus Trap, Scroll Lock, ARIA)

**What goes wrong:**
The cart drawer opens visually but keyboard users cannot navigate into it (focus stays on the triggering button). Screen reader users receive no announcement that a drawer appeared. The background page scrolls underneath the open drawer on iOS Safari (rubber-band scroll bleeds through). Pressing Escape does not close the drawer.

**Why it happens:**
Cart drawer is built as a CSS slide-in panel without the modal semantics required by WCAG 2.1. Body scroll lock for iOS Safari is notoriously tricky — `overflow: hidden` on `body` does not work on iOS because the scroll is on the `<html>` element or the viewport itself.

**How to avoid:**
Implement the drawer as an ARIA dialog:

```html
<div id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title" hidden>
  <h2 id="cart-drawer-title">Your cart</h2>
  <!-- content -->
  <button data-close-drawer>Close</button>
</div>
```

Focus management on open: move focus to `#cart-drawer-title` or the close button. Focus trap: intercept Tab/Shift-Tab to keep focus within the drawer. Escape handler: listen on `document` for `keydown` with `key === 'Escape'`. iOS scroll lock: use `position: fixed; top: -${scrollY}px; width: 100%` on `body` while drawer is open, restore scroll position on close.

Announce cart updates to screen readers with an `aria-live="polite"` region that updates with item count or success message after add-to-cart.

Touch targets for all cart controls (quantity +/-, remove, close) must be at minimum 44×44px.

**Warning signs:**
- No `role="dialog"` on drawer element
- No `aria-live` region for cart update announcements
- Background page visibly scrolls on iOS when drawer is open
- Pressing Escape does nothing with drawer open
- DevTools accessibility tree shows drawer elements as inaccessible when drawer is "hidden" via CSS only (use `hidden` attribute or `display: none`, not just `transform: translateX`)

**Phase to address:** Cart Drawer phase. Must be verified with keyboard-only navigation before sign-off.

---

### Pitfall 6: Section Schema Gaps That Break Theme Editor Customizability

**What goes wrong:**
Sections render correctly on the storefront but are "dumb" in the Theme Editor — colors are hardcoded, copy is hardcoded, image slots don't exist. The merchant or designer cannot update the homepage hero text, swap a product image, or change the CTA color without editing Liquid. This violates the project requirement that "all sections are customizable via Theme Editor."

**Why it happens:**
Developers translate Figma exports to Liquid with hardcoded values because that's the direct translation path. Adding schema settings is a second step that gets skipped under time pressure.

**How to avoid:**
For every section, define schema settings for every piece of content that could reasonably change: heading text, subheading, body copy, CTA label, CTA URL, background color, image, image alt, enable/disable toggles for optional elements. Use `type: "color"` with a default matching the design token. For repeatable items (product cards, testimonials), use blocks:

```json
{
  "name": "Hero",
  "settings": [
    { "type": "image_picker", "id": "hero_image", "label": "Hero image" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Fresh from the farm." },
    { "type": "color", "id": "heading_color", "label": "Heading color", "default": "#faf6f0" },
    { "type": "url", "id": "cta_url", "label": "Button URL" },
    { "type": "text", "id": "cta_label", "label": "Button label", "default": "Shop now" }
  ]
}
```

The 25-section-per-page limit and 50-block-per-section limit are hard platform constraints — design section groupings to stay well within these.

**Warning signs:**
- Section Liquid files contain hardcoded hex values or copy strings that match Figma specs exactly
- Schema `settings` array is empty or contains only a single `type: "header"` divider
- No `type: "image_picker"` settings on sections that display images
- Theme Editor shows sections as unconfigurable gray boxes with no settings panel

**Phase to address:** Every phase where a section is first built. Establish schema checklist before coding section content.

---

### Pitfall 7: `img_url` Filter Instead of `image_url` (Deprecated, Fails Theme Check)

**What goes wrong:**
`shopify theme check` reports `DeprecatedFilter` errors. The deprecated `img_url` filter is used throughout the theme (often copied from older tutorials or Figma export code), blocking a clean check run. This violates the project requirement of zero errors and warnings.

**Why it happens:**
`img_url` was the standard Shopify filter for years. Most third-party tutorials, StackOverflow answers, and Figma-exported HTML snippets that date from before 2022 use it. The `image_url` replacement has different syntax.

**How to avoid:**
Always use `image_url` with the `width:` parameter:

```liquid
{%- comment -%} WRONG — deprecated {%- endcomment -%}
{{ product.featured_image | img_url: '800x' }}

{%- comment -%} CORRECT {%- endcomment -%}
{{ product.featured_image | image_url: width: 800 }}
```

Run `shopify theme check --auto-correct` which can automatically replace `img_url` instances. Integrate `shopify theme check` into a pre-commit hook or CI step from day one so deprecated filters never accumulate.

Also avoid `money_with_currency` formatting mismatches — use `money` filter with the store currency symbol from `shop.currency` rather than hardcoding `$`.

**Warning signs:**
- `shopify theme check` output contains `DeprecatedFilter` warnings
- Liquid files contain `| img_url:` (with the old filter name)
- Any code pasted from tutorials predating 2022
- `{{ shop.money_format }}` used without wrapping in `money_with_currency` where international customers are expected

**Phase to address:** Foundation phase. Establish `theme check` as part of local dev workflow before any sections are coded.

---

### Pitfall 8: Subscription UX Anti-Patterns on PDP

**What goes wrong:**
The subscription frequency selector uses visual patterns that conflict with Shopify's subscription UX guidelines, causing confusion or rejection if submitted to the Theme Store, and harming conversion. Most commonly: selector uses button-style toggle UI that visually competes with the "Add to cart" CTA, or the one-time purchase option is not pre-selected by default, or pricing shows hardcoded dollar-amount savings that break with currency switching.

**Why it happens:**
The design export shows a visually attractive button-toggle or pill selector. Designers optimize for visual appeal; developers implement it literally. Shopify's subscription UX guidelines (which are normative, not advisory) specify different component patterns.

**How to avoid:**
Follow Shopify's official subscription UX guidelines:
- Use radio inputs (not buttons) for 4 or fewer frequency options
- Use a `<select>` dropdown for more than 4 options
- Pre-select the one-time purchase option on initial page load; never pre-select a subscription without explicit user intent
- Never show exact saved dollar amounts in option labels (e.g., "Save $5/week") — use percentages or "save X%" only
- Never hide the form label for aesthetic reasons
- Stack frequency options vertically; never horizontal pill rows on mobile
- The subscription radio group must not visually compete with the "Add to cart" submit button

For BarterBobs (weekly/biweekly/monthly = 3 options), radio inputs are required.

**Warning signs:**
- Frequency selector uses `<button>` elements with JS toggle classes instead of `<input type="radio">`
- Default selected state is a subscription option (not "one-time" or "subscribe & save")
- Frequency labels contain dollar amounts ("`$4.50 savings per week`")
- Selector is laid out in a horizontal flex row on mobile without wrapping
- Form label is `display: none` for aesthetic reasons

**Phase to address:** PDP phase (subscription selector component).

---

### Pitfall 9: Glassmorphism Nav Performance and Safari Compatibility

**What goes wrong:**
The glassmorphism navigation (a project requirement from the design spec) uses `backdrop-filter: blur()` without the `-webkit-` prefix, breaking the effect on iOS Safari. Or: blur value is too high (> 20px), causing GPU overload and janky scroll on lower-end mobile devices. Or: the blurred element covers a large viewport area, compounding the GPU cost.

**Why it happens:**
`backdrop-filter` has had excellent Chrome/Edge support for years, leading developers to omit the `-webkit-` prefix. On iOS Safari, the `-webkit-backdrop-filter` prefix is still required for full support. High blur values are chosen for visual effect without profiling.

**How to avoid:**
Always include both properties:

```css
.nav-glass {
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  backdrop-filter: blur(12px) saturate(180%);
  background-color: rgba(250, 246, 240, 0.6);
}
```

Keep blur values between 8–15px. Apply `backdrop-filter` only to the navigation bar, not to large full-viewport overlays. Add `transform: translateZ(0)` to create a GPU compositing layer and prevent repaint cascades. Test on a real low-end Android device and iOS Safari (not just Chrome DevTools mobile emulation). Consider a `@media (prefers-reduced-motion: reduce)` fallback that removes blur and uses a solid semi-transparent background instead:

```css
@media (prefers-reduced-motion: reduce) {
  .nav-glass {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background-color: rgba(250, 246, 240, 0.92);
  }
}
```

**Warning signs:**
- Nav has `backdrop-filter` but no `-webkit-backdrop-filter` rule
- Scroll stutters on mid-range Android when nav is sticky
- Blur value exceeds 20px
- iOS Safari shows nav with no blur effect at all

**Phase to address:** Foundation phase (global styles + header section).

---

### Pitfall 10: `settings_data.json` Overwrite on Theme Push

**What goes wrong:**
Developer runs `shopify theme push` to deploy code changes. The CLI overwrites the live store's `config/settings_data.json` with the local version, resetting all content the merchant or designer has configured in the Theme Editor — homepage section content, font choices, color overrides. Known documented CLI behavior.

**Why it happens:**
`settings_data.json` holds both theme code defaults (OK to push) and live merchant customizations (must not be overwritten). The distinction is invisible. Developers push their working copy without realizing it resets production content.

**How to avoid:**
Add `config/settings_data.json` to `.shopifyignore` for all push operations after initial setup:

```
# .shopifyignore
config/settings_data.json
```

Use targeted push commands to deploy only code changes:

```bash
shopify theme push --only "templates/*" "sections/*" "snippets/*" "assets/*" "layout/*" "locales/*"
```

During initial theme setup (before merchant customizes), push `settings_data.json` once with the desired presets. After that, treat it as production data owned by the store, not the codebase. Never commit a `settings_data.json` that reflects one developer's local customizations.

**Warning signs:**
- `settings_data.json` is not in `.shopifyignore`
- Merchant reports homepage content reset after a developer deploy
- `settings_data.json` in git shows personalized section content instead of just default values
- CLI reconciliation prompts appear on every push asking how to handle `settings_data.json` conflicts

**Phase to address:** Foundation phase (dev environment + deployment setup). Must be established before any content is configured in the store.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode hex colors in Liquid instead of using CSS custom properties | Faster initial build | Design token changes require grep-and-replace across all files; breaks theming | Never — define CSS custom properties from day one |
| Copy Figma export HTML directly into section with minimal changes | Faster section scaffolding | Deprecated filters, inaccessible markup, inline styles, no schema settings | Acceptable for scaffold only; must be refactored before commit |
| Apply `loading="lazy"` to all images universally | Simpler mental model | LCP failure on every page with a hero image | Never — use `section.index`-based logic |
| Use `document.querySelector` without scoping to section container | Works when one section per page | Breaks when same section appears multiple times; returns first instance only | Never — always scope to `section.id` or container element |
| Omit `shopify:section:load` re-init handlers | Simpler JS | Features break in Theme Editor without page reload | Never for interactive sections |
| Use `<button>` toggles for subscription frequency | Matches Figma design | Violates Shopify UX guidelines; harms screen reader UX | Never — use radio inputs per guidelines |
| Push `settings_data.json` in every deploy | Simple deployment | Resets merchant-configured content | Never after initial setup |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Subscription app (Recharge / Skio) | Building custom frequency selector that bypasses app's widget entirely | Use app's selling plan groups via `product.selling_plan_groups` in Liquid; the app manages plan creation and billing, theme only renders the selection UI |
| Subscription app | Not including `<input name="selling_plan">` hidden field in product form | Required field — without it, selections are silently dropped and items add as one-time purchase |
| Cart AJAX API | Hardcoding `/cart/add.js` URL | Always use `window.Shopify.routes.root + 'cart/add.js'` for locale-aware routing |
| Cart AJAX API | Reading cart state from `cart.item_count` Liquid after AJAX update | Liquid renders at page load; use Section Rendering API to get fresh HTML after mutation |
| Google Fonts (Newsreader, Inter) | Loading via `<link>` in `<head>` without preconnect | Add `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` before the Google Fonts `<link>` |
| Google Fonts | Loading all weights and styles | Only load the exact weights used: Newsreader 400/600/700 italic, Inter 400/500 — extra variants add 100–300ms |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Hero image as CSS `background-image` | LCP > 3s, PageSpeed flags "Preload largest contentful paint image" | Use `<img>` tag with `fetchpriority` and `section.index` logic | Immediately on any page with a hero |
| Google Fonts loaded without preconnect | FOUT / FOIT; text invisible for 1–2s on first load | `<link rel="preconnect">` + `font-display: swap` | First meaningful paint; worsens on slow mobile |
| `backdrop-filter: blur()` on large elements | Jank / dropped frames on scroll; low-end mobile throttles GPU | Limit to nav bar only; keep blur ≤ 15px; use `will-change: transform` | Mid-range mobile, iOS low-power mode |
| Looping over full collection in Liquid | Slow server-side render; potential Liquid timeout at 1000-iteration cap | Use `paginate` tag to cap iterations; filter server-side before loop | Collections > 50 products without pagination |
| Multiple `all_products` references on homepage | "Exceeded maximum number of unique handles" Liquid error; page fails | Use collection-scoped loops; avoid `all_products` object entirely | > 20 unique product handles referenced per page |
| Unbounded `{% render %}` inside loops | Render budget exhausted; Liquid 30s timeout | Flatten renders; avoid rendering snippets inside high-iteration loops | Collections > 200 products |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Outputting user-controlled data without `| escape` | XSS via product metafields, customer name fields, or URL parameters rendered in Liquid | Always use `| escape` filter on any Liquid output derived from user input or Shopify data that could contain HTML |
| Exposing private API keys in theme JS assets | Credential theft via view-source | Never embed API keys in theme files; use Shopify metafields or app proxy for backend calls requiring auth |
| Using `javascript:` URIs in `href` from schema settings | XSS if merchant pastes malicious URL in CTA link setting | Validate URL settings with Shopify's `type: "url"` schema type, which restricts to relative or HTTP/HTTPS URLs only |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Subscription frequency pre-selected as default | Users unknowingly subscribe; high churn and chargebacks | Pre-select one-time purchase; make subscription opt-in with clear visual distinction |
| Cart drawer with no body scroll lock on iOS | Background page scrolls under drawer; disorienting on mobile | Apply iOS scroll lock pattern: `position: fixed` on body with scroll position preservation |
| No `aria-live` announcement after add-to-cart | Screen reader users don't know cart updated; may re-add items | Add `aria-live="polite"` region that announces "Item added. Cart now has X items." |
| Variant selector showing unavailable combinations without feedback | User selects color + size combo that doesn't exist; sees generic "unavailable" or broken form | Mark sold-out option values with `disabled` and visible strikethrough; update dynamically via JS as options change |
| Hardcoded dollar savings in subscription option labels | Shows wrong amounts after currency conversion; merchant cannot update | Use percentage savings only, or "Save X%" derived from `selling_plan_allocation.compare_at_price` |
| Cart quantity input without debounce | Each keypress fires AJAX call; race conditions; stale cart state | Debounce 300ms + request serialization queue |

---

## "Looks Done But Isn't" Checklist

- [ ] **Hero LCP image:** Has `loading="lazy"` been removed from the first section? Verify `section.index <= 2` condition is applied. Check PageSpeed Insights LCP element is not lazy-loaded.
- [ ] **Subscription form:** Does the product form contain `<input type="hidden" name="selling_plan" value="">`? Does JS update it on selector change? Add item to cart and inspect request body in Network tab for `selling_plan` parameter.
- [ ] **Cart drawer accessibility:** Open drawer with keyboard only. Can focus enter the drawer? Does Tab stay inside? Does Escape close it and return focus to trigger? Test with VoiceOver or NVDA.
- [ ] **Theme check:** Run `shopify theme check` in CI/locally. Zero errors AND zero warnings. `img_url` filter replaced, no unused assigns, no missing templates.
- [ ] **Section editor re-init:** In Theme Editor (`?design_mode=true`), add a second instance of every interactive section. Do all sections work independently without page reload?
- [ ] **`settings_data.json` protection:** Verify `.shopifyignore` contains `config/settings_data.json`. Verify push command does not include settings_data.
- [ ] **iOS scroll lock:** Open cart drawer on a physical iOS device. Attempt to scroll the background page. Content behind drawer must not move.
- [ ] **Glassmorphism nav on iOS Safari:** Test navigation blur effect on real iPhone Safari. If no blur visible, `-webkit-backdrop-filter` prefix is missing.
- [ ] **Subscription selector radio inputs:** Inspect DOM. Frequency options must be `<input type="radio">`, not `<button>` or `<div>` with click handlers.
- [ ] **Font loading:** Check Network tab for font requests. Newsreader and Inter must load from a preconnect-enabled origin. No FOUT on slow 3G throttle.
- [ ] **Variant selector sync:** Select an out-of-stock variant combination. URL must update with `?variant=ID`. Page refresh must preserve the selection. Add-to-cart must be disabled for unavailable variants.
- [ ] **Image dimensions set:** All `<img>` tags have explicit `width` and `height` attributes (or CSS aspect-ratio). Check CLS score is < 0.1.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| LCP lazy load discovered post-launch | LOW | Add `section.index` conditional to hero section; redeploy assets only |
| Editor re-init missing across all sections | HIGH | Audit every section JS file; add `shopify:section:load` handlers; regression test all sections in editor |
| `selling_plan` input missing | MEDIUM | Add hidden input to product form Liquid; add JS sync; test checkout with subscription app |
| `settings_data.json` overwrite wipes live content | HIGH | Restore from Shopify's version history (Admin > Themes > Actions > Edit code > history); add `.shopifyignore` immediately |
| Theme check failures block store submission | MEDIUM | Run `shopify theme check --auto-correct` to fix auto-fixable issues; manually fix remainder; establish check in pre-commit |
| Cart drawer race conditions | MEDIUM | Add AbortController pattern and request queue to cart JS; regression test rapid quantity changes |
| Subscription UX fails guideline review | MEDIUM | Replace `<button>` toggles with radio inputs; update CSS to match; verify selling plan hidden input sync |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| LCP hero lazy load | Phase 1: Foundation (section image loading pattern) | `shopify theme check` + PageSpeed mobile LCP < 2.5s |
| JS editor re-init | Phase 1: Foundation (JS architecture standard) | Manual test in Theme Editor for every interactive section |
| Missing `selling_plan` input | Phase 3: PDP (product form + subscription selector) | Network tab shows `selling_plan` in POST body on add-to-cart |
| Cart drawer race conditions | Phase 4: Cart Drawer (AJAX implementation) | Rapid quantity change test; console shows aborted duplicate requests |
| Cart drawer accessibility | Phase 4: Cart Drawer (a11y implementation) | Keyboard-only navigation audit; NVDA/VoiceOver test |
| Subscription UX anti-patterns | Phase 3: PDP (frequency selector) | DOM inspection confirms radio inputs; Shopify guideline review |
| `img_url` deprecated filter | Phase 1: Foundation (establish theme check CI) | `shopify theme check` zero warnings before any section is merged |
| Section schema gaps | Every phase (checklist before section sign-off) | Theme Editor shows configurable settings for every section |
| Glassmorphism performance | Phase 1: Foundation (header section) | Scroll frame rate test on physical mid-range Android + iOS |
| `settings_data.json` overwrite | Phase 1: Foundation (dev tooling setup) | Verify `.shopifyignore` exists; verify push does not include settings_data |

---

## Sources

- [Shopify: Integrate sections and blocks with the theme editor](https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks) — HIGH confidence
- [Shopify: Subscription UX guidelines](https://shopify.dev/docs/storefronts/themes/pricing-payments/subscriptions/subscription-ux-guidelines) — HIGH confidence
- [Shopify: Add subscriptions to your theme](https://shopify.dev/docs/storefronts/themes/pricing-payments/subscriptions/add-subscriptions-to-your-theme) — HIGH confidence
- [Shopify: JSON templates reference](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates) — HIGH confidence
- [Shopify: Sections reference — limits](https://shopify.dev/docs/storefronts/themes/architecture/sections) — HIGH confidence
- [Shopify: Accessibility best practices for themes](https://shopify.dev/docs/storefronts/themes/best-practices/accessibility) — HIGH confidence
- [Shopify performance: Debug LCP with CSS selectors](https://performance.shopify.com/blogs/blog/css-selectors-lcp) — HIGH confidence
- [EcomIdeas: Why your theme lazy loads the LCP image (section.index fix)](https://ecomideas.com/site-speed-why-your-shopify-theme-lazy-loads-your-lcp-image-and-how-to-fix-it) — MEDIUM confidence (verified against Shopify docs)
- [nickdrishinski.com: How Dawn uses Section Rendering API for cart refresh](https://nickdrishinski.com/blogs/shopify/how-dawn-theme-uses-section-rendering-api-for-cart-refresh) — MEDIUM confidence
- [Shopify community: Cart AJAX race conditions](https://community.shopify.dev/t/potential-race-conditions-with-cart-update-ajax-call-to-just-update-cart-attributes/21061) — MEDIUM confidence
- [Dawn GitHub issue #1660: Background scrolling in cart drawer iOS](https://github.com/Shopify/dawn/issues/1660) — MEDIUM confidence
- [Shopify community: section:load event listener stacking](https://community.shopify.com/t/whats-up-with-shopifyload-stacking-event-listeners/572531) — MEDIUM confidence
- [Shopify CLI issue #2467: settings_data.json overwritten on push](https://github.com/Shopify/shopify-cli/issues/2467) — HIGH confidence (documented CLI bug)
- [Shopify blog: 3 PDP accessibility issues to fix](https://www.shopify.com/partners/blog/3-product-detail-page-accessibility-issues-to-fix-right-now) — HIGH confidence

---
*Pitfalls research for: Custom Shopify OS 2.0 Theme — BarterBobs subscription grocery*
*Researched: 2026-03-20*
