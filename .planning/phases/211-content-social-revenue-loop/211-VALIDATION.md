---
phase: 211
slug: content-social-revenue-loop
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
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

## Wave 0 Requirements

- [ ] `.planning/marketing-loop/211-upstream-readiness.md` - authoritative readiness checklist for Phases 205-210 with blocker ownership.
- [ ] `scripts/marketing-loop/check-loop-upstream-readiness.mjs` - hard and soft preflight for pricing, compliance, approvals, evidence, and connectors.
- [ ] `scripts/marketing-loop/check-loop-architecture-lock.mjs` - forbidden-pattern detector for silent auto-publish, unsupported-claim dispatch, and nonstandard test/router surfaces.
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

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `LOOP-01..08` and `QA-01..15` are distributed across Plans 01-06; upstream families remain integration inputs rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, and `done` blocks |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, approval-safety guardrails, and nonstandard-surface lock |
| 4. Compliance enforcement | LOCKED | Plans 02-04 require evidence, pricing, connector, and approval gates before external mutations |
| 5. Cross-phase coordination | LOCKED | Plan 01 hard-gates Phase 211 on P205-P210 readiness rather than letting the loop phase absorb missing upstream work |
| 6. Single-writer / governance posture | LOCKED | Phase 211 creates loop contracts and handoff rules; it does not re-own pricing, evidence, connectors, or learning substrate |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 211-content-social-revenue-loop*
*Validation strategy created: 2026-04-27*
*Source: 211-RESEARCH.md + 211-REVIEWS.md*
