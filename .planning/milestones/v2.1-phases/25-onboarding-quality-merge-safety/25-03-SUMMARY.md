---
phase: 25
plan: 25-03
subsystem: regenerate-approve-contract
tags: [handlers, ui, outcomes, tests]
requires: [25-01, 25-02]
provides: [ONQ-02, ONQ-03]
affects:
  - onboarding/backend/handlers.cjs
  - onboarding/onboarding.js
  - onboarding/index.html
  - test/onboarding-server.test.js
tech_stack:
  added_patterns:
    - structured outcome state model: success/warning/degraded/failure
    - UI status rendering tied to backend outcome contract
decisions:
  - Maintain legacy success/error fields while adding explicit structured outcome data
metrics:
  completed_at: 2026-03-28
  commits:
    - a60d7f9
---

# Phase 25 Plan 03: Regenerate and Approve Reporting Summary

Added explicit backend response outcomes and aligned UI status handling so operators can distinguish true success, warning-bearing success, degraded fallback, and failure.

## Completed Work

- Added structured outcome payloads to regenerate and approve handlers.
- Classified approve responses into full success, warning-bearing success, or failure based on write/persistence/fallback conditions.
- Updated onboarding UI to render outcome-specific statuses instead of generic messages.
- Added contract tests for regenerate degraded fallback and approve warning outcomes.

## Verification

- node --test test/onboarding-server.test.js
- npm test

## Deviations from Plan

None - executed as planned.

## Known Stubs

None.

## Self-Check: PASSED

- Commit found: a60d7f9
