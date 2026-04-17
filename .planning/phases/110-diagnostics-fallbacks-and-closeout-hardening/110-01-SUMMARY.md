---
plan: 110-01
phase: 110
status: complete
completed: 2026-04-15
commit: 59306f8
---

# Plan 110-01 — pack-loader diagnostics + available-pack options

**Commit:** `59306f8 feat(110-01): add getPackDiagnostics + getAvailablePackOptions to pack-loader`

## What shipped

- `getPackDiagnostics(pack)` — returns graduated diagnostics (full vs partial vs missing) per pack.
- `getAvailablePackOptions(business_model, industry_overlay)` — returns curated list of packs available for a selection, gracefully degrading when overlays are missing.
- Unit tests covering happy path, missing overlay, missing base pack, and malformed metadata cases.

## Files touched

- `lib/markos/packs/pack-loader.cjs`
- `test/pack-loader/pack-diagnostics.test.js`

## Verification

- Unit tests pass (baseline + new).
- No regressions in downstream pack resolution.

## Related

- Phase 110 CONTEXT.md · RESEARCH.md · UAT.md · VALIDATION.md
