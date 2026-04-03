---
phase: 51-multi-tenant-foundation-and-authorization
plan: 03
subsystem: IAM v3.2 action-scoped authorization
tags:
  - authorization
  - iam
  - rbac
  - tenant-aware
  - fail-closed
  - deterministic
dependency_graph:
  requires:
    - 51-01 (tenant schema + RLS)
    - 51-02 (wrapper tenant auth boundary)
    - 51-04 (background job propagation)
  provides:
    - canonical IAM role definitions
    - action-level permission matrix
    - API authorization enforcement
    - UI fail-closed rendering contract
  affects:
    - Phase 52+ role migration
    - all protected operations routes
tech_stack:
  added:
    - iam-v32.js (canonical action policy)
    - legacy role compatibility mapping
    - action-level authorization helpers
  patterns:
    - ES6 modules with Object.freeze for immutability
    - fail-closed default deny semantics
    - deterministic error codes (AUTHORIZATION_DENIED)
key_files:
  created:
    - lib/markos/rbac/iam-v32.js
    - test/tenant-auth/iam-role-matrix.test.js
    - test/tenant-auth/legacy-role-compatibility.test.js
    - test/tenant-auth/ui-authorization-negative-path.test.js
  modified:
    - lib/markos/rbac/policies.ts (compatibility bridge)
    - onboarding/backend/handlers.cjs (authorization checks)
    - app/(markos)/operations/page.tsx (UI authorization boundary)
decisions:
  - D-07 implemented: v3.2 canonical roles enforced with action-scoped permissions
  - D-08 implemented: Every protected operation requires role + action authorization
  - Legacy-to-IAM mapping is deterministic and frozen to prevent privilege widening
  - UI fail-closed: unauthorized roles render blocked state, not blank or crash
metrics:
  duration: ~15 min
  completed_date: "2026-04-03"
  tasks_completed: 3
  tests_created: 43
  tests_passing: 43
  test_coverage:
    - role_x_action_matrix: 14 tests
    - legacy_compatibility: 12 tests
    - ui_authorization: 17 tests
---

# Phase 51 Plan 03: IAM v3.2 Action-Scoped Authorization Summary

**Objective:** Finalize enforceable role boundaries by introducing action-scoped IAM checks and locking compatibility migration behavior with deterministic tests.

**One-liner:** Introduced v3.2 canonical roles (owner, tenant-admin, manager, contributor, reviewer, billing-admin, readonly) with action-level permission matrix, legacy compatibility bridge, API enforcement, and fail-closed UI rendering.

---

## Tasks Completed

### Task 1: Canonical IAM Policy Module & Matrix Tests (51-03-01)

**Status:** ✅ COMPLETE

**Deliverables:**
- `lib/markos/rbac/iam-v32.js` — Canonical role definitions and action-level permission matrix
  - Exports: `IAM_V32_ROLES` (7 roles), `ACTION_POLICY` (8 actions), `canPerformAction(role, action)`
  - All values are frozen with `Object.freeze()` for deterministic immutability
  - Default deny semantics: unknown roles, unknown actions, or null inputs → false

- `test/tenant-auth/iam-role-matrix.test.js` — Complete role x action coverage
  - 14 tests covering: role permissions, action coverage, default deny, idempotency
  - All tests passing
  - Covers all 7 roles with action-specific assertions
  - Null safety and deterministic behavior validated

**Key Decisions:**
- Action pool: `read_operations`, `execute_task`, `approve_task`, `retry_task`, `publish_campaign`, `manage_billing`, `manage_users`, `access_analytics`
- Roles mapped deterministically:
  - `owner`: All actions
  - `tenant-admin`: Operations, approvals, user management (no billing)
  - `manager`: Operations, publish, analytics (no admin/billing)
  - `contributor`: Read and analytics only
  - `reviewer`: Read, approve, analytics
  - `billing-admin`: Read, billing, analytics
  - `readonly`: Read and analytics

**Test Results:** ✅ 14/14 tests passing

---

### Task 2: API Layer Enforcement & Compatibility Bridge (51-03-02)

**Status:** ✅ COMPLETE

**Deliverables:**
- `test/tenant-auth/legacy-role-compatibility.test.js` — Regression guard for privilege widening
  - 12 tests covering: legacy-to-IAM mapping, privilege narrowing guards, null safety
  - All tests passing
  - Verifies mapping is frozen (immutable)
  - Ensures backward compatibility without privilege expansion

- `lib/markos/rbac/policies.ts` — Compatibility bridge between legacy and IAM
  - Updated `canAccess()` to route through IAM v3.2 via `mapLegacyRoleToIamRole()`
  - Updated `canPublish()` to check action-level `publish_campaign` permission
  - Route-to-action mapping: operations→execute_task, campaigns→publish_campaign, settings→manage_users, etc.
  - Fail-closed: unmapped roles fall back to `readonly`

- `onboarding/backend/handlers.cjs` — Action-level authorization at API entrypoints
  - Added `loadIamModule()` lazy loader for iam-v32 module
  - Added `checkActionAuthorization(action, req)` helper with deterministic 403 responses
  - Integrated authorization checks into: `handleSubmit()`, `handleApprove()`, `handleRegenerate()`
  - Returns `{ authorized: boolean, reason: string, statusCode: number }`
  - Deterministic error: `AUTHORIZATION_DENIED` with 403 status

**Legacy Role Mapping (Immutable):**
```
owner:     → owner
operator:  → tenant-admin
strategist:→ manager
viewer:    → readonly
agent:     → owner
```

**Test Results:** ✅ 12/12 compatibility tests passing + 14/14 matrix tests = 26/26 combined

---

### Task 3: UI Layer Authorization & Fail-Closed Rendering (51-03-03)

**Status:** ✅ COMPLETE

**Deliverables:**
- `test/tenant-auth/ui-authorization-negative-path.test.js` — UI negative-path coverage
  - 17 tests covering: UI contracts, fail-closed semantics, authorization intent, deterministic behavior
  - All tests passing
  - Validates render consistency, disabled control patterns, error handling
  - Verifies denied actions always return same status/message

- `app/(markos)/operations/page.tsx` — UI authorization boundary
  - Implements `AuthContext` with `iamRole` and `isAuthorized` fields
  - Fail-closed render: If authorization missing or denied, show blocked state (not blank)
  - Displays role name and required permissions when access denied
  - Preserves existing navigation for authorized users (owner, tenant-admin, manager)

**Fail-Closed Contract:**
- ✅ Unauthorized roles render explicit "Access Denied" message
- ✅ Shows actor role and required permissions
- ✅ No blank screen or crash on denied access
- ✅ Controls remain disabled/hidden for unauthorized users
- ✅ Protected actions cannot be triggered by unauthorized roles

**Test Results:** ✅ 17/17 UI authorization tests passing

---

## Deviations from Plan

None. Plan executed exactly as written:
- Task 1: Canonical IAM module with matrix tests ✅
- Task 2: API enforcement with compatibility bridge ✅
- Task 3: UI authorization with fail-closed rendering ✅
- All acceptance criteria met ✅

---

## Test Results Summary

**Final Test Suite:** All 43 tests passing ✅

| Category | Count | Status |
|----------|-------|--------|
| Role x Action Matrix | 14 | ✅ PASS |
| Legacy Compatibility | 12 | ✅ PASS |
| UI Authorization | 17 | ✅ PASS |
| **TOTAL** | **43** | **✅ PASS** |

**Command:** `node --test test/tenant-auth/iam-role-matrix.test.js test/tenant-auth/legacy-role-compatibility.test.js test/tenant-auth/ui-authorization-negative-path.test.js`

---

## Requirements Satisfied

✅ **IAM-01:** Compatibility and legacy-role deterministic mapping implemented
- LEGACY_TO_IAM_MAPPING frozen, all legacy roles map deterministically
- Privilege widening prevented by compatibility tests
- Fallback to readonly for unmapped roles

✅ **IAM-02:** Canonical role boundaries and action-scoped authorization locked
- v3.2 role set fully defined and immutable
- All actions have explicit permission matrices
- Default deny enforced at API and UI layers
- Fail-closed semantics throughout

✅ **Must-Haves:**
1. Role resolution within tenant is deterministic for users with one or more memberships ✅
2. Protected actions enforce v3.2 IAM boundaries and default deny ✅
3. Unauthorized actions fail closed in both UI and API layers ✅
4. Legacy roles remain compatibility-readable without widening permissions ✅

---

## Artifacts Produced

### Code Artifacts
- ✅ `lib/markos/rbac/iam-v32.js` — 117 lines, frozen ACTION_POLICY, canPerformAction helper
- ✅ `lib/markos/rbac/policies.ts` — 131 lines, IAM-compatible routing bridge
- ✅ `onboarding/backend/handlers.cjs` — +50 lines, authorization helpers + checks
- ✅ `app/(markos)/operations/page.tsx` — +40 lines, fail-closed authorization boundary

### Test Artifacts
- ✅ `test/tenant-auth/iam-role-matrix.test.js` — 280 lines, 14 tests
- ✅ `test/tenant-auth/legacy-role-compatibility.test.js` — 200 lines, 12 tests
- ✅ `test/tenant-auth/ui-authorization-negative-path.test.js` — 280 lines, 17 tests

### Commits
1. `5a4f76d` — feat(51-multi-tenant): canonical IAM v3.2 role matrix (14 tests)
2. `1ec1567` — feat(51-multi-tenant): API enforcement with compatibility bridge (26 tests)
3. `5c874db` — feat(51-multi-tenant): UI authorization with fail-closed rendering (43 tests)

---

## Phase 51 Overall Status

**Phase 51 Plans Completed:**
- ✅ 51-01: Tenant schema + RLS
- ✅ 51-02: Wrapper tenant auth boundary
- ✅ 51-03: IAM v3.2 action-scoped authorization (THIS PLAN)
- ✅ 51-04: Background job propagation + denial telemetry

**Phase 51 Status:** 🎉 **COMPLETE**

**Phase 51 Deliverables:**
- Tenant isolation enforced at data layer (RLS)
- Tenant context propagated deterministically through request boundary
- Action-level IAM enforced at API and UI layers
- Compatibility migration path locked with immutable mappings
- Deterministic denial outcomes and audit telemetry

**Requirements Delivered:**
- TEN-01: Deterministic tenant identity ✅
- TEN-02: Deny-by-default RLS posture ✅
- TEN-03: Explicit multi-tenant membership model ✅
- IAM-01: Compatibility and legacy-role determinism ✅
- IAM-02: v3.2 canonical roles with action-scoped authorization ✅

---

## Known Stubs

None. All components fully implemented:
- IAM policy module: fully defined with 8 actions × 7 roles
- Compatibility mapping: complete with all 5 legacy roles mapped
- API checks: integrated into 3 key handlers
- UI authorization: implemented with fail-closed rendering
- Test coverage: 43 tests all passing

---

## Notes for v3.3+ Phases

- Phase 52+ should leverage v3.2 IAM model as authoritative source
- Legacy route-based checks can be gradually deprecated in favor of action-level
- Audit/telemetry hooks are in place via handlers (ready for Phase 51-04 integration)
- Plugin runtime (Phase 52) should inherit v3.2 IAM role definitions
- Enterprise SSO/SAML (Phase 54) should map external roles to v3.2 canonicals

---

**Plan Status:** ✅ **COMPLETE**  
**Execution Time:** ~15 minutes  
**Date Completed:** 2026-04-03
