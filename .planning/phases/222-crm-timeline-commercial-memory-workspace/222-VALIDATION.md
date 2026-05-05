---
phase: 222
slug: crm-timeline-commercial-memory-workspace
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 222 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `222-RESEARCH.md` §Validation Architecture. Plans populate per-task rows.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (primary)** | Node.js `--test` (`npm test`) — D-39 (vitest DEFERRED) |
| **Framework (legacy regression)** | (same as primary — `npm test`) |
| **E2E framework** | Playwright DEFERRED per D-39; manual operator journeys + Chromatic visual regression for P222 |
| **Visual regression** | Chromatic via Storybook |
| **Test runner config** | `package.json` `test` script invokes `node --test` (no extra config needed) |
| **Playwright config** | n/a (Playwright DEFERRED per D-39) |
| **Quick run command** | `node --test test/crm360/*.test.js` |
| **Full suite command** | `npm test && npx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN --exit-zero-on-changes` (Playwright DEFERRED per D-39) |
| **Estimated runtime** | ~90s quick, ~5 min full (Chromatic visual gate + node:test regression; Playwright DEFERRED) |

---

## Sampling Rate

- **After every task commit:** `node --test test/crm360/<slice-domain>*.test.js`
- **After every plan wave:** `node --test test/crm360/*.test.js && npm test`
- **Before `/gsd:verify-work`:** Full suite (`npm test` + Chromatic visual gate + manual operator journeys) green; Playwright DEFERRED per D-39
- **Max feedback latency:** 90s (quick), 8 min (full)

---

## Per-Task Verification Map

> Planner populates per task. Template row below.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 222-01-01 | 01 | 1 | CRM-01, CRM-02, CDP-02, CDP-05, QA-02 | wave-0 + unit + integration + migration | `node --test test/crm360/customer360.test.js test/crm360/opportunity.test.js` | ⬜ TBD | ⬜ pending |
| 222-01-02 | 01 | 1 | CRM-01, CRM-05, QA-01 | unit + integration + contract | `node --test test/crm360/legacy-adapter.test.js test/crm360/pricing-guard.test.js` | ⬜ TBD | ⬜ pending |
| 222-02-01 | 02 | 2 | CRM-01, CRM-03, QA-02 | unit + integration | `node --test test/crm360/lifecycle.test.js test/crm360/stage-router.test.js` | ⬜ TBD | ⬜ pending |
| 222-02-02 | 02 | 2 | CRM-03, CDP-04, TASK-02, QA-01 | unit + integration + contract | `node --test test/crm360/emit.test.js test/crm360/multi-role-ownership.test.js` | ⬜ TBD | ⬜ pending |
| 222-03-01 | 03 | 2 | CRM-01, QA-02 | migration | `node -e "..."` (see 222-03-PLAN.md Task 1 verify) | ⬜ TBD | ⬜ pending |
| 222-03-02 | 03 | 2 | CRM-01, CDP-04, TASK-03, QA-01 | unit + integration + contract | `node --test test/crm360/timeline-extensions.test.js test/crm360/timeline-api.test.js` | ⬜ TBD | ⬜ pending |
| 222-03-03 | 03 | 2 | CRM-01 | component + storybook + chromatic | `npx chromatic --project-token=... --exit-zero-on-changes --only-changed` (Warning 8 disposition; file-presence precondition runs first) | ⬜ TBD | ⬜ pending |
| 222-04-01 | 04 | 3 | CRM-02, CRM-05, QA-02 | unit + integration + migration | `node --test test/crm360/nba.test.js` | ⬜ TBD | ⬜ pending |
| 222-04-02 | 04 | 3 | CRM-02, CRM-04, TASK-01, TASK-03, QA-01 | unit + integration + contract + regression | `node --test test/crm360/execution-nba-refactor.test.js test/crm360/nba-recompute.test.js && npm test` | ⬜ TBD | ⬜ pending |
| 222-05-01 | 05 | 4 | CRM-03, CRM-04, QA-02 | unit + integration + migration | `node --test test/crm360/committee.test.js` | ⬜ TBD | ⬜ pending |
| 222-05-02 | 05 | 4 | CRM-01..05, CDP-01..05, TASK-04, TASK-05, QA-01 | contract + integration | `node --test test/crm360/api-crm360.test.js test/crm360/mcp-tools.test.js` | ⬜ TBD | ⬜ pending |
| 222-05-03 | 05 | 4 | CRM-02, CRM-03, TASK-02, TASK-04, QA-03..08 | component + storybook + brief-register + reporting-extend | `node -e "..."` (file-presence + brief-registry token scan + reporting.ts token scan; see 222-05-PLAN.md Task 3 verify) | ⬜ TBD | ⬜ pending |
| 222-06-01 | 06 | 5 | QA-02, TASK-01, all | integration + RLS suite | `node --test test/crm360/drift-reconciliation.test.js test/crm360/rls-suite.test.js` | ⬜ TBD | ⬜ pending |
| 222-06-02 | 06 | 5 | QA-03..15 | manual journeys + Chromatic visual regression (Playwright DEFERRED per D-39) | manual operator-journey checklist (Task 2 in 222-06-PLAN.md) + `npx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN --exit-zero-on-changes` (Playwright DEFERRED per D-39) | ⬜ TBD | ⬜ pending |
| 222-06-03 | 06 | 5 | all (closeout) | docs | `node -e "..."` SUMMARY + STATE + ROADMAP presence + F-113..121 + migrations 106..112 token scan | ⬜ TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Note (Warning 11 fix):** Rows populated from each plan's `<verification>` per-task table. `nyquist_compliant` remains `false` in frontmatter — only execute-phase flips it to `true` once tests actually pass. `wave_0_complete` remains `false` until 222-01 Task 1 ships fixture factories under `test/fixtures/crm360/*.js` (no Vitest/Playwright install per D-39).

---

## Wave 0 Requirements

Verify before any 222-NN wave starts (lands in 222-01 Wave 0 unless satisfied by upstream P221):

- [ ] Test runner = `node --test` via `npm test` script (no Vitest/Playwright install per D-39)
- [ ] Playwright DEFERRED per D-39 (no playwright.config.ts; manual operator journeys + Chromatic for P222)
- [ ] `test/fixtures/crm360/` — CRM360 fixture factory directory (distinct from P221's `test/fixtures/cdp/`)
- [ ] `test/fixtures/crm360/customer360.js` — minimal + full + tombstoned Customer360 variants
- [ ] `test/fixtures/crm360/opportunity.js` — healthy/at_risk/stalled + pricing_context_id variants
- [ ] `test/fixtures/crm360/lifecycle.js` — all 11 from→to stage transition variants + handoff variant
- [ ] `test/fixtures/crm360/nba.js` — active/dismissed/expired/superseded variants
- [ ] `test/fixtures/crm360/committee.js` — full coverage + missing roles variants
- [ ] `test/fixtures/crm360/committee-member.js` — active + historical (valid_to set) variants
- [ ] `test/fixtures/crm360/legacy-entity.js` — crm_entities snapshot for legacy adapter regression
- [ ] `package.json` — confirm `test` script invokes `node --test`; NO `vitest` and NO `@playwright/test` keys per D-39
- [ ] CDP fixtures from P221 (`test/fixtures/cdp/*`) reused for canonical_identity_id overlay

---

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| RLS enforcement (all 6 new tables) | 100% of tables | SOC2 baseline; cross-tenant denial per table |
| Business logic decision branches | 100% | Lifecycle routing, owner derivation, NBA status, committee role history all compliance-critical |
| API contract fields (F-113..F-121) | 100% of fields | OpenAPI parity per QA-01 |
| Legacy regression (P100-P105 tests) | 100% green | CRM360 is additive; any failure = regression |
| Negative-path | ≥2 per object type | Fail-closed must be actively proven |
| `primary_owner_user_id` derivation | 100% — all 11 lifecycle_stage × NULL fallback | Pure function; full branch coverage |
| `{{MARKOS_PRICING_ENGINE_PENDING}}` enforcement | 100% — pricing_context_id mutations require approval_ref | P211 D-23 / CLAUDE.md placeholder rule |

---

## Validation Categories per Slice

| Slice | Unit | Integration | Contract | Regression | Negative-Path | Manual journey (Playwright DEFERRED per D-39) | Chromatic |
|-------|------|-------------|----------|------------|---------------|------------|-----------|
| 222-01 | Customer360/Opportunity CRUD, legacy adapter hydrate | Tombstone cascade from CDP | F-113, F-114 | workspace.ts + execution.ts + copilot.ts green | Cross-tenant, pricing without approval | n/a | n/a |
| 222-02 | Lifecycle stage routing, primary_owner derivation | cdp_events emit (source_event_ref thread) | F-115 | timeline.ts backward compat | Concurrent transition race, owner handoff audit | n/a | n/a |
| 222-03 | buildCrmTimeline extension, activity_family → source_domain backfill | source_domain + commercial_signal filter query | F-119 | HIGH_SIGNAL filter preserved | NULL commercial_signal | Timeline filter UX | TimelineDetailView (empty/filtered/full) |
| 222-04 | NBA CRUD + supersedence + expiry jitter | Recompute on lifecycle event | F-116 | P103 D-04 urgency bias preserved | Approve-required execute blocked | NBAExplainPanel | NBAExplainPanel (active/dismissed/expired) |
| 222-05 | Committee coverage math, role history windowing | MCP tool payloads + API routes | F-117, F-118, F-120, F-121 | execution-queue reads nba_records | Cross-tenant, concurrent role close+insert | BuyingCommitteePanel + committee gap | BuyingCommitteePanel (full/gap/empty) |
| 222-06 | Drift cron idempotency, full RLS matrix | Reconciliation audit log | All 9 F-IDs registered | Full P100-P105 green | Missing tenant fail-closed | Full operator journey | LifecycleTransitionTimeline |

---

## Fixture Strategy

| Fixture | Content | Used By |
|---------|---------|---------|
| `customer360.ts` | person + account variants per mode (b2b/b2c/plg_b2b); tombstoned; all 11 lifecycle_stage values | 222-01..06 |
| `opportunity.ts` | healthy/watch/at_risk/stalled; pricing_context_id null + populated; source_motion per enum | 222-01..04 |
| `lifecycle.ts` | 11 from→to transition rows; handoff reason variant | 222-02 |
| `nba.ts` | active/dismissed/expired/superseded; approval_ref null + populated | 222-04 |
| `committee.ts` | 100% coverage + 40% coverage variants; opportunity-level + account-level | 222-05 |
| `committee-member.ts` | active (valid_to NULL) + historical (valid_to set) | 222-05 |
| `legacy-entity.ts` | crm_entities row matching Customer360 shape for adapter regression | 222-01, 222-06 |
| P221 `test/fixtures/cdp/*` reuse | CDP overlay for canonical_identity_id + ConsentState + TraitSnapshot | all slices |

Location: `test/fixtures/crm360/`. Importable from all CRM360 test files.

---

## Acceptance Criteria Tie-In

Plan acceptance criteria MUST reference this architecture:
- Customer360 criteria: "Verified by `customer360.test.js` CRUD + RLS + tombstone cases."
- Opportunity criteria: "Verified by `opportunity.test.js` approval-gate + pricing-guard cases."
- Lifecycle criteria: "Verified by `lifecycle.test.js` — all 11 transitions + handoff audit."
- NBA criteria: "Verified by `nba.test.js` supersedence + expiry jitter + approval-block cases."
- Committee criteria: "Verified by `committee.test.js` coverage math + `committee-member.test.js` role history."
- Ownership criteria: "Verified by `multi-role-ownership.test.js` + `lifecycle.test.js` primary_owner derivation 100% coverage."
- Timeline criteria: "Verified by `timeline-extensions.test.js` source_domain + commercial_signal filter."
- RLS criteria: "Verified by `rls-suite.test.js` cross-tenant denial on all 6 new tables."
- Legacy regression: "Verified by `npm test` — all P100-P105 suites green."

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Operator commercial handoff UX | CRM-03 | Human judgment on ownership transition clarity | (1) Stage-change fixture → SQL, (2) verify primary_owner shifts marketing→deal, (3) confirm handoff event visible + audit log populated |
| Buying committee gap → outreach draft | CRM-04 | Requires approval UX review | (1) Open opportunity with 40% coverage, (2) click "Invite role" for missing economic_buyer, (3) verify task created + draft outreach + approval gate |
| NBA execution with approval | CRM-04, CRM-05 | Requires approval inbox UX | (1) NBA with approval_ref required, (2) click execute → routes to P208 approval inbox, (3) approve → NBA status=executed + audit row |
| Migration drift operator task | CRM-01, QA-02 | Requires drift fixture + cron trigger | (1) Force drift in `customer_360_records` vs `crm_entities`, (2) run reconciliation cron, (3) verify operator task + audit log |

---

---

## UI-SPEC AC Coverage Map (HEAVY-UI HYBRID FOLD)

> Source: `222-UI-SPEC.md` (heavy-UI hybrid: 3 backend plans 01/02/06 + 3 UI plans 03/04/05). Every UI-SPEC acceptance criterion maps to a plan + task. Backend doctrine assertions, future-surface UI binding contracts, translation gates, downstream UI inheritance, parent UI-SPEC carry-forward, cross-cutting doctrine, END-OF-v4.2.0-Wave-1 state assertions, manual operator-journey checklists, Chromatic baselines all enumerated below.

### Backend doctrine assertions (UI-SPEC §parent_doctrine_chain + §Plan Scope Classification + §Color + §Sensitive Credential UI Binding)

| Assertion | Plan | Owning Task | Verify Command |
|-----------|------|-------------|----------------|
| D-32 + D-43 architecture-lock — legacy `api/*.js` flat tree; `app/(markos)` PRESERVED as existing route, FORBIDDEN as NEW path | 01 | Task 0.5 architecture-lock detector | `node --test test/crm360/preflight/architecture-lock.test.js` |
| D-42 helper canon `buildApprovalPackage` (NEVER `createApprovalPackage`) | 01 + 04 + 05 | helper-presence test + buildApprovalPackage wiring (Plan 04 NBA execute + lifecycle high-risk + tombstone cascade; Plan 05 API handlers) | `grep -c "buildApprovalPackage" lib/markos/crm360/**/*.ts >= 3` AND `grep -c "createApprovalPackage" lib/markos/crm360/**/*.ts == 0` |
| 11 source_domain ENUM verbatim (UI-SPEC §Surface A; CONTEXT D-05) | 01 + 03 | Plan 03 migration 110 CHECK constraint + buildCrmTimeline mapping | `grep -P "'website','email','messaging','meeting','crm','billing','support','product','social','research','agent'" supabase/migrations/110_crm360_crm_activity_extensions.sql` |
| 11 lifecycle_stage ENUM verbatim (UI-SPEC §Surface B; CONTEXT D-11) | 01 + 02 + 04 | Plan 01 migration 106 + Plan 02 migration 107 + Plan 04 migration 108 D-45 trigger | grep gates on each migration enumerating exactly 11 values |
| 7 commercial_signal ENUM verbatim (UI-SPEC §Surface A) + color-coding | 03 | Plan 03 TimelineDetailView per-row `.c-badge--{state}` (verbatim mapping per UI-SPEC §Color) | AC TDV-8; `node --test test/crm360/timeline-extensions.test.js` |
| 8 role ENUM verbatim (UI-SPEC §Surface D; CONTEXT D-15) | 05 | Plan 05 migration 109 buying_committee_members.role CHECK | `grep -P "champion\|economic_buyer\|technical_buyer\|end_user\|blocker\|legal\|finance\|unknown" supabase/migrations/109_crm360_buying_committees.sql` |
| 5-persona ENUM verbatim (UI-SPEC §Surface D — subset of 8-role) | 05 | Plan 05 BuyingCommitteePanel `<.c-chip>` rendering (AC BCP-3) | AC BCP-3 Storybook story `Crm360/BuyingCommitteePanel` |
| 3 actor_type ENUM verbatim (UI-SPEC §Surface A) | 02 + 03 | Plan 02 migration 107 + Plan 03 migration 110 CHECK constraints | grep gates |
| 3 sentiment ENUM verbatim (UI-SPEC §Surface A) | 03 | Plan 03 migration 110 CHECK constraint + AC TDV-9 bracketed-glyph pairing | `grep -P "positive\|neutral\|negative" supabase/migrations/110_crm360_crm_activity_extensions.sql` |
| TimelineDetailView replaces record-detail.tsx as DEFAULT (D-24) + non-regression | 03 + 05 | Plan 03 ships TimelineDetailView; Plan 05 wires SWAP via workspace-shell.tsx evolution; AC WSE-4 preserves legacy callers | `node --test test/crm360/api-crm360.test.js` (Plan 05 workspace-shell integration test) |
| 30th-32nd handoff_kind chip extension — 3 NEW literals (UI-SPEC §Approval Inbox Handoff Chain Extension) | 04 + 05 | Plan 04 buildApprovalPackage wiring (3 paths) + Plan 06 closeout chip count grep | `grep -roP 'crm360_(nba_execute\|lifecycle_transition\|tombstone_cascade)_approval' lib/ \| sort -u \| wc -l` == 3 |
| D-15 extracted-component REUSE manifest (HealthScoreBadge + RiskBandBadge + KbGroundingPanel + RetentionClassChip + PIIRedactedField + ClassifierChipRow REUSED, NOT re-implemented) | 03 + 04 + 05 | Plan 03 + 04 + 05 import these from existing 217-06 `Saas/*` Storybook origin; architecture-lock grep gate asserts NO re-implementation | architecture-lock grep gate per Plan |
| Banned-lexicon zero-match BEFORE approval-package dispatch on 4 surfaces (NBA rationale + lifecycle reason + committee proof_gap_refs + Customer360 current_summary) | 04 + 05 | Plan 04 NBA recompute upsert + Plan 05 API handler buildApprovalPackage wiring; Plan 05 copilot-record-panel render (AC CRP-4) | `node scripts/marketing-loop/check-banned-lexicon.mjs` (zero-match on the 4 doctrine fields) |
| Chromatic snapshot gate (4 NEW UI surfaces × ≥5 named-state stories per surface = 22+ snapshots) | 06 | Plan 06 chromatic.config.json + 4 *.stories.tsx | `npx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN --exit-zero-on-changes` |
| Mobile priority per surface (TimelineDetailView/LifecycleTransitionTimeline/NBAExplainPanel/BuyingCommitteePanel = secondary; execution-queue = critical) | 03 + 04 + 05 | Each plan registers in `lib/markos/operator/shell.ts` `SurfaceRouteContract` | `grep "surface_family.*crm360_" lib/markos/operator/shell.ts \| wc -l` >= 7 |
| `desktop_only` FORBIDDEN as mobile_priority value (208-01 architecture-lock) | 03 + 04 + 05 | grep gate on every mobile_priority literal | `grep "desktop_only" components/markos/crm/{TimelineDetailView,LifecycleTransitionTimeline,NBAExplainPanel,BuyingCommitteePanel,workspace-shell,execution-queue,copilot-record-panel}*` returns 0 |
| END-OF-v4.2.0-Wave-1 chip count = 32 (29 pre-222 + 3 NEW) | 06 | Plan 06 closeout grep gate | `node -e "const k = require('./lib/markos/approvals/handoff-kinds.cjs'); if (k.length !== 32) process.exit(1)"` |

### 6 future-surface UI binding contracts (UI-SPEC §Future-Surface UI Binding Contracts)

| Future surface | Anticipated path | Owning Plan | Plan 06 SUMMARY documents |
|----------------|------------------|-------------|---------------------------|
| `future_phase_222_admin_ui` | `app/(markos)/crm/{customer360,opportunities,committees,nba,funnel,reconciliation,rls-audit}/page.tsx` future | Future admin extension | yes |
| `future_phase_222_approval_inbox_extensions` | `/operations/approvals` (P208) row rendering for 3 new chips | Future P208 admin extension | yes |
| `future_phase_223_dispatch_substrate` | P223 messaging engine consumer | P223 | yes |
| `future_phase_222_chromatic_baselines` | `chromatic.config.json` + 4 `*.stories.tsx` | 06 (THIS PHASE) | yes |
| `future_phase_223_legacy_crm_entities_cutover` | post-P222 cleanup phase (`crm_entities` → derived view) | P223+ | yes |
| 4 NEW components (TDV/LTT/NEP/BCP) + 3 EVOLVED (workspace-shell/execution-queue/copilot-record-panel) | UI-SPEC §Surface A..G | 03 + 04 + 05 | yes |

### Translation gates (UI-SPEC §translation_gates_dissolved_by_222 + §translation_gates_opened_by_222)

| Gate | State | Owner |
|------|-------|-------|
| 221-UI-SPEC §future_phase_222_attribution_substrate | DISSOLVED (Plan 01 ships Customer360 + Opportunity SOR; Plan 03 ships crm_activity_ledger extensions) | 222 (Plans 01 + 03) |
| 217-UI-SPEC §future_phase_222 | DISSOLVED (Plan 03 ships TimelineDetailView; Plan 04 ships NBAExplainPanel; Plan 05 ships BuyingCommitteePanel + workspace-shell + copilot-record-panel evolution) | 222 (Plans 03 + 04 + 05) |
| 100-105 legacy CRM workspace placeholder | DISSOLVED (P100-P105 substrate PRESERVED; 222 OVERLAYS additively per D-19 read-through adapter) | 222 (Plan 01 D-19 adapter) |
| `future_phase_223_dispatch_substrate` | OPENED (P223 messaging engine consumer) | 222 (Plan 06 SUMMARY documents) |
| `future_phase_222_admin_ui` | OPENED (multi-page CRM 360 admin) | 222 (Plan 06 SUMMARY documents) |
| `future_phase_222_approval_inbox_extensions` | OPENED (P208 row rendering for 3 new chips) | 222 (Plan 06 SUMMARY documents) |
| `future_phase_222_chromatic_baselines` | OPENED (Plan 06 OWNS this gate) | 222 (Plan 06) |
| `future_phase_223_legacy_crm_entities_cutover` | OPENED (post-P222 cleanup) | 222 (Plan 06 SUMMARY documents) |

**Total: 3 dissolved, 5 opened.**

### Downstream UI inheritance citations (≥10 future surfaces)

The 4 NEW components + 3 EVOLVED components serve as parent contracts for ≥10 future surfaces:

| Future surface | Inherits from 222 | Plan 06 SUMMARY documents |
|----------------|-------------------|---------------------------|
| P223 dispatch eligibility surface | customer_360_records + opportunities + buying_committees + buying_committee_members | yes |
| P223 NBA-driven outbound campaign trigger | nba_records.action_type ∈ {send_followup, propose_expansion, send_renewal_reminder, draft_outreach} | yes |
| P224 conversion surface personalization | customer_360_records + lifecycle_stage + nba_records | yes |
| P224 launch orchestration audience selection | customer_360_records + buying_committees + opportunities | yes |
| P225 attribution semantic layer | customer_360_records + opportunities + lifecycle_transitions + nba_records | yes |
| P225 customer journey analytics | lifecycle_transitions + crm_activity_ledger (extended) | yes |
| P225 narrative intelligence | nba_records + score_provenance | yes |
| P226 sales enablement battlecards | opportunities + buying_committees + evidence_gaps | yes |
| P226 proof pack generation | EvidenceMap + nba_records.evidence_refs[] | yes |
| P227 ecosystem partner workflows | customer_360_records + opportunities (mode='b2b2c') | yes |
| P208 Morning Brief CRM rollups | crm360_nba_summary + committee_gap_summary entry types (Plan 05 ships) | yes |
| P208 Approval Inbox row rendering for 3 NEW chips (DEFERRED) | crm360_nba_execute_approval + crm360_lifecycle_transition_approval + crm360_tombstone_cascade_approval | yes |
| Future P208 Task Board task entry types | crm360_drift_reconciliation + crm360_nba_expired (Plan 06 owns the cron triggers) | yes |

### 213.4 carry-forward + 217 D-21 + 221 D-32 (UI-SPEC §parent_doctrine_chain)

| Carry-forward | Owning Plan | Verify |
|---------------|-------------|--------|
| 213.4 D-08 token-only (zero hex literals in `components/markos/crm/*` module.css) | 03 + 04 + 05 | AC TDV-13 + AC NEP-15 + AC BCP-16; grep gate per Plan |
| 213.4 D-09 mint-as-text (`--color-primary-text` for `[ok]`/`[up]` glyphs + .c-chip-protocol IDs + action-link inline CTAs) | 03 + 04 + 05 | grep-based audit |
| 213.4 D-09b `.c-notice` mandatory (zero `.banner`/`.alert`/`.warning`/`.callout` classes) | 03 + 04 + 05 | grep gate per Plan |
| 213.4 D-13 `.c-card--feature` reserved (FORBIDDEN in 222 components) | 03 + 04 + 05 | grep gate per Plan |
| 213.4 D-14 no `.c-table` primitive (vanilla `<table>`/`<ol>`/`<ul>` only) | 03 + 04 + 05 | grep gate per Plan |
| 213.4 D-15 selective extraction (7 components first consumed in 217-06 REUSED in 222) | 03 + 04 + 05 | architecture-lock grep gate (no re-implementation) |
| 213.4 D-21 server/client boundary (4 NEW components are `'use client'`; consuming pages remain server components) | 03 + 04 + 05 | AC TDV-1 + AC LTT-1 + AC NEP-1 + AC NEP-14 + AC BCP-1 + AC BCP-15 |
| 217 D-32 architecture-lock (legacy api/*.js + components/markos/crm/* + app/(markos)/* PRESERVED) | 01 + 04 + 05 + 06 | architecture-lock detector test (Task 0.5) |
| 221 D-32 tombstone cascade (P221 D-24 → Customer360 PII scrub + ownership/lifecycle/NBA preserved) | 04 | D-47 outbox + Plan 04 tombstoneCustomer360 buildApprovalPackage wiring |

### Cross-cutting doctrine binding (11 parent UI-SPECs — UI-SPEC §parent_doctrine_chain)

| Parent UI-SPEC | Doctrine inherited | Carrying Plan(s) |
|----------------|---------------------|------------------|
| 206-UI-SPEC | mutation-class doctrine — `external.send` + `single_approval` mode + `buildApprovalPackage` (NEVER `createApprovalPackage`) | 04 + 05 |
| 207-UI-SPEC | RunApiEnvelope.run_id linked to NBA recompute + lifecycle transitions + tombstone cascade + 3 cron handlers; 18 NEW AgentRunEventType registrations | 02 + 04 + 05 + 06 |
| 208-UI-SPEC | Approval Inbox + Morning Brief + Task Board + cockpit pattern (3 NEW chips DEFERRED row rendering) | 05 (substrate) + 06 (gate) |
| 209-UI-SPEC | EvidenceMap binding + KbGroundingPanel + nba_evidence_refs_nonempty CHECK + D-46 score provenance immutability | 04 |
| 213-UI-SPEC | Tenant 0 readiness gate + public-proof boundary (banned-lexicon zero-match) | 04 + 05 |
| 214-UI-SPEC | SaaS bridge — Customer360.canonical_identity_id FK targets P221 (NOT P214); D-32 architecture-lock | 01 |
| 215-UI-SPEC | sensitive credential UI binding Layer 6 EXTENDED to PII per 216; 215 billing-correction modal recipe REUSED | 04 + 05 |
| 216-UI-SPEC | Health Score binding + 6 extracted components (D-15) REUSED; banned-lexicon zero-match | 03 + 04 + 05 |
| 217-UI-SPEC | heavy-UI pattern reference; D-15 extracted components; D-21 server/client boundary; D-32 architecture-lock | 03 + 04 + 05 |
| 220-UI-SPEC | END-OF-v4.1.0 milestone state (26 chips at v4.1.0 closeout) | 06 (chip count assertion) |
| 221-UI-SPEC | CDP read-through adapter; opens v4.2.0 (29 chips post-221); CRM mutations emit cdp_events; tombstone cascade | 01 + 02 + 04 |

### END-OF-v4.2.0-Wave-1 state assertions (chip count 32 post-222)

| Assertion | Plan | Verify |
|-----------|------|--------|
| chip count = 32 (29 pre-222 + 3 NEW) | 06 | Plan 06 closeout grep gate |
| 30th `crm360_nba_execute_approval` literal present | 04 | grep gate |
| 31st `crm360_lifecycle_transition_approval` literal present | 04 (wiring) + 02 (substrate) | grep gate |
| 32nd `crm360_tombstone_cascade_approval` literal present | 04 | grep gate |

### 4 manual operator-journey checklists (UI-SPEC §Manual Operator-Journey Checklist; Plan 06)

| Journey | Surface | Plan owning checklist |
|---------|---------|------------------------|
| 1 — TimelineDetailView filter | Plan 03 ships component; Plan 06 ships checklist | 06 |
| 2 — BuyingCommitteePanel invite role | Plan 05 ships component; Plan 06 ships checklist | 06 |
| 3 — NBAExplainPanel accept | Plan 04 ships component; Plan 06 ships checklist | 06 |
| 4 — LifecycleTransitionTimeline render | Plan 03 ships component; Plan 06 ships checklist | 06 |

Per D-39 Playwright DEFERRED — manual operator-journey checklist + Chromatic snapshot gate REPLACES Playwright e2e.

### Chromatic baselines (4 surfaces × Storybook story sets)

| Surface | Story sets | Snapshot count | Plan owning stories |
|---------|------------|----------------|---------------------|
| `Crm360/TimelineDetailView` | Empty / Populated / Loading / Filtered / FilteredEmpty / Tombstoned | 6 | 03 |
| `Crm360/LifecycleTransitionTimeline` | Empty / Populated / WithHandoff / WithRejected | 4 | 03 |
| `Crm360/NBAExplainPanel` | Empty / ActiveFreeAction / ActiveApprovalRequired / Executed / Superseded / Expired / Tombstoned | 7 | 04 |
| `Crm360/BuyingCommitteePanel` | Empty / Populated / CoverageLow / CoverageFull / Tombstoned | 5 | 05 |

**Total: 22+ Chromatic snapshots.** Plan 06 ships `chromatic.config.json` covering all 4 surfaces. Per D-51 Plan 06 `autonomous: false`; first batch requires operator review.


## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (fixtures, configs)
- [ ] No watch-mode flags in CI
- [ ] Feedback latency < 90s quick / 8 min full
- [ ] `nyquist_compliant: true` set once plans populate per-task rows

**Approval:** pending
