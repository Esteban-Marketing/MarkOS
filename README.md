# Marketing Get Shit Done (MGSD)

[![npm](https://img.shields.io/npm/v/marketing-get-shit-done)](https://www.npmjs.com/package/marketing-get-shit-done)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Agentic marketing execution protocol.** MGSD installs alongside [Get Shit Done (GSD)](https://www.npmjs.com/package/get-shit-done-cc) for unified AI-powered development + marketing teams. It gives your AI agent a complete marketing operating system: brand intelligence, strategy plans, task templates, and a self-healing vector memory.

---

## Quick Start

### Install
```bash
npx marketing-get-shit-done install
```

### Update
```bash
npx marketing-get-shit-done update
```

### Start Client Onboarding
```bash
node onboarding/backend/server.cjs
# Then open http://localhost:4242
```

---

## What It Does

MGSD provides AI agents with a **complete marketing operating system**:

| Layer | What It Contains |
|-------|-----------------|
| **MIR** (Marketing Intelligence Repo) | Brand identity, audience profiles, competitive landscape, product facts |
| **MSP** (Marketing Strategy Plan) | Channel strategy, campaign blueprints, budget models |
| **ITM** (Issue Task Templates) | Pre-baked Linear.app tickets for every common marketing job |
| **Agent Roster** | mgsd-strategist, mgsd-copy-drafter, mgsd-campaign-architect, mgsd-data-scientist |
| **Onboarding Engine** | Web form → AI agents → approved MIR draft files |
| **Vector Memory** | Per-project ChromaDB collections for episodic learning |

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
