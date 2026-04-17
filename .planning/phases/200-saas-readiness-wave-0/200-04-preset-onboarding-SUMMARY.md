---
phase: 200-saas-readiness-wave-0
plan: "04"
subsystem: onboarding-preset
tags: [onboarding, cli, presets, ttfd]
dependency_graph:
  requires: []
  provides:
    - bin/lib/preset-loader.cjs
    - bin/lib/presets/
    - .agent/markos/templates/presets/
  affects: []
tech_stack:
  added: [preset-seed-pipeline]
  patterns: [cli-flag-gating, mirrored-templates]
key_files:
  created:
    - bin/lib/preset-loader.cjs
    - bin/lib/presets/b2b-saas.json
    - bin/lib/presets/dtc.json
    - bin/lib/presets/agency.json
    - bin/lib/presets/local-services.json
    - bin/lib/presets/solopreneur.json
    - .agent/markos/templates/presets/b2b-saas.json
    - .agent/markos/templates/presets/dtc.json
    - .agent/markos/templates/presets/agency.json
    - .agent/markos/templates/presets/local-services.json
    - .agent/markos/templates/presets/solopreneur.json
    - test/onboarding-preset.test.js
  modified:
    - bin/install.cjs
    - bin/cli-runtime.cjs
decisions:
  - "VALID_PRESET_BUCKETS declared in cli-runtime.cjs (Object.freeze) so every consumer shares the same enum"
  - "Fallback to existing guided interview preserved when --preset absent"
  - "Mirror under .agent/markos/templates/presets/ to support agent-side reads without reaching into bin/"
metrics:
  tasks_completed: 3
  tasks_total: 3
  files_created: 12
  files_modified: 2
  tests_passing: 51
---

# Phase 200 Plan 04: Preset Onboarding Summary

Shipped `--preset=<bucket>` flag on `npx markos init` with 5 curated buckets
(b2b-saas, dtc, agency, local-services, solopreneur) to cut onboarding time
below 90s. Falls back to guided interview when flag absent.

## Tasks Completed

| # | Task | Status | Files |
|---|------|--------|-------|
| 1 | 5 preset JSONs + .agent mirror | Done | 10 preset files |
| 2 | Wire --preset flag | Done | install.cjs, cli-runtime.cjs, preset-loader.cjs |
| 3 | TTFD + structure tests | Done | test/onboarding-preset.test.js |

## Verification

- `node --test test/onboarding-preset.test.js` → **51/51 pass** (10 suites)
- Covers: preset structure, mirror parity, loader API, TTFD < 90s, CLI flag parsing

## Commits

- `17ccaed` feat(200-04): add 5 onboarding preset JSONs + .agent mirror
- `0ab9855` feat(200-04): wire --preset=<bucket> flag to installer
- `ed7d828` test(200-04): add preset onboarding suite (51 assertions pass)

## Notes

Subagent was blocked on Bash in its worktree sandbox (uncommitted changes = worktree
auto-cleaned on exit, so worktree copy was lost). However files were also written
directly to the main workspace via Write tool, which survived. Orchestrator verified
tests green and committed atomically.

## Self-Check: PASSED (51/51 tests, 3 atomic commits landed)
