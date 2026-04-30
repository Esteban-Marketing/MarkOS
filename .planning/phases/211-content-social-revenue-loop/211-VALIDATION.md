---
phase: 211
slug: content-social-revenue-loop
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
ui_spec_folded: 2026-04-29
ui_scope: NO_UI
---

# Phase 211 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` |
| **Config file** | none - uses the built-in Node runner |
| **Quick run command** | `npm test -- test/marketing/phase-211/preflight/` |
| **Full suite command** | `npm test -- test/marketing/phase-211/` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/marketing/phase-211/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/marketing/phase-211/`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 211-01-00 | 01 | 1 | QA-01, QA-02 | preflight | `npm test -- test/marketing/phase-211/preflight/` | ❌ W0 | ⬜ pending |
| 211-01-01 | 01 | 1 | LOOP-01, LOOP-02 | strategy+brief-contract | `npm test -- test/marketing/phase-211/domain-1/` | ❌ W0 | ⬜ pending |
| 211-02-01 | 02 | 2 | LOOP-03 | artifact+audit-gates | `npm test -- test/marketing/phase-211/domain-2/` | ❌ W0 | ⬜ pending |
| 211-03-01 | 03 | 3 | LOOP-04 | dispatch+approval-state | `npm test -- test/marketing/phase-211/domain-3/` | ❌ W0 | ⬜ pending |
| 211-04-01 | 04 | 4 | LOOP-05 | social-routing+escalation | `npm test -- test/marketing/phase-211/domain-4/` | ❌ W0 | ⬜ pending |
| 211-05-01 | 05 | 5 | LOOP-06, LOOP-07 | revenue-feedback+narrative | `npm test -- test/marketing/phase-211/domain-5/` | ❌ W0 | ⬜ pending |
| 211-06-01 | 06 | 6 | LOOP-08 | measurement-handoff | `npm test -- test/marketing/phase-211/domain-6/measurement-handoff.test.js` | ❌ W0 | ⬜ pending |
| 211-06-02 | 06 | 6 | LOOP-08, QA-15 | future-growth-compatibility | `npm test -- test/marketing/phase-211/domain-6/growth-compatibility.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

---

## UI-SPEC AC Coverage Map

> Phase 211 ships ZERO UI surfaces (`ui_scope: NO_UI` per `211-UI-SPEC.md`). The UI-SPEC is therefore not a per-plan visual contract — it is a load-bearing **inheritance authority** for downstream UI surfaces (P208 cockpit, P212 learning ledger, P217+ growth modules) that will consume the loop substrate built here. This section maps each UI-SPEC obligation to the receiving plan/task.

### Backend doctrine assertions (enforced by `scripts/marketing-loop/check-loop-architecture-lock.mjs` per 211-01-00)

| Assertion | UI-SPEC source | Receiving plan/task | Verification |
|-----------|----------------|---------------------|--------------|
| Architecture-lock forbidden string `silent auto-publish` | 211-UI-SPEC §Copywriting Contract + §DESIGN.md Compliance Assertions | 211-01-00 (architecture-lock CI script) | grep gate via `scripts/marketing-loop/check-loop-architecture-lock.mjs` returns non-zero on fixture |
| Architecture-lock forbidden string `dispatch without approval` | 211-UI-SPEC §Copywriting Contract | 211-01-00 (CI script) | grep gate; ALSO load-bearing for 211-03 (LOOP-04 explicit non-negotiable) |
| Architecture-lock forbidden string `hard-coded public price` | 211-UI-SPEC §Copywriting Contract | 211-01-00 (CI script) | grep gate; load-bearing for 211-01-01 + 211-02-01 (pricing posture) |
| Architecture-lock forbidden string `unsupported claim publish` | 211-UI-SPEC §Copywriting Contract | 211-01-00 (CI script) | grep gate; load-bearing for 211-02-01 (`evidence_blocked` blocking reason) |
| Test-substrate-mismatch strings (`vitest`, `playwright`, `.test.ts`, `route.ts`) | 211-UI-SPEC §Copywriting Contract | 211-01-00 (CI script) | grep gate; existing assertion |
| Pricing placeholder `{{MARKOS_PRICING_ENGINE_PENDING}}` accepted on `MarketingStrategyRun.pricing_context_ref` | 211-UI-SPEC §Copywriting Contract pricing-placeholder rule + §DESIGN.md row `Pricing placeholder rule` | 211-01-01 (`marketing_strategy_briefs.sql` + `lib/markos/loop/strategy-brief.ts` + `pricing-evidence-gates.test.js`) | grep `{{MARKOS_PRICING_ENGINE_PENDING}}` in test file (existing AC) |
| Pricing placeholder accepted on `ContentBrief.pricing_requirement` literal `placeholder_allowed` | 211-UI-SPEC §Copywriting Contract | 211-01-01 (`lib/markos/loop/strategy-brief.ts` literal) | grep `placeholder_allowed` literal (existing AC) |
| Pricing placeholder accepted on `MarketingArtifact.pricing_context_ref` | 211-UI-SPEC §Copywriting Contract | 211-02-01 (`marketing_artifacts_and_audits.sql` + `artifact-audit.test.js`) | grep `{{MARKOS_PRICING_ENGINE_PENDING}}` in test file (existing AC) |
| Banned-lexicon zero matches in `.planning/marketing-loop/*.md` doctrine prose | 211-UI-SPEC §DESIGN.md Compliance Assertions row `Banned lexicon` | 211-01-00 (CI script extension) + 211-06-02 (final 2 doctrine docs) | grep gate against the 17 banned terms across all 9 marketing-loop docs |
| Future-consumer literal exact (`future_consumer`, no synonyms) | 211-UI-SPEC §Copywriting Contract future-consumer copy rule + §DESIGN.md row `Future-consumer doctrine` | 211-06-02 (`growth-loop-compatibility-map.md`) | grep `future_consumer` for 8 rows; grep zero matches for `planned`/`coming_soon`/`future_phase` (existing AC + new) |
| Doctrine phrase `expected performance envelopes` verbatim | 211-UI-SPEC §Downstream row 7 + §Copywriting Contract | 211-06-01 (`measurement-handoff-contract.md` + `measurement-handoff.test.js`) | grep gate (existing AC) |

### Translation gate dissolutions (5 dissolved by Phase 211)

| Upstream gate | Authored by | Dissolved by 211 plan | Receiving doctrine surface |
|---------------|-------------|------------------------|----------------------------|
| 209 §Downstream row 6 (loop dispatch evidence gate) — `unsupported_blocked` state | 209-UI-SPEC | 211-02-01 + 211-03-01 (joint) | `MarketingArtifact.artifact_status == 'blocked'` with `blocking_reasons.evidence_blocked` AND `DispatchAttempt.dispatch_status == 'blocked'` with `rollback_hint` referencing the unsupported claim |
| 210 §Surface A `<PlaceholderBanner variant="future_phase_211">` for loop-dispatch-bound connector recommendations | 210-UI-SPEC | 211-03-01 | `dispatch-approval-policy.md` requires connector state for 4 channels; once shipped, P210 onboarding presents recommendations as runnable |
| 208-02 Morning Brief `placeholder_state` literal `waiting_phase_211` | 208-UI-SPEC | 211-01-01 (strategy/brief contracts) | `lib/markos/operator/morning-brief.ts` reads `MarketingStrategyRun` + `ContentBrief` records directly; P208 redeployed |
| 208-06 Weekly Narrative `placeholder_sections` literal `phase_211_loop` | 208-UI-SPEC | 211-05-01 + 211-06-01 (joint) | `lib/markos/operator/weekly-narrative.ts` reads `MeasurementHandoff.weekly_narrative_ref` + `RevenueFeedbackLink.narrative_ready == true` rows directly |
| 208-04 Approval Inbox handoff-kind filter (loop-originated approval placeholders) | 208-UI-SPEC | 211-02-01 + 211-03-01 + 211-04-01 (multi-plan) | Approval inbox renders loop-originated approval items via `ApprovalHandoffRecord.task_ref` linked to `MarketingArtifact.artifact_id` / `DispatchAttempt.approval_package_id` / `SocialSignal.task_ref` |

### Translation gates opened (4 opened by Phase 211)

| New gate | Opened by 211 plan | Doctrine flag | Dissolution phase |
|----------|---------------------|---------------|-------------------|
| `future_phase_212` — `MeasurementHandoff.learning_ready == true` consumers | 211-06-01 | `learning_ready == true` on `MeasurementHandoff` | P212 (LRN-01..05) |
| `future_growth_module` — 8 future_consumer rows in `growth-loop-compatibility-map.md` | 211-06-02 | Status string `future_consumer` for all 8 rows | P217+ / P218 / P219 / P220 |
| `future_phase_213_tenant0` — Tenant 0 loop-readiness panel | 211-06 (entire) — 14-field measurement envelope + multi-table rollup | All 6 loop-record types populated end-to-end on Tenant 0 | P213 (T0-01..05) |
| `future_phase_218..220` — SaaS Growth consumers requiring `future_consumer` row flips | 211-06-02 | `future_consumer` rows in compatibility map | P218 (PLG/EXP/IAM/XP), P219 (ABM/REV), P220 (VRL/CMT/EVT/PR/PRT/DEV) |

### Downstream UI inheritance citations (14 future surfaces, all read-only relative to Phase 211)

| Future surface | UI-SPEC §Downstream row | Originating Phase 211 doctrine | Authored by 211 plan |
|----------------|-------------------------|--------------------------------|----------------------|
| Loop monitoring dashboard | row 1 | `strategy-brief-contract.md` + `MarketingStrategyRun` | 211-01-01 |
| MarketingArtifact preview / diff viewer | row 2 | `artifact-audit-contract.md` + `MarketingArtifact` + `ArtifactAudit` | 211-02-01 |
| Pre-dispatch evidence audit (loop dispatch evidence gate) | row 3 | `dispatch-approval-policy.md` + `evidence-gates.ts` | 211-02-01 + 211-03-01 |
| DispatchAttempt state board | row 4 | `dispatch-approval-policy.md` + `DispatchAttempt` | 211-03-01 |
| Social signal inbox | row 5 | `social-signal-routing.md` + `SocialSignal` | 211-04-01 |
| Revenue feedback narrative consumer (208-06) | row 6 | `revenue-feedback-model.md` + `weekly-narrative-source-map.md` + `RevenueFeedbackLink` | 211-05-01 |
| Measurement handoff timeline | row 7 | `measurement-handoff-contract.md` + `MeasurementHandoff` | 211-06-01 |
| Loop visualizer DAG | row 8 | All of 211-01..211-06 doctrine | All plans |
| Pre-dispatch approval-token viewer (loop variant) | row 9 | `dispatch-approval-policy.md` + 207 `ApprovalHandoffRecord` | 211-03-01 |
| Next-task generation queue (208-03) | row 10 | `measurement-handoff-contract.md` + `next_task_kind` + `next_task_ref` | 211-06-01 |
| Growth-loop compatibility browser | row 11 | `growth-loop-compatibility-map.md` + 8 future-consumer rows | 211-06-02 |
| Brief authoring wizard | row 12 | `strategy-brief-contract.md` + `ContentBrief` | 211-01-01 |
| Artifact audit tribunal | row 13 | `artifact-audit-contract.md` + `ArtifactAudit` | 211-02-01 |
| Tenant 0 loop-readiness panel | row 14 | All of 211 doctrine + 213 Tenant 0 closeout doctrine | All plans (rollup) |

### 213.x carry-forward (D-08..D-15) applicable to downstream UI consumers

| 213.x Decision | Applicable to 211 plan(s) | Carry-forward rule for downstream surfaces |
|----------------|----------------------------|---------------------------------------------|
| D-08 (token-only) | All plans (211-01..211-06) | Zero inline hex literals; every color via `var(--color-*)`; every spacing via `var(--space-*)`; artifact-status badges, dispatch-status badges, social-signal route-kind chips, attribution-status badges, next-task-kind chips all token-only |
| D-09 (mint-as-text) | 211-01-01, 211-02-01, 211-03-01, 211-04-01, 211-06-01 | Protocol Mint allowed as text via `--color-primary-text` for `.c-button--tertiary` link CTAs and `.c-chip-protocol` IDs only; never as fill on surfaces larger than a button or chip; loop-record IDs (artifact_id, brief_id, dispatch_attempt_id, social_signal_id, handoff_id) use mint-as-text |
| D-09b (`.c-notice` mandatory) | 211-02-01, 211-03-01, 211-04-01, 211-05-01, 211-06-01 | Every artifact-status notice, dispatch-status notice, social-signal route notice, degraded-attribution notice, measurement-handoff next-task notice composes `.c-notice c-notice--{info,warning,success,error}` from `styles/components.css`; no local `.banner`/`.alert`/`.warning`/`.noticeBar` classes |
| D-13 (`.c-card--feature` reserved) | All plans | `.c-card--feature` reserved for hero panels in `404-workspace` + `213.5` marketing; any future loop surface uses `.c-card` default — never `.c-card--feature` |
| D-14 (no `.c-table` primitive) | 211-02-01, 211-03-01, 211-04-01, 211-05-01, 211-06-01 | Any future tabular surface (artifact list, dispatch attempt log, social signal feed, revenue feedback ledger, measurement handoff history, growth-compatibility browser) uses vanilla `<table>` semantic + token-only recipe + `.c-badge--{state}` for row state |
| D-15 (selective extraction) | All plans | When a future phase extracts a loop-substrate read pattern into a reusable component, the extraction is selective: pages co-locate first, primitives extract only when reuse is proven across ≥2 surfaces |

### Cross-cutting doctrine binding (per 211-UI-SPEC §Inheritance Bindings)

| Doctrine map | UI-SPEC parent | Plan(s) inheriting |
|--------------|----------------|---------------------|
| 206 mutation-class doctrine (`external.send`, `public.claim`, `connector.mutate`, `data.export`, `billing.charge`, `price.change`) | 206-UI-SPEC | 211-03-01 (dispatch = `external.send` + dual-class `public.claim`), 211-04-01 (social mutations = `external.send` / `connector.mutate`), 211-05-01 (revenue exports = `data.export`), 211-06-01 (measurement exports = `data.export`) |
| 207 `RunApiEnvelope` + `AgentRunEventType` + `ApprovalHandoffRecord` | 207-UI-SPEC | 211-01-01 (`MarketingStrategyRun.agent_run_id`), 211-03-01 (`DispatchAttempt.approval_package_id` + `agent_run_id`) |
| 208 operator-cockpit consumer pattern (Approval Inbox, Recovery Center, Weekly Narrative, Morning Brief, Task Board) | 208-UI-SPEC | 211-01-01 (Morning Brief dissolution), 211-02-01 + 211-03-01 + 211-04-01 (Approval Inbox dissolution), 211-05-01 + 211-06-01 (Weekly Narrative dissolution), 211-06-01 (Task Board next-task consumption) |
| 209 evidence-gate dissolution (`<EvidenceSummary />` sub-component reused as read-only consumer) | 209-UI-SPEC | 211-02-01 + 211-03-01 (joint dissolution of 209 §Downstream row 6) |
| 210 connector substrate consumer (`ConnectorInstall` via `connector_install_id`) | 210-UI-SPEC | 211-03-01 (DispatchAttempt connector readiness gate) |

---

## Wave 0 Requirements

- [ ] `.planning/marketing-loop/211-upstream-readiness.md` - authoritative readiness checklist for Phases 205-210 with blocker ownership.
- [ ] `scripts/marketing-loop/check-loop-upstream-readiness.mjs` - hard and soft preflight for pricing, compliance, approvals, evidence, and connectors.
- [ ] `scripts/marketing-loop/check-loop-architecture-lock.mjs` - forbidden-pattern detector for silent auto-publish, unsupported-claim dispatch, and nonstandard test/router surfaces. EXTENDED to enforce the CLAUDE.md banned lexicon across `.planning/marketing-loop/*.md` doctrine prose (per UI-SPEC fold 2026-04-29).
- [ ] `scripts/marketing-loop/assert-loop-contract-baseline.mjs` - baseline validator for Phase 211 loop assumptions and plan-to-validation coverage.
- [ ] `test/marketing/phase-211/preflight/upstream-readiness.test.js`
- [ ] `test/marketing/phase-211/preflight/architecture-lock.test.js`
- [ ] `test/marketing/phase-211/preflight/contract-baseline.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Approval-to-dispatch sanity check | LOOP-04 | State-machine tests can pass while the human approval package is still unclear or incomplete. | Review one `blocked` and one `queued` DispatchAttempt and confirm the approval package, connector state, and rollback hint are understandable to an operator. |
| Social escalation routing sanity check | LOOP-05 | Classifier and routing logic can be syntactically correct while still creating poor operator workflow. | Inspect one urgent social signal and one spam signal, then confirm the route kinds and approval posture match the documented policy. |

---

## Validation Architecture

- **Preflight:** upstream readiness, architecture lock, and plan-to-validation baseline
- **Domain 1:** strategy and brief contracts, pricing requirement, evidence requirement, success target
- **Domain 2:** channel-native drafts, artifact audit states, pricing/evidence/compliance blockers
- **Domain 3:** approval-to-dispatch state machine, connector readiness, queue and failure posture
- **Domain 4:** social signal normalization, escalation, CRM or task routing, and approval defaults
- **Domain 5:** weighted attribution reuse, degraded revenue posture, and weekly narrative source readiness
- **Domain 6:** expected performance envelopes, actual outcomes, next-task generation, and future-growth compatibility map

Architecture lock runs first in every wave. It should verify:

- required posture exists: `schedule_post`, `buildApprovalPackage`, `assertAgentMutationAllowed`, `buildWeightedAttributionModel`, `audit_claim`, and `expand_claim_evidence`
- forbidden Phase 211 patterns do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`, `silent auto-publish`, `dispatch without approval`, `hard-coded public price`, `unsupported claim publish`
- (UI-SPEC fold 2026-04-29) zero matches against the CLAUDE.md banned lexicon across `.planning/marketing-loop/*.md` doctrine prose: `synergy`, `leverage`, `empower`, `unlock`, `transform`, `revolutionize`, `supercharge`, `holistic`, `seamless`, `cutting-edge`, `innovative`, `game-changer`, `next-generation`, `world-class`, `best-in-class`, `reimagine`, `disrupt` (and no exclamation points)
- (UI-SPEC fold 2026-04-29) `growth-loop-compatibility-map.md` contains the literal `future_consumer` for all 8 rows AND zero matches against synonyms `planned`, `coming_soon`, `future_phase`

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `LOOP-01..08` and `QA-01..15` are distributed across Plans 01-06; upstream families remain integration inputs rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, `done`, AND `<ui_spec_fold>` blocks (per 2026-04-29 fold) |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, approval-safety guardrails, and nonstandard-surface lock; extended to enforce banned lexicon + future-consumer literal |
| 4. Compliance enforcement | LOCKED | Plans 02-04 require evidence, pricing, connector, and approval gates before external mutations; cross-binds to 206 mutation-class doctrine |
| 5. Cross-phase coordination | LOCKED | Plan 01 hard-gates Phase 211 on P205-P210 readiness; UI-SPEC inheritance maps document 14 downstream future-surface bindings + 5 dissolved gates + 4 opened gates |
| 6. Single-writer / governance posture | LOCKED | Phase 211 creates loop contracts and handoff rules; it does not re-own pricing, evidence, connectors, or learning substrate; ui_scope: NO_UI |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; UI-SPEC AC Coverage Map added 2026-04-29; frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 211-content-social-revenue-loop*
*Validation strategy created: 2026-04-27*
*UI-SPEC fold added: 2026-04-29*
*Source: 211-RESEARCH.md + 211-REVIEWS.md + 211-UI-SPEC.md*
