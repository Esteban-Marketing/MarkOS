---
phase: 201-saas-tenancy-hardening
plan: "05"
subsystem: middleware-sessions
tags: [middleware, subdomain, byod, sessions, surface-2, surface-8, wave-2]
dependency_graph:
  requires: [201-01, 201-02]
  provides:
    - middleware.ts
    - lib/markos/tenant/resolver.cjs
    - lib/markos/tenant/cookie-scope.cjs
    - api/tenant/sessions/list.js
    - api/tenant/sessions/revoke.js
    - app/(markos)/404-workspace/page.tsx
    - app/(markos)/settings/sessions/page.tsx
    - contracts/F-82-tenant-sessions-v1.yaml
  affects: [201-06, 201-07, 201-08]
tech_stack:
  added: []
  patterns: [vercel-routing-middleware, pure-resolver-then-db, restrictive-cookie-scope, service-role-handler]
key_files:
  created:
    - supabase/migrations/85_markos_sessions_devices.sql
    - supabase/migrations/rollback/85_markos_sessions_devices.down.sql
    - lib/markos/tenant/resolver.ts
    - lib/markos/tenant/resolver.cjs
    - lib/markos/tenant/cookie-scope.ts
    - lib/markos/tenant/cookie-scope.cjs
    - middleware.ts
    - app/(markos)/404-workspace/page.tsx
    - app/(markos)/404-workspace/page.module.css
    - app/(markos)/settings/sessions/page.tsx
    - app/(markos)/settings/sessions/page.module.css
    - api/tenant/sessions/list.js
    - api/tenant/sessions/revoke.js
    - contracts/F-82-tenant-sessions-v1.yaml
    - test/tenancy/resolver.test.js
    - test/tenancy/cookie-scope.test.js
    - test/tenancy/middleware.test.js
    - test/tenancy/sessions-api.test.js
  modified:
    - lib/markos/auth/session.ts
decisions:
  - "middleware.ts uses dynamic imports for Supabase + resolver so edge runtime + tests both work. Bare + system hosts short-circuit without DB calls."
  - "Inbound x-markos-* headers are discarded — middleware creates a fresh Headers instance before setting them, blocking spoof (T-201-05-03)."
  - "BYOD domain resolution filters on status='verified' only (Pitfall 5 mitigation). Unverified domains fall through to Next.js 404 instead of serving another tenant."
  - "Cookie domain chooser returns .markos.dev for first-party, null for BYOD — prevents cross-origin cookie theft (Pitfall 2)."
  - "Partial unique index on markos_custom_domains enforces D-13 1-per-org quota at the DB layer (not just in app code)."
  - "Revoke endpoint always emits audit staging row (single + all branches), keyed on session_id in payload for forensic replay."
metrics:
  tasks_completed: 2
  tasks_total: 2
  files_created: 18
  files_modified: 1
  tests_passing: 25
---

# Phase 201 Plan 05: Middleware + Sessions + 404 Summary

Shipped the first `middleware.ts` at repo root (D-09), the `markos_sessions_devices`
+ `markos_custom_domains` schema, `/settings/sessions` (Surface 2), `/404-workspace`
(Surface 8), session list + revoke handlers, F-82 contract, and 30-day rolling
session extensions on `lib/markos/auth/session.ts`.

## Tasks

| # | Task | Status | Tests |
|---|------|--------|-------|
| 1 | Migration 85 + resolver + cookie-scope + middleware.ts + session extensions | ✓ | 19/19 |
| 2 | Surface 2 sessions + Surface 8 404 + list/revoke handlers + F-82 | ✓ | 6/6 |

## Verification

- `node --test test/tenancy/resolver.test.js` → 10/10
- `node --test test/tenancy/cookie-scope.test.js` → 5/5
- `node --test test/tenancy/middleware.test.js` → 4/4
- `node --test test/tenancy/sessions-api.test.js` → 6/6
- Total: 25/25 pass. Regression in test/tenancy/{reserved-slugs,org-model} stays green.

## Commits

- `feat(201-05): migration 85 + resolver + cookie-scope + middleware.ts (Task 1, 19 tests)`
- `feat(201-05): Surface 2 sessions + Surface 8 404 + list/revoke + F-82 (Task 2, 6 tests)`

## REQ Coverage

`API-02` · `QA-01` · `QA-02` · `QA-04` · `QA-05` · `QA-09` · `QA-12` · `QA-14`

## Unblocks

- Plan 06 BYOD uses markos_custom_domains table (stub) and extends with Vercel Domains API columns
- Plan 07 members/lifecycle uses middleware-set x-markos-tenant-id header for handler authentication
- Plan 08 wires edge-config cache over resolveTenantBySlug + registers session-refresh cron

## Known Follow-ups (201-05.1)

- Geo enrichment on sessions list (location field always null today)
- Device-label auto-derivation from user-agent (uses ua-parser-js)
- Edge-config cache over resolveTenantBySlug (covered by Plan 08 slug-cache task)

## Self-Check: PASSED (25/25 tests, 2 atomic commits, 18 files shipped, session.ts extended cleanly)
