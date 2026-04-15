---
plan: 109-03
phase: 109-initialization-and-workspace-hydration-integration
status: complete
commit: adf4ca2
---

# 109-03 Summary: handlers.cjs integration (resolvePackSelection + response wiring)

## What was built

- **`onboarding/backend/handlers.cjs`** — 5 coordinated changes in `handleApprove`:
  1. Added `require('../../lib/markos/packs/pack-loader.cjs')` for `resolvePackSelection` at line 39.
  2. Declared `let packSelection = null` BEFORE the skeleton try block (so both response paths — APPROVE_PARTIAL_WARNING and APPROVE_OK — can read it outside the try).
  3. Inserted a nested try/catch after seed read that calls `resolvePackSelection(seed)` → writes `seed.packSelection` to disk via `fs.writeFileSync` (D-02). The inner catch logs (`[POST /approve] resolvePackSelection failed`) but does NOT rethrow (D-06 — non-fatal).
  4. Updated `generateSkeletons` call to pass `packSelection` as 5th arg (args 3-4 use `undefined` to preserve defaults).
  5. Added `packSelection: packSelection` to both `json(res, 200, {...})` response objects (APPROVE_PARTIAL_WARNING and APPROVE_OK).

## Test state after this plan
- No new tests yet (tests in Wave 4 / Plan 04)
- Existing handleApprove tests: passing (withMockedModule pattern compatible)

## Notable observations
- `let packSelection = null` declared before the try is the key correctness constraint — both response calls are outside the try scope.
- APPROVE_PARTIAL_WARNING response used 8-space indent; APPROVE_OK used 6-space — required separate `replace_string_in_file` calls.
- Seed persistence (D-02) is inside the same inner try as `resolvePackSelection` — if resolution fails, seed is not written with stale data.

## What this enables
Wave 4 (Plan 04): All 3 modified files can now be tested with the overlay unit tests and handleApprove integration tests.
