# Tenant Lifecycle — D-14 30-day Soft-delete

MarkOS implements a 30-day soft-delete window for workspace offboarding. Owners may cancel
at any point in the window; on day 30 a daily cron triggers purge + GDPR bundle export.

## States

```
active → offboarding → purged
         ↓
       active (cancel within 30 days)
```

## Tables involved

- `markos_tenants.status` — one of `active` / `suspended` / `offboarding` / `purged`
  (Plan 01 migration 81).
- `markos_tenant_offboarding_runs` — one row per offboarding cycle, tracks `purge_due_at`,
  `purge_ran_at`, `cancelled_at`, `export_bundle_id` (Plan 07 migration 87).

## Timeline

| Day | Event | Side effects |
|-----|-------|--------------|
| 0 | Owner calls `/api/tenant/lifecycle/offboard` | status=offboarding; purge_due_at = now+30d; audit emits `tenant.offboarding_initiated` |
| 1-29 | Tenant is read-only — RLS update policies block mutations on tenant-scoped tables once status != active | UI shows amber banner with days_remaining |
| 1-29 | Owner may call `/api/tenant/lifecycle/cancel-offboard` | status=active; audit emits `tenant.offboarding_cancelled` |
| 30 | Daily cron `/api/tenant/lifecycle/purge-cron` runs | generateExportBundle; upload to R2/S3; status=purged; export_bundle_id recorded; signed URL valid 7 days |
| 30-37 | Owner downloads export | Audit log (source_domain=governance) records download (future enhancement) |
| 38 | Signed URL expires | Owner must request re-issue via support |

## Authorization

- Only `owner` or `tenant-admin` may initiate or cancel offboarding (enforced in
  `lib/markos/tenant/lifecycle.cjs` `assertOwnerOrAdmin`).
- Purge cron endpoint requires `X-Markos-Cron-Secret` header matching
  `MARKOS_PURGE_CRON_SECRET`.
- The Vercel cron schedule for the purge job is registered in `vercel.ts`
  (`0 3 * * *`, daily at 03:00 UTC).

## Handlers + contracts

| Surface | Handler | Contract |
|---------|---------|----------|
| Initiate offboarding | `api/tenant/lifecycle/offboard.js` | F-86 |
| Cancel offboarding | `api/tenant/lifecycle/cancel-offboard.js` | F-86 |
| Daily purge | `api/tenant/lifecycle/purge-cron.js` | F-86 (internal) |

`forbidden` → 403, `already_offboarding` / `not_offboarding` → 409,
`tenant_not_found` → 404 (standard error-code mapping from Plan 07).

## Audit surface

Every lifecycle event emits to `markos_audit_log` with `source_domain='tenancy'`:

- `tenant.offboarding_initiated`
- `tenant.offboarding_cancelled`
- `tenant.purged`

Hash chain (Plan 02 migration 82) ensures tampering is detectable. See
[docs/gdpr-export](./gdpr-export.md) for the export bundle shape that ships at purge time.

## UI surface

`app/(markos)/settings/danger/page.tsx` renders the three-step flow:

1. Step 1 outline destructive "Delete workspace" button
2. Step 2 `<dialog>` modal with "Type the workspace slug" input + "Start deletion" filled
   destructive button
3. Step 3 amber grace banner with countdown + "Cancel deletion" link

Focus rings #0d9488, 28px card radius, 44px min tap target — all focal WCAG hooks verified
in `test/tenancy/lifecycle.test.js`.
