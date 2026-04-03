---
phase: 53-agentic-markos-orchestration-and-mir-msp-intelligence
plan: 04
subsystem: telemetry
tags: [telemetry, provider-routing, fallback, validation, agt-04]
requires:
  - phase: 53-02
    provides: approval and IAM gate contracts
  - phase: 53-03
    provides: MIR/MSP lineage evidence for final validation
provides:
  - AGT-04 terminal close guard with required model/prompt/tool-event/latency/cost/outcome fields
  - policy-routed primary-provider selection and provider-attempt telemetry metadata
  - phase validation ledger for all Phase 53 requirement IDs
affects: [AGT-04, phase-53-validation, llm-fallback, orchestrator-telemetry]
tech-stack:
  added: []
  patterns:
    - run-close completeness guard
    - primary-provider-first fallback routing
    - process-local TypeScript test rebuild for llm adapter modules
key-files:
  created:
    - test/agents/run-close-telemetry.test.js
    - test/agents/provider-failover-telemetry.test.js
    - .planning/phases/53-agentic-markos-orchestration-and-mir-msp-intelligence/53-VALIDATION.md
  modified:
    - onboarding/backend/agents/telemetry.cjs
    - onboarding/backend/agents/orchestrator.cjs
    - onboarding/backend/agents/approval-gate.cjs
    - onboarding/backend/handlers.cjs
    - lib/markos/llm/types.ts
    - lib/markos/llm/telemetry-adapter.ts
    - lib/markos/llm/fallback-chain.ts
    - lib/markos/telemetry/events.ts
    - test/llm-adapter/llm-build-helper.cjs
key-decisions:
  - "Terminal run close fails when AGT-04 fields are incomplete rather than silently completing."
  - "Primary provider may be specified independently from legacy provider/fallbackChain options."
  - "TS llm test builds are recompiled from a clean temp output dir once per process to avoid stale artifacts across runs."
patterns-established:
  - "Closeout Pattern: provider attempts -> captureRunClose -> transitionRunState('completed')."
  - "Compatibility Pattern: repo-level IAM dependencies are lazy-loaded so temp-copy tests remain executable."
requirements-completed: [AGT-04]
duration: 15 min
completed: 2026-04-03
---

# Phase 53 Plan 04: Telemetry Completeness and Validation Summary

**AGT-04 run-close telemetry is now enforced at the orchestrator boundary, with designated-primary provider routing evidence and a complete Phase 53 validation ledger.**

## Performance

- **Duration:** 15 min
- **Completed:** 2026-04-03
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Added AGT-04 RED->GREEN tests for run-close completeness and primary-provider routing/failover telemetry.
- Implemented `captureProviderAttempt` and `captureRunClose` helpers in `onboarding/backend/agents/telemetry.cjs`.
- Wired orchestrator completion through a terminal close guard so runs cannot complete without telemetry evidence.
- Extended LLM fallback typing and metadata generation to support `primaryProvider`, `allowedProviders`, and provider-attempt telemetry payloads.
- Fixed stale TS test-build caching in `test/llm-adapter/llm-build-helper.cjs` so fallback/telemetry tests always run against current source.
- Repaired Phase 53 broader-suite regressions in temp-copy environments by making IAM loading lazy in `approval-gate.cjs` and allowing local/no-principal submit flows in `handlers.cjs`.
- Wrote `53-VALIDATION.md` with requirement closure and caveats.

## Task Commits

No git commits were created in this execution step.

## Files Created/Modified
- `test/agents/run-close-telemetry.test.js` - AGT-04 terminal guard coverage.
- `test/agents/provider-failover-telemetry.test.js` - designated primary-provider routing and provider-attempt event coverage.
- `onboarding/backend/agents/telemetry.cjs` - provider-attempt and run-close capture helpers.
- `onboarding/backend/agents/orchestrator.cjs` - finalizer that records run-close telemetry before terminal transition.
- `lib/markos/llm/types.ts` - `primaryProvider` and `allowedProviders` options.
- `lib/markos/llm/telemetry-adapter.ts` - provider-attempt metadata/event builders.
- `lib/markos/llm/fallback-chain.ts` - primary-provider-first chain resolution plus provider-attempt metadata capture.
- `lib/markos/telemetry/events.ts` - telemetry event union extension for agent run events.
- `test/llm-adapter/llm-build-helper.cjs` - clean rebuild fix for stale compiled llm test output.
- `onboarding/backend/agents/approval-gate.cjs` and `onboarding/backend/handlers.cjs` - compatibility fixes for temp-copy local test environments.

## Verification Results

- `node --test test/agents/run-close-telemetry.test.js test/agents/provider-failover-telemetry.test.js` → ✅ pass
- `node --test test/agents/run-lifecycle.test.js test/agents/run-idempotency.test.js test/agents/approval-gate.test.js test/rbac/plan-approval-policy.test.js test/mir/mir-gate-initialization.test.js test/literacy/discipline-activation-evidence.test.js test/mir/mir-regeneration-lineage.test.js test/agents/run-close-telemetry.test.js test/agents/provider-failover-telemetry.test.js` → ✅ 30/30 pass
- `node --test test/literacy-e2e.test.js test/migration-runner.test.js` → ⚠ literacy pass; migration-runner still fails unrelated with `TENANT_CONTEXT_REQUIRED`

## Decisions Made

- Kept AGT-04 run-close validation in the backend CJS telemetry surface so orchestrator enforcement remains testable without depending on compiled TS output.
- Fixed the stale-build issue at the helper level rather than weakening tests or manually clearing temp artifacts per test.
- Scoped local submit IAM bypass only to no-principal non-hosted execution so hosted authorization remains fail-closed.

## Deviations from Plan

- `npm test` was not fully green because `test/migration-runner.test.js` fails outside the Phase 53 touch surface with `TENANT_CONTEXT_REQUIRED` from `migration-runner.cjs`.
- That broader-suite caveat is recorded in `53-VALIDATION.md` and did not block Phase 53 targeted verification.

## User Setup Required

None for Phase 53 requirement closure.

## Next Phase Readiness

- Phase 53 is closed for targeted scope with a complete validation ledger.
- Remaining broader-suite attention, if desired, is outside Phase 53 and should focus on migration-runner tenant-context expectations.

## Self-Check: PASSED
- Found summary file: `.planning/phases/53-agentic-markos-orchestration-and-mir-msp-intelligence/53-04-SUMMARY.md`
- Found validation file: `.planning/phases/53-agentic-markos-orchestration-and-mir-msp-intelligence/53-VALIDATION.md`
- Verified Wave 3 targeted tests and full Phase 53 targeted regression suite

---
*Phase: 53-agentic-markos-orchestration-and-mir-msp-intelligence*
*Completed: 2026-04-03*