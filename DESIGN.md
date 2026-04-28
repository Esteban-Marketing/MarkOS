---
version: alpha
name: MarkOS
description: >-
  Marketing operating system. Engineering-grade clarity, dark by default,
  monospace headlines, single-mint signal, 8px grid, 1.250 type scale.
  Optimized for AI coding agents and human implementers alike.

# ──────────────────────────────────────────────────────────────────────────────
# CORE TOKENS
# ──────────────────────────────────────────────────────────────────────────────

colors:
  # Brand
  primary:               "#00D9A3"   # Protocol Mint — the signal color
  primary-hover:         "#00C492"
  primary-pressed:       "#00B083"
  primary-subtle:        "#00D9A31A"  # 10% alpha for tinted surfaces
  on-primary:            "#0A0E14"    # Kernel Black on mint

  secondary:             "#7B8DA6"   # Vault Slate — chrome, secondary text
  secondary-hover:       "#8C9DB5"
  on-secondary:          "#0A0E14"

  accent:                "#FFB800"   # Override Amber — warnings, premium
  accent-hover:          "#FFC633"
  on-accent:             "#0A0E14"

  # Surfaces (dark, default)
  surface:               "#0A0E14"   # Kernel Black — page background
  surface-raised:        "#1A1F2A"   # Process Gray — cards, panels
  surface-overlay:       "#242B38"   # Modals, popovers
  surface-inverse:       "#F4F4F0"   # Lino Light — for light-mode flips

  # Borders & dividers
  border:                "#2D3441"   # Border Mist — 1px hairlines
  border-strong:         "#3A4250"   # Heavier dividers, focused inputs
  border-subtle:         "#2D344166" # 40% alpha for ghost borders

  # Text
  on-surface:            "#E6EDF3"   # Terminal White — primary text on dark
  on-surface-muted:      "#7B8DA6"   # Vault Slate — secondary text
  on-surface-subtle:     "#6B7785"   # Comment Gray — metadata, disabled

  # State (semantic)
  success:               "#3FB950"
  success-hover:         "#4ED561"   # success +lift; ratio against surface = 5.6:1 (AA normal)
  on-success:            "#0A0E14"
  warning:               "#FFB800"   # Aliased to accent
  warning-hover:         "#FFC633"   # Aliased to accent-hover
  on-warning:            "#0A0E14"
  error:                 "#F85149"
  error-hover:           "#FF6961"   # error +lift; ratio against surface = 5.4:1 (AA normal)
  on-error:              "#0A0E14"
  info:                  "#58A6FF"
  info-hover:            "#79B8FF"   # info +lift; ratio against surface = 7.6:1 (AA normal)
  on-info:               "#0A0E14"

  # Light-mode complements (for docs site light theme + print)
  light-surface:         "#F4F4F0"   # Lino Light
  light-surface-raised:  "#FFFFFF"
  light-on-surface:      "#0A0E14"
  light-border:          "#D6D6D0"

# ──────────────────────────────────────────────────────────────────────────────
# TYPOGRAPHY  ·  Major Third (1.250) scale, 16px base
# ──────────────────────────────────────────────────────────────────────────────

typography:
  display:
    fontFamily: "JetBrains Mono"
    fontSize: 3.052rem      # 48.83px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"

  h1:
    fontFamily: "JetBrains Mono"
    fontSize: 2.441rem      # 39.06px
    fontWeight: 700
    lineHeight: 1.10
    letterSpacing: "-0.015em"

  h2:
    fontFamily: "JetBrains Mono"
    fontSize: 1.953rem      # 31.25px
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: "-0.01em"

  h3:
    fontFamily: "JetBrains Mono"
    fontSize: 1.563rem      # 25.00px
    fontWeight: 600
    lineHeight: 1.30
    letterSpacing: "-0.005em"

  h4:
    fontFamily: "JetBrains Mono"
    fontSize: 1.250rem      # 20.00px
    fontWeight: 500
    lineHeight: 1.40
    letterSpacing: "0"

  lead:
    fontFamily: "Inter"
    fontSize: 1.250rem      # 20.00px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: "-0.005em"

  body-md:
    fontFamily: "Inter"
    fontSize: 1.000rem      # 16.00px
    fontWeight: 400
    lineHeight: 1.60
    letterSpacing: "0"

  body-sm:
    fontFamily: "Inter"
    fontSize: 0.800rem      # 12.80px
    fontWeight: 500
    lineHeight: 1.50
    letterSpacing: "0.01em"

  label-caps:
    fontFamily: "Inter"
    fontSize: 0.640rem      # 10.24px
    fontWeight: 600
    lineHeight: 1.40
    letterSpacing: "0.04em"
    fontFeature: '"ss01" 1'

  code-inline:
    fontFamily: "JetBrains Mono"
    fontSize: 0.875rem      # 14.00px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: "0"

  code-block:
    fontFamily: "JetBrains Mono"
    fontSize: 0.875rem      # 14.00px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0"

# ──────────────────────────────────────────────────────────────────────────────
# SPACING  ·  Strict 8px grid
# ──────────────────────────────────────────────────────────────────────────────

spacing:
  none:  0
  xxs:   2px
  xs:    8px
  sm:    16px
  md:    24px
  lg:    32px
  xl:    48px
  xxl:   96px

# ──────────────────────────────────────────────────────────────────────────────
# RADIUS
# ──────────────────────────────────────────────────────────────────────────────

rounded:
  none: 0
  xs:   2px      # Tags, micro-pills
  sm:   4px      # Inputs, code chips
  md:   6px      # Buttons, default cards
  lg:   8px      # Modals, large cards
  xl:   12px     # Hero panels, feature blocks
  full: 9999px   # Pills, avatars

# ──────────────────────────────────────────────────────────────────────────────
# ELEVATION  ·  Subtle, dark-aware. We prefer borders over shadows.
# ──────────────────────────────────────────────────────────────────────────────

elevation:
  flat:    "none"
  raised:  "0 1px 0 0 #2D3441"                                  # 1px crisp lift
  card:    "0 1px 2px 0 rgba(0,0,0,0.35)"                       # subtle card
  popover: "0 8px 24px -4px rgba(0,0,0,0.45), 0 0 0 1px #2D3441" # popover
  modal:   "0 24px 64px -8px rgba(0,0,0,0.55), 0 0 0 1px #3A4250" # modal

# ──────────────────────────────────────────────────────────────────────────────
# MOTION
# ──────────────────────────────────────────────────────────────────────────────

motion:
  duration-instant: 0ms
  duration-fast:    100ms
  duration-base:    150ms
  duration-slow:    300ms
  duration-pulse:   2000ms
  ease-out:         "cubic-bezier(0.2, 0, 0, 1)"
  ease-in-out:      "cubic-bezier(0.4, 0, 0.2, 1)"
  ease-linear:      "linear"

# ──────────────────────────────────────────────────────────────────────────────
# BREAKPOINTS  ·  Mobile-first
# ──────────────────────────────────────────────────────────────────────────────

breakpoints:
  sm:  640px    # Phone landscape
  md:  768px    # Tablet portrait — type scale steps down here
  lg:  1024px   # Tablet landscape / small laptop
  xl:  1280px   # Desktop default container max
  xxl: 1536px   # Wide desktop

# ──────────────────────────────────────────────────────────────────────────────
# COMPONENTS  ·  Each variant is a separate entry per Google spec.
# Properties: backgroundColor, textColor, typography, rounded, padding, size,
# height, width.
# ──────────────────────────────────────────────────────────────────────────────

components:

  # ── Buttons ────────────────────────────────────────────────────────────────

  button-primary:
    backgroundColor: "{colors.primary}"
    textColor:       "{colors.on-primary}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.md}"
    padding:         "12px 20px"
    height:          40px

  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor:       "{colors.on-primary}"

  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor:       "{colors.on-primary}"

  button-primary-disabled:
    backgroundColor: "{colors.primary-subtle}"
    textColor:       "{colors.on-surface-subtle}"

  button-secondary:
    backgroundColor: "transparent"
    textColor:       "{colors.on-surface}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.md}"
    padding:         "11px 19px"  # 1px less to compensate for border
    height:          40px

  button-secondary-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor:       "{colors.on-surface}"

  button-tertiary:
    backgroundColor: "transparent"
    textColor:       "{colors.primary}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.md}"
    padding:         "12px 16px"

  button-tertiary-hover:
    backgroundColor: "{colors.primary-subtle}"
    textColor:       "{colors.primary}"

  button-destructive:
    backgroundColor: "#F8514920"   # Error Red @ 12% alpha
    textColor:       "{colors.error}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.md}"
    padding:         "12px 20px"
    height:          40px

  button-destructive-hover:
    backgroundColor: "#F8514933"   # Error Red @ 20% alpha

  # ── Inputs ─────────────────────────────────────────────────────────────────

  input-text:
    backgroundColor: "{colors.surface-raised}"
    textColor:       "{colors.on-surface}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.sm}"
    padding:         "10px 12px"
    height:          40px

  input-text-focus:
    backgroundColor: "{colors.surface-raised}"
    textColor:       "{colors.on-surface}"
    # Adds 2px Protocol Mint outline outside the 1px Border Mist

  input-text-disabled:
    backgroundColor: "{colors.surface}"
    textColor:       "{colors.on-surface-subtle}"

  input-text-error:
    backgroundColor: "{colors.surface-raised}"
    textColor:       "{colors.on-surface}"
    # Border swaps to {colors.error}

  # ── Cards ──────────────────────────────────────────────────────────────────

  card-default:
    backgroundColor: "{colors.surface-raised}"
    textColor:       "{colors.on-surface}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.lg}"
    padding:         "{spacing.md}"   # 24px

  card-interactive:
    backgroundColor: "{colors.surface-raised}"
    textColor:       "{colors.on-surface}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.lg}"
    padding:         "{spacing.md}"

  card-interactive-hover:
    backgroundColor: "{colors.surface-overlay}"
    textColor:       "{colors.on-surface}"

  card-feature:
    backgroundColor: "{colors.surface-raised}"
    textColor:       "{colors.on-surface}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.xl}"
    padding:         "{spacing.lg}"   # 32px

  # ── Navigation ─────────────────────────────────────────────────────────────

  nav-link:
    backgroundColor: "transparent"
    textColor:       "{colors.on-surface-muted}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.sm}"
    padding:         "8px 12px"

  nav-link-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor:       "{colors.on-surface}"

  nav-link-active:
    backgroundColor: "{colors.primary-subtle}"
    textColor:       "{colors.primary}"

  # ── Chips & Tags ───────────────────────────────────────────────────────────

  chip-default:
    backgroundColor: "{colors.surface-raised}"
    textColor:       "{colors.on-surface-muted}"
    typography:      "{typography.body-sm}"
    rounded:         "{rounded.full}"
    padding:         "4px 10px"
    height:          24px

  chip-mint:
    backgroundColor: "{colors.primary-subtle}"
    textColor:       "{colors.primary}"
    typography:      "{typography.body-sm}"
    rounded:         "{rounded.full}"
    padding:         "4px 10px"
    height:          24px

  chip-protocol:    # Signature MarkOS chip e.g. [F-105]
    backgroundColor: "{colors.surface-raised}"
    textColor:       "{colors.primary}"
    typography:      "{typography.code-inline}"
    rounded:         "{rounded.sm}"
    padding:         "2px 6px"
    height:          20px

  # ── Badges ─────────────────────────────────────────────────────────────────

  badge-success:
    backgroundColor: "#3FB95020"
    textColor:       "{colors.success}"
    typography:      "{typography.label-caps}"
    rounded:         "{rounded.xs}"
    padding:         "2px 6px"

  badge-warning:
    backgroundColor: "#FFB80020"
    textColor:       "{colors.warning}"
    typography:      "{typography.label-caps}"
    rounded:         "{rounded.xs}"
    padding:         "2px 6px"

  badge-error:
    backgroundColor: "#F8514920"
    textColor:       "{colors.error}"
    typography:      "{typography.label-caps}"
    rounded:         "{rounded.xs}"
    padding:         "2px 6px"

  badge-info:
    backgroundColor: "#58A6FF20"
    textColor:       "{colors.info}"
    typography:      "{typography.label-caps}"
    rounded:         "{rounded.xs}"
    padding:         "2px 6px"

  # ── Code surfaces (signature MarkOS surface) ──────────────────────────────

  code-block:
    backgroundColor: "{colors.surface}"
    textColor:       "{colors.on-surface}"
    typography:      "{typography.code-block}"
    rounded:         "{rounded.md}"
    padding:         "{spacing.md}"

  terminal-frame:
    backgroundColor: "{colors.surface}"
    textColor:       "{colors.on-surface}"
    typography:      "{typography.code-block}"
    rounded:         "{rounded.lg}"
    padding:         "0"   # Internal padding handled by frame components

  # ── Modal / Dialog ─────────────────────────────────────────────────────────

  modal:
    backgroundColor: "{colors.surface-overlay}"
    textColor:       "{colors.on-surface}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.lg}"
    padding:         "{spacing.lg}"
    width:           "560px"

  # ── Toast / Notification ───────────────────────────────────────────────────

  toast-default:
    backgroundColor: "{colors.surface-overlay}"
    textColor:       "{colors.on-surface}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.md}"
    padding:         "{spacing.sm}"
    width:           "360px"

  # ── Notice / Banner (full-shell-width contextual banner) ───────────────────
  # Distinct from toast-default (transient floating notification). Persistent
  # ambient state — rotation grace, billing issues, verification-pending.
  # 4px inline-start accent bar + 12% alpha tint of state color (badge formula).
  # Pairs with bracketed glyph ([warn]/[err]/[info]/[ok]) per Color blindness rule.

  notice-default:
    backgroundColor: "{colors.surface-raised}"
    textColor:       "{colors.on-surface}"
    typography:      "{typography.body-md}"
    rounded:         0
    padding:         "16px 24px"
    # 4px solid {colors.on-surface-subtle} border-inline-start (default neutral)

  notice-success:
    backgroundColor: "#3FB95020"   # success @ 12% alpha
    textColor:       "{colors.success}"
    typography:      "{typography.body-md}"
    rounded:         0
    padding:         "16px 24px"
    # 4px solid {colors.success} border-inline-start

  notice-warning:
    backgroundColor: "#FFB80020"   # warning @ 12% alpha
    textColor:       "{colors.warning}"
    typography:      "{typography.body-md}"
    rounded:         0
    padding:         "16px 24px"
    # 4px solid {colors.warning} border-inline-start

  notice-error:
    backgroundColor: "#F8514920"   # error @ 12% alpha
    textColor:       "{colors.error}"
    typography:      "{typography.body-md}"
    rounded:         0
    padding:         "16px 24px"
    # 4px solid {colors.error} border-inline-start

  notice-info:
    backgroundColor: "#58A6FF20"   # info @ 12% alpha
    textColor:       "{colors.info}"
    typography:      "{typography.body-md}"
    rounded:         0
    padding:         "16px 24px"
    # 4px solid {colors.info} border-inline-start

  # ── Status dot (signature MarkOS element) ──────────────────────────────────

  status-dot-live:
    backgroundColor: "{colors.primary}"
    rounded:         "{rounded.full}"
    size:            "6px"
    # Animates with 2s opacity pulse (1.0 → 0.4 → 1.0)

  status-dot-idle:
    backgroundColor: "{colors.on-surface-subtle}"
    rounded:         "{rounded.full}"
    size:            "6px"

  status-dot-error:
    backgroundColor: "{colors.error}"
    rounded:         "{rounded.full}"
    size:            "6px"
---

# DESIGN.md · MarkOS

> Single source of truth for visual implementation across MarkOS surfaces — CLI, marketing site, documentation, dashboard, presentations, and AI-generated UI. Lints clean against the Google Labs `@google/design.md` spec (alpha) and exports cleanly to Tailwind theme config and W3C DTCG `tokens.json`.

**Audience:** AI coding agents (Claude Code, Cursor, Stitch, Windsurf, Kiro), human implementers, and design contributors.

**Companion documents:** `MarkOS_Brief_Maestro.md` (brand identity, voice, applications) · `MarkOS_Cheat_Sheet.md` (one-page spec card) · `AGENTS.md` (engineering conventions for coding agents).

---

## Overview

MarkOS is the marketing operating system for AI-ready teams. The visual language reflects what the product is: **infrastructure**. Not a marketing app, not a SaaS dashboard — an OS layer.

**Atmosphere.** Engineering-grade clarity. Editor-grade dark by default. Monospace headlines that signal a developer-first audience. A single saturated mint that says *the system is alive*. Generous breathing room on an 8px ladder. Zero gradients, zero glow, zero soft shadows — only deliberate composition.

**Feel.** A clean tmux session at 2 AM. The pleasure of a tool that obeys.

**Design philosophy in five words.** Specified, dark, monospaced, mint, quiet.

**Density.** Medium-low. We use whitespace as a primitive. At least 30% of any composition is empty surface. Information density rises in tabular and code surfaces; everywhere else, breathe.

**Anti-patterns.** Cobalt-blue dev-tool clichés, Corporate Memphis illustrations, mesh gradients, glowing CTAs, mascots, centered everything, 9-bullet feature grids.

---

## Colors

The palette is engineered for distinction in a sea of cobalt-blue developer tools and lavender SaaS gradients. Default surface is dark — matching the developer's editor, not the marketing department's slide deck.

### Brand

- **Primary `#00D9A3` (Protocol Mint).** The signal color. Used for the single most important call-to-action on a screen, "alive" indicators, brand accents, and interactive focus rings. Never as a fill color for large surfaces. Less than 5% of any composition.
- **Secondary `#7B8DA6` (Vault Slate).** Chrome. Borders, secondary text, footer surfaces, dividers, metadata. Carries no emotional weight — its job is to recede.
- **Accent `#FFB800` (Override Amber).** Reserved for two semantics: **override resolution** (a `.markos-local/` rule overriding a default) and **warning state**. Premium-tier markers also use it sparingly. Less than 2% of any composition.

### Surfaces

- **Surface `#0A0E14` (Kernel Black).** Default page background. Cooler than pure black; OLED-friendly. Replaces `#000000` everywhere.
- **Surface-raised `#1A1F2A` (Process Gray).** Cards, panels, code-block backgrounds, sidebar surfaces. The first level of visual lift.
- **Surface-overlay `#242B38`.** Modals, popovers, toasts, command palette. The second level — used only for elements that float above the page.
- **Surface-inverse `#F4F4F0` (Lino Light).** Light-mode equivalent for docs site light theme, printed collateral, and surfaces where light context is required (e.g., embedded marketing in third-party newsletters).

### Text

- **on-surface `#E6EDF3` (Terminal White).** Primary text on dark. Slightly cooled toward blue for OLED comfort over long reading sessions. Contrast ratio 16.3:1 on Kernel Black (WCAG AAA).
- **on-surface-muted `#7B8DA6` (Vault Slate).** Secondary text, labels, captions. Aliased to `secondary`. 5.7:1 (WCAG AA).
- **on-surface-subtle `#6B7785` (Comment Gray).** Tertiary text, metadata, disabled controls, code comment color. 4.6:1 (WCAG AA).

### State

- **success `#3FB950`** — successful operations, `installed`, `migrated`, `up to date`.
- **warning `#FFB800`** — aliased to accent. Override notices, near-deprecation, soft warnings.
- **error `#F85149`** — destructive actions, exit codes ≠ 0, fatal failures.
- **info `#58A6FF`** — tips, contextual help, hyperlinks in docs. Tuned to GitHub Dark's link blue intentionally — MarkOS lives in the same visual neighborhood as the developer's other tools.

### WCAG 2.1 contrast matrix (against `surface` `#0A0E14`)

| Foreground | Ratio | Compliance |
| --- | --- | --- |
| `on-surface` `#E6EDF3` | 16.3:1 | AAA all sizes |
| `primary` `#00D9A3` | 10.5:1 | AAA all sizes |
| `accent` `#FFB800` | 11.2:1 | AAA all sizes |
| `success` `#3FB950` | 8.4:1 | AAA all sizes |
| `error` `#F85149` | 6.1:1 | AA normal, AAA large |
| `info` `#58A6FF` | 7.2:1 | AAA all sizes |
| `on-surface-muted` `#7B8DA6` | 5.7:1 | AA normal, AAA large |
| `on-surface-subtle` `#6B7785` | 4.6:1 | AA normal |

### Composition proportion

| Range | Token group |
| --- | --- |
| 70–80% | `surface` + `surface-raised` |
| 15–20% | `on-surface` + `on-surface-muted` |
| 3–5% | `primary` (signal — never higher) |
| 0–2% | `accent` (warning / override only) |

### Forbidden color usage

- ❌ Pure black `#000000` — use `surface` `#0A0E14`.
- ❌ Pure white `#FFFFFF` outside of `light-surface-raised` (cards on light mode) and print.
- ❌ Mint as a text color on `light-surface` `#F4F4F0` — contrast ratio is 1.6:1 (fails). Use Kernel Black on mint, never mint on light.
- ❌ Cobalt-blue (`#3B82F6`, `#2563EB`, etc.) — explicitly avoided as a brand differentiation choice.
- ❌ Gradients of any kind, including subtle vertical fades on cards. Flat color only.
- ❌ Mint as a fill color on surfaces larger than a button or chip.

---

## Typography

Two typefaces. No third. Both open-source, both available in Google Fonts, Figma, Canva, and the major design tools.

### Families

- **JetBrains Mono** (display + headings + code). Promoted from "code typeface" to "headline typeface" — this is intentional. It signals a developer-first product. Used for all `h1`–`h4`, the wordmark, code surfaces, and tabular numerals.
- **Inter** (body + UI). Neutral sans-serif designed for screens. Carries prose. Lets JetBrains Mono carry character.

### Scale

The scale is the **Major Third (1.250)** ratio with a 16px base. Each level multiplies or divides by 1.250.

| Token | Family | Weight | rem | px | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- | --- |
| `display` | JetBrains Mono | 700 | 3.052 | 48.83 | 1.05 | -0.02em |
| `h1` | JetBrains Mono | 700 | 2.441 | 39.06 | 1.10 | -0.015em |
| `h2` | JetBrains Mono | 600 | 1.953 | 31.25 | 1.20 | -0.01em |
| `h3` | JetBrains Mono | 600 | 1.563 | 25.00 | 1.30 | -0.005em |
| `h4` | JetBrains Mono | 500 | 1.250 | 20.00 | 1.40 | 0 |
| `lead` | Inter | 400 | 1.250 | 20.00 | 1.50 | -0.005em |
| `body-md` | Inter | 400 | 1.000 | 16.00 | 1.60 | 0 |
| `body-sm` | Inter | 500 | 0.800 | 12.80 | 1.50 | 0.01em |
| `label-caps` | Inter | 600 | 0.640 | 10.24 | 1.40 | 0.04em |
| `code-inline` | JetBrains Mono | 400 | 0.875 | 14.00 | 1.50 | 0 |
| `code-block` | JetBrains Mono | 400 | 0.875 | 14.00 | 1.65 | 0 |

### OpenType features

- **Tabular numerals** are default in JetBrains Mono. For Inter inside tables and data grids, enable `font-feature-settings: "tnum" 1`.
- `label-caps` enables stylistic set 01 (`"ss01" 1`) for the small-caps look without faux-uppercase.
- Code blocks enable ligatures (`"liga" 1, "calt" 1`) — JetBrains Mono ligatures are part of its character.

### Rules

1. **Uppercase** is allowed only on `label-caps` (10–13px) with positive tracking. Never on `h1`–`h4`. Headlines in all caps shout; we do not shout.
2. **Italic** is body emphasis only. Never on headlines, never in code blocks.
3. **Pairing.** If the headline is `h1` JetBrains Mono Bold, the deck below it is Inter Regular `lead`. Never two heavy weights stacked.
4. **Line length.** Body copy max 75 characters per line. Code blocks have no max but should not horizontal-scroll on a 1024px viewport.
5. **Responsive.** The scale steps down by one level on viewports `< md` (768px). `h1` becomes `h2`, `h2` becomes `h3`, `h3` becomes `h4`. `body-md` is unchanged.
6. **Numerals in tables** use tabular figures (see OpenType features above) so columns align.

### Fallback stacks

```
font-family: "JetBrains Mono", "Source Code Pro", "Menlo", "Consolas", monospace;
font-family: "Inter", system-ui, -apple-system, "Segoe UI", "Roboto", sans-serif;
```

---

## Layout

### Grid

12-column CSS Grid with 24px (`spacing.md`) gutter. Container max-width 1280px (`breakpoints.xl`). Page horizontal padding scales:

| Viewport | Horizontal padding |
| --- | --- |
| `< sm` (mobile) | 16px (`spacing.sm`) |
| `sm`–`md` | 24px (`spacing.md`) |
| `md`–`xl` | 48px (`spacing.xl`) |
| `≥ xl` (desktop) | centered, max 1280px wide |

### Spacing scale (8px base)

| Token | Value | Primary use |
| --- | --- | --- |
| `none` | 0 | Reset |
| `xxs` | 2px | Hairline offsets, badge inner padding |
| `xs` | 8px | Icon spacing, tag inline gaps, tight rows |
| `sm` | 16px | Button padding, input padding, inter-row spacing |
| `md` | 24px | Card padding, component vertical margins, grid gutters |
| `lg` | 32px | Modal padding, sidebar padding, section grouping |
| `xl` | 48px | Page margins, major section breaks |
| `xxl` | 96px | Landing-page narrative-block separation |

**Cardinal rule:** no arbitrary values. If a layout needs 18px, use 16 or 24. If it needs 40px, use 32 or 48. Off-grid values are bugs — the linter will not catch them, but a reviewer will.

### Vertical rhythm (landing pages)

```
xxl (96px)  ── major narrative blocks (hero, features, testimonial, CTA)
xl  (48px)  ── subsection separators within a block
lg  (32px)  ── grouped components within a subsection
md  (24px)  ── paragraph spacing inside prose
```

### Whitespace philosophy

Reserve at least **30% empty surface** in every composition. Negative space on Kernel Black is part of the design, not a void to fill. Most "feature grids" violate this; we don't ship them.

---

## Elevation & Depth

We prefer **borders over shadows** on dark surfaces. A 1px Border Mist hairline reads cleaner than a soft shadow on near-black. Shadows are reserved for elements that genuinely float (popovers, modals, toasts).

| Token | Value | Use |
| --- | --- | --- |
| `flat` | `none` | Default. Used on most cards. |
| `raised` | 1px Border Mist (`#2D3441`) | Cards on `surface`. The 1px replaces a shadow. |
| `card` | `0 1px 2px rgba(0,0,0,0.35)` | Subtle card lift when border isn't possible. |
| `popover` | `0 8px 24px -4px rgba(0,0,0,0.45) + 1px border` | Dropdowns, popovers, tooltips. |
| `modal` | `0 24px 64px -8px rgba(0,0,0,0.55) + 1px stronger border` | Modals, dialogs. |

### Surface hierarchy

```
surface          (#0A0E14)  ── page background
  └── surface-raised  (#1A1F2A)  ── cards, panels, sidebar
        └── surface-overlay (#242B38)  ── modal, popover, toast
```

Each level is a deliberate ~10% lift in luminance. Three levels is the maximum — anything deeper produces visual noise.

---

## Shapes

| Token | Value | Use |
| --- | --- | --- |
| `none` | 0 | Sharp edges (rare; tables, dividers) |
| `xs` | 2px | Tags, badges, micro-pills |
| `sm` | 4px | Inputs, code chips, tooltips |
| `md` | 6px | Buttons (default), small cards |
| `lg` | 8px | Modals, default cards, panels |
| `xl` | 12px | Hero panels, feature blocks |
| `full` | 9999px | Status dots, avatars, fully-rounded chips |

### Rules

- **Never mix sharp and rounded corners** in the same composition. Pick a register and hold it.
- **Avoid radii larger than 12px** outside of fully-rounded elements — large pillowy rounding reads as a consumer app, not an OS.
- **The wordmark `MarkOS` is set in unrounded JetBrains Mono Bold** — the typeface itself carries terminal/system semantics; rounded radii in surrounding chrome would dilute it.

---

## Components

Each component has a default entry plus state variants (`-hover`, `-pressed`, `-disabled`, `-focus`, `-error`) declared as separate component entries per the Google Labs spec. The YAML front matter is canonical; this section describes intent and adds visual rules not capturable in tokens.

### Buttons

**Primary (`button-primary`).** Protocol Mint background, Kernel Black text. The single most-important action on a screen. Maximum **one** primary button per primary view. 40px height, 6px radius, 12×20px padding, `body-md` typography.

**Secondary (`button-secondary`).** Transparent background, Terminal White text, 1px Vault Slate border. Default action when no primary exists, or the secondary in a pair. Padding is 11×19px (1px less than primary) so the visual outline aligns to the same 40px height.

**Tertiary (`button-tertiary`).** Text-only in Protocol Mint, no background, no border. Used for in-flow actions (e.g., "view docs →" inside body copy). Hover fills with `primary-subtle` (10% mint).

**Destructive (`button-destructive`).** Error Red text on a 12% Error Red wash. Used only for irreversible actions (delete, drop schema, force re-init). Hover wash deepens to 20%.

**Common rules.**
- Focus ring: 2px solid `primary` with 2px offset (`outline-offset: 2px`). Never `outline: none` without replacing it.
- Disabled state has no hover effect; cursor is `not-allowed`.
- Loading state replaces the label with a 16px spinner in the foreground color, label hidden, button width preserved.
- Icon-only buttons are 40×40px (square) with the icon centered, same radius and states.

### Inputs

**Text (`input-text`).** `surface-raised` background, 1px Border Mist border, 4px radius, 40px height, 10×12px padding, `body-md` typography. Placeholder uses `on-surface-subtle`.

**Focus (`input-text-focus`).** Border swaps to `primary`. Adds a 2px outline in `primary-subtle` outside the border (no layout shift).

**Error (`input-text-error`).** Border swaps to `error`. Error message renders below in `body-sm` and `error` color, prefixed with `[err]` in JetBrains Mono.

**Disabled (`input-text-disabled`).** Background drops to `surface`. Text is `on-surface-subtle`. Cursor is `not-allowed`.

**Common rules.**
- Labels render above the input in `label-caps`, with 8px gap.
- Help text renders below in `body-sm` `on-surface-muted`.
- Inputs and their labels share the same `min-width` to align in form grids.

### Cards

**Default (`card-default`).** `surface-raised` background, 1px Border Mist hairline, 8px radius, 24px internal padding. Static — no hover effect.

**Interactive (`card-interactive`).** Adds hover state: background lifts to `surface-overlay`, border deepens to `border-strong`. Cursor is `pointer`. Used for clickable cards (e.g., dashboard tiles, doc index entries).

**Feature (`card-feature`).** Larger radius (12px), larger padding (32px). Used in marketing-page feature grids and onboarding hero cards. Maximum 3 per row on desktop, 1 per row on mobile.

### Navigation

**Nav link (`nav-link`).** Transparent background, `on-surface-muted` text, `body-md` typography, 4px radius, 8×12px padding. Hover lifts background to `surface-raised` and text to `on-surface`. Active state uses `primary-subtle` background and `primary` text.

**Top bar.** 64px height. Flexbox `space-between`. Wordmark left, nav center, primary CTA right. 1px bottom border in Border Mist at 50% alpha.

**Sidebar (docs / dashboard).** 240px width. `surface` background. 1px right border in Border Mist. Sections grouped with `label-caps` headings. 8px vertical spacing between links, 32px between sections.

### Chips & Tags

**Chip (`chip-default`).** Pill-shaped (`full` radius), `surface-raised` background, `on-surface-muted` text, `body-sm`. 24px height. Used for filter pills, tag clouds.

**Mint chip (`chip-mint`).** `primary-subtle` background, `primary` text. Used to mark active filters or "live" status pills.

**Protocol chip (`chip-protocol`).** **Signature MarkOS element.** Renders identifiers like `[F-105]`, `[v3.3.0]`, `[markos.run]`. JetBrains Mono `code-inline`, 4px radius (not full — squared distinguishes it from regular chips), `surface-raised` background, `primary` text, 2×6px padding. Used in docs, dashboard, and protocol references.

### Badges

State badges (`badge-success`, `badge-warning`, `badge-error`, `badge-info`) all share a structure: 12% alpha tint of the state color as background, full state color as text, `label-caps` typography, 2px radius, 2×6px padding. Used in tables and lists to mark row state.

**Text-on-tinted-surface rule.** On a 12% alpha tint of a state color, the text is the state color itself (e.g., `warning` text `#FFB800` on a `rgba(255, 184, 0, 0.12)` warning-tint surface). The `on-{state}` token (`on-warning`, `on-error`, `on-success`, `on-info`) is reserved for text on a **100% solid** state fill (e.g., a fully-amber primary button). Mistaking `on-warning` (`#0A0E14` Kernel Black) for the right text color on a warning-tint surface breaks the badge canon — the result is unreadable on dark surface and ambiguous on light surface. This same rule applies to `notice-{state}` banners, `chip-{state}` variants, and any future tinted-surface state primitive.

### Notice / Banner

`notice-{state}` component. Full-shell-width contextual banner — distinct from `toast-default` (transient floating notification). State variants prepend a 4px inline-start accent bar (`success`, `warning`, `error`, `info`); body uses the matching 12% alpha tint from the badge palette. Used for persistent ambient state (rotation grace windows, billing issues, verification-pending). Pairs with bracketed glyph (`[warn]`, `[err]`, `[info]`, `[ok]`) per Color blindness rule. No dismiss button by default — banner persists until the underlying state resolves. The `c-notice` primitive in `styles/components.css` is the implementation contract; settings, billing, sessions, and oauth surfaces compose `<div class="c-notice c-notice--{state}">` directly.

### Code surfaces

**Inline code (`code-inline`).** Wrapped in `surface-raised` chip with 4px radius and 4×6px padding. Used inside body text: `like this`. Always `code-inline` typography (14px JBM).

**Code block (`code-block`).** Full-bleed `surface` background (one shade darker than the surrounding card surface) with 6px radius and 24px padding. Always wrapped in a **terminal frame** (see below).

**Terminal frame (`terminal-frame`).** **Signature MarkOS element.** Decorative chrome around code blocks:

```
┌────────────────────────────────────────────────┐
│ ●  ●  ●          install.sh              [⧉]  │   ← 32px header
│ ────────────────────────────────────────────── │   ← 1px border
│                                                │
│  $ npx markos                                  │   ← code surface
│  resolving config...                           │
│  installed.                                    │
│                                                │
└────────────────────────────────────────────────┘
```

- 32px header in `surface-raised`, 1px Border Mist below.
- Three 12px circles in `on-surface-subtle` on the left (decorative, do not function).
- Filename centered in `body-sm` `on-surface-muted`.
- Copy button on the right (16px clipboard icon, hover reveals tooltip).
- Code area in `surface` (one shade darker than header), `code-block` typography, 24px padding, syntax-highlighted with the GitHub Dark token palette.

### Modal

`modal` component. 560px width default, `surface-overlay` background, 8px radius, 32px padding, modal elevation token. 24px gap between header (`h3`) and body, 32px gap between body and action row. Action row is right-aligned with secondary + primary button pair, 8px gap.

Backdrop: `surface` at 70% alpha with 4px backdrop-blur.

### Toast / Notification

`toast-default` component. 360px width, `surface-overlay` background, 6px radius, 16px padding. State variants prepend a colored 4px left bar (`success`, `warning`, `error`, `info`). Dismissal: auto after 5s for non-error, manual for error. Position: bottom-right, 24px from edge, stacked with 8px gap.

### Status dot

**Signature MarkOS element.** A 6px filled circle in a 12px hit area.

- `status-dot-live` — `primary` color, 2-second linear opacity pulse (1.0 → 0.4 → 1.0). The "kernel heartbeat."
- `status-dot-idle` — `on-surface-subtle`, no animation.
- `status-dot-error` — `error`, no animation.

Used in dashboards (next to running processes), in the docs site (next to live API endpoints), and in the wordmark's animated state (the `O` glyph's optional ring).

---

## Motion

MarkOS moves with **system-status precision**, not delight. Every motion communicates state.

### Durations

| Token | Value | Use |
| --- | --- | --- |
| `duration-instant` | 0ms | Color swaps that should not animate (focus state on keyboard nav) |
| `duration-fast` | 100ms | Micro-state transitions (hover background fill) |
| `duration-base` | 150ms | Most state transitions (button press, input focus) |
| `duration-slow` | 300ms | Modal/popover enter and exit |
| `duration-pulse` | 2000ms | Status dot heartbeat (linear, infinite) |

### Easing

- `ease-out` `cubic-bezier(0.2, 0, 0, 1)` — default for entries, hovers, presses. Decelerates into rest.
- `ease-in-out` `cubic-bezier(0.4, 0, 0.2, 1)` — for two-way transitions (modal open/close).
- `ease-linear` — only for the status-dot pulse and indeterminate spinners.

### Signature motion: the kernel heartbeat

The status dot's 2s opacity pulse is the **single signature animation** of the brand. Use it precisely — only when something is genuinely live or running. Decoratively pulsing dots elsewhere dilute the signal.

### The install completion (counter-motion)

When the CLI finishes installing, the success line `installed.` appears with **no animation**. The absence of motion is the celebration. We do not bounce checkmarks.

### Forbidden motion

- Parallax scroll on landing pages.
- Letter-by-letter typewriter reveals.
- Page transitions with 3D rotation, fold, or flip.
- Mouse-trail effects, cursor-following gradients.
- Lottie animations of any kind.
- Spring physics with overshoot or bounce.
- Hover-translate jiggle on nav links, buttons, cards, or chips (`transform: translateX(2px)`, `translateY(-1px)`, and similar positional shifts on `:hover`). Hover state is communicated via `background-color`, `border-color`, or `color` change only — never positional shift. The lone permitted motion-on-press is `.c-button:active { transform: translateY(1px) }` (a tactile press-down register, not a decorative jiggle, and bounded to the active state).

### `prefers-reduced-motion`

When `(prefers-reduced-motion: reduce)` is set, all motion durations collapse to `duration-instant` except the status-dot pulse, which freezes at full opacity. State transitions still occur — they are just immediate.

---

## Iconography

- **Library:** [Lucide](https://lucide.dev) is the default. [Phosphor Regular](https://phosphoricons.com) is the only allowed substitute when Lucide lacks a specific glyph.
- **Stroke:** 1.5px, no variation.
- **Fill:** none. Outline only. Override Amber filled triangles for warnings are the single exception.
- **Corners:** rounded at 1px terminus.
- **Color:** inherits `currentColor`. Active or selected uses `primary`.
- **Sizes:** `16px`, `20px`, `24px`, `32px`. No other sizes.
- **Touch targets:** even when the icon is 16px, the hit area is 40×40px minimum.

### Custom marks

- **Protocol bracket `[ ]`** — JetBrains Mono brackets used to denote protocol/version IDs in chips and prose. Color in `primary` when the reference is active, `on-surface-muted` when historical.
- **Vault chip** — 16×16 rounded-square mark with an inset folder shape, in `secondary`. Marks vault-sourced content.

### Forbidden

- Multicolor icons.
- Icons with gradients, drop shadows, or 3D depth.
- Mascot illustrations.
- "Cute" iconography (icons with faces, smiles, hand gestures).

---

## Accessibility

Accessibility is non-negotiable. The linter enforces WCAG 2.1 AA on token combinations; this section enforces the parts the linter cannot see.

### Contrast

- All `textColor` / `backgroundColor` pairs meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large/`h3`+).
- Hover and focus states preserve contrast — never drop below the source state's ratio.
- Override Amber on Kernel Black at 11.2:1 is AAA, but it is not used for body text — only labels and indicators.

### Focus

- Every interactive element has a visible focus ring: 2px solid `primary`, 2px offset.
- Focus is **never** suppressed via `outline: none` without replacement.
- Focus order follows DOM order. Skip-to-content link is the first focusable element on every page.

### Keyboard

- All interactive elements are reachable by `Tab`.
- All actions reachable by mouse are reachable by keyboard.
- The command palette opens with `Cmd-K` / `Ctrl-K`.
- Modals trap focus; `Esc` closes them.
- Toast notifications are announced to screen readers via `aria-live="polite"` (info, success) or `aria-live="assertive"` (error).

### Semantic HTML

- Use `<button>` for buttons, `<a>` for navigation. Never `<div onclick>`.
- Forms use `<label>` linked to inputs by `for=` / `id=`.
- Headings follow document order — never skip levels for visual purposes.
- Tables use `<th>` with `scope` attributes.

### Color blindness

State colors are **never the only signal**. Errors carry `[err]` text or an icon. Success carries `[ok]` or a check glyph. Do not rely on red/green alone.

**Bracketed-glyph state-coding canon (in-product UI).** The bracketed-glyph convention from CLI / Terminal output extends to in-product UI surfaces. State badges, notice banners, status banners, alerts, toast variants, and form-field validation messages pair the state color with a bracketed glyph prefix at the start of the leading sentence:

- `[ok]` for success
- `[warn]` for warning
- `[err]` for error
- `[info]` for info

The glyph is rendered in JetBrains Mono (`{fontFamily.mono}` / `var(--font-mono)`) when the surrounding type permits — body Inter still prefixes the bracketed text but the bracket characters themselves stay in mono for visual consistency with the CLI register. This makes state coding readable to color-blind users, in monochrome screenshots, and in screen-reader output without injecting hidden ARIA text. The glyph can be omitted only when the surface is paired with a non-color icon or graphical state indicator (e.g., a `status-dot-error` next to error text already carries the dual signal). The `.c-field__error::before { content: "[err] "; }` pattern in `styles/components.css` is the implementation reference; warning, info, and success companions follow the same pattern.

### Touch targets

44×44px minimum on mobile (Apple HIG), 40×40px on desktop. Inline links inside body text are exempt.

---

## Responsive Behavior

Mobile-first. Breakpoints map to common device classes; styles cascade upward.

### Breakpoints

| Token | min-width | Maps to |
| --- | --- | --- |
| `sm` | 640px | Phone landscape, narrow tablet |
| `md` | 768px | Tablet portrait — typography steps down here |
| `lg` | 1024px | Tablet landscape, small laptop |
| `xl` | 1280px | Desktop default container max |
| `xxl` | 1536px | Wide desktop |

### Type scale at `< md`

The entire scale steps down by one level:
- `display` → `h1`
- `h1` → `h2`
- `h2` → `h3`
- `h3` → `h4`
- `body-md` is unchanged (16px is the floor).

### Layout collapse

| Breakpoint | Grid behavior |
| --- | --- |
| `< sm` | Single column. Cards stack. Sidebar hidden, opened via hamburger. |
| `sm`–`md` | 2-column grid for feature cards. Sidebar slides over content. |
| `md`–`lg` | 3-column grid. Sidebar visible at 200px width. |
| `≥ lg` | Full 12-column grid. Sidebar at 240px. Container max 1280px. |

### Touch vs. pointer

- Hover states are present on all interactive components but never the **only** affordance. Active state is also visually distinct.
- On `(hover: none)` viewports, hover styles are suppressed; tap activates the pressed state directly.
- Click targets enlarge to 44×44 minimum on `(pointer: coarse)`.

### Container widths

| Context | Max width |
| --- | --- |
| Marketing page body | 1280px |
| Documentation prose | 720px (75ch reading max) |
| Dashboard panels | Fluid, no max |
| Modal | 560px |
| Toast | 360px |

---

## Surface-specific: CLI / Terminal output

The CLI is **the highest-impact brand surface MarkOS owns.** Every developer who installs encounters it before the dashboard, the docs, or the marketing site. Its tone is the first impression. The DESIGN.md tokens cover screen surfaces; this section covers the terminal.

### Color mapping (ANSI)

The CLI uses a constrained ANSI palette mapped to MarkOS tokens. Use [`chalk`](https://github.com/chalk/chalk) with these mappings:

| Token | ANSI 256 | True-color hex | Use |
| --- | --- | --- | --- |
| `primary` (mint) | 49 | `#00D9A3` | Brand highlights, CTAs in CLI prompts |
| `success` (green) | 41 | `#3FB950` | `installed.`, `migrated.`, exit-0 confirmations |
| `error` (red) | 203 | `#F85149` | `FATAL:` lines, exit-non-zero reports |
| `warning` (amber) | 214 | `#FFB800` | `WARN:` lines, deprecation notices |
| `info` (blue) | 75 | `#58A6FF` | Hyperlinks, doc references |
| `on-surface` (white) | 252 | `#E6EDF3` | Default body text |
| `on-surface-muted` (slate) | 244 | `#7B8DA6` | Secondary text, paths, metadata |
| `on-surface-subtle` (gray) | 240 | `#6B7785` | Comments, hints |

### Output rules

- **Default to silent on success.** A successful command prints what changed, in lowercase, and exits 0.
- **Color is meaning.** No color is used decoratively.
- **No emoji.** Ever. Not even ✓. Use bracketed glyphs: `[ok]`, `[err]`, `[warn]`, `[info]`.
- **No banners, no ASCII art splash, no welcome screens.** The first line of output is the user's first feedback.
- **Errors carry remediation.** Every error message ends with what to do next, in one sentence. Format: `FATAL: <what>. <action>. docs: <command-or-url>`.
- **Lowercase by default.** Status words (`installed`, `migrated`, `up to date`) are lowercase. Severity tags (`FATAL`, `WARN`) are uppercase.

### Exemplar successful run

```
$ npx markos
resolving config...
provisioning supabase: 14 tables, 3 views
registering upstash vector indexes: 4
writing vault: ./obsidian/ (47 files)
installed.
```

### Exemplar error

```
$ markos run campaign:weekly
FATAL: Linear API key missing.
Set LINEAR_API_KEY in .env, then re-run.
docs: markos doctor --explain linear-key
```

---

## Do's and Don'ts

### Do

- ✅ Default to dark. Light is a mode.
- ✅ Use Protocol Mint sparingly — one signal per primary view.
- ✅ Snap every dimension to the 8px grid.
- ✅ Pair JetBrains Mono headings with Inter body. No third typeface.
- ✅ Reserve at least 30% empty surface in every composition.
- ✅ Cite version, file, or row for every claim in product copy.
- ✅ Treat the user as a peer engineer, not a customer.
- ✅ Render code blocks in the terminal frame. Always.
- ✅ Use `prefers-reduced-motion` to respect user preferences.
- ✅ Lint the file with `npx @google/design.md lint DESIGN.md` before merging.

### Don't

- ❌ Pure black `#000000` — use `surface` `#0A0E14`.
- ❌ Mint as a fill color on surfaces larger than a button or chip.
- ❌ Cobalt-blue brand color (avoided by design).
- ❌ Gradients, mesh fills, soft glows, drop shadows on cards.
- ❌ Corporate Memphis illustrations or mascots of any kind.
- ❌ Stock photos of people anywhere.
- ❌ Emoji in CLI, error messages, or technical docs.
- ❌ Exclamation points in product surface copy.
- ❌ More than one primary button per primary view.
- ❌ Off-grid spacing (e.g., 18px, 40px, 50px) — always 8px multiples.
- ❌ Letter-by-letter typewriter text reveals.
- ❌ "Just" as a softener in copy ("just run this command").
- ❌ Banned lexicon: synergy, leverage, empower, unlock, transform, revolutionize, supercharge, holistic, seamless, cutting-edge, innovative, game-changer, next-generation, world-class, best-in-class, reimagine, disrupt.

---

## Agent prompt guide

This section helps AI coding agents (Claude Code, Cursor, Stitch, Windsurf, Kiro) generate on-brand UI without re-specifying tokens in every prompt.

### Quick color reference

```
Primary:       #00D9A3 Protocol Mint     CTAs, signal, focus rings
Secondary:     #7B8DA6 Vault Slate       chrome, secondary text, borders
Accent:        #FFB800 Override Amber    warnings, premium markers
Surface:       #0A0E14 Kernel Black      page background
Surface-up:    #1A1F2A Process Gray      cards, panels
Surface-over:  #242B38                   modals, popovers
Text-primary:  #E6EDF3 Terminal White    body and headings
Text-muted:    #7B8DA6 Vault Slate       secondary copy
Text-subtle:   #6B7785 Comment Gray      metadata, disabled
Success:       #3FB950
Error:         #F85149
Info:          #58A6FF
```

### Quick spec reference

```
Heading font:  JetBrains Mono (Bold/Semibold)
Body font:     Inter (Regular/Medium)
Type scale:    1.250 ratio, 16px base
Grid base:     8px (no arbitrary values)
Container:     1280px max
Default mode:  dark
Primary radius: 6px (buttons), 8px (cards), 12px (hero panels)
Focus ring:    2px solid #00D9A3, 2px offset
Motion:        150ms ease-out (default), 2s linear pulse (live status)
```

### Ready-to-use prompts

**For a landing-page hero:**
> Build a marketing hero following DESIGN.md. Background: surface (#0A0E14). Headline in JetBrains Mono Bold at h1 size, max 8 words. Subtitle in Inter Regular at lead size. One primary button (button-primary token). Underneath the button, a code block inside a terminal frame showing `npx markos`. Generous whitespace — at least 30% empty surface. Center the column horizontally, max 720px wide, but left-align the text inside it.

**For a dashboard card:**
> Build a dashboard card following DESIGN.md. card-default token: surface-raised background (#1A1F2A), 1px Border Mist hairline, 8px radius, 24px padding. Header is h3 JetBrains Mono Semibold. Body is body-md Inter. If status is live, include a status-dot-live (6px mint circle with 2s opacity pulse) before the title. If there's a metric, render it in display-size JetBrains Mono Bold with the unit in body-sm muted Inter underneath.

**For a form:**
> Build a form following DESIGN.md. Inputs use input-text token: surface-raised background, 1px Border Mist, 4px radius, 40px height. Labels above inputs in label-caps (10.24px Inter Semibold uppercase, 0.04em tracking), 8px gap to the input. Help text below in body-sm on-surface-muted. Submit button is button-primary, full-width on mobile, auto-width on desktop. Focus rings are 2px solid Protocol Mint with 2px offset.

**For a code-display section:**
> Render the code in a terminal frame following DESIGN.md. 32px header strip in surface-raised with three 12px Comment Gray dots on the left, filename centered in body-sm on-surface-muted, 16px copy icon on the right. 1px Border Mist divider. Code area in surface (one shade darker), code-block typography (14px JetBrains Mono, 1.65 line height), 24px padding, GitHub Dark syntax highlighting.

### When the agent is unsure

Default to:
- Dark surface (`#0A0E14`).
- One primary button maximum.
- 8px multiples for every dimension.
- 1px Border Mist hairlines instead of shadows.
- Maximum 75 characters per line of body copy.
- No emoji, no exclamation points.

If the design calls for a color outside the palette, **use `secondary` (Vault Slate) before inventing one.** If the design calls for a typeface outside JetBrains Mono / Inter, **use Inter.**

---

## Implementation

### Tailwind theme extension

Add to `tailwind.config.js`:

```js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:    { DEFAULT: '#00D9A3', hover: '#00C492', pressed: '#00B083', subtle: 'rgb(0 217 163 / 0.10)' },
        secondary:  { DEFAULT: '#7B8DA6', hover: '#8C9DB5' },
        accent:     { DEFAULT: '#FFB800', hover: '#FFC633' },
        surface:    { DEFAULT: '#0A0E14', raised: '#1A1F2A', overlay: '#242B38', inverse: '#F4F4F0' },
        border:     { DEFAULT: '#2D3441', strong: '#3A4250', subtle: 'rgb(45 52 65 / 0.40)' },
        on: {
          surface:        '#E6EDF3',
          'surface-muted':  '#7B8DA6',
          'surface-subtle': '#6B7785',
          primary:        '#0A0E14',
          accent:         '#0A0E14',
        },
        success: { DEFAULT: '#3FB950', hover: '#4ED561' },
        warning: { DEFAULT: '#FFB800', hover: '#FFC633' },
        error:   { DEFAULT: '#F85149', hover: '#FF6961' },
        info:    { DEFAULT: '#58A6FF', hover: '#79B8FF' },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Source Code Pro', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'display': ['3.052rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1':      ['2.441rem', { lineHeight: '1.10', letterSpacing: '-0.015em', fontWeight: '700' }],
        'h2':      ['1.953rem', { lineHeight: '1.20', letterSpacing: '-0.01em',  fontWeight: '600' }],
        'h3':      ['1.563rem', { lineHeight: '1.30', letterSpacing: '-0.005em', fontWeight: '600' }],
        'h4':      ['1.250rem', { lineHeight: '1.40', letterSpacing: '0',        fontWeight: '500' }],
        'lead':    ['1.250rem', { lineHeight: '1.50', letterSpacing: '-0.005em', fontWeight: '400' }],
        'body':    ['1.000rem', { lineHeight: '1.60', fontWeight: '400' }],
        'body-sm': ['0.800rem', { lineHeight: '1.50', letterSpacing: '0.01em',   fontWeight: '500' }],
        'label':   ['0.640rem', { lineHeight: '1.40', letterSpacing: '0.04em',   fontWeight: '600' }],
        'code':    ['0.875rem', { lineHeight: '1.50', fontWeight: '400' }],
      },
      spacing: {
        'xxs': '2px', 'xs': '8px',  'sm': '16px',
        'md':  '24px', 'lg': '32px', 'xl': '48px', 'xxl': '96px',
      },
      borderRadius: {
        xs: '2px', sm: '4px', md: '6px', lg: '8px', xl: '12px',
      },
      boxShadow: {
        raised:  '0 1px 0 0 #2D3441',
        card:    '0 1px 2px 0 rgba(0,0,0,0.35)',
        popover: '0 8px 24px -4px rgba(0,0,0,0.45), 0 0 0 1px #2D3441',
        modal:   '0 24px 64px -8px rgba(0,0,0,0.55), 0 0 0 1px #3A4250',
      },
      transitionDuration: {
        fast:  '100ms',
        base:  '150ms',
        slow:  '300ms',
        pulse: '2000ms',
      },
      transitionTimingFunction: {
        out:   'cubic-bezier(0.2, 0, 0, 1)',
        inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      screens: {
        sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
      },
      maxWidth: {
        prose:     '720px',
        container: '1280px',
        modal:     '560px',
        toast:     '360px',
      },
    },
  },
}
```

Or auto-generate via `npx @google/design.md export --format tailwind DESIGN.md > tailwind.theme.json`.

### CSS custom properties

For non-Tailwind environments, expose every token as a CSS variable on `:root`:

```css
:root {
  /* colors */
  --color-primary:           #00D9A3;
  --color-primary-hover:     #00C492;
  --color-primary-pressed:   #00B083;
  --color-primary-subtle:    rgb(0 217 163 / 0.10);
  --color-secondary:         #7B8DA6;
  --color-accent:            #FFB800;
  --color-surface:           #0A0E14;
  --color-surface-raised:    #1A1F2A;
  --color-surface-overlay:   #242B38;
  --color-border:            #2D3441;
  --color-on-surface:        #E6EDF3;
  --color-on-surface-muted:  #7B8DA6;
  --color-on-surface-subtle: #6B7785;
  --color-success:           #3FB950;
  --color-success-hover:     #4ED561;
  --color-warning:           #FFB800;
  --color-warning-hover:     #FFC633; /* aliased to --color-accent-hover per State · warning · aliased to accent */
  --color-error:             #F85149;
  --color-error-hover:       #FF6961;
  --color-info:              #58A6FF;
  --color-info-hover:        #79B8FF;
  /* On 12% alpha tinted state surfaces (badges, notice banners, chips), the text is the state color itself. */
  /* The on-{state} pair (e.g. --color-on-warning #0A0E14) is reserved for text on a 100% solid state fill. */

  /* spacing */
  --space-xxs: 2px;
  --space-xs:  8px;
  --space-sm:  16px;
  --space-md:  24px;
  --space-lg:  32px;
  --space-xl:  48px;
  --space-xxl: 96px;

  /* radii */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;

  /* typography */
  --font-mono: "JetBrains Mono", "Source Code Pro", Menlo, Consolas, monospace;
  --font-sans: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  /* motion */
  --duration-fast:  100ms;
  --duration-base:  150ms;
  --duration-slow:  300ms;
  --ease-out:       cubic-bezier(0.2, 0, 0, 1);

  /* elevation */
  --shadow-raised:  0 1px 0 0 var(--color-border);
  --shadow-card:    0 1px 2px 0 rgba(0,0,0,0.35);
  --shadow-popover: 0 8px 24px -4px rgba(0,0,0,0.45), 0 0 0 1px var(--color-border);
  --shadow-modal:   0 24px 64px -8px rgba(0,0,0,0.55), 0 0 0 1px var(--color-border-strong, #3A4250);
}

/* Light-mode override (when consumer opts in via [data-theme="light"]) */
[data-theme="light"] {
  --color-surface:           #F4F4F0;
  --color-surface-raised:    #FFFFFF;
  --color-on-surface:        #0A0E14;
  --color-border:            #D6D6D0;
  /* primary, accent, and state colors are unchanged across modes */
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-base: 0ms;
    --duration-slow: 0ms;
  }
}
```

### Validation workflow

1. **Lint on every commit:**
   ```bash
   npx @google/design.md lint DESIGN.md
   ```
   Pre-commit hook (`.husky/pre-commit` or `lefthook.yml`):
   ```bash
   npx @google/design.md lint DESIGN.md || exit 1
   ```

2. **Diff on every PR that touches `DESIGN.md`:**
   ```bash
   npx @google/design.md diff origin/main:DESIGN.md DESIGN.md
   ```
   The CI fails if `regression: true`.

3. **Re-export Tailwind / DTCG on token change:**
   ```bash
   npx @google/design.md export --format tailwind DESIGN.md > config/tailwind.theme.json
   npx @google/design.md export --format dtcg     DESIGN.md > config/tokens.json
   ```
   Both files are committed; drift between `DESIGN.md` and the exports is a CI failure.

4. **WCAG enforcement.** The `contrast-ratio` lint rule warns on component pairs below 4.5:1. We treat warnings as errors in CI for component tokens specifically.

### CI snippet (GitHub Actions)

```yaml
# .github/workflows/design-md.yml
name: DESIGN.md
on:
  pull_request:
    paths: [DESIGN.md, config/tailwind.theme.json, config/tokens.json]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npx @google/design.md lint DESIGN.md
      - run: |
          npx @google/design.md export --format tailwind DESIGN.md \
            | diff - config/tailwind.theme.json
      - run: |
          npx @google/design.md export --format dtcg DESIGN.md \
            | diff - config/tokens.json
```

---

## Versioning & maintenance

### Versioning

`DESIGN.md` follows Semantic Versioning, scoped to the design system:

- **MAJOR** — breaking token rename, removal of a public token, or change to the canonical color of a brand identity element.
- **MINOR** — new token (additive), new component, new variant.
- **PATCH** — value adjustment within an existing token (e.g., a hex tweak that preserves WCAG, a 1px padding refinement).

The `version` field in YAML front matter is the spec version (`alpha`, currently). The design-system version is tracked in `package.json` under `name: "@markos/design-system"` and in this file's git tags.

### Change process

1. Open an issue describing the proposed token change with rationale.
2. Open a PR. The PR template requires:
   - Diff output from `npx @google/design.md diff`.
   - WCAG impact assessment (any contrast change must pass 4.5:1).
   - Implementation impact assessment (which surfaces consume the token).
3. Reviewers: at least one design-system maintainer + one engineering reviewer.
4. On merge, the export files (`tailwind.theme.json`, `tokens.json`) are regenerated automatically by CI.

### Deprecation

Tokens are never deleted in a minor version. Mark deprecated tokens in this file with a `(deprecated)` suffix in the prose section and a `# DEPRECATED: <reason>. Removed in vX.0.0.` comment in the YAML. Removal happens in the next major.

---

## File metadata

| Field | Value |
| --- | --- |
| Spec version | `alpha` (per `@google/design.md` v0.1.0) |
| Design-system version | `1.1.0` |
| Last reviewed | 2026-04-28 |
| Owners | MarkOS design-system maintainers |
| Companions | `MarkOS_Brief_Maestro.md`, `MarkOS_Cheat_Sheet.md`, `AGENTS.md` |
| License | Apache-2.0 (this file's structure is per Google Labs spec) |

### Changelog

#### 1.1.0 — 2026-04-28 (Phase 213.1/213.2 amendment wave)

- **NEW component** `notice-{default,success,warning,error,info}` — full-shell-width contextual banner primitive (composes via `.c-notice` in `styles/components.css`). Distinct from `toast-default`. Used for persistent ambient state — rotation grace, billing issues, verification-pending, oauth-consent. Pairs with bracketed-glyph state coding.
- **NEW tokens** `colors.success-hover` `#4ED561`, `colors.warning-hover` `#FFC633` (aliased to `accent-hover`), `colors.error-hover` `#FF6961`, `colors.info-hover` `#79B8FF`. All AA on Kernel Black surface.
- **EXTENDED Forbidden motion** — explicit ban on hover-translate jiggle on nav links, buttons, cards, chips. Single permitted micro-motion: `.c-button:active { transform: translateY(1px) }` (tactile press register, not decorative).
- **EXTENDED Color blindness** — bracketed-glyph state-coding canon (`[ok]` / `[warn]` / `[err]` / `[info]`) applies in-product, not just CLI. State badges, notice banners, alerts, toasts, form-field validation messages all prefix the bracketed glyph.
- **EXTENDED Badges** — text-on-tinted-surface rule clarified: on a 12% state-tint surface, the text is the state color itself; `on-{state}` is reserved for solid 100% state fills only. Same rule applies to `notice-{state}` and `chip-{state}` variants.

Sourced from Phase 213.1 + 213.2 UI-SPEC amendment proposals (5 originally filed in `213.1-UI-SPEC.md`). Recommended landing before Phase 213.3 plan-phase per `gsd-ui-checker` Rec D so settings surfaces (billing, members, sessions, danger zone, mcp, plugins, webhooks) compose `.c-notice--warning` directly.

#### 1.0.0 — 2026-04-27

Initial canonical release.

---

*End of DESIGN.md.*
