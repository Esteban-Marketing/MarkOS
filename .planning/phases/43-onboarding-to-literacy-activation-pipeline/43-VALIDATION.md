---
phase: 43
slug: onboarding-to-literacy-activation-pipeline
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-01
---

# Phase 43 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.


## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (built-in) + `node:assert/strict` |
| **Config file** | none - glob invocation |
| **Quick run command** | `node --test test/onboarding-server.test.js -x` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/onboarding-server.test.js -x`
- **After every plan wave:** Run `node --test test/**/*.test.js`
- **Before `/gsd-verify-work`:** Full suite must be green via `npm test`
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 43-01-01 | 01 | 0 | LIT-13 | integration (stub) | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-01-02 | 01 | 0 | LIT-14 | integration (stub) | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-01-03 | 01 | 0 | LIT-15 | unit/integration (stub) | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-02-01 | 02 | 1 | LIT-13 | unit | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-02-02 | 02 | 1 | LIT-13 | integration | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-02-03 | 02 | 1 | LIT-13 | unit | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-03-01 | 03 | 2 | LIT-13 | integration | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-03-02 | 03 | 2 | LIT-15 | integration | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-03-03 | 03 | 2 | LIT-13 | regression | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-04-01 | 04 | 3 | LIT-14 | integration | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-04-02 | 04 | 3 | LIT-14 | integration | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-04-03 | 04 | 3 | LIT-14 | regression | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-05-01 | 05 | 4 | LIT-13 | integration | `node --test test/**/*.test.js` | ✅ | ✅ green |
| 43-05-02 | 05 | 4 | LIT-14 | integration/docs | `node --test test/onboarding-server.test.js -x` | ✅ | ✅ green |
| 43-05-03 | 05 | 4 | LIT-15 | e2e/telemetry | `npm test` | ✅ | ✅ green |

*Status: ⬜ pending - ✅ green - ❌ red - ⚠️ flaky*

---

## Wave 0 Requirements

	- [x] Extend `test/onboarding-server.test.js` with submit literacy readiness contract stubs for `ready`, `partial`, and `unconfigured`
	- [x] Extend `test/onboarding-server.test.js` with status literacy block shape + parity stubs
	- [x] Extend `test/onboarding-server.test.js` with telemetry assertion stubs for `literacy_activation_observed`

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ Wave 4 complete — 153/153 pass, 0 fail (`npm test`). nyquist_compliant: true.
