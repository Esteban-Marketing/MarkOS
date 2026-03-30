# MarkOS (MarkOS Protocol)

## Current Milestone: v2.2 — Platform Engineering (planned)

**Status:** v2.1 shipped 2026-03-28. v2.2 planned with Phases 28-31 and ready for execution sequencing.

**Deferred Track (v2.0 Rebrand — Phases 17-22):** Residual filesystem and package rename sequencing (beyond Phase 23 identity normalization). Shelved until explicitly re-prioritized; Phase 23 already established MarkOS-first public copy and compatibility contracts.

## What This Is
A protocol for agentic marketing execution, built as a parallel system to the development-focused Get Shit Done (GSD) protocol. It enables human managers and AI marketing agents to collaborate on strategy, content, campaigns, and operations using standardized templates (MIR-TEMPLATE, MSP-TEMPLATE, .agents) while synchronizing tasks seamlessly with Linear.

## Core Value
Standardization and automation of marketing ideation, planning, and execution via robust agentic workflows and Linear issue tracking.

## Context
This project aims to instantiate the MarkOS (markos) protocol, now productized publicly as MarkOS. Following the successful deployment of the core framework, onboarding engine, strategic enrichment layer, and documentation hardening, the next milestone is focused on product stabilization rather than net-new scaffolding. The system already operates as a local-first marketing OS with optional hosted entrypoints; the remaining work is to reduce identity drift, harden runtime behavior, improve onboarding reliability, and strengthen the path from approved strategy state into repeatable execution.

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

- Onboarding completion: `POST /approve` successfully writes approved drafts to `.markos-local/MIR/`.
- Execution readiness: all required approved sections and winners anchors are present.

Required approved sections:
- `company_profile`
- `mission_values`
- `audience`
- `competitive`
- `brand_voice`
- `channel_strategy`

Required winners anchors:
- `.markos-local/MSP/Paid_Media/WINNERS/_CATALOG.md`
- `.markos-local/MSP/Lifecycle_Email/WINNERS/_CATALOG.md`
- `.markos-local/MSP/Content_SEO/WINNERS/_CATALOG.md`
- `.markos-local/MSP/Social/WINNERS/_CATALOG.md`
- `.markos-local/MSP/Landing_Pages/WINNERS/_CATALOG.md`

Execution work must pause when readiness is blocked; operators should resolve missing checks before creator/executor prompts run.

## Requirements

### Active
- [ ] P0-01: Approve path write resolution is crash-free and local/hosted behavior is explicit.
- [ ] P0-02: Node runtime contract is enforced at `>=20.16.0` in metadata, installer, and docs.
- [ ] P0-03: Install flow idempotently injects private-data `.gitignore` protections.
- [ ] P1-01: `/linear/sync` creates issues from ITM templates with deterministic assignee mapping.
- [ ] P1-02: `/campaign/result` writes winners catalogs and persists retrieval tags.
- [ ] P1-03: Interview flow is capped at five questions with progress + auto-proceed.
- [ ] MDB-01: MarkOSDB contracts defined for Supabase + Upstash.
- [ ] MDB-02: Idempotent local-to-cloud ingestion from `.markos-local` artifacts.
- [ ] MDB-03: Next.js + Supabase auth boundary for cloud-canonical operations.
- [x] RLH-01: Reliability/observability SLOs for core onboarding endpoints.
- [x] RLH-02: Migration readiness controls with dry-run and rollback-safe modes.
- [x] RLH-03: Security/compliance guardrails for secrets, logs, and retention.
- [x] RLH-04: Compatibility retirement policy with operator discretion and optional evidence references.

### Validated & Delivered (v2.1)
- âœ“ Normalized MarkOS identity across public UX, package metadata, and onboarding UI with explicit backward-compat classification map — v2.1 (Phase 23)
- âœ“ Hardened shared onboarding runtime behavior across local and Vercel/API-wrapper modes with explicit env guards and centralized slug resolution — v2.1 (Phase 24)
- âœ“ Improved extraction quality, regenerate/approve ergonomics, and approved-draft merge safety with fixture-backed tests — v2.1 (Phase 25)
- âœ“ Formalized Vector Store namespace rules, local/cloud operating modes, and cross-project isolation guarantees — v2.1 (Phase 26)
- âœ“ Strengthened handoff from approved MIR/MSP state into execution workflows with checklist-based readiness contract and actionable telemetry — v2.1 (Phase 27)

### Validated & Delivered (v2.2)
- âœ“ Completed rollout hardening for reliability checkpoints, deterministic migration safety, hosted auth guardrails, and operator-driven compatibility retirement policy — v2.2 (Phase 31)

### Validated & Delivered (v1.0 & v1.1)
- âœ“ Defined the core `markos` workflow integrating MIR-TEMPLATE and MSP-TEMPLATE — v1.0
- âœ“ Implemented canonical `RESEARCH/` architectures and `markos-researcher` engine — v1.0
- âœ“ Supported dual-protocol execution natively on the repository — v1.0
- âœ“ Created NPX installer and patching engine for distribution — v1.0
- âœ“ Enforced gating hooks preventing agent misfires on unchecked Phase plans — v1.1
- âœ“ Implemented Strategic Enrichment (Phase 15): Dual-engine business framework (Lean Canvas/JTBD) and specialized agent prompt registry — v1.1

### Out of Scope
- Building our own task tracker (relies on Linear integration).
- Directly rewriting the `gsd` protocol's source code (markos will sit parallel).
- Auto-overwriting client `.markos-local/` files during patch updates.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Parallel protocol | Avoids corrupting developer `gsd` tools with marketing jargon | — Established |
| Linear integration | Standardizing on Linear for issue tracking since it supports agents well | — Maintained |
| Fail-Fast Engine | Strict logic gating implemented over `markos-execute-phase` | — Established |
| v2.1 milestone sequencing | Research shows product hardening should precede a repo-wide rename-only campaign | âœ“ Good — shipped 2026-03-28 |
| Compatibility-first identity policy | MarkOS is public-facing while MARKOS-era paths and namespaces remain explicit compatibility surfaces until later migration phases | âœ“ Good — audit completed Phase 23 |
| Onboarding-to-execution separation | Approval state and execution readiness are distinct contract states; readiness blocked on missing anchors/sections | âœ“ Good — Phase 27 contract shipped |
| Fixture-driven quality assertions | Extraction quality assertions are fixture-backed rather than inline payload-heavy tests | âœ“ Good — Phase 25 test suite |
| Hosted runtime write limitation | Vercel/API-wrapper mode intentionally cannot persist approve/write flows to local disk — explicit degraded behavior | âœ“ Good — documented in Phase 24 residuals |
| v2.2 sequencing | Execute P0 runtime/data-safety gates before operational integrations, then MarkOSDB migration, then rollout hardening | âœ“ Good — locked in Phases 28-31 |

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

Last updated: 2026-03-28 after v2.2 planning (Phases 28-31).

