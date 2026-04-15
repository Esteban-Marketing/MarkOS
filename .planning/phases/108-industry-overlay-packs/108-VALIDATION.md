---
phase: 108
slug: industry-overlay-packs
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 108 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (Node.js built-in test runner) |
| **Config file** | None — `package.json` scripts: `"test": "node --test test/**/*.test.js"` |
| **Quick run command** | `node --test test/pack-loader.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/pack-loader.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green (25 tests)
- **Max feedback latency:** ~2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 108-W0-01 | infra | 0 | LIB-02 | — | N/A | setup | `Test-Path lib/markos/packs/industries` | ❌ W0 | ⬜ pending |
| 108-W0-02 | tests | 0 | LIB-02, LIB-04 | — | N/A | unit | `node --test test/pack-loader.test.js` | ❌ W0 | ⬜ pending |
| 108-01-01 | travel | 1 | LIB-02 | — | N/A | integration | `node --test test/pack-loader.test.js` (108.1, 108.5) | ❌ W0 | ⬜ pending |
| 108-01-02 | it | 1 | LIB-02 | — | N/A | integration | `node --test test/pack-loader.test.js` (108.2, 108.6) | ❌ W0 | ⬜ pending |
| 108-01-03 | marketing-services | 1 | LIB-02 | — | N/A | integration | `node --test test/pack-loader.test.js` (108.3, 108.7) | ❌ W0 | ⬜ pending |
| 108-01-04 | professional-services | 1 | LIB-02 | — | N/A | integration | `node --test test/pack-loader.test.js` (108.4, 108.8) | ❌ W0 | ⬜ pending |
| 108-02-01 | schema validation | 2 | LIB-04 | — | N/A | unit | `node --test test/pack-loader.test.js` (108.10) | ❌ W0 | ⬜ pending |
| 108-02-02 | regression guard | 2 | LIB-04 | — | N/A | regression | `node --test test/pack-loader.test.js` (108.11) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/markos/packs/industries/` — directory does not exist; must be created before any `.industry.json` files can be placed
- [ ] Suite 108 test block in `test/pack-loader.test.js` — 11 new tests (108.1–108.11); add before implementing manifests so tests are red before implementation and green after

*Existing `node:test` + `assert/strict` infrastructure covers all phase requirements — no new test framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tone doc content accuracy — Travel YAML frontmatter `overlay_for` matches locked D-04 | LIB-02 | File content inspection | Verify `TPL-SHARED-overlay-industry-travel.md` frontmatter `overlay_for: ["b2c", "b2b"]` |
| Tone doc content accuracy — IT YAML frontmatter `overlay_for` matches locked D-04 | LIB-02 | File content inspection | Verify `TPL-SHARED-overlay-industry-it.md` frontmatter `overlay_for: ["b2b", "saas", "services"]` |
| Tone doc content accuracy — Marketing Services YAML frontmatter `overlay_for` matches locked D-04 | LIB-02 | File content inspection | Verify `TPL-SHARED-overlay-industry-marketing-services.md` frontmatter `overlay_for: ["agency", "b2b"]` |
| Tone doc content accuracy — Professional Services YAML frontmatter `overlay_for` matches locked D-04 | LIB-02 | File content inspection | Verify `TPL-SHARED-overlay-industry-professional-services.md` frontmatter `overlay_for: ["services", "b2b"]` |
| PROMPTS.md skeleton quality — 4 complete standalone prompts per discipline (D-07) | LIB-02 | Content review | Spot-check 2 discipline PROMPTS.md files per vertical; each must have 4 prompts without cross-references to base family PROMPTS.md |
| Professional Services thin-delta constraint (D-06) | LIB-02 | Content review | Verify `TPL-SHARED-overlay-industry-professional-services.md` covers RFP culture, rate card dynamics, credentialing, peer referral — and does NOT re-author core services funnel framing already in `TPL-SHARED-business-model-services.md` |

---

## Phase-Gate Command

```bash
# All 25 tests green (14 legacy Suite 106 + 11 new Suite 108)
npm test
```

Expected output: `14 tests pass` → `25 tests pass` (net +11)
