---
phase: 25
plan: 25-02
subsystem: merge-safety
tags: [write-mir, merge, state, tests]
requires: [24-03-runtime-parity-coverage]
provides: [ONQ-02]
affects:
  - onboarding/backend/write-mir.cjs
  - test/write-mir.test.js
tech_stack:
  added_patterns:
    - merge event telemetry for fuzzy replacement and fallback append paths
    - fixture-heavy regression coverage for template drift and missing headers
decisions:
  - Keep fallback append behavior but make it explicit and test-enforced
metrics:
  completed_at: 2026-03-28
  commits:
    - 3146d54
---

# Phase 25 Plan 02: Approval and Merge Safety Summary

Hardened approved-draft merge safety by exposing merge events and adding realistic template-variance tests.

## Completed Work

- Extended write-mir result contract with mergeEvents so fallback insertion is observable.
- Added fixture-heavy merge tests for expected headers, drifted headers, missing-header fallback append, and mixed multi-section drafts.
- Preserved and validated generated markers/disclaimer plus STATE.md update behavior across merge paths.

## Verification

- node --test test/write-mir.test.js
- npm test

## Deviations from Plan

None - executed as planned.

## Known Stubs

None.

## Self-Check: PASSED

- Commit found: 3146d54
