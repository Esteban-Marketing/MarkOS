---
phase: 200
slug: saas-readiness-wave-0
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-29
canonical_visual_contract: /DESIGN.md
mode: retroactive-backfill
scope:
  - app/(marketing)/integrations/claude/page.tsx
  - app/(marketing)/integrations/claude/demo/page.tsx
  - app/(marketing)/integrations/claude/demo/api/route.ts
out_of_scope:
  - All other Phase 200 plans (200-01 through 200-07 are purely backend / CLI / CI)
  - 200-04 onboarding (bin/install.cjs — no browser surface; onboarding/backend/server.cjs has no React output)
  - OG image binary (200-08.1 deferred)
  - Canon pipeline integration (200-08.4 deferred — current copy is hand-crafted)
  - Durable rate-limit (200-08.2 deferred)
  - Playwright/axe browser scan (200-08.3 deferred)
note: >
  RETROACTIVE BACKFILL. Phase 200 shipped before DESIGN.md v1.1.0 was binding (landed via
  PR #2, post-Phase 200). The two pages were authored without token citations. This document
  records what was actually shipped, identifies canon-deviation debt, and provides the binding
  contract for any future visual audit or Phase 213.x / Phase 220+ rework of this surface.
  Deviation entries marked [DEBT] are tracking artifacts — they do NOT block this backfill.
---

# Phase 200 — UI Design Contract (Retroactive Backfill)

> Visual and interaction contract for the only frontend surface shipped in Phase 200:
> `/integrations/claude` (Claude Marketplace landing page) and `/integrations/claude/demo`
> (in-browser MCP playground). Generated retroactively by gsd-ui-researcher to provide a
> binding contract for future visual audits and Phase 213.x / Phase 220+ rework.
>
> **This is documentation of what shipped, not a redesign mandate.** DESIGN.md v1.1.0 became
> canonical after Phase 200 closed. Deviations from the current canon are flagged as [DEBT]
> for future tracking. They are NOT blockers for this backfill.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — vanilla Next.js JSX with semantic HTML class names; no CSS Modules, no Tailwind, no component library imported |
| Preset | not applicable |
| Component library | none — `.c-*` primitives from `styles/components.css` NOT composed (pre-canon) [DEBT] |
| Icon library | none — no icon elements in either page |
| Heading font | Inherited from global CSS (if globals.css was loaded) — no explicit font declaration in shipped pages [DEBT] |
| Body font | Same as above [DEBT] |
| Default theme | Assumed dark — no `data-theme` attribute set; relies on global body class [DEBT] |
| Form authoring posture | Bespoke class names (`.claude-integration-landing`, `.hero`, `.btn`, `.btn-primary`, `.btn-secondary`, `.tool-grid`, `.demo-error`, `.demo-result`) — NOT composed from `.c-*` primitives [DEBT] |

---

## What Was Actually Shipped

### Surface 1 — Landing page (`/integrations/claude`)

**Route:** `app/(marketing)/integrations/claude/page.tsx`

**Structure (as shipped):**

```
<main.claude-integration-landing>
  <section.hero aria-labelledby="hero-heading">
    <h1 id="hero-heading">
    <p.hero-sub>
    <div.cta-row>
      <Link.btn.btn-primary>   ← primary CTA
      <Link.btn.btn-secondary> ← secondary CTA
  <section.value-props aria-labelledby="value-heading">
    <h2 id="value-heading">
    <ul.value-list>
      3× <li> with <h3> + <p>
  <section.tools aria-labelledby="tools-heading">
    <h2 id="tools-heading">
    <ul.tool-grid aria-label="MCP tool grid">
      10× <li> with <code> + <p>
  <section.install aria-labelledby="install-heading">
    <h2 id="install-heading">
    <ol> (3 steps)
    <p.install-note>
  <section.final-cta aria-labelledby="cta-heading">
    <h2 id="cta-heading">
    <Link.btn.btn-primary>
```

**Accessibility posture (as shipped, per 200-08 test results):**
- Single `<h1>` — [ok] passes test.
- All `<section>` elements have `aria-labelledby` — [ok] passes test.
- CTA `<Link>` elements have explicit `aria-label` — [ok] passes test.
- No `dangerouslySetInnerHTML` — [ok] passes test.
- No inline `<script>` — [ok] passes test.
- Voice classifier score: 100 (threshold 85) — [ok].
- Primary visual anchor: the `<h1>` headline draws first fixation; the mint-fill "Try the demo" button is the secondary focal point.

### Surface 2 — Demo sandbox (`/integrations/claude/demo`)

**Route:** `app/(marketing)/integrations/claude/demo/page.tsx`

**Structure (as shipped):**

```
<main.claude-demo-sandbox>
  <header>
    <h1>MarkOS + Claude — Demo Sandbox</h1>
    <p> (description)
  <form aria-label="Draft brief form" noValidate>
    5× <label htmlFor> + <input> pairs
      - demo-channel
      - demo-audience
      - demo-pain
      - demo-promise
      - demo-brand
    <button type="submit" disabled={loading} aria-busy={loading}>
  <div role="alert".demo-error>  (conditional — error state)
  <section aria-labelledby="demo-result-heading".demo-result>  (conditional)
    <h2 id="demo-result-heading">Result</h2>
    <article aria-label="Generated draft"> (conditional)
      <h3>Draft</h3>
      <p>
    <article aria-label="Audit report"> (conditional)
      <h3>Audit — {status}</h3>
      <p>Score: {score}</p>
      <ul> (conditional — issues list)
        N× <li> with <strong> + text
```

**Proxy route:** `app/(marketing)/integrations/claude/demo/api/route.ts`
- Tool allow-list: `draft_message`, `run_neuro_audit`, `list_pain_points`, `explain_literacy`
- Rate limit: in-memory per-IP, 20 req/min (best-effort, Fluid Compute single instance)
- Blocked: `schedule_post`, `rank_execution_queue` (side-effect tools)

---

## Spacing Scale

**As shipped:** no token citations. All layout relies on browser defaults + Tailwind reset (if applied globally) + class-level styles that do NOT exist in scope — meaning the visual spacing reflects browser user-agent defaults for `<main>`, `<section>`, `<ul>`, `<form>`, `<label>`.

**Canonical contract (what this surface SHOULD use when adopted into DESIGN.md canon):**

| Token | Value | DESIGN.md citation | Intended usage on this surface |
|-------|-------|--------------------|-------------------------------|
| `--space-xs` | 8px | `spacing.xs` | Gap within CTA row; label↔input gap in demo form |
| `--space-sm` | 16px | `spacing.sm` | Card/section internal padding (mobile); tool-grid item padding |
| `--space-md` | 24px | `spacing.md` | Hero section internal vertical rhythm; form section padding |
| `--space-lg` | 32px | `spacing.lg` | Page horizontal padding ≥ md; section-to-section gap |
| `--space-xl` | 48px | `spacing.xl` | Page vertical padding ≥ lg; hero top/bottom breathing room |
| `--space-xxl` | 96px | `spacing.xxl` | Above-fold hero vertical padding on desktop (landing only) |

**Exceptions:**
- `1px` hairline borders for tool-grid item separators and form inputs — DESIGN.md "borders over shadows" rule.
- `2px` focus ring width + offset — global via `globals.css`.
- `44px` minimum touch target for submit button (DESIGN.md "Touch targets").

**[DEBT] — Spacing debt:** No `--space-*` token citations in shipped code. Browser-default `<ul>` / `<ol>` margin/padding applies. Address in Phase 213.x marketing wave or Phase 220+ landing redesign.

---

## Typography

**As shipped:** no explicit font declarations in `page.tsx` files. Typography inherits from global CSS if `app/globals.css` is loaded via layout. No local `module.css` or inline style typography.

**Canonical contract (what this surface SHOULD use):**

| Role | DESIGN.md token | CSS variables | Usage |
|------|-----------------|---------------|-------|
| Page hero heading | `typography.h1` | `var(--font-mono)` + `var(--fs-h1)` (2.441rem) + `var(--fw-bold)` + `var(--lh-h1)` (1.10) + `var(--ls-h1)` | `<h1>Ship drafts from Claude.</h1>` (landing) |
| Section headings | `typography.h2` | `var(--font-mono)` + `var(--fs-h2)` (1.953rem) + `var(--fw-semibold)` + `var(--lh-h2)` (1.20) | 4× `<h2>` across landing sections; `<h2>Result</h2>` in demo |
| Value prop sub-headings | `typography.h3` | `var(--font-mono)` + `var(--fs-h3)` (1.563rem) + `var(--fw-semibold)` + `var(--lh-h3)` (1.30) | 3× `<h3>` in value-list; `<h3>Draft</h3>`, `<h3>Audit</h3>` in demo result |
| Demo page heading | `typography.h1` | same as above | `<h1>MarkOS + Claude — Demo Sandbox</h1>` |
| Hero subtext / section intro | `typography.lead` | `var(--font-sans)` + `var(--fs-lead)` (1.250rem) + `var(--fw-regular)` + `var(--lh-lead)` (1.50) | `.hero-sub` copy; demo intro paragraph |
| Body copy (tool descriptions, install steps, value prop body) | `typography.body-md` | `var(--font-sans)` + `var(--fs-body-md)` (1.000rem) + `var(--fw-regular)` + `var(--lh-body-md)` (1.60) | `<p>` inside `.value-list` items; `.install-note`; tool-grid descriptions |
| MCP tool names in grid | `typography.code-inline` | `var(--font-mono)` + `var(--fs-code)` (0.875rem) + `var(--fw-regular)` | `<code>draft_message</code>` etc. in tool grid — DESIGN.md signature |
| Form labels | `typography.label-caps` | `var(--font-sans)` + `var(--fs-label)` (0.640rem) + `var(--fw-semibold)` + `text-transform: uppercase` + `var(--ls-label)` | Demo form labels: "Channel", "Audience", "Pain", "Promise", "Brand" |
| Button text | `typography.body-md` | `var(--fs-body-md)` + `var(--fw-medium)` | `.btn-primary`, `.btn-secondary`, submit button |

**Declared sizes summary:** 7 sizes (2.441rem h1, 1.953rem h2, 1.563rem h3, 1.250rem lead, 1.000rem body-md, 0.875rem code-inline, 0.640rem label-caps) — exceeds 4-size rule [DEBT]; all are DESIGN.md-canonical named tokens. Future consolidation: merge h3 into h2 (`.tool-grid` headers) and label-caps into body-sm (eyebrow text) for this surface.

**3 weights (regular 400, medium 500, semibold/bold 600/700) — exceeds 2-weight rule [DEBT]; all DESIGN.md-canonical.**

**[DEBT] — Typography debt:** No `var(--font-mono)` / `var(--font-sans)` citations in shipped pages. All font rendering depends on global body font cascade. If `globals.css` is not loaded or font vars not declared, pages render in system-ui sans-serif. Address in Phase 213.x marketing wave.

---

## Color

**As shipped:** no token citations. Colors depend entirely on global CSS cascade. No inline hex, no module-level color declarations in either page. This means the page is either token-correct (if `app/tokens.css` + `app/globals.css` fully cover element-level color) or bare (if class names like `.btn-primary` are not defined anywhere).

**Class name gap [DEBT]:** The shipped `.btn`, `.btn-primary`, `.btn-secondary`, `.hero`, `.hero-sub`, `.cta-row`, `.value-props`, `.tool-grid`, `.claude-integration-landing`, `.claude-demo-sandbox`, `.demo-error`, `.demo-result` class names are NOT defined in `styles/components.css` or any global stylesheet. They are orphan class names — no visual styling is applied to them. This means the pages render as unstyled semantic HTML.

**Canonical contract (what this surface SHOULD use):**

| Range | Token group | Usage on this surface |
|-------|-------------|----------------------|
| 70–80% | `surface` (`#0A0E14`) + `surface-raised` (`#1A1F2A`) | Page background (`--color-surface`), tool-grid item cards (`--color-surface-raised`), demo form inputs (`--color-surface-raised`) |
| 15–20% | `on-surface` + `on-surface-muted` + `on-surface-subtle` | All body copy, tool descriptions, install steps, form labels, form help, `<code>` values |
| 3–5% | `primary` (`#00D9A3`) | Primary CTAs: "Try the demo" (landing hero), "Open the demo sandbox" (landing footer), "Draft message" (demo submit). Focus rings. `<code>` tool-name chip borders on hover. |
| 0–2% | `error` (`#F85149`) | Demo `.demo-error` `role="alert"` state |

| Role | Token | DESIGN.md citation | Usage |
|------|-------|--------------------|-------|
| Page background | `--color-surface` (`#0A0E14`) | `colors.surface` (Kernel Black) | `<main>` wrapper on both pages |
| Card/panel surface | `--color-surface-raised` (`#1A1F2A`) | `colors.surface-raised` | Tool-grid item backgrounds; demo form field backgrounds |
| Hairline borders | `--color-border` (`#2D3441`) | `colors.border` (Border Mist) | Tool-grid item separators; demo form input borders; section dividers |
| Primary text | `--color-on-surface` (`#E6EDF3`) | `colors.on-surface` | Headings, value-prop body, install steps |
| Muted text | `--color-on-surface-muted` (`#7B8DA6`) | `colors.on-surface-muted` | Tool descriptions, `<code>` item subtext, form help text, demo description paragraph |
| Signal — mint | `--color-primary` (`#00D9A3`) | `colors.primary` | Primary CTA buttons (×2 on landing, ×1 on demo); focus rings; `<code>` tool chip accent on hover |
| Mint text (on dark) | `--color-primary-text` | `tokens.css` | `.btn-secondary` text variant (secondary CTA "Read the quickstart") |
| Error | `--color-error` (`#F85149`) | `colors.error` | `[err]` prefix + `.demo-error` alert background tint |

**Accent reserved-for list (this surface):**
1. "Try the demo" button (landing hero — primary CTA, mint fill)
2. "Open the demo sandbox" button (landing footer — primary CTA, mint fill)
3. "Draft message" submit button (demo — primary CTA, mint fill)
4. Focus rings (global, 2px solid mint)
5. `<code>` tool-name chips — mono font is the MarkOS signature; mint border accent on hover

NOT used for: headings, body, tool-grid card backgrounds, form labels.

**Single mint signal (< 5% rule):** Two mint buttons on the landing page (hero + footer CTA). One submit button on demo. On a full-viewport render, these are well within 5% surface area. [ok]

**Forbidden values (must not appear in future rework):**
- Pure black `#000000` — locked.
- Pure white `#FFFFFF` outside `[data-theme="light"]` — locked.
- Gradients of any kind — DESIGN.md "Anti-patterns".
- Drop shadows on cards — DESIGN.md "Borders over shadows"; use `1px solid var(--color-border)`.
- Any teal legacy values from pre-canon era (`#0d9488`, `#0f766e`, `#14b8a6`).

---

## Copywriting Contract

Voice target for this surface: developer-native, terse, system-state register. Archetypes: solopreneur + vibe-coder. Pains: `content_engagement`, `pipeline_velocity`. Hand-crafted to canon (200-08 decision D1 — no live Canon pipeline call due to missing crmStore context on marketing pages).

Voice classifier score: **100** (threshold 85) — [ok] per `test/marketing/claude-landing.test.js`.

**Primary CTA labels:**
- Landing hero: "Try the demo" (verb + noun — short imperative)
- Landing footer: "Open the demo sandbox" (verb + noun — action-specific)
- Demo submit: "Draft message" (verb + noun) / "Drafting…" (system-state loading)
- Secondary CTA: "Read the quickstart" (verb + noun)

**Empty / initial state:**
- Demo form pre-filled with `DEFAULT_BRIEF`: channel=email, audience=founder-sam, pain=pipeline_velocity, promise="refill your pipeline with qualified leads this week", brand=markos. No empty-state copy needed — form always has values.
- Result section: hidden until first submission. No "nothing here yet" empty state copy — intentional (no noise before first draft).

**Error state copy (demo sandbox):**
- Network / unexpected error: `{error.message}` passthrough, displayed in `role="alert"` `.demo-error` div.
- API error: `payload.error` or `demo request failed (${response.status})`.
- [DEBT] Error messages are raw passthrough — no canonical `[err] {problem}. {remediation}.` format per DESIGN.md "Errors carry remediation." Future rework should normalize: `[err] Draft request failed. Check your connection and retry.`

**Loading state copy:**
- Submit button: "Drafting…" (system-state ellipsis — DESIGN.md register match) + `aria-busy="true"`

**Destructive actions:** none on either page. [ok]

**Rate-limit notice (demo):**
- Copy (inline in `<header><p>`): "No signup. Rate-limited by IP." — terse, functional disclosure.
- [DEBT] If rate-limit is hit, the error passthrough returns the raw error string. Future rework should provide: `[warn] Rate limit reached. Retry in a minute.`

**Install instructions (landing, `<ol>`):**
1. "Open Claude Desktop settings."
2. "Add a Custom MCP Server pointing at `https://markos.dev/api/mcp/session`."
3. "Ask Claude: *draft a LinkedIn post about pipeline velocity for founder-sam*."

**Banned lexicon check** (against shipped copy):
- "Ship drafts from Claude." — [ok]
- "Ten tools for drafting, auditing, and scheduling campaigns" — [ok]
- "grounded in your canon, fired from the chat window you already use" — [ok]. "already use" is familiarity framing, not a softener.
- "Stop re-briefing the model" — [ok]
- "Pipeline velocity, not pipeline theater" — [ok]. Strong, non-banned.
- No exclamation points. [ok]
- No emoji. [ok]
- No banned terms present. [ok]

---

## Registry

shadcn not initialized. No third-party component registry used. Registry safety gate: not applicable.

---

## Interaction Contract

### Landing page (`/integrations/claude`)

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Primary CTA click | `.btn-primary` "Try the demo" | Client-side navigation to `/integrations/claude/demo` via Next.js `<Link>` |
| Secondary CTA click | `.btn-secondary` "Read the quickstart" | Client-side navigation to `/docs/quickstart` via Next.js `<Link>` |
| Footer CTA click | `.btn-primary` "Open the demo sandbox" | Same as primary CTA |
| Focus | Any interactive element | 2px solid `var(--color-primary)` focus ring, 2px offset (global via `globals.css`) |
| Keyboard nav | Buttons + links | Tab order: hero CTA pair → value section → tools grid → install → footer CTA |

No hover states, loading states, or transitions defined in shipped code (orphan class names — no styles applied). [DEBT]

### Demo sandbox (`/integrations/claude/demo`)

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Form field edit | 5× `<input>` | Controlled React state via `updateField()` |
| Form submit | `<button type="submit">` | `onSubmit` → `setLoading(true)` → POST `/integrations/claude/demo/api` → update result/error state |
| Loading state | Submit button | `disabled={loading}` + `aria-busy={loading}` + button text "Drafting…" |
| Success | `.demo-result` | Result section appears with `<article>` for draft + `<article>` for audit |
| Error | `div[role="alert"].demo-error` | Error message renders below form; `role="alert"` for screen-reader announcement |
| Keyboard nav | Form | Native form keyboard handling; Tab order follows DOM order |

**Motion:** no explicit transitions or animations in shipped code. Button `disabled` state is the only interaction feedback. [DEBT] Future rework should add: `transition: background-color var(--duration-base) var(--ease-out)` on buttons, `transition: opacity var(--duration-fast)` on result section appearance.

---

## Canon Deviation Debt Log

The following items are DESIGN.md v1.1.0 deviations in the shipped code. They are NOT blockers for this retroactive backfill. Each is a tracking artifact for the Phase 213.x marketing wave or Phase 220+ landing redesign.

| # | File | Deviation | Impact | Resolution |
|---|------|-----------|--------|------------|
| D-01 | `page.tsx` (both) | Class names (`.btn`, `.btn-primary`, `.hero`, `.tool-grid`, etc.) are NOT defined in `styles/components.css` — orphan selectors, no visual styling applied | Pages render as unstyled semantic HTML | Rework: map to `.c-button.c-button--primary`, `.c-button.c-button--secondary`; define marketing-layout module CSS with token citations |
| D-02 | `page.tsx` (both) | No `var(--space-*)` token citations — layout relies on browser user-agent defaults | Inconsistent spacing vs. rest of app | Rework: wrap in marketing layout module; cite `--space-*` tokens |
| D-03 | `page.tsx` (both) | No explicit font declarations — typography relies on body cascade from `globals.css` | If font not loaded, falls back to system-ui | Confirm `globals.css` applied via root layout; no local action needed if cascade verified |
| D-04 | `demo/page.tsx` | Error passthrough is raw string — no `[err]` glyph prefix, no remediation sentence | Violates DESIGN.md "Errors carry remediation"; violates Phase 213.1 Amendment 4 bracketed-glyph rule | Rework: normalize error display to `[err] {message}. {remediation}.` |
| D-05 | `demo/page.tsx` | Rate-limit error not surfaced distinctly — falls through to generic error handler | No `[warn]` signal for rate-limit vs. network error | Rework: parse 429 response; display `[warn] Rate limit reached. Retry in a minute.` |
| D-06 | `page.tsx` (landing) | No `data-theme` attribute — assumes global dark body class | Light-mode users see dark chrome only if global class is set | Confirm root layout sets `class="dark"` or `data-theme="dark"` consistently across marketing routes |
| D-07 | `page.tsx` (landing) | No CSS Module — no `module.css` file for marketing layout | Marketing page layout unscoped; potential cascade interference | Rework: add `integrations-claude.module.css` with token-cited layout rules |
| D-08 | `demo/page.tsx` | No result-appear transition — section visibility toggles without motion | Jarring state change | Rework: `opacity: 0 → 1` with `var(--duration-fast)` |
| D-09 | Both | OG image at `/integrations/claude/og.png` deferred (200-08.1) — Metadata references it but binary may be absent | Missing social preview on share | Resolve via 200-08.1 asset generation task |

**Priority order for resolution:** D-01 (visual correctness, high) → D-04 + D-05 (a11y + voice, medium) → D-02 (spacing consistency, medium) → D-06 (theme correctness, medium) → D-07 (maintainability, low) → D-03 + D-08 + D-09 (polish, low).

---

## Phase Integration Notes

### Relationship to DESIGN.md v1.1.0

DESIGN.md v1.1.0 landed post-Phase 200. The `/integrations/claude` surface pre-dates it. When Phase 213.x reaches the marketing routes (planned as a future marketing wave after 213.4), this UI-SPEC becomes the source-of-truth for what was shipped and what must change. Executors working that wave MUST:

1. Replace orphan class names with `.c-button`, `.c-button--primary`, `.c-button--secondary` primitives from `styles/components.css`.
2. Add `integrations-claude.module.css` for marketing layout — cite `var(--space-*)` tokens exclusively.
3. Normalize error display in `demo/page.tsx` to use `[err]` / `[warn]` bracketed glyphs.
4. Verify dark theme cascade is applied to marketing routes via root layout.
5. Deferred tasks 200-08.1 through 200-08.4 should be bundled with that wave.

### What is NOT touched by this backfill

- `app/(marketing)/integrations/claude/demo/api/route.ts` — server-only proxy; no UI surface.
- `test/marketing/claude-landing.test.js` — test passes as-is (13/13); updating test is out of scope.
- `public/integrations/claude/og.png` — binary artifact tracked under 200-08.1 deferred task.
