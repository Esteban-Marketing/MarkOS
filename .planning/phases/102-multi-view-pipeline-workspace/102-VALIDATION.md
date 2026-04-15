---
phase: 102
slug: multi-view-pipeline-workspace
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-14
---

# Phase 102 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert/strict |
| **Config file** | none — built-in Node test runner |
| **Quick run command** | `node --test test/crm-workspace/crm-workspace-views.test.js test/crm-workspace/crm-cross-view-coherence.test.js` |
| **Full suite command** | `node --test test/crm-schema/crm-pipeline-config.test.js test/crm-api/crm-pipeline-api.test.js test/crm-workspace/crm-workspace-views.test.js test/crm-workspace/crm-record-detail-timeline.test.js test/crm-workspace/crm-calendar-view.test.js test/crm-workspace/crm-funnel-view.test.js test/crm-workspace/crm-cross-view-coherence.test.js` |
| **Estimated runtime** | ~1-10 seconds |

---

## Sampling Rate

- **After every task commit:** Run the quick workspace slice
- **After every plan wave:** Run the full Phase 102 suite
- **Before verify-work:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 102-01-01 | 01 | 1 | PIP-01, PIP-02 | regression | `node --test test/crm-workspace/crm-workspace-views.test.js test/crm-workspace/crm-cross-view-coherence.test.js` | ✅ | ⬜ pending |
| 102-01-02 | 01 | 1 | PIP-01, PIP-02 | state/persistence | `node --test test/crm-schema/crm-pipeline-config.test.js test/crm-api/crm-pipeline-api.test.js test/crm-workspace/crm-workspace-views.test.js` | ✅ | ⬜ pending |
| 102-01-03 | 01 | 1 | PIP-01, PIP-02 | rollup/integration | `node --test test/crm-workspace/crm-record-detail-timeline.test.js test/crm-workspace/crm-calendar-view.test.js test/crm-workspace/crm-funnel-view.test.js test/crm-workspace/crm-cross-view-coherence.test.js` | ✅ | ⬜ pending |

Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky

---

## Wave 0 Requirements

Existing infrastructure already covers the workspace shell, calendar, funnel, and cross-view state. Phase execution should add regression checks for named saved views, richer filters, and weighted stage-based rollups.

---

## Manual-Only Verifications

All critical behaviors for this phase should remain automation-backed.

---

## Validation Sign-Off

- [x] All tasks have automated verification
- [x] Sampling continuity preserved
- [x] Wave 0 references exist
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-14
