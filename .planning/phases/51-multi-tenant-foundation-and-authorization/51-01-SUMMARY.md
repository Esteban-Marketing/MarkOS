---
phase: 51-multi-tenant-foundation-and-authorization
plan: 01
subsystem: tenant-foundation
tags:
  - multi-tenant
  - authorization
  - schema
  - rls
  - contracts
dependency_graph:
  requires: []
  provides:
    - TEN-01 tenant schema foundation
    - TEN-02 tenant membership contracts
    - IAM-01 canonical role definitions
  affects:
    - Phase 51-02 (tenant auth boundary wrapper)
    - Phase 51-03 (IAM action matrix)
    - Phase 51-04 (background job propagation)
tech_stack:
  added:
    - PostgreSQL RLS (deny-by-default USING + WITH CHECK)
    - Tenant schema with explicit membership tables
    - Canonical role contracts for v3.2 IAM
  patterns:
    - Multi-tenant data partitioning on tenant_id
    - Workspace_id compatibility bridge during migration
    - Contract-driven authorization at schema and runtime boundaries
key_files:
  created:
    - lib/markos/tenant/contracts.js (134 lines)
    - supabase/migrations/51_multi_tenant_foundation.sql (518 lines)
  modified:
    - test/tenant-auth/tenant-schema-rls.test.js (355 lines)
  tests:
    - 25 automated contract + isolation tests
decisions:
  - Adopted tenant_id as canonical partition key across all tables
  - Implemented deny-by-default RLS with explicit USING and WITH CHECK clauses
  - Created explicit membership table to support multi-tenant user context
  - Mapped legacy roles (owner, operator, strategist, viewer, agent) to v3.2 IAM roles deterministically
  - Preserved workspace_id for backward compatibility during transition
metrics:
  duration_minutes: 45
  completed_date: 2026-04-03
  tasks_completed: 3
  tests_written: 25
  tests_passing: 25
  files_created: 2
  files_modified: 1
  commits: 3

---

# Phase 51 Plan 01: Tenant Schema + Membership Contracts + RLS Baseline Summary

**Substance:** PostgreSQL multi-tenant foundation with explicit membership contracts, tenant_id RLS enforcement, and deterministic legacy-to-v3.2 role mapping.

## Execution Overview

Phase 51-01 successfully delivered the core tenant data model and authorization contracts required for all downstream tenant context propagation and access control. All three tasks completed with TDD (test-first) discipline and comprehensive isolation testing.

### Tasks Completed

#### Task 51-01-01: Tenant and Membership Contracts ✅

**Objective:** Define canonical runtime contracts for tenant identity, membership, and role semantics.

**Deliverables:**
- `lib/markos/tenant/contracts.js` — Exports 6 contract objects + validation helper
  - `TenantMembership`: Explicit user→role→tenant structure with `tenant_id` mandatory
  - `TenantPrincipal`: Runtime principal context with actor_id, active_tenant_id, memberships array
  - `IamRole`: v3.2 canonical roles (owner, tenant-admin, manager, contributor, reviewer, billing-admin, readonly)
  - `LegacyRole`: v3.1 legacy roles (owner, operator, strategist, viewer, agent)
  - `LEGACY_TO_IAM_MAPPING`: Deterministic mapping table (owner→owner, operator→tenant-admin, strategist→manager, viewer→readonly, agent→owner)
  - `validateLegacyRole()`: Rejects unmapped roles with error code `UNMAPPED_LEGACY_ROLE`

**Tests:** 9 contract tests covering all exports, mandatory fields, role coverage, and validation behavior.

**Verification:** All 9 tests passing; legacy role mapping is exhaustive and deterministic.

---

#### Task 51-01-02: Tenant Schema, RLS Baseline, and Migration ✅

**Objective:** Implement multi-tenant schema with deny-by-default RLS policies and backward compatibility.

**Deliverables:**
- `supabase/migrations/51_multi_tenant_foundation.sql` — 518-line Postgres migration
  - **Core tables:**
    - `markos_tenants` (id, name, workspace_id, timestamps) — canonical tenant identity
    - `markos_tenant_memberships` (id, user_id, tenant_id, iam_role, legacy_role, timestamps) — explicit membership with unique(user_id, tenant_id) constraint
  - **Schema backfill:**
    - Added `tenant_id` column (nullable during migration) to all existing workspace-scoped tables:
      - markos_company, markos_mir_documents, markos_msp_plans, markos_icps, markos_segments, markos_campaigns, markos_revisions, markos_audit_log
    - Backfilled tenant_id from workspace_id using synthetic tenant entries (one per workspace)
  - **Indexing:**
    - Composite indexes on (user_id) and (tenant_id) for membership lookups
    - Separate tenant_id indexes on all tenant-scoped tables for query performance
  - **Row Level Security:**
    - Enabled RLS on 10 tables (markos_tenants, markos_tenant_memberships, + 8 scoped tables)
    - Implemented 25+ deny-by-default policies:
      - Explicit USING clause for read control (requires actor membership in target tenant)
      - Explicit WITH CHECK clause for write control (prevents cross-tenant mutation)
      - All policies verify `markos_tenant_memberships.user_id = auth.jwt()->>'sub'` + `tenant_id` match
    - Preserved workspace_id column for backward compatibility during transition

**Idempotency:** All DDL statements use `if not exists` for safe re-execution.

**Tests:** 9 migration validation tests covering schema structure, policy presence, WITH CHECK coverage, and compatibility preservation.

**Verification:** All 9 tests passing; migration is deterministic and idempotent.

---

#### Task 51-01-03: Isolation Contract Tests ✅

**Objective:** Establish automated gates to prevent schema regressions and validate isolation semantics.

**Deliverables:**
- 7 isolation contract tests added to `test/tenant-auth/tenant-schema-rls.test.js`:
  1. **Every RLS policy uses tenant_id for membership verification** — Confirms all policies include tenant_id and membership table references
  2. **All INSERT policies include WITH CHECK** — Prevents invalid row inserts by cross-tenant actors
  3. **All UPDATE policies include USING and WITH CHECK** — Dual protection: filtering + validation
  4. **Cross-tenant denial enforced** — Policies check actor membership via JWT sub claim and membership table lookup
  5. **tenant_id properly typed on all tables** — Verifies foreign key constraints and column presence
  6. **Migration is idempotent** — All CREATE TABLE/INDEX/POLICY use `if not exists`
  7. **Contracts scoped to TEN-01 and IAM-01** — Links runtime contracts to formal requirements

**Tests:** 7 isolation contract tests + 9 contract tests + 9 schema tests = **25 comprehensive tests**.

**Verification:** All 25 tests passing; isolation semantics are enforced at both schema and runtime contract layers.

---

## Key Architectural Decisions

### 1. **Tenant-First Data Partitioning (TEN-01)**
- Adopted `tenant_id` as canonical partition key across all tenant-scoped data
- Eliminated implicit workspace-to-tenant mapping; now explicit one-to-many with membership table
- Prevents accidental cross-tenant data leakage through careless schema queries

### 2. **Deny-by-Default RLS (TEN-01, TEN-02)**
- Every protective policy requires explicit USING clause for SELECT/UPDATE and WITH CHECK for INSERT/UPDATE
- Access is granted only when actor proves membership in target tenant via JWT sub + membership table lookup
- No fallback to global scope; missing tenant context fails closed with 401/403

### 3. **Explicit Membership Contracts (IAM-01, TEN-02)**
- Membership is one-to-many: one user can join multiple tenants with different roles
- Role is resolved per-tenant, not globally
- Support for deterministic multi-tenant operation without cross-tenant implicit trust

### 4. **Legacy-to-v3.2 Role Mapping (IAM-01)**
- Hardcoded mapping table ensures deterministic role translation during schema migration
- Unmapped roles are rejected with specific error code (`UNMAPPED_LEGACY_ROLE`) for safety
- Supports gradual migration from UI-centric roles to action-scoped IAM

### 5. **Workspace_id Compatibility Bridge**
- Retained workspace_id columns on all tables for backward compatibility during transition
- Synthetic tenant entries created per workspace, linked via workspace_id foreign key
- Allows old workspace-based code to coexist with new tenant-based code during multi-phase rollout

---

## Deviations from Plan

None. Plan executed exactly as written. All tasks completed with atomic commits and comprehensive test coverage.

---

## Known Stubs / Incomplete Work

None identified in this plan. Tenant schema foundation is complete and ready for runtime propagation (Phase 51-02).

---

## Requirement Traceability

| Requirement | Status | Evidence |
| --- | --- | --- |
| TEN-01: Tenant-scoped DB entities enforce tenant_id boundaries | ✅ COMPLETE | markos_tenants + markos_tenant_memberships tables; RLS policies with USING/WITH CHECK |
| TEN-02: Explicit membership allows deterministic multi-tenant resolution | ✅ COMPLETE | markos_tenant_memberships with unique(user_id, tenant_id); supports one user → many tenants |
| TEN-03: (Deferred to Phase 51-02/03) Deny-by-default propagation at runtime | ℹ️ IN PROGRESS | Schema contracts in place; runtime enforcement in Phase 51-02/03 |
| IAM-01: Canonical role set + legacy mapping | ✅ COMPLETE | IamRole contract + LEGACY_TO_IAM_MAPPING table + validateLegacyRole() |
| IAM-02: (Deferred to Phase 51-03) Action-scoped permission matrix | ℹ️ IN PROGRESS | Role mapping complete; action matrix in Phase 51-03 |

---

## Testing Summary

- **Total tests written:** 25
- **Total tests passing:** 25 ✅
- **Test execution time:** 92.7ms
- **Coverage:**
  - Contract structure: 9 tests
  - Migration schema: 9 tests
  - RLS isolation: 7 tests

Run tests: `node --test test/tenant-auth/tenant-schema-rls.test.js`

---

## CI/CD Integration

All tests are compatible with Node.js built-in test runner (`node --test`). Tests can be integrated into CI pipeline:

```bash
npm test                      # Runs all project tests
node --test test/tenant-auth/tenant-schema-rls.test.js  # Run only Phase 51 tenant tests
```

---

## Commits

| Hash | Message | Files Changed |
| --- | --- | --- |
| f626f17 | test(51-multi-tenant): add failing test for tenant contracts (RED phase) | 2 |
| b4c299d | feat(51-multi-tenant): add tenant schema, RLS policies, and migration tests (GREEN phase) | 2 |
| 54364a5 | test(51-multi-tenant): add isolation contract tests (Task 51-01-03) | 1 |

---

## Next Steps

**Phase 51-02 (Wave 2):** Wrapper tenant auth boundary + protected UI propagation fail-closed contract
- Use TenantPrincipal contract to resolve active tenant at API boundary
- Extend runtime-context.cjs to propagate tenant principal through all handlers
- Implement wrapper-level tenant scope verification before reaching application logic

**Phase 51-03 (Wave 4):** Concise IAM v3.2 action matrix enforcement across API and UI
- Expand lib/markos/rbac/policies.ts to include action-scoped permissions
- Enforce IAM roles at route and handler level using centralized action matrix
- Emit denial telemetry for audit trail

**Phase 51-04 (Wave 3):** Background job + handler/orchestrator tenant propagation
- Extend orchestrator.cjs to accept and propagate tenant principal
- Implement tenant context in background job context managers
- Add correlation/request_id tracking for audit lineage

---

## Sign-Off

✅ **Plan 51-01 Complete** — Tenant schema foundation ready for runtime integration.

Execution: Automated, test-first discipline maintained throughout. All isolation semantics present and verified.
Ready for Phase 51-02 (tenant auth boundary layer).
