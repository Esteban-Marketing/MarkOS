# MarkOS Agent Quickstart (AGENT-BOOT)

> [!IMPORTANT]
> Mandatory first-read for all MarkOS sessions. If context is low or this is a **new** session, read this file immediately.

## 1. Context search priority

If you are lost or memory is sparse, follow this order:

1. **This file** — [`.protocol-lore/QUICKSTART.md`](QUICKSTART.md) (entry point)
2. [`.protocol-lore/INDEX.md`](INDEX.md) — architecture and lore map
3. **[`.planning/STATE.md`](../.planning/STATE.md)** — **canonical** mission progress, milestone, phase, and next actions (GSD)
4. [`.agent/markos/MARKOS-INDEX.md`](../.agent/markos/MARKOS-INDEX.md) — full token registry for the MarkOS protocol

Do not treat [`.protocol-lore/STATE.md`](STATE.md) as live state; it routes to `.planning/STATE.md`.

## 2. Methodology split

| Layer | Role |
|-------|------|
| **GSD** | Engineering workflow under `.agent/get-shit-done/` — Cursor skills `gsd-*`, phases, `.planning/`. |
| **MarkOS** | Marketing OS protocol under `.agent/markos/` — skills in `.agent/skills/markos-*`, MIR/MSP/ITM. |
| **Local overrides** | `.markos-local/` only (gitignored). No `.mgsd-local`. |

## 3. High-frequency commands (MarkOS skills)

These map to `.agent/skills/markos-*/SKILL.md` and workflows under `.agent/markos/workflows/`.

| Command | Purpose | When to use |
|---------|---------|-------------|
| `markos-progress` | Dashboard and next action | Start of a work turn |
| `markos-plan-phase` | Create or refine `PLAN.md` | When `.planning/STATE.md` shows a new phase |
| `markos-execute-phase` | Run planned tasks | After plan approval |
| `markos-verify-work` | Post-execution audit | After execution |
| `markos-health` | Structural health / broken links | Periodically |

## 4. Boundary definitions

- **MIR** — Marketing Intelligence Repository: ground truth (brand, audience, product).
- **MSP** — Marketing Strategy Plan: channel and campaign blueprints.
- **ITM** — Issue Task Templates: Linear-oriented task specs under `.agent/markos/templates/LINEAR-TASKS/` (`MARKOS-ITM-*`).

## 5. Human-AI handoff (DEFCON)

- AI owns execution unless a task is tagged `[HUMAN]`.
- On failure, see [`.protocol-lore/DEFCON.md`](DEFCON.md).
- Prefer atomic commits before escalating to a human.

## 6. Overrides

Resolve `.markos-local/` before `.agent/markos/templates/`. Log `[override]` when a local file wins.

## 7. Key files

| File | Purpose |
|------|---------|
| `bin/install.cjs` | First-run installer; writes `.markos-install-manifest.json` |
| `bin/update.cjs` | Idempotent updater (SHA256-aware) |
| `bin/ensure-vector.cjs` | Vector providers bootstrap |
| `onboarding/backend/server.cjs` | HTTP server: GET `/`, `/config`, `/status`; POST `/submit`, `/approve`, `/regenerate`, etc. |
| `onboarding/backend/agents/orchestrator.cjs` | LLM draft orchestration; vector persistence |
| `onboarding/backend/agents/mir-filler.cjs` | MIR drafts |
| `onboarding/backend/agents/msp-filler.cjs` | MSP drafts |
| `onboarding/backend/agents/llm-adapter.cjs` | OpenAI / Anthropic / Gemini wrapper |
| `onboarding/backend/write-mir.cjs` | JIT template clone, fuzzy merge, planning state updates |
| `onboarding/backend/vector-store-client.cjs` | Supabase + Upstash Vector client |
| `.markos-project.json` | Project slug and namespace root |
| `.markos-local/MIR/` | Client MIR (not committed) |
| `.protocol-lore/CODEBASE-MAP.md` | Directory tree for navigation |

## 8. Cheat sheet

```bash
# Onboarding UI (local)
node onboarding/backend/server.cjs
# Then open http://localhost:4242 (or the port in onboarding-config.json)

# Tests (matches package.json "test" script)
npm test
# or: node --test test/**/*.test.js

# Vector health
node bin/ensure-vector.cjs

# Project slug
type .markos-project.json   # Windows
# cat .markos-project.json   # Unix

# Client MIR overrides (if present)
dir .markos-local\MIR        # Windows
# ls .markos-local/MIR       # Unix
```
