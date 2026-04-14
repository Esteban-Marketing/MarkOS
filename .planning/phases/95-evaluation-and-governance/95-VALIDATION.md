---
phase: 95
slug: evaluation-and-governance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 95 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node test runner (`node:test`) |
| **Config file** | none - direct `node --test` and repo scripts |
| **Quick run command** | `node --test test/phase-95/evaluation-contract.test.js test/phase-95/grounding-blockers.test.js` |
| **Wave regression command** | `node --test test/phase-95/*.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | quick checks <=45 seconds; phase regression <=150 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-specific verification command from the map below.
- **After every plan wave:** Run `node --test test/phase-95/*.test.js` plus the related governance, approval, and telemetry regressions.
- **Before verification / closeout:** Full `npm test` must be green.
- **Max feedback latency:** 45 seconds for targeted checks; 150 seconds for the phase slice.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 95-01-01 | 01 | 1 | DRT-08, DRT-10, DRT-13 | T-95-01 / T-95-02 | Ranked scorecard, winner/runner-up, and grounding-heavy evaluation contract stay deterministic | unit/contract | `node --test test/phase-95/evaluation-contract.test.js test/phase-95/scorecard-ranking.test.js` | ❌ W0 | ⬜ pending |
| 95-01-02 | 01 | 1 | DRT-10, DRT-13 | T-95-03 / T-95-04 | Diagnostics, allow-list preservation, and fixture coverage lock blocker vs warning behavior before evaluator wiring | unit/contract | `node --test test/phase-95/grounding-blockers.test.js test/phase-95/run-acceptance-flags.test.js test/phase-95/provider-audit-allowlist.test.js test/phase-95/personalization-lift-matrix.test.js` | ❌ W0 | ⬜ pending |
| 95-02-01 | 02 | 2 | DRT-08, DRT-09, DRT-10 | T-95-01 / T-95-03 | Weak grounding or missing provenance blocks promotion and requires review | unit/integration | `node --test test/phase-95/grounding-blockers.test.js test/phase-95/run-acceptance-flags.test.js` | ❌ W0 | ⬜ pending |
| 95-02-02 | 02 | 2 | DRT-08, DRT-10, DRT-13 | T-95-02 / T-95-04 | Run-level decisions preserve per-artifact warnings and provider ranking reasons | unit/integration | `node --test test/phase-95/scorecard-ranking.test.js test/phase-95/run-acceptance-flags.test.js` | ❌ W0 | ⬜ pending |
| 95-02-03 | 02 | 2 | DRT-09, DRT-13 | T-95-03 / T-95-05 | Missing route trace, stale citations, or contradiction gaps remain machine-readable and auditable | unit/integration | `node --test test/phase-95/grounding-blockers.test.js test/phase-95/evaluation-contract.test.js` | ❌ W0 | ⬜ pending |
| 95-03-01 | 03 | 3 | DRT-08, DRT-09, DRT-13 | T-95-05 / T-95-06 | Override notes and review packaging stay append-only, explicit, and cross-surface portable | contract | `node --test test/phase-95/override-audit.test.js test/phase-95/cross-surface-review-envelope.test.js` | ❌ W0 | ⬜ pending |
| 95-03-02 | 03 | 3 | DRT-09, DRT-10 | T-95-06 / T-95-07 | Governance telemetry and diagnostics are preserved without mutating approval boundaries | unit/integration | `node --test test/phase-95/override-audit.test.js test/phase-95/cross-surface-review-envelope.test.js test/onboarding-approve-handler.test.js` | ❌ W0 | ⬜ pending |
| 95-03-03 | 03 | 3 | DRT-08, DRT-09, DRT-10, DRT-13 | T-95-01 / T-95-05 / T-95-07 | Final evaluation surface is portable, read-safe, and regression-clean | regression | `node --test test/phase-95/*.test.js test/onboarding-approve-handler.test.js test/vault-writer.test.js test/llm-adapter/fallback-chain.test.js && npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending - ✅ green - ❌ red - ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/phase-95/evaluation-contract.test.js` - evaluation envelope and score breakdown coverage
- [ ] `test/phase-95/scorecard-ranking.test.js` - winner, runner-up, and explanation coverage
- [ ] `test/phase-95/grounding-blockers.test.js` - citation, provenance, freshness, and contradiction blocker coverage
- [ ] `test/phase-95/run-acceptance-flags.test.js` - run-level decision with per-artifact warning or blocked status coverage
- [ ] `test/phase-95/provider-audit-allowlist.test.js` - domain allow-list and provider audit signal preservation coverage
- [ ] `test/phase-95/personalization-lift-matrix.test.js` - representative industry, company, and audience fixture-matrix coverage
- [ ] `test/phase-95/override-audit.test.js` - manual override note and append-only audit evidence coverage
- [ ] `test/phase-95/cross-surface-review-envelope.test.js` - MCP/API/CLI/editor review contract parity coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Review whether the winner/runner-up scorecard is decision-oriented | DRT-08, DRT-10 | Requires product judgment on readability and usefulness | Inspect sample evaluation payloads and confirm the operator can quickly see who won, why, and what remains risky |
| Review whether blocker reasons are clear and trustworthy | DRT-09, DRT-13 | Requires human judgment about governance messaging quality | Inspect blocked and review-required examples and confirm the diagnostics make the risk and required next action obvious |
| Review whether override notes stay explicit and non-abusive | DRT-09 | Requires checking real governance ergonomics | Inspect sample override payloads and confirm the actor, rationale, and evidence references are visible and auditable |

---

## Validation Sign-Off

- [x] All plan tasks have automated verification commands or explicit Wave 0 dependencies
- [x] Sampling continuity is maintained across all three plans
- [x] Wave 0 files are identified for every missing contract, evaluator, and audit test
- [x] No watch-mode flags are used
- [x] Feedback latency stays under 150 seconds for the phase slice
- [ ] `nyquist_compliant: true` will be set after Wave 0 files exist and the commands pass

**Approval:** pending execution
