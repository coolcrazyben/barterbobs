# Phase 1: Foundation - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Shopify OS 2.0 scaffold, design tokens, global JS infrastructure, and navigation shell. No feature sections — only the architecture that every downstream section builds on. Phase 1 ends when the theme opens in a browser, renders the glassmorphism header and footer with correct brand identity, passes `shopify theme check` clean, and handles the three verified breakpoints (375/768/1280px).

</domain>

<decisions>
## Implementation Decisions

### Font loading
- Google Fonts CDN via `<link>` in `layout/theme.liquid` — not Shopify font picker, not self-hosted
- Newsreader: weights 400 + 600 only (display headlines + semibold emphasis)
- Inter: weights 400 + 500 + 600 + 700 (full UI range; Inter variable font makes this payload-efficient)
- Newsreader `<link rel="preload">` in `<head>` for LCP (above-the-fold display font)
- Inter loads via standard `<link rel="stylesheet">` — not render-blocking for hero
- `font-display: swap` on both fonts to prevent FOIT

### CSS token depth
- Core design tokens only — not a full design system upfront
- Semantic naming convention: `--color-brand-primary`, `--color-brand-accent`, `--color-surface`, `--color-text`, `--color-text-muted` (not literal names like `--color-red-900`)
- Animation tokens: `--transition-base` (200ms ease for hovers) and `--transition-fast` (for snappy UI interactions) — defined in Phase 1 so all sections stay consistent
- Section spacing tokens: `--section-gap` (12rem) and `--section-gap-sm` (6rem) — captures the Figma editorial vertical rhythm
- Component-level spacing (padding, margin within sections) written directly in section CSS, not tokenized

### JS bundle architecture
- ES modules in `assets/` loaded via `<script type="module">` — no build step, served from Shopify CDN
- `theme.liquid` loads only `global.js` eagerly (with `defer`); section-specific JS loads within each section's liquid file
- Cross-section communication via custom events on `document` (e.g., `cart:updated`, `cart:open`, `drawer:close`) — no global namespace pollution
- Base class `ShopifySection extends HTMLElement` defined in `global.js` — sections extend it and override `onSectionLoad` / `onSectionUnload` lifecycle methods
- Sections register via `customElements.define('section-name', SectionClass)` — FNDX-03 requirement met

### Header visual scope in Phase 1
- Fully pixel-perfect to Figma in Phase 1: glassmorphism effect (semi-transparent background, `backdrop-filter: blur(12px)`), sticky scroll behavior, warm red brand palette, and hover states all land now — not deferred to Phase 4
- Mobile breakpoint: hamburger at < 768px; full horizontal nav at 768px+
- Mobile nav drawer: slides in from the left with semi-transparent dark overlay backdrop; clicking overlay or ✕ closes it
- Footer: fully implemented in Phase 1 — navigation links, brand mark, and merchant-configurable content blocks (not a placeholder)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — codebase is blank slate; this is Phase 1 creating the foundation from scratch

### Established Patterns
- None yet — Phase 1 establishes all conventions downstream phases will follow

### Integration Points
- Design exports in `stitch_barterbobs_landing_page/` are the authoritative visual reference
  - `barterbobs_main_landing_page/code.html` — primary source for header/footer patterns
  - `product_detail_page_pdp/code.html` — reference for header behavior on non-homepage templates
- Figma color values to extract: warm reds (#8d1008 / #b5092d), earthy greens, creamy off-white (#f5f0e8 range)
- Figma type scale: Newsreader for display/headlines, Inter/Plus Jakarta Sans for body (Inter chosen as primary)
- `config/settings_schema.json` global settings → `snippets/css-variables.liquid` → CSS custom properties flow

</code_context>

<specifics>
## Specific Ideas

- Glassmorphism header: semi-transparent surface + `backdrop-filter: blur(12px)` — must be visible against both light and image backgrounds (hero section is directly below header)
- The "modern provisions editorial" aesthetic starts from Phase 1 — the header is the merchant's first impression of the theme; it should feel premium on first deploy, not polished later
- Mobile nav: drawer slides from the LEFT so it doesn't conflict with the cart drawer (which will slide from the right in Phase 3)
- Shopify section lifecycle: every interactive section must handle `shopify:section:load` and `shopify:section:unload` so Theme Editor drag-and-drop doesn't break JS initialization

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-20*
