<ui_patterns>

Visual reference for two distinct surfaces:

1. **GSD orchestrator CLI output** (banners, checkpoints, tables) — used by every `gsd-*` skill.
2. **MarkOS product UI** (web, dashboard, marketing, Storybook) — governed by `/DESIGN.md` (canonical).

When a GSD UI skill runs (`gsd-ui-phase`, `gsd-ui-review`, `gsd-plan-phase` for frontend phases, `gsd-execute-phase` touching `app/`/`components/`/`styles/`/`tokens/`), the assistant MUST read `/DESIGN.md` before producing artifacts. UI-SPEC.md and UI-REVIEW.md MUST cite token names from DESIGN.md by their canonical names (e.g. `color.primary`, `spacing.md`, `radius.lg`), never raw hex/px values.

---

# Section A · GSD Orchestrator CLI Patterns

Visual patterns for user-facing GSD output. Orchestrators @-reference this file.

## Stage Banners

Use for major workflow transitions.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► {STAGE NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Stage names (uppercase):**
- `QUESTIONING`
- `RESEARCHING`
- `DEFINING REQUIREMENTS`
- `CREATING ROADMAP`
- `PLANNING PHASE {N}`
- `EXECUTING WAVE {N}`
- `VERIFYING`
- `PHASE {N} COMPLETE ✓`
- `MILESTONE COMPLETE 🎉`

---

## Checkpoint Boxes

User action required. 62-character width.

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: {Type}                                          ║
╚══════════════════════════════════════════════════════════════╝

{Content}

──────────────────────────────────────────────────────────────
→ {ACTION PROMPT}
──────────────────────────────────────────────────────────────
```

**Types:**
- `CHECKPOINT: Verification Required` → `→ Type "approved" or describe issues`
- `CHECKPOINT: Decision Required` → `→ Select: option-a / option-b`
- `CHECKPOINT: Action Required` → `→ Type "done" when complete`

---

## Status Symbols

```
✓  Complete / Passed / Verified
✗  Failed / Missing / Blocked
◆  In Progress
○  Pending
⚡ Auto-approved
⚠  Warning
🎉 Milestone complete (only in banner)
```

---

## Progress Display

**Phase/milestone level:**
```
Progress: ████████░░ 80%
```

**Task level:**
```
Tasks: 2/4 complete
```

**Plan level:**
```
Plans: 3/5 complete
```

---

## Spawning Indicators

```
◆ Spawning researcher...

◆ Spawning 4 researchers in parallel...
  → Stack research
  → Features research
  → Architecture research
  → Pitfalls research

✓ Researcher complete: STACK.md written
```

---

## Next Up Block

Always at end of major completions.

```
───────────────────────────────────────────────────────────────

## ▶ Next Up

**{Identifier}: {Name}** — {one-line description}

`/clear` then:

`{copy-paste command}`

───────────────────────────────────────────────────────────────

**Also available:**
- `/gsd-alternative-1` — description
- `/gsd-alternative-2` — description

───────────────────────────────────────────────────────────────
```

---

## Error Box

```
╔══════════════════════════════════════════════════════════════╗
║  ERROR                                                       ║
╚══════════════════════════════════════════════════════════════╝

{Error description}

**To fix:** {Resolution steps}
```

---

## Tables

```
| Phase | Status | Plans | Progress |
|-------|--------|-------|----------|
| 1     | ✓      | 3/3   | 100%     |
| 2     | ◆      | 1/4   | 25%      |
| 3     | ○      | 0/2   | 0%       |
```

---

## Anti-Patterns (CLI)

- Varying box/banner widths
- Mixing banner styles (`===`, `---`, `***`)
- Skipping `GSD ►` prefix in banners
- Random emoji (`🚀`, `✨`, `💫`)
- Missing Next Up block after completions

---

# Section B · MarkOS Product Visual Canon (DESIGN.md)

The product UI — every pixel that ships in `app/`, `components/`, marketing site, docs site, Storybook — is governed by `/DESIGN.md`. This section is a pointer; do not duplicate token values here. Always read DESIGN.md and the generated artifacts.

## Canonical files

| File | Purpose |
|---|---|
| `/DESIGN.md` | **Canonical** spec: tokens, typography, components, motion, a11y, do/don't, agent prompt guide, Tailwind theme, CSS vars, CI |
| `/tokens/tokens.json` | W3C DTCG export (auto-generated) |
| `/tailwind.config.ts` | Tailwind theme (auto-generated) |
| `/app/tokens.css` | CSS custom properties on `:root` (+ light theme + reduced motion + forced-colors) |
| `/app/globals.css` | Reset, base typography, focus ring, container, section rhythm |
| `/styles/components.css` | Primitives: button, input, card, nav, chip, badge, code, terminal, modal, toast, status-dot |
| `/tokens/index.ts` | TypeScript-typed token export |

Drift between DESIGN.md and any artifact is a CI failure. Edit DESIGN.md, re-export, commit both.

## Mandatory pre-flight (any UI/CSS/Tailwind/Storybook work)

Before authoring or reviewing UI:

1. Read `/DESIGN.md` (or query specific section: Colors / Typography / Layout / Components / Motion / Accessibility).
2. Verify the values you plan to use exist as tokens. If not, STOP — propose a DESIGN.md amendment, do not invent off-token values.
3. Cite token names (not raw values) in UI-SPEC.md, plan acceptance criteria, and code comments where the token isn't obvious from the variable name.

## Non-negotiable rules (summary; full rationale in DESIGN.md)

- **Default dark.** `--color-surface: #0A0E14`. Never `#000000`.
- **Single signal.** `--color-primary: #00D9A3` is the only CTA / focus color. <5% of composition. Never as a large-surface fill.
- **Two typefaces only.** JetBrains Mono + Inter. No third.
- **8px grid.** Every dimension is 0 / 2 / 8 / 16 / 24 / 32 / 48 / 96. Off-grid values are bugs (e.g., 18px → use 16 or 24).
- **Borders over shadows on dark.** 1px `--color-border` hairline. Shadows reserved for popover / modal / toast.
- **Focus ring.** `2px solid --color-primary`, `2px` offset. Never `outline: none` without replacement.
- **WCAG 2.1 AA minimum.** AAA on body text + primary tokens. State color is never the only signal — pair with `[ok]`/`[err]`/`[warn]` text or icon.
- **Whitespace as primitive.** ≥30% empty surface in every composition.
- **Motion.** Default `--duration-base: 150ms` `--ease-out`. Modal `--duration-slow`. Status-dot pulse `--duration-pulse: 2000ms` linear infinite — the **only** signature animation. `prefers-reduced-motion` collapses to 0ms; pulse freezes at full opacity.
- **Forbidden.** Pure black, pure white outside light-mode raised surfaces, cobalt-blue brand color, gradients, mesh fills, soft glows, drop shadows on cards, Corporate Memphis illustrations, mascots, stock photos of people, emoji in product/CLI/docs, exclamation points in product copy, more than one primary button per primary view, Lottie, parallax, typewriter reveals.
- **Banned lexicon (UI labels + CLI strings + product copy):** `synergy, leverage, empower, unlock, transform, revolutionize, supercharge, holistic, seamless, cutting-edge, innovative, game-changer, next-generation, world-class, best-in-class, reimagine, disrupt`, and `just` as a softener.

## Quick token reference (cheat-sheet — DESIGN.md is authoritative)

```
Colors
  primary       #00D9A3   Protocol Mint     CTAs, signal, focus rings
  secondary     #7B8DA6   Vault Slate       chrome, secondary text, borders
  accent        #FFB800   Override Amber    warnings, override, premium markers
  surface       #0A0E14   Kernel Black      page background
  surface-raised #1A1F2A  Process Gray      cards, panels
  surface-overlay #242B38                   modals, popovers
  on-surface    #E6EDF3   Terminal White    body + headings
  on-surface-muted #7B8DA6                  secondary copy
  on-surface-subtle #6B7785                 metadata, disabled
  success #3FB950 · warning #FFB800 · error #F85149 · info #58A6FF

Typography (1.250 ratio, 16px base)
  display 3.052rem · h1 2.441 · h2 1.953 · h3 1.563 · h4 1.250
  lead 1.250 · body-md 1.000 · body-sm 0.800 · label 0.640 · code 0.875
  Headings: JetBrains Mono Bold/Semibold · Body: Inter Regular/Medium
  Step down one level at < md (768px). body-md is the floor.

Spacing (8px grid)
  none 0 · xxs 2 · xs 8 · sm 16 · md 24 · lg 32 · xl 48 · xxl 96

Radii
  xs 2 · sm 4 · md 6 (buttons) · lg 8 (cards) · xl 12 (hero) · full 9999

Motion
  fast 100 · base 150 · slow 300 · pulse 2000 (linear)
  ease-out cubic-bezier(0.2, 0, 0, 1) · ease-in-out cubic-bezier(0.4, 0, 0.2, 1)

Containers
  prose 720 · container 1280 · modal 560 · toast 360
```

## Component primitives (CSS classes in `styles/components.css`)

| Class | Component | DESIGN.md token |
|---|---|---|
| `.c-button.c-button--primary` | Primary button | `button-primary` |
| `.c-button.c-button--secondary` | Secondary button | `button-secondary` |
| `.c-button.c-button--tertiary` | Tertiary button | `button-tertiary` |
| `.c-button.c-button--destructive` | Destructive button | `button-destructive` |
| `.c-input` + `.c-field` | Text input + label/help/error | `input-text` |
| `.c-card`, `.c-card--interactive`, `.c-card--feature` | Card variants | `card-default`, `card-interactive`, `card-feature` |
| `.c-nav-link`, `.c-topbar`, `.c-sidebar` | Navigation | `nav-link` |
| `.c-chip`, `.c-chip--mint`, `.c-chip-protocol` | Chip variants (incl. signature `[F-105]`) | `chip-default`, `chip-mint`, `chip-protocol` |
| `.c-badge--{success,warning,error,info}` | State badge | `badge-{state}` |
| `.c-code-inline`, `.c-code-block`, `.c-terminal` | Code surfaces incl. signature terminal frame | `code-inline`, `code-block`, `terminal-frame` |
| `.c-backdrop` + `.c-modal` | Modal | `modal` |
| `.c-toast` + `.c-toast-region` | Toast | `toast-default` |
| `.c-status-dot--{live,idle,error}` | Signature status dot (kernel heartbeat) | `status-dot-{state}` |
| `.c-popover` | Popover | (composed) |

## CLI output rules (apply DESIGN.md "Surface-specific: CLI / Terminal output" section)

The MarkOS CLI is a brand surface. ANSI palette mapped to tokens; no banners, no ASCII art, no emoji (use `[ok]`, `[err]`, `[warn]`, `[info]`). Default to silent on success. Errors carry remediation. Status words lowercase (`installed`, `migrated`); severity tags uppercase (`FATAL`, `WARN`).

## Skill integration enforcement

`gsd-ui-phase`, `gsd-ui-review`, and any GSD UI/frontend planning or execution flow MUST:

1. Load `/DESIGN.md` into the researcher/planner/executor subagent context (via @-ref or Read).
2. BLOCK the wave/checkpoint when off-token values appear in candidate UI-SPEC.md, plans, or code.
3. FAIL UI-REVIEW.md Pillar 1 (Tokens) if any committed value bypasses the token system.
4. Treat `prefers-reduced-motion`, focus rings, and contrast as Pillar checks (not nice-to-have).

## Anti-patterns (Product UI)

- Inline hex/RGB/px values where a token exists.
- Inventing a new color, radius, or spacing instead of amending DESIGN.md.
- Pure black `#000000`, cobalt-blue brand color, gradients, drop shadows on cards.
- More than one primary button per primary view.
- Off-grid spacing (e.g., 18, 40, 50).
- Emoji, exclamation points, banned lexicon in product copy.
- Suppressing focus rings without replacement.

</ui_patterns>
