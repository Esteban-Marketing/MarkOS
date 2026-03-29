# 31-01 Summary

## One-liner
Implemented a code-backed endpoint SLO registry plus stable rollout endpoint telemetry for `/submit`, `/approve`, `/linear/sync`, and `/campaign/result`.

## Key Files
- onboarding/backend/agents/telemetry.cjs
- onboarding/backend/handlers.cjs
- README.md
- TECH-MAP.md
- test/onboarding-server.test.js

## Delivered
- Added `ROLLOUT_ENDPOINT_SLOS` with exact tiered thresholds.
- Added `captureRolloutEndpointEvent()` emitting `rollout_endpoint_observed` with stable fields.
- Added handler-level endpoint instrumentation with `duration_ms`, `status_code`, `outcome_state`, and `runtime_mode`.
- Updated docs to keep SLO values and tier semantics aligned with runtime constants.

## Verification
- `node --test test/onboarding-server.test.js` (pass)
