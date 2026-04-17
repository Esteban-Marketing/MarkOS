---
date: 2026-04-16
description: "Agentic marketing protocol layer — .agent/markos, GSD engineering methodology, onboarding engine, CLI. Tokenized registry, skills, hooks, agents."
tags:
  - reference
  - protocol
  - markos
  - gsd
  - onboarding
---

# MarkOS Protocol

> Token-indexed, multi-agent marketing operations stack layered over the GSD methodology. Child of [[MarkOS Codebase Atlas]].

## .agent/markos — Marketing protocol

Master registry: `.agent/markos/MARKOS-INDEX.md` (MARKOS-IDX-000). Everything is addressable by TOKEN_ID.

### Structure

```
.agent/markos/
├── MARKOS-INDEX.md          master registry (30+ agents, 18+ skills, 8 workflows, 16+ templates)
├── VERSION
├── agents/                  23 domain-specialized executors
├── bin/                     CLI entry + shared runtime
├── hooks/                   runtime guards
├── literacy/taxonomy.json   8 parent pain-points + 20+ sub-tags
├── references/              14 operational docs
├── templates/               project scaffolds, phase reports, MSP disciplines
└── workflows/               workflow patterns
```

### 23 agents (by tier)

| Tier | Agents |
|---|---|
| Strategy | Strategist, Planner, Campaign Architect, Creative Brief, CRO Hypothesis |
| Content | Content Creator, Copy Drafter, Social Drafter, Email Sequence, Content Brief, SEO Planner |
| Audience | Audience Intel, Market Researcher, Competitive Monitor, Market Scanner |
| Analytics | Funnel Analyst, Performance Monitor, Gap Auditor, Report Compiler |
| Ops | Tracking Spec, UTM Architect, Automation Architect, Calendar Builder, Budget Monitor, Lead Scorer, Linear Manager, Context Loader, Librarian |
| Specialty | Onboarder (Phase 0), Researcher (intel seed), Neuro Auditor (biological trigger validation) |

### Knowledge gates

- **Gate 1 — Identity**: brand voice, messaging, business model. Blocks all content generation.
- **Gate 2 — Execution**: tracking, automation, ad accounts, KPIs. Blocks campaign launch.

Lineage persisted in `markos_mir_gate1_initializations` + `markos_discipline_activation_evidence` (see [[Database Schema]]).

### Taxonomy

`.agent/markos/literacy/taxonomy.json` — 8 parent pain-points: acquisition cost · conversions · retention · visibility · attribution · audience · velocity · engagement. Drives Phase 40 discipline routing.

### State output

- `.markos-local/MIR/` — Marketing Intelligence Repository.
- `.markos-local/MSP/` — Marketing Strategy Pack.
- `.planning/` — phase-scoped PLAN.md, SUMMARY.md, VERIFICATION.md.
- Linear.app — bidirectional via MARKOS-AGT-OPS-07.

## .agent/get-shit-done — GSD engineering methodology

Lightweight project scaffolding; optional independent of MarkOS.

### Structure

```
.agent/get-shit-done/
├── bin/gsd-tools.cjs
├── bin/lib/          config, commands, core, frontmatter, init, milestone,
│                     phase, roadmap, state, template, verify, UAT, security
├── references/       14 docs — checkpoints, continuation, decimal phases,
│                     git patterns, model profiles, phase parsing,
│                     questioning, TDD, user profiling, verification
├── templates/        milestone, phase-prompt, discovery, state, roadmap,
│                     requirements, retrospective, UAT, VALIDATION, debug
└── workflows/        40+ workflows
```

### State & commands

- `.planning/config.json` — phase definitions, model profiles, KPI targets.
- `.planning/PHASE-*.md` — discrete phase execution logs.
- `gsd-file-manifest.json` — SHA256 checksums for idempotent patching.
- Skills: `gsd-new-project`, `gsd-new-milestone`, `gsd-add-phase`, `gsd-plan-phase`, `gsd-execute-phase`, `gsd-verify-work`, `gsd-autonomous`, `gsd-check-todos`, etc. (see [[Skills]]).

## Skills · Prompts · Hooks · Agents (.agent/*)

### Skills (70+ invokable triggers)

- **MarkOS (16)**: markos-plan-phase, markos-execute-phase, markos-discuss-phase, markos-verify-work, markos-progress, markos-health, markos-autonomous, markos-new-milestone, markos-complete-milestone, markos-audit-milestone, markos-campaign-launch, markos-performance-review, markos-mir-audit, markos-neuro-auditor, markos-research-phase, markos-discipline-activate.
- **GSD (48+)**: see [[Skills]].

### Layer-0 prompts (`.agent/prompts/`) — 8 execution personas

Telemetry Synthesizer · CRO Landing Page Builder · Paid Media Creator · Email Lifecycle Strategist · SEO Content Architect · Social Community Manager · Brand Enforcer QA.

### Hooks (`.agent/hooks/`) — runtime guards

- `gsd-check-update.js` — version drift on SessionStart.
- `gsd-context-monitor.js` — watches state divergence after Bash/Edit/Write/Task.
- `gsd-prompt-guard.js` — prevents unsafe file edits (PreToolUse on Write/Edit).
- `gsd-statusline.js` · `gsd-workflow-guard.js` — phase/workflow safety.

## onboarding/ — vault-first intake engine

### Config

`onboarding/onboarding-config.json`:

- port `4242`, Obsidian vault root, bootstrap model `vault-first`, legacy mode `migration-only`.
- Ollama fallback `llama3:8b`, vector endpoint, Linear client.
- Output paths: `.markos-local/MIR`, `.markos-local/MSP`.

### Seed schema

`onboarding/onboarding-seed.schema.json`:

- `completeness_score` 0–6.
- company: `business_model` — B2B · B2C · B2B2C · DTC · Marketplace · SaaS · Agents-aaS; tone; brand values.
- product: pricing / sales cycle (conditional by GTM), AOV, consumption metric.
- audience: segment, pain points, decision-maker (B2B) / purchase frequency (B2C) / lifestyle triggers (DTC) / supply + demand sides (Marketplace).
- competition: 3–5 competitors, market share, positioning.
- market + content: demand signals, channels, content pillars.

### Backend agents

- `orchestrator.cjs` — coordinates MIR/MSP generators, retries LLM calls, persists to vector store.
- `mir-filler.cjs` · `msp-filler.cjs` — generate company profile, mission/vision, audience, competitive landscape, brand voice, channel strategy.
- `discipline-router.cjs` — routes parent pain-point tags → Phase 40 discipline.
- `approval-gate.cjs` — human sign-off before persisting drafts.
- `run-engine.cjs` — event store + side-effect ledger for idempotent generation.
- Vault layer: `vault-writer.cjs`, `sync-service.cjs`, `ingest-router.cjs`, `import-engine.cjs`.
- Brand strategy/identity: contradiction detector, messaging rules compiler, accessibility gates, design-system token compiler, role-handoff packs (Next.js starter).
- Governance: drift auditor, bundle registry, closure gates, lineage handoff tracking.

### Handlers

`onboarding/backend/handlers.cjs` exports the handler functions referenced by contracts:

- `handleSubmit` (F-01) · `handleApprove` (F-02) · `handleRegenerate` (F-03) · `handleConfig` (F-04) · `handleMarkosdbMigration` (F-08) · `handleLiteracyCoverage` (F-09) · `handleCampaignResult` (F-07) · `handleLinearSync` (F-06).

## bin/ — CLI

| Script | Purpose |
|---|---|
| `install.cjs` | interactive first-run; detects GSD coexistence, scaffolds templates, writes `.markos-install-manifest.json` |
| `dev-server.cjs` | HTTP server (port 4242) serving onboarding form + API routes |
| `llm-config.cjs`, `llm-status.cjs` | LLM provider config + health |
| `cli-runtime.cjs` | shared — banner, hash validation, Obsidian detection, CLI arg parsing, node version assertion |
| `ensure-vector.cjs` | vector memory provider validation |
| `sync-vault.cjs` | bidirectional vault ↔ Supabase sync |
| `vault-open.cjs` | open vault in Obsidian |
| `extract-flows.cjs`, `validate-flow-contracts.cjs` | contract tooling |
| `db-setup.cjs`, `import-legacy.cjs` | DB init + legacy migration |
| `markos-company-knowledge.cjs` | RAG indexing for company context |

## Related

- [[MarkOS Codebase Atlas]] · [[Infrastructure]] · [[Skills]] · [[Patterns]] · [[MarkOS Repo]]
