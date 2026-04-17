---
phase: 201-saas-tenancy-hardening
plan: "07"
status: complete
tasks_completed: 4
tasks_total: 4
---

# Plan 201-07 SUMMARY — Members + Invites + Lifecycle + GDPR + Switcher

## Objective
Ship Surfaces 4 (members) + 5 (tenant switcher) + 6 (offboarding) + the invite-acceptance landing.
All four of Plan 201-07's tasks shipped. Phase 201 Wave 2 complete.

## Tasks Shipped

### Task 1 — migration 87 + invite/lifecycle/switcher libs (commit `4abda28`, 18 tests)
- `supabase/migrations/87_markos_invites_lifecycle.sql` + rollback — creates `markos_invites`,
  `markos_tenant_offboarding_runs`, `markos_gdpr_exports` with RLS.
- `lib/markos/tenant/invites.{cjs,ts}` — createInvite, acceptInvite, withdrawInvite, resendInvite,
  listPendingInvites, TENANT_ROLES (7-role enum), 7-day expiry.
- `lib/markos/tenant/lifecycle.{cjs,ts}` — initiateOffboarding, cancelOffboarding, runPurgeJob,
  isTenantOffboarding, 30-day grace window.
- `lib/markos/tenant/switcher.{cjs,ts}` — listTenantsForUser, createTenantInOrg (reserved-slug
  check from Plan 01).

### Task 2 — GDPR export bundle (commit `c207a06`, 3 tests)
- `lib/markos/tenant/gdpr-export.{cjs,ts}` — BUNDLE_DOMAINS (10 frozen), SIGNED_URL_TTL_SECONDS
  (604_800 = 7 days), generateExportBundle with streaming archiver + PassThrough (Pitfall-7),
  S3/R2 upload + signed URL via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`.
- Deps added in commit `9b5e70d`: archiver, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner.

### Task 3a — HTTP surface + F-contracts (commit `a173bf9`, 16 tests)
- 10 handlers under `api/tenant/{members,invites,lifecycle,switcher}/*.js`; each:
  method-gated, header-authed, maps library error codes to exact HTTP status codes.
- `members/list` returns `{ members, seat_usage: { used, quota } }`.
- `members/remove` emits `member.removed` audit row via `enqueueAuditStaging`.
- `invites/create` maps `seat_quota_reached` + `invalid_tenant_role` → 400.
- `invites/accept` maps six reason codes (`invite_not_found`, `invite_already_accepted`,
  `invite_withdrawn`, `invite_expired`, `invite_email_mismatch`, `seat_quota_reached`) → 400.
- `lifecycle/offboard` + `cancel-offboard` map `forbidden` → 403, `already_offboarding` /
  `not_offboarding` → 409.
- `lifecycle/purge-cron` gated by `MARKOS_PURGE_CRON_SECRET`, returns 207 on partial success.
- `switcher/list` + `create-tenant` map `slug_reserved` / `slug_taken` → 400, `forbidden` → 403.
- Contracts: F-85 (members+invites), F-86 (lifecycle+purge-cron), F-87 (switcher+create-tenant).
- Shape tests appended to `invites.test.js` + `lifecycle.test.js` locking F-85/F-86 endpoint
  coverage.

### Task 3b — UI surfaces + invite landing (this commit, 27 tests total)
- `app/(markos)/settings/members/page.tsx` (Surface 4) — seat-usage bar ("{used} of {quota} seats
  used"), members table with avatar + remove, invite form (email + role dropdown), disabled state
  at quota with explicit "Seat limit reached" copy, `aria-labelledby` sections, `<table><caption>`.
- `app/(markos)/settings/danger/page.tsx` (Surface 6) — Step 1 outline destructive "Delete
  workspace" button, Step 2 `<dialog>` modal with "Type the workspace slug" input + "Start
  deletion" filled destructive, Step 3 amber grace banner with countdown + "Cancel deletion" link.
- `app/(markos)/invite/[token]/page.tsx` — "Accept invite" CTA POSTing to
  `/api/tenant/invites/accept`; six `reasonCopy()` branches surface expiry / email-mismatch /
  withdrawn / already-accepted / not-found / seat-limit errors in `aria-live="polite"` region.
- `components/markos/tenant/TenantSwitcher.tsx` (Surface 5) — `<details>/<summary>` pill + org+tenant
  dropdown, "Create new workspace" option, inline create form with slug pattern validation,
  `aria-labelledby` heading and `role="menu"`.
- 4 `.module.css` files: 28px card radius, #0d9488 focus rings, Sora 28px headings, 44px min tap
  target on every interactive element.
- Shape tests appended to `invites.test.js`, `lifecycle.test.js`, `switcher.test.js` verifying
  Surface 4/5/6 + invite-landing copy + focal WCAG hooks.

## key-files
### created
- `supabase/migrations/87_markos_invites_lifecycle.sql` + rollback
- `lib/markos/tenant/invites.{cjs,ts}`
- `lib/markos/tenant/lifecycle.{cjs,ts}`
- `lib/markos/tenant/gdpr-export.{cjs,ts}`
- `lib/markos/tenant/switcher.{cjs,ts}`
- `api/tenant/members/{list,remove}.js`
- `api/tenant/invites/{create,accept,withdraw}.js`
- `api/tenant/lifecycle/{offboard,cancel-offboard,purge-cron}.js`
- `api/tenant/switcher/{list,create-tenant}.js`
- `app/(markos)/settings/members/page.{tsx,module.css}`
- `app/(markos)/settings/danger/page.{tsx,module.css}`
- `app/(markos)/invite/[token]/page.{tsx,module.css}`
- `components/markos/tenant/TenantSwitcher.{tsx,module.css}`
- `contracts/F-85-members-invites-v1.yaml`
- `contracts/F-86-tenant-lifecycle-v1.yaml`
- `contracts/F-87-tenant-switcher-v1.yaml`
- `test/tenancy/invites.test.js`
- `test/tenancy/lifecycle.test.js`
- `test/tenancy/gdpr-export.test.js`
- `test/tenancy/switcher.test.js`

### commits
- `4abda28` — Task 1 (migration + 3 libs + 18 tests)
- `c207a06` — Task 2 (gdpr-export + 3 tests)
- `9b5e70d` — deps (archiver + aws-sdk)
- `a173bf9` — Task 3a (10 handlers + 3 F-contracts + 16 tests)
- (this commit) — Task 3b (4 UI surfaces + 4 shape tests, 27 tests total)

## Verification
- `node --test test/tenancy/invites.test.js test/tenancy/lifecycle.test.js test/tenancy/gdpr-export.test.js test/tenancy/switcher.test.js` → 27 tests, 0 fail.
- Regression: `node --test test/tenancy/reserved-slugs.test.js test/tenancy/org-model.test.js` → 21 tests, 0 fail.
- Acceptance greps: seat usage, delete-workspace + Type-the-workspace-slug, accept-invite,
  aria-labelledby/<dialog>/<details>, #0d9488 focus ring — all pass.

## Self-Check: PASSED
All 4 tasks landed; 27 tests green; surface copy + focal WCAG hooks + focus rings verified;
Plan 01 regression green. Phase 201 Wave 2 closed; Wave 3 (Plan 201-08 consolidation) remains.
