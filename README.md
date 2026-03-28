# MarkOS — Marketing Operating System

[![npm](https://img.shields.io/npm/v/markos)](https://www.npmjs.com/package/markos)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Marketing, structured.

You've tried prompting your way to a marketing strategy. It doesn't work without structure.

**MarkOS is the missing operating system** — protocol-grade marketing infrastructure for AI-ready teams, installed in one command.

```bash
npx markos install
```

---

## What Is a Marketing OS?

Most AI marketing tools give you outputs. MarkOS gives you a system.

| Without MarkOS | With MarkOS |
|---|---|
| Prompt → hope for consistency | Protocol → always on-brand |
| Scattered docs and Notion pages | Structured MIR intelligence layer |
| Different agents, no shared context | ChromaDB memory + override resolution |
| Re-explain your brand every session | One-command deploy, persistent context |

**MarkOS is not a writing tool.** It's the structured infrastructure that makes AI marketing agents effective.

---

## Install

In ~60 seconds you get:
- `.agent/marketing-get-shit-done/` — the protocol engine during the v2.1 compatibility window
- `.planning/MIR/` — 78-file Marketing Intelligence Repository (brand, audience, competitive)
- `.planning/MSP/` — 80-file Marketing Strategy Plan (channels, campaigns, budgets)
- `.protocol-lore/` — AI agent navigation knowledge base
- A web onboarding form to fill your brand intelligence

```bash
# Update when new protocol versions ship:
npx markos update

# Run the onboarding form to fill your brand intelligence:
node onboarding/backend/server.cjs
# Then open http://localhost:4242
```

---

## Three Layers

```text
MIR  (Marketing Intelligence Repository)
  └─ Brand voice, audience profiles, competitive landscape, product facts
     Ground truth. Never generated without approval. You own this.

MSP  (Marketing Strategy Plan)
  └─ Channel strategy, campaign blueprints, KPI frameworks
     Derived from MIR. Executable by AI agents.

ITM  (Issue Task Templates)
  └─ Pre-baked Linear.app tickets for every common marketing job
     Drop into your project management system. Run.
```

---

## Agents

These are the current protocol agent IDs. Their `mgsd-*` names remain in place during the compatibility window while MarkOS is the primary product identity.

| Agent | What It Does |
|-------|-------------|
| `mgsd-strategist` | Creates discipline plans from MIR data |
| `mgsd-copy-drafter` | Generates on-brand copy for any channel |
| `mgsd-campaign-architect` | Builds campaign structures from MSP blueprints |
| `mgsd-data-scientist` | Interprets KPI data and recommends pivots |

---

## What MarkOS Is Not

- Not a content generator you use ad-hoc
- Not a replacement for marketing judgment or strategy
- Not a tool that works without your brand context (that's what onboarding is for)
- Not managed — you own and version-control everything

---

## Architecture

```text
bin/install.cjs           ← first-run installer
bin/update.cjs            ← SHA256 idempotent updater (preserves patched files)
bin/ensure-chroma.cjs     ← auto-healing ChromaDB daemon

onboarding/
  index.html              ← 5-step onboarding form (privacy notice included)
  onboarding.js           ← UI logic (polling, approve, regenerate)
  backend/
    server.cjs            ← HTTP server (GET / /config /status; POST /submit /approve)
    write-mir.cjs         ← JIT-clone templates → fuzzy-merge → stamp STATE.md
    chroma-client.cjs     ← ChromaDB HTTP client (compatibility namespace: mgsd-{project_slug})
    agents/
      orchestrator.cjs    ← parallel draft generation + Chroma persistence
      llm-adapter.cjs     ← unified OpenAI/Anthropic/Gemini call wrapper
      mir-filler.cjs      ← Company/Audience/Competitive MIR generators
      msp-filler.cjs      ← Brand Voice/Channel Strategy MSP generators

.agent/                   ← Protocol engine (version-controlled)
.mgsd-local/              ← Client override layer (gitignored — legacy path still canonical for v2.1)
.mgsd-project.json        ← Persistent project slug (legacy compatibility manifest for v2.1)
.protocol-lore/           ← Agent navigation knowledge base (mandatory first-read)
```

---

## Agent Quick-Boot

If you are an AI agent, read these files in order before doing anything else:

1. `.protocol-lore/QUICKSTART.md` — boot entry point, search map, key commands
2. `.protocol-lore/CODEBASE-MAP.md` — full filesystem map with file annotations
3. `.planning/STATE.md` — current milestone and active phase
4. `.agent/marketing-get-shit-done/MGSD-INDEX.md` — full token registry on the legacy protocol path (only when needed)

---

## Environment Variables

Copy `.env.example` to `.env` and fill in at least one LLM key:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...
CHROMA_CLOUD_URL=https://...   # optional — skips local ChromaDB daemon
```

---

## Running Tests

```bash
node --test test/
```

Tests use Node's built-in test runner. Zero external test framework dependencies.

---

## GSD Co-existence

MarkOS detects and installs alongside existing GSD without touching any GSD files. Both protocols share `.agent/` and run in parallel, while the marketing protocol remains on the legacy `.agent/marketing-get-shit-done/` path until the dedicated migration phase lands.

---

## Customization

Place client overrides in `.mgsd-local/` — this legacy compatibility path survives all updates and patches in v2.1.

- **MIR overrides**: `.mgsd-local/MIR/` (JIT-cloned on first POST /approve)
- **Onboarding config**: `onboarding/onboarding-config.json` (port, auto_open_browser, chroma_host)
- **Project state**: `.mgsd-project.json` (written once, never regenerated)

See `.agent/marketing-get-shit-done/MGSD-INDEX.md` for full documentation on the current protocol layout.

---

## Compatibility Surfaces

MarkOS is the canonical product name. The following MGSD-era identifiers remain intentionally supported during v2.1 because they are compatibility-critical rather than user-facing branding:

- `.agent/marketing-get-shit-done/` and `MGSD-INDEX.md`
- `.mgsd-local/`, `.mgsd-project.json`, and `.mgsd-install-manifest.json`
- `mgsd-*` Chroma collection prefixes
- `mgsd-*` protocol agent IDs and the legacy `mgsd` CLI alias
- `MGSD_TELEMETRY` as a fallback to `MARKOS_TELEMETRY`

Public instructions, install commands, onboarding copy, and primary documentation should use MarkOS-first language.

---

## Runtime Modes

Phase 24 hardened onboarding runtime behavior around explicit local versus hosted constraints:

- Local server mode (`node onboarding/backend/server.cjs`): full onboarding flow, including local filesystem persistence and approve/write operations.
- Hosted/API-wrapper mode (`api/*.js`): shared config/status/submit/regenerate behavior via the same handlers, but local approve/write persistence is intentionally guarded.
- Hosted approve behavior: returns `501 LOCAL_PERSISTENCE_UNAVAILABLE` when local filesystem persistence is unavailable.

If you need hosted approve/write durability, add a dedicated persistence backend and treat local disk writes as unsupported in hosted runtimes.

---

## Residual Onboarding Warning Behavior

The onboarding pipeline now uses explicit outcome states (`success`, `warning`, `degraded`, `failure`) for regenerate and approve operations.

- `warning`: operation succeeded with merge fallback inserts and/or persistence warnings.
- `degraded`: output exists but came from fallback content because a provider was unavailable.
- `failure`: output was not persisted and requires operator action.

Intentional residual behavior that remains for now:
- Header-fallback append in `write-mir.cjs` when a target heading does not exist in the template.
- Static fallback draft text from `llm-adapter.cjs` when AI providers are unavailable.
- Local persistence guard for hosted mode (`LOCAL_PERSISTENCE_UNAVAILABLE`).

These states are expected during partial infrastructure outages and should not be treated as silent success.

---

## License

MIT
