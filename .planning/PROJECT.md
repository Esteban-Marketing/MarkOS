# MarkOS (MarkOS Protocol)

## Current Milestone: v3.1.0 — Operator Surface Unification

**Goal:** Unify marketing, sales, and customer communications execution in one operational surface with auditable workflows and measurable activation outcomes.

**Target features:**
- Integrated task UI with live task graph, step-by-step execution, approval points, retries, and evidence capture
- Complete API contract coverage for all MarkOS flows with versioning, OpenAPI generation, and compatibility guarantees
- Platform hardening with role-based operations UI, migration safety, health diagnostics, and guided operator onboarding

**Status:** v3.1.0 initiated 2026-04-02. v3.0 (Phases 39-44) shipped 2026-04-02 with pain-points-first literacy system verified end-to-end.

**Deferred Track (v2.0 Rebrand — Phases 17-22):** Residual filesystem and package rename sequencing (beyond Phase 23 identity normalization). Shelved until explicitly re-prioritized; Phase 23 already established MarkOS-first public copy and compatibility contracts.

## What This Is
A protocol for agentic marketing execution, built as a parallel system to the development-focused Get Shit Done (GSD) protocol. It enables human managers and AI marketing agents to collaborate on strategy, content, campaigns, and operations using standardized templates (MIR-TEMPLATE, MSP-TEMPLATE, .agents) while synchronizing tasks seamlessly with Linear.

## Core Value
Standardization and automation of marketing ideation, planning, and execution via robust agentic workflows and Linear issue tracking.

## Context
This project aims to instantiate the MarkOS (markos) protocol, now productized publicly as MarkOS. The system is production-grade with literacy lifecycle verified (v3.0). The v3.1.0 milestone focuses on **operator surface unification**: consolidating all MarkOS flows into a single auditable operational UI with complete API contracts, clear versioning/compatibility policies, and hardening for enterprise rollout. The shift is from framework-building to operational excellence — putting non-technical operators in control of execution with evidence trails, approval workflows, and built-in safeguards.

The canonical codebase map is now live under `.planning/codebase/` as of v2.3 Phase 33. Phase 34 delivered the intake automation backbone for beta onboarding. Phase 35 delivered installer/readiness optimization and is archived under v2.5. Phase 36 delivered the v2.4 beta-operations baseline with lifecycle ownership, weekly cadence, KPI scorecard, and PLG evidence-loop contracts. Phase 37 then delivered the MarkOS app/control-plane scaffolding with governance and data-model foundations, formally closing v2.4. Phase 38 established the Storybook, Chromatic, accessibility, and UI security baseline that now anchors v2.6 execution.

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

### Active (v3.1.0)
- [ ] OPS-01: Operator can execute a complete task chain from UI with explicit state transitions, approval checkpoints, retries, and timestamped evidence per step.
- [ ] API-01: Every active MarkOS flow (onboarding, execution, reporting) is represented in a versioned OpenAPI contract stored in the codebase.
- [ ] API-02: Contract test suite enforces backward compatibility and prevents unapproved breaking changes in CI.
- [ ] CONTRACT-01: API versioning policy is documented (SemVer, deprecation windows, compatibility guarantees, migration path).
- [ ] RBAC-01: Operations UI enforces role-based access control; unauthorized actions are blocked and logged; permissions are visible in-product.
- [ ] HARD-01: Preflight checks prevent unsafe migrations; rollback paths exist for all data-altering flows.
- [ ] HARD-02: Health diagnostics surface operator/admin health status (DB connectivity, vector store status, provider health, data consistency).
- [ ] ONBOARD-01: Operator onboarding path (first-run, training, role assignment) is documented and executable without direct engineering support.

### Validated & Delivered (v2.1)
- [x] RLH-01: Reliability/observability SLOs for core onboarding endpoints.
- [x] RLH-02: Migration readiness controls with dry-run and rollback-safe modes.
- [x] RLH-03: Security/compliance guardrails for secrets, logs, and retention.
- [x] RLH-04: Compatibility retirement policy with manual-discretion and optional evidence references.

### Validated & Delivered (v2.1)
- âœ“ Normalized MarkOS identity across public UX, package metadata, and onboarding UI with explicit backward-compat classification map — v2.1 (Phase 23)
- âœ“ Hardened shared onboarding runtime behavior across local and Vercel/API-wrapper modes with explicit env guards and centralized slug resolution — v2.1 (Phase 24)
- âœ“ Improved extraction quality, regenerate/approve ergonomics, and approved-draft merge safety with fixture-backed tests — v2.1 (Phase 25)
- âœ“ Formalized Vector Store namespace rules, local/cloud operating modes, and cross-project isolation guarantees — v2.1 (Phase 26)
- âœ“ Strengthened handoff from approved MIR/MSP state into execution workflows with checklist-based readiness contract and actionable telemetry — v2.1 (Phase 27)

### Validated & Delivered (v2.2)
- ✔ Crash-free approve-path write resolution with explicit local/hosted env guards and idempotent gitignore injection — v2.2 (Phase 28)
- ✔ Linear sync + campaign result endpoints with ITM-template issue creation and winners-catalog persistence — v2.2 (Phase 29)
- ✔ Interview flow capped at five questions with progress bar and auto-proceed — v2.2 (Phase 29)
- ✔ MarkOSDB contracts for Supabase + Upstash, idempotent ingestion, and Next.js auth boundary — v2.2 (Phase 30)
- ✔ Rollout hardening: reliability SLOs, migration safety, secrets guardrails, compatibility retirement policy — v2.2 (Phase 31)
- ✔ Marketing Literacy Base: vector-store literacy primitives, ingestion/admin CLI, orchestrator integration — v2.2 (Phase 32)

### Validated & Delivered (v2.3)
- ✔ Canonical codebase map under `.planning/codebase/` covering architecture, routes, structure, conventions, testing, and concerns — v2.3 (Phase 33)
- ✔ Route-by-route documentation for all runtime surfaces (onboarding HTTP, API wrappers, CLI entrypoints) — v2.3 (Phase 33)
- ✔ Folder-by-folder and file-by-file documentation for all maintained surfaces — v2.3 (Phase 33)
- ✔ Documentation freshness rules and verification checks for route additions, file moves, topology changes — v2.3 (Phase 33)
- ✔ Protocol-facing and human-facing docs updated to deep-link to canonical map — v2.3 (Phase 33)

### Validated & Delivered (v2.5)
- ✔ DX-01: Bare `npx markos` now acts as the primary one-command install path — v2.5 (Phase 35)
- ✔ DX-02: Installer now applies safe defaults first and only falls back to prompts when needed — v2.5 (Phase 35)
- ✔ DX-03: Installer-owned artifacts now converge cleanly on rerun and existing installs auto-handoff to update deterministically — v2.5 (Phase 35)
- ✔ OPS-READY-01: Install now ends with explicit `ready` / `degraded` / `blocked` readiness states and actionable next steps — v2.5 (Phase 35)
- ✔ CI-01: Install/update now behave deterministically in non-interactive environments and do not hang on prompts — v2.5 (Phase 35)

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
| Canonical codebase map | GSD `.planning/codebase/` becomes the canonical documentation layer; `TECH-MAP.md`, `.protocol-lore/CODEBASE-MAP.md`, and `README.md` should summarize and deep-link rather than compete with it | ✔ Delivered — v2.3 Phase 33 |

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

Last updated: 2026-04-02 after Phase 44 completion and v3.1.0 initiated.
