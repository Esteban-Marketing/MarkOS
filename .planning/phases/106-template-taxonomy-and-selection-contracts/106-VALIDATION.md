---
phase: 106
slug: template-taxonomy-and-selection-contracts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 106 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` |
| **Config file** | none — tests run directly |
| **Quick run command** | `node --test test/pack-loader.test.js` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/pack-loader.test.js`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 106-01-01 | 01 | 0 | LIB-01 | — | N/A | unit | `node --test test/pack-loader.test.js` | ❌ W0 | ⬜ pending |
| 106-01-02 | 01 | 0 | LIB-04 | — | N/A | unit | `node --test test/pack-loader.test.js` | ❌ W0 | ⬜ pending |
| 106-01-03 | 01 | 0 | INIT-02 | — | N/A | unit | `node --test test/pack-loader.test.js` | ❌ W0 | ⬜ pending |
| 106-01-04 | 01 | 1 | LIB-01 | — | Alias resolution preserved | regression | `node --test test/example-resolver.test.js` | ✅ exists | ⬜ pending |
| 106-01-05 | 01 | 1 | LIB-01 | — | N/A | unit | `node --test test/pack-loader.test.js` | ❌ W0 | ⬜ pending |
| 106-01-06 | 01 | 2 | LIB-04 | — | N/A | unit | `node --test test/pack-loader.test.js` | ❌ W0 | ⬜ pending |
| 106-01-07 | 01 | 2 | INIT-02 | — | Fallback: overrideReason set | unit | `node --test test/pack-loader.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/pack-loader.test.js` — stub test file covering LIB-01, LIB-04, INIT-02 contract assertions; uses `node:test` + `assert/strict` matching existing test patterns
- [ ] `pack-loader.cjs` must export `_resetCacheForTests()` so test suite can clear singleton cache between test cases

*Existing infrastructure in `test/example-resolver.test.js` already uses `node:test` + `assert/strict` — no new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Manifest JSON files are human-readable and follow schema | LIB-04 | Schema compliance is verified by Ajv at runtime; human-readability is editorial | Open each `.pack.json` file and verify displayName, version, completeness, changelog fields are populated |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
