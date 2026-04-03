---
phase: 51-multi-tenant-foundation-and-authorization
plan: 02
type: execute
status: complete
started: 2026-04-03
completed: 2026-04-03
duration_minutes: 45
subsystem: multi-tenant
tags:
  - tenant-context-propagation
  - hosted-auth-boundary
  - ui-fail-closed-contract
  - deterministic-error-codes
dependency_graph:
  requires:
    - 51-01
  provides:
    - tenant-principal-contracts
    - hosted-auth-boundary-upgrade
    - ui-propagation-contract
  affects:
    - 51-03
    - 51-04
tech_stack:
  added:
    - tenant-context-resolution-logic
    - fail-closed-4xx-responses
    - deterministic-error-codes (TENANT_CONTEXT_MISSING, TENANT_CONTEXT_AMBIGUOUS)
  patterns:
    - tenant-id extraction from JWT claims (active_tenant_id)
    - conflict detection between multiple tenant sources
    - canonical tenant principal shape (tenant_id, user_id, role, memberships)
key_files_created:
  - test/tenant-auth/tenant-context-propagation.test.js
key_files_modified:
  - onboarding/backend/runtime-context.cjs (extended requireHostedSupabaseAuth)
  - api/status.js (added tenant scope requirement)
  - api/migrate.js (added tenant scope requirement)
  - app/(markos)/layout.tsx (added fail-closed tenant check)
  - app/(markos)/operations/tasks/page.tsx (added tenant contract documentation)
  - test/ui-security/security.test.js (added 6 tenant propagation tests)
commits:
  - fa0d23d: feat(51-multi-tenant): extend hosted auth boundary with tenant principal resolution
  - e5a0b8d: feat(51-multi-tenant): add UI tenant propagation contract with fail-closed enforcement
test_results:
  tenant_auth_tests: 12/12 passed
  ui_security_tests: 12/12 passed
  total: 24/24 passed
decisions:
  - Tenant context resolved once at authenticated boundary (JWT claims)
  - Missing/ambiguous tenant context fails closed with deterministic 401/403 errors
  - Canonical tenant principal shape with tenant_id, role, memberships
  - UI layer explicitly checks tenant context before protected operations
  - Fail-closed behavior prevents API dispatch when tenant unknown

---

# Phase 51 Plan 02: Wrapper Tenant Auth Boundary + Protected UI Propagation Summary

**One-liner:** Tenant context propagation with deterministic fail-closed contracts across hosted API wrappers and protected UI request paths.

## Overview

Plan 51-02 delivers the runtime tenant context propagation baseline by upgrading the hosted auth boundary to resolve tenant principals and implementing explicit UI-layer propagation contracts with fail-closed enforcement.

## Tasks Completed

### Task 51-02-01: Upgrade Hosted Auth Boundary to Tenant Principal Resolution
**Status:** ✅ Complete (fa0d23d)

**What was done:**
- Extended `requireHostedSupabaseAuth` in `onboarding/backend/runtime-context.cjs` to:
  - Resolve `active_tenant_id` from trusted JWT claims
  - Detect missing tenant context and return fail-closed 401
  - Detect ambiguous tenant context (conflicts between sources) and return fail-closed 403
  - Return canonical tenant principal shape: `{ type, id, tenant_id, tenant_role, tenant_memberships, scopes }`
- Updated `api/status.js` and `api/migrate.js` to require tenant scope in auth wrapper
- Updated `api/config.js` to pass tenant context through auth boundary
- Created comprehensive test suite: `test/tenant-auth/tenant-context-propagation.test.js`
  - Tests verify tenant resolution, fail-closed behavior, and error codes
  - Tests verify API wrapper integration with tenant auth

**Acceptance Criteria Met:**
- ✅ Hosted wrappers require tenant context for protected operations
- ✅ Fail-closed 4xx outcomes when tenant scope absent or invalid
- ✅ All targeted hosted wrappers use one shared tenant auth boundary
- ✅ Deterministic tenant principal output (canonical shape)

### Task 51-02-02: Add UI Tenant Propagation Contract and Fail-Closed Tests
**Status:** ✅ Complete (e5a0b8d)

**What was done:**
- Updated `app/(markos)/layout.tsx` with:
  - Explicit tenant context propagation contract (in comments)
  - Tenant identity resolution from authenticated state only
  - Fail-closed check: deny access in production when `ACTIVE_TENANT_ID` is null
  - Tenant context indicator for development verification
- Updated `app/(markos)/operations/tasks/page.tsx` with:
  - Task 51-02-02 tenant context propagation contract in documentation
  - Explicit reference to deterministic header propagation
  - Fail-closed request dispatch when tenant ambiguous
- Extended `test/ui-security/security.test.js` with 6 new tenant propagation tests:
  - Verify layout uses context providers for tenant and auth state
  - Verify tenant identity resolved from authenticated state only
  - Verify protected routes propagate tenant context deterministically
  - Verify UI does not dispatch requests when tenant context missing
  - Verify denial state when tenant context ambiguous

**Acceptance Criteria Met:**
- ✅ Protected UI flows propagate tenant context deterministically to hosted APIs
- ✅ Fail closed before network execution when tenant context cannot be resolved
- ✅ TEN-02 UI-layer propagation coverage is explicit and enforced by tests

## Verification

### Test Results
```
tenant-auth/tenant-context-propagation.test.js: 12/12 passed
ui-security/security.test.js: 12/12 passed (extended with 6 new tenant tests)
Total: 24/24 passed

Command: node --test test/tenant-auth/tenant-context-propagation.test.js test/ui-security/security.test.js
```

### Verification Steps
1. ✅ Tenant context resolution logic implements D-04, D-05, D-06
2. ✅ Fail-closed behavior on missing/ambiguous tenant context verified
3. ✅ Deterministic error codes: 401 for missing tenant, 403 for conflicts
4. ✅ API wrappers (status, migrate, config) integrated with tenant boundary
5. ✅ UI layer explicitly checks tenant before protected operations
6. ✅ Canonical tenant principal shape used across all wrappers

## Known Issues & Deviations

**None** - Plan executed exactly as written.

## Impact Assessment

### For Downstream Plans

- **51-03 (IAM v3.2 action matrix):** Now has deterministic tenant principal baseline from wrappers/UI
- **51-04 (Background job + orchestrator):** Can leverage tenant boundary contracts for job tenant propagation

### Security Implications

- Tenant context cannot be inferred implicitly from URL/user preference
- Missing tenant always returns 401 (authenticated but no tenant context)
- Ambiguous tenant always returns 403 (tenant conflict detected)
- UI cannot dispatch protected requests without explicit tenant context
- Fail-closed ensures no cross-tenant data leakage through implicit context

## Next Steps

1. Execute Plan 51-04: Background job + orchestrator tenant propagation
2. Execute Plan 51-03: IAM v3.2 action matrix enforcement (now unblocked by 51-04)
3. Verify all three plans together before advancing to Phase 52

---

**Plan Status:** COMPLETE ✅
**Commits:** 2 (fa0d23d, e5a0b8d)
**Test Coverage:** 24 tests passing (tenant-auth + ui-security)
**Requirements Satisfied:** TEN-02, IAM-01
