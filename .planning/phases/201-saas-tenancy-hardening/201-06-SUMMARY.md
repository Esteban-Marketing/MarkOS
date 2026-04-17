---
phase: 201-saas-tenancy-hardening
plan: "06"
subsystem: byod-custom-domains
tags: [byod, vercel-domains, vanity-login, tenant-chrome, surface-3, surface-7, wave-2]
dependency_graph:
  requires: [201-01, 201-02, 201-05]
  provides:
    - supabase/migrations/86_markos_custom_domains_ext.sql
    - lib/markos/tenant/vercel-domains-client.cjs
    - lib/markos/tenant/domains.cjs
    - lib/markos/tenant/branding.cjs
    - api/settings/custom-domain/*
    - api/webhooks/vercel-domain.js
    - api/settings/tenant-branding.js
    - app/(markos)/settings/domain/page.tsx
    - app/(markos)/login/page.tsx
    - contracts/F-83-byod-custom-domain-v1.yaml
    - contracts/F-84-tenant-branding-v1.yaml
  affects: [201-08]
tech_stack:
  added: []
  patterns: [fail-closed-external-client, hmac-signed-webhook, partial-unique-index-quota, css-custom-property-theming]
key_files:
  created:
    - supabase/migrations/86_markos_custom_domains_ext.sql
    - supabase/migrations/rollback/86_markos_custom_domains_ext.down.sql
    - lib/markos/tenant/vercel-domains-client.ts
    - lib/markos/tenant/vercel-domains-client.cjs
    - lib/markos/tenant/domains.ts
    - lib/markos/tenant/domains.cjs
    - lib/markos/tenant/branding.ts
    - lib/markos/tenant/branding.cjs
    - api/settings/custom-domain/add.js
    - api/settings/custom-domain/remove.js
    - api/settings/custom-domain/status.js
    - api/webhooks/vercel-domain.js
    - api/settings/tenant-branding.js
    - app/(markos)/settings/domain/page.tsx
    - app/(markos)/settings/domain/page.module.css
    - app/(markos)/login/page.tsx
    - app/(markos)/login/page.module.css
    - contracts/F-83-byod-custom-domain-v1.yaml
    - contracts/F-84-tenant-branding-v1.yaml
    - test/tenancy/vercel-domains-client.test.js
    - test/tenancy/byod.test.js
    - test/tenancy/branding.test.js
  modified: []
decisions:
  - "Vercel Domains API wrapped behind vercel-domains-client.cjs — every import funnels through the wrapper. Fail-closed discriminated { ok, status, error } shape; never throws."
  - "D-13 1-per-org enforced at two layers: (1) partial unique index from Plan 05, (2) pre-flight SELECT in addCustomDomain. Pre-flight avoids wasted Vercel calls; index catches concurrent races."
  - "Soft-delete on removeCustomDomain (status='failed' + removed_at). Partial unique index WHERE status IN (pending, verifying, verified) lets a new domain be added after removal without hard-delete."
  - "Vercel verification webhook uses Plan 200-03 HMAC signing — same verifySignature + 300s replay window + timing-safe compare. VERCEL_DOMAIN_WEBHOOK_SECRET env separates this transport from markos outbound webhooks."
  - "Surface 7 vanity login reads middleware x-markos-byod + x-markos-tenant-id headers server-side; uses CSS custom property --accent so primary_color propagates without runtime JS. Falls back to MarkOS default when no branding configured or vanity_login_enabled=false."
  - "Tenant branding upsert requires owner/tenant-admin via RLS; #RRGGBB validation happens both in JS (upsertTenantBranding) and in DB CHECK constraint."
metrics:
  tasks_completed: 2
  tasks_total: 2
  files_created: 22
  tests_passing: 27
---

# Phase 201 Plan 06: BYOD Custom Domains + Vanity Login Summary

Shipped the full D-12 BYOD surface: CNAME + auto-SSL via Vercel Domains API +
vanity login page + tenant-branded chrome. Bounded by D-13 (1 custom domain per
org) via partial unique index + app-layer quota check. 27 tests pass.

## Tasks

| # | Task | Status | Tests |
|---|------|--------|-------|
| 1 | Migration 86 + vercel-domains-client + domains + branding + 3 suites | ✓ | 21/21 |
| 2 | 5 HTTP handlers + Surface 3 + Surface 7 + F-83 + F-84 + 6 new tests | ✓ | 6/6 |

## Verification

- `node --test test/tenancy/vercel-domains-client.test.js` → 8/8
- `node --test test/tenancy/byod.test.js` → 14/14 (8 Task 1 + 6 Task 2)
- `node --test test/tenancy/branding.test.js` → 5/5
- Regression: all Plan 01-05 suites still green

## Commits

- `feat(201-06): migration 86 + vercel-domains-client + domains + branding (Task 1, 21 tests)`
- `feat(201-06): BYOD handlers + Surface 3 + Surface 7 + F-83/F-84 (Task 2, 14 tests)`
- `docs(201-06): add TASK1-NOTE.md` (intermediate, superseded by this SUMMARY)

## REQ Coverage

`API-02` · `QA-01` · `QA-02` · `QA-04` · `QA-05` · `QA-09` · `QA-11` · `QA-12` · `QA-14`

## Unblocks

- Plan 201-08 audit-emitter wiring picks up custom_domain.added / custom_domain.removed / tenant_branding.updated actions
- Plan 201-08 OpenAPI regen picks up F-83 + F-84 (6 new paths)

## Known Follow-ups (201-06.1)

- `/list` endpoint for BYOD (current UI assumes single known domain via branding round-trip)
- Geo-located ssl_issued_at display on Surface 3
- Logo upload (currently expects pre-hosted logo_url string; file-upload flow is Phase 205-ish with Vercel Blob)

## Self-Check: PASSED (27/27 tests, 3 atomic commits, 22 files shipped, TASK1-NOTE retired)
