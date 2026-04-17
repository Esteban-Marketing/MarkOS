---
date: 2026-04-16
description: "Meta/dev/infra — GSD .planning state, .protocol-lore routing, test suite (37 groups), scripts, config files, CI, Storybook, docs, research."
tags:
  - reference
  - infra
  - testing
  - planning
  - config
---

# Infrastructure

> Meta + dev + infra layer. Child of [[MarkOS Codebase Atlas]].

## .planning — GSD live state

- `STATE.md` — canonical GSD state. Milestone `v3.9.0 "Vertical Plugin Literacy Libraries" — COMPLETE`. All 5 phases (106–110) / 23 plans done. Next: `/gsd-complete-milestone` → v4.0.0.
- `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `PROGRESS.md`, `MILESTONES.md`.
- `config.json` — phase/milestone metadata.
- Audits: `v3.4.0-MILESTONE-AUDIT.md`, `v3.5.0-MILESTONE-AUDIT.md`, `v3.8.0-MILESTONE-AUDIT.md`.
- Phase folders `.planning/phases/NNN-*/` bundle `PLAN.md`, evidence commits, artifacts. Numbering: 106 plugin registry, 107 pack authoring, 108 loader/compose, 109–110 runtime/hardening.
- Test baseline (v3.9.0 closeout): 301 tests · 257 pass · 44 fail — no regressions vs. v3.8.0.

## .protocol-lore — agent boot routing

Protocol navigation + live-mission routing. **Not state storage.**

| File | Purpose |
|---|---|
| `QUICKSTART.md` | mandatory first-read; search order, GSD vs MarkOS split, high-frequency commands |
| `INDEX.md` | protocol map with cross-links (orchestrator, llm-adapter, server, vector-store-client) |
| `STATE.md` | pointer only — canonical is `.planning/STATE.md` |
| `ARCHITECTURE.md` | component interactions, MIR/MSP boundaries |
| `CONVENTIONS.md` | execution rules |
| `TEAM.md` | human+AI role topology + handoffs |
| `TEMPLATES.md` | tokenized MIR / MSP / ITM mapping |
| `WORKFLOWS.md` | machine-readable workflow loops |
| `DEFCON.md` | risk + escalation thresholds |
| `MEMORY.md` | vector/memory conventions |
| `CODEBASE-MAP.md` | LLM-agent filesystem navigation |

## test/ — 37 groups

Runner: `npm test` or `node --test test/**/*.test.js`.

| Group | Files | Purpose |
|---|---|---|
| Core intake | intake-validation, intake-e2e, intake-orchestration | onboarding flow + seed→MIR/MSP |
| Protocol + MIR | protocol, write-mir, core-gate | protocol contracts, MIR persistence, gate sequencing |
| Integrations | intake-linear, linear-client-mock | Linear.app task sync, LLM fallback |
| Literacy | literacy-ingest, literacy-e2e, orchestrator-literacy | pack loading, content ingestion, runtime resolution |
| Infrastructure | db-setup, vector-store-client, rls-verifier, namespace-auditor | DB bootstrap, Supabase+Upstash ops, RLS enforcement |
| Plugin system | plugin-registry, plugin-branding, plugin-telemetry, plugin-control | pack resolution, branding, telemetry, control flow |
| Diagnostics | pack-diagnostics, skeleton-generator, example-resolver, discipline-router, legacy-importer | validation, codegen, example fallbacks |
| CLI + update | install, update, dev-server, vault-open-cli, import-legacy-cli | install, patch updates, dev runtime |
| UI + onboarding | onboarding-server, onboarding-runtime-context, onboarding-approve-handler, onboarding-importer-ui, onboarding-importer-routes | HTTP server, context persistence, approvals |
| LLM adapters | `test/llm-adapter/*` — adapter-init, claude, openai, gemini, cost-calculator, fallback-chain, settings, telemetry | provider abstraction, cost calc, fallback safety |
| Migration + vault | migration-runner, vault-writer | DB migration, vault indexing |
| UI security + a11y | `test/ui-a11y/*`, `test/ui-security/*` | Storybook a11y + security |
| CRM | `test/crm-*/*` — schema, workspace, execution, ai, tenant-auth, tracking | CRM entity invariants, workspace views, execution queue, copilot workspace, tenant isolation, tracking normalization |

## scripts/

| Script | Purpose |
|---|---|
| `npm-pack-smoke-check.cjs` | validate publishable tarball |
| `phase47-live-verification.cjs` | LLM adapter integration (live + mock) |
| `storybook-runtime-check.cjs` | Storybook runtime integrity |
| `storybook-runtime-crawl.cjs` | component catalog index |
| `phase-84/static-cutover-scan.cjs` | CRM/legacy cutover verification |
| `gsd-refresh-manifest.cjs` | rebuild GSD file manifest |
| `pageindex/build-vault-index.mjs` | **vault PageIndex generator** — see [[VAULT-INDEX\|PageIndex Vault Index]] |
| `pageindex/index-file.sh` | per-file deep index (LLM-backed) |

## Top-level configuration

| File | Notes |
|---|---|
| `package.json` | name `markos` v3.3.0 · engines node `>=20.16.0` · bin `./bin/install.cjs` |
| `tsconfig.json` | target ES2017 · jsx preserve · noEmit · incremental · isolatedModules |
| `next-env.d.ts` | Next.js auto-generated types |
| `.storybook/main.ts` · `preview.tsx` · `manager.ts` · `test-runner.ts` | Storybook 8.6 · react-vite framework · axe-core a11y + security |
| `copilot-instructions.md` | GSD project contract for `.github` + Copilot |
| `.cursorrules` | Cursor IDE agent boot — mirrors `.claude/settings` |
| `CLAUDE.md` / `GEMINI.md` | agent boot entries |
| `CHANGELOG.md` | release history |
| `README.md` | "MarkOS — Marketing, structured." installed via `npx markos` |
| `ARCH-DIAGRAM.md` (~1302 lines) | system overview + data flow |
| `TECH-MAP.md` (~1664 lines) | canonical topology source |

## Key dependencies

- `@anthropic-ai/sdk`, `@google/generative-ai`, `openai` — LLM providers.
- `@supabase/ssr`, `@supabase/supabase-js` — DB + auth.
- `@upstash/vector` — literacy vector store.
- `next@^15.2.0`, `react@^19`, `react-dom@^19` — web stack.
- `mammoth`, `pdf-parse` — document ingest.
- `ajv` — JSON Schema validation.
- `posthog-node` — product telemetry.
- `formidable`, `csv-parse`, `dotenv` — misc.

## docs/

| Doc | Purpose |
|---|---|
| `LLM-BYOK-ARCHITECTURE.md` | BYOK LLM architecture — provider abstraction, fallback chain, cost |
| `OPERATOR-LLM-SETUP.md` | operator provider setup — env vars, keys |

## RESEARCH/

Research seed artifacts for the onboarding knowledge base:

`CONTENT-AUDIT.md` · `MARKET-TRENDS.md` · `COMPETITIVE-INTEL.md` · `AUDIENCE-RESEARCH.md` · `ORG-PROFILE.md` · `PRODUCT-RESEARCH.md`.

## Supporting directories

| Dir | Purpose |
|---|---|
| `public/` | static assets |
| `tmp/` | transient build/cache (gitignored) |
| `.markos-local/` | client-local MIR/MSP overrides (gitignored) — **only** client customization boundary |
| `.markos-logs/` | runtime logs + audit trails (gitignored) |
| `.github/` | GSD shared framework, CODEOWNERS, gsd-file-manifest.json |
| `.vscode/` | workspace settings (optional) |
| `storybook-static/` | built Storybook export (CI artifact) |
| `.next/` | Next.js build output |

## Release history highlights

- **v3.3.0** (2026-04-10) — Revenue CRM core, canonical entities, first-party tracking, native outbound, copilot, reporting, repeatable pack validation.
- **v3.9.0** (current, in `.planning/STATE.md`) — Vertical Plugin Literacy Libraries complete.
- **v2.3.0** (2026-03-31) — Codebase documentation intelligence, Phase 33 archived.
- **v2.0.0** (2026-03-27) — MARKOS → MarkOS rebrand, npm package.
- **v1.0.0** (2026-03-23) — MIR/MSP/RESEARCH, interactive install, web onboarding, vector memory.

## Related

- [[MarkOS Codebase Atlas]] · [[MarkOS Protocol]] · [[Database Schema]] · [[Contracts Registry]] · [[Patterns]]
