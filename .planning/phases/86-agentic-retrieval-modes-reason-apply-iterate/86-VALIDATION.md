---
phase: 86
slug: agentic-retrieval-modes-reason-apply-iterate
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 86 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in test runner (`node --test`) |
| **Config file** | none — Wave 0 creates test files |
| **Quick run command** | `node --test "test/phase-86/*.test.js"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test "test/phase-86/*.test.js"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 86-01-01 | 01 | 0 | ROLEV-01/02/03 | N/A — test scaffolds only | setup | `node --test "test/phase-86/*.test.js"` | ❌ W0 | ⬜ pending |
| 86-01-02 | 01 | 1 | ROLEV-02 | Tenant isolation: cross-tenant entries never returned | unit | `node --test test/phase-86/retrieval-filter.test.js` | ❌ W0 | ⬜ pending |
| 86-02-01 | 02 | 1 | ROLEV-03 | Idempotency key stable across repeated calls | unit | `node --test test/phase-86/handoff-pack.test.js` | ❌ W0 | ⬜ pending |
| 86-02-02 | 02 | 1 | ROLEV-01 | Mode fields isolated: Reason≠Apply≠Iterate | unit | `node --test test/phase-86/handoff-pack.test.js` | ❌ W0 | ⬜ pending |
| 86-03-01 | 03 | 2 | ROLEV-01/02/03 | All three mode methods return correct shapes | integration | `node --test test/phase-86/vault-retriever.test.js` | ❌ W0 | ⬜ pending |
| 86-03-02 | 03 | 2 | ROLEV-02 | checkRetrievalScope denies unauthorized role | unit | `node --test test/phase-86/vault-retriever.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/phase-86/retrieval-filter.test.js` — AND filter, tag matching, empty-tag passthrough, tenant isolation
- [ ] `test/phase-86/handoff-pack.test.js` — idempotency key determinism, evidence links, mode field isolation
- [ ] `test/phase-86/vault-retriever.test.js` — all three mode methods, tenant isolation, filter + scope integration

*Existing test infrastructure (`node --test`) covers all infrastructure requirements — no new framework install needed.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
