---
phase: 25
plan: 25-04
subsystem: warning-burndown
tags: [warnings, fallbacks, docs, protocol-tests]
requires: [25-01, 25-03]
provides: [ONQ-03]
affects:
  - onboarding/backend/agents/orchestrator.cjs
  - onboarding/backend/agents/llm-adapter.cjs
  - onboarding/backend/vector-store-client.cjs
  - test/protocol.test.js
  - README.md
  - .planning/PROJECT.md
  - .planning/ROADMAP.md
tech_stack:
  added_patterns:
    - deduplicated non-fatal warning emission in orchestrator
    - explicit fallback metadata classification in llm-adapter
    - residual fallback behavior documentation surfaced in operator and planner docs
decisions:
  - Keep intentional fallback paths, but make them explicit in tests and documentation
metrics:
  completed_at: 2026-03-28
  commits:
    - 606abfb
---

# Phase 25 Plan 04: Warning Burndown and Fallback Documentation Summary

Reduced warning noise where locally owned and documented intentional residual fallback behavior as explicit operational states.

## Completed Work

- Reduced warning noise by deduping recurring orchestrator warnings and downgrading retry chatter.
- Added non-fatal Vector Store draft persistence error capture in orchestrator result errors.
- Added fallback_kind metadata and sanitized generic fallback output in llm-adapter.
- Added documentation and protocol-test guardrails for residual onboarding warning behavior.

## Verification

- node --test test/protocol.test.js
- npm test

## Deviations from Plan

### Auto-fixed Issues

1. [Rule 3 - Blocking] Reduced Vector Store client option deprecation behavior
- Found during: warning-burndown verification
- Issue: SDK option usage caused repetitive deprecation noise
- Fix: switched host parsing to prefer host/port/ssl options with URL and host-only compatibility
- Files modified: onboarding/backend/vector-store-client.cjs
- Commit: 606abfb

## Known Stubs

None.

## Self-Check: PASSED

- Commit found: 606abfb

