# Stack Research

**Domain:** Shopify OS 2.0 Custom Theme (Production)
**Researched:** 2026-03-20
**Confidence:** HIGH (core tooling verified against official Shopify docs and GitHub releases)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Shopify CLI | 3.92.1 (current as of Mar 2026) | Theme dev, hot reload, push/pull, theme check | Official Shopify tool — no alternative exists for OS 2.0 development. Replaced legacy Theme Kit entirely. Bundles theme-check, language server, and live preview. |
| Shopify Dawn | v15.4.1 (Dec 2024) | Structural reference and OS 2.0 pattern source | Shopify's official OS 2.0 reference theme. Not used as a base to extend — used as a pattern reference for section schema conventions, web component architecture, and JSON template structure. Visuals are fully custom. |
| Liquid (Shopify Templating) | Current Shopify platform | Server-side template rendering | The only option for Shopify storefront templates. All page rendering is Liquid + HTML. No framework can replace it within the Shopify theme runtime. |
| Vanilla JavaScript (ES2020+) | Native browser | Interactive components | Shopify's own guidance: "minimize JavaScript and rely on modern native browser features." Dawn uses web components (custom elements). No transpilation needed for target browser support (evergreen browsers). |
| CSS Custom Properties | Native browser (CSS3) | Design token system, dynamic merchant settings | The standard mechanism for bridging Liquid/theme settings into CSS. Used in `snippets/css-variables.liquid` to output all tokens as `:root` variables. No CSS framework needed — modern grid/flexbox handles layout. |
| Node.js | 20.x LTS (minimum 18.20) | Shopify CLI runtime | Required to run Shopify CLI. Node 20 is the current LTS and the recommended version for new projects. |

### Supporting Libraries / Dev Tools

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@shopify/prettier-plugin-liquid` | latest (via `npm install -D`) | Opinionated Liquid/HTML code formatter | Required for consistent formatting across all `.liquid` files. Integrates with VS Code "format on save". Configure via `.prettierrc`. |
| Shopify Liquid VS Code Extension (`Shopify.theme-check-vscode`) | latest from VS Code Marketplace | Liquid syntax highlighting, IntelliSense, inline theme-check linting, schema validation, code navigation | Install on every developer machine. Powers `shopify theme check` as a language server. Replaces need for separate theme-check CLI in most workflows. |

### No Build Pipeline — Deliberate Decision

This theme uses **no build step** (no Webpack, Vite, esbuild, or Sass compiler). Rationale:

1. Shopify's CDN serves assets directly — no bundling required
2. CSS custom properties handle dynamic theming (Liquid outputs `<style>` blocks with `:root` variables)
3. Vanilla JS ES modules can be loaded as `type="module"` scripts without transpilation
4. Eliminates CI/CD complexity: `shopify theme push` is the entire deployment
5. `shopify theme dev` provides hot-reload for CSS and sections natively — no additional tooling

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `shopify theme dev` | Hot-reload local development against live store data | Runs at `http://127.0.0.1:9292`. Hot-reloads CSS and sections without full page refresh. Use `--theme-editor-sync` flag to sync Theme Editor changes back to local files. |
| `shopify theme check` | Linting — Liquid syntax errors, JSON errors, missing templates, deprecated tags, performance issues, accessibility | Run before every commit. Must pass with zero errors and zero warnings per project requirements. Configured via `.theme-check.yml`. |
| `shopify theme push` | Deploy theme to store | Use `--unpublished` to push without publishing, `--json` for CI output. |
| `shopify theme pull` | Pull live theme changes back to local | Use after making changes in Theme Editor to sync. |
| `.shopifyignore` | Prevent specified files from syncing to Shopify | Add `node_modules/`, `.git/`, `*.md`, editor config files. |

---

## Directory Structure (Required)

```
theme/
├── assets/           # CSS, JS, image, font files — no subdirectories
├── blocks/           # Standalone theme blocks (OS 2.0)
├── config/
│   ├── settings_schema.json   # Theme-level merchant settings
│   └── settings_data.json     # Saved settings values
├── layout/
│   └── theme.liquid           # REQUIRED — base layout with <head>, header, footer
├── locales/
│   ├── en.default.json        # Required default locale
│   └── en.default.schema.json # Schema translations
├── sections/         # .liquid section files with {% schema %}
├── snippets/
│   ├── css-variables.liquid   # Design token output as CSS custom properties
│   └── ...
└── templates/
    ├── index.json             # Homepage — JSON template
    ├── product.json           # PDP — JSON template
    ├── collection.json        # PLP — JSON template
    ├── cart.json              # Cart page (drawer handled in JS)
    ├── page.json              # Generic page (About, etc.)
    ├── 404.liquid             # 404 — Liquid template acceptable
    └── customers/             # Account templates
```

**Constraints:**
- No subdirectories inside `assets/` — Shopify does not support them
- No subdirectories in `sections/`, `snippets/` — flat structure only
- JSON templates: max 25 sections per template, max 50 blocks per section

---

## CSS Architecture

### Pattern: CSS Custom Properties via `snippets/css-variables.liquid`

All design tokens are defined as CSS custom properties in a dedicated snippet, rendered in `<head>` inside `theme.liquid`. This is the canonical pattern from Dawn and Shopify's own guidance.

```liquid
{%- comment -%}snippets/css-variables.liquid{%- endcomment -%}
<style>
  :root {
    {%- comment -%} Colors from settings_schema.json {%- endcomment -%}
    --color-primary: {{ settings.color_primary }};
    --color-secondary: {{ settings.color_secondary }};
    --color-background: {{ settings.color_background }};

    {%- comment -%} Typography {%- endcomment -%}
    --font-heading-family: {{ settings.type_header_font.family | json }}, sans-serif;
    --font-body-family: {{ settings.type_body_font.family | json }}, sans-serif;

    {%- comment -%} Spacing scale {%- endcomment -%}
    --spacing-section: {{ settings.spacing_sections }}rem;
  }
</style>
```

**Why this pattern:**
- Merchant settings (colors, fonts, spacing) flow from Theme Editor into CSS automatically
- One source of truth — change a variable once, affects entire theme
- No JavaScript needed to apply merchant customizations
- `shopify theme check` validates the Liquid output

### Section-Level CSS Variables

For per-section settings (e.g., a section's background color), output CSS variables in the section's Liquid, not in `css-variables.liquid`:

```liquid
{%- comment -%}sections/hero.liquid{%- endcomment -%}
<style>
  #shopify-section-{{ section.id }} {
    --section-bg: {{ section.settings.background_color }};
    --section-padding: {{ section.settings.padding_top }}px;
  }
</style>
```

### CSS File Organization

- `assets/base.css` — Reset, typography base, global utility classes
- `assets/theme.css` — Layout primitives (grid, flex containers), component shells
- Per-section CSS lives in the `{% stylesheet %}` tag inside each section file (compiled and cached by Shopify)
- No single monolithic CSS file — Shopify caches per-section stylesheets

---

## JavaScript Architecture

### Pattern: Web Components (Custom Elements)

Follow Dawn's architecture: interactive components are native Web Components (`customElements.define`). No framework, no build step.

```javascript
// assets/cart-drawer.js
class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', this.handleToggle.bind(this));
  }

  handleToggle(event) {
    // handle open/close
  }
}

customElements.define('cart-drawer', new CartDrawer());
```

**Why Web Components:**
- Scoped DOM — no global style or event leakage
- Native browser API — zero bundle cost
- Matches Dawn's established pattern — Theme Store reviewers expect this
- Lazy-initialize: component logic runs only when the element exists in DOM
- Works naturally with Liquid rendering (Liquid outputs the custom element tags, JS handles behavior)

### Script Loading Pattern

```liquid
{%- comment -%} In section or layout Liquid {%- endcomment -%}
<script src="{{ 'cart-drawer.js' | asset_url }}" defer></script>
```

Use `defer` for all non-critical scripts. Use `type="module"` for ES module scripts (automatically deferred). Never use `async` without explicit reason — risks race conditions with Liquid-rendered DOM.

### Pub/Sub for Cross-Component Communication

For cart updates, variant changes, and other cross-section events, use a simple pub/sub pattern (Dawn includes `pubsub.js`):

```javascript
// assets/pubsub.js — include from Dawn or write minimal version
function subscribe(eventName, callback) { ... }
function publish(eventName, data) { ... }
```

### Selling Plan (Subscription) JavaScript

The subscription frequency selector on PDP requires:
1. A `selling_plan` hidden input in the product form
2. JS that listens for variant changes and updates available selling plan groups
3. Cart AJAX API calls to `/{locale}/cart/change.js` for updating selling plans in cart

```javascript
// assets/selling-plan-selector.js
class SellingPlanSelector extends HTMLElement {
  connectedCallback() {
    this.addEventListener('change', this.onSellingPlanChange.bind(this));
  }
  onSellingPlanChange(event) {
    const form = this.closest('form[action="/cart/add"]');
    const input = form.querySelector('[name="selling_plan"]');
    input.value = event.target.value;
  }
}
customElements.define('selling-plan-selector', new SellingPlanSelector());
```

---

## Liquid Templating Best Practices

### Always Use `render` Not `include`

```liquid
{# CORRECT — render tag isolates scope #}
{% render 'product-card', product: product, show_vendor: true %}

{# WRONG — include pollutes parent scope, deprecated #}
{% include 'product-card' %}
```

`render` is required: it isolates the snippet's variable scope, improves performance, and `shopify theme check` flags `include` usage.

### String Filters for CSS Safety

When outputting Liquid values into CSS, always sanitize:

```liquid
--font-family: {{ settings.type_header_font.family | json }}, serif;
--color: {{ settings.color_primary }};
```

Use `| json` for string values that need quoting (font names). Use `| default` for fallbacks.

### Performance: Avoid Unnecessary Loops

Shopify enforces a 50-iteration limit per loop. Avoid nested loops over large collections. Use `limit:` on `for` tags wherever possible:

```liquid
{% for product in collection.products limit: 12 %}
```

### JSON Templates for All Page Types

Use `.json` templates (not `.liquid` templates) for all merchant-facing pages. JSON templates enable "sections everywhere" — merchants can add, remove, and reorder sections via Theme Editor.

```json
// templates/index.json
{
  "sections": {
    "main": {
      "type": "main-hero",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

### Section Schema Conventions

Every section must have a `{% schema %}` block with:
- `name` — displayed in Theme Editor
- `settings` array — merchant-configurable options
- `presets` — at least one preset so the section can be added via Theme Editor
- `enabled_on` / `disabled_on` — restrict where sections can be used

---

## Image Optimization

### Use `image_url` + `image_tag` Filters

```liquid
{{ product.featured_image
  | image_url: width: 800
  | image_tag:
    loading: 'lazy',
    widths: '400, 800, 1200, 1600',
    sizes: '(min-width: 1200px) 800px, 100vw',
    alt: product.featured_image.alt
}}
```

### LCP Image Exception — Never Lazy Load Above the Fold

The `ImgLazyLoading` theme-check rule and performance data confirm: lazy-loading LCP images increases Largest Contentful Paint by ~3 seconds. Hero images must use `loading: 'eager'`:

```liquid
{{ section.settings.hero_image
  | image_url: width: 1600
  | image_tag:
    loading: 'eager',
    fetchpriority: 'high',
    widths: '800, 1200, 1600, 2000'
}}
```

Shopify's CDN automatically serves WebP/AVIF based on `Accept` headers when using `image_url`.

---

## Installation

```bash
# Install Shopify CLI globally
npm install -g @shopify/cli @shopify/theme

# Verify version (should be 3.92.x or later)
shopify version

# Dev tools (project-local)
npm install -D prettier @shopify/prettier-plugin-liquid

# Initialize .prettierrc
echo '{ "plugins": ["@shopify/prettier-plugin-liquid"], "printWidth": 120, "tabWidth": 2, "liquidSingleQuote": true }' > .prettierrc

# Create .shopifyignore
cat > .shopifyignore << 'EOF'
node_modules/
.git/
*.md
.prettierrc
.prettierignore
package.json
package-lock.json
EOF
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|------------------------|
| CSS Custom Properties | Tailwind CSS | Only when building a headless/Hydrogen storefront (not an OS 2.0 theme). Tailwind requires a build pipeline that fights Shopify's CDN asset model; Theme Editor cannot control Tailwind utility values. |
| CSS Custom Properties | Bootstrap / other CSS frameworks | Never for a custom Shopify theme — framework classes collide with merchant customizations, bloat CSS, and cannot be parameterized by theme settings. |
| Vanilla JS Web Components | Alpine.js | Acceptable if team prefers Alpine's declarative syntax and build step is already present. Alpine adds ~15KB but reduces boilerplate. Not recommended here per project constraints. |
| Vanilla JS Web Components | React / Vue | Never for an OS 2.0 theme. Renders client-side only, breaks Liquid-rendered SEO, incompatible with Theme Editor section/block customization model. Belongs in Hydrogen (headless), not OS 2.0. |
| No build pipeline | esbuild / Vite | Acceptable if project needs SCSS compilation or JS bundling across many files. For this project scope, the overhead is unjustified — CSS custom properties handle theming, and JS is component-scoped. |
| Dawn as reference | Dawn as base theme | Only if you want to inherit Dawn's design (grey, minimal). For BarterBobs' editorial aesthetic, Dawn's CSS would need to be entirely overwritten — easier to start from scratch with Dawn as a structural reference. |
| `shopify theme check` | ESLint / Stylelint | ESLint/Stylelint can supplement but cannot replace theme check. Theme check is Shopify-specific — it knows about Liquid objects, theme architecture errors, and performance rules that generic linters miss. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| jQuery | Adds 30–87KB for DOM manipulation that vanilla JS handles natively. Project explicitly requires no jQuery. Shopify has not used it in official themes since 2021. | `querySelector`, `addEventListener`, `fetch` |
| Tailwind CSS (in production theme) | Requires a build pipeline (PostCSS/Vite). Utility class output cannot be parameterized by Theme Editor settings. Merchant-facing color/font controls require CSS variables, not utility classes. Figma exports used Tailwind inline — production theme converts these to semantic CSS custom properties. | CSS custom properties + semantic CSS |
| `include` Liquid tag | Deprecated. Pollutes parent scope, slows render. `shopify theme check` flags it as an error. | `{% render 'snippet-name', param: value %}` |
| `.js.liquid` / `.css.liquid` assets | Anti-pattern for performance. Liquid processing in CSS/JS assets adds server render time on every asset request. Only exception: outputting dynamic values into a stylesheet that requires Liquid (use `{% stylesheet %}` in sections instead). | `{% stylesheet %}` in sections, or CSS custom properties outputted from `css-variables.liquid` snippet |
| Webpack / large build pipelines | Incompatible with Shopify's "buildless" theme workflow. `shopify theme dev` watches the theme directory directly — build artifacts landing in that directory create sync chaos. | No build step. CSS custom properties + native ES modules. |
| Global JavaScript variables / `window.*` | Pollutes global scope, causes conflicts with third-party app injections (reviews, loyalty, etc.). | Web components with encapsulated state, or minimal pub/sub module |
| `loading="lazy"` on hero/LCP images | Delays Largest Contentful Paint by ~3 seconds — directly hurts Core Web Vitals score. Theme check's `ImgLazyLoading` historically flagged this. | `loading="eager"` + `fetchpriority="high"` for above-fold images |
| Statically rendered sections in `theme.liquid` | Cannot be reordered or removed by merchants. Bypasses the "sections everywhere" architecture of OS 2.0. | Section groups for header/footer; JSON template sections for content areas |

---

## Shopify-Specific Constraints

| Constraint | Detail |
|------------|--------|
| No subdirectories in `assets/` | Shopify does not support nested asset directories. All CSS, JS, and image files live flat in `assets/`. |
| No subdirectories in `sections/` or `snippets/` | Flat structure required. Name files with prefixes to organize: `product-card.liquid`, `product-gallery.liquid`. |
| 25 sections per JSON template | Hard limit. Design sections to be composable rather than monolithic. |
| 50 blocks per section | Hard limit per section schema. |
| Liquid loop limit: 50 iterations | `forloop` enforces a soft 50-iteration limit for performance. Use `limit:` parameter. |
| CDN asset URLs change on deploy | Never hardcode asset URLs. Always use `{{ 'file.css' | asset_url }}`. |
| `shopify theme check` must pass clean | Zero errors and zero warnings required per project spec. Run `shopify theme check` before every push. |
| Subscription selling plans | Require a hidden `input[name="selling_plan"]` in the product form. Must use `selling_plan_group` Liquid objects to render options. Cart AJAX API must be used to update selling plan on cart items. |
| Theme Editor preview | JavaScript that depends on DOM events must account for postMessage-based Theme Editor context. Test interactivity in both storefront and Theme Editor preview. |
| Checkout not themeable | Cart drawer/page is themeable. Checkout uses Shopify's checkout customization (separate system). Do not attempt to theme checkout via the theme. |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@shopify/cli` 3.92.x | Node.js 18.20+, 20.x, 22.x | Node 20 LTS recommended. Node 18 is minimum. |
| `@shopify/prettier-plugin-liquid` | Prettier 3.x | Prettier 3 requires explicit plugin declaration in `.prettierrc`. Prettier 2 is EOL. |
| Dawn v15.4.1 | Shopify OS 2.0 | Reference only. Structural patterns (section schema, web component names) are current as of Dec 2024. |
| `shopify theme check` | Bundled with Shopify CLI 3.x | Do not install `@shopify/theme-check` separately — use the version bundled in CLI. |

---

## Sources

- [Shopify CLI Releases (GitHub)](https://github.com/Shopify/cli/releases) — version 3.92.1 confirmed current as of March 2026, HIGH confidence
- [Shopify CLI official docs](https://shopify.dev/docs/api/shopify-cli) — Node.js requirements, installation, HIGH confidence
- [Dawn releases (GitHub)](https://github.com/Shopify/dawn/releases) — v15.4.1 confirmed current, HIGH confidence
- [Shopify theme dev command docs](https://shopify.dev/docs/api/shopify-cli/theme/theme-dev) — hot reload capabilities, flags, HIGH confidence
- [Shopify Theme Best Practices](https://shopify.dev/docs/storefronts/themes/best-practices) — official guiding principles, HIGH confidence
- [Shopify Theme Architecture](https://shopify.dev/docs/storefronts/themes/architecture) — directory structure, JSON templates, HIGH confidence
- [Shopify Sections](https://shopify.dev/docs/storefronts/themes/architecture/sections) — schema blocks, app blocks, limits, HIGH confidence
- [Shopify JSON Templates](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates) — structure, limits, HIGH confidence
- [Shopify Section Groups](https://shopify.dev/docs/storefronts/themes/architecture/section-groups) — header/footer pattern, HIGH confidence
- [Liquid render tag docs](https://shopify.dev/docs/api/liquid/tags/render) — render vs include, HIGH confidence
- [Add Subscriptions to Theme](https://shopify.dev/docs/storefronts/themes/pricing-payments/subscriptions/add-subscriptions-to-your-theme) — selling plan Liquid + JS pattern, HIGH confidence
- [Shopify Theme Check](https://shopify.dev/docs/storefronts/themes/tools/theme-check) — linting capabilities, moved to theme-tools repo, HIGH confidence
- [ImgLazyLoading check](https://shopify.dev/docs/storefronts/themes/tools/theme-check/checks/img-lazy-loading) — LCP lazy-load rule, HIGH confidence
- [Shopify Liquid VS Code extension](https://shopify.dev/docs/storefronts/themes/tools/shopify-liquid-vscode) — features list, HIGH confidence
- [Shopify Liquid Prettier Plugin](https://shopify.dev/docs/storefronts/themes/tools/liquid-prettier-plugin) — installation, config options, HIGH confidence
- [Responsive Images on Shopify with Liquid](https://performance.shopify.com/blogs/blog/responsive-images-on-shopify-with-liquid) — image_url filter, srcset pattern, MEDIUM confidence
- [Shopify Sections Best Practices](https://shopify.dev/docs/storefronts/themes/architecture/sections/best-practices) — schema guidelines, HIGH confidence
- [Tailwind discussion in Shopify community](https://community.shopify.dev/t/tailwind-for-scalable-theme/775) — community consensus on Tailwind tradeoffs, MEDIUM confidence

---

*Stack research for: BarterBobs Shopify OS 2.0 Custom Theme*
*Researched: 2026-03-20*
