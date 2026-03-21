---
phase: 01-foundation
plan: 01
subsystem: ui
tags: [shopify, liquid, css-custom-properties, theme-check, prettier]

# Dependency graph
requires: []
provides:
  - .shopifyignore protecting config/settings_data.json from CLI overwrites
  - config/settings_schema.json with global color, typography, and layout settings
  - snippets/css-variables.liquid outputting all design tokens as :root CSS custom properties
  - assets/base.css with CSS resets, typography defaults, and utility classes
  - templates/index.json, 404.json, page.json as OS 2.0 JSON template stubs
  - sections/main-page-content.liquid stub section for template validation
  - locales/en.default.json and en.default.schema.json for all UI strings
  - npm dev environment with prettier and @shopify/prettier-plugin-liquid
affects:
  - 01-02 (theme.liquid and layout — renders css-variables.liquid, loads base.css)
  - 01-03 (header/footer sections — depends on locales schema translations)
  - phase-2 (homepage sections — builds on token system and JSON template arch)
  - phase-3 (PDP sections — uses same design token CSS custom properties)

# Tech tracking
tech-stack:
  added:
    - prettier ^3.0.0
    - "@shopify/prettier-plugin-liquid ^1.5.0"
  patterns:
    - CSS custom properties as the sole design token mechanism (no hex in component CSS)
    - settings_schema.json settings.* piped into :root via css-variables.liquid snippet
    - OS 2.0 JSON templates referencing section types by name string
    - {%- comment -%} blocks for Liquid file headers (not {{- /* */ -}} which fails theme check)

key-files:
  created:
    - .shopifyignore
    - .theme-check.yml
    - .prettierrc
    - package.json
    - locales/en.default.json
    - locales/en.default.schema.json
    - config/settings_schema.json
    - config/settings_data.json
    - snippets/css-variables.liquid
    - assets/base.css
    - templates/index.json
    - templates/404.json
    - templates/page.json
    - sections/main-page-content.liquid
  modified: []

key-decisions:
  - "Used {%- comment -%} blocks instead of {{- /* */ -}} inline comments — theme check rejects the latter as LiquidHTMLSyntaxError"
  - "Replaced empty string URIs in settings_schema.json theme_info block with placeholder URIs — theme check ValidJSON rule requires non-empty URI fields"
  - "Derived tokens (surface-low/mid/high, text-secondary, outline variants) hard-coded in css-variables.liquid — not merchant-configurable per design spec"
  - "section_gap select setting maps to two spacing tokens (--section-gap and --section-gap-sm) via conditional logic in css-variables.liquid"

patterns-established:
  - "Token pipeline: settings_schema.json -> settings.* variables -> snippets/css-variables.liquid -> :root CSS custom properties -> component CSS"
  - "No hex colors in assets/*.css — all color references use var(--color-*) custom properties"
  - "OS 2.0 JSON template structure: {sections: {main: {type: section-name, settings: {}}}, order: [main]}"
  - "Stub sections created alongside JSON templates to satisfy theme check before full implementation"

requirements-completed: [FNDX-01, FNDX-02, FNDX-05, FNDX-06]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 1 Plan 01: Project Scaffold and Design Token Pipeline Summary

**Shopify OS 2.0 scaffold with CSS custom property design token pipeline — settings_schema.json -> css-variables.liquid -> :root, passing theme check with zero errors**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T03:11:11Z
- **Completed:** 2026-03-21T03:14:24Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Established the full design token pipeline: theme settings feed into css-variables.liquid which outputs :root CSS custom properties consumed by all component CSS
- Created dev tooling foundation: .shopifyignore (protects merchant settings), .theme-check.yml, .prettierrc, package.json with Liquid formatter
- Scaffold passes `shopify theme check` with zero errors and zero warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Dev tooling, .shopifyignore, and locales scaffold** - `29225d2` (chore)
2. **Task 2: settings_schema.json, CSS token pipeline, base.css, and JSON templates** - `171fd8d` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `.shopifyignore` - Prevents config/settings_data.json from being pushed by CLI
- `.theme-check.yml` - Theme check configuration with settings_data.json exclusion
- `.prettierrc` - Prettier config with @shopify/prettier-plugin-liquid
- `package.json` - Dev dependencies: prettier, @shopify/prettier-plugin-liquid
- `locales/en.default.json` - All UI strings for theme check and section implementations
- `locales/en.default.schema.json` - Schema label translations for header/footer sections
- `config/settings_schema.json` - Global theme settings: 5 brand colors, base font size, section gap
- `config/settings_data.json` - Default values for all settings (protected by .shopifyignore)
- `snippets/css-variables.liquid` - Outputs all 20+ design tokens as :root CSS custom properties
- `assets/base.css` - Box-sizing reset, typography, link styles, utility classes (CSS custom props only)
- `templates/index.json` - OS 2.0 homepage template stub referencing main-page-content section
- `templates/404.json` - OS 2.0 404 template stub referencing main-page-content section
- `templates/page.json` - OS 2.0 generic page template stub referencing main-page-content section
- `sections/main-page-content.liquid` - Minimal stub section so JSON templates validate under theme check

## Decisions Made

- Used `{%- comment -%}` blocks for Liquid file documentation headers instead of `{{- /* */ -}}` inline comment syntax — theme check's LiquidHTMLSyntaxError rejects the latter
- Used placeholder URIs (`https://barterbobs.com`) for `theme_documentation_url` and `theme_support_url` in settings_schema.json — theme check ValidJSON rule requires non-empty URI strings
- Derived color tokens (surface-low/mid/high, text-secondary, outline, outline-variant, nav-bg) are hard-coded in css-variables.liquid, not merchant-configurable, per the design spec
- `section_gap` select setting maps to two spacing tokens: `--section-gap` and `--section-gap-sm` via Liquid conditional logic

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed LiquidHTMLSyntaxError in .liquid files**
- **Found during:** Task 2 (initial shopify theme check run)
- **Issue:** `{{- /* comment */ -}}` inline comment syntax is not valid Liquid HTML — theme check reports `LiquidHTMLSyntaxError: Syntax is not supported` for each such line
- **Fix:** Replaced all `{{- /* */ -}}` comment headers with `{%- comment -%}..{%- endcomment -%}` blocks
- **Files modified:** snippets/css-variables.liquid, sections/main-page-content.liquid
- **Verification:** shopify theme check passes with zero errors after fix
- **Committed in:** `171fd8d` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed ValidJSON URI errors in settings_schema.json**
- **Found during:** Task 2 (initial shopify theme check run)
- **Issue:** Empty string `""` for `theme_documentation_url` and `theme_support_url` fails theme check `ValidJSON` rule: "String is not a URI: URI expected"
- **Fix:** Replaced empty strings with `"https://barterbobs.com"` placeholder URIs
- **Files modified:** config/settings_schema.json
- **Verification:** shopify theme check passes with zero errors after fix
- **Committed in:** `171fd8d` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both auto-fixes required for theme check to pass with zero errors (plan must_haves.truths[0]). No scope creep.

## Issues Encountered

- shopify theme check's LiquidHTMLSyntaxError revealed that the `{{- /* comment */ -}}` pattern used in the plan's file content examples is not valid Liquid — this is a known Shopify theme tooling limitation. Fixed with proper comment tags.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Token pipeline, dev tooling, and JSON template architecture are all in place
- Plan 01-02 can now create theme.liquid and layout files that render css-variables.liquid
- Plan 01-03 can create header/footer sections using the locales schema translations
- Phase 2 homepage sections will inherit the full CSS custom property token system
- Blocker noted: Newsreader and Inter font load strategy (Google Fonts vs Shopify font picker) must be resolved in Plan 01-02 when writing theme.liquid `<head>`

---
*Phase: 01-foundation*
*Completed: 2026-03-21*
