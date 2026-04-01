---
gsd_state_version: 1.0
milestone: v2.4
milestone_name: Beta Client Onboarding
status: completed
last_updated: "2026-04-01T14:44:56.411Z"
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 11
  completed_plans: 11
---

Current Position
----------------

Milestone: v2.4 — Beta Client Onboarding
Phase: 37 — MarkOS UI Control Plane + White-Label System (COMPLETED)
Status: Phase 37 execution completed with app scaffold, contracts, theming linkage, RBAC/telemetry, and Supabase RLS baseline.
Next Phase: Define and plan next milestone follow-on scope.

Tooling Snapshot
----------------

- Active milestone (v2.4) progress: Phase 34 and Phase 36 complete; campaign activation is next.
- Global disk snapshot (all non-archived phase dirs): Phase 34 complete; Phase 35 complete and verified.
- Deferred roadmap track: v2.0 rebrand phases (17-22) remain intentionally unexecuted.

Milestone v2.4 Focus
--------------------

🎯 Resume beta program operations after intake automation foundation
🎯 Convert intake submissions into active pilot client rhythms
🎯 Execute campaign activation and build-in-public operating cadence
🎯 Keep installer/runtime gains from v2.5 as baseline, not active milestone scope

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
- 2026-04-01: Phase 37 completed with MarkOS app route scaffold, domain contracts, theme token pipeline, RBAC/telemetry contracts, Supabase migration baseline, and `.planning/phases/37-markos-ui-control-plane/37-SUMMARY.md`.
