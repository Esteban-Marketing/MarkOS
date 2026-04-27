---
phase: 212
slug: learning-literacy-evolution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
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
- [ ] `scripts/literacy/check-learning-architecture-lock.mjs` - forbidden-pattern detector for raw-tenant promotion, silent prompt drift, and nonstandard test/router surfaces.
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

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `LRN-01..05` and `QA-01..15` are distributed across Plans 01-05; upstream families remain integration inputs rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, and `done` blocks |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, raw-tenant promotion guard, and nonstandard-surface lock |
| 4. Compliance enforcement | LOCKED | Plans 03-05 require admin review, anonymization thresholds, provenance, and explicit task visibility |
| 5. Cross-phase coordination | LOCKED | Plan 01 hard-gates execution on P206/P207/P208/P209/P211 readiness rather than letting P212 absorb upstream gaps |
| 6. Single-writer / governance posture | LOCKED | P212 creates learning objects and linkage rules; it does not re-own evidence, compliance, or task-routing substrate |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 212-learning-literacy-evolution*
*Validation strategy created: 2026-04-27*
*Source: 212-RESEARCH.md + 212-REVIEWS.md*
