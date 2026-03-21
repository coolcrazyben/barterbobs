# Phase 1: Foundation - Research

**Researched:** 2026-03-20
**Domain:** Shopify OS 2.0 theme scaffold — design tokens, global JS, navigation shell
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Font loading**
- Google Fonts CDN via `<link>` in `layout/theme.liquid` — not Shopify font picker, not self-hosted
- Newsreader: weights 400 + 600 only (display headlines + semibold emphasis)
- Inter: weights 400 + 500 + 600 + 700 (full UI range; Inter variable font makes this payload-efficient)
- Newsreader `<link rel="preload">` in `<head>` for LCP (above-the-fold display font)
- Inter loads via standard `<link rel="stylesheet">` — not render-blocking for hero
- `font-display: swap` on both fonts to prevent FOIT

**CSS token depth**
- Core design tokens only — not a full design system upfront
- Semantic naming convention: `--color-brand-primary`, `--color-brand-accent`, `--color-surface`, `--color-text`, `--color-text-muted` (not literal names like `--color-red-900`)
- Animation tokens: `--transition-base` (200ms ease for hovers) and `--transition-fast` (for snappy UI interactions) — defined in Phase 1 so all sections stay consistent
- Section spacing tokens: `--section-gap` (12rem) and `--section-gap-sm` (6rem) — captures the Figma editorial vertical rhythm
- Component-level spacing (padding, margin within sections) written directly in section CSS, not tokenized

**JS bundle architecture**
- ES modules in `assets/` loaded via `<script type="module">` — no build step, served from Shopify CDN
- `theme.liquid` loads only `global.js` eagerly (with `defer`); section-specific JS loads within each section's liquid file
- Cross-section communication via custom events on `document` (e.g., `cart:updated`, `cart:open`, `drawer:close`) — no global namespace pollution
- Base class `ShopifySection extends HTMLElement` defined in `global.js` — sections extend it and override `onSectionLoad` / `onSectionUnload` lifecycle methods
- Sections register via `customElements.define('section-name', SectionClass)` — FNDX-03 requirement met

**Header visual scope in Phase 1**
- Fully pixel-perfect to Figma in Phase 1: glassmorphism effect (semi-transparent background, `backdrop-filter: blur(12px)`), sticky scroll behavior, warm red brand palette, and hover states all land now — not deferred to Phase 4
- Mobile breakpoint: hamburger at < 768px; full horizontal nav at 768px+
- Mobile nav drawer: slides in from the left with semi-transparent dark overlay backdrop; clicking overlay or ✕ closes it
- Footer: fully implemented in Phase 1 — navigation links, brand mark, and merchant-configurable content blocks (not a placeholder)

### Claude's Discretion

None specified — all implementation decisions are locked for Phase 1.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 1 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FNDX-01 | Theme uses Shopify OS 2.0 architecture — all templates are JSON files referencing section liquid files; no markup in template files | Section Groups pattern, JSON template structure, and `{% sections %}` plural tag — fully documented in architecture research. Three JSON templates needed for Phase 1: `index.json`, `404.json`, and stub templates for remaining page types. |
| FNDX-02 | CSS design tokens extracted from Figma exports and defined as CSS custom properties in `snippets/css-variables.liquid` | Colors extracted from design exports: primary `#b5092d`, surface `#faf8ff`, on-surface `#121a33`, secondary `#366476`. Token naming convention and the Liquid-to-CSS flow via `settings_schema.json` → `css-variables.liquid` are research-proven patterns. |
| FNDX-03 | Global JS infrastructure implemented as vanilla web components with pubsub utility and `shopify:section:load`/`shopify:section:unload` handlers | `ShopifySection extends HTMLElement` base class in `global.js`; `customElements.define`; document-level `CustomEvent` pub/sub — all established patterns from Dawn. Section lifecycle handler pattern documented in PITFALLS.md Pitfall 2. |
| FNDX-04 | Every section exposes its settings via section schema blocks so merchants can customize content and appearance through Theme Editor | Section `{% schema %}` requirements documented — `name`, `settings`, `presets`, `enabled_on`. Header and footer sections built in Phase 1 must have complete schema. |
| FNDX-05 | `config/settings_schema.json` defines global theme settings that populate CSS custom properties via `snippets/css-variables.liquid` | The `settings_schema.json` → `css-variables.liquid` → `:root { --token: value }` pipeline is the canonical pattern. Global settings to define: color pickers for brand palette, global border-radius, section gap scale. |
| FNDX-06 | `.shopifyignore` includes `config/settings_data.json` to prevent CLI overwrites of live store content | Directly addressed in PITFALLS.md Pitfall 10. Must be the first file created in the project — before any `shopify theme push`. |
| NAVX-01 | Header renders as a section group with glassmorphism effect and sticks to the top of the viewport on scroll | Section group via `header-group.json` + `{% sections 'header-group' %}` in `theme.liquid`. Glassmorphism: `-webkit-backdrop-filter: blur(12px) saturate(180%)` + `backdrop-filter: blur(12px) saturate(180%)` — both prefixes required (Pitfall 9). `position: sticky; top: 0` for scroll behavior. |
| NAVX-02 | Header includes cart icon with dynamic item count badge that updates without page reload when items are added | Cart badge listens for `cart:updated` CustomEvent dispatched on `document`; fetches `/cart.js` for fresh count. Badge web component defined in `global.js`. No cart drawer implementation in Phase 1 — badge only. |
| NAVX-03 | Mobile navigation collapses to hamburger icon at < 768px; opens full-height off-canvas drawer | `<nav-drawer>` web component. Hamburger at `@media (max-width: 767px)`. Drawer slides from LEFT (so it won't conflict with future cart drawer from the right in Phase 3). `aria-expanded` on hamburger toggle. Overlay backdrop closes drawer on click. |
| NAVX-04 | Footer renders as a section group with navigation links, brand identity, and merchant-configurable content blocks | `footer-group.json` section group + `sections/footer.liquid` with complete schema. Design exports show: brand wordmark, nav link columns, social icons, copyright line. All content blocks configurable via Theme Editor. |
</phase_requirements>

---

## Summary

Phase 1 establishes the structural and visual foundation that every subsequent phase builds on. It has three distinct work areas: (1) dev environment + project scaffold + settings schema + CSS tokens, (2) global JS infrastructure + `theme.liquid` shell, and (3) header section (glassmorphism nav, cart badge, mobile drawer) + footer section.

All implementation decisions for this phase are locked. The stack is Shopify CLI 3.92.x, Liquid, vanilla JS ES modules (no build step), and CSS custom properties. No CSS framework, no jQuery, no transpilation. The design source is `stitch_barterbobs_landing_page/barterbobs_main_landing_page/code.html` for all color values, typography, and layout patterns.

The most critical correctness concerns for Phase 1 are: (a) `header-group.json` must use the `{% sections %}` plural tag pattern — not `{% section %}` singular — for Theme Editor extensibility; (b) glassmorphism nav must include `-webkit-backdrop-filter` prefix for iOS Safari; (c) `settings_data.json` must be in `.shopifyignore` before any theme push occurs; (d) every interactive section must register `shopify:section:load` re-init handlers from day one.

**Primary recommendation:** Build in plan order — scaffold + tokens first, then JS infrastructure, then header/footer — because each plan's output is a hard prerequisite for the next.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Shopify CLI | 3.92.1 (current March 2026) | Dev server, hot reload, theme check, push/pull | Only official tool for OS 2.0 development; no alternative exists |
| Liquid (Shopify platform) | Current platform | Server-side template rendering | Mandatory for Shopify themes; all page rendering is Liquid + HTML |
| Vanilla JS (ES2020+) | Native browser | Web components, pub/sub, interactive UI | Project constraint + Dawn's established architecture |
| CSS Custom Properties | Native browser | Design token system, dynamic merchant settings | Canonical pattern for bridging Liquid settings into CSS; no build step needed |
| Node.js | 20.x LTS (min 18.20) | Required to run Shopify CLI | Official runtime requirement |

### Supporting / Dev Tools

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@shopify/prettier-plugin-liquid` | latest | Opinionated Liquid/HTML formatter | Every save — configure in `.prettierrc`, integrate with VS Code |
| Shopify Liquid VS Code Extension | latest | IntelliSense, inline theme-check linting, schema validation | Install once, provides inline validation as you type |
| Google Fonts CDN | n/a | Newsreader + Inter font loading | `<link>` in `theme.liquid` head — locked decision, not Shopify font picker |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS Custom Properties | Tailwind CSS | Tailwind requires build pipeline incompatible with Shopify CDN; Theme Editor cannot control utility values; **ruled out by project constraint** |
| Vanilla JS Web Components | Alpine.js | Alpine adds ~15KB but reduces boilerplate; **ruled out by project constraint (no jQuery, minimal dependencies)** |
| Google Fonts CDN | Shopify Font Picker | Font picker limits available typefaces; Newsreader not available; **ruled out by locked decision** |
| No build pipeline | esbuild / Vite | Justified only if SCSS or JS bundling across many files is needed; BarterBobs scope does not warrant the complexity |

**Installation (dev tools only — no production dependencies):**
```bash
npm install -D prettier @shopify/prettier-plugin-liquid
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 1 Files)

Phase 1 creates the complete scaffold. Files marked (P1) are created in this phase; files marked (stub) are minimal stubs needed so `shopify theme check` passes (they will be fully built in later phases).

```
barterbobs-theme/
├── .shopifyignore                    # (P1) MUST be first — blocks settings_data.json push
├── assets/
│   ├── base.css                      # (P1) CSS custom properties, resets, typography base
│   ├── component-header.css          # (P1) Glassmorphism nav, sticky, mobile drawer
│   ├── component-footer.css          # (P1) Footer layout styles
│   └── global.js                     # (P1) ShopifySection base class, pub/sub, trapFocus, cart badge
├── config/
│   ├── settings_schema.json          # (P1) Global theme settings → CSS token sources
│   └── settings_data.json            # (P1) Default values — then never pushed again
├── layout/
│   └── theme.liquid                  # (P1) HTML shell: head, font preloads, base.css, global.js
├── locales/
│   ├── en.default.json               # (P1) All UI strings (nav, accessibility labels, cart)
│   └── en.default.schema.json        # (P1) Schema label translations
├── sections/
│   ├── header-group.json             # (P1) Section group container for header
│   ├── footer-group.json             # (P1) Section group container for footer
│   ├── header.liquid                 # (P1) Glassmorphism nav, cart badge, mobile hamburger + drawer
│   ├── footer.liquid                 # (P1) Footer links, brand mark, configurable blocks
│   └── main-page-content.liquid      # (stub) Minimal section so page.json renders
├── snippets/
│   ├── css-variables.liquid          # (P1) Outputs :root { --token: value } from settings
│   ├── icon-cart.liquid              # (P1) SVG cart icon
│   ├── icon-hamburger.liquid         # (P1) SVG hamburger icon
│   └── icon-close.liquid             # (P1) SVG × close icon
└── templates/
    ├── index.json                    # (P1) Homepage — references placeholder content
    ├── 404.json                      # (stub) 404 template
    └── page.json                     # (stub) Generic page template
```

### Pattern 1: Section Groups for Header and Footer

**What:** Header and footer are defined as section group JSON files in `sections/`. They are referenced in `theme.liquid` with the `{% sections %}` PLURAL tag. This enables merchant customization of header/footer in the Theme Editor.

**When to use:** Any content that wraps all page templates — header, footer.

**Critical OS 2.0 distinction:** `{% section 'header' %}` (singular) = static, cannot be extended in Theme Editor. `{% sections 'header-group' %}` (plural, referencing a section group JSON) = fully editable in Theme Editor. Phase 1 MUST use the plural form.

```liquid
{{- /* layout/theme.liquid — correct OS 2.0 pattern */ -}}
{% sections 'header-group' %}
<main id="MainContent" class="content-for-layout" role="main">
  {{ content_for_layout }}
</main>
{% sections 'footer-group' %}
```

```json
// sections/header-group.json
{
  "type": "header",
  "name": "Header group",
  "sections": {
    "header": {
      "type": "header",
      "settings": {}
    }
  },
  "order": ["header"]
}
```

### Pattern 2: CSS Custom Properties via `snippets/css-variables.liquid`

**What:** All design tokens are output as CSS custom properties in a snippet rendered inside `<head>`. Global merchant settings (from `settings_schema.json`) are accessible in Liquid via `settings.*` and piped into CSS variables.

**When to use:** All global design tokens — colors, spacing, border-radius, transition values.

```liquid
{{- /* snippets/css-variables.liquid */ -}}
<style>
  :root {
    /* Brand colors — sourced from settings_schema.json color pickers */
    --color-brand-primary: {{ settings.color_brand_primary }};
    --color-brand-accent: {{ settings.color_brand_accent }};
    --color-surface: {{ settings.color_surface }};
    --color-text: {{ settings.color_text }};
    --color-text-muted: {{ settings.color_text_muted }};

    /* Derived semantic tokens — not merchant-configurable, set by theme */
    --color-nav-bg: rgba(250, 248, 255, 0.80);  /* surface at 80% opacity for glassmorphism */

    /* Section spacing — editorial vertical rhythm from Figma */
    --section-gap: 12rem;
    --section-gap-sm: 6rem;

    /* Animation tokens — consistent micro-interactions across all phases */
    --transition-base: 200ms ease;
    --transition-fast: 120ms ease;

    /* Typography */
    --font-headline: 'Newsreader', serif;
    --font-body: 'Inter', sans-serif;

    /* Borders */
    --radius-sm: 0.5rem;
    --radius-md: 0.75rem;
    --radius-lg: 1.5rem;
    --radius-full: 9999px;
  }
</style>
```

**Note on token naming:** Use semantic names (`--color-brand-primary`) not literal names (`--color-red-900`) — locked decision from CONTEXT.md. This means a merchant changing `color_brand_primary` in Theme Editor propagates automatically everywhere.

### Pattern 3: `ShopifySection` Base Web Component

**What:** A base `HTMLElement` subclass defined in `global.js` that all interactive section components extend. Handles `shopify:section:load` / `shopify:section:unload` lifecycle boilerplate so every section automatically re-initializes when the Theme Editor reloads it.

**When to use:** Every interactive section must extend `ShopifySection`. The header's nav drawer web component extends it.

```javascript
// assets/global.js — Base class definition
class ShopifySection extends HTMLElement {
  constructor() {
    super();
    // Bind lifecycle methods
    this._onSectionLoad = this._onSectionLoad.bind(this);
    this._onSectionUnload = this._onSectionUnload.bind(this);
  }

  connectedCallback() {
    document.addEventListener('shopify:section:load', this._onSectionLoad);
    document.addEventListener('shopify:section:unload', this._onSectionUnload);
    this.onSectionLoad();
  }

  disconnectedCallback() {
    document.removeEventListener('shopify:section:load', this._onSectionLoad);
    document.removeEventListener('shopify:section:unload', this._onSectionUnload);
    this.onSectionUnload();
  }

  _onSectionLoad(event) {
    if (event.target.contains(this)) this.onSectionLoad();
  }

  _onSectionUnload(event) {
    if (event.target.contains(this)) this.onSectionUnload();
  }

  // Override in subclasses:
  onSectionLoad() {}
  onSectionUnload() {}
}
```

```javascript
// Example: nav drawer section component extending base class
class NavDrawer extends ShopifySection {
  onSectionLoad() {
    this.hamburgerBtn = this.querySelector('[data-hamburger]');
    this.drawer = this.querySelector('[data-nav-drawer]');
    this.overlay = this.querySelector('[data-nav-overlay]');
    this.closeBtn = this.querySelector('[data-close-nav]');
    this.hamburgerBtn?.addEventListener('click', this.open.bind(this));
    this.closeBtn?.addEventListener('click', this.close.bind(this));
    this.overlay?.addEventListener('click', this.close.bind(this));
  }
  onSectionUnload() {
    // Event listeners on `this` children are garbage-collected automatically
    // Only explicitly remove listeners on document/window here
  }
  open() {
    this.drawer.setAttribute('aria-hidden', 'false');
    this.hamburgerBtn.setAttribute('aria-expanded', 'true');
    this.overlay.classList.add('is-visible');
    document.body.classList.add('overflow-hidden');
  }
  close() {
    this.drawer.setAttribute('aria-hidden', 'true');
    this.hamburgerBtn.setAttribute('aria-expanded', 'false');
    this.overlay.classList.remove('is-visible');
    document.body.classList.remove('overflow-hidden');
  }
}
customElements.define('nav-drawer', NavDrawer);
```

### Pattern 4: Pub/Sub via `CustomEvent` on Document

**What:** Cross-component communication uses native browser `CustomEvent` dispatched on `document`. No shared global state objects. Components dispatch events; other components listen.

**When to use:** Cart badge (listens for `cart:updated`); future cart drawer (dispatches `cart:open`); nav drawer close (dispatches `drawer:close`).

```javascript
// assets/global.js — pub/sub utilities
const publish = (eventName, data = {}) => {
  document.dispatchEvent(new CustomEvent(eventName, { bubbles: false, detail: data }));
};

const subscribe = (eventName, handler) => {
  document.addEventListener(eventName, handler);
  return () => document.removeEventListener(eventName, handler); // returns unsubscribe fn
};

// Cart badge component (NAVX-02) — listens for cart updates
class CartCountBubble extends ShopifySection {
  onSectionLoad() {
    this.countEl = this.querySelector('[data-cart-count]');
    subscribe('cart:updated', (e) => this.updateCount(e.detail.itemCount));
  }
  updateCount(count) {
    if (!this.countEl) return;
    this.countEl.textContent = count;
    this.countEl.hidden = count === 0;
  }
}
customElements.define('cart-count-bubble', CartCountBubble);
```

### Pattern 5: Glassmorphism Nav CSS

**What:** The sticky header uses `backdrop-filter: blur(12px)` on a semi-transparent background. Both the `-webkit-` prefix (for iOS Safari) and the unprefixed form are required.

**When to use:** `sections/header.liquid` and `assets/component-header.css`. Apply ONLY to the nav bar element — not to large overlay elements where GPU cost would be prohibitive.

```css
/* assets/component-header.css */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(250, 248, 255, 0.80);  /* --color-surface at 80% */
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  backdrop-filter: blur(12px) saturate(180%);
  transform: translateZ(0);   /* GPU compositing layer — prevents repaint cascade */
  transition: box-shadow var(--transition-base);
}

@media (prefers-reduced-motion: reduce) {
  .site-header {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background-color: rgba(250, 248, 255, 0.97);
  }
}
```

### Pattern 6: Google Fonts Loading in `theme.liquid`

**What:** Newsreader is preloaded for LCP optimization. Inter loads normally. Both use `font-display: swap`.

**When to use:** Once, in `layout/theme.liquid` `<head>`, before any other stylesheets.

```liquid
{{- /* layout/theme.liquid — <head> section */ -}}

<!-- Preconnect for Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Newsreader preload (display font — LCP-critical) -->
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;1,400;1,600&display=swap">
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;1,400;1,600&display=swap"
  media="print" onload="this.media='all'">
<noscript>
  <link rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;1,400;1,600&display=swap">
</noscript>

<!-- Inter — full UI range, standard load (not render-blocking for hero) -->
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">

<!-- CSS tokens -->
{%- render 'css-variables' -%}

<!-- Base styles -->
{{ 'base.css' | asset_url | stylesheet_tag }}
```

**Why this pattern:** Newsreader is the LCP font (display headlines render above the fold). Preloading it prevents FOIT. Inter is loaded non-render-blocking with `media="print"` + `onload` swap trick so it does not delay first contentful paint.

### Anti-Patterns to Avoid

- **`{% section 'header' %}` (singular):** Cannot be extended in Theme Editor. Always use `{% sections 'header-group' %}` (plural) with a section group JSON file.
- **Hardcoding hex colors in Liquid/CSS:** Bypass Token Editor control and make global color changes require grep-and-replace. Use `--color-brand-primary` everywhere.
- **`{% include 'snippet' %}`:** Deprecated, leaks scope, flagged by `shopify theme check`. Always use `{% render 'snippet', param: val %}`.
- **`img_url` filter:** Deprecated, flagged by `shopify theme check`. Always use `image_url: width: N`.
- **`loading="lazy"` on hero images:** Causes LCP failure. Use `section.index <= 2` conditional.
- **CSS `background-image` for hero:** Prevents HTTP preload, `srcset`, and `fetchpriority`. Always use `<img>` tag.
- **backdrop-filter without `-webkit-` prefix:** Glassmorphism is invisible on iOS Safari. Always include both prefixes.
- **`window.*` global variables for cross-component state:** Pollutes global scope. Use `CustomEvent` pub/sub.
- **`settings_data.json` not in `.shopifyignore`:** One `shopify theme push` wipes all merchant-configured content. Add to `.shopifyignore` before ANY push.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-component messaging | Custom event bus object | Native `CustomEvent` on `document` | Zero code, zero bundle, browser-native; Dawn uses exactly this pattern |
| Section lifecycle management | Per-section init/cleanup code | `ShopifySection` base class with `onSectionLoad`/`onSectionUnload` | Eliminates copy-paste across every section; one place to fix if pattern changes |
| CSS token delivery | JS-driven theming | `snippets/css-variables.liquid` with `:root` CSS custom properties | Liquid → CSS in `<head>` is zero JS and works before any script loads |
| Theme Editor integration | Custom DOM mutation observers | `shopify:section:load` / `shopify:section:unload` events | Shopify dispatches these natively; no observation code needed |
| Font loading optimization | Custom font loader JS | `<link rel="preload">` + `media="print"` + `onload` swap | Established pattern, no JS, works with all browsers |
| Scroll lock (body) for drawer | `overflow: hidden` on body | CSS class + iOS Safari `position: fixed` pattern | `overflow: hidden` alone does not prevent iOS Safari rubber-band scroll through the overlay |

**Key insight:** Shopify provides the plumbing — section events, CSS custom property delivery via Liquid, CDN asset serving. The theme's job is to use these correctly, not to rebuild them.

---

## Common Pitfalls

### Pitfall 1: Using `{% section %}` Instead of `{% sections %}` for Header/Footer

**What goes wrong:** The header and footer are placed in `theme.liquid` with `{% section 'header' %}` (singular). They render correctly in the storefront but cannot be customized in the Theme Editor — merchants cannot add announcement bars above the header, change header layout, or configure footer blocks.

**Why it happens:** `{% section %}` is the older, simpler pattern; most tutorials still show it. `{% sections %}` (plural) with a section group JSON file is OS 2.0-specific and less documented.

**How to avoid:** Use `{% sections 'header-group' %}` in `theme.liquid`. Create `sections/header-group.json` as a section group JSON. Never use `{% section 'header' %}` for the global header.

**Warning signs:** `theme.liquid` contains `{% section 'header' %}` without an `s`. The Theme Editor does not show header/footer settings in the customization panel.

### Pitfall 2: Missing `-webkit-backdrop-filter` on Glassmorphism Nav

**What goes wrong:** The glassmorphism navigation has `backdrop-filter: blur(12px)` but no `-webkit-backdrop-filter`. Chrome and Firefox show the blur. iOS Safari (all versions, even current) shows a solid background — the glassmorphism effect is completely absent on all Apple mobile devices.

**Why it happens:** `backdrop-filter` has had excellent Chrome/Edge support for years; developers skip the prefix.

**How to avoid:** Always write both:
```css
-webkit-backdrop-filter: blur(12px) saturate(180%);
backdrop-filter: blur(12px) saturate(180%);
```

Also add `transform: translateZ(0)` to create a GPU compositing layer. Keep blur ≤ 15px to prevent GPU jank on lower-end devices.

**Warning signs:** Nav blur effect absent on iOS Safari physical device. DevTools mobile emulation shows blur (Chrome DevTools emulates webkit, so it is not a reliable iOS Safari test).

### Pitfall 3: `settings_data.json` Not Protected Before First Push

**What goes wrong:** A developer runs `shopify theme push` to test the scaffold in the dev store. The CLI pushes `config/settings_data.json` from the local working copy, overwriting whatever was configured in the Theme Editor. At Phase 1 this is low-stakes (nothing configured yet), but the habit must be established now before it causes an irreversible data loss in a store with live merchant content.

**Why it happens:** `settings_data.json` is in the theme directory and `shopify theme push` syncs all files by default.

**How to avoid:** `.shopifyignore` must contain `config/settings_data.json` and must be committed before any `shopify theme push`. Push `settings_data.json` ONCE during initial setup with desired token defaults, then never again.

**Warning signs:** `.shopifyignore` file does not exist. `config/settings_data.json` is not listed in `.shopifyignore`.

### Pitfall 4: Section JS Not Re-Initializing After Theme Editor Section Reload

**What goes wrong:** The mobile nav drawer works on storefront page load. When the merchant opens the Theme Editor, adds a section above the header, and saves, Shopify reloads the header section without a full page reload. The nav drawer's event listeners are gone. Hamburger does nothing. Merchant is unable to use the mobile preview in the Theme Editor.

**Why it happens:** JS initialization happens in a top-level IIFE or `DOMContentLoaded` handler, which fires only once. Theme Editor section reloads do not re-fire these events.

**How to avoid:** Use the `ShopifySection` base class pattern (Pattern 3 above). Every interactive section component handles `shopify:section:load` via the base class `connectedCallback` / `onSectionLoad` lifecycle. This is established in Phase 1 so all subsequent sections inherit the correct pattern by default.

**Warning signs:** No `shopify:section:load` listener anywhere in JS codebase. Hamburger/drawer behavior works in browser tab but breaks after adding a section in Theme Editor.

### Pitfall 5: Google Fonts Loaded Without `preconnect`

**What goes wrong:** Newsreader and Inter fonts load 200-500ms late on first visit because the browser must first resolve the `fonts.googleapis.com` DNS and establish a connection before it can even request the font CSS file. Results in FOUT (flash of unstyled text) — the editorial headline renders in Times New Roman or system serif for 0.5-1.5s.

**Why it happens:** Developers add the Google Fonts `<link rel="stylesheet">` without the required `<link rel="preconnect">` preamble.

**How to avoid:** Add preconnect links BEFORE the Google Fonts stylesheet links (see Pattern 6 above):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

**Warning signs:** Network tab shows font requests starting several hundred milliseconds after HTML parse. PageSpeed Insights flags "Ensure text remains visible during webfont load." FOUT visible on 3G throttle in DevTools.

### Pitfall 6: Deprecated Liquid Filters Failing `shopify theme check`

**What goes wrong:** Liquid files contain `| img_url:`, `| money_without_trailing_zeros`, or `{% include %}` — filters and tags that are deprecated. `shopify theme check` reports `DeprecatedFilter` and `DeprecatedTag` warnings, blocking the zero-warnings requirement (FNDX success criterion).

**Why it happens:** Copy-paste from older tutorials, Stack Overflow answers, or Figma design export HTML. The design exports (`barterbobs_main_landing_page/code.html`) do not contain Liquid at all, but developers copy patterns from old community snippets.

**How to avoid:** Run `shopify theme check` locally from the first file created. Use `shopify theme check --auto-correct` when starting. Always use `image_url: width: N` not `img_url`. Always use `{% render %}` not `{% include %}`.

**Warning signs:** `shopify theme check` output contains `DeprecatedFilter` or `DeprecatedTag` warnings.

---

## Code Examples

Verified patterns from design exports and official sources:

### Design Token Extraction (from `barterbobs_main_landing_page/code.html`)

The Figma export uses Tailwind config — these are the authoritative color values:

```css
/* Extracted from stitch_barterbobs_landing_page/barterbobs_main_landing_page/code.html */
/* Tailwind config → CSS custom properties mapping */

:root {
  /* Brand primary — warm red */
  --color-brand-primary: #b5092d;     /* Tailwind: "primary" */
  --color-brand-accent: #d92d43;      /* Tailwind: "primary-container" (gradient endpoint) */

  /* Surfaces — near-white periwinkle */
  --color-surface: #faf8ff;           /* Tailwind: "surface", "background", "surface-bright" */
  --color-surface-low: #f2f3ff;       /* Tailwind: "surface-container-low" */
  --color-surface-mid: #ebedff;       /* Tailwind: "surface-container" */
  --color-surface-high: #e3e7ff;      /* Tailwind: "surface-container-high" */
  --color-surface-highest: #dbe1ff;   /* Tailwind: "surface-container-highest" */

  /* Text */
  --color-text: #121a33;              /* Tailwind: "on-surface", "on-background" */
  --color-text-muted: #5b4040;        /* Tailwind: "on-surface-variant" */
  --color-text-secondary: #366476;    /* Tailwind: "secondary" (teal-ish) */

  /* Borders / Outlines */
  --color-outline: #8f6f6f;           /* Tailwind: "outline" (warm taupe) */
  --color-outline-variant: #e4bdbd;   /* Tailwind: "outline-variant" */

  /* Semantic nav token */
  --color-nav-bg: rgba(250, 248, 255, 0.80);

  /* Section spacing — editorial rhythm */
  --section-gap: 12rem;
  --section-gap-sm: 6rem;

  /* Animation */
  --transition-base: 200ms ease;
  --transition-fast: 120ms ease;

  /* Border radius */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1.5rem;
  --radius-full: 9999px;

  /* Typography */
  --font-headline: 'Newsreader', serif;
  --font-body: 'Inter', sans-serif;
}
```

### Hero Gradient (from design export)

```css
/* Used on CTA buttons, numbered circles in "How It Works" */
.hero-gradient {
  background: linear-gradient(135deg, #b5092d 0%, #d92d43 100%);
}
```

### Footer Pattern (from `barterbobs_main_landing_page/code.html` lines 319-338)

The design export footer:
- Background: `#f2f3ff` (surface-container-low)
- Brand wordmark: text, serif, `#121a33` (on-surface)
- Nav links: small, sans, `#366476` (secondary) — hover to `#b5092d` (primary)
- Social icons: Material Symbols Outlined (public, alternate_email, share)
- Copyright: small, `#366476`, separated by a 1px border-top

```liquid
{{- /* sections/footer.liquid — simplified structure */ -}}
<footer class="site-footer" role="contentinfo">
  <div class="site-footer__inner">
    <div class="site-footer__brand">{{ section.settings.brand_text }}</div>
    <nav class="site-footer__nav" aria-label="{{ 'footer.navigation' | t }}">
      {%- for link in linklists[section.settings.nav_menu].links -%}
        <a href="{{ link.url }}">{{ link.title }}</a>
      {%- endfor -%}
    </nav>
    <p class="site-footer__copyright">
      &copy; {{ 'now' | date: '%Y' }} {{ shop.name }}. {{ 'footer.copyright' | t }}
    </p>
  </div>
</footer>
{% schema %}
{
  "name": "Footer",
  "settings": [
    { "type": "text", "id": "brand_text", "label": "Brand name", "default": "BarterBobs" },
    { "type": "link_list", "id": "nav_menu", "label": "Footer navigation", "default": "footer" }
  ],
  "blocks": [
    {
      "type": "column",
      "name": "Link column",
      "settings": [
        { "type": "text", "id": "heading", "label": "Column heading" },
        { "type": "link_list", "id": "menu", "label": "Menu" }
      ]
    }
  ]
}
{% endschema %}
```

### `settings_schema.json` Global Settings Structure

```json
[
  {
    "name": "theme_info",
    "theme_name": "BarterBobs",
    "theme_version": "1.0.0",
    "theme_author": "BarterBobs",
    "theme_documentation_url": "",
    "theme_support_url": ""
  },
  {
    "name": "Colors",
    "settings": [
      {
        "type": "color",
        "id": "color_brand_primary",
        "label": "Brand primary",
        "default": "#b5092d"
      },
      {
        "type": "color",
        "id": "color_brand_accent",
        "label": "Brand accent",
        "default": "#d92d43"
      },
      {
        "type": "color",
        "id": "color_surface",
        "label": "Surface background",
        "default": "#faf8ff"
      },
      {
        "type": "color",
        "id": "color_text",
        "label": "Body text",
        "default": "#121a33"
      },
      {
        "type": "color",
        "id": "color_text_muted",
        "label": "Muted text",
        "default": "#5b4040"
      }
    ]
  },
  {
    "name": "Typography",
    "settings": [
      {
        "type": "range",
        "id": "base_font_size",
        "label": "Base font size",
        "min": 14,
        "max": 18,
        "step": 1,
        "unit": "px",
        "default": 16
      }
    ]
  },
  {
    "name": "Layout",
    "settings": [
      {
        "type": "select",
        "id": "section_gap",
        "label": "Section spacing",
        "options": [
          { "value": "compact", "label": "Compact (6rem)" },
          { "value": "default", "label": "Default (12rem)" },
          { "value": "spacious", "label": "Spacious (16rem)" }
        ],
        "default": "default"
      }
    ]
  }
]
```

### `.shopifyignore` Content

```
config/settings_data.json
node_modules/
.git/
*.md
.prettierrc
.prettierignore
package.json
package-lock.json
```

### Minimum Viable `theme.liquid` Shell

```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#b5092d">

    <title>
      {{ page_title }}{% if current_tags %} &ndash; tagged "{{ current_tags | join: ', ' }}"{% endif %}
      {% if current_page != 1 %} &ndash; {{ 'general.pagination.page' | t: number: current_page }}{% endif %}
      {% unless page_title contains shop.name %} &ndash; {{ shop.name }}{% endunless %}
    </title>

    {%- if page_description -%}
      <meta name="description" content="{{ page_description | escape }}">
    {%- endif -%}

    {%- liquid
      assign og_title = page_title | default: shop.name
      assign og_url = canonical_url | default: request.origin
      assign og_type = 'website'
      assign og_description = page_description | default: shop.description | default: shop.name
    -%}

    <!-- Preconnect for Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <!-- Newsreader — preload for LCP (display headlines) -->
    <link rel="preload" as="style"
      href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;1,400;1,600&display=swap">
    <link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;1,400;1,600&display=swap"
      media="print" onload="this.media='all'">
    <noscript>
      <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;1,400;1,600&display=swap">
    </noscript>

    <!-- Inter — body/UI font, non-render-blocking -->
    <link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">

    <!-- CSS custom properties from settings -->
    {%- render 'css-variables' -%}

    <!-- Global base styles -->
    {{ 'base.css' | asset_url | stylesheet_tag }}

    {{ content_for_header }}
  </head>

  <body class="template-{{ template | replace: '.', '-' | handle }}">
    <a class="skip-to-content-link button visually-hidden" href="#MainContent">
      {{ 'accessibility.skip_to_text' | t }}
    </a>

    {% sections 'header-group' %}

    <main id="MainContent" class="content-for-layout" role="main" tabindex="-1">
      {{ content_for_layout }}
    </main>

    {% sections 'footer-group' %}

    <script src="{{ 'global.js' | asset_url }}" defer="defer"></script>
  </body>
</html>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `{% section 'header' %}` (singular) in theme.liquid | `{% sections 'header-group' %}` (plural) with section group JSON | OS 2.0 (2021) | Header/footer now fully editable in Theme Editor |
| `{% include 'snippet' %}` | `{% render 'snippet', param: val %}` | OS 2.0 (2021) | Scope isolation; theme check compliance |
| `img_url` filter | `image_url: width: N` filter | 2022 | Automatic WebP/AVIF from CDN; deprecated filter removed |
| Liquid templates with markup (`product.liquid`) | JSON templates (`product.json`) referencing sections | OS 2.0 (2021) | "Sections everywhere" — full Theme Editor customization on all pages |
| Monolithic `theme.css` + `theme.js` | Component CSS in `{% stylesheet %}` tags; component JS in dedicated files | OS 2.0 patterns | Shopify deduplicates component CSS; only needed CSS/JS loaded per page |
| `loading="lazy"` on all images | `section.index`-conditional loading (eager for first 2 sections) | 2023 (section.index added) | Prevents LCP failures on above-fold images |

**Deprecated/outdated (never use in this project):**
- `{% include %}`: Deprecated Liquid tag — always use `{% render %}`
- `img_url` filter: Deprecated — always use `image_url: width: N`
- `stylesheet_tag` on component CSS: Use `{% stylesheet %}` inside section files instead, or explicit `asset_url | stylesheet_tag` in `theme.liquid` only for truly global CSS
- `.js.liquid` / `.css.liquid` assets: Anti-pattern — Liquid in JS/CSS assets adds per-request server render time; use CSS custom properties instead

---

## Open Questions

1. **Cart badge stub implementation detail**
   - What we know: NAVX-02 requires the cart count badge to update without page reload. In Phase 1 the full cart drawer (Phase 3 work) does not yet exist, but the badge must exist.
   - What's unclear: Should the Phase 1 badge stub listen for `cart:updated` events (dispatched by future AJAX cart operations) or implement a minimal fetch to `/cart.js` on page load to show current count?
   - Recommendation: Implement the full badge listener in Phase 1 (`subscribe('cart:updated', ...)` + fetch `/cart.js` on `connectedCallback`). This ensures the Phase 3 cart drawer can dispatch events and the badge just works. The AJAX fetch to `/cart.js` is a 1-line implementation.

2. **Minimal stub templates for non-Phase-1 pages**
   - What we know: `shopify theme check` requires certain template files to exist. Some templates (product, collection, cart) are not being built until later phases.
   - What's unclear: Exactly which stub templates are required for `shopify theme check` to pass clean on a skeleton theme.
   - Recommendation: Create `templates/index.json`, `templates/404.json`, `templates/page.json` (Phase 1 pages). For `product.json`, `collection.json`, `cart.json`: create minimal stubs that reference a `main-placeholder.liquid` section — sufficient to pass theme check without building the full sections yet.

3. **Section schema for Phase 1 header — what to include in locales**
   - What we know: Header schema must be defined; nav link list menu picker is needed for the nav links.
   - What's unclear: The full set of merchant-configurable header settings (logo image, header height, sticky behavior toggle, etc.) — what is "core design tokens" vs. "overkill for Phase 1"?
   - Recommendation: Phase 1 header schema should include: logo image picker, nav menu link list, enable/disable sticky header toggle, cart icon enable/disable. Keep scope minimal — Phase 4 polish can extend schema if needed.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is included.

### Test Framework

Phase 1 is a Shopify Liquid/CSS/JS theme with no backend runtime. There is no conventional unit test framework applicable to Liquid template rendering. Validation for this phase is tooling-based (theme check) and manual browser verification.

| Property | Value |
|----------|-------|
| Framework | `shopify theme check` (bundled with Shopify CLI 3.92.x) |
| Config file | `.theme-check.yml` (to be created in Wave 0 / Plan 01-01) |
| Quick run command | `shopify theme check` |
| Full suite command | `shopify theme check --category all` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FNDX-01 | All templates are JSON files; no markup in template files | `shopify theme check` lint | `shopify theme check` | ❌ Wave 0 — create `.theme-check.yml` |
| FNDX-02 | CSS design tokens defined as CSS custom properties | Manual — verify `:root` variables in DevTools | `shopify theme check` (validates Liquid syntax) | ❌ Wave 0 — `snippets/css-variables.liquid` |
| FNDX-03 | Web components + pub/sub + `shopify:section:load` handlers | Manual — Theme Editor reload test | `shopify theme check` (validates JS syntax) | ❌ Wave 0 — `assets/global.js` |
| FNDX-04 | Every section has schema blocks | `shopify theme check` validates schema JSON | `shopify theme check` | ❌ Wave 0 — `sections/header.liquid`, `sections/footer.liquid` |
| FNDX-05 | `settings_schema.json` defines global settings | `shopify theme check` validates schema | `shopify theme check` | ❌ Wave 0 — `config/settings_schema.json` |
| FNDX-06 | `.shopifyignore` has `config/settings_data.json` | Manual — verify file contents | n/a (file content check) | ❌ Wave 0 — `.shopifyignore` |
| NAVX-01 | Header is a section group with glassmorphism, sticky | Manual browser test — DevTools verify `position: sticky`, check iOS Safari blur | `shopify theme check` (structure) | ❌ Wave 0 — `sections/header-group.json`, `sections/header.liquid` |
| NAVX-02 | Cart icon with dynamic count badge | Manual — add item to cart, verify count updates without reload | `shopify theme check` (structure) | ❌ Wave 0 — badge in `sections/header.liquid` |
| NAVX-03 | Mobile hamburger + off-canvas drawer at < 768px | Manual — resize to 375px, verify hamburger shows, drawer opens from left | `shopify theme check` (structure) | ❌ Wave 0 — hamburger/drawer in `sections/header.liquid` |
| NAVX-04 | Footer as section group with configurable content | Manual — verify Theme Editor shows footer settings panel | `shopify theme check` (structure) | ❌ Wave 0 — `sections/footer-group.json`, `sections/footer.liquid` |

**Note:** Liquid rendering cannot be unit-tested without a running Shopify store instance. All NAVX requirements are verified manually using `shopify theme dev` running against a dev store. The automated `shopify theme check` command validates file structure, schema correctness, deprecated filters, and Liquid syntax errors — this is the primary automated gate.

### Sampling Rate

- **Per task commit:** `shopify theme check` — zero errors, zero warnings required before any commit
- **Per wave merge:** `shopify theme check --category all` + manual visual check in dev store
- **Phase gate:** Full `shopify theme check` green + all 5 success criteria verified manually before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `.theme-check.yml` — theme check config (ignore `settings_data.json` from check if needed)
- [ ] `config/settings_schema.json` — required for theme check to validate global settings
- [ ] `config/settings_data.json` — default values; pushed once, then added to `.shopifyignore`
- [ ] `.shopifyignore` — must exist before ANY `shopify theme push`
- [ ] `snippets/css-variables.liquid` — required for `theme.liquid` to render without error
- [ ] `locales/en.default.json` — required by `shopify theme check` for t-filter strings
- [ ] `locales/en.default.schema.json` — required for schema translations
- [ ] Framework install: `npm install -D prettier @shopify/prettier-plugin-liquid` — if not already present

---

## Sources

### Primary (HIGH confidence)

- `.planning/research/STACK.md` — Shopify CLI 3.92.x, Node.js requirements, tooling decisions; verified against official Shopify docs March 2026
- `.planning/research/ARCHITECTURE.md` — Section group pattern, JSON templates, 7-layer build order, web component pattern, CSS custom property pipeline; sourced from shopify.dev official docs
- `.planning/research/PITFALLS.md` — All 10 critical pitfalls; sourced from shopify.dev official docs and documented CLI issues
- `.planning/research/FEATURES.md` — Feature scope and design requirements; design exports analyzed directly
- `stitch_barterbobs_landing_page/barterbobs_main_landing_page/code.html` — Color palette, typography scale, header/footer structure, glassmorphism nav pattern; authoritative design source per PROJECT.md
- `stitch_barterbobs_landing_page/product_detail_page_pdp/code.html` — Header behavior verification on non-homepage templates
- [Shopify Section Groups](https://shopify.dev/docs/storefronts/themes/architecture/section-groups) — `{% sections %}` plural tag, section group JSON format, HIGH confidence
- [Shopify Theme Architecture](https://shopify.dev/docs/storefronts/themes/architecture) — Directory structure, JSON templates, HIGH confidence
- [Shopify settings_schema.json](https://shopify.dev/docs/storefronts/themes/architecture/config/settings-schema-json) — Global settings format, HIGH confidence

### Secondary (MEDIUM confidence)

- `.planning/research/SUMMARY.md` — Cross-referenced summary of all project research with source attributions
- [nickdrishinski.com: Dawn Section Rendering API](https://nickdrishinski.com/blogs/shopify/how-dawn-theme-uses-section-rendering-api-for-cart-refresh) — Verified against Shopify official docs
- [EcomIdeas: section.index LCP fix](https://ecomideas.com/site-speed-why-your-shopify-theme-lazy-loads-your-lcp-image-and-how-to-fix-it) — Verified against shopify.dev performance blog

### Tertiary (LOW confidence)

- None for Phase 1 — all claims are either HIGH confidence (official docs) or MEDIUM (community, cross-verified).

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against official Shopify docs and GitHub releases March 2026
- Architecture patterns: HIGH — sourced from shopify.dev official docs and Dawn reference theme
- Design token values: HIGH — extracted directly from authoritative design source (`barterbobs_main_landing_page/code.html`)
- Pitfalls: HIGH — 9/10 sourced from official Shopify docs; Pitfall 5 (Google Fonts preconnect) from official performance docs
- Validation approach: HIGH — `shopify theme check` is the official lint tool; manual browser testing is the only viable approach for Liquid rendering

**Research date:** 2026-03-20
**Valid until:** 2026-09-20 (Shopify platform is stable; CSS custom property patterns are long-lived; reassess if Shopify CLI major version changes)
