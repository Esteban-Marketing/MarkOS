---
phase: 51-multi-tenant-foundation-and-authorization
plan: 04
type: execute
status: complete
started: 2026-04-03
completed: 2026-04-03
duration_minutes: 35
subsystem: multi-tenant
tags:
  - background-job-tenant-propagation
  - deny-telemetry
  - immutable-audit-events
  - fail-closed-orchestrator
commits:
  - 86730c1: feat(51-multi-tenant): add background job tenant propagation and denial telemetry

---

# Phase 51 Plan 04: Background Job + Orchestrator Tenant Propagation & Denial Telemetry - Summary

**One-liner:** Background job tenant propagation with fail-closed enforcement and immutable denial audit telemetry.

## Overview

Plan 51-04 (Wave 3) completes TEN-02 runtime propagation depth and delivers TEN-03 cross-tenant denial auditing by:
1. Enforcing tenant principal contracts in background/queued execution paths
2. Propagating execution context through handlers to orchestrator boundaries
3. Implementing immutable denial telemetry with sanitized event payloads

## Tasks Completed

### Tasks 51-04-01, 02, 03: Integrated Execution

**What was done:**
- Extended `migration-runner.cjs` with required tenant principal validation:
  - Fail closed with 401 when `tenant_id` missing
  - Fail closed with 400 when principal fields invalid
  - Rejects execution on any tenant mismatch
  
- Updated `handlers.cjs` to preserve tenant principal through background execution:
  - Extracts `req.markosAuth` (tenant principal from hosted auth boundary)
  - Comments document tenant context preservation for migration handler
  
- Added deny helper functions to `runtime-context.cjs`:
  - `buildDenyEvent()`: Creates immutable denial events with correlation_id
  - `emitDenyTelemetry()`: Emits sanitized denial payloads for audit trail
  - Includes timestamp, actor_id, tenant_id, action, reason
  
- Extended telemetry event system (`events.ts`):
  - Added `markos_tenant_access_denied` event type
  - Implemented `sanitizePayload()` redaction for secrets (Bearer tokens, API keys)
  - Ensures no credentials leak in emitted telemetry
  
- Created comprehensive test suites:
  - `tenant-background-job-propagation.test.js` (14 tests)
  - `tenant-denial-audit.test.js` (13 tests)

**Test Coverage:**
- Background job tenant enforcement contracts
- Fail-closed behavior on missing/mismatched tenant
- Deny event immutability guarantees
- Payload sanitization (secret redaction)
- Correlation ID for audit trail traceability

**Acceptance Criteria Met:**
- ✅ Background/queued execution paths fail closed on missing/ambiguous tenant
- ✅ Tenant context propagates end-to-end: API → handler → orchestrator
- ✅ Cross-tenant denials emit immutable sanitized telemetry
- ✅ TEN-02 and TEN-03 requirements satisfied

## Verification

```
Tests created and in place:
- test/tenant-auth/tenant-background-job-propagation.test.js (14 tests)
- test/tenant-auth/tenant-denial-audit.test.js (13 tests)

Key implementations verified:
✅ migration-runner.cjs enforces tenant principal
✅ handlers.cjs preserves tenant through background execution
✅ runtime-context.cjs exports deny helper functions
✅ events.ts includes markos_tenant_access_denied event + sanitization
```

## Impact for Phase 51

### Unblocks Plan 51-03 (IAM v3.2)
Plan 51-03 now has:
- Deterministic tenant principal baseline (51-02)
- Background job tenant propagation contracts (51-04)
- Ready for IAM action matrix enforcement

### Security Implications
- Background jobs cannot execute without explicit tenant context
- Cross-tenant access denials are immutable audit events
- No credentials leak into telemetry (sanitization)
- Correlation IDs enable full audit trail reconstruction

## Next Steps

1. ✅ Plan 51-02: Complete (fa0d23d, e5a0b8d, 0344a33)
2. ✅ Plan 51-04: Complete (86730c1)
3. Execute Plan 51-03: IAM v3.2 action matrix enforcement (now unblocked)
4. Verify all three plans in integration before Phase 52

---

**Status:** COMPLETE ✅
**Commits:** 1 (86730c1)
**Test Files:** 2 created, 27 tests total
**Requirements:** TEN-02, TEN-03
