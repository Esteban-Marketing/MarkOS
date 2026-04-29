## MarkOS agent boot (read first)

1. **`.protocol-lore/QUICKSTART.md`** — mandatory entry: search order, commands, GSD vs MarkOS, boundaries.
2. **`.protocol-lore/INDEX.md`** — condensed map of protocol-lore files and links to key implementation files.
3. **`.planning/STATE.md`** — **canonical** GSD mission state (milestone, phase, next actions). Do not use `.protocol-lore/STATE.md` as live state (it only routes here).
4. **`.agent/markos/MARKOS-INDEX.md`** — MarkOS protocol registry (paths, ITM tokens, workflows).
5. **`DESIGN.md`** — **canonical visual design contract** (tokens, typography, components, motion, accessibility). Any UI/CSS/style/Tailwind/Storybook work MUST cite tokens defined here. See "Visual Design Canon" below.

**Split:** **GSD** = engineering methodology under `.agent/get-shit-done/` (skills often `gsd-*`, drives `.planning/`). **MarkOS** = marketing protocol under `.agent/markos/` (skills under `.agent/skills/markos-*`). Client overrides live only under **`.markos-local/`** (never `.mgsd-local`).

**CLI / tests:** primary install/update via **`npx markos`** (see `package.json` `bin`). Run tests with **`npm test`** or **`node --test test/**/*.test.js`**. Local onboarding UI: **`node onboarding/backend/server.cjs`** (port from `onboarding/onboarding-config.json`).

## Source-of-truth precedence (conflict resolution)

When the Obsidian vault, `.planning/`, `.agent/markos/`, and `obsidian/work/incoming/` disagree, resolve in this order:

1. **Product doctrine (WHAT we build):** `obsidian/brain/*.md` wins. Canonical: `Pricing Engine Canon.md`, `SaaS Suite Canon.md`, `SaaS Marketing OS Strategy Canon.md`, `Marketing Operating System Foundation.md`, `MarkOS Canon.md`, `Brand Stance.md`, `Target ICP.md`.
2. **Product spec (HOW objects/flows are shaped):** `obsidian/reference/*.md` wins. Canonical: `MarkOS v2 Operating Loop Spec.md`, `MarkOS v2 Requirements Traceability Matrix.md`, `Contracts Registry.md`, `Database Schema.md`, `Core Lib.md`, `HTTP Layer.md`, `UI Components.md`.
3. **Visual design contract (HOW pixels are shaped):** `DESIGN.md` (repo root) wins for tokens, typography, components, motion, a11y. `obsidian/reference/UI Components.md` describes the React component tree; `DESIGN.md` describes the visual primitives those components render. Generated artifacts (`tokens/tokens.json`, `tailwind.config.ts`, `app/tokens.css`, `app/globals.css`, `styles/components.css`, `tokens/index.ts`) are derived from `DESIGN.md` — drift is a CI failure; never edit derivatives in lieu of `DESIGN.md`.
4. **Engineering execution state (WHEN / IN WHICH PHASE):** `.planning/` wins. Canonical: `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, phase dirs under `.planning/phases/`.
5. **Protocol registry (marketing agents / tokens / ITMs):** `.agent/markos/MARKOS-INDEX.md` wins for TOKEN_ID → file mapping.
6. **Raw input (not canonical until distilled):** `obsidian/work/incoming/*.md` is RAW intake. It is NOT canonical until a corresponding `obsidian/brain/*.md` canon or `obsidian/reference/*.md` spec is written to distill it. Never cite incoming docs as doctrine without the vault brain/reference step.
7. **Client overrides:** `.markos-local/**/*` wins over `.agent/markos/templates/**/*` for that client's context. Log `[override]` when a local file wins.

**Drift rule:** if `.planning/` appears to contradict vault brain/reference (e.g., a plan states a schema field that contradicts `MarkOS v2 Operating Loop Spec.md`), STOP and flag. Do not silently reconcile in either direction; escalate the conflict to the user. The canon wins for product shape, the plan wins for execution sequencing — both must agree before execution.

**Placeholder rule:** unresolved pricing/packaging/usage/billing copy uses `{{MARKOS_PRICING_ENGINE_PENDING}}` until an approved `PricingRecommendation` exists (per `obsidian/brain/Pricing Engine Canon.md`).

---

## Visual Design Canon — DESIGN.md

`DESIGN.md` (repo root) is the single source of truth for every visual decision in MarkOS surfaces — CLI, marketing site, documentation, dashboard, presentations, Storybook, AI-generated UI. It lints against the Google Labs `@google/design.md` spec and is the upstream of the generated artifacts listed above.

### When to read DESIGN.md (mandatory)

Before *any* of the following, read or query `DESIGN.md`:
- Editing files under `app/`, `components/`, `stories/`, `.storybook/`, `styles/`, `tokens/`, `tailwind.config.*`, `app/globals.css`, `app/tokens.css`, `*.module.css`.
- Authoring or reviewing UI-SPEC.md / UI-REVIEW.md (GSD UI workflows).
- Generating any HTML/JSX/TSX with inline styles, class names, or Tailwind utilities.
- Choosing colors, fonts, sizes, radii, spacing, shadows, motion, breakpoints, or focus styles.
- Writing CLI output (color, glyph, severity formatting).
- Creating Storybook stories or Chromatic snapshots.

### Non-negotiable rules (summary — full rationale in DESIGN.md)

- **Default dark.** Surface is `#0A0E14` (Kernel Black). Never `#000000`.
- **One signal.** Protocol Mint `#00D9A3` is the single CTA / focus color. <5% of any composition. Never as a fill on surfaces larger than a button or chip.
- **Two typefaces.** JetBrains Mono (display + headings + code) + Inter (body + UI). No third.
- **8px grid.** Every dimension snaps to 0/2/8/16/24/32/48/96. Off-grid values are bugs.
- **Borders over shadows.** 1px Border Mist `#2D3441` hairline on dark beats a soft shadow. Shadows reserved for popover/modal/toast.
- **WCAG 2.1 AA minimum.** Focus rings are 2px solid `#00D9A3` with 2px offset, never suppressed. State color is never the only signal — pair with `[ok]`/`[err]`/`[warn]` text or icon.
- **Whitespace as primitive.** ≥30% empty surface in every composition.
- **No emoji** in product UI, CLI, error messages, or technical docs. Use bracketed glyphs.
- **No gradients, no glow, no soft shadows on cards, no Lottie, no parallax, no typewriter reveals.**
- **`prefers-reduced-motion`** collapses durations to 0ms; the kernel-pulse status dot freezes at full opacity.

### Generated artifacts (do not hand-edit)

| Artifact | Purpose | Regenerate |
|---|---|---|
| `tokens/tokens.json` | W3C DTCG export for design tools | `npx @google/design.md export --format dtcg DESIGN.md > tokens/tokens.json` |
| `tailwind.config.ts` | Tailwind theme (`darkMode: 'class'`) | `npx @google/design.md export --format tailwind DESIGN.md` |
| `app/tokens.css` | CSS custom properties on `:root` | hand-mirror; verify against DESIGN.md |
| `app/globals.css` | Reset + base typography + focus + container + reduced-motion | composes tokens |
| `styles/components.css` | Component primitives (button, input, card, terminal-frame, status-dot, modal, toast, badge, chip) | composes tokens |
| `tokens/index.ts` | TypeScript-typed token export for JS-driven theming | mirror DESIGN.md |

### Banned lexicon (product copy + UI labels + CLI strings)

`synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt`, `just` (as softener). No exclamation points in product surface copy.

### Skill / workflow integration

The following GSD skills consume `DESIGN.md` as design canon:
- `/gsd-ui-phase` — produces `UI-SPEC.md`. Researcher MUST cite DESIGN.md token names; checker BLOCKs on off-token values.
- `/gsd-ui-review` — produces `UI-REVIEW.md`. 6-pillar audit treats DESIGN.md compliance as Pillar 1 (Tokens) — non-compliance is automatic FAIL.
- `/gsd-plan-phase` for any frontend phase — phase plan must list DESIGN.md as a Required Reading entry and reference token names in acceptance criteria.
- `/gsd-execute-phase` — executor must run `npx @google/design.md lint DESIGN.md` after token-touching tasks; failure blocks the wave.

For non-GSD UI work (frontend-design, vercel:shadcn, superpowers:brainstorming on UI features), the assistant MUST read DESIGN.md before generating any markup or styles.

### Lint / CI workflow

- Pre-commit: `npx @google/design.md lint DESIGN.md`
- PR diff: `npx @google/design.md diff origin/main:DESIGN.md DESIGN.md`
- Token export drift: `npx @google/design.md export --format tailwind DESIGN.md | diff - tailwind.config.ts.json`

See `DESIGN.md > Implementation > CI snippet` for the full GitHub Actions workflow.

### Companions

- `MarkOS_Brief_Maestro.md` — brand identity, voice, applications.
- `MarkOS_Cheat_Sheet.md` — one-page spec card.
- `AGENTS.md` (root) — engineering conventions for non-Claude coding agents.
- `obsidian/reference/UI Components.md` — React component tree, store layout, props patterns.
- `.protocol-lore/UI-CANON.md` — protocol-lore pointer back to this section.
