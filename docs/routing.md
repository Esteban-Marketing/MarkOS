# Subdomain + BYOD Routing

MarkOS resolves every request through `middleware.ts` at the repo root. The middleware
classifies the request host into five kinds and attaches request headers that downstream
handlers trust.

## Host kinds

| Kind | Example | Behaviour |
|------|---------|-----------|
| `bare` | `markos.dev` | Marketing + /app; no tenant context |
| `system` | `www.markos.dev`, `api.markos.dev` | Reserved for platform use; no tenant resolution |
| `reserved` | `claude.markos.dev` | Rewrites to /404-workspace?reserved=1 |
| `first_party` | `acme.markos.dev` | Resolves slug → tenant; sets x-markos-tenant-id |
| `byod` | `app.acme.com` | Resolves domain via markos_custom_domains (status=verified only) |

## Request headers set by middleware

- `x-markos-tenant-id` — canonical tenant identifier
- `x-markos-tenant-slug` — first-party subdomain slug (first_party only)
- `x-markos-org-id` — parent org id
- `x-markos-byod` — `'1'` for custom-domain, `'0'` for first-party
- `x-markos-custom-domain` — echoes host for BYOD traffic

Inbound `x-markos-*` headers are discarded by the middleware (fresh `Headers` instance
before the rewrite) to block spoofing (T-201-05-03 mitigation).

## Slug cache (Plan 08)

`middleware.ts` calls `readSlugFromEdge(slug)` before falling back to Supabase
`resolveTenantBySlug`. On hit, the cached tenant id is used directly. On miss, the Supabase
result backfills the cache via `writeSlugToEdge(slug, tenant_id)` (fire-and-forget).

- `SLUG_CACHE_TTL_SECONDS = 60` — accepted 60-second stale window per RESEARCH Open Q #3.
- `SLUG_CACHE_NAMESPACE = 'markos:slug:'` — edge-config key prefix.
- Fail-closed read: edge-config error → treat as miss → Supabase fallback (keeps middleware
  functional at pre-cache QPS). See T-201-08-08.

## Reserved-slug policy

The canonical reserved-slug blocklist lives in `lib/markos/tenant/reserved-slugs.cjs`. It covers:

- System names (www, api, app, admin, mcp, sdk, mail, status, docs, blog, help, support,
  security, about, pricing, integrations)
- Protected routes (signup, signin, login, logout, settings, billing, dashboard, invite,
  onboarding, auth, static)
- Trademark vendors (claude, openai, anthropic, supabase, vercel, stripe, hubspot, shopify,
  slack, google, meta, segment, resend, twilio, posthog, linear)
- All single-character slugs (a-z, 0-9)
- Profanity baseline

Reserved slugs return a "This address is reserved." 404 surface with a "Create a workspace" CTA.

## BYOD custom domain flow

1. Org owner POSTs `/api/settings/custom-domain/add` with `{ domain }`.
2. MarkOS calls Vercel Domains API `POST /v10/projects/:id/domains` — receives CNAME challenge.
3. Row inserted into `markos_custom_domains` with `status='pending'`.
4. Owner updates DNS; Vercel verifies + issues SSL.
5. Vercel webhook hits `/api/webhooks/vercel-domain` (HMAC-signed), flips status to `verified`.
6. Middleware begins routing traffic for that host.

## 1-domain-per-org quota

Enforced by a partial unique index (Plan 05 migration 85):

```sql
CREATE UNIQUE INDEX idx_markos_custom_domains_one_per_org
  ON markos_custom_domains (org_id)
  WHERE status IN ('pending', 'verifying', 'verified');
```

A removed domain (`status='failed'`, `removed_at` set) frees the slot. See D-13.

## Cookie scope

- First-party `acme.markos.dev` → cookie `Domain=.markos.dev` (shared across workspaces).
- BYOD `app.acme.com` → cookie `Domain` not set (host-only cookie; prevents cross-origin
  cookie theft — Pitfall 2 mitigation).
