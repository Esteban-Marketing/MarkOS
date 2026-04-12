---
phase: 81-governance-publish-and-rollback-operational-surface
plan: 02
subsystem: governance-api
tags: [governance, api, publish, rollback, status]
requires:
  - phase: 81-governance-publish-and-rollback-operational-surface
    provides: red-phase tests from 81-01
provides:
  - api/governance/brand-publish.js
  - api/governance/brand-rollback.js
  - api/governance/brand-status.js
  - green route tests for phase-81 contract
affects: [81-governance-publish-and-rollback-operational-surface]
tech-stack:
  added: []
  patterns: [thin route handler, hosted auth gate, RBAC gate, method guard, denial pass-through]
key-files:
  created:
    - api/governance/brand-publish.js
    - api/governance/brand-rollback.js
    - api/governance/brand-status.js
  modified:
    - test/phase-81/brand-publish-route.test.js
key-decisions:
  - "Reuse evidence.js authorization pattern exactly (manage_billing OR manage_users)."
  - "Pass through denial payloads from active-pointer.cjs unchanged."
  - "Filter traceability log by tenant_id in brand-status route."
patterns-established:
  - "Governance operational routes are thin wrappers over active-pointer.cjs."
  - "Serverless in-memory caveat documented in each route file."
requirements-completed: [BRAND-GOV-01]
duration: 22min
completed: 2026-04-12
---

# Phase 81 Plan 02: Summary

**Implemented publish, rollback, and status governance routes with auth guardrails and tenant-safe status output.**

## Performance

- **Duration:** 22 min
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Implemented `brand-publish.js` with POST method guard, hosted auth (`approve_write`), RBAC guard, required `bundle_id` validation, and full denial pass-through.
- Implemented `brand-rollback.js` with equivalent guardrails and denial pass-through semantics.
- Implemented `brand-status.js` with GET method guard, hosted auth (`status_read`), RBAC guard, active bundle read, and tenant-filtered traceability log.
- Fixed one test fixture issue in publish RED tests so gate-failure and success cases map to distinct payloads.

## Task Commits

1. **Task 1: publish route + test fixture correction** - `def05fc` (feat)
2. **Task 2: rollback route** - `86c5f6d` (feat)
3. **Task 3: status route** - `0390232` (feat)

## Files Created/Modified

- `api/governance/brand-publish.js` - publish operational surface.
- `api/governance/brand-rollback.js` - rollback operational surface.
- `api/governance/brand-status.js` - active bundle and traceability status surface.
- `test/phase-81/brand-publish-route.test.js` - fixture split into success payload and gate-fail payload.

## Verification

- `node --test test/phase-81/*.test.js` -> PASS (19/19)
- `node --test test/phase-81/brand-publish-route.test.js` -> PASS (6/6)
- `node --test test/phase-81/brand-rollback-route.test.js` -> PASS (7/7)
- `node --test test/phase-81/brand-status-route.test.js` -> PASS (6/6)

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Bug] Publish gate-failure fixture initially used a passing payload**
- **Found during:** Task 1 verification
- **Issue:** The gate-failure publish test expected 422 but received 200 because payload lanes were complete.
- **Fix:** Added explicit `makeGateFailPayload()` with empty `lineage_fingerprints` and used it in gate-failure test only.
- **Files modified:** `test/phase-81/brand-publish-route.test.js`
- **Verification:** Publish suite rerun, now 6/6 pass.
- **Committed in:** `def05fc`

**Total deviations:** 1 auto-fixed

## Issues Encountered

- Full repository regression command currently exits non-zero due existing unrelated assertion in `test/tracking/tracking-browser-contract.test.js` (not introduced by this plan).

## User Setup Required

None.

## Next Phase Readiness

- Phase 81 route implementation is complete and contract tests are green.
- Ready for phase-level verification artifact and requirement traceability promotion.
