---
phase: 106-template-taxonomy-and-selection-contracts
plan: "02"
subsystem: pack-registry
tags: [pack-loader, facade, resolvePackSelection, industry-alias, ajv, singleton-cache]
dependency_graph:
  requires: [lib/markos/packs/pack-schema.json, lib/markos/packs/*.pack.json, test/pack-loader.test.js]
  provides: [lib/markos/packs/pack-loader.cjs]
  affects: [onboarding/backend/research/template-family-map.cjs]
tech_stack:
  added: []
  patterns: [singleton-cache, Ajv-Draft07-validation, facade-adapter, static-alias-map, security-canonical-lookup]
key_files:
  created:
    - lib/markos/packs/pack-loader.cjs
  modified:
    - onboarding/backend/research/template-family-map.cjs
decisions:
  - "readFileSync+JSON.parse (not require) for pack manifests — avoids stale require.cache between test resets"
  - "deriveOverlayKey() checks slug AND all aliases so services→consulting works even though services slug has no overlay key itself"
  - "FAMILY_REGISTRY re-exported as evaluated const in template-family-map.cjs facade — callers that destructure-import FAMILY_REGISTRY need zero changes"
  - "INDUSTRY_ALIAS_MAP is stub-only in Phase 106; Phase 108 will add .industry.json files and set overlayExists=true"
  - "resolvePackSelection never throws — missing overlay pack file produces base-only result with console.warn"
metrics:
  duration_minutes: 20
  completed_date: "2026-04-14"
  tasks_completed: 3
  tasks_total: 3
  files_created: 1
  files_modified: 1
---

# Phase 106 Plan 02: Pack Loader, Facade Refactor, and Selection Resolver Summary

**One-liner:** Singleton Ajv-validated pack-loader.cjs with legacy shape adapter, template-family-map facade delegation, and resolvePackSelection() selection-state contract stub.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create lib/markos/packs/pack-loader.cjs | fd4bd53 | lib/markos/packs/pack-loader.cjs |
| 2 | Refactor template-family-map.cjs as facade | b0d683c | onboarding/backend/research/template-family-map.cjs |
| 3 | Extend pack-loader.cjs with resolvePackSelection + INDUSTRY_ALIAS_MAP | 6b22a66 | lib/markos/packs/pack-loader.cjs |

## What Was Built

### lib/markos/packs/pack-loader.cjs
Singleton cache loader for `*.pack.json` manifests. Key behaviors:
- **Security:** `fs.readFileSync` + `JSON.parse` (never `require()`) — avoids stale module cache in tests
- **Security:** Ajv v8 validates every manifest before it enters the registry; invalid manifests are warned-and-skipped, never thrown
- **Singleton pattern:** `let _registryCache = null` — lazy-load on first call, `Object.freeze` on result
- **adaptToLegacyShape():** translates pack manifest schema to `{ slug, aliases, baseDoc, proofDoc, overlayDocs }` shape callers expect
- **deriveOverlayKey():** checks slug + all aliases so `services` pack gets `overlayDocs: { consulting: "..." }` (key comes from alias "consulting", not slug "services")
- **INDUSTRY_ALIAS_MAP:** static frozen object, input canonicalized before lookup — no eval, no dynamic require
- **resolvePackSelection():** `{ basePack, overlayPack, overrideReason, resolvedAt }` — Phase 106 stub with base-only graceful degradation
- **_resetCacheForTests():** nulls all singleton state — used by every test case for clean isolation

### onboarding/backend/research/template-family-map.cjs (facade)
Surgical changes only — 61 lines removed, 5 added:
- Added `require('../../../lib/markos/packs/pack-loader.cjs')` for `getFamilyRegistry`
- Removed inline `FAMILY_REGISTRY = Object.freeze([...])` constant (7-entry block)
- Replaced `for (const entry of FAMILY_REGISTRY)` → `for (const entry of getFamilyRegistry())`
- Replaced `FAMILY_REGISTRY.find(...)` → `getFamilyRegistry().find(...)`
- Added `const FAMILY_REGISTRY = getFamilyRegistry()` before module.exports so the exported `FAMILY_REGISTRY` still works for callers that destructure-import it
- **Zero caller changes required** — all 14 original exports preserved

## Test Results

| Suite | Pass | Fail | Total |
|-------|------|------|-------|
| Suite 106: pack-loader — getFamilyRegistry (106.1–106.7) | 7 | 0 | 7 |
| Suite 106: pack-loader — resolvePackSelection (106.8–106.12) | 5 | 0 | 5 |
| Suite 6: example-resolver (regression, 6.1–6.8) | 9 | 0 | 9 |
| **Total** | **21** | **0** | **21** |

## Decisions Made

1. **readFileSync vs require for manifests** — `require()` caches aggressively; `_resetCacheForTests()` clearing the singleton doesn't flush `require.cache`. Using `readFileSync+JSON.parse` ensures each `getFamilyRegistry()` after a reset reads fresh bytes from disk.
2. **Overlay key via alias walk, not slug** — `services` has slug `"services"` which doesn't match any overlay key, but its alias `"consulting"` does. `deriveOverlayKey()` walks `[slug, ...aliases]` to find the first match, producing the correct `consulting` key.
3. **FAMILY_REGISTRY facade re-export** — Several callers (`icp-candidate-builder.cjs` etc.) do `const { FAMILY_REGISTRY } = require('template-family-map.cjs')`. Adding `const FAMILY_REGISTRY = getFamilyRegistry()` before `module.exports` satisfies these without modification.
4. **Phase 106 industry overlay = stub** — `INDUSTRY_ALIAS_MAP` maps 16 industry strings to 4 overlay slugs but no `.industry.json` files exist yet. `resolvePackSelection` with an industry always returns `overlayPack: null` in Phase 106 with a `console.warn`. Phase 108 creates the overlay pack files.
5. **Never-throw on startup** — Both `getValidator()` fallback and the `getFamilyRegistry()` catch block return an empty frozen array rather than propagating errors. The server stays up even if manifests are temporarily corrupt during deployment.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| lib/markos/packs/pack-loader.cjs | `INDUSTRY_ALIAS_MAP` → 4 overlay slugs with no backing files yet | Phase 108 adds `.industry.json` files; Phase 106 only locks the alias contract |
| lib/markos/packs/pack-loader.cjs | `resolvePackSelection` always returns `overlayPack: null` in Phase 106 | No industry pack files installed yet — expected behavior until Phase 108 |

## Self-Check: PASSED

- [x] `lib/markos/packs/pack-loader.cjs` — file exists, exports getFamilyRegistry, resolvePackSelection, _resetCacheForTests
- [x] `onboarding/backend/research/template-family-map.cjs` — modified, getFamilyRegistry referenced
- [x] Commit fd4bd53 — exists (Task 1)
- [x] Commit b0d683c — exists (Task 2)
- [x] Commit 6b22a66 — exists (Task 3)
- [x] node --test test/pack-loader.test.js → 12/12 cases pass
- [x] node --test test/example-resolver.test.js → 9/9 cases pass
