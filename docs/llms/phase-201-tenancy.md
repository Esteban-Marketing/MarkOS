# Phase 201 — SaaS Tenancy Hardening

## Scope

Public signups with verification; org ↔ tenant model; custom subdomains via middleware;
BYOD custom domains with vanity login + tenant chrome; tenant offboarding + GDPR export;
unified append-only audit log with per-tenant hash chain; seat management;
`@vercel/edge-config` slug cache in front of the middleware resolver.

## Key decisions (17 locked)

- D-01 magic-link primary; passkey opt-in on second login; no password column
- D-02 double opt-in email
- D-03 BotID pre-submit + 5/hour/IP rate-limit
- D-04 30-day rolling session + per-device revoke
- D-05 markos_orgs + org_id FK on markos_tenants
- D-06 default 1 org → 1 tenant; additional tenants via settings
- D-07 seat quota at org level; pooled across tenants
- D-08 invites target tenant+role; invitee auto-added to org at readonly
- D-09 wildcard DNS + Vercel Routing Middleware
- D-10 bare + 404 claim-CTA; no path-based fallback
- D-11 reserved-slug blocklist (system + profanity + trademark + single-char)
- D-12 BYOD full surface (CNAME + auto-SSL + vanity login + tenant chrome)
- D-13 1 custom domain per org
- D-14 30-day soft-delete → hard-purge
- D-15 GDPR signed-URL S3/R2 zip bundle; 7-day TTL
- D-16 single markos_audit_log, CDC-fed via staging
- D-17 per-tenant SHA-256 hash chain

## Artifacts by plan

- **Plan 01** — org schema + reserved-slugs (migrations 81, `count_org_active_members`)
- **Plan 02** — audit-log hash chain + staging + drain (migration 82, `append_markos_audit_row`)
- **Plan 03** — signup + magic-link + BotID + /signup page (migration 83)
- **Plan 04** — passkey opt-in + @simplewebauthn + prompt card (migration 84)
- **Plan 05** — middleware + sessions + 404 + cookie scope (migration 85, `markos_sessions_devices`)
- **Plan 06** — BYOD custom domains + vanity login + branding (migration 86, Vercel Domains API)
- **Plan 07** — members + invites + offboarding + GDPR export + switcher (migration 87)
- **Plan 08** — openapi merge + docs + audit emitter wiring + crons + slug-cache + F-88

## Contracts

- F-80 public-signup
- F-81 passkey-webauthn
- F-82 tenant-sessions
- F-83 byod-custom-domain
- F-84 tenant-branding
- F-85 members-invites
- F-86 tenant-lifecycle
- F-87 tenant-switcher
- F-88 tenant-audit-query

## Migrations

- 81 `markos_orgs`
- 82 `markos_audit_log_hash_chain`
- 83 `markos_unverified_signups`
- 84 `markos_passkey_credentials`
- 85 `markos_sessions_devices`
- 86 `markos_custom_domains_ext`
- 87 `markos_invites_lifecycle`

All migrations have rollback scripts under `supabase/migrations/rollback/`.

## Slug cache contract (Plan 08)

- `readSlugFromEdge(slug)` — hot-path read; returns tenant_id string or null; never throws.
- `writeSlugToEdge(slug, tenant_id)` — fire-and-forget write-through from tenants.cjs.
- `invalidateSlug(slug)` — deletion op; called on slug rename + tenant purge.
- `SLUG_CACHE_TTL_SECONDS = 60` (accepted 60s stale window, RESEARCH Open Q #3 RESOLVED).
- `SLUG_CACHE_NAMESPACE = 'markos:slug:'`.
- Fail-closed: edge-config outage → Supabase fallback keeps middleware functional.

## See also

- [docs/routing.md](/docs/routing) — subdomain + BYOD mechanics
- [docs/admin.md](/docs/admin) — operator settings surfaces
- [docs/tenancy-lifecycle.md](/docs/tenancy-lifecycle) — offboarding timeline
- [docs/gdpr-export.md](/docs/gdpr-export) — bundle shape + signed URL
