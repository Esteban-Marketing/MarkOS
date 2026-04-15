---
phase: 107-business-model-starter-library-expansion
plan: 06
subsystem: pack-system
tags: [pack-manifest, version-bump, completeness, baseDoc, changelog]

requires:
  - phase: 107-01
    provides: TPL-SHARED-business-model-b2b.md
  - phase: 107-02
    provides: TPL-SHARED-business-model-b2c.md
  - phase: 107-03
    provides: TPL-SHARED-business-model-saas.md
  - phase: 107-04
    provides: TPL-SHARED-business-model-ecommerce.md
  - phase: 107-05
    provides: TPL-SHARED-business-model-services.md
provides:
  - All 5 priority pack manifests updated to version 1.1.0 with per-family baseDoc and partial completeness
  - pack-loader.test.js: 14/14 tests pass
affects: [pack-loader, family-resolver, template-selection, onboarding-flow]

tech-stack:
  added: []
  patterns:
    - "Pack manifest mutation: version X.0.0 → X.1.0 = minor content expansion (new baseDoc, completeness promotion)"
    - "completeness stub → partial = 5 starter prompts per discipline available (4 prompts each = 20 per family)"
    - "baseDoc = per-family specific tone doc rather than generic fallback tone-and-naturality.md"

key-files:
  created: []
  modified:
    - lib/markos/packs/b2b.pack.json — version→1.1.0, completeness→partial, baseDoc→business-model-b2b.md
    - lib/markos/packs/b2c.pack.json — version→1.1.0, completeness→partial, baseDoc→business-model-b2c.md
    - lib/markos/packs/saas.pack.json — version→1.1.0, completeness→partial, baseDoc→business-model-saas.md
    - lib/markos/packs/ecommerce.pack.json — version→1.1.0, completeness→partial, baseDoc→business-model-ecommerce.md
    - lib/markos/packs/services.pack.json — version→1.1.0, completeness→partial, baseDoc→business-model-services.md

key-decisions:
  - "Used node.js JSON mutation script (programmatic) rather than manual edits — atomic, verifiable"
  - "Did NOT touch: overlayDoc (set for saas/ecommerce/services), proofDoc, skeletonDir, fallbackAllowed — read-only for this phase"
  - "Date in changelog: 2026-04-15 (execution date)"

patterns-established:
  - "Pack manifest minor version bump pattern: modify via node.js mutation script, verify with pack-loader tests immediately after"

requirements-completed: [LIB-03]

duration: 10min
completed: 2026-04-15
---

# Phase 107 Plan 06: Pack Manifest Updates

**Applied 4 mutations to all 5 priority pack manifests: version 1.0.0→1.1.0, completeness stub→partial, assets.baseDoc→per-family tone doc path, changelog append. All 14 pack-loader tests pass.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 1 (JSON mutation script + test verification)
- **Files modified:** 5
- **Commit:** `927e0e0`

## Accomplishments

- Updated all 5 pack manifests (`b2b`, `b2c`, `saas`, `ecommerce`, `services`) with per-family baseDoc paths
- Graduated completeness from `stub` to `partial` across all 5 disciplines in each pack
- All 14 pack-loader tests passed (`node --test test/pack-loader.test.js`)
- Pack manifests now point to Phase 107 tone docs as `baseDoc` (previously pointing to generic `TPL-SHARED-tone-and-naturality.md`)

## Task Commits

1. **Pack manifest mutations** — `927e0e0` (feat: update 5 priority pack manifests — version 1.1.0, completeness partial, per-family baseDoc)

## Files Created/Modified

- `lib/markos/packs/b2b.pack.json` — version 1.1.0, all completeness `partial`, baseDoc → `TPL-SHARED-business-model-b2b.md`
- `lib/markos/packs/b2c.pack.json` — version 1.1.0, all completeness `partial`, baseDoc → `TPL-SHARED-business-model-b2c.md`
- `lib/markos/packs/saas.pack.json` — version 1.1.0, all completeness `partial`, baseDoc → `TPL-SHARED-business-model-saas.md`
- `lib/markos/packs/ecommerce.pack.json` — version 1.1.0, all completeness `partial`, baseDoc → `TPL-SHARED-business-model-ecommerce.md`
- `lib/markos/packs/services.pack.json` — version 1.1.0, all completeness `partial`, baseDoc → `TPL-SHARED-business-model-services.md`

## Decisions Made

Used `node -e` inline script for JSON mutation (read → mutate → write) rather than manual sed/text operations. Programmatic JSON manipulation prevents malformed output and runs verifiably.

Preserved read-only fields: `overlayDoc` (saas/ecommerce/services each point to their specific overlay), `proofDoc`, `skeletonDir`, `fallbackAllowed`.

## Deviations from Plan

Note: `create_file` tool cannot overwrite existing files (returned error). Used `run_in_terminal` with Node.js JSON mutation script as the correct tool for editing existing files.

## Issues Encountered

None — mutation script ran cleanly, all 14 tests passed on first run.

## Next Phase Readiness

Pack system now correctly routes to per-family tone docs. Onboarding flow can use pack completeness `partial` to surface real starter content. Wave 1 deliverables are live and committed.

---
*Phase: 107-business-model-starter-library-expansion*
*Completed: 2026-04-15*
