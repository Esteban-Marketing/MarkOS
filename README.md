# MarkOS — Marketing Operating System

[![npm](https://img.shields.io/npm/v/marketing-get-shit-done)](https://www.npmjs.com/package/marketing-get-shit-done)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Marketing, structured.

You've tried prompting your way to a marketing strategy. It doesn't work without structure.

**MarkOS is the missing operating system** — protocol-grade marketing infrastructure for AI-ready teams, installed in one command.

```bash
npx marketing-get-shit-done install
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
- `.agent/marketing-get-shit-done/` — the full protocol engine
- `.planning/MIR/` — 78-file Marketing Intelligence Repository (brand, audience, competitive)
- `.planning/MSP/` — 80-file Marketing Strategy Plan (channels, campaigns, budgets)
- `.protocol-lore/` — AI agent navigation knowledge base
- A web onboarding form to fill your brand intelligence

```bash
# Update when new protocol versions ship:
npx marketing-get-shit-done update

# Run the onboarding form to fill your brand intelligence:
node onboarding/backend/server.cjs
# Then open http://localhost:4242
```

---

## Three Layers

```
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

```
bin/install.cjs           ← first-run installer
bin/update.cjs            ← SHA256 idempotent updater (preserves patched files)
bin/ensure-chroma.cjs     ← auto-healing ChromaDB daemon

onboarding/
  index.html              ← 5-step onboarding form (privacy notice included)
  onboarding.js           ← UI logic (polling, approve, regenerate)
  backend/
    server.cjs            ← HTTP server (GET / /config /status; POST /submit /approve)
    write-mir.cjs         ← JIT-clone templates → fuzzy-merge → stamp STATE.md
    chroma-client.cjs     ← ChromaDB HTTP client (namespace: mgsd-{project_slug})
    agents/
      orchestrator.cjs    ← parallel draft generation + Chroma persistence
      llm-adapter.cjs     ← unified OpenAI/Anthropic/Gemini call wrapper
      mir-filler.cjs      ← Company/Audience/Competitive MIR generators
      msp-filler.cjs      ← Brand Voice/Channel Strategy MSP generators

.agent/                   ← Protocol engine (version-controlled)
.mgsd-local/              ← Client override layer (gitignored — YOUR data lives here)
.mgsd-project.json        ← Persistent project slug (ChromaDB namespace)
.protocol-lore/           ← Agent navigation knowledge base (mandatory first-read)
```

---

## Agent Quick-Boot

If you are an AI agent, read these files in order before doing anything else:

1. `.protocol-lore/QUICKSTART.md` — boot entry point, search map, key commands
2. `.protocol-lore/CODEBASE-MAP.md` — full filesystem map with file annotations
3. `.planning/STATE.md` — current milestone and active phase
4. `.agent/marketing-get-shit-done/MGSD-INDEX.md` — full token registry (only when needed)

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

MGSD detects and installs alongside existing GSD without touching any GSD files. Both protocols share `.agent/` and run in parallel.

---

## Customization

Place client overrides in `.mgsd-local/` — this directory survives all updates and patches.

- **MIR overrides**: `.mgsd-local/MIR/` (JIT-cloned on first POST /approve)
- **Onboarding config**: `onboarding/onboarding-config.json` (port, auto_open_browser, chroma_host)
- **Project state**: `.mgsd-project.json` (written once, never regenerated)

See `.agent/marketing-get-shit-done/MGSD-INDEX.md` for full documentation.

---

## License

MIT
