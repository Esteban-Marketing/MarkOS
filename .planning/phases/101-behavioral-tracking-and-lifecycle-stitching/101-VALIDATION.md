---
phase: 101
slug: behavioral-tracking-and-lifecycle-stitching
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-14
---

# Phase 101 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert/strict |
| **Config file** | none — built-in Node test runner |
| **Quick run command** | `node --test test/tracking/crm-activity-normalization.test.js test/tracking/authenticated-event-scope.test.js test/tracking/tracking-proxy-ingest.test.js` |
| **Full suite command** | `node --test test/tracking/crm-activity-normalization.test.js test/tracking/tracking-e2e-history-attachment.test.js test/tracking/authenticated-event-scope.test.js test/tracking/tracking-proxy-ingest.test.js test/tenant-auth/tracking-tenant-guard.test.js` |
| **Estimated runtime** | ~1-10 seconds |

---

## Sampling Rate

- **After every task commit:** Run the quick tracking slice
- **After every plan wave:** Run the full Phase 101 suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 101-01-01 | 01 | 1 | TRK-01, TRK-02 | regression | `node --test test/tracking/crm-activity-normalization.test.js test/tracking/tracking-e2e-history-attachment.test.js test/tracking/authenticated-event-scope.test.js test/tracking/tracking-proxy-ingest.test.js test/tenant-auth/tracking-tenant-guard.test.js` | ✅ | ⬜ pending |
| 101-01-02 | 01 | 1 | TRK-01 | ingest/contract | `node --test test/tracking/crm-activity-normalization.test.js test/tracking/authenticated-event-scope.test.js test/tracking/tracking-proxy-ingest.test.js test/tenant-auth/tracking-tenant-guard.test.js` | ✅ | ⬜ pending |
| 101-01-03 | 01 | 1 | CRM-03, TRK-02 | timeline/attribution | `node --test test/tracking/tracking-e2e-history-attachment.test.js test/tenant-auth/tracking-tenant-guard.test.js` | ✅ | ⬜ pending |

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
