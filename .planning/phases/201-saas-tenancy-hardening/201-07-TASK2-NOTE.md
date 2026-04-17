---
phase: 201-saas-tenancy-hardening
plan: "07"
status: in-progress
tasks_completed: 2
tasks_total: 4
---

# Plan 201-07 Progress Note (Task 1 + Task 2 shipped)

**Status:** Task 1 + Task 2 shipped. Task 3a + 3b remain. Do NOT rename to SUMMARY.md until all 4 tasks land.

## Shipped

### Task 1 — commit `4abda28` — 18 tests pass
- `supabase/migrations/87_markos_invites_lifecycle.sql` + rollback
- `lib/markos/tenant/invites.{cjs,ts}` — createInvite/acceptInvite/withdraw/resend/list + TENANT_ROLES + 7-day expiry
- `lib/markos/tenant/lifecycle.{cjs,ts}` — initiateOffboarding/cancelOffboarding/runPurgeJob/isTenantOffboarding + 30-day grace
- `lib/markos/tenant/switcher.{cjs,ts}` — listTenantsForUser/createTenantInOrg (uses isReservedSlug from Plan 01)
- 3 test suites (invites 8, lifecycle 6, switcher 4)

### Task 2 — commit `c207a06` — 3 tests pass
- `lib/markos/tenant/gdpr-export.{cjs,ts}` — BUNDLE_DOMAINS (10 frozen), SIGNED_URL_TTL_SECONDS (7d), generateExportBundle
- Streaming archiver + PassThrough → S3/R2 (Pitfall 7 compliant)
- Dep-injected for tests: streamArchiver, s3Client, getSignedUrl, PutObjectCommand, GetObjectCommand
- `test/tenancy/gdpr-export.test.js` (3 tests — bundle shape + TTL + manifest + 10 domain files + S3 put + row insert)

### Deps (commit `9b5e70d`)
- `archiver ^7.0.1`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` installed

## Remaining

### Task 3a — HTTP surface
- 10 handlers: `api/tenant/{members,invites,lifecycle,switcher}/*.js`
- 3 F-contracts: `F-85-members-invites-v1.yaml`, `F-86-tenant-lifecycle-v1.yaml`, `F-87-tenant-switcher-v1.yaml`
- Shape tests appended to invites.test.js + lifecycle.test.js
- Plan spec: lines 1563–1900ish in 201-07-PLAN.md

### Task 3b — UI surfaces
- Surface 4: `app/(markos)/settings/members/` (members + pending invites table, seat counter, invite form, remove confirm, offboard button)
- Surface 5: tenant switcher component (used in workspace shell — likely drop-in replacement)
- Surface 6: `app/(markos)/settings/offboarding/` (countdown, cancel, GDPR export download)
- Invite landing: `app/(markos)/invite/[token]/page.tsx` (accept flow, magic-link redirect)
- Plan spec: lines 1900+ in 201-07-PLAN.md

## Resume command

```
/gsd:execute-phase 201 --wave 2 --interactive
```

Orchestrator will detect this TASK2-NOTE.md means plan incomplete, resume with Task 3a.

After Task 3a + 3b both green + committed, rename this file → `201-07-SUMMARY.md` and update ROADMAP to 7/8.
