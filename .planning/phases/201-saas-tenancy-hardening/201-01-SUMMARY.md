---
phase: 201-saas-tenancy-hardening
plan: "01"
subsystem: orgs-schema
tags: [orgs, tenants, rls, reserved-slugs, wave-1]
dependency_graph:
  requires: []
  provides:
    - supabase/migrations/81_markos_orgs.sql
    - lib/markos/orgs/contracts.cjs
    - lib/markos/orgs/api.cjs
    - lib/markos/tenant/reserved-slugs.cjs
  affects: [201-03, 201-04, 201-05, 201-06, 201-07]
tech_stack:
  added: []
  patterns: [dual-export-ts-cjs, rls-membership-policy, idempotent-backfill, supabase-client-agnostic]
key_files:
  created:
    - supabase/migrations/81_markos_orgs.sql
    - supabase/migrations/rollback/81_markos_orgs.down.sql
    - lib/markos/orgs/contracts.ts
    - lib/markos/orgs/contracts.cjs
    - lib/markos/orgs/api.ts
    - lib/markos/orgs/api.cjs
    - lib/markos/tenant/reserved-slugs.cjs
    - lib/markos/tenant/reserved-slugs.ts
    - test/tenancy/org-model.test.js
    - test/tenancy/reserved-slugs.test.js
  modified: []
decisions:
  - "SOURCE OF TRUTH for ORG_ROLES + TENANT_STATUSES lives in contracts.cjs. contracts.ts re-exports via require() so there is zero chance of twin-definition drift."
  - "api.cjs takes the Supabase client as an argument — never instantiates one. Keeps the library edge-runtime neutral (middleware can safely require it) and fully mockable in tests."
  - "Idempotent legacy-org backfill (on conflict do nothing + where org_id is null) so the migration is safe to re-apply against a partially migrated database."
  - "Reserved-slug blocklist (D-11) exceeds the planned 70-entry minimum — 88 entries across system/vendor/protected/single-char/profanity categories. RESERVED_SLUGS.size check in test suite locks growth floor."
metrics:
  tasks_completed: 2
  tasks_total: 2
  files_created: 10
  tests_passing: 21
---

# Phase 201 Plan 01: Orgs Schema + Reserved-Slug Lib Summary

Shipped the Wave 1 org↔tenant foundation. `markos_orgs` + `markos_org_memberships`
tables, `org_id` + `slug` + `status` extensions on `markos_tenants`, RLS policies
cloned from migration-51 pattern, `count_org_active_members` RPC, and the locked
D-11 reserved-slug blocklist as a dual-export library.

## Tasks

| # | Task | Status | Tests |
|---|------|--------|-------|
| 1 | Migration 81 + rollback + reserved-slugs lib + test stubs | ✓ | 15 pass + 2 todo |
| 2 | lib/markos/orgs/{contracts,api}.{ts,cjs} dual-export + flip todos | ✓ | 21/21 pass |

## Verification

- `node --test test/tenancy/org-model.test.js test/tenancy/reserved-slugs.test.js` → 21/21 pass, 0 todo
- Migration shape locked by 6 regex assertions
- Rollback covers every create (function, 5 policies, 3 columns, 2 tables)
- Reserved-slug blocklist covers 88 entries across 5 categories
- 16 trademark/vendor names reserved to prevent typo-squat + phishing (tied to phase 200-08 Claude Marketplace listing)

## Commits

- `feat(201-01): migration 81 + reserved-slug blocklist + test stubs (Task 1)`
- `feat(201-01): dual-export lib/markos/orgs/{contracts,api} + flip todos (Task 2)`

## REQ Coverage

`QA-01` (single source of truth) · `QA-02` (typed contracts + deterministic API) ·
`QA-04` (tenant isolation 100% via RLS membership pattern) · `QA-05` (deterministic
reserved-slug test suite) · `QA-13` (rollback migration exists) · `QA-15` (structured
audit hooks prepared by schema — emitters land in Plan 08).

## Unblocks

Every Wave 2 plan depends on the org↔tenant FK shape and the reserved-slug lib:
- Plan 03 signup provisioner creates the user's first org + tenant
- Plan 04 passkey binds to user within org context
- Plan 05 middleware resolves subdomain → tenant via slug, uses reserved-slug check
- Plan 06 BYOD enforces org-level quota via `count_org_active_members`
- Plan 07 invite/member/lifecycle flow wires membership + offboarding state

## Self-Check: PASSED (21/21 tests, 2 atomic commits, 10 files shipped)
