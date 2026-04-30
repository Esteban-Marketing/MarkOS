---
phase: 212
slug: learning-literacy-evolution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
ui_spec_folded: true
ui_spec_fold_date: 2026-04-29
---

# Phase 212 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` |
| **Config file** | none - uses the built-in Node runner |
| **Quick run command** | `npm test -- test/literacy/phase-212/preflight/` |
| **Full suite command** | `npm test -- test/literacy/phase-212/` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/literacy/phase-212/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/literacy/phase-212/`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 212-01-00 | 01 | 1 | QA-01, QA-02 | preflight | `npm test -- test/literacy/phase-212/preflight/` | ❌ W0 | ⬜ pending |
| 212-01-01 | 01 | 1 | LRN-01, LRN-02 | schema+outcome-envelope | `npm test -- test/literacy/phase-212/domain-1/` | ❌ W0 | ⬜ pending |
| 212-02-01 | 02 | 2 | LRN-03 | overlay+expiry+rls | `npm test -- test/literacy/phase-212/domain-2/` | ❌ W0 | ⬜ pending |
| 212-03-01 | 03 | 3 | LRN-05 | candidate+admin-review | `npm test -- test/literacy/phase-212/domain-3/` | ❌ W0 | ⬜ pending |
| 212-04-01 | 04 | 4 | LRN-04 | anonymization+thresholds | `npm test -- test/literacy/phase-212/domain-4/` | ❌ W0 | ⬜ pending |
| 212-05-01 | 05 | 5 | LRN-02, LRN-03 | recommendation-handoff | `npm test -- test/literacy/phase-212/domain-5/recommendation-handoff.test.js` | ❌ W0 | ⬜ pending |
| 212-05-02 | 05 | 5 | LRN-04, LRN-05 | future-growth-compatibility | `npm test -- test/literacy/phase-212/domain-5/growth-compatibility.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ❌ W0 = file does not exist yet (created in Wave 0)*

---

## Wave 0 Requirements

- [ ] `.planning/literacy/212-upstream-readiness.md` - authoritative P206/P207/P208/P209/P211 readiness checklist with blocker ownership.
- [ ] `scripts/literacy/check-learning-upstream-readiness.mjs` - hard and soft preflight for evidence, measurement, privacy, and task-handoff substrate.
- [ ] `scripts/literacy/check-learning-architecture-lock.mjs` - forbidden-pattern detector for raw-tenant promotion, silent prompt drift, banned lexicon, and the two carved-out scope rules (`single tenant raw lesson` allowed only in 212-03 endpoint; `must not apply customer-facing mutations directly` allowed only in 212-05 endpoint).
- [ ] `scripts/literacy/assert-artifact-performance-baseline.mjs` - baseline validator for Phase 211 handoff assumptions.
- [ ] `test/literacy/phase-212/preflight/upstream-readiness.test.js`
- [ ] `test/literacy/phase-212/preflight/architecture-lock.test.js`
- [ ] `test/literacy/phase-212/preflight/performance-baseline.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin promotion spot-check | LRN-05 | The queue can be validated automatically, but an operator still needs to confirm the promoted learning is actually safe and useful. | Review one `approved` and one `rejected` LiteracyUpdateCandidate and confirm the evidence summary, anonymized pattern, and reviewer rationale are understandable without tenant leakage. |
| Cross-tenant redaction sanity check | LRN-04 | Redaction logic can pass string checks while still revealing sensitive context indirectly. | Inspect one anonymized promotion payload and confirm it reveals no tenant, customer, pricing, or support-specific identifiers. |

---

## Validation Architecture

- **Preflight:** upstream readiness, architecture lock, Phase 211 measurement baseline
- **Domain 1:** expected-vs-actual performance envelope, degraded measurement, attribution linkage
- **Domain 2:** overlay RLS, confidence, expiry, suppression, and review
- **Domain 3:** candidate queue, reviewer decisions, and blocked direct promotion
- **Domain 4:** anonymization transforms, sample-size gates, privacy denials
- **Domain 5:** recommendation-to-task handoff and future-growth compatibility map

Architecture lock runs first in every wave. It should verify:

- required posture exists: `buildWeightedAttributionModel`, `buildReadinessReport`, `evaluateLiteracyReadiness`, `recordDisciplineActivationEvidence`, and the Phase 211 measurement-handoff outputs
- forbidden phase-212 patterns do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`, `promote raw tenant copy`, `auto-promote literacy`, `silent prompt drift`
- carved-out scope strings are restricted to their carved-out files: `single tenant raw lesson` allowed ONLY in `api/v1/literacy/review.js`; `must not apply customer-facing mutations directly` allowed ONLY in `api/v1/literacy/recommendations.js`

---

## UI-SPEC AC Coverage Map

> Added 2026-04-29 as part of the 212-UI-SPEC light fold (no-UI variant).
> Maps every UI-SPEC backend doctrine assertion + translation gate dissolution/opening + downstream UI inheritance citation + 213.4 carry-forward + cross-cutting doctrine binding to a specific plan/task that owns enforcement.

### Backend doctrine assertions

| Assertion | Owning Plan / Task | Enforcement Mechanism |
|-----------|--------------------|----------------------|
| Architecture-lock forbidden string `promote raw tenant copy` | 212-01-00 | `scripts/literacy/check-learning-architecture-lock.mjs` rejects verbatim |
| Architecture-lock forbidden string `auto-promote literacy` | 212-01-00 | `scripts/literacy/check-learning-architecture-lock.mjs` rejects verbatim |
| Architecture-lock forbidden string `silent prompt drift` | 212-01-00 | `scripts/literacy/check-learning-architecture-lock.mjs` rejects verbatim |
| Carved-out scope: `single tenant raw lesson` allowed ONLY in `api/v1/literacy/review.js` | 212-01-00 enforces; 212-03-01 owns the carved-out file | Architecture-lock CI script + 212-03-01 AC asserts string in `api/v1/literacy/review.js` |
| Carved-out scope: `must not apply customer-facing mutations directly` allowed ONLY in `api/v1/literacy/recommendations.js` | 212-01-00 enforces; 212-05-01 owns the carved-out file | Architecture-lock CI script + 212-05-01 AC asserts string in `api/v1/literacy/recommendations.js` |
| Banned-lexicon zero-match in `.planning/literacy/*.md` (8 docs total) | 212-01-00 owns CI; each plan asserts zero-match for its own doctrine docs | Architecture-lock CI script + per-plan AC |
| Privacy-denylist literal `tenant identifiers` | 212-04-01 | AC asserts verbatim in `cross-tenant-anonymization-policy.md` AND `lib/markos/learning/privacy-rules.ts` |
| Privacy-denylist literal `person names` | 212-04-01 | AC asserts verbatim in `cross-tenant-anonymization-policy.md` AND `lib/markos/learning/privacy-rules.ts` |
| Privacy-denylist literal `customer names` | 212-04-01 | AC asserts verbatim in `cross-tenant-anonymization-policy.md` AND `lib/markos/learning/privacy-rules.ts` |
| Privacy-denylist literal `contact details` | 212-04-01 | AC asserts verbatim in `cross-tenant-anonymization-policy.md` AND `lib/markos/learning/privacy-rules.ts` |
| Privacy-denylist literal `raw pricing` | 212-04-01 | AC asserts verbatim in `cross-tenant-anonymization-policy.md` AND `lib/markos/learning/privacy-rules.ts` |
| Privacy-denylist literal `support transcripts` | 212-04-01 | AC asserts verbatim in `cross-tenant-anonymization-policy.md` AND `lib/markos/learning/privacy-rules.ts` |
| Privacy-denylist literal `campaign copy that still reveals tenant identity` | 212-04-01 | AC asserts verbatim in `cross-tenant-anonymization-policy.md` AND `lib/markos/learning/privacy-rules.ts` |
| Privacy-denylist literal `proprietary operator notes` | 212-04-01 | AC asserts verbatim in `cross-tenant-anonymization-policy.md` AND `lib/markos/learning/privacy-rules.ts` |
| Threshold literal `sample_size >= 3` | 212-04-01 | AC asserts verbatim in `sample-size-thresholds.md` |
| Threshold literal `supporting_artifact_count >= 5` | 212-04-01 | AC asserts verbatim in `sample-size-thresholds.md` |
| Threshold literal `average_confidence_score >= 0.70` | 212-04-01 | AC asserts verbatim in `sample-size-thresholds.md` |
| Threshold values `3`, `5`, `0.70` in runtime | 212-04-01 | AC asserts verbatim in `lib/markos/learning/privacy-rules.ts` |
| `future_only` literal exact (NOT `future_consumer`, NOT `planned`/`coming_soon`/`future_phase`) | 212-05-02 | AC asserts verbatim in `growth-learning-compatibility-map.md` (7 rows) AND `lib/markos/learning/growth-compatibility.ts` AND `test/literacy/phase-212/domain-5/growth-compatibility.test.js` |

### Translation gate dissolutions (5 dissolved by 212)

| Dissolved Gate | Source UI-SPEC | Owning 212 Plan/Task | Dissolution Mechanism |
|----------------|----------------|----------------------|------------------------|
| 209 §Downstream learning-fixture evidence ledger row (`<PlaceholderBanner variant="future_phase_212">`) | 209-UI-SPEC §Downstream UI Inheritance Map | 212-01-01 publishes `ArtifactPerformanceLog.evidence_refs`; 212-02-01 publishes `TenantOverlay.evidence_refs` + `provenance_ref` | Future learning-fixture evidence ledger surfaces compose `<EvidenceSummary />` over either array |
| 209 `inference_label == 'inferred'` placeholder for learning-derived inferences | 209-UI-SPEC | 212-01-01 publishes `ArtifactPerformanceLog.lesson_summary` + `confidence_score` | Future surfaces compose inference-label chip with deep link to ArtifactPerformanceLog or TenantOverlay |
| 210 §Surface A onboarding `<PlaceholderBanner variant="future_phase_212">` for tenant-profile personalization | 210-UI-SPEC | 212-05-01 publishes `LearningRecommendation` with `recommendation_kind == 'experiment_candidate'` + `connector_fix` | 210 onboarding surface composes LearningRecommendation chips for personalized connector recommendations |
| 211 §Translation Gates Opened `MeasurementHandoff.learning_ready == true` placeholder | 211-UI-SPEC | 212-01-01 ingests P211 `MeasurementHandoff` outputs via `artifact_id` foreign key + 212-05-01 ingests `next_task_kind` literals | Future surfaces bind to `ArtifactPerformanceLog` and `LearningRecommendation` directly |
| 208-UI-SPEC Approval Inbox handoff-kind learning admin-review variant placeholder | 208-UI-SPEC | 212-03-01 publishes `LiteracyUpdateCandidate` envelope and `api/v1/literacy/review.js` endpoint | Future P208 redeploy renders learning-originated approval items via `ApprovalHandoffRecord.task_ref` |

### Translation gates opened (4 opened by 212)

| Opened Gate | Placeholder Variant | Owning 212 Plan/Task | Dissolution Phase |
|-------------|---------------------|----------------------|-------------------|
| Tenant 0 closeout consumers | `<PlaceholderBanner variant="future_phase_213_tenant0">` | 212-01..212-05 (full doctrine substrate); explicitly cited by 212-05-01 + 212-05-02 in `must_haves` | P213 |
| Growth-learning-compatibility consumers (PLG, ABM, community, events, PR, partnerships, developer marketing) | `<PlaceholderBanner variant="future_growth_learning_module">` | 212-05-02 (7 `future_only` rows) | P217+ |
| SaaS Marketing OS Strategy growth consumers | `<PlaceholderBanner variant="future_phase_218">` (or 219/220) | 212-05-01 (`recommendation_kind == 'experiment_candidate'`) | P218, P219, P220 |
| Analytics + narrative intelligence consumers | `<PlaceholderBanner variant="future_phase_225">` | 212-01..212-05 (4 learning record types as governed inputs) | P225 |

### Downstream UI inheritance citations (13 future surfaces)

| # | Future surface | Originating 212 Plan/Task | Future Phase that Ships | UI-SPEC §Downstream Row |
|---|----------------|----------------------------|--------------------------|--------------------------|
| 1 | ArtifactPerformanceLog dashboard | 212-01-01 | P208 admin extension or P213 | row 1 |
| 2 | TenantOverlay browser | 212-02-01 | P208 admin extension | row 2 |
| 3 | LiteracyUpdateCandidate admin review queue | 212-03-01 | P208 Approval Inbox extension | row 3 |
| 4 | Cross-tenant promotion approval inbox extension | 212-03-01 | P208-extension | row 4 |
| 5 | LearningRecommendation Task Board feed | 212-05-01 | P208 Task Board redeploy | row 5 |
| 6 | Anonymization audit trail | 212-04-01 | P208 admin extension | row 6 |
| 7 | Suppression list browser (overlays + recommendations) | 212-02-01 + 212-05-01 | P208 admin extension | row 7 |
| 8 | Promotion lineage timeline | 212-03-01 | P208 admin extension | row 8 |
| 9 | Privacy threshold viewer | 212-04-01 | P208 admin extension | row 9 |
| 10 | Future-growth-learning compatibility browser | 212-05-02 | P217+ | row 10 |
| 11 | Learning-fixture evidence ledger per fixture | 212-01-01 + 212-02-01 | P208 or P209-evidence consumer | row 11 |
| 12 | Tenant 0 learning-readiness panel | 212-01..212-05 (all 4 record types) | P213 | row 12 |
| 13 | Recovery Center learning-failure variant | 212-01-01 + 212-05-01 | P208 Recovery Center extension | row 13 |

### 213.4 carry-forward (D-08..D-15)

| 213.x Decision | Forward-binding rule | Carry-forward declared by |
|----------------|----------------------|----------------------------|
| D-08 (token-only) | Performance-log measurement-status badges, attribution-status badges, overlay review-status chips, candidate decision badges, recommendation-kind chips, recommendation-priority chips, anonymization denial-reason chips all token-only via `var(--color-*)` | All 5 plans (cross-cutting carry-forward) |
| D-09 (mint-as-text) | Performance-log-ID copy-link CTAs, overlay-ID chips, candidate-ID chips, recommendation-ID chips, source-overlay-ref chips use mint-as-text via `--color-primary-text` | All 5 plans |
| D-09b (`.c-notice` mandatory) | Every measurement-status, attribution-status, overlay review-status, candidate decision, privacy-denial, threshold-failure notice composes `.c-notice c-notice--{info,warning,success,error}` | All 5 plans |
| D-13 (`.c-card--feature` reserved) | Future learning surfaces use `.c-card` default; never `.c-card--feature` | All 5 plans |
| D-14 (no `.c-table` primitive) | Future tabular surfaces use vanilla `<table>` semantic + token-only recipe + `.c-badge--{state}` | All 5 plans |
| D-15 (selective extraction) | Pages co-locate with their learning-record read first; primitives extract only when reuse is proven across ≥2 surfaces | All 5 plans |

### Cross-cutting doctrine binding (5 inheritance maps)

| Inheritance map | Binding | Owning 212 Plan/Task |
|------------------|---------|----------------------|
| 206 (mutation-class) | `public.claim` for promoted central-literacy entries; `data.export` for cross-tenant anonymized exports; DUAL-CLASS for promotion that exports aggregates | 212-03-01 (promote action), 212-04-01 (audit-trail / threshold-config export) |
| 207 (RunApiEnvelope + ApprovalHandoffRecord) | `agent_run_id` deep-link from ArtifactPerformanceLog; `ApprovalHandoffRecord.handoff_kind == 'approval'` for LiteracyUpdateCandidate review | 212-01-01 (`agent_run_id` field), 212-03-01 (handoff lineage) |
| 208 (operator cockpit consumers) | Approval Inbox = LiteracyUpdateCandidate review consumer; Task Board = `recommendation_kind == 'task_create'` consumer; Recovery Center = learning-substrate failure consumer | 212-03-01 (Approval Inbox), 212-05-01 (Task Board + Recovery) |
| 209 (EvidenceMap binding + immutable-evidence pattern + source-quality posture) | `evidence_refs[]` arrays compose `<EvidenceSummary />`; anonymization audit trail mirrors 209 immutability; promotion evidence inherits source-quality / freshness | 212-01-01 (`evidence_refs`), 212-02-01 (`evidence_refs`), 212-03-01 (`evidence_summary`), 212-04-01 (immutable audit trail) |
| 211 (loop substrate + MeasurementHandoff seeding) | `MeasurementHandoff.learning_ready == true` is the binding signal for ArtifactPerformanceLog ingestion; `next_task_kind` literals feed `recommendation_kind` | 212-01-01 (handoff ingestion), 212-05-01 (next-task mapping) |

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `LRN-01..05` and `QA-01..15` are distributed across Plans 01-05; upstream families remain integration inputs rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, and `done` blocks; `<ui_spec_fold>` block adds UI-SPEC inheritance citations |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, raw-tenant promotion guard, nonstandard-surface lock, AND the carved-out scope rules for `single tenant raw lesson` (212-03 only) and `must not apply customer-facing mutations directly` (212-05 only) |
| 4. Compliance enforcement | LOCKED | Plans 03-05 require admin review, anonymization thresholds, provenance, and explicit task visibility; mutation-class doctrine `public.claim` + `data.export` declared per 206-02 |
| 5. Cross-phase coordination | LOCKED | Plan 01 hard-gates execution on P206/P207/P208/P209/P211 readiness; UI-SPEC fold cites 5 inheritance maps simultaneously (206, 207, 208, 209, 211, 212) |
| 6. Single-writer / governance posture | LOCKED | P212 creates learning objects and linkage rules; it does not re-own evidence, compliance, or task-routing substrate |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; UI-SPEC AC Coverage Map added 2026-04-29; frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 212-learning-literacy-evolution*
*Validation strategy created: 2026-04-27*
*UI-SPEC fold applied: 2026-04-29 (light fold, no-UI variant)*
*Source: 212-RESEARCH.md + 212-REVIEWS.md + 212-UI-SPEC.md*
