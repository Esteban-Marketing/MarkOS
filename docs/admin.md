# Operator Settings

MarkOS ships four operator surfaces under `/settings/` inside every tenant. Each page is
gated by middleware-attached `x-markos-tenant-id` + the caller's membership role.

## Members — `/settings/members`

Tenant-scoped page listing members, roles, seat usage, and pending invites.

- **Seat usage** — pooled across all tenants in an org. Backed by
  `count_org_active_members(org_id)` SQL function (Plan 01). Bar renders
  "{used} of {quota} seats used"; copy flips to "Seat limit reached ({N} seats)" when full.
- **Invite** — 7-day token delivered via magic-link. Invitee auto-added to the org at
  `readonly` level if not already a member (D-08). Invite landing at `/invite/[token]`.
- **Remove member** — deletes the tenant-level membership; org membership survives if the
  user is still in other tenants.
- **Role enum** — `owner`, `tenant-admin`, `editor`, `reviewer`, `agent-operator`,
  `billing-admin`, `readonly` (7 TENANT_ROLES).

Seat-quota errors bubble to the UI: "Seat limit reached ({N} seats)." Invite-accept maps
six reason codes (`invite_not_found`, `invite_already_accepted`, `invite_withdrawn`,
`invite_expired`, `invite_email_mismatch`, `seat_quota_reached`) into accessible copy
via `reasonCopy()`.

## Custom domain — `/settings/domain`

Single consolidated surface for:

1. Adding a BYOD custom domain (1 per org — see [routing](./routing.md))
2. Polling CNAME + SSL verification status
3. Removing the domain (soft-delete; slot frees)
4. Toggling vanity login on the custom domain
5. Editing tenant brand chrome (logo, primary_color, display_name)

Vercel Domains API wiring lives in `lib/markos/tenant/vercel-domains-client.cjs`.

## Sessions — `/settings/sessions`

Per-device session list with revoke. 30-day rolling session default (D-04).
Current session labelled "(this device)"; revoke-all-others available when >1 session.

Backed by `markos_sessions_devices` migration 85 + `api/tenant/sessions/{list,revoke}.js`
handlers (F-82 contract).

## Danger zone — `/settings/danger`

Three-step offboarding:

- **Step 1** — outline destructive button "Delete workspace".
- **Step 2** — `<dialog>` modal with slug-confirmation input ("Type the workspace slug");
  "Start deletion" flips status to `offboarding`.
- **Step 3** — persistent amber banner with N-day countdown + "Cancel deletion" link
  (valid for the full 30 days).

On day 30, the daily purge cron runs: GDPR export bundle generated, status flipped to
`purged`, signed URL valid for 7 days. See [tenancy-lifecycle](./tenancy-lifecycle.md).

## Tenant switcher

Component `components/markos/tenant/TenantSwitcher.tsx` — `<details>/<summary>` pill with
org+tenant dropdown, "Create new workspace" inline form with slug-pattern validation,
`aria-labelledby` heading + `role="menu"`.

## Audit log — `/api/tenant/audit/list`

Read-only query surface (F-88). Tenant-admin + owner only. Returns
`{ entries, has_more }` with `prev_hash` + `row_hash` fields so callers can replay the
chain via `lib/markos/audit/chain-checker.cjs`. Filter params: `source_domain`, `action`,
`from`, `to`, `limit` (max 500).
