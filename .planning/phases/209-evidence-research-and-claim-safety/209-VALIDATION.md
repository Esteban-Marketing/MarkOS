---
phase: 209
slug: evidence-research-and-claim-safety
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 209 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node `--test` |
| **Config file** | none - uses the built-in Node runner |
| **Quick run command** | `npm test -- test/evidence/phase-209/preflight/` |
| **Full suite command** | `npm test -- test/evidence/phase-209/` |
| **Estimated runtime** | ~30-60s |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific domain suite, or `npm test -- test/evidence/phase-209/preflight/` for Wave 0.5 work.
- **After every plan wave:** Run `npm test -- test/evidence/phase-209/`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** ~60s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 209-01-00 | 01 | 1 | QA-01, QA-02 | preflight | `npm test -- test/evidence/phase-209/preflight/` | W0 missing | pending |
| 209-01-01 | 01 | 1 | EVD-01 | evidence-map-contract | `npm test -- test/evidence/phase-209/domain-1/` | W0 missing | pending |
| 209-02-01 | 02 | 2 | EVD-03, EVD-06 | source-quality-and-pricing-bridge | `npm test -- test/evidence/phase-209/domain-2/` | W0 missing | pending |
| 209-03-01 | 03 | 3 | EVD-01, EVD-02, EVD-04 | freshness-and-known-gaps | `npm test -- test/evidence/phase-209/domain-3/` | W0 missing | pending |
| 209-04-01 | 04 | 4 | EVD-02, EVD-05 | approval-blocking | `npm test -- test/evidence/phase-209/domain-4/` | W0 missing | pending |
| 209-05-01 | 05 | 5 | EVD-04 | research-context-reuse | `npm test -- test/evidence/phase-209/domain-5/` | W0 missing | pending |
| 209-06-01 | 06 | 6 | EVD-01..06 | citation-and-hallucination-defense | `npm test -- test/evidence/phase-209/domain-6/hallucination-defense.test.js` | W0 missing | pending |
| 209-06-02 | 06 | 6 | EVD-05, EVD-06 | future-claim-evidence-matrix | `npm test -- test/evidence/phase-209/domain-6/future-consumers.test.js` | W0 missing | pending |

---

## Wave 0 Requirements

- [ ] `.planning/evidence/209-upstream-readiness.md` - authoritative readiness checklist for Phases 205-208 with blocker ownership.
- [ ] `scripts/evidence/check-evidence-upstream-readiness.mjs` - hard and soft preflight for pricing, compliance, AgentRun lineage, and approval-surface posture.
- [ ] `scripts/evidence/check-evidence-architecture-lock.mjs` - forbidden-pattern detector for unsupported-claim approval, freshness bypass, and nonstandard test/router surfaces.
- [ ] `scripts/evidence/assert-evidence-contract-baseline.mjs` - baseline validator for plan-to-validation coverage and evidence doctrine assumptions.
- [ ] `test/evidence/phase-209/preflight/upstream-readiness.test.js`
- [ ] `test/evidence/phase-209/preflight/architecture-lock.test.js`
- [ ] `test/evidence/phase-209/preflight/contract-baseline.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Approval evidence sanity check | EVD-05 | Contract tests can pass while approval evidence is still too confusing for a human reviewer. | Review one blocked approval and one editable approval snapshot and confirm the evidence summary, TTL posture, and unsupported-claim list are understandable without reading raw logs. |
| Inference-label sanity check | EVD-02 | Automated labels can be syntactically correct while still misleading a human about factual certainty. | Review one `supported`, one `inferred`, and one `unsupported` fixture and confirm the label meaning is obvious to an operator. |

---

## Validation Architecture

- **Preflight:** upstream readiness, architecture lock, and plan-to-validation baseline
- **Domain 1:** EvidenceMap fields, claim relations, inference labels, redaction posture
- **Domain 2:** source-quality rubric, research tiers, claim-class thresholds, pricing-evidence bridge
- **Domain 3:** TTL, freshness, contradictory evidence, known-gap creation, refresh triggers
- **Domain 4:** approval evidence snapshots, blocked action families, override lineage
- **Domain 5:** research-context lookup, reuse decisions, insufficiency triggers, AgentRun linkage
- **Domain 6:** citation fixtures, inference labeling, hallucination defense, and future claim-evidence consumer map

Architecture lock runs first in every wave. It should verify:

- required posture exists: `audit_claim`, `audit_claim_strict`, `expand_claim_evidence`, `buildGovernanceEvidencePack`, `buildReadinessReport`, and `EvidencePanel`
- forbidden Phase 209 patterns do not appear: `vitest`, `playwright`, `.test.ts`, `route.ts`, `approve unsupported claim`, `freshness ignored`, `price claim without timestamp`, `silent inference`

---

## Dimensions Coverage (Nyquist 8 dimensions)

| Dimension | Status | Coverage |
|-----------|--------|----------|
| 1. Requirements coverage | DRAFT | `EVD-01..06` and `QA-01..15` are distributed across Plans 01-06; upstream families remain integration inputs rather than primary ownership |
| 2. Anti-shallow execution | DRAFT | Each plan includes explicit `read_first`, `action`, `acceptance_criteria`, `verify`, and `done` blocks |
| 3. Architecture-lock | LOCKED | Plan 01 owns the preflight, unsupported-claim guardrails, and nonstandard-surface lock |
| 4. Compliance enforcement | LOCKED | Plans 02-04 require pricing evidence, public-claim posture, and approval blocking before customer-facing claims are trusted |
| 5. Cross-phase coordination | LOCKED | Plan 01 hard-gates Phase 209 on P205-P208 readiness rather than letting evidence work absorb missing upstream systems |
| 6. Single-writer / governance posture | LOCKED | Phase 209 creates evidence contracts and claim-safety rules; it does not re-own pricing, loop, or approval-surface substrate |
| 7. Test runner pinned | LOCKED | Node `--test`; no `vitest`, no `playwright` |
| 8. Validation strategy (this doc) | DRAFT | Full sampling strategy defined; frontmatter stays false until execution proves Wave 0 and task coverage |

---

*Phase: 209-evidence-research-and-claim-safety*
*Validation strategy created: 2026-04-27*
*Source: 209-RESEARCH.md + 209-REVIEWS.md*
