# MarkOS (Marketing Get Shit Done Protocol)

## Current Milestone: v2.1 Product Hardening & Identity Convergence

**Goal:** Stabilize MarkOS as a local-first marketing operating system by aligning identity, hardening the shared runtime, improving onboarding quality, formalizing memory operations, and tightening the handoff from approved state into downstream execution.

**Target features:**
- MarkOS-first identity with explicit backward compatibility for MGSD-era paths, manifests, and namespaces.
- Consistent onboarding behavior across local server mode and Vercel/API-wrapper mode.
- Safer extraction, regeneration, approval, and draft-merge behavior validated by fixtures and tests.
- Clear Chroma namespace rules, local/cloud operating modes, and multi-project isolation guarantees.
- Stronger post-onboarding execution readiness and telemetry at meaningful operational checkpoints.

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

## Requirements

### Active
- [ ] Normalize MarkOS identity across public UX, runtime identifiers, and compatibility-critical legacy paths.
- [ ] Harden shared onboarding runtime behavior across local and hosted/API-wrapper execution modes.
- [ ] Improve extraction quality, regenerate/approve ergonomics, and approved-draft merge safety with stronger test coverage.
- [ ] Formalize Chroma namespace rules, local/cloud operating modes, and cross-project isolation guarantees.
- [ ] Strengthen the handoff from approved MIR/MSP state into execution workflows and actionable telemetry.

### Validated & Delivered (v1.0 & v1.1)
- [x] Defined the core `mgsd` workflow integrating MIR-TEMPLATE and MSP-TEMPLATE.
- [x] Implemented canonical `RESEARCH/` architectures and `mgsd-researcher` engine.
- [x] Supported dual-protocol execution natively on the repository.
- [x] Created NPX installer and patching engine for distribution.
- [x] Enforced gating hooks preventing agent misfires on unchecked Phase plans.
- [x] Implemented Strategic Enrichment (Phase 15): Dual-engine business framework (Lean Canvas/JTBD) and specialized agent prompt registry.

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
| v2.1 milestone sequencing | Research shows product hardening should precede a repo-wide rename-only campaign | — Adopted |
| Compatibility-first identity policy | MarkOS is public-facing while MGSD-era paths and namespaces remain explicit compatibility surfaces until later migration phases | — Adopted |

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

Last updated: 2026-03-28 after Phase 24 verification closure.
