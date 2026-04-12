---
phase: 81
slug: governance-publish-and-rollback-operational-surface
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 81 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (Node.js built-in) |
| **Config file** | None — invoked directly |
| **Quick run command** | `node --test test/phase-81/*.test.js` |
| **Full suite command** | `node --test test/**/*.test.js` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/phase-81/*.test.js`
- **After every plan wave:** Run `node --test test/**/*.test.js`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 81-01-01 | 01 | 0 | BRAND-GOV-01 | — | Test stubs created before impl | unit | `node --test test/phase-81/*.test.js` | ❌ W0 | ⬜ pending |
| 81-02-01 | 02 | 1 | BRAND-GOV-01 | — | brand-publish: 200 on gate pass + traceability_entry | integration | `node --test test/phase-81/brand-publish-route.test.js` | ❌ W0 | ⬜ pending |
| 81-02-02 | 02 | 1 | BRAND-GOV-01 | — | brand-publish: 422 + full diagnostics on gate failure | integration | `node --test test/phase-81/brand-publish-route.test.js` | ❌ W0 | ⬜ pending |
| 81-02-03 | 02 | 1 | BRAND-GOV-01 | — | brand-publish: 403 for readonly role | integration | `node --test test/phase-81/brand-publish-route.test.js` | ❌ W0 | ⬜ pending |
| 81-03-01 | 03 | 1 | BRAND-GOV-01 | — | brand-rollback: 200 on verified bundle | integration | `node --test test/phase-81/brand-rollback-route.test.js` | ❌ W0 | ⬜ pending |
| 81-03-02 | 03 | 1 | BRAND-GOV-01 | — | brand-rollback: 422 + BRAND_GOV_BUNDLE_NOT_VERIFIED when no hash | integration | `node --test test/phase-81/brand-rollback-route.test.js` | ❌ W0 | ⬜ pending |
| 81-04-01 | 03 | 1 | BRAND-GOV-01 | — | brand-status: active_bundle + tenant-filtered traceability_log | integration | `node --test test/phase-81/brand-status-route.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/phase-81/brand-publish-route.test.js` — stubs for BRAND-GOV-01 publish: success, gate-denial (full diagnostics pass-through), RBAC-denial (403), auth-denial (401), method guard (405 on GET)
- [ ] `test/phase-81/brand-rollback-route.test.js` — stubs for BRAND-GOV-01 rollback: success, bundle-not-verified (422), RBAC-denial (403), auth-denial (401), method guard (405 on GET)
- [ ] `test/phase-81/brand-status-route.test.js` — stubs for BRAND-GOV-01 status: success with null active_bundle, success with active_bundle, tenant-filtered traceability_log, RBAC-denial (403), auth-denial (401), method guard (405 on POST)

*Existing infrastructure covers test helpers — `withMockedModule`, `createJsonRequest`, `createMockResponse` all available in `test/setup.js` and `test/phase-78/` / `test/phase-79/` patterns.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
