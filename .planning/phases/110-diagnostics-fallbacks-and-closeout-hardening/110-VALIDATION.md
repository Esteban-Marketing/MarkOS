---
phase: 110
slug: diagnostics-fallbacks-and-closeout-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 110 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (built-in Node.js) |
| **Config file** | None — run directly |
| **Quick run command** | `node --test test/pack-diagnostics.test.js` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/pack-diagnostics.test.js`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 110-W0-01 | 01 | 0 | GOV-01, GOV-02 | — | N/A | unit | `node --test test/pack-diagnostics.test.js` | ❌ W0 | ⬜ pending |
| 110-01-01 | 01 | 1 | GOV-01 | T-110-01 | Stub pack → fallbackApplied=true in response | integration | `node --test test/pack-diagnostics.test.js` | ❌ W0 | ⬜ pending |
| 110-01-02 | 01 | 1 | GOV-01 | T-110-01 | Null basePack → fallbackApplied=true | integration | `node --test test/pack-diagnostics.test.js` | ❌ W0 | ⬜ pending |
| 110-01-03 | 01 | 1 | GOV-01 | T-110-02 | Missing overlay → base-only, fallbackApplied computed | integration | `node --test test/pack-diagnostics.test.js` | ❌ W0 | ⬜ pending |
| 110-02-01 | 02 | 1 | GOV-02 | T-110-03 | operator_override preserved in packDiagnostics | integration | `node --test test/pack-diagnostics.test.js` | ❌ W0 | ⬜ pending |
| 110-02-02 | 02 | 1 | GOV-02 | — | packDiagnostics present alongside packSelection in /approve response | integration | `node --test test/pack-diagnostics.test.js` | ❌ W0 | ⬜ pending |
| 110-03-01 | 03 | 2 | GOV-01 | — | All 9 authored combos resolve with fallbackApplied=false after graduation | integration | `node --test test/pack-diagnostics.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/pack-diagnostics.test.js` — Suite 110: stubs for GOV-01, GOV-02, INIT-02 (all diagnostics + fallback path tests)

*Existing infrastructure: `test/setup.js` helpers (`createJsonRequest`, `withMockedModule`) are sufficient — no new fixtures needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Operator Override UI step renders in onboarding flow | GOV-02 | Browser UI — no headless test harness | Open onboarding UI, advance to step 4, verify dropdown options for base family + overlay, submit override, confirm seed.packSelection.overrideReason = "operator_override" in seed.json |

---

## Regression Checks (Must Stay Green)

| File | Suite | Command | Expected After Phase 110 |
|------|-------|---------|--------------------------|
| `test/pack-loader.test.js` | 106, 108 | `node --test test/pack-loader.test.js` | Stays green — no `"partial"` assertions, graduation is additive |
| `test/skeleton-generator.test.js` | All | `node --test test/skeleton-generator.test.js` | Stays green — `packDiagnostics` is additive to response body |
| `test/example-resolver.test.js` | Suite 6 | `node --test test/example-resolver.test.js` | Unaffected — no pack-loader changes break this |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
