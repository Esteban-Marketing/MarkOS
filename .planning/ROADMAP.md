# Roadmap: MarkOS (MARKOS)

## Milestones

- ✅ **v1.0 Initial Protocol** — Phases 1-7 (shipped 2026-03-23)
- ✅ **v3.1.0 Operator Surface Unification** — Phases 45-50 completed (2026-04-03) → **ARCHIVED** (`.planning/milestones/v3.1.0-phases/`)
- 📦 **v3.2.0 Post-Unification Execution & Adoption** — Repository-complete milestone with hosted follow-through tracked separately from the active v3.3 closeout work
- 🚧 **v3.3.0 Revenue CRM and Customer Intelligence Core** — Active milestone; Phases 58 through 64 and follow-on Phases 64.1, 64.2, and 64.3 are verified passed, and Phase 65 is the current hosted reporting closeout and milestone-promotion follow-through
- 📋 **v3.3.1 Obsidian Mind Vault-First Pivot** — Planned future milestone after Phase 66; retires MIR/MSP as canonical structures and moves MarkOS to an Obsidian Mind-inspired vault-first operating model
- ✅ **v3.4.0 Complete Branding Engine** — Phases 73-83 completed; archived at `.planning/milestones/v3.4.0-ROADMAP.md` (2026-04-12)
- 🚧 **v3.5.0 Ultimate Literacy Vault** — Milestone initialized; requirements definition in progress

## Phase 31 Rollout Hardening (Execution-Ready Plan Set)

### Phase 31: Rollout Hardening (P2)
**Goal:** Gate agency-wide rollout with reliability SLOs, migration safety controls, security/compliance guardrails, and explicit compatibility deprecation criteria.
**Requirements Mapped:** RLH-01, RLH-02, RLH-03, RLH-04
**Depends on:** Phase 30
**Status:** Complete (2026-03-28)
**Artifacts:** .planning/phases/31-rollout-hardening/31-CONTEXT.md, .planning/phases/31-rollout-hardening/31-REQUIREMENTS.md, .planning/phases/31-rollout-hardening/31-RESEARCH.md, .planning/phases/31-rollout-hardening/31-VERIFICATION.md, .planning/phases/31-rollout-hardening/31-UAT.md
**Plans:** 4 plans
Plans:
- [x] 31-01: Tiered endpoint SLO telemetry and docs parity
- [x] 31-02: Migration promotion controls and rollback checkpoints
- [x] 31-03: Secret validation, redaction, and retention enforcement
- [x] 31-04: Operator-driven compatibility retirement policy

**Compatibility Retirement Policy (Operational):**
1. Compatibility retirement remains a manual operator decision recorded in .planning/phases/31-rollout-hardening/31-COMPATIBILITY-DECISIONS.json.
2. Protocol tests, hosted auth boundaries, migration determinism, and downstream cloud-readiness remain recommended evidence inputs, but no hard minimum evidence count is required before retirement.
3. Every retirement decision must include an owner, rationale, and rollback path so legacy surfaces can be restored if a rollout regression appears.

## Phase 32: Marketing Literacy Base

**Goal:** Build the shared marketing literacy base contracts, ingestion tooling, and admin surfaces that support the two-layer retrieval model.
**Requirements Mapped:** MLB-01, MLB-02, MLB-03, MLB-04
**Depends on:** Phase 31
**Status:** ✅ Complete (2026-03-31)
**Artifacts:** `.planning/phases/32-marketing-literacy-base/32-RESEARCH.md`, `.planning/phases/32-marketing-literacy-base/32-LITERACY-SUPABASE.sql`, `.planning/phases/32-marketing-literacy-base/32-OPERATIONS.md`, `.planning/phases/32-marketing-literacy-base/32-VERIFICATION.md`

Phase 32 delivered the shared standards-layer infrastructure that lets MarkOS retrieve grounded marketing tactics alongside client-specific MIR context.

## Phase 33: Codebase Documentation Mapping

**Goal:** Create the canonical `.planning/codebase/` documentation system and align protocol-facing docs to it.
**Requirements Mapped:** DOC-01, DOC-02, DOC-03, DOC-04
**Depends on:** Stable post-v2.2 runtime surfaces and current phase artifacts on disk
**Status:** ✅ Complete (2026-03-31)
**Artifacts:** `.planning/phases/33-codebase-documentation-mapping/33-RESEARCH.md`, `.planning/phases/33-codebase-documentation-mapping/33-REQUIREMENTS.md`, `.planning/phases/33-codebase-documentation-mapping/33-VERIFICATION.md`, `.planning/codebase/`

Phase 33 completed the documentation follow-on for making the repository navigable through the GSD framework. The canonical output target is `.planning/codebase/`, with protocol and human-facing docs linking back to that map rather than duplicating its source of truth.

## v2.4 Beta Client Onboarding

**Status:** ✅ Archived milestone (shipped 2026-04-01)
**Archive:** `.planning/milestones/v2.4-ROADMAP.md`
**Summary:** Delivered intake automation (Phase 34), beta operations cadence (Phase 36), and the MarkOS UI control-plane + white-label foundation (Phase 37).

---

## v2.5: Enhancement & Optimization Process

**Goal:** Make MarkOS deployable as a genuinely smart one-command system so a typical local operator can run `npx markos` and reach a working onboarding environment with near-zero manual setup.
**Requirements to map:** DX-01 (single-command deployment), DX-02 (prompt-minimized install), OPS-READY-01 (readiness validation), CI-01 (headless compatibility)
**Depends on:** v2.4 Phase 34 completion and current install/update/onboarding runtime surfaces
**Status:** ✅ Archived after Phase 35 completion (2026-04-01). Report: `.planning/milestones/v2.5-REPORT.md`

## Phase 35: Smart One-Command Deployment

**Goal:** Evolve the installer from prompt-first setup to hybrid auto-configuration with deterministic readiness checks and reliable onboarding launch.
**Requirements Mapped:** DX-01, DX-02, OPS-READY-01, CI-01
**Depends on:** Existing `bin/install.cjs`, `bin/update.cjs`, `bin/ensure-vector.cjs`, and onboarding backend health surfaces
**Status:** ✅ Complete (2026-04-01)
**Artifacts:** `.planning/phases/35-smart-one-command-deployment/35-RESEARCH.md`, `.planning/phases/35-smart-one-command-deployment/35-PLAN.md`, `.planning/phases/35-smart-one-command-deployment/35-01-SUMMARY.md`

- 35-01: Define installer contract for interactive, non-interactive, and update handoff modes
- 35-02: Auto-detect and hydrate runtime defaults before prompting for missing values
- 35-03: Add readiness checks and actionable failure summaries for Node, env, vector, and onboarding boot
- 35-04: Verify idempotent reruns, docs parity, and CI/headless behavior

Phase 35 completed the installer/readiness hardening needed to make `npx markos` the real default deployment path. Milestone v2.5 is now formally closed.

---

## v2.6 Planned: Post-Deployment Operations & Beta Activation

**Goal:** Convert one-command deployment reliability into measurable beta onboarding outcomes and an operator feedback loop for continued optimization.
**Requirements to map:** BETA-01 (10 active pilot clients), OPS-LOOP-01 (intake-to-activation operating cadence), DX-OBS-01 (deployment diagnostics from real operator runs)
**Depends on:** v2.5 archived baseline and existing intake/runtime surfaces from Phases 34-35
**Status:** Active milestone. Phase 38 established the UI assurance baseline; next follow-on scope remains to be planned.

## Phase 38: UI Coverage and Security Assurance

**Goal:** Establish complete and scalable UI quality coverage for the MarkOS app using Storybook and Chromatic, with security controls and verification gates that make every UI change testable, reviewable, and auditable before merge.
**Requirements Mapped:** BETA-01, PLG-01
**Depends on:** Phase 37 control-plane foundations and the v2.5 archived deployment baseline
**Status:** ✅ Complete (2026-04-01)
**Artifacts:** `.planning/phases/38-ui-coverage-security-assurance/38-PLAN.md`, `.planning/phases/38-ui-coverage-security-assurance/38-01-SUMMARY.md`, `.planning/phases/38-ui-coverage-security-assurance/38-VERIFICATION.md`

- 38-01: Bootstrap deterministic Storybook infrastructure for route and foundation coverage
- 38-02: Publish visual baselines through Chromatic with PR-oriented CI wiring
- 38-03: Enforce accessibility and UI security checks as merge-blocking gates
- 38-04: Harden workflow governance with required coverage and clearer CI failure messaging

## Phase 39: Pain-Points-First Content Corpus

**Goal:** Author and ingest the foundational marketing literacy corpus organized by pain-point taxonomy, covering all five MSP disciplines with business-model-aware metadata so the two-layer retrieval system has real content to serve.
**Requirements Mapped:** LIT-01 (corpus coverage), LIT-02 (pain-point taxonomy), LIT-03 (business-model annotations)
**Depends on:** Phase 32 literacy infrastructure (vector store client, ingestion CLI, chunker, Supabase table)
**Status:** ✅ Complete (2026-04-03)
**Milestone:** v3.0 MarkOS Literacy System

**Plans:** 3 plans

Plans:
- [x] 39-01-PLAN.md — Wave 1 infrastructure: test scaffolding, taxonomy.json, Supabase migration, ingest-literacy.cjs + vector-store-client.cjs pain_point_tags extension
- [x] 39-02-PLAN.md — Wave 2 corpus authoring: 15 production-complete documents across Paid_Media, Content_SEO, Lifecycle_Email, Social, Landing_Pages
- [x] 39-03-PLAN.md — Wave 3 ingestion + verification: apply migration, live ingest all 15 docs, round-trip retrieval verification

## Phase 40: Multi-Discipline Orchestrator Retrieval

**Goal:** Replace the hardcoded single-discipline literacy fetch with a dynamic multi-discipline retrieval pipeline that selects disciplines based on the client's seed data and ranks results by pain-point relevance.
**Requirements Mapped:** LIT-04 (multi-discipline routing), LIT-05 (pain-point boosted retrieval), LIT-06 (context budget enforcement)
**Depends on:** Phase 39 (content corpus must exist to validate retrieval)
**Status:** 📋 Planned
**Milestone:** v3.0 MarkOS Literacy System

**Plans:** 2 plans

Plans:
- [x] 40-01-PLAN.md — Wave 1 router/filter contract: Wave 0 tests, deterministic discipline-router, optional taxonomy fallback, exported OR-style pain_point_tags filter
- [x] 40-02-PLAN.md — Wave 2 orchestrator runtime: top-3 dual-query retrieval, doc_id-first dedupe, fixed chunk cap, literacy_retrieval_observed telemetry, focused integration tests

## Phase 41: Dynamic Skeleton Template Generator

**Goal:** Build a skeleton generator that produces a starter content pack — pre-filled template stubs customized to the client's business model and top pain points — that populates the `.markos-local/` workspace immediately after onboarding approval.
**Requirements Mapped:** LIT-07 (skeleton registry coverage), LIT-08 (approval-triggered hydration)
**Depends on:** Phase 40 (discipline router must exist for ranked discipline selection)
**Status:** 📋 Planned
**Milestone:** v3.0 MarkOS Literacy System

**Plans:** 6 plans

Plans:
- [x] 41-01-PLAN.md — Wave 0 test scaffold: create node:test todo contract for 8 required resolver/generator/approve behaviors
- [x] 41-02-PLAN.md — Wave 1 implementation: add resolveSkeleton + SEED_PATH + skeleton-generator + approve hook + executable tests
- [x] 41-03-PLAN.md — Wave 2 templates A: author Paid_Media + Content_SEO skeleton sets (14 files)
- [x] 41-04-PLAN.md — Wave 2 templates B: author Lifecycle_Email + Social skeleton sets (14 files)
- [x] 41-05-PLAN.md — Wave 2 templates C: author Landing_Pages skeleton set (7 files) + full 35-file registry validation

## Phase 42: Secure Database Provisioning Flow

**Goal:** Implement a guided, safe database connection and provisioning workflow that validates credentials, creates required tables and RLS policies, and isolates per-client data without risking existing production data.
**Requirements Mapped:** LIT-09 (guided setup command), LIT-10 (idempotent migration runner), LIT-11 (RLS verification), LIT-12 (namespace isolation + health snapshot)
**Depends on:** Phase 41 (post-approval skeleton generation baseline)
**Status:** 📋 Planned
**Milestone:** v3.0 MarkOS Literacy System

**Plans:** 6 plans

Plans:
- [x] 42-01-PLAN.md — Wave 0 Nyquist test scaffolding for db setup, migrations, RLS, and namespace audit contracts
- [x] 42-02-PLAN.md — Wave 1 setup command path: CLI routing, secure credential wizard, connectivity probes, safe env persistence
- [x] 42-03-PLAN.md — Wave 2 migration engine: deterministic ordering, `markos_migrations` ledger, fail-fast diagnostics
- [x] 42-04-PLAN.md — Wave 3 security verification: RLS policy checks and namespace isolation audits
- [x] 42-05-PLAN.md — Wave 4 integration gate: health snapshot, docs parity, and full regression verification

## Phase 43: Onboarding-to-Literacy Activation Pipeline

**Goal:** Close the gap between onboarding seed submission and literacy activation by wiring a post-submission pipeline that evaluates literacy coverage and reports readiness in submit/status responses.
**Requirements Mapped:** LIT-13 (post-submit activation + gaps), LIT-14 (readiness contract in submit/status), LIT-15 (activation telemetry)
**Depends on:** Phase 42 (secure provisioning baseline for literacy data plane)
**Status:** ✅ Complete (2026-04-02)
**Milestone:** v3.0 MarkOS Literacy System
**Artifacts:** `.planning/phases/43-onboarding-to-literacy-activation-pipeline/43-05-SUMMARY.md`, `.planning/phases/43-onboarding-to-literacy-activation-pipeline/43-VALIDATION.md`, `.planning/phases/43-onboarding-to-literacy-activation-pipeline/43-VERIFICATION.md`

**Plans:** 5 plans

Plans:
- [x] 43-01-PLAN.md — Wave 0 Nyquist contract scaffolding for submit readiness, status literacy block, and telemetry assertions
- [x] 43-02-PLAN.md — Wave 1 shared readiness evaluator and deterministic discipline fallback
- [x] 43-03-PLAN.md — Wave 2 submit integration for literacy readiness and activation telemetry
- [x] 43-04-PLAN.md — Wave 3 status integration and submit/status readiness parity
- [x] 43-05-PLAN.md — Wave 4 regression gate, docs alignment, and verification closure

## Phase 44: End-to-End Literacy Integration Verification

**Goal:** Validate the complete literacy lifecycle from content authoring through onboarding activation to draft generation, confirming pain-points-first retrieval improves output relevance and remains regression-safe.
**Requirements Mapped:** LIT-16 (lifecycle E2E relevance), LIT-17 (coverage API contract), LIT-18 (zero-hit regression gate), LIT-19 (operator runbook and execution workflow)
**Depends on:** Phase 43 (onboarding-to-literacy activation baseline)
**Status:** ✅ Complete (2026-04-02)
**Milestone:** v3.0 MarkOS Literacy System
**Artifacts:** `.planning/phases/44-end-to-end-literacy-integration-verification/44-05-SUMMARY.md`, `.planning/phases/44-end-to-end-literacy-integration-verification/44-VALIDATION.md`, `.planning/phases/44-end-to-end-literacy-integration-verification/44-VERIFICATION.md`

**Plans:** 5 plans

Plans:
- [x] 44-01-PLAN.md — Wave 0 Nyquist scaffolding: lifecycle/coverage/regression contract tests + deterministic fixture corpus
- [x] 44-02-PLAN.md — Wave 1 coverage implementation: backend handler, vector aggregation helper, local/hosted route wiring
- [x] 44-03-PLAN.md — Wave 2 lifecycle verification: fixture ingest harness, standards_context relevance assertions, coverage parity checks
- [x] 44-04-PLAN.md — Wave 3 regression enforcement: populated-corpus zero-hit gate and CI integration with diagnostics
- [x] 44-05-PLAN.md — Wave 4 closure: operator runbook, validation ledger completion, full-suite final regression verification

---

<details>
<summary>v3.1.0 — Operator Surface Unification (Completed 2026-04-03)</summary>

> **6 phases (45–50) · 48/48 roadmap phases complete and verified at closeout**
>
> **Goal:** Unify marketing, sales, and customer communications execution in one operational surface with auditable workflows and measurable activation outcomes.
>
> **Closeout Artifacts:** `.planning/milestones/v3.1-NORMALIZATION-REPORT.md`, `.planning/milestones/v3.1.0-REPORT.md`, `.planning/milestones/v3.1.0-phases/`

### Phase 45: Operations Flow Inventory & Canonical Contract Map
**Status:** ✅ Complete (2026-04-03)
Plans:
- [x] 45-01-PLAN.md
- [x] 45-02-PLAN.md
- [x] 45-03-PLAN.md
- [x] 45-04-PLAN.md
- [x] 45-05-PLAN.md
- [x] 45-06-PLAN.md

### Phase 46: Operator Task Graph UI (MVP)
**Status:** ✅ Complete (2026-04-03)
Plans:
- [x] 46-01-PLAN.md
- [x] 46-02-PLAN.md
- [x] 46-03-PLAN.md
- [x] 46-04-PLAN.md
- [x] 46-05-PLAN.md
- [x] 46-06-PLAN.md
- [x] 46-07-PLAN.md
- [x] 46-08-PLAN.md

### Phase 47: Multi-Provider LLM BYOK Abstraction Layer
**Status:** ✅ Complete (2026-04-03)
Plans:
- [x] 47-01-PLAN.md
- [x] 47-02-PLAN.md
- [x] 47-03-PLAN.md
- [x] 47-04-PLAN.md
- [x] 47-05-PLAN.md
- [x] 47-06-PLAN.md
- [x] 47-07-PLAN.md
- [x] 47-08-PLAN.md
- [x] 47-09-PLAN.md
- [x] 47-10-PLAN.md

### Phase 48: Contract Testing Framework & CI Compatibility Gates
**Status:** ✅ Complete (2026-04-03)

### Phase 49: Hardening Layer (RBAC, Diagnostics, Preflight Checks, Rollback Safety)
**Status:** ✅ Complete (2026-04-03)

### Phase 50: Guided Operator Onboarding + End-to-End Activation Verification
**Status:** ✅ Complete (2026-04-03)

### v3.1.0 Milestone Acceptance Criteria
1. All v3.1 requirements mapped to phases and phases closed
2. Roadmap parser status at closeout: complete and verified with zero incomplete plans
3. Archive, reporting, and state transition artifacts recorded

</details>

---

## 🟢 v3.2.0 — Post-Unification Execution & Adoption

**Status:** 🟢 In Progress — Phase 52 verified (human_needed); Phase 53 verified PASS; Phase 54 verified (human_needed)

**Goal:** Establish strict tenant boundaries, deterministic tenant context propagation, and enforceable role boundaries to enable multi-tenant operator execution with measurable security and isolation guarantees.

**Requirements:** TEN-01, TEN-02, TEN-03, IAM-01, IAM-02

## Phase 51: Multi-Tenant Foundation and Authorization
**Goal:** Deliver the core multi-tenant and authorization foundation for MarkOS by enforcing strict tenant isolation and deterministic tenant context propagation across UI, API, jobs, and agent runtime entrypoints, while upgrading role boundaries from v3.1 RBAC baseline to v3.2 IAM model.
**Requirements Mapped:** TEN-01, TEN-02, TEN-03, IAM-01, IAM-02
**Status:** ✅ Complete (4/4 plans, verification PASS 107/107)
**Plans:**
- [x] 51-01-PLAN.md — Tenant schema + membership contracts + tenant_id RLS baseline
- [x] 51-02-PLAN.md — Wrapper tenant auth boundary + protected UI propagation fail-closed contract
- [x] 51-03-PLAN.md — Concise IAM v3.2 action matrix enforcement across API and UI with compatibility gates
- [x] 51-04-PLAN.md — Background-job + handler/orchestrator tenant propagation and denial telemetry

**Phase 51 Milestones:**
- ✅ 51-01: Tenant schema + RLS (DELIVERED 2026-04-03)
- ✅ 51-02: Wrapper tenant auth boundary (DELIVERED 2026-04-03)
- ✅ 51-03: IAM v3.2 action-scoped authorization (DELIVERED 2026-04-03)
- ✅ 51-04: Background job + denial telemetry (DELIVERED 2026-04-03)

## Phase 52: Plugin Runtime and Digital Agency Plugin v1
**Goal:** Deliver the core plugin infrastructure for MarkOS v3.2: in-process plugin registry/loader, capability-based access control layered on IAM v3.2, Digital Agency plugin (agency workflows, approvals, campaign scheduling), per-tenant plugin enablement with plan-tier gating foundations, and plugin telemetry ready for Phase 54 metering.
**Requirements Mapped:** PLG-DA-01, PLG-DA-02, WL-01, WL-02, WL-03, WL-04
**Depends on:** Phase 51 (Multi-Tenant Foundation and Authorization)
**Status:** ✅ Verified (human_needed) — 12/12 truths, 73/73 tests, 2 live-environment checks pending
**Plans:**
- [x] 52-01-PLAN.md — Plugin runtime foundation: contracts, registry/loader, tenant enablement + capability grants (Wave 1)
- [x] 52-02-PLAN.md — Digital Agency plugin: routes, campaign workflow persistence, approval lifecycle (Wave 2)
- [x] 52-03-PLAN.md — Tenant plugin management + white-label: settings API/UI, brand-pack inheritance, domain routing (Wave 3)
- [x] 52-04-PLAN.md — Plugin telemetry, brand-version audit trail, integration gate + VALIDATION close-out (Wave 4)

**Phase 52 Milestones:**
- ✅ 52-01: Plugin runtime foundation (DELIVERED 2026-04-03)
- ✅ 52-02: Digital Agency plugin core (DELIVERED 2026-04-03)
- ✅ 52-03: Tenant plugin management + white-label (DELIVERED 2026-04-03)
- ✅ 52-04: Plugin telemetry + brand-version audit trail (DELIVERED 2026-04-03)
- 🔲 HV1: Plugin settings UI visual verification (pending live environment)
- 🔲 HV2: Live plugin-disable gate E2E (pending live environment)

## Phase 53: Agentic MarkOS Orchestration and MIR/MSP Intelligence
**Goal:** Deliver tenant-bound AI orchestration infrastructure for MarkOS: deterministic agent run lifecycle engine (envelope, state machine, idempotency), policy-based provider abstraction with failover, MIR Gate 1 hardening and MSP discipline activation contracts, human approval gates for high-impact agent actions, and full run telemetry capturing model/prompt/cost/outcome per tenant.
**Requirements Mapped:** AGT-01, AGT-02, AGT-03, AGT-04, MIR-01, MIR-02, MIR-03, MIR-04, IAM-03
**Depends on:** Phase 51 (Multi-Tenant Foundation), Phase 52 (Plugin Runtime — telemetry hooks)
**Status:** ✅ Verified PASS — 13/13 truths; targeted regression suite green

## Phase 54: Billing, Metering, and Enterprise Governance
**Goal:** Deliver invoice-grade tenant billing and enterprise governance for MarkOS by turning Phase 52/53 telemetry into deduplicated usage records, reconciling usage against subscription entitlements, generating operator-facing billing evidence and invoice line items, and extending IAM v3.2 with enterprise identity federation and compliance-ready audit controls.
**Requirements Mapped:** BIL-01, BIL-02, BIL-03, IAM-04, GOV-01
**Depends on:** Phase 51 (IAM v3.2 foundations), Phase 52 (plugin telemetry), Phase 53 (agent run telemetry and provider-attempt evidence)
**Status:** ✅ Verified (human_needed) — 6/6 plans complete, broader regression 77/77 green, `npm run build:llm` clean, 2 live checks pending
**Plans:**
- [x] 54-01-PLAN.md — Phase 54 contract baseline + Wave 0 billing/auth/governance test scaffolds
- [x] 54-02-PLAN.md — Billing schema, normalized usage events, dedupe keys, and immutable ledger foundation
- [x] 54-03-PLAN.md — Session/auth hardening + enterprise SSO provider binding and canonical role-mapping foundations
- [x] 54-04-PLAN.md — Request-time entitlement snapshots, fail-closed degradation, and runtime/plugin enforcement
- [x] 54-05-PLAN.md — Shared billing APIs, Stripe sync projection, tenant billing UX, and operator reconciliation surface
- [x] 54-06-PLAN.md — Governance evidence exports, access reviews, retention controls, and vendor inventory surface

**Phase 54 Milestones:**
- ✅ 54-01: Wave 0 contracts, fixtures, and requirement-family scaffolds (DELIVERED 2026-04-03)
- ✅ 54-02: Billing foundation, normalization, pricing snapshots, and immutable usage ledger (DELIVERED 2026-04-03)
- ✅ 54-03: Session-backed auth hardening and enterprise SSO role-mapping foundation (DELIVERED 2026-04-03)
- ✅ 54-04: Shared entitlement snapshots and fail-closed runtime enforcement (DELIVERED 2026-04-03)
- ✅ 54-05: Invoice evidence, Stripe sync projection, and tenant/operator billing surfaces (DELIVERED 2026-04-03)
- ✅ 54-06: Governance evidence, vendor inventory, and admin governance surface (DELIVERED 2026-04-03)
- 🔲 HV1: Tenant billing UX language and evidence readability review in a live app session
- 🔲 HV2: Real enterprise IdP SSO callback verification against non-production Supabase enterprise setup

## Phase 55: Tenant Quota and Billing Failure Closure
**Goal:** Close the remaining MarkOS v3 quota and billing-failure gaps by making plan-tier quota/rate-limit controls explicit and by turning billing-failure degradation and recovery into requirement-specific evidence.
**Requirements Mapped:** TEN-04, BIL-04
**Depends on:** Phase 51 (tenant isolation foundations), Phase 54 (billing and entitlement enforcement)
**Status:** ✅ Complete (2026-04-04)
**Plans:**
- [x] 55-01-PLAN.md — Wave 1 quota and rate-limit contract closure for TEN-04
- [x] 55-02-PLAN.md — Wave 2 dunning, degraded-state, and recovery closure for BIL-04
- [x] 55-03-PLAN.md — Wave 3 verification and closure-artifact promotion for TEN-04 and BIL-04

## Phase 56: Security and Privacy Evidence Closure
**Goal:** Close the remaining MarkOS v3 security and privacy evidence gaps by making privileged-action audit coverage, deletion workflow proof, and encryption control evidence explicit.
**Requirements Mapped:** SEC-01, SEC-02, SEC-03
**Depends on:** Phase 31 (rollout hardening), Phase 54 (governance and identity evidence)
**Status:** ✅ Complete (2026-04-04)
**Plans:**
- [x] 56-01-PLAN.md — Wave 1 privileged-action audit coverage map for SEC-01
- [x] 56-02-PLAN.md — Wave 2 GDPR-aligned deletion workflow proof for SEC-02
- [x] 56-03-PLAN.md — Wave 3 encryption evidence and closure-artifact updates for SEC-03

## Phase 57: Observability and Incident Closure
**Goal:** Close the remaining MarkOS v3 operational evidence gaps by unifying subsystem observability proof and producing tenant-aware incident workflow and simulation evidence.
**Requirements Mapped:** OPS-01, OPS-02
**Depends on:** Phase 31 (API SLO telemetry), Phase 53 (agent runtime telemetry), Phase 54 (billing/governance surfaces)
**Status:** ✅ Complete (2026-04-04)
**Plans:**
- [x] 57-01-PLAN.md — Wave 1 unified subsystem observability inventory for OPS-01
- [x] 57-02-PLAN.md — Wave 2 tenant-aware incident workflow and communications path for OPS-02
- [x] 57-03-PLAN.md — Wave 3 incident simulation evidence and closure-artifact updates for OPS-01 and OPS-02

---

## 🚧 v3.3.0 — Revenue CRM and Customer Intelligence Core

**Status:** 🚧 Active milestone — Phases 58 through 64.3 are complete or verified, and Phase 65 is the current hosted reporting closeout and milestone-promotion phase

**Goal:** Turn MarkOS into a Customer 360, AI-first revenue workspace where CRM records are the operational source of truth for relationship state, pipeline progression, next-best action, outbound execution, and reporting, while PostHog remains the behavioral analytics engine feeding that system.

**Requirements:** CRM-01, CRM-02, CRM-03, CRM-04, CRM-05, CRM-06, TRK-01, TRK-02, TRK-03, TRK-04, ATT-01, AI-CRM-01, AI-CRM-02, REP-01

### Phase 58: CRM Canonical Schema and Identity Graph
**Goal:** Establish tenant-safe CRM primitives and identity graph foundations for contacts, companies, deals, accounts, customers, activities, tasks, and timelines.
**Requirements Mapped:** CRM-01, CRM-02
**Depends on:** Phase 51 tenant isolation, Phase 53 agent audit model, Phase 54 billing/governance evidence model
**Status:** ✅ Complete (2026-04-04)

### Phase 59: Behavioral Tracking and Identity Stitching
**Goal:** Implement proxy-based PostHog tracking, ads and affiliate tracking subdomain support, session-to-contact stitching, and CRM activity ingestion contracts.
**Requirements Mapped:** TRK-01, TRK-02, TRK-03, TRK-04
**Depends on:** Phase 58
**Status:** ✅ Complete (2026-04-04)

### Phase 60: Pipeline Engine and Multi-View Workspace
**Goal:** Ship custom pipelines, custom stages, and the required CRM views: Kanban, table, record detail, timeline, calendar, and forecast/funnel.
**Requirements Mapped:** CRM-03, REP-01
**Depends on:** Phase 58 and Phase 59
**Status:** ✅ Verified PASS (2026-04-04) — protected CRM routes now hydrate canonical workspace state and targeted regression passes 22/22

### Phase 61: Sales and Success Execution Workspace
**Goal:** Deliver lead, deal, account, and customer success workflow surfaces with next-best-action support and operator task orchestration.
**Requirements Mapped:** CRM-04, CRM-06, REP-01
**Depends on:** Phase 60
**Status:** ✅ Verified PASS (2026-04-04) — execution workspace ships explainable recommendation ranking, personal and team queues, bounded task or note or safe-record actions, suggestion-only drafts, and targeted regression passes 20/20

### Phase 62: Native Outbound Execution
**Goal:** Add first-class outbound execution for Resend email, Twilio SMS, and Twilio WhatsApp with consent-safe delivery telemetry wired back into CRM timelines.
**Requirements Mapped:** CRM-05, CRM-06
**Depends on:** Phase 58, Phase 59, and Phase 61
**Status:** ✅ Verified PASS (2026-04-04) — provider-backed send, governed templates or sequences or bulk scheduling, webhook-driven conversation writeback, and targeted regression pass 16/16

### Phase 63: AI Copilot and Agentic CRM Operations
**Goal:** Deliver CRM copilots and role-aware agent workflows for summaries, drafting, enrichment, recommendations, and approval-gated automations.
**Requirements Mapped:** AI-CRM-01, AI-CRM-02, CRM-04, CRM-06
**Depends on:** Phase 58 through Phase 62
**Status:** 📋 Planned

**Plans:** 3 plans

Plans:
- [x] 63-01-PLAN.md — Wave 1 foundation: CRM grounding contract, bounded mutation schema, RBAC/telemetry expansion, tenant-safe copilot APIs
- [x] 63-02-PLAN.md — Wave 2 operator surfaces: CRM copilot workspace, record and conversation panels, recommendation packaging, approval envelopes
- [x] 63-03-PLAN.md — Wave 3 governed execution: multi-step playbooks, replay-safety, controlled cross-tenant oversight, audit-lineage closeout

### Phase 64: Attribution, Reporting, and Verification Closure
**Goal:** Close the milestone with CRM-native attribution, revenue reporting, operator dashboards, live verification, and acceptance evidence.
**Requirements Mapped:** ATT-01, REP-01
**Depends on:** Phase 58 through Phase 63
**Status:** 📋 Planned

**Plans:** 3 plans

Plans:
- [x] 64-01-PLAN.md — Wave 1 foundation: deterministic attribution model, reporting data contracts, readiness or completeness signals, telemetry expansion
- [x] 64-02-PLAN.md — Wave 2 cockpit: CRM-native reporting shell, evidence rails, executive summaries, governed central rollups
- [x] 64-03-PLAN.md — Wave 3 closeout: verification workflows, v3.3 live-check artifacts, evidence-pack promotion, milestone closure updates

### Phase 64.1: GSD Runtime Parity and Hook Stabilization (INSERTED)
**Goal:** Align the active `.claude` GSD runtime with the newer `.github` 1.32.0 surface by syncing execution logic, reference guidance, and hook strategy before new planning begins.
**Requirements Mapped:** GSD-ALIGN-01, GSD-ALIGN-02, GSD-ALIGN-03
**Depends on:** Phase 64
**Status:** ✅ Verified Passed (2026-04-05)

**Plans:** 3 plans

Plans:
- [x] 64.1-01-PLAN.md — Wave 1 cleanup: remove dead shell-hook bindings and keep the active `.claude` runtime JS-only
- [x] 64.1-02-PLAN.md — Wave 2 parity: align allowed `.claude` bin runtime files with canonical `.github` behavior and repo-local `/gsd:...` guidance
- [x] 64.1-03-PLAN.md — Wave 3 guidance: standardize touched `.claude` workflow/help surfaces on `/gsd:...` without pulling 64.2 or 64.3 scope forward

### Phase 64.2: GSD Surface and Instruction Alignment (INSERTED)
**Goal:** Reconcile MarkOS-localized `.claude` agents, templates, and instruction surfaces with the refreshed `.github` framework so Copilot, Claude, and shared GSD workflows stay behaviorally aligned.
**Requirements Mapped:** GSD-ALIGN-04, GSD-ALIGN-05
**Depends on:** Phase 64.1
**Status:** ✅ Verified Passed (2026-04-06)

**Plans:** 4 plans

Plans:
- [x] 64.2-01-PLAN.md — Wave 1 policy foundation: dual-root generation, root `copilot-instructions.md`, installer awareness, and narrow requirements registry sync
- [x] 64.2-02-PLAN.md — Wave 2 canonical shared framework wording: align `.github` workflows, profile skill surfaces, execute-plan, UI flows, and shared agents to the root project `copilot-instructions.md` contract
- [x] 64.2-03-PLAN.md — Wave 2 localized runtime wording: keep `.claude` workflows, profile skill surfaces, execute-plan, UI flows, core agents, and skill dispatch centered on root `CLAUDE.md` while acknowledging the sibling shared contract
- [x] 64.2-04-PLAN.md — Wave 3 targeted regression gate: dual-root generation, installer, execute-plan, UI, update, profile-skill, and instruction-surface policy coverage without pulling 64.3 verification forward

### Phase 64.3: GSD Verification and Customization Closure (INSERTED)
**Goal:** Verify the aligned GSD surfaces end-to-end, refresh manifests or generated artifacts, and document the MarkOS customization boundary before Phase 65 planning resumes.
**Requirements Mapped:** GSD-ALIGN-06, GSD-ALIGN-07
**Depends on:** Phase 64.2
**Status:** ✅ Verified Passed (2026-04-06)

**Artifacts:** `.planning/phases/64.3-gsd-verification-and-customization-closure/64.3-01-SUMMARY.md`, `.planning/phases/64.3-gsd-verification-and-customization-closure/64.3-02-SUMMARY.md`, `.planning/phases/64.3-gsd-verification-and-customization-closure/64.3-03-SUMMARY.md`, `.planning/phases/64.3-gsd-verification-and-customization-closure/64.3-04-SUMMARY.md`, `.planning/phases/64.3-gsd-verification-and-customization-closure/64.3-VERIFICATION.md`, `.planning/phases/64.3-gsd-verification-and-customization-closure/64.3-HUMAN-UAT.md`

**Plans:** 4 plans

Plans:
- [x] 64.3-01-PLAN.md — Wave 1 narrow registry fix: add `GSD-ALIGN-06` and `GSD-ALIGN-07` to `.planning/REQUIREMENTS.md`
- [x] 64.3-02-PLAN.md — Wave 2 deterministic manifest closure: add the repo-local refresh helper and regenerate `.github` and `.claude` manifests
- [x] 64.3-03-PLAN.md — Wave 2 canonical boundary docs: add `.planning/codebase/GSD-CUSTOMIZATION-BOUNDARY.md` and patch inventory visibility in `FILES.md` and `STRUCTURE.md`
- [x] 64.3-04-PLAN.md — Wave 3 end-to-end closure proof: extend focused tests, add manifest freshness coverage, assert decimal-phase roadmap lookup, run the broader repo suite, and record automated plus human follow-through evidence

### Phase 65: Hosted Reporting Closeout and Milestone Promotion
**Goal:** Convert the remaining hosted reporting and live-environment checks into recorded v3.3.0 evidence, promote ATT-01 and REP-01 from repository-passed to satisfied, and close the milestone with honest acceptance records.
**Requirements Mapped:** ATT-01, REP-01
**Depends on:** Phase 64.3
**Status:** 📋 Planned

**Plans:** 3 plans

Plans:
- [ ] 65-01-PLAN.md — Wave 1 closeout contract: reconcile hosted checklist targets, evidence destinations, and requirement-promotion criteria for ATT-01 and REP-01
- [ ] 65-02-PLAN.md — Wave 2 hosted verification capture: execute and record the hosted reporting shell, readiness, attribution drill-down, and live verification checks
- [ ] 65-03-PLAN.md — Wave 3 milestone promotion: update closure matrices and milestone records, then record any remaining external follow-through honestly

### Phase 66: npm release hardening and public publish readiness
**Goal:** Prepare the public MarkOS npm release after v3.3.0 closeout by aligning package versioning to `3.3.0`, hardening the publish path, validating the distributable artifact, and leaving one explicit human-run publish checklist for the final npm push.
**Requirements Mapped:** DX-01, DX-02, OPS-READY-01, CI-01, RBD-01, RBD-02
**Depends on:** Phase 65
**Status:** 📋 Planned

**Plans:** 3 plans

Plans:
- [ ] 66-01-PLAN.md — Wave 1 release contract: align package version, publish metadata, and public release notes to the v3.3.0 milestone boundary
- [ ] 66-02-PLAN.md — Wave 2 distributable validation: prove the packed artifact and `npx markos` install path work from the publishable package contents
- [ ] 66-03-PLAN.md — Wave 3 publish checklist and verification: create the final human-run npm publish workflow, registry verification checklist, and release verdict ledger

---

## 📋 v3.3.1 — Obsidian Mind Vault-First Pivot

**Status:** 📋 Planned future milestone — begins only after Phase 66 finishes the v3.3.0 release lane

**Goal:** Replace the MIR/MSP-first MarkOS operating model with a vault-first system inspired by Obsidian Mind, making the local Obsidian vault the canonical source of context, workflows, memory, dashboards, and operator support.

**Requirements:** VAULT-01, VAULT-02, VAULT-03, BOOT-01, BOOT-02, BOOT-03, BOOT-04, MIG-01, MIG-02, MIG-03, FLOW-01, FLOW-02, FLOW-03, GRAPH-01, GRAPH-02, GRAPH-03, CUT-01, CUT-02

### Phase 67: Vault Taxonomy and Replacement Contract
**Goal:** Define the canonical MarkOS vault taxonomy that replaces MIR/MSP, lock the compatibility boundary, and specify how legacy artifacts import into the new structure.
**Requirements Mapped:** VAULT-01, VAULT-02, VAULT-03, MIG-01
**Depends on:** Phase 66
**Status:** 📋 Planned

### Phase 67.1: Configurable install setup levels with optional onboarding/UI and CLI-only agent mode (INSERTED)

**Goal:** Add deterministic setup profiles (`full`, `cli`, `minimal`) for install and update flows with optional onboarding/UI surfaces, first-class CLI-only mode, and backward-compatible manifest normalization.
**Requirements Mapped:** BOOT-01, BOOT-04
**Depends on:** Phase 67
**Status:** ✅ Complete (2026-04-11)
**Plans:** 3 plans

Plans:
- [x] 67.1-01-PLAN.md — Wave 1 profile contract and install persistence: CLI profile parsing/aliases, deterministic precedence, manifest profile metadata, and legacy-safe default behavior
- [x] 67.1-02-PLAN.md — Wave 2 update normalization and runtime transparency: profile migration-on-update, optional onboarding/UI runtime gating, and status/readiness profile exposure
- [x] 67.1-03-PLAN.md — Wave 3 docs/testing/validation closure: CLI help + README profile parity, install/update profile matrix regressions, and phase validation ledger

### Phase 68: Vault-First Installer and Bootstrap Rewrite
**Goal:** Rework `npx markos` and update or bootstrap flows around vault-first setup, Obsidian dependency checks, optional QMD enablement, and project bootstrap into the new knowledge structure.
**Requirements Mapped:** BOOT-01, BOOT-02, BOOT-03, BOOT-04
**Depends on:** Phase 67
**Status:** 📋 Planned

### Phase 69: Vault-Native Onboarding and Legacy Importer
**Goal:** Replace publish-to-MIR onboarding behavior with vault-native authoring while providing a one-way importer for existing `.markos-local/MIR` and `.markos-local/MSP` users.
**Requirements Mapped:** MIG-01, MIG-02, MIG-03
**Depends on:** Phase 67, Phase 68
**Status:** 📋 Planned
**Plans:** 3 plans

Plans:
- [ ] 69-01-PLAN.md - Wave 1 shared vault authoring engine, importer planning or apply core, and durable Memory report notes
- [ ] 69-02-PLAN.md - Wave 2 browser surfaces: onboarding vault-write rewrite and helper importer UI or routes
- [ ] 69-03-PLAN.md - Wave 2 CLI importer command, entrypoint delegation, and focused regression coverage

### Phase 70: Command, Hook, and Agent Surface Remap
**Goal:** Replace the current MarkOS-first protocol surface with an Obsidian Mind-native operating surface plus explicit marketing overlays.
**Requirements Mapped:** FLOW-01, FLOW-02, FLOW-03
**Depends on:** Phase 67, Phase 68, Phase 69
**Status:** 📋 Planned

### Phase 71: Bases, Evidence, and Marketing Performance Graph
**Goal:** Adapt Obsidian Mind dashboard, evidence, and performance-review concepts to MarkOS marketing execution, campaign memory, and operator reporting.
**Requirements Mapped:** GRAPH-01, GRAPH-02, GRAPH-03, VAULT-03
**Depends on:** Phase 67, Phase 70
**Status:** 📋 Planned

### Phase 72: Legacy Surface Demotion, Documentation Rewrite, and Milestone Validation
**Goal:** Demote MIR/MSP-era surfaces to legacy or migration status, rewrite public and internal docs around the vault-first product, and validate the new milestone end-to-end.
**Requirements Mapped:** CUT-01, CUT-02, VAULT-02, BOOT-04, FLOW-03
**Depends on:** Phase 67, Phase 68, Phase 69, Phase 70, Phase 71
**Status:** 📋 Planned

## ✅ v3.4.0 — Complete Branding Engine (Archived)

**Status:** ✅ Shipped (2026-04-12)
**Archive:** `.planning/milestones/v3.4.0-ROADMAP.md`
**Requirements Archive:** `.planning/milestones/v3.4.0-REQUIREMENTS.md`
**Audit:** `.planning/v3.4.0-MILESTONE-AUDIT.md` (passed, 12/12 requirements)
**Summary:** Delivered deterministic branding pipeline coverage from concept ingestion through strategy, identity, token/system compilation, governance publish or rollback, and final human UAT closure.

---

## 🚧 v3.5.0 — Ultimate Literacy Vault

**Status:** 🚧 Planned milestone — requirements locked, roadmap phases defined

**Goal:** Build a vault-first marketing literacy system with Obsidian Mind as the operator-facing source of truth and PageIndex as the vectorless agentic retrieval engine, replacing legacy Supabase/Upstash retrieval paths.

**Requirements:** VAULT-01, VAULT-02, VAULT-03, LITV-01, LITV-02, LITV-03, LITV-04, ROLEV-01, ROLEV-02, ROLEV-03, ROLEV-04, GOVV-01, GOVV-02, GOVV-03, GOVV-04, GOVV-05

### Phase 84: Vault Foundation (Obsidian Mind + PageIndex Contracts)
**Goal:** Establish hybrid vault structure (disciplines + semantic cross-cutting indices), deterministic pathing, provenance metadata model, and PageIndex-backed retrieval contracts.
**Requirements Mapped:** VAULT-01, VAULT-02, VAULT-03
**Depends on:** Phase 83
**Status:** ✅ Verified PASS (2026-04-12) — wave execution complete with 22/22 Phase 84 tests passing and closure evidence captured in `.planning/phases/84-vault-foundation-obsidian-mind-pageindex-contracts/84-VERIFICATION.md`

### Phase 85: Ingestion Pipeline and Bidirectional Obsidian Sync
**Goal:** Enable Obsidian-driven artifact authoring with automatic backend sync, audit lineage capture, idempotent update behavior, and PageIndex re-indexing.
**Requirements Mapped:** LITV-01, LITV-02, LITV-03, LITV-04
**Depends on:** Phase 84
**Status:** 📋 Planned

### Phase 86: Agentic Retrieval Modes (Reason, Apply, Iterate)
**Goal:** Implement deterministic retrieval contracts for three agentic modes, including audience/discipline filtering and execution handoff payloads with evidence links.
**Requirements Mapped:** ROLEV-01, ROLEV-02, ROLEV-03
**Depends on:** Phase 84, Phase 85
**Status:** 📋 Planned

### Phase 87: Dual Role Views (Operator + Agent)
**Goal:** Separate operator vault management surfaces from agent retrieval/execution views while preserving unified artifact lineage and auditable access logs.
**Requirements Mapped:** ROLEV-04
**Depends on:** Phase 84, Phase 85, Phase 86
**Status:** 📋 Planned

### Phase 88: Governance, Verification, and Milestone Closure
**Goal:** Enforce tenant isolation, capture execution telemetry, validate non-regression against v3.4.0 branding/governance baselines, and close milestone with SLA and sync stability evidence.
**Requirements Mapped:** GOVV-01, GOVV-02, GOVV-03, GOVV-04, GOVV-05
**Depends on:** Phase 84, Phase 85, Phase 86, Phase 87
**Status:** 📋 Planned

---
<details>
<summary>v1.0 — Initial Protocol (Completed 2026-03-23)</summary>

## Phase 1: Template Restructuring
**Goal:** Completely design and augment the current standard planning and templates (MIR/MSP).
**Requirements Mapped:** TPL-01, TPL-02
**Status:** ✅ Complete
**Success Criteria:**
1. MIR templates are agnostic.
2. MSP templates are standardized.

## Phase 2: Agent Deployment & PM Logic (Extension)
**Goal:** Unpack and deploy the agentic team under `.agent/markos/` following the GSD `agents, hooks, skills, bin, references, templates, workflows and VERSION` architecture. Implement Linear Project Management logic.
**Requirements Mapped:** AGT-01, AGT-02
**Status:** ✅ Complete
**Success Criteria:**
1. `markos` folder structure fully mirrors `gsd` (`agents`, `hooks`, `skills`, `bin`, etc.).
2. Linear PM Agents created to check and manage done tasks automatically.

## Phase 3: Marketing Matrix Expansion
**Goal:** Deep augmentation of Phase 1 templates to rival GSD's granular coding workflows. Translate all potential marketing tasks, sub-disciplines, and execution plans (SEO, Lifecycle, Ads, Social, Influencer, PR, etc.) into robust, universally executable protocol modules.
**Requirements Mapped:** TPL-03
**Status:** ✅ Complete
**Success Criteria:**
1. At least 8-10 master sub-marketing disciplines structurally defined as executable templates.
2. Universal workflows capable of onboarding any niche into a specific channel pipeline flawlessly.

---

## Phase 4: Skill Alignment & Local Override Architecture
**Goal:** Align all `markos-*` skills to the new exhaustive template structures and establish the `.markos-local/` client-override directory so that future patches never touch client customizations.
**Requirements Mapped:** SKL-01
**Depends on:** Phase 3
**Status:** ✅ Complete
**Success Criteria:**
1. `markos-new-project`, `markos-plan-phase`, `markos-execute-phase`, and all related skills resolve template paths correctly against the Phase 3 expanded structure.
2. `.markos-local/` override directory convention is defined, documented, and referenced in all relevant agents and hooks — client files placed here survive both GSD and MARKOS patch updates.
3. Skills self-document which template directories they read from and which are client-overridable.
4. `markos-new-project` scaffold creates `.markos-local/` with an onboarding README on first run.

**Plans:**
- [x] 04-01: Audit and align standard skills
- [x] 04-02: `.markos-local` scaffold integration
- [x] 04-03: Self-documentation and Verification

---

## Phase 5: Research Architecture & Tokenization
**Goal:** Build the structured `RESEARCH/` system — a dedicated top-level directory of post-processed, tokenized market and audience intelligence that feeds MIR, MSP, and all downstream content generation. Attach agentic generation to `markos-new-project`.
**Requirements Mapped:** RES-01, RES-02
**Depends on:** Phase 4
**Status:** ✅ Complete
**Success Criteria:**
1. `RESEARCH/` directory scaffolded at project root (peer to `MIR/`, `MSP/`) with 6 canonical research files: `AUDIENCE-RESEARCH.md`, `ORG-PROFILE.md`, `PRODUCT-RESEARCH.md`, `COMPETITIVE-INTEL.md`, `MARKET-TRENDS.md`, `CONTENT-AUDIT.md`.
2. Each file has a fully specified, tokenized template with frontmatter, agent instructions, and explicit cross-references to MIR/MSP fields it populates.
3. An agentic researcher role (`markos-researcher`) reads raw input and writes processed, insight-dense entries — not raw dumps.
4. `markos-new-project` auto-triggers research generation sequence after scaffold.
5. MIR and MSP templates carry RESEARCH token references so planner agents pull live context automatically.

**Plans:**
- [x] 05-01: Research file templates
- [x] 05-02: markos-researcher implementation
- [x] 05-03: MIR and MSP Tokenization
- [x] 05-04: Hooking down to markos-new-project

---

## Phase 6: Web-Based Client Onboarding Engine
**Goal:** Build a lightweight, white-labeled web onboarding UI (step-by-step form) that collects the seed data needed to populate `RESEARCH/`, `MIR/`, and `MSP/` for a new client. Output is a structured JSON seed consumed by agentic generation.
**Requirements Mapped:** ONB-01, ONB-02
**Depends on:** Phase 5
**Status:** ✅ Complete
**Success Criteria:**
1. A self-contained web onboarding app (spun up optionally via CLI during `markos-new-project`) presents a clean multi-step form covering: Company/Brand, Audience, Product/Service, Competitive landscape, Market context, and Content inventory.
2. Submission produces a versioned `onboarding-seed.json` committed to the project.
3. An orchestrator agent reads `onboarding-seed.json` and drives `markos-researcher` to populate all 6 RESEARCH files, then scaffolds MIR and MSP fields with derived values.
4. The UI is white-label ready: logo, colors, and copy are configurable via a simple config file.
5. Form UX is premium and guided — minimal friction, no marketing jargon exposed to clients.

**Plans:**
- [x] 06-01: Web onboarding app scaffold
- [x] 06-02: Backend logic and JSON orchestrator

---

## Phase 7: NPX Patch Engine & Distribution
**Goal:** Package `markos` for NPM. Implement a smart agentic patch engine that installs and updates the MARKOS protocol on top of any existing GSD install — without touching client customizations in `.markos-local/`.
**Requirements Mapped:** NPX-01, NPX-02, PATCH-01
**Depends on:** Phase 6
**Status:** ✅ Complete
**Success Criteria:**
1. `npx markos` runs an interactive CLI wizard (mirrors GSD's install UX) — asks install location, GSD co-existence option, project name — then installs the full MARKOS protocol.
2. The CLI correctly detects an existing GSD install and injects MARKOS commands into the existing `.agent/` structure non-destructively.
3. `npx markos update` applies a minimal patch: agent reads current protocol version, diffs against latest, and applies only changed files — skipping any path listed under `.markos-local/`.
4. Patch conflicts (same file modified by client AND by update) are surfaced to the user with a diff preview — never auto-overwritten.
5. The npm package `markos` is published to the public registry and installable globally or per-project.
6. A `VERSION` file and changelog entry are generated/updated on every install and update.

**Plans:**
- [x] 07-01: Install Wizard
- [x] 07-02: Update logic and diff preview

</details>

<details>
<summary>v1.1.0 — MARKOS Hardening (Completed 2026-03-25)</summary>

## Phase 8: Protocol Hardening, Tokenization & Hybrid Team
**Goal:** Document, tokenize, and categorize the MARKOS protocol to harden, close gaps, remove inconsistencies, and improve the performance of the agents running this protocol to completely own and manage the hybrid (human + AI) team and their tasks.
**Requirements Mapped:** HRD-01, TOK-01, HYB-01
**Depends on:** Phase 7
**Status:** ✅ Complete
**Success Criteria:**
1. All MARKOS templates (MIR, MSP, RESEARCH) use a unified, strict tokenization taxonomy for robust context retrieval.
2. The protocol clearly categorizes tasks by "AI-owned", "Human-owned", and "Hybrid", with clear handoff protocols.
3. Documentation gaps and inconsistencies between tools and templates are resolved.
4. Agent prompts and skill instructions are updated to leverage the new tokenized categories to act as managers rather than just executors.

**Plans:**
- [x] 08-01: Documentation Hardening & Audit
- [x] 08-02: Template Tokenization & Categorization
- [x] 08-03: Hybrid Team Task Delegation Workflow

---

## Phase 9: Protocol Pillars Analysis
**Goal:** Analyze and validate the implementation of the 4 recent foundational pillars (Reaction Squad, Adversarial Debate/Episodic Memory, Generative Task Synthesis, and Event-Driven Defcon) to ensure the model and protocol are perfectly optimized for a hybrid (agentic + human) marketing team.
**Requirements Mapped:** HYB-02, PTL-01
**Depends on:** Phase 8
**Status:** ✅ Complete
**Success Criteria:**
1. The new Reaction Squad (`markos-data-scientist`, `markos-behavioral-scraper`) is fully integrated without conflict.
2. The Red Team Debate & VectorDB Episodic Memory correctly retrieve historical context before execution.
3. The `markos-task-synthesizer` cleanly generates non-hallucinated tasks and maps them to `[API-EXECUTE]`.
4. The Event-Driven Defcon Layer & Monte Carlo Budgeting appropriately trigger fail-safes without stranding the executor.

**Plans:**
- [x] 09-01: Audit reaction agents against live metrics
- [x] 09-02: Validate Red Team Debate rules
- [x] 09-03: Stress-test generative task synthesis
- [x] 09-04: Execute Defcon trigger override test

</details>

<details>
<summary>v1.2.0 + v2.0 Legacy Tracks (Archived)</summary>

## v1.2.0 — Future Integrations

## Phase 10: Multi-Tenant Scale & Telemetry
**Goal:** Optimize MARKOS to seamlessly run across 5-10 distinct isolated brands simultaneously. Build robust output telemetry and cross-client vector segregation.
**Requirements Mapped:** SCL-01, TLM-01
**Depends on:** Phase 9
**Status:** ✅ Complete
**Success Criteria:**
1. CLI smoothly navigates multiple concurrent project profiles perfectly encapsulating context boundaries.
2. Centralized telemetry dashboard reports AI-vs-human execution metrics.

**Plans:**
- [x] 10-01: Vercel Multi-Tenant Architecture Readiness
- [x] 10-02: PostHog Telemetry Integration (Frontend + Backend)

---

## Phase 11: Rich Business-Model Examples (Tier 1)
**Goal:** Enrich the MARKOS protocol so every LLM agent executing a template fill receives a concrete, model-specific reference example alongside client data. business_model captured during onboarding, injected into every prompt.
**Requirements Mapped:** EX-01
**Depends on:** Phase 6 (Onboarding Engine)
**Status:** ✅ Complete
**Success Criteria:**
1. `company.business_model` required field in seed schema v2.1 (7 enum values).
2. Onboarding UI shows/hides conditional fields per model (no inline styles).
3. 28 Tier 1 example files authored (AUDIENCES + ICPs + BRAND-VOICE + CHANNEL-STRATEGY × 7 models).
4. `example-resolver.cjs` injects model-specific example into every filler LLM prompt.
5. Graceful degradation: empty string returned if example file not found.

**Plans:**
- [x] 11-01: Seed schema v2.1 + onboarding UI enrichment
- [x] 11-02: example-resolver.cjs utility
- [x] 11-03: MIR Tier 1 example files (21 files)
- [x] 11-04: MSP Tier 1 example files (7 CHANNEL-STRATEGY files)
- [x] 11-05: Filler agent injection (mir-filler + msp-filler)

---

## Phase 12: Phase 11 Deferred Items Resolution
**Goal:** Complete the three items deferred from Phase 11: Supabase + Upstash Vector business_model persistence, unit test suite for example-resolver, and Tier 2 paid acquisition examples for all 7 business models.
**Requirements Mapped:** EX-02, TEST-01, VECTOR-02
**Depends on:** Phase 11
**Status:** ✅ Complete
**Success Criteria:**
1. `vector-store-client.cjs` stores `business_model` in all section metadata and creates a top-level `markos-{slug}-meta` collection.
2. `test/example-resolver.test.js` passes 8/8 tests covering all slug normalizations, graceful degradation, and injection format.
3. 7 `_PAID-ACQUISITION-{model}.example.md` Tier 2 example files with full 4-sprint paid campaign structure.
4. `generatePaidAcquisition()` wired into `msp-filler.cjs` with example injection.

**Plans:**
- [x] 12-01: vector-store-client.cjs business_model persistence
- [x] 12-02: test/example-resolver.test.js suite (8 tests, all pass)
- [x] 12-03: Tier 2 PAID-ACQUISITION examples × 7 models
- [x] 12-04: generatePaidAcquisition() injected into msp-filler.cjs

---

## Phase 13: Smart Onboarding Engine v2.0
**Goal:** Replace the 7-step batch onboarding form with an intelligent, magic 0-party data pipeline. The system scrapes the client's website (Tavily), parses uploaded files (PDF/DOCX/CSV/TXT/MD), assigns LLM confidence scores to every schema field, and conducts a minimal conversational gap-fill interview — asking only Red/Yellow fields. Business-model-aware routing, "Skip Chat" bailout, AI Spark icon generation, and a full inline-editable Step 7 review dashboard complete the experience.
**Requirements Mapped:** ONB-13-01 → ONB-13-20
**Depends on:** Phase 6 (Onboarding Engine), Phase 12 (Deferred Items)
**Status:** ✅ Complete
**Success Criteria:**
1. Step 0 Omni-Input Gate accepts URL + file drop as the single entry point.
2. Tavily scrapes site (depth 2, 15 pages max), file parsers handle PDF/DOCX/TXT/MD/CSV.
3. Terminal-style live extraction screen shown during processing.
4. LLM confidence scorer maps all extracted data to `onboarding-seed.schema.json v2.1` with R/Y/G scores.
5. Conversational interview asks only Red/Yellow fields using natural-language grouping.
6. LLM cascade: BYOK → Ollama local → manual form (tier 3).
7. AI Spark ✨ popover on all text inputs with 2-3 generated alternatives.
8. "Skip Chat" button available throughout — renders pre-filled traditional form.
9. Auto-enrichment: competitor discovery via Tavily after business model confirmed.
10. Step 7 = full 30-field schema dashboard with inline editing, source badges, and confidence indicators.

**Plans:**
- [x] 13-01: Step 0 Omni-Input Gate + Tavily scraper + file parsers
- [x] 13-02: Confidence scoring engine + LLM extraction pipeline
- [x] 13-03: Conversational interview engine + business model routing
- [x] 13-04: AI Spark icon + LLM cascade (BYOK → Ollama → manual)
- [x] 13-05: Auto-enrichment (competitor discovery) + "Skip Chat" bailout
- [x] 13-06: Step 7 full schema review dashboard + UI/UX polish
- [x] 13-07: Dashboard Trap Fix & Auto-Drafting

---

## Phase 13.1: Onboarding Tech Debt & Optimization
**Goal:** Harden the Phase 13 onboarding engine by addressing critical upgrade risks (template isolation), modularizing backend logic (shared utils), enforcing a granular "Hierarchy of Truth" (Chat > File > Web) in extraction, and optimizing performance through parallel source processing.
**Status:** ✅ Complete
**Success Criteria:**
1. Upgrade Isolation: Onboarding data written to `.markos-local/` instead of `.agent/` templates.
2. Backend Modularity: `utils.cjs` created; `server.cjs` and `handlers.cjs` refactor to use shared JSON/Body logic.
3. Hierarchy of Truth: `extraction-prompt.js` prioritizes Chat over File and Web sources.
4. Performance: Source extraction (URL + Files) runs in parallel using `Promise.all`.
5. Prompts: All hardcoded LLM prompts moved to `prompts/` directory.

**Plans:**
- [x] 13.1-01: Onboarding Hardening & Optimization

## Phase 14: Codebase Mastery (v1.2)
**Goal:** Harden the MARKOS onboarding backend, resolve technical debt, and standardize path resolution across all modules.
**Status:** ✅ Complete
**Success Criteria:**
1. Smart Onboarding Engine v2.0 hardened and production-ready.
2. Path resolution standardized via `path-constants.cjs` to prevent "dot-hell" bugs.
3. API payload structures harmonized between frontend and backend.

**Plans:**
- [x] 14-01: Backend Hardening & Path Standardization

---

## Phase 15: Strategic Enrichment & Asset Reference Architecture
**Goal:** Establish a strict separation between the Data/Context layer (MIR/MSP) and the Execution layer (Prompts). Enrich the MIR with business model physics (Lean Canvas) and buyer psychology (JTBD Matrix).
**Status:** ✅ Complete
**Success Criteria:**
1. Dual-Engine Business Framework implemented (Lean Canvas + JTBD Matrix).
2. Centralized agent prompt registry with token injection logic.
3. Local "Winners" repository for anchoring agent generation to historical performance.
4. "Read-Catalog-First" boot sequence enforced for all creator agents.

**Plans:**
- [x] 15-01: Strategic Enrichment pass

---

## Phase 16: Documentation Enrichment
**Goal:** Optimize the MARKOS documentation for both human maintainers and autonomous LLM agents via inline notes, instruction precision, and context hardening.
**Status:** ✅ Complete
**Success Criteria:**
1. Codebase enriched with `/** @llm_context ... */` blocks in critical modules.
2. All specialized prompts updated with Failure Mode Awareness and Context Relays.
3. Protocol lore deep-linked via `file:///` URIs.
4. Gold-standard behavioral examples catalog created.

**Plans:**
- [x] 16-01: Documentation & Context Enrichment

</details>

---

<details>
<summary>v2.0.0 MarkOS Rebrand (Deferred Track)</summary>

## v2.0.0 — MarkOS Rebrand (MARKOS → MarkOS)

> **Identity Migration:** Complete rebrand from "markos" / "MARKOS" to **MarkOS** — the Marketing Operating System by esteban.marketing. Every command, agent, directory, config, token ID, and public reference is migrated. Zero legacy terms remain in the codebase.
>
> **Research:** [.planning/research/rebrand/RESEARCH-SUMMARY.md](.planning/research/rebrand/RESEARCH-SUMMARY.md)

---

### Phase 17: NPM Identity & CLI Rebrand
**Goal:** Migrate the npm package identity, CLI bin entries, and install/update scripts from `markos`/`markos` to `markos`. Publish a deprecation bridge on the old package name.
**Requirements Mapped:** RBD-01, RBD-02
**Depends on:** Phase 16
**Status:** ✅ Complete (2026-04-03)
**Success Criteria:**
1. `package.json` name changed to `markos`, bin entry `markos` → `./bin/install.cjs`.
2. Legacy bin alias `markos` retained for one major version as backward compat.
3. `npx markos install` and `npx markos update` work end-to-end.
4. Old `markos` npm package publishes a deprecation notice pointing to `markos`.
5. Keywords, homepage, description, and prepublishOnly script updated.
6. `VERSION` bumped to `2.0.0`.

**Plans:**
- [x] 17-01: Verify npm name availability (`npm view markos`) + reserve fallback
- [x] 17-02: Update package.json identity (name, bin, keywords, homepage, description, scripts)
- [x] 17-03: Update bin/install.cjs and bin/update.cjs display text, banner, and npx commands
- [x] 17-04: Publish deprecation bridge on old `markos` package

---

### Phase 18: Directory & File Structure Migration
**Goal:** Rename all MARKOS-branded directories and files to MarkOS equivalents using atomic `git mv` operations. This is the largest single change: 383+ files.
**Requirements Mapped:** RBD-03, RBD-04
**Depends on:** Phase 17
**Status:** ✅ Complete (2026-04-03)
**Success Criteria:**
1. `.agent/markos/` → `.agent/markos/` (317 files).
2. All 39 agent files renamed: `markos-*.md` → `markos-*.md`.
3. All 25 skill directories renamed: `markos-*/` → `markos-*/`.
4. 20 Linear task templates renamed: `MARKOS-ITM-*.md` → `MARKOS-ITM-*.md`.
5. 1 workflow file renamed: `markos-linear-sync.md` → `markos-linear-sync.md`.
6. 1 bin file renamed: `markos-tools.cjs` → `markos-tools.cjs`.
7. `MARKOS-INDEX.md` → `MARKOS-INDEX.md`.
8. `.markos-project.json` → `.markos-project.json`.
9. `.markos-install-manifest.json` → `.markos-install-manifest.json`.
10. Git history preserved via `git mv`.

**Plans:**
- [x] 18-01: Rename `.agent/markos/` → `.agent/markos/` (top-level git mv)
- [x] 18-02: Rename all 39 agent files (`markos-*.md` → `markos-*.md`)
- [x] 18-03: Rename all 25 skill directories (`markos-*/` → `markos-*/`)
- [x] 18-04: Rename ITM templates, workflow file, bin tool, and index
- [x] 18-05: Rename root config files (`.markos-project.json`, `.markos-install-manifest.json`)

---

### Phase 19: Token System & Agent Identity Migration
**Goal:** Migrate all 100+ internal token IDs from `MARKOS-*` prefix to `MARKOS-*` and update the master registry (MARKOS-INDEX.md). Update all agent/skill/hook/workflow frontmatter `name:` fields.
**Requirements Mapped:** RBD-05, RBD-06
**Depends on:** Phase 18
**Status:** ✅ Complete (2026-04-03)
**Success Criteria:**
1. `MARKOS-INDEX.md` fully regenerated with all `MARKOS-AGT-*`, `MARKOS-SKL-*`, `MARKOS-ITM-*`, `MARKOS-HKP-*`, `MARKOS-WFL-*`, `MARKOS-PRM-*`, `MARKOS-REF-*`, `MARKOS-TPL-*` token IDs.
2. All 39 agent files have `name: markos-*` in frontmatter.
3. All 25 skill SKILL.md files have `name: markos-*`.
4. All 5 hook files have updated token IDs.
5. All 7 prompt files have updated token IDs.
6. All cross-references between agents resolve correctly.
7. Validation: `grep -r "MARKOS-" .agent/markos/` returns zero results.

**Plans:**
- [x] 19-01: Scripted find-replace of all `MARKOS-` → `MARKOS-` token prefixes across `.agent/markos/`
- [x] 19-02: Update all agent frontmatter `name:` fields (`markos-*` → `markos-*`)
- [x] 19-03: Update all skill SKILL.md frontmatter `name:` fields
- [x] 19-04: Regenerate MARKOS-INDEX.md master registry
- [x] 19-05: Cross-reference validation scan (zero MARKOS- tokens remaining)

---

### Phase 20: Code Path, Config & Data Layer Updates
**Goal:** Update all hardcoded paths in backend .cjs files, onboarding config, Supabase + Upstash Vector namespace patterns, telemetry identifiers, and localStorage keys to use MarkOS naming.
**Requirements Mapped:** RBD-07, RBD-08, RBD-09
**Depends on:** Phase 18
**Status:** ✅ Complete (2026-04-03)
**Success Criteria:**
1. All 15+ backend `.cjs` files updated: path constants, string literals, comments referencing `markos`/`markos`.
2. `onboarding-config.json` updated: `project_slug`, `mir_output_path`, `msp_output_path`.
3. `vector-store-client.cjs` namespace pattern changed: `markos-{slug}` → `markos-{slug}` (6 locations).
4. `telemetry.cjs` updated: `MARKOS_TELEMETRY` env var (with `MARKOS_TELEMETRY` fallback), `markos-backend-telemetry` as `$lib`.
5. `onboarding.js` localStorage keys updated with migration from old keys.
6. `write-mir.cjs` generated content stamps updated: `<!-- markos-generated -->` and `Generated by MarkOS AI`.
7. `onboarding-seed.schema.json` title updated.
8. All tests pass after changes.

**Plans:**
- [x] 20-01: Update path-constants.cjs and all backend path references
- [x] 20-02: Update onboarding-config.json and handlers.cjs defaults
- [x] 20-03: Update vector-store-client.cjs namespace pattern (with backward-compat detection)
- [x] 20-04: Update telemetry.cjs (dual env var support)
- [x] 20-05: Update onboarding.js localStorage keys (with migration)
- [x] 20-06: Update write-mir.cjs generated content stamps
- [x] 20-07: Run full test suite and fix breakages

---

### Phase 21: Documentation, UI & Public-Facing Rebrand
**Goal:** Update all documentation, architecture diagrams, protocol-lore, onboarding UI, and public-facing content to reflect the MarkOS brand. Zero mentions of "MARKOS" or "markos" remain outside of historical milestone records.
**Requirements Mapped:** RBD-10, RBD-11
**Depends on:** Phase 20
**Status:** ✅ Complete (2026-04-03)
**Success Criteria:**
1. `README.md` fully MarkOS-branded: install commands, agent names, architecture, badge URLs.
2. `CHANGELOG.md` updated with MarkOS header + v2.0.0 rebrand entry.
3. `ARCH-DIAGRAM.md` and `TECH-MAP.md` fully updated.
4. All 7 `.protocol-lore/` files updated (QUICKSTART, CONVENTIONS, ARCHITECTURE, WORKFLOWS, CODEBASE-MAP, TEMPLATES, MEMORY).
5. `onboarding/index.html` title updated to "MarkOS Onboarding".
6. `.planning/ROADMAP.md` title updated. `.planning/REQUIREMENTS.md` updated.
7. All 60+ MIR/MSP template override path notes updated (`.markos-local/` → `.markos-local/`).
8. RESEARCH/ files updated where they reference MARKOS.
9. `.markos-local/` client content updated where it references MARKOS.
10. Validation: `grep -r "markos\|markos" --include="*.md" --include="*.json" --include="*.js" --include="*.cjs" --include="*.html" --include="*.css"` returns only historical milestone files.

**Plans:**
- [x] 21-01: Update README.md, CHANGELOG.md, VERSION
- [x] 21-02: Update ARCH-DIAGRAM.md and TECH-MAP.md
- [x] 21-03: Update all .protocol-lore/ files
- [x] 21-04: Scripted update of 60+ MIR/MSP template override path notes
- [x] 21-05: Update RESEARCH/ files and .markos-local/ client content (now .markos-local/)
- [x] 21-06: Update onboarding UI (index.html title, CSS if needed)
- [x] 21-07: Update .planning/ files (ROADMAP title, REQUIREMENTS)

---

### Phase 22: Migration Logic & Backward Compatibility
**Goal:** Implement migration paths in install.cjs and update.cjs so existing MARKOS installs seamlessly upgrade to MarkOS. Handle Supabase + Upstash Vector collection migration, `.markos-local/` → `.markos-local/` auto-migration, manifest migration, and .gitignore updates.
**Requirements Mapped:** RBD-12, RBD-13, RBD-14
**Depends on:** Phase 20, Phase 21
**Status:** ✅ Complete (2026-04-03)
**Success Criteria:**
1. `bin/install.cjs` detects existing `.agent/markos/` and auto-migrates to `.agent/markos/`.
2. `bin/update.cjs` detects old `.markos-install-manifest.json` and migrates to `.markos-install-manifest.json`.
3. `.markos-local/` auto-migrated to `.markos-local/` (move, not copy — no data loss).
4. `.markos-project.json` auto-migrated to `.markos-project.json`.
5. Supabase + Upstash Vector migration function: detects `markos-*` collections, creates `markos-*` equivalents, copies data, deletes old.
6. `.gitignore` updated to include both old and new patterns during transition.
7. `onboarding.js` checks both old and new localStorage keys.
8. PostHog telemetry supports both `MARKOS_TELEMETRY` and `MARKOS_TELEMETRY` env vars.
9. End-to-end test: old install → new update → verify everything migrated.

**Plans:**
- [x] 22-01: install.cjs migration detection (old → new directory auto-rename)
- [x] 22-02: update.cjs manifest migration logic
- [x] 22-03: .markos-local/ → .markos-local/ auto-migration
- [x] 22-04: .markos-project.json → .markos-project.json migration
- [x] 22-05: Supabase + Upstash Vector collection migration function
- [x] 22-06: .gitignore dual-pattern support
- [x] 22-07: End-to-end migration test (old install → new update)

---

</details>

<details>
<summary>✅ v2.1.0 — Product Hardening & Identity Convergence (Shipped 2026-03-28)</summary>

> **5 phases (23–27) · 20 plans · Shipped 2026-03-28**
>
> Stabilized MarkOS as a local-first marketing OS: aligned identity across package metadata and runtime, hardened shared handler behavior, added fixture-backed extraction/merge tests, formalized Vector Store memory namespace rules, and defined the onboarding-to-execution readiness contract.

---

### Phase 23: Identity Normalization
**Goal:** Normalize the product identity across package metadata, runtime messages, manifests, local directories, and documentation while preserving backward compatibility for existing MARKOS installs.
**Requirements Mapped:** IDN-01, IDN-02, IDN-03
**Depends on:** Phase 16
**Status:** Complete
**Artifacts:** `.planning/phases/23-identity-normalization/23-IDENTITY-AUDIT.md`, `.planning/phases/23-identity-normalization/23-COMPATIBILITY-CONTRACT.md`, `.planning/phases/23-identity-normalization/23-VERIFICATION.md`
**Success Criteria:**
1. Public product identity is consistently MarkOS across package metadata, installer/update UX, docs, and onboarding copy.
2. Legacy MARKOS paths and identifiers are cataloged and handled through explicit compatibility logic rather than ad hoc references.
3. MarkOS/MARKOS terminology is reduced to intentional compatibility and historical contexts only.
4. A migration map exists for paths, manifests, local state, telemetry keys, and vector namespaces.

**Plans:**
- [x] 23-01: Audit and classify all remaining MARKOS identifiers by compatibility-critical vs cosmetic
- [x] 23-02: Normalize package/runtime copy and public-facing docs to MarkOS-first language
- [x] 23-03: Define compatibility contract for paths, manifests, env vars, localStorage keys, and Vector Store namespaces
- [x] 23-04: Add validation checks to prevent accidental reintroduction of mixed identity strings

---

### Phase 24: Runtime Hardening (Local + Hosted)
**Goal:** Harden the shared runtime between the local onboarding server and Vercel-style API wrappers so behavior stays consistent across environments.
**Requirements Mapped:** RTH-01, RTH-02, RTH-03
**Depends on:** Phase 23
**Status:** Complete
**Artifacts:** `.planning/phases/24-runtime-hardening/24-DEPLOYMENT-CONTRACT.md`, `.planning/phases/24-runtime-hardening/24-VERIFICATION.md`
**Success Criteria:**
1. Shared handler behavior is consistent across `server.cjs` and `api/*.js` entrypoints.
2. Filesystem writes, slug handling, and config resolution behave predictably in both local and hosted contexts.
3. Environment-sensitive operations are isolated behind explicit guards rather than spread through business logic.
4. Hosted-path assumptions are validated by tests or documented constraints.

**Plans:**
- [x] 24-01: Audit all local-only and hosted-only code paths in handlers and server entrypoints
- [x] 24-02: Centralize config precedence and environment detection logic
- [x] 24-03: Add runtime coverage for local server mode and API-wrapper mode
- [x] 24-04: Document deployment constraints for approve/write flows and persistence expectations

---

### Phase 25: Onboarding Quality & Merge Safety
**Goal:** Improve extraction quality, confidence routing, regeneration ergonomics, and approved-draft merge safety so the first-run onboarding experience is reliably strong.
**Requirements Mapped:** ONQ-01, ONQ-02, ONQ-03
**Depends on:** Phase 24
**Status:** Complete
**Success Criteria:**
1. Source extraction quality and confidence scoring are validated with representative fixtures.
2. Regeneration and approval flows are easier to reason about and safer under partial failure.
3. `write-mir.cjs` merge behavior is protected by fixture-based tests covering header drift and fallback paths.
4. Known noisy warnings and weak-fallback paths are reduced or explicitly documented.

**Plans:**
- [x] 25-01: Add extraction and scoring fixtures for URL, file, and mixed-source onboarding inputs
- [x] 25-02: Add approval/merge tests for template variance and fallback insertion cases
- [x] 25-03: Tighten regenerate/approve error reporting and user-facing statuses
- [x] 25-04: Burn down test-time warnings and document any intentional fallback behavior

**Residual Onboarding Warning Behavior:**
- Regenerate and approve now emit explicit outcome states: `success`, `warning`, `degraded`, `failure`.
- Header fallback append remains intentional when fuzzy matching cannot safely place approved content.
- Hosted approve/write attempts remain guarded by `LOCAL_PERSISTENCE_UNAVAILABLE`.
- Provider unavailability can still return static fallback drafts, surfaced as degraded outcomes.

---

### Phase 26: Memory, Namespace & Multi-Tenant Operations
**Goal:** Formalize the product's memory layer around Vector Store namespaces, local/cloud operating modes, migration safety, and cross-project isolation.
**Requirements Mapped:** MMO-01, MMO-02, MMO-03
**Depends on:** Phase 23, Phase 24
**Status:** Complete
**Artifacts:** `.planning/phases/26-memory-namespace-multi-tenant-operations/26-VERIFICATION.md`
**Success Criteria:**
1. Namespace rules for project slugs, draft collections, and compatibility reads are explicit and enforced.
2. Local and cloud Vector Store operating modes are documented and exercised through health and migration logic.
3. Existing data remains discoverable during identity or namespace transitions.
4. Cross-project isolation guarantees are clear enough to support multi-tenant usage safely.

**Plans:**
- [x] 26-01: Document and codify Vector Store collection naming and compatibility-read behavior
- [x] 26-02: Add migration-safe namespace handling for legacy and MarkOS-prefixed collections
- [x] 26-03: Expand health checks and failure reporting for local vs cloud vector backends
- [x] 26-04: Add multi-project test coverage or simulation around slug isolation

---

### Phase 27: Execution Loop & Telemetry Expansion
**Goal:** Strengthen post-onboarding execution by deepening prompt execution flows, winner anchoring, and operational telemetry instead of stopping at draft generation.
**Requirements Mapped:** EXE-01, EXE-02, TLM-02
**Depends on:** Phase 25, Phase 26
**Status:** Complete
**Artifacts:** `.planning/phases/27-execution-loop-telemetry-expansion/27-01-SUMMARY.md`, `.planning/phases/27-execution-loop-telemetry-expansion/27-02-SUMMARY.md`, `.planning/phases/27-execution-loop-telemetry-expansion/27-03-SUMMARY.md`, `.planning/phases/27-execution-loop-telemetry-expansion/27-04-SUMMARY.md`
**Success Criteria:**
1. Downstream execution workflows consume approved MIR/MSP state predictably.
2. Winner catalogs and prompt injection are validated as first-class execution inputs.
3. Telemetry focuses on actionable operational checkpoints rather than generic event volume.
4. The product demonstrates a clear path from onboarding to repeatable execution loops.

**Plans:**
- [x] 27-01: Define the minimum post-onboarding execution loop and its required inputs
- [x] 27-02: Validate winners-catalog boot requirements across creator/executor flows
- [x] 27-03: Add telemetry around approval, execution readiness, and major failure points
- [x] 27-04: Produce a handoff spec tying onboarding outputs to execution workflows

</details>

---

## ? v2.2 � Platform Engineering (Shipped 2026-03-28)

> **4 phases (28-31) � 13 plans � Shipped 2026-03-28**
>
> Focus: critical runtime stability, operational workflow enablement, concrete MarkOSDB migration, and rollout hardening for agency-wide adoption.
>
> **Status:** Production Ready � All 13 Requirements Satisfied � 43/43 Tests Pass � 6/6 Integration Flows Complete

---

### Phase 28: Runtime Integrity (P0)
**Goal:** Eliminate onboarding-blocking runtime failures and private-data protection gaps before external rollout.
**Requirements Mapped:** P0-01, P0-02, P0-03
**Depends on:** Phase 27
**Status:** ? Complete (2026-03-28)
**Artifacts:** `.planning/phases/28-runtime-integrity/28-CONTEXT.md`, `.planning/phases/28-runtime-integrity/28-REQUIREMENTS.md`, `.planning/phases/28-runtime-integrity/28-RESEARCH.md`, `.planning/phases/28-runtime-integrity/28-VERIFICATION.md`
**Plans:**
- [x] 28-01: Approve path resolver hardening
- [x] 28-02: Node runtime contract alignment (`>=20.16.0`)
- [x] 28-03: Private-data `.gitignore` protection injection

---

### Phase 29: Operational Enablement (P1)
**Goal:** Deliver agency-operational workflows and remove onboarding dead-ends.
**Requirements Mapped:** P1-01, P1-02, P1-03
**Depends on:** Phase 28
**Status:** ? Complete (2026-03-28)
**Artifacts:** `.planning/phases/29-operational-enablement/29-CONTEXT.md`, `.planning/phases/29-operational-enablement/29-REQUIREMENTS.md`, `.planning/phases/29-operational-enablement/29-RESEARCH.md`, `.planning/phases/29-operational-enablement/29-VERIFICATION.md`
**Plans:**
- [x] 29-01: Linear API client + `/linear/sync` integration
- [x] 29-02: Winners catalog write path + `/campaign/result`
- [x] 29-03: Interview cap (5 questions) + auto-proceed UX

### Phase 30: MarkOSDB Migration (P1.5/P2)
**Goal:** Build concrete migration from local compatibility artifacts into Supabase + Upstash cloud-canonical contracts.
**Requirements Mapped:** MDB-01, MDB-02, MDB-03
**Depends on:** Phase 29
**Status:** ? Complete (2026-03-28)
**Artifacts:** `.planning/phases/30-markosdb-migration/30-CONTEXT.md`, `.planning/phases/30-markosdb-migration/30-REQUIREMENTS.md`, `.planning/phases/30-markosdb-migration/30-RESEARCH.md`, `.planning/phases/30-markosdb-migration/30-VERIFICATION.md`
**Plans:**
- [x] 30-01: MarkOSDB schema and adapter contracts
- [x] 30-02: Local-to-cloud ingestion pipeline
- [x] 30-03: Next.js + Supabase auth boundary integration

1. Compatibility retirement remains a manual operator decision recorded in .planning/phases/31-rollout-hardening/31-COMPATIBILITY-DECISIONS.json.

2. Protocol tests, hosted auth boundaries, migration determinism, and downstream cloud-readiness remain recommended evidence inputs, but no hard minimum evidence count is required before retirement.

3. Every retirement decision must include an owner, rationale, and rollback path so legacy surfaces can be restored if a rollout regression appears.

<!-- EOF -->
