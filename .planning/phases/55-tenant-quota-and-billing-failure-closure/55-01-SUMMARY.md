---
phase: 55-tenant-quota-and-billing-failure-closure
plan: 01
subsystem: quota-enforcement
tags: [tenant-quotas, billing, runtime-enforcement, submit-seam, plugin-runtime, tdd]
completed: 2026-04-04
verification_status: pass
---

# Phase 55 Plan 01 Summary

## Outcome

Closed the TEN-04 quota contract by adding explicit `quota_state` handling, exact deny vocabulary for project capacity, token budget, and agent run exhaustion, and one named submit-time project-cap seam.

## Delivered Evidence

- Added explicit quota normalization and dimension-specific reason codes in `lib/markos/billing/contracts.ts`, `lib/markos/billing/entitlements.ts`, and `lib/markos/billing/entitlements.cjs`.
- Added a dedicated quota-dimension evaluator and exposed it through `lib/markos/billing/enforcement.cjs` and `onboarding/backend/runtime-context.cjs`.
- Bound project-cap enforcement to the canonical submit mutation seam in `onboarding/backend/handlers.cjs` before project slug materialization and orchestration.
- Preserved recovery surfaces by allowing billing/settings/evidence actions to proceed even while prepaid quota is exhausted.
- Added direct regression proof for shared evaluator behavior, plugin runtime behavior, recovery-surface preservation, and submit-time project-cap blocking.

## Verification

- `node --test test/billing/entitlement-enforcement.test.js test/billing/plugin-entitlement-runtime.test.js test/plugin-control.test.js test/agents/provider-policy-runtime.test.js test/billing/submit-project-cap.test.js` -> PASS (29 tests, 0 failures)

## Direct Requirement Closure

- TEN-04 now has direct Phase 55 evidence for `PROJECT_CAP_EXCEEDED`, `TOKEN_BUDGET_EXHAUSTED`, `AGENT_RUN_LIMIT_EXCEEDED`, explicit `quota_state`, and the named submit handler seam.