---
date: 2026-04-16
description: "Bridge note — maps the Obsidian vault to the MarkOS repository (GSD + MarkOS protocol + CRM code paths). Anchor for reference/ codebase notes."
tags:
  - reference
  - codebase
  - bridge
---

# MarkOS Repo

> Bridge between the [[Home|vault]] and the MarkOS codebase it lives in. Repo root is `../` relative to this vault.

## Canonical Entry Points

- **Agent boot**: `../CLAUDE.md`
- **Protocol lore**: `../.protocol-lore/QUICKSTART.md`, `../.protocol-lore/INDEX.md`
- **GSD state**: `../.planning/STATE.md`
- **MarkOS protocol registry**: `../.agent/markos/MARKOS-INDEX.md`

## Split

- **GSD** — engineering methodology under `../.agent/get-shit-done/`, drives `../.planning/`
- **MarkOS** — marketing protocol under `../.agent/markos/`, skills `../.agent/skills/markos-*`
- **Client overrides** — only under `../.markos-local/`

## CLI & Tests

- Install/update: `npx markos`
- Tests: `npm test` or `node --test test/**/*.test.js`
- Onboarding UI: `node onboarding/backend/server.cjs`

## Vault ↔ Code Cross-Refs

When work touches the codebase, capture durable knowledge here:

- Architecture notes → `reference/`
- Patterns discovered → [[Patterns]]
- Gotchas hit → [[Gotchas]]
- Decisions made → [[Key Decisions]]
- Claude memories → [[Memories]]

## PageIndex

Vault is indexed into a hierarchical tree at `obsidian/.pageindex/VAULT-INDEX.json` by `scripts/pageindex/build-vault-index.mjs`. Deep per-document LLM indexing via `scripts/pageindex/index-file.sh <path>`.

## Related

- [[Home]]
- [[Skills]]
- [[North Star]]
