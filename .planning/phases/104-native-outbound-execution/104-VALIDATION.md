---
phase: 104
slug: native-outbound-execution
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-15
---

# Phase 104 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert/strict |
| **Config file** | none — built-in Node test runner |
| **Quick run command** | `node --test test/crm-outbound/crm-consent-eligibility.test.js test/crm-outbound/crm-sequence-approval.test.js` |
| **Mid-suite command** | `node --test test/crm-outbound/crm-outbound-workspace.test.js test/crm-outbound/crm-conversation-writeback.test.js test/crm-outbound/crm-bulk-send-guardrails.test.js` |
| **Full suite command** | `node --test test/crm-outbound/*.test.js` |
| **Estimated runtime** | ~1-15 seconds |
| **Fresh baseline evidence** | 13 passing, 0 failing |

---

## Sampling Rate

- **After every task commit:** Run the quick outbound slice
- **After each plan wave:** Run the mid-suite or full suite depending on touched files
- **Before verify-work:** Full outbound suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 104-01-01 | 01 | 1 | OUT-01, OUT-02 | regression / consent / approval | `node --test test/crm-outbound/crm-consent-eligibility.test.js test/crm-outbound/crm-sequence-approval.test.js` | ✅ | ⬜ pending |
| 104-01-02 | 01 | 1 | OUT-01 | workspace / send-flow | `node --test test/crm-outbound/crm-outbound-workspace.test.js test/crm-outbound/crm-outbound-foundation.test.js test/crm-outbound/crm-bulk-send-guardrails.test.js` | ✅ | ⬜ pending |
| 104-01-03 | 01 | 1 | OUT-01, OUT-02 | telemetry / writeback / normalization | `node --test test/crm-outbound/crm-conversation-writeback.test.js test/crm-outbound/crm-provider-webhook-normalization.test.js test/crm-outbound/crm-outbound-telemetry.test.js` | ✅ | ⬜ pending |

Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky

---

## Wave 0 Requirements

Existing infrastructure already covers the outbound workspace, consent gating, provider-backed sends, sequence approval, telemetry, and writeback semantics. Phase execution should preserve and strengthen these guarantees while aligning the operator experience to the chosen email-first and CRM-timeline-first posture.

---

## Manual-Only Verifications

All critical behaviors for this phase should remain automation-backed. Manual review is optional for UX wording and composer polish only.

---

## Validation Sign-Off

- [x] All tasks have automated verification
- [x] Sampling continuity preserved
- [x] Wave 0 references exist
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-15
