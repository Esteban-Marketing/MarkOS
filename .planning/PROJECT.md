# MarkOS (Marketing Get Shit Done Protocol)

## Current Milestone: Next milestone TBD

**Status:** v2.1 — Product Hardening & Identity Convergence shipped 2026-03-28. Planning for next milestone not yet started.

**Deferred Track (v2.0 Rebrand — Phases 17-22):** Repo-wide rename from `marketing-get-shit-done` → `markos` (npm, directories, configs, code paths, docs). Shelved until explicitly re-prioritized after product hardening was deemed higher priority.

## What This Is
A protocol for agentic marketing execution, built as a parallel system to the development-focused Get Shit Done (GSD) protocol. It enables human managers and AI marketing agents to collaborate on strategy, content, campaigns, and operations using standardized templates (MIR-TEMPLATE, MSP-TEMPLATE, .agents) while synchronizing tasks seamlessly with Linear.

## Core Value
Standardization and automation of marketing ideation, planning, and execution via robust agentic workflows and Linear issue tracking.

## Context
This project aims to instantiate the Marketing Get Shit Done (mgsd) protocol, now productized publicly as MarkOS. Following the successful deployment of the core framework, onboarding engine, strategic enrichment layer, and documentation hardening, the next milestone is focused on product stabilization rather than net-new scaffolding. The system already operates as a local-first marketing OS with optional hosted entrypoints; the remaining work is to reduce identity drift, harden runtime behavior, improve onboarding reliability, and strengthen the path from approved strategy state into repeatable execution.

## Residual Onboarding Warning Behavior

Onboarding handlers and UI now treat outcomes as explicit states: `success`, `warning`, `degraded`, and `failure`.

- `warning` indicates completed writes with fallback append paths or non-fatal persistence issues.
- `degraded` indicates fallback content generation due to provider unavailability.
- `failure` indicates writes or regeneration did not complete and operator intervention is required.

Residual risk accepted for now:
- Fuzzy-header append fallback in approved draft merges remains allowed, but is now surfaced and test-covered.
- Hosted runtime remains intentionally unable to persist approve/write flows to local disk.
- Provider outages continue to return static fallback drafts; this is explicit degraded behavior, not silent success.

## Execution Readiness Contract (Phase 27 Baseline)

Onboarding approval and execution readiness are separate states:

- Onboarding completion: `POST /approve` successfully writes approved drafts to `.mgsd-local/MIR/`.
- Execution readiness: all required approved sections and winners anchors are present.

Required approved sections:
- `company_profile`
- `mission_values`
- `audience`
- `competitive`
- `brand_voice`
- `channel_strategy`

Required winners anchors:
- `.mgsd-local/MSP/Paid_Media/WINNERS/_CATALOG.md`
- `.mgsd-local/MSP/Lifecycle_Email/WINNERS/_CATALOG.md`
- `.mgsd-local/MSP/Content_SEO/WINNERS/_CATALOG.md`
- `.mgsd-local/MSP/Social/WINNERS/_CATALOG.md`
- `.mgsd-local/MSP/Landing_Pages/WINNERS/_CATALOG.md`

Execution work must pause when readiness is blocked; operators should resolve missing checks before creator/executor prompts run.

## Requirements

### Active
- [ ] Define next milestone scope (options: v2.2 hardening continuation, v2.0 rebrand deferred track, or new capability track).

### Validated & Delivered (v2.1)
- ✓ Normalized MarkOS identity across public UX, package metadata, and onboarding UI with explicit backward-compat classification map — v2.1 (Phase 23)
- ✓ Hardened shared onboarding runtime behavior across local and Vercel/API-wrapper modes with explicit env guards and centralized slug resolution — v2.1 (Phase 24)
- ✓ Improved extraction quality, regenerate/approve ergonomics, and approved-draft merge safety with fixture-backed tests — v2.1 (Phase 25)
- ✓ Formalized Chroma namespace rules, local/cloud operating modes, and cross-project isolation guarantees — v2.1 (Phase 26)
- ✓ Strengthened handoff from approved MIR/MSP state into execution workflows with checklist-based readiness contract and actionable telemetry — v2.1 (Phase 27)

### Validated & Delivered (v1.0 & v1.1)
- ✓ Defined the core `mgsd` workflow integrating MIR-TEMPLATE and MSP-TEMPLATE — v1.0
- ✓ Implemented canonical `RESEARCH/` architectures and `mgsd-researcher` engine — v1.0
- ✓ Supported dual-protocol execution natively on the repository — v1.0
- ✓ Created NPX installer and patching engine for distribution — v1.0
- ✓ Enforced gating hooks preventing agent misfires on unchecked Phase plans — v1.1
- ✓ Implemented Strategic Enrichment (Phase 15): Dual-engine business framework (Lean Canvas/JTBD) and specialized agent prompt registry — v1.1

### Out of Scope
- Building our own task tracker (relies on Linear integration).
- Directly rewriting the `gsd` protocol's source code (mgsd will sit parallel).
- Auto-overwriting client `.mgsd-local/` files during patch updates.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Parallel protocol | Avoids corrupting developer `gsd` tools with marketing jargon | — Established |
| Linear integration | Standardizing on Linear for issue tracking since it supports agents well | — Maintained |
| Fail-Fast Engine | Strict logic gating implemented over `mgsd-execute-phase` | — Established |
| v2.1 milestone sequencing | Research shows product hardening should precede a repo-wide rename-only campaign | ✓ Good — shipped 2026-03-28 |
| Compatibility-first identity policy | MarkOS is public-facing while MGSD-era paths and namespaces remain explicit compatibility surfaces until later migration phases | ✓ Good — audit completed Phase 23 |
| Onboarding-to-execution separation | Approval state and execution readiness are distinct contract states; readiness blocked on missing anchors/sections | ✓ Good — Phase 27 contract shipped |
| Fixture-driven quality assertions | Extraction quality assertions are fixture-backed rather than inline payload-heavy tests | ✓ Good — Phase 25 test suite |
| Hosted runtime write limitation | Vercel/API-wrapper mode intentionally cannot persist approve/write flows to local disk — explicit degraded behavior | ✓ Good — documented in Phase 24 residuals |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
## Metadata

Last updated: 2026-03-28 after v2.1 milestone completion.
