---
phase: 41
slug: dynamic-skeleton-template-generator
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 41 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (built-in) + `node:assert/strict` |
| **Config file** | none — glob invocation |
| **Quick run command** | `node --test test/skeleton-generator.test.js` |
| **Full suite command** | `node --test test/**/*.test.js` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/skeleton-generator.test.js`
- **After every plan wave:** Run `node --test test/**/*.test.js`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 41-01-01 | 01 | 0 | LIT-07 | unit (stub) | `node --test test/skeleton-generator.test.js` | ❌ W0 | ⬜ pending |
| 41-02-01 | 02 | 1 | LIT-07 | unit | `node --test test/skeleton-generator.test.js` | ✅ | ⬜ pending |
| 41-02-02 | 02 | 1 | LIT-07 | unit | `node --test test/skeleton-generator.test.js` | ✅ | ⬜ pending |
| 41-02-03 | 02 | 1 | LIT-08 | integration | `node --test test/skeleton-generator.test.js` | ✅ | ⬜ pending |
| 41-02-04 | 02 | 1 | LIT-08 | integration | `node --test test/skeleton-generator.test.js` | ✅ | ⬜ pending |
| 41-03-01 | 03 | 2 | LIT-07 | e2e | `node --test test/**/*.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/skeleton-generator.test.js` — stubs for all 8 named tests (T-41-01 through T-41-05)
  - `resolveSkeleton resolves correct base template for known discipline + model`
  - `resolveSkeleton returns empty string for unknown business model`
  - `resolveSkeleton returns empty string for missing template file`
  - `resolveSkeleton resolves Agents-aaS slug (agents-aas)`
  - `generateSkeletons writes 5 output files for a valid seed`
  - `interpolatePainPoints replaces all slots and removes orphans`
  - `handleApprove response includes skeletons block`
  - `skeleton generation failure does not affect HTTP 200 response`

---

## Test Cases

### T-41-01: `resolveSkeleton` unit tests

**Tests:** N.1–N.4 above
**Signal:** `resolveSkeleton` correctly maps discipline + business model to base template path; returns `''` gracefully on misses.
**Run:** `node --test test/skeleton-generator.test.js`

### T-41-02: `generateSkeletons` output test

**Test:** N.5
**Signal:** Full pipeline produces 5 output files with valid YAML frontmatter; output paths use `.markos-local/MSP/{discipline}/SKELETONS/_SKELETON-{slug}.md` pattern.
**Run:** `node --test test/skeleton-generator.test.js`

### T-41-03: Pain-point interpolation test

**Test:** N.6
**Signal:** `interpolatePainPoints` replaces filled slots and line-filters orphan `{{pain_point_N}}` tokens; no placeholders survive in output.
**Run:** `node --test test/skeleton-generator.test.js`

### T-41-04: Post-approval hook integration test

**Test:** N.7
**Signal:** `handleApprove` response includes `skeletons: { generated: [], failed: [] }` block at HTTP 200.
**Run:** `node --test test/skeleton-generator.test.js`

### T-41-05: Non-fatal failure test

**Test:** N.8
**Signal:** When `generateSkeletons` throws, `handleApprove` still returns HTTP 200 with `skeletons.failed: ['all']`; existing approve flow is unaffected.
**Run:** `node --test test/skeleton-generator.test.js`

---

## Coverage Boundaries

### In-scope (must verify)
- `resolveSkeleton()` in `example-resolver.cjs` — path resolution, slug mapping, graceful misses
- `generateSkeletons()` in `skeleton-generator.cjs` — output file creation, frontmatter, pain-point injection
- `interpolatePainPoints()` — slot replacement + orphan line-filter
- `handleApprove` hook — skeletons block in response; non-fatal failure path

### Out-of-scope (Phase 43+)
- `approvedDrafts` enrichment (reserved for future use)
- Template content quality (manual review only)
- Ranked discipline selection from Phase 40 discipline-router integration (fallback to all 5)
