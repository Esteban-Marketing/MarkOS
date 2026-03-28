---
phase: 27
plan: 27-03
subsystem: execution-telemetry
tags: [telemetry, onboarding, readiness, tests]
requires: [27-01, 26-03]
provides: [TLM-02, EXE-01]
affects:
  - onboarding/backend/agents/telemetry.cjs
  - onboarding/backend/handlers.cjs
  - onboarding/onboarding.js
  - .agent/prompts/telemetry_synthesizer.md
  - README.md
  - test/onboarding-server.test.js
decisions:
  - Telemetry taxonomy remains intentionally narrow and checkpoint-driven
  - Readiness and failure telemetry must be operator-actionable
metrics:
  completed_at: 2026-03-28
  commits:
    - 797ca95
---

# Phase 27 Plan 03: Execution Telemetry Summary

Refocused execution telemetry onto operational checkpoints for approval, readiness, failure diagnosis, and loop completion.

## Completed Work

- Added checkpoint telemetry wrapper with explicit event allowlist.
- Instrumented regenerate and approve failure/readiness boundary conditions with checkpoint events.
- Added frontend checkpoint events for approval, readiness state, loop completion, and abandonment.
- Updated telemetry synth prompt and README to define event meaning and interpretation limits.
- Extended onboarding server tests for blocked and ready handoff telemetry paths.
- Hardened telemetry module to no-op when posthog-node is unavailable in isolated test environments.

## Verification

- node --test test/onboarding-server.test.js

## Deviations from Plan

- [Rule 3 - Blocking Issue] Added optional dependency handling for posthog-node in telemetry module to avoid test-environment module resolution failures.

## Known Stubs

None.

## Self-Check: PASSED

- Commit found: 797ca95
