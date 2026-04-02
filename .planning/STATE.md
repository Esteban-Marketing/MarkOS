---
gsd_state_version: 1.0
milestone: v2.4
milestone_name: Beta Client Onboarding
status: complete
last_updated: "2026-04-02"
progress:
  total_phases: 25
  completed_phases: 9
  total_plans: 45
  completed_plans: 34
---

Current Position
----------------

Milestone: v3.1.0 — Operator Surface Unification
Phase: 45 — Operations Flow Inventory & Canonical Contract Map (COMPLETE)
Status: All 6 plans executed and verified. 17 flows registered, 17 contracts validated, test suite 19/19. Baseline approved.
Next Phase: Phase 46 — (next in v3.1.0 milestone)

Tooling Snapshot
----------------

- Active milestone (v3.0) progress: Phases 39 through 44 complete and verified; literacy lifecycle is now regression-gated.
- Global disk snapshot (all non-archived phase dirs): latest execution artifacts include 43 and 44 validation/verification bundles.
- Deferred roadmap track: v2.0 rebrand phases (17-22) remain intentionally unexecuted.

Milestone v3.0 Focus
--------------------

🎯 Maintain stable literacy activation readiness from onboarding submit/status through draft generation
🎯 Preserve deterministic coverage telemetry and parity across local and hosted routes
🎯 Keep zero-hit regression checks enforced in focused and CI execution paths
🎯 Define the v3.0 follow-on scope after full lifecycle hardening

MIR Gate Status
---------------
MIR Gate 1: ✅ GREEN (PROFILE, VOICE-TONE, MESSAGING-FRAMEWORK, LEAN-CANVAS, JTBD-MATRIX)
MIR Gate 2: ✅ GREEN (TRACKING, AUTOMATION, KPI-FRAMEWORK, PAID-MEDIA)

Scaffold Status
---------------

- [x] .planning/MIR — 78 files cloned from templates/MIR
- [x] .planning/MSP — 80 files cloned from templates/MSP
- [x] .markos-local/MIR — client override path present
- [x] .markos-local/MSP — discipline directories + WINNERS catalogs
- [x] RESEARCH/ — 6 intelligence files scaffolded
- [x] .gitignore — .markos-local/, onboarding-seed.json, .markos-install-manifest.json excluded
- [x] .planning/config.json — all 10 disciplines activated
- [x] Gate 1 intake — PROFILE, VOICE-TONE, MESSAGING-FRAMEWORK, LEAN-CANVAS, JTBD-MATRIX (complete)
- [x] Gate 2 intake — TRACKING, AUTOMATION, KPI-FRAMEWORK, PAID-MEDIA (complete)

Client: MarkOS
--------------
Product: Marketing Operating System (npx one-command install)
Model: SaaS — freemium + per seat + usage-based
Stage: Pre-revenue | Geography: Global (English)
90-day goals: 200 NPX installs, 10 paid pilots
Budget: $0 (organic only)

Accumulated Context
-------------------

Roadmap Evolution
-----------------

- Phase 1-7 (v1.0.0) successfully archived on 2026-03-23.
- SOP-006: AI-Enhanced Client Onboarding (Supabase + Upstash Vector + AI Drafts) implemented and committed on 2026-03-24.
- Phase 8 & 9 (v1.1.0 Protocol Hardening) resolved correctly.
- Phase 10: Multi-tenant scale milestone initialized.
- Phase 11 (rich-examples) complete: seed schema v2.1, conditional onboarding UI, `example-resolver.cjs`, 28 Tier 1 example files (MIR + MSP), injection into fillers.
- Phase 12 (deferred items) complete: `vector-store-client.cjs` business_model persistence, 8-test `example-resolver.test.js` suite (all pass), 7 Tier 2 PAID-ACQUISITION examples, `generatePaidAcquisition()` wired into `msp-filler.cjs`.
- Phase 13 (smart-onboarding) complete: Schema v2.1, 28 examples, parallel extraction, AI interview loop validated.
- Phase 14 (codebase-mastery) complete: Installer hardened, path resolution standardized via `path-constants.cjs`, API payloads harmonized, 100% test pass.
- Phase 15 (strategic-enrichment) complete: Dual-engine framework (Lean Canvas + JTBD), decoupled execution layer (Prompts), and winners repository architecture.
- Phase 16 (documentation-enrichment) complete: added llm_context blocks to orchestrator/llm-adapter, hardened 7 specialized prompts with failure/context sections, deep-linked protocol lore, and created GOLD-STANDARD interaction catalog.
- 2026-03-28: research set refreshed from codebase reality; roadmap pivoted so v2.1 product hardening supersedes rename-only sequencing as the recommended next milestone.
- 2026-03-28: Phase 23 identity normalization completed with a documented compatibility contract and guardrail tests.
- 2026-03-28: Phase 24 completed with centralized runtime-context handling, explicit hosted approve/write guards, runtime parity test coverage, and a deployment constraints contract.
- 2026-03-28: Phase 25 completed with extraction/scoring fixtures, merge safety contract tests, explicit regenerate/approve outcome states, and residual warning behavior documentation.
- 2026-03-28: Phase 26 completed with explicit namespace contract helpers, migration-safe compatibility reads, mode-aware Vector Store health reporting, and multi-project isolation coverage.
- 2026-03-28: Phase 27 completed with explicit onboarding-to-execution readiness contract, winners-anchor boot validation, and narrow execution checkpoint telemetry.
- 2026-03-28: v2.2 planned with Phase 28 (P0 runtime integrity), Phase 29 (P1 operational enablement), Phase 30 (MarkOSDB migration), and Phase 31 (rollout hardening).
- 2026-03-28: Phase 29 completed with `/linear/sync` ITM-to-Linear issue creation, `/campaign/result` winners catalog + outcome metadata loop, and interview flow hard cap at 5 questions with auto draft transition.
- 2026-03-28: Phase 31 completed with rollout hardening evidence captured for endpoint reliability contracts, migration dry-run/idempotent safety, hosted auth guardrails, and compatibility deprecation gates.
- 2026-03-29: Phase 30 completed with MarkOSDB migration contracts, dry-run/replay coverage, hosted auth boundaries, and compatibility reads verified.
- 2026-03-31: Phase 32 completed with literacy storage contracts, ingestion/admin tooling, runtime wiring, and literacy operations docs.
- 2026-03-31: Phase 33 completed with canonical `.planning/codebase/` docs, route and entrypoint inventories, and protocol-summary parity checks.
- 2026-03-31: Phase 34 completed with intake validation contracts, automatic Linear ticket creation, orchestrator handoff metadata, and intake operations docs.
- 2026-04-01: v2.5 initialized in roadmap/project state for installer optimization and one-command deployment hardening.
- 2026-04-01: Phase 35 research completed and `.planning/phases/35-smart-one-command-deployment/35-PLAN.md` created for execution.
- 2026-04-01: Phase 35 completed with a shared CLI runtime contract, default-first install flow, readiness classification, docs parity updates, and 99/99 tests passing.
- 2026-04-01: v2.5 formally archived with milestone report `.planning/milestones/v2.5-REPORT.md`; state advanced to v2.6 planning.
- 2026-04-01: Prioritization updated to return to deferred beta-operations work after Phase 34; active milestone reset to v2.4.
- 2026-04-01: Phase 36 beta-operations execution plan created at `.planning/phases/36-beta-program-operations/36-PLAN.md`.
- 2026-04-01: Phase 36 completed with runbook, KPI scorecard, weekly cadence contracts, and PLG evidence-loop integration.
- 2026-04-01: Phase 37 research completed at `.planning/phases/37-markos-ui-control-plane/37-RESEARCH.md`, defining the Next.js/Tailwind/Supabase control-plane, white-label design-system linkage, and AI-consumable documentation twin architecture.
- 2026-04-01: Phase 37 execution plan created at `.planning/phases/37-markos-ui-control-plane/37-PLAN.md`.
- 2026-04-01: Phase 37 completed with MarkOS app route scaffold, domain contracts, theme token pipeline, RBAC/telemetry contracts, Supabase migration baseline, and `.planning/phases/37-markos-ui-control-plane/37-01-SUMMARY.md`.
- 2026-04-01: Phase 38 planned and executed under v2.6 with Storybook coverage, Chromatic publishing, accessibility enforcement, UI security gates, and CI workflow hardening.
- 2026-04-01: Phase 38 verification passed; v2.6 is now the active milestone baseline rather than deferred planning inventory.
- 2026-04-02: Phase 40 completed with deterministic discipline routing, pain-point OR filter support, top-3 dual-query literacy retrieval, doc_id-first dedupe, fixed context-budget enforcement, and literacy retrieval telemetry.
- 2026-04-02: Phase 43 completed with post-submit literacy activation readiness evaluation, submit/status readiness parity, and activation telemetry contracts.
- 2026-04-02: Phase 44 completed with lifecycle E2E verification, literacy coverage API contract enforcement, populated-corpus zero-hit regression gating, and CI integration.
