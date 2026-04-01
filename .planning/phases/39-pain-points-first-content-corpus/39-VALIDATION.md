---
phase: 39
slug: pain-points-first-content-corpus
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 39 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` + `node:assert/strict` |
| **Config file** | None — test files discovered by glob |
| **Quick run command** | `node --test test/literacy-ingest.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/literacy-ingest.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 39-01-T1 | 01 | 1 | LIT-02 | unit | `node --test test/literacy-ingest.test.js` | ✅ extend existing | ⬜ pending |
| 39-01-T2 | 01 | 1 | LIT-02 | unit | `node --test test/literacy-ingest.test.js` | ✅ extend existing | ⬜ pending |
| 39-02-T1 | 02 | 1 | LIT-01 | unit | `node --test test/literacy-ingest.test.js` | ✅ extend existing | ⬜ pending |
| 39-02-T2 | 02 | 1 | LIT-01 | unit | `node --test test/literacy-ingest.test.js` | ✅ extend existing | ⬜ pending |
| 39-03-T1 | 03 | 2 | LIT-02 | unit | `node --test test/literacy-ingest.test.js` | ✅ extend existing | ⬜ pending |
| 39-04-T1 | 04 | 3 | LIT-01 | corpus audit | `node bin/ingest-literacy.cjs --path .agent/markos/literacy --dry-run` | ❌ new dry-run step | ⬜ pending |
| 39-04-T2 | 04 | 3 | LIT-01 | integration | manual / live env | ❌ manual only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/literacy-ingest.test.js` — extend with 4 new test cases (pain_point_tags parsing, chunk propagation, validation rejection, buildLiteracyFilter clause)
- [ ] `test/fixtures/literacy/Paid_Media/LIT-PM-001.md` — minimal valid corpus document fixture used by tests

*Existing infrastructure (node:test, test/setup.js, test/literacy-ingest.test.js) covers the base — only extension and one new fixture file needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Round-trip retrieval returns ≥1 hit when queried with pain_point_tag filter | LIT-01 | Requires live Upstash Vector index with corpus ingested | Run `node bin/literacy-admin.cjs query Paid_Media "CPR inflation" --top-k 3` after live ingestion; confirm ≥1 result with `pain_point_tags` in metadata |
| B2B-specific supplement returned for B2B filter but not DTC filter | LIT-03 | Requires live index + model-specific doc | Run two queries with business_model filter set to B2B vs DTC; confirm B2B supplement appears only in B2B results |
