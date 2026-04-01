---
phase: 40
slug: multi-discipline-orchestrator-retrieval
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-01
---

# Phase 40 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` + `node:assert/strict` |
| **Config file** | none |
| **Quick run command** | `node --test test/vector-store-client.test.js test/discipline-router.test.js test/orchestrator-literacy.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/vector-store-client.test.js test/discipline-router.test.js test/orchestrator-literacy.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 40-01-T1 | 01 | 1 | LIT-04, LIT-05 | unit | `node --test test/discipline-router.test.js test/vector-store-client.test.js` | ❌ Wave 0 | ⬜ pending |
| 40-01-T2 | 01 | 1 | LIT-04, LIT-05 | unit | `node --test test/discipline-router.test.js test/vector-store-client.test.js` | ✅ Task 1 creates | ⬜ pending |
| 40-02-T1 | 02 | 2 | LIT-04, LIT-05, LIT-06 | integration | `node --test test/orchestrator-literacy.test.js` | ❌ Wave 0 | ⬜ pending |
| 40-02-T2 | 02 | 2 | LIT-04, LIT-05, LIT-06 | integration | `node --test test/orchestrator-literacy.test.js` | ✅ Task 1 creates | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/discipline-router.test.js` — router ranking, hard-floor default fill, deterministic tie-break coverage
- [ ] `test/orchestrator-literacy.test.js` — top-3 orchestration, dual-query dedupe, empty fallback, chunk-cap enforcement, telemetry payload
- [ ] `test/vector-store-client.test.js` — extend with `pain_point_tags` OR filter clause and exported `buildLiteracyFilter`

*Existing infrastructure covers the framework and mocking layer; Wave 0 only needs two new test files plus one extension to an existing suite.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Router consumes live Phase 39 taxonomy JSON when present and compatibility fallback only when absent | LIT-04 | Depends on runtime state of the Phase 39 artifact tree, which is missing in the current workspace | After execution, create or ingest the real `.agent/markos/literacy/taxonomy.json`, run the orchestrator against a seeded client, and confirm ranked disciplines change when taxonomy content changes without code edits |
| Multi-discipline literacy context improves prompt grounding with real corpus content | LIT-05, LIT-06 | Requires live literacy corpus and live retrieval providers; mocked tests only prove orchestration mechanics | Ingest a live corpus, submit a representative seed, and inspect `drafts.standards_context` plus `literacy_retrieval_observed` telemetry to confirm hits come from multiple disciplines and remain capped |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-01
