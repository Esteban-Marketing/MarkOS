## MarkOS agent boot (read first)

1. **`.protocol-lore/QUICKSTART.md`** — mandatory entry: search order, commands, GSD vs MarkOS, boundaries.
2. **`.protocol-lore/INDEX.md`** — condensed map of protocol-lore files and links to key implementation files.
3. **`.planning/STATE.md`** — **canonical** GSD mission state (milestone, phase, next actions). Do not use `.protocol-lore/STATE.md` as live state (it only routes here).
4. **`.agent/markos/MARKOS-INDEX.md`** — MarkOS protocol registry (paths, ITM tokens, workflows).

**Split:** **GSD** = engineering methodology under `.agent/get-shit-done/` (skills often `gsd-*`, drives `.planning/`). **MarkOS** = marketing protocol under `.agent/markos/` (skills under `.agent/skills/markos-*`). Client overrides live only under **`.markos-local/`** (never `.mgsd-local`).

**CLI / tests:** primary install/update via **`npx markos`** (see `package.json` `bin`). Run tests with **`npm test`** or **`node --test test/**/*.test.js`**. Local onboarding UI: **`node onboarding/backend/server.cjs`** (port from `onboarding/onboarding-config.json`).

## Source-of-truth precedence (conflict resolution)

When the Obsidian vault, `.planning/`, `.agent/markos/`, and `obsidian/work/incoming/` disagree, resolve in this order:

1. **Product doctrine (WHAT we build):** `obsidian/brain/*.md` wins. Canonical: `Pricing Engine Canon.md`, `SaaS Suite Canon.md`, `SaaS Marketing OS Strategy Canon.md`, `Marketing Operating System Foundation.md`, `MarkOS Canon.md`, `Brand Stance.md`, `Target ICP.md`.
2. **Product spec (HOW objects/flows are shaped):** `obsidian/reference/*.md` wins. Canonical: `MarkOS v2 Operating Loop Spec.md`, `MarkOS v2 Requirements Traceability Matrix.md`, `Contracts Registry.md`, `Database Schema.md`, `Core Lib.md`, `HTTP Layer.md`, `UI Components.md`.
3. **Engineering execution state (WHEN / IN WHICH PHASE):** `.planning/` wins. Canonical: `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, phase dirs under `.planning/phases/`.
4. **Protocol registry (marketing agents / tokens / ITMs):** `.agent/markos/MARKOS-INDEX.md` wins for TOKEN_ID → file mapping.
5. **Raw input (not canonical until distilled):** `obsidian/work/incoming/*.md` is RAW intake. It is NOT canonical until a corresponding `obsidian/brain/*.md` canon or `obsidian/reference/*.md` spec is written to distill it. Never cite incoming docs as doctrine without the vault brain/reference step.
6. **Client overrides:** `.markos-local/**/*` wins over `.agent/markos/templates/**/*` for that client's context. Log `[override]` when a local file wins.

**Drift rule:** if `.planning/` appears to contradict vault brain/reference (e.g., a plan states a schema field that contradicts `MarkOS v2 Operating Loop Spec.md`), STOP and flag. Do not silently reconcile in either direction; escalate the conflict to the user. The canon wins for product shape, the plan wins for execution sequencing — both must agree before execution.

**Placeholder rule:** unresolved pricing/packaging/usage/billing copy uses `{{MARKOS_PRICING_ENGINE_PENDING}}` until an approved `PricingRecommendation` exists (per `obsidian/brain/Pricing Engine Canon.md`).
