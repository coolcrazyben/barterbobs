---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `shopify theme check` (bundled with Shopify CLI 3.92.x) |
| **Config file** | `.theme-check.yml` (Wave 0 — created in Plan 01-01) |
| **Quick run command** | `shopify theme check` |
| **Full suite command** | `shopify theme check --category all` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `shopify theme check`
- **After every plan wave:** Run `shopify theme check --category all` + manual visual check in dev store
- **Before `/gsd:verify-work`:** Full suite must be green + all 5 success criteria verified manually in dev store
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | FNDX-06 | manual file check | n/a | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | FNDX-05 | `shopify theme check` | `shopify theme check` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | FNDX-02 | `shopify theme check` + manual DevTools | `shopify theme check` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | FNDX-01 | `shopify theme check` | `shopify theme check` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | FNDX-03 | `shopify theme check` + manual Theme Editor reload | `shopify theme check` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | FNDX-01 | `shopify theme check` | `shopify theme check` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | NAVX-01 | manual browser test (iOS Safari blur) | `shopify theme check` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 3 | NAVX-02 | manual — add to cart, verify badge updates | `shopify theme check` | ❌ W0 | ⬜ pending |
| 1-03-03 | 03 | 3 | NAVX-03 | manual — resize to 375px, verify drawer opens left | `shopify theme check` | ❌ W0 | ⬜ pending |
| 1-03-04 | 03 | 3 | NAVX-04 | manual — Theme Editor shows footer settings panel | `shopify theme check` | ❌ W0 | ⬜ pending |
| 1-03-05 | 03 | 3 | FNDX-04 | `shopify theme check` validates schema JSON | `shopify theme check` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.theme-check.yml` — theme check config (ignore `settings_data.json` from check if needed)
- [ ] `config/settings_schema.json` — required for theme check to validate global settings
- [ ] `config/settings_data.json` — default values; pushed once, then never again
- [ ] `.shopifyignore` — MUST exist before any `shopify theme push`; must contain `config/settings_data.json`
- [ ] `snippets/css-variables.liquid` — required for `theme.liquid` to render without error
- [ ] `locales/en.default.json` — required by `shopify theme check` for t-filter strings
- [ ] `locales/en.default.schema.json` — required for schema translations
- [ ] `npm install -D prettier @shopify/prettier-plugin-liquid` — dev tooling install

*Note: Liquid rendering cannot be unit-tested without a running Shopify store instance. All NAVX requirements verified manually via `shopify theme dev` against a dev store.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Glassmorphism blur visible on iOS Safari | NAVX-01 | `backdrop-filter` not testable by theme check; Chrome DevTools emulates webkit so desktop emulation is not sufficient | Test on physical iOS device or BrowserStack iOS Safari; verify blur effect present on nav bar |
| Cart badge updates without page reload | NAVX-02 | Requires live Shopify storefront with AJAX cart operations | In dev store: add product to cart via PDP; verify cart icon count increments without full page reload |
| Mobile hamburger + off-canvas drawer | NAVX-03 | Requires browser resize interaction and drawer animation | Resize browser to 375px; verify hamburger icon visible; click → drawer slides from LEFT; overlay click closes |
| Footer configurable in Theme Editor | NAVX-04 | Requires Shopify admin Theme Editor | Open Theme Editor; verify footer section appears in customization panel with nav menu and content block settings |
| Theme Editor section reload re-initializes JS | FNDX-03 | Requires Theme Editor interaction simulation | In Theme Editor: add a block to header; verify nav drawer still works without page reload |
| `.shopifyignore` prevents `settings_data.json` push | FNDX-06 | File content verification | Check `.shopifyignore` contains `config/settings_data.json` before first `shopify theme push` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
