# Feature Landscape

**Domain:** AI-native marketing operating system
**Researched:** 2026-03-28

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| One-command install and update | Core CLI product promise | Medium | Present via `npx markos` and `npx markos update` |
| Guided onboarding UI | Users need a usable first-run path | Medium | Present via local app and Vercel-compatible routes |
| Draft generation with human approval | AI workflow products must keep humans in control of published state | Medium | Present through `/submit`, `/regenerate`, `/approve` |
| Persistent project state | Protocol products must retain context across sessions | Medium | Present through `.planning`, `.markos-local`, `.markos-project.json`, and Vector Store |
| Testable delivery | Installer/updater products need regression coverage | Medium | Present with 26 passing Node tests |
| Multi-provider LLM support | Buyers expect key flexibility and fallback options | Medium | Present across Anthropic, OpenAI, Gemini, and Ollama |

## Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| MIR/MSP protocol separation | Distinguishes factual intelligence from execution plans | High | Strong architectural differentiator already visible in repo structure |
| Client-owned local override layer | Preserves trust and custom strategy across updates | High | `.markos-local` is central to the product's ownership story |
| GSD co-existence | Lets dev and marketing operating systems live in one repo | High | Strong for teams using agent workflows across functions |
| Vector Store-backed draft and seed memory | Makes onboarding context reusable beyond a single request | Medium | Valuable once follow-on retrieval flows deepen |
| Winner-anchored execution model | Grounds future generation in historical performance | High | Promising differentiator, especially for execution phases after onboarding |

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| SaaS-only closed state | Breaks the client-owned protocol story | Keep state in repo/local override layers and use hosted services only where additive |
| Auto-overwriting approved client data on update | Destroys trust and breaks active workflows | Preserve local overrides and require explicit migrations |
| Overbuilding a general CMS inside MarkOS | Pulls focus away from protocol execution | Keep MarkOS focused on intelligence, planning, and agent-operable state |
| Single-provider lock-in | Reduces resilience and buyer flexibility | Maintain provider abstraction and explicit fallback behavior |

## Feature Dependencies

```text
Install/update engine -> Onboarding UI -> Draft generation -> Human approval -> Local MIR/MSP persistence
Local MIR/MSP persistence -> Prompt injection and winner anchoring -> Execution workflows
Project slug + Vector Store persistence -> Retrieval/memory features -> Multi-tenant operations
```

## MVP Recommendation

Prioritize:
1. Reliable install/update and local onboarding
2. Strong draft generation plus approval and persistence
3. Clear protocol ownership through MIR/MSP and local overrides

Defer: Deep hosted multi-tenant management until naming, runtime, and migration boundaries are fully stabilized.

## Sources

- README.md
- .planning/STATE.md
- onboarding/backend/handlers.cjs
- onboarding/backend/orchestrator.cjs
- test/install.test.js
- test/onboarding-server.test.js
- test/update.test.js
- test/protocol.test.js

