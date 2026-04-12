---
phase: 85-ultimate-literacy-vault-foundation
plan: "04"
subsystem: vault-ingestion
tags: [audience-enforcement, scope-guard, no-manual-publish, visibility, phase-closure]
dependency_graph:
  requires: [85-01, 85-02, 85-03]
  provides: [visibility-scope-guard, audience-validation-at-ingest, sync-service-module, phase-85-closure-evidence]
  affects: [server.cjs ingestion-adjacent routes]
tech_stack:
  added: [visibility-scope.cjs, sync-service.cjs]
  patterns: [fail-closed scope guard, audience metadata enforcement at ingest boundary, no-publish-gate guarantees]
key_files:
  created:
    - onboarding/backend/vault/visibility-scope.cjs
    - onboarding/backend/vault/sync-service.cjs
    - test/phase-85/audience-visibility.test.js
    - test/phase-85/no-manual-publish-regression.test.js
    - .planning/phases/85-ultimate-literacy-vault-foundation/85-VALIDATION.md
  modified:
    - onboarding/backend/server.cjs
decisions:
  - Scope guard fails closed on any missing or mismatched tenant/role claim (D-07)
  - Audience schema validated in sync-service before normalization (D-03 / LITV-04)
  - Phase 86/87 retrieval role-views explicitly deferred; no files in those phases touched
  - Server wires GET /api/vault/sync/visibility with inlined scope enforcement
metrics:
  completed: 2026-04-12
  tasks: 3
  files_created: 5
  files_modified: 1
---

# Phase 85 Plan 04: Audience Enforcement, Scope Guard, and Phase Closure Summary

**One-liner:** Fail-closed tenant/role scope guard with audience-tag enforcement wired into sync-service and server visibility route, closing Phase 85 with 33 passing tests across 8 test files.

---

## Tasks Completed

| # | Task | Files | Outcome |
|---|------|-------|---------|
| 1 | TDD RED — audience-visibility + no-manual-publish tests | `test/phase-85/audience-visibility.test.js`, `test/phase-85/no-manual-publish-regression.test.js` | 13 failing tests created |
| 2 | TDD GREEN — visibility-scope + sync-service implementation | `visibility-scope.cjs`, `sync-service.cjs`, `server.cjs` | All 13 new tests green |
| 3 | Phase 85 closure evidence | `85-VALIDATION.md` | Full ledger with gate outputs |

---

## Implementation Notes

**visibility-scope.cjs**  
`checkVisibilityScope(claims, resourceContext)` returns `{ allowed, code, reason }`. Fails closed when tenant/role missing (`E_SCOPE_CLAIMS_MISSING`), when role is not in the allowed set (`E_SCOPE_ROLE_DENIED`), or when tenant mismatch (`E_SCOPE_TENANT_MISMATCH`). Allowed roles: `operator`, `admin`, `audit-viewer`.

`projectAuditLineage(claims, records)` filters lineage records to caller's tenant only — returns empty array for empty claims.

**sync-service.cjs**  
`createSyncService({ tenantId, vaultRoot, ingestEvent })` wraps `normalizeSyncEvent` + `validateAudienceMetadata`. All events produced have `requires_manual_publish: false`. Invalid audience metadata throws before normalization. Tenant context threaded into every emitted event.

**server.cjs**  
Added `GET /api/vault/sync/visibility` route using `checkVisibilityScope`. Reads `x-tenant-id`, `x-role`, `x-resource-tenant-id` headers. Returns 403 + JSON error on scope denial, 200 + empty lineage on success.

---

## Deviations from Plan

None — plan executed exactly as written. `audience-schema.cjs` required no modifications (already complete). TDD cycle was clean RED → GREEN with no intermediate rewrites.

---

## Test Results

| Gate | Command | Result |
|------|---------|--------|
| Gate 1 | `node --test test/phase-85/idempotency-lww.test.js` | 4/4 PASS |
| Gate 2 | `node --test test/phase-85/sync-event-contract.test.js test/phase-85/no-manual-publish-regression.test.js` | 8/8 PASS |
| Gate 3 | `node --test test/phase-85/audience-visibility.test.js` | 8/8 PASS |
| Gate 4 | `node --test test/phase-85/*.test.js --test-force-exit` | 33/33 PASS |
| Regression | `npm test` | 885/916 pass; 31 failures all pre-existing (verified via git stash baseline) |

---

## Known Stubs

None. All behavior is fully wired — no hardcoded empty returns, no placeholder data, no TODO markers in produced files.

## Self-Check: PASSED
- `onboarding/backend/vault/visibility-scope.cjs` ✅ exists
- `onboarding/backend/vault/sync-service.cjs` ✅ exists
- `test/phase-85/audience-visibility.test.js` ✅ exists
- `test/phase-85/no-manual-publish-regression.test.js` ✅ exists
- `.planning/phases/85-ultimate-literacy-vault-foundation/85-VALIDATION.md` ✅ exists
- 33/33 Phase 85 tests pass ✅
- 0 new test failures introduced ✅
