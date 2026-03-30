## MarkOS agent boot (read first)

1. **`.protocol-lore/QUICKSTART.md`** — mandatory entry: search order, commands, GSD vs MarkOS, boundaries.
2. **`.protocol-lore/INDEX.md`** — condensed map of protocol-lore files and links to key implementation files.
3. **`.planning/STATE.md`** — **canonical** GSD mission state (milestone, phase, next actions). Do not use `.protocol-lore/STATE.md` as live state (it only routes here).
4. **`.agent/markos/MARKOS-INDEX.md`** — MarkOS protocol registry (paths, ITM tokens, workflows).

**Split:** **GSD** = engineering methodology under `.agent/get-shit-done/` (skills often `gsd-*`, drives `.planning/`). **MarkOS** = marketing protocol under `.agent/markos/` (skills under `.agent/skills/markos-*`). Client overrides live only under **`.markos-local/`** (never `.mgsd-local`).

**CLI / tests:** primary install/update via **`npx markos`** (see `package.json` `bin`). Run tests with **`npm test`** or **`node --test test/**/*.test.js`**. Local onboarding UI: **`node onboarding/backend/server.cjs`** (port from `onboarding/onboarding-config.json`).
