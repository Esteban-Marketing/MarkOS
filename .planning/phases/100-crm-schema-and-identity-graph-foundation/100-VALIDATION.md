---
phase: 100
slug: crm-schema-and-identity-graph-foundation
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-14
---

# Phase 100 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert/strict |
| **Config file** | none — built-in Node test runner |
| **Quick run command** | `node --test test/crm-schema/crm-core-entities.test.js` |
| **Full suite command** | `node --test test/crm-schema/crm-core-entities.test.js test/crm-api/crm-merge-api.test.js test/tenant-auth/crm-tenant-isolation.test.js` |
| **Estimated runtime** | ~1-5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/crm-schema/crm-core-entities.test.js`
- **After every plan wave:** Run `node --test test/crm-schema/crm-core-entities.test.js test/crm-api/crm-merge-api.test.js test/tenant-auth/crm-tenant-isolation.test.js`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 100-01-01 | 01 | 1 | CRM-01, CRM-02 | regression | `node --test test/crm-schema/crm-core-entities.test.js test/crm-api/crm-merge-api.test.js test/tenant-auth/crm-tenant-isolation.test.js` | ✅ | ⬜ pending |
| 100-01-02 | 01 | 1 | CRM-01 | schema/contract | `node --test test/crm-schema/crm-core-entities.test.js` | ✅ | ⬜ pending |
| 100-01-03 | 01 | 1 | CRM-02 | merge/auth integration | `node --test test/crm-api/crm-merge-api.test.js test/tenant-auth/crm-tenant-isolation.test.js` | ✅ | ⬜ pending |

Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-14
