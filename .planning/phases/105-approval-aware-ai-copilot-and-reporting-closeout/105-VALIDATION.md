---
phase: 105
slug: approval-aware-ai-copilot-and-reporting-closeout
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-15
---

# Phase 105 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert/strict |
| **Config file** | none — built-in Node test runner |
| **Quick run command** | `node --test test/crm-ai/crm-conversation-summary.test.js test/crm-ai/crm-recommendation-packaging.test.js test/crm-reporting/crm-reporting-shell.test.js` |
| **Mid-suite command** | `node --test test/crm-ai/crm-copilot-workspace.test.js test/crm-ai/crm-playbook-run-lifecycle.test.js test/crm-reporting/crm-reporting-readiness.test.js` |
| **Full suite command** | `node --test test/crm-ai/*.test.js test/crm-reporting/*.test.js test/tenant-auth/crm-copilot-tenant-isolation.test.js test/tenant-auth/crm-reporting-tenant-isolation.test.js` |
| **Estimated runtime** | ~1-20 seconds |
| **Fresh baseline evidence** | 40 passing, 0 failing |

---

## Sampling Rate

- **After every task commit:** Run the quick CRM AI or reporting slice depending on touched files
- **After each plan wave:** Run the mid-suite or full suite depending on impact radius
- **Before verify-work:** The full Phase 105 regression lane must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 105-01-01 | 01 | 1 | AI-CRM-01 | regression / summary / grounding | `node --test test/crm-ai/crm-conversation-summary.test.js test/crm-ai/crm-copilot-grounding.test.js test/crm-ai/crm-copilot-workspace.test.js` | ✅ | ⬜ pending |
| 105-01-02 | 01 | 1 | AI-CRM-02 | approval / playbook / audit lineage | `node --test test/crm-ai/crm-recommendation-packaging.test.js test/crm-ai/crm-playbook-run-lifecycle.test.js test/crm-ai/crm-ai-audit-lineage.test.js` | ✅ | ⬜ pending |
| 105-01-03 | 01 | 1 | CRM-04 | reporting / attribution / readiness / verification | `node --test test/crm-reporting/*.test.js test/tenant-auth/crm-reporting-tenant-isolation.test.js` | ✅ | ⬜ pending |

Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky

---

## Wave 0 Requirements

Existing infrastructure already covers grounding, recommendation packaging, approval review, governed playbook execution, reporting dashboards, attribution, readiness, and verification. Phase execution should preserve and strengthen these guarantees while aligning the operator experience to the chosen record-first and advisory-first posture.

---

## Manual-Only Verifications

Manual review is optional for copy clarity, dashboard readability, and operator comprehension. All critical behavior should remain automation-backed.

---

## Validation Sign-Off

- [x] All tasks have automated verification
- [x] Sampling continuity preserved
- [x] Wave 0 references exist
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-15
