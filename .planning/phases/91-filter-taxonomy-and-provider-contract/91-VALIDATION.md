---
phase: 91
slug: filter-taxonomy-and-provider-contract
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 91 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node test runner (`node:test`) |
| **Config file** | none - package scripts and direct `node --test` runs |
| **Quick run command** | `node --test test/phase-91/filter-taxonomy-v1.test.js test/phase-91/deep-research-envelope.test.js` |
| **Wave regression command** | `node --test test/phase-91/*.test.js` |
| **Full suite command** | `node --test test/**/*.test.js` |
| **Estimated runtime** | quick checks <=30 seconds; phase regression <=60 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-specific command from the verification map using the fastest available Phase 91 smoke check.
- **After every plan wave:** Run `node --test test/phase-91/*.test.js`.
- **Before verification / closeout:** Phase 91 regression must be green and the preview-only policy must remain enforced.
- **Max feedback latency:** 30 seconds for task-level checks; 60 seconds for the phase regression slice.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 91-01-01 | 01 | 1 | DRT-01, DRT-14 | T-91-01 / T-91-03 | Universal JSON envelope rejects invalid payloads and enforces preview-safe defaults | unit | `node --test test/phase-91/filter-taxonomy-v1.test.js test/phase-91/deep-research-envelope.test.js` | ❌ W0 | ⬜ pending |
| 91-01-02 | 01 | 1 | DRT-01, DRT-02 | T-91-02 / T-91-04 | Core filters normalize deterministically and extensions preserve forward compatibility without schema drift | unit | `node --test test/phase-91/filter-taxonomy-v1.test.js test/phase-91/deep-research-envelope.test.js` | ❌ W0 | ⬜ pending |
| 91-02-01 | 02 | 2 | DRT-11 | T-91-05 / T-91-06 | Internal-first routing, authority labels, and degraded warnings are preserved | unit | `node --test test/phase-91/provider-routing-policy.test.js` | ❌ W0 | ⬜ pending |
| 91-02-02 | 02 | 2 | DRT-02, DRT-11 | T-91-06 / T-91-08 | Allowed-domain policy and ranking hints shape route behavior without requiring live providers | unit | `node --test test/phase-91/provider-routing-policy.test.js test/phase-91/preview-patch-policy.test.js` | ❌ W0 | ⬜ pending |
| 91-02-03 | 02 | 2 | DRT-08 | T-91-07 / T-91-08 | Patch previews remain preview-only and approval bypass is impossible | unit | `node --test test/phase-91/*.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending - ✅ green - ❌ red - ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/phase-91/filter-taxonomy-v1.test.js` - contract tests for required core filters and extensibility
- [ ] `test/phase-91/deep-research-envelope.test.js` - request/response envelope validation tests
- [ ] `test/phase-91/provider-routing-policy.test.js` - internal-first and degraded fallback tests
- [ ] `test/phase-91/preview-patch-policy.test.js` - preview-only patch safety tests
- [ ] `onboarding/backend/research/*.cjs` modules created to satisfy the contract and policy checks

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Review the request/response envelope for cross-client readability | DRT-14 | Requires human inspection across Copilot / CLI / agentic usage patterns | Confirm that the same JSON shape makes sense without client-specific fields or editor-only assumptions |
| Review patch preview semantics for operator clarity | DRT-08 | Requires product judgment on whether proposed deltas are inspectable and understandable | Inspect sample preview payloads and verify they contain rationale, evidence, and approval state |

---

## Validation Sign-Off

- [x] All plan tasks have automated verification commands or explicit Wave 0 dependencies
- [x] Sampling continuity is maintained across both plans
- [x] Wave 0 files are identified for every missing contract/policy test
- [x] No watch-mode flags are used
- [x] Feedback latency stays below 60s for the phase slice
- [ ] `nyquist_compliant: true` will be set after Wave 0 files exist and the commands pass

**Approval:** pending execution
