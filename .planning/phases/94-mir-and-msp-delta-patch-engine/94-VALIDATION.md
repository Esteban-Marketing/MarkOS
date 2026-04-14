---
phase: 94
slug: mir-and-msp-delta-patch-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 94 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node test runner (`node:test`) |
| **Config file** | none - direct `node --test` and repo scripts |
| **Quick run command** | `node --test test/phase-94/patch-preview-contract.test.js test/phase-94/suggestion-only-fallback.test.js` |
| **Wave regression command** | `node --test test/phase-94/*.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | quick checks <=45 seconds; phase regression <=150 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-specific verification command from the map below.
- **After every plan wave:** Run `node --test test/phase-94/*.test.js` plus the approval and vault regressions touched by the preview contract.
- **Before verification / closeout:** Full `npm test` must be green.
- **Max feedback latency:** 45 seconds for targeted checks; 150 seconds for the phase slice.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 94-01-01 | 01 | 1 | DRT-10, DRT-16 | T-94-01 / T-94-02 | Preview envelopes stay portable, preview-only, and review-required | unit/contract | `node --test test/phase-94/patch-preview-contract.test.js test/phase-94/approval-boundary.test.js` | ❌ W0 | ⬜ pending |
| 94-01-02 | 01 | 1 | DRT-10, DRT-16 | T-94-03 / T-94-04 | Suggestion-only downgrade and evidence-linking rules are locked before engine wiring | unit/contract | `node --test test/phase-94/suggestion-only-fallback.test.js test/phase-94/evidence-linking.test.js` | ❌ W0 | ⬜ pending |
| 94-02-01 | 02 | 2 | DRT-06, DRT-07 | T-94-05 / T-94-06 | Filter-aware target resolution maps evidence to the correct MIR/MSP section only | unit/contract | `node --test test/phase-94/section-target-resolution.test.js` | ❌ W0 | ⬜ pending |
| 94-02-02 | 02 | 2 | DRT-06, DRT-07, DRT-10 | T-94-05 / T-94-07 | The delta engine produces narrow before/after section previews instead of broad rewrites | unit/integration | `node --test test/phase-94/delta-engine.test.js test/phase-94/evidence-linking.test.js` | ❌ W0 | ⬜ pending |
| 94-02-03 | 02 | 2 | DRT-07, DRT-10 | T-94-03 / T-94-06 | Contradictions and weak evidence downgrade concrete patches to review-safe suggestions | unit/integration | `node --test test/phase-94/delta-engine.test.js test/phase-94/suggestion-only-fallback.test.js` | ❌ W0 | ⬜ pending |
| 94-03-01 | 03 | 3 | DRT-07, DRT-10, DRT-16 | T-94-07 / T-94-08 | Cross-surface payloads carry identical preview semantics and traceability | contract | `node --test test/phase-94/cross-surface-preview-envelope.test.js` | ❌ W0 | ⬜ pending |
| 94-03-02 | 03 | 3 | DRT-10, DRT-16 | T-94-02 / T-94-08 | Review packaging remains non-mutating and auditable across CLI, MCP, API, and editor flows | unit/integration | `node --test test/phase-94/cross-surface-preview-envelope.test.js test/phase-94/approval-boundary.test.js` | ❌ W0 | ⬜ pending |
| 94-03-03 | 03 | 3 | DRT-06, DRT-07, DRT-10, DRT-16 | T-94-01 / T-94-07 / T-94-08 | The final preview entrypoint is narrow, evidence-linked, review-safe, and regression-clean | regression | `node --test test/phase-94/*.test.js test/onboarding-approve-handler.test.js test/vault-writer.test.js test/write-mir.test.js && npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending - ✅ green - ❌ red - ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/phase-94/patch-preview-contract.test.js` - portable preview envelope and safety-flag coverage
- [ ] `test/phase-94/section-target-resolution.test.js` - filter-aware section resolution and heading-anchor normalization coverage
- [ ] `test/phase-94/delta-engine.test.js` - narrow section replace, append, and rationale coverage
- [ ] `test/phase-94/evidence-linking.test.js` - inline evidence, freshness, and contradiction rendering coverage
- [ ] `test/phase-94/suggestion-only-fallback.test.js` - weak or conflicting evidence downgrade coverage
- [ ] `test/phase-94/approval-boundary.test.js` - proof that preview generation never invokes write or approval bypass paths
- [ ] `test/phase-94/cross-surface-preview-envelope.test.js` - MCP/API/CLI/editor contract parity coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Review the patch preview readability for operators | DRT-10 | Requires human judgment on whether the before/after diff and evidence support are clear | Inspect sample preview payloads and confirm each changed block is understandable without opening raw provider traces |
| Review contradiction presentation and suggestion-only wording | DRT-07, DRT-10 | Requires product judgment about trust and review ergonomics | Inspect mixed-evidence examples and confirm the system clearly distinguishes a confident patch from a suggestion-only recommendation |
| Review cross-surface usefulness of the preview envelope | DRT-16 | Requires checking real usage in Copilot, CLI, and automation contexts | Compare sample outputs across surfaces and confirm the same semantics survive transport-specific rendering |

---

## Validation Sign-Off

- [x] All plan tasks have automated verification commands or explicit Wave 0 dependencies
- [x] Sampling continuity is maintained across all three plans
- [x] Wave 0 files are identified for every missing contract, engine, and cross-surface test
- [x] No watch-mode flags are used
- [x] Feedback latency stays under 150 seconds for the phase slice
- [ ] `nyquist_compliant: true` will be set after Wave 0 files exist and the commands pass

**Approval:** pending execution
