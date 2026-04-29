## MarkOS agent boot (read first)

1. **`.protocol-lore/QUICKSTART.md`** — mandatory entry: search order, commands, GSD vs MarkOS, boundaries.
2. **`.protocol-lore/INDEX.md`** — condensed map of protocol-lore files and links to key implementation files.
3. **`.planning/STATE.md`** — **canonical** GSD mission state (milestone, phase, next actions). Do not use `.protocol-lore/STATE.md` as live state (it only routes here).
4. **`.agent/markos/MARKOS-INDEX.md`** — MarkOS protocol registry (paths, ITM tokens, workflows).
5. **`DESIGN.md`** — **canonical visual design contract** (tokens, typography, components, motion, accessibility). Required reading for any UI/CSS/style/Tailwind/Storybook work.

**Split:** **GSD** = engineering methodology under `.agent/get-shit-done/` (skills often `gsd-*`, drives `.planning/`). **MarkOS** = marketing protocol under `.agent/markos/` (skills under `.agent/skills/markos-*`). Client overrides live only under **`.markos-local/`** (never `.mgsd-local`).

**CLI / tests:** primary install/update via **`npx markos`** (see `package.json` `bin`). Run tests with **`npm test`** or **`node --test test/**/*.test.js`**. Local onboarding UI: **`node onboarding/backend/server.cjs`** (port from `onboarding/onboarding-config.json`).

---

## Visual Design Canon — DESIGN.md (mandatory before any UI work)

`/DESIGN.md` is the single source of truth for tokens, typography, components, motion, and accessibility. The full integration rules (when to read, generated artifacts, banned lexicon, CI workflow, skill integration) live in `CLAUDE.md > Visual Design Canon`. Non-Claude agents (Cursor, Codex, Windsurf, Kiro, Stitch) MUST treat that section as authoritative.

### Quick rules

- Default dark · `surface = #0A0E14`. Never `#000000`.
- Single signal · `primary = #00D9A3` (Protocol Mint). <5% of composition. Never as a large-surface fill.
- Two typefaces · JetBrains Mono (display/headings/code) + Inter (body/UI). No third.
- 8px grid · 0/2/8/16/24/32/48/96. Off-grid is a bug.
- Borders over shadows on dark · 1px `#2D3441` hairline.
- Focus ring · 2px solid `#00D9A3`, 2px offset. Never suppressed.
- WCAG 2.1 AA minimum, AAA on body text and primary tokens.
- No emoji, no gradients, no glow, no Lottie, no parallax. `prefers-reduced-motion` collapses to 0ms (kernel-pulse freezes).

### Generated artifacts (do not hand-edit)

`tokens/tokens.json` (DTCG) · `tailwind.config.ts` · `app/tokens.css` · `app/globals.css` · `styles/components.css` · `tokens/index.ts`. Drift from DESIGN.md is a CI failure — re-export with `npx @google/design.md export ...`.

### Companions

`MarkOS_Brief_Maestro.md` (voice/brand) · `MarkOS_Cheat_Sheet.md` (one-pager) · `obsidian/reference/UI Components.md` (React component tree).
