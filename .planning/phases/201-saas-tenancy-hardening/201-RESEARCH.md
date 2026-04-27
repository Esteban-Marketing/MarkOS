# Phase 201 Research — SaaS Tenancy Hardening

**Date:** 2026-04-27
**Mode:** ecosystem + reconciliation
**Confidence legend:** 🟢 high · 🟡 medium · 🔴 low

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Signup + verification**
- D-01: Primary auth = magic-link; passkey opt-in prompted on second successful login. No password column in schema.
- D-02: Verification = double opt-in email only. No SMS second factor in this phase.
- D-03: BotID gate fires pre-submit on the signup form. Token required before POST hits the API.
- D-04: 30-day rolling session, multi-device allowed. Sessions revocable via `/settings/sessions`.

**Org model**
- D-05: New `markos_orgs` table. `markos_tenants` gets a non-nullable `org_id` FK.
- D-06: Default 1 org → 1 tenant on signup. Additional tenants creatable via settings UI.
- D-07: Billing + seat quota at the org level, pooled across all tenants under that org.
- D-08: Invites target a specific tenant + role. Invitee auto-added at `readonly` org level on acceptance. New `markos_org_memberships` holds org-level roles + billing admins.

**Subdomain routing**
- D-09: Wildcard DNS `*.markos.dev` + Vercel Routing Middleware (first middleware file in repo). Middleware extracts subdomain, resolves slug → tenant_id.
- D-10: Bare `markos.dev` = marketing + `/app`. Unclaimed subdomains return 404 with "Claim this workspace" CTA. No path-based `/t/<slug>` fallback.
- D-11: Reserved-slug blocklist (system names, profanity, trademark list including `claude`, `openai`, `anthropic`). Lives in `lib/markos/tenant/reserved-slugs.cjs`.
- D-12: BYOD full surface: CNAME + auto-SSL via Vercel Domains API + vanity login + tenant-branded chrome.
- D-13: BYOD quota: 1 custom domain per org for phase 201.

**Tenant lifecycle + GDPR**
- D-14: 30-day soft-delete → hard-purge, owner/org-owner only. Day 0 flips status to `offboarding` (read-only). Day 30 runs hard-purge + delivers export.
- D-15: GDPR Art. 20 export = signed S3/R2 zip bundle, per-domain JSON files. Signed URL expires 7 days. Reuses `lib/markos/governance/evidence-pack.*` pattern.

**Audit log**
- D-16: Single `markos_audit_log`, append-only, CDC-fed via worker. Columns: id, tenant_id, org_id, source_domain, action, actor_id, actor_role, payload jsonb, prev_hash, row_hash, occurred_at.
- D-17: Hash-chain per tenant. Every row hashes `prev_hash || canonical(payload)`. External WORM notarization deferred to phase 206.

### Claude's Discretion
- Seat management UI location: `/settings/members` vs `/admin/seats` vs both.
- Audit-log retention window: leave indefinite; phase 206 will pin exact policy.
- Signup rate-limit thresholds: pick sensible defaults (e.g. 5 signups/hour/IP, 1 email verification per minute per inbox).

### Deferred Ideas (OUT OF SCOPE)
- SCIM / SAML auto-provision → post-201 enterprise phase
- Agency white-label (N custom domains per org) → phase 221
- Multi-region data residency → phases 222 + 232
- Audit-log notarization to external WORM store → phase 206 SOC 2 Type I
- Second-factor hardening (FIDO2, TOTP, SMS fallback) → dedicated security phase
- Seat-quota grace period → let phase 205 billing decide
</user_constraints>

---

## Summary

Phase 201 builds on Supabase Auth's built-in magic-link + OTP system (no external auth library needed), adds passkey registration via `@simplewebauthn/server` + `@simplewebauthn/browser` v13.3.0, and layers a Vercel Next.js `middleware.ts` at the repo root for subdomain resolution + BYOD domain routing. The org model is a two-table schema extension to the existing migration-51 tenant foundation, with RLS policies cloned from the established `markos_tenant_memberships` pattern. The GDPR export reuses the `evidence-pack` builder pattern and `@aws-sdk/s3-request-presigner` for 7-day signed URLs. The audit log adds `prev_hash` + `row_hash` columns to the existing `markos_audit_log` table, fed by a Supabase `postgres_changes` CDC listener in a Vercel background function.

**Primary recommendation:** Build on what is already deployed (Supabase Auth, existing RLS pattern, `evidence-pack.*`, `webhooks/signing.cjs` HMAC) rather than introducing new auth or queue infrastructure.

**Reconciliation addendum (2026-04-27):** Phase 201 should remain closed as a hardening-phase PASS. The 2026-04-17 verification artifact already proves the delivered code, contracts, migrations, docs, and 206 new tests. The unresolved live-platform checks (real DNS propagation, mail delivery, BotID attestation, hardware passkeys, S3/R2 export retrieval, cookie behavior across subdomains, and long-horizon purge timing) are better classified as operational smoke checks for staging or launch confidence than as execution blockers inside this historical phase closeout.

---

## Standard Stack

### Area 1 — Public Signup + Magic-Link + Passkey

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@supabase/supabase-js` | 2.103.3 | Magic-link send + OTP verify + session management | Already in repo; Supabase Auth handles double opt-in natively via `signInWithOtp({shouldCreateUser: false})` after email confirmation gate |
| `@supabase/ssr` | 0.10.2 | Cookie-based session in Next.js App Router (server components + route handlers) | Official Supabase SSR adapter; already in repo |
| `@simplewebauthn/server` | 13.3.0 | WebAuthn/passkey registration + authentication ceremonies server-side | Most-used WebAuthn server library; Node ≥ 20 required [VERIFIED: npm registry, modified 2026-03-10] |
| `@simplewebauthn/browser` | 13.3.0 | WebAuthn browser-side ceremony execution | Companion to server package; same version pair required |
| `jose` | 6.2.2 | Signed session-device tokens for the multi-device revoke list | Already in broader ecosystem; edge-compatible [VERIFIED: npm registry] |

**Do NOT use:** NextAuth / Auth.js — adds a competing session model on top of Supabase Auth which creates dual-token drift [ASSUMED, but consistent with Supabase's own guidance to use `@supabase/ssr` directly for App Router].

**Installation (new packages only):**
```bash
npm install @simplewebauthn/server @simplewebauthn/browser
```

### Area 2 — Org Model

No new npm packages. Schema extension only using existing Supabase primitives.

### Area 3 — Subdomain Routing + BYOD

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `next` | 16.2.4 | `middleware.ts` at repo root | App Router middleware runs on every request before cache [VERIFIED: npm registry] |
| `@vercel/functions` | 3.4.3 | `geolocation()`, `ipAddress()` helpers in middleware | Replaces deprecated `@vercel/edge`; provides `./middleware` export [VERIFIED: npm registry, `@vercel/edge` is deprecated per registry description] |
| `@supabase/ssr` | 0.10.2 | Read session cookie in middleware to propagate tenant context | Same package as auth; edge-compatible cookie adapter |

**Vercel Domains API:** REST API at `https://api.vercel.com/v10/projects/{id}/domains`. No npm client — use `fetch()` with `Authorization: Bearer $VERCEL_TOKEN`. [ASSUMED — API path based on training knowledge; researcher cannot verify current endpoint without WebFetch access]

### Area 4 — Tenant Lifecycle + GDPR Export

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `archiver` | 7.0.1 | Stream-write zip bundle for GDPR export | Streaming avoids loading all tenant data in memory; supports `directory` + custom entries [VERIFIED: npm registry] |
| `@aws-sdk/client-s3` | 3.1031.0 | Upload zip to R2 / S3 | Cloudflare R2 is S3-compatible; same client works |
| `@aws-sdk/s3-request-presigner` | 3.1031.0 | Generate signed GET URL (7-day TTL) | Standard AWS SDK presigner; works with R2 endpoint override [VERIFIED: npm registry] |

### Area 5 — Audit Log

No new npm packages. Uses:
- Native `node:crypto` — `createHash` for SHA-256 hash chain
- Supabase Realtime `postgres_changes` — CDC-style listener (already bundled in `@supabase/supabase-js`)
- Existing `lib/markos/webhooks/signing.cjs` HMAC pattern for canonical payload signing

---

## Architecture Patterns

### Area 1: Magic-Link + Passkey Signup Flow

**Pattern: two-phase signup with unverified-user buffer table**

Phase 1 (pre-verification):
1. BotID token issued client-side before form submit (Vercel BotID script on the page).
2. `POST /api/auth/signup` verifies BotID token server-side, rate-checks IP (5/hour), inserts row into `markos_unverified_signups` (email, botid_token, created_at). Does NOT create Supabase Auth user yet.
3. `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })` sends the magic-link.

Phase 2 (verification callback):
4. User clicks link → `/api/auth/callback?token_hash=...&type=magiclink`
5. `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` confirms. On success: promote row from `markos_unverified_signups` → create `markos_orgs` + `markos_tenants` + memberships.
6. Redirect to `/onboarding` for org name + slug selection.

**Why this pattern (not direct signInWithOtp):** The unverified-signup buffer prevents bot-created partial org rows in the main tables. Bots that bypass BotID (unlikely) still cannot trigger org creation until they click the email link.

**Pattern: passkey opt-in after second successful login**

- On second successful magic-link login, surface a `<PasskeyPrompt>` client component (dismissible, deferred).
- Prompt calls `POST /api/auth/passkey/register-options` → server calls `generateRegistrationOptions()` from `@simplewebauthn/server` and stores the challenge in a short-TTL table or Supabase session.
- Browser calls `startRegistration()` from `@simplewebauthn/browser`.
- `POST /api/auth/passkey/register-verify` → server calls `verifyRegistrationResponse()`, stores authenticator credential in `markos_passkey_credentials` (per user, per device).
- Future logins: magic-link remains primary. Passkey option surfaced as a "log in faster" alternative.

**Pattern: 30-day rolling session + multi-device revoke**

Supabase Auth natively supports rolling refresh tokens. For multi-device revoke, maintain a `markos_session_devices` table (`session_id`, `user_id`, `device_fingerprint`, `last_seen_at`, `revoked_at`). The `/settings/sessions` page lists active sessions; revoking calls `supabase.auth.admin.signOut(userId, 'others')` from a service-role handler (or per-session by calling the Supabase Admin API with the specific refresh token).

### Area 2: Org ↔ Tenant Model

**Pattern: two-level membership hierarchy**

```
markos_orgs (id, slug, name, plan_id, seat_quota, created_at, status)
  └── markos_org_memberships (org_id, user_id, org_role, created_at)
        org_role: 'owner' | 'billing-admin' | 'member' | 'readonly'
markos_tenants (id, org_id NOT NULL, slug, name, status, created_at)
  └── markos_tenant_memberships (tenant_id, user_id, iam_role, created_at)
        iam_role: existing roles from migration 51
```

**Seat quota pattern:** `seat_quota` lives on `markos_orgs`. A DB function `count_org_active_members(org_id)` sums distinct user_ids across all `markos_tenant_memberships` rows under that org. Checked in the invite acceptance handler before inserting. This is a read-not-subscribe pattern — no realtime seat counter needed.

**Invite flow:**
1. Org admin creates invite: `markos_invites` table (`token text PK`, `org_id`, `tenant_id`, `tenant_role`, `email`, `expires_at`, `accepted_at`).
2. Token = 32-byte `crypto.randomBytes(32).toString('hex')`.
3. Invite link: `https://<tenant>.markos.dev/invite/<token>`.
4. On acceptance: check seat quota, insert into `markos_org_memberships` (if not already member), insert into `markos_tenant_memberships` at specified role. Mark `accepted_at`.

**RLS for org tables:** Clone the `markos_tenant_memberships`-backed policy pattern from migration 51. `markos_orgs` readable if `exists(select 1 from markos_org_memberships where org_id = ... and user_id = auth.jwt()->>'sub')`.

### Area 3: Subdomain Routing + BYOD

**Pattern: repo-root middleware.ts with three resolution layers**

```
middleware.ts (repo root)
├── Layer 1: Determine domain type
│   ├── Host = "markos.dev" or "www.markos.dev" → marketing/app routing, skip
│   ├── Host matches /^[a-z0-9-]+\.markos\.dev$/ → first-party subdomain
│   └── Host is anything else → BYOD custom domain
├── Layer 2: Slug → tenant_id resolution
│   ├── First-party: extract subdomain slug → lookup markos_tenants.slug
│   └── BYOD: lookup markos_custom_domains.domain → tenant_id
└── Layer 3: Attach tenant context
    ├── Set x-markos-tenant-id request header
    ├── Set x-markos-tenant-slug request header
    └── Rewrite to /app (preserving path)
```

**Tenant resolution cache:** The middleware runs on every request — a Supabase query per request is too slow. Use `@vercel/kv` or `@vercel/edge-config` (read-through, write-behind) to cache `slug → tenant_id` with a 60-second TTL. Cache invalidated on slug change. [ASSUMED for @vercel/edge-config as the preferred edge-safe store; verified that @vercel/edge-config 1.4.3 exists in registry]

**Reserved slug enforcement:** `lib/markos/tenant/reserved-slugs.cjs` exports `isReservedSlug(slug: string): boolean`. Called at slug-selection time (onboarding + settings). The blocklist must include: `www`, `api`, `app`, `admin`, `mcp`, `sdk`, `mail`, `status`, `docs`, `blog`, `help`, `support`, `security`, `about`, `pricing`, `integrations`, `claude`, `openai`, `anthropic` + profanity list.

**BYOD custom domain flow:**
1. Org admin submits domain via `POST /api/settings/custom-domain`.
2. API calls Vercel Domains API: `POST https://api.vercel.com/v10/projects/:id/domains` with `{ name: domain }`. Vercel issues CNAME record for the org to configure. [ASSUMED — API path based on training knowledge]
3. Store in `markos_custom_domains` (`domain`, `org_id`, `verified_at`, `ssl_issued_at`, `status`).
4. Verification webhook from Vercel → `POST /api/webhooks/vercel-domain` → updates `verified_at`, `ssl_issued_at`.
5. Middleware Layer 1 checks `markos_custom_domains` for BYOD resolution (via edge-config cache).

**Vanity login + tenant chrome:** The middleware sets `x-markos-tenant-id` header. The `/login` page (and app shell layout) reads this header via `headers()` in a Server Component to load the tenant's brand config (`markos_tenant_branding` table with `logo_url`, `primary_color`, `display_name`). The existing `lib/markos/theme/` module already parameterizes brand packs.

**Cookie scope on subdomains:** Session cookies from Supabase Auth use `Domain=.markos.dev` (leading dot) to work across `*.markos.dev`. For BYOD custom domains, cookies are scoped to that domain independently — no cross-domain cookie sharing. CSRF token must also be scoped per-origin.

### Area 4: Tenant Lifecycle + GDPR Export

**Pattern: status-machine soft-delete with partial index visibility**

`markos_tenants.status`: `'active' | 'suspended' | 'offboarding' | 'purged'`

RLS on all tenant-scoped tables adds a status guard:
```sql
-- Add to every existing read policy's USING clause:
AND (select status from markos_tenants where id = <table>.tenant_id) != 'offboarding'
AND (select status from markos_tenants where id = <table>.tenant_id) != 'purged'
```

This is a **partial policy addendum** — add a `markos_tenants_active_guard` function or use a separate restrictive policy rather than modifying every existing policy (to keep migration diffs minimal).

**Hard-purge job:** Scheduled Vercel Cron (`vercel.ts` cron config) runs daily. Selects tenants where `status = 'offboarding' AND offboarding_initiated_at < now() - interval '30 days'`. For each: trigger GDPR export if not already done, then `DELETE` cascade.

**GDPR export bundle shape (clone of `evidence-pack` pattern):**
```
<tenant-id>-export-<timestamp>.zip
├── manifest.json           { tenant_id, generated_at, files[] }
├── tenant.json             markos_tenants row
├── org.json                markos_orgs row
├── members.json            markos_tenant_memberships + markos_org_memberships
├── crm-contacts.json       crm_contacts for tenant
├── crm-deals.json          crm_deals for tenant
├── crm-activity.json       crm_activity_ledger for tenant
├── audit.json              markos_audit_log for tenant (last 90 days or all)
├── webhooks.json           markos_webhook_subscriptions for tenant
├── literacy.json           MIR, MSP, ICP, segments, campaigns
└── evidence-pack.json      governance_evidence_packs + deletion_workflow record
```

Signed URL via `@aws-sdk/s3-request-presigner`: `getSignedUrl(s3Client, new GetObjectCommand({...}), { expiresIn: 604800 })` (7 days = 604800 seconds).

### Area 5: Audit Log with Hash Chain

**Pattern: CDC → worker → append-only log with per-tenant hash chain**

**CDC setup:** Supabase `postgres_changes` subscription per source domain table. In a Vercel background function (long-running via Fluid Compute), subscribe to `INSERT` events on each operational table. Fan-in to the `markos_audit_log` writer.

**Row hash computation:**
```
row_hash = SHA-256(
  prev_hash_of_tenant_chain
  || canonical_json(action, actor_id, actor_role, tenant_id, occurred_at, payload)
)
```
`canonical_json` = `JSON.stringify(obj, Object.keys(obj).sort())` (deterministic key order, no whitespace).

**Prev_hash chain:** Each tenant has an independent chain. Query `SELECT row_hash FROM markos_audit_log WHERE tenant_id = $1 ORDER BY id DESC LIMIT 1` before each insert. For the first row in a tenant's chain, `prev_hash = SHA-256('genesis:' || tenant_id)`.

**Checker job:** A separate Vercel Cron (daily) replays the chain for each tenant and verifies `row_hash === SHA-256(prev_hash || canonical(payload))`. Writes a `markos_audit_chain_checks` table with pass/fail per tenant per run.

**Schema delta for `markos_audit_log` (migration 81 or 82):**
```sql
ALTER TABLE markos_audit_log
  ADD COLUMN IF NOT EXISTS org_id text,
  ADD COLUMN IF NOT EXISTS source_domain text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS actor_role text,
  ADD COLUMN IF NOT EXISTS prev_hash text,
  ADD COLUMN IF NOT EXISTS row_hash text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now();

-- Remove legacy columns once migrated:
-- actor, entity_type, entity_id, details → subsumed by action + actor_id + actor_role + payload
-- Keep for backward compat, deprecate at phase 206
```

---

## Don't Hand-Roll

| Problem | Do Not Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Magic-link email delivery + token lifecycle | Custom OTP tables + email sender | `supabase.auth.signInWithOtp()` | Supabase handles token hashing, expiry (default 1hr), deduplication, and rate-limiting natively |
| WebAuthn CBOR parsing + crypto ceremony | Custom passkey verification | `@simplewebauthn/server` v13 `verifyRegistrationResponse()` + `verifyAuthenticationResponse()` | CBOR encoding, COSE key parsing, attestation format variants, counter checking — all edge-case-heavy; getting any one wrong = silent security failure |
| Browser WebAuthn API calls | `navigator.credentials.create/get` wrappers | `@simplewebauthn/browser` v13 `startRegistration()` + `startAuthentication()` | Handles browser compatibility, error normalization, and the challenge buffer encoding |
| JWT signing/verification | Custom HMAC or RSA sign | `jose` v6 | Correct alg negotiation, key rotation, clock skew — OWASP ASVS V6 violation if hand-rolled |
| Zip archive streaming | Custom tar/zip writer | `archiver` v7 | Streaming avoids OOM on large tenants; handles compression levels, entry ordering, and checksum |
| S3 presigned URL | Custom HMAC-signed URL | `@aws-sdk/s3-request-presigner` | AWS SigV4 signing is date-specific and has 12+ required headers; incorrect implementation leaks credentials |
| Wildcard SSL for BYOD | Let's Encrypt client in app code | Vercel Domains API | Vercel manages ACME challenge, cert renewal, and CDN invalidation; any in-app cert manager adds cert storage + rotation complexity |
| Subdomain slug regex | Homebrew slug validator | `lib/markos/tenant/reserved-slugs.cjs` (new) + standard slug regex `^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$` | The reserved-list problem is a data problem, not a regex problem; regex handles format, blocklist handles semantics |
| SHA-256 hash chain | Custom hash utility | `node:crypto` `createHash('sha256')` | Built-in; no dependency needed |
| Canonical JSON for hash input | `JSON.stringify` with no config | `JSON.stringify(obj, Object.keys(obj).sort())` | Key-ordering non-determinism in vanilla `JSON.stringify` corrupts hash chain across Node versions |

---

## Common Pitfalls

### Pitfall 1: Supabase OTP triggers user creation before email confirmation
**What goes wrong:** `signInWithOtp({ shouldCreateUser: true })` creates a user in `auth.users` immediately, even before the link is clicked. If you rely on confirmation as the "real" creation gate, you may think the row doesn't exist.
**Why it happens:** Supabase creates the user record to attach the OTP token to.
**How to avoid:** Use the `markos_unverified_signups` buffer table as the application-layer gate. Do not create `markos_orgs` / `markos_tenants` until `verifyOtp` succeeds.
**Warning signs:** Org rows appearing for email addresses that never clicked their link.

### Pitfall 2: Wildcard cookie CSRF on `*.markos.dev`
**What goes wrong:** A session cookie scoped to `.markos.dev` is readable by any `*.markos.dev` subdomain, including tenant-controlled ones. A tenant's custom JS (if any user-generated scripts land) could read the parent-domain session cookie and forge cross-tenant requests.
**Why it happens:** `Domain=.markos.dev` is the standard wildcard cookie scope.
**How to avoid:** Ensure the `SameSite=Lax` (or `Strict`) attribute is set on all session cookies. `SameSite=Lax` blocks cross-origin POST requests from other subdomains. Additionally, all mutating endpoints must validate `Origin` header matches expected origin. For BYOD custom domains, the cookie domain is independent — no cross-origin concern.
**Warning signs:** Login on `app.markos.dev` is visible from `<tenant>.markos.dev` without a redirect.

### Pitfall 3: CDC-fed audit lag — orphaned hash chain
**What goes wrong:** The `postgres_changes` listener misses events during a Vercel function cold start or reconnect. Gap in the stream → prev_hash pointer references a row that was never written → chain breaks.
**Why it happens:** Supabase Realtime `postgres_changes` is not a durable queue; if the subscriber is disconnected, events are dropped.
**How to avoid:** Do not rely solely on `postgres_changes` for correctness. Add a database trigger (`AFTER INSERT`) on each source table that calls a `markos_audit_log_pending` staging table. The CDC worker drains from staging. This gives the worker an at-least-once delivery guarantee with a crash-safe recovery path.
**Warning signs:** Chain checker job reports breaks in tenants that were active during a deployment.

### Pitfall 4: Hash chain corruption under replication lag
**What goes wrong:** Two concurrent inserts for the same tenant both read the same `prev_hash` (last row) before either commits, producing two rows with identical `prev_hash` pointers — a fork in the chain.
**Why it happens:** The "SELECT last row_hash, then INSERT" is a read-then-write that is not atomic without serializable isolation.
**How to avoid:** Use a `SELECT ... FOR UPDATE` on the "get last hash" query, or use an advisory lock per `tenant_id` in the audit writer function. Alternatively, write the chain in a single SQL function that acquires a row-level lock: `INSERT INTO markos_audit_log SELECT ... FROM compute_row_hash($tenant_id, ...)`.
**Warning signs:** Chain checker reports two rows with the same `prev_hash` in the same tenant chain.

### Pitfall 5: Vercel Domains API CNAME verification race
**What goes wrong:** The domain is added to Vercel before the customer has updated their DNS. The middleware starts routing to this domain immediately, returning 500s until CNAME propagates.
**How to avoid:** The `markos_custom_domains.status` must gate middleware routing. Only route to a custom domain once `status = 'verified'`. Set `status = 'pending'` on creation; flip to `verified` only after the Vercel webhook confirms DNS + SSL.
**Warning signs:** Custom domain shows `verified_at IS NULL` but is being served traffic.

### Pitfall 6: `reserved-slugs.cjs` missing from middleware (edge runtime)
**What goes wrong:** The reserved-slug list is enforced only on the API layer but not at the slug-selection UI step. User can claim `app` or `api` via a race between client-side check and the write.
**Why it happens:** Reserved-slug check is easy to add in one place and forget the other.
**How to avoid:** The canonical `isReservedSlug()` function is in `lib/markos/tenant/reserved-slugs.cjs` (pure JS, no Node-only APIs). Import it in: (1) the signup API handler, (2) the slug-change settings handler, and (3) client-side form validation. Test with a dedicated test file `test/tenant/reserved-slugs.test.js`.

### Pitfall 7: GDPR zip OOM on large tenants
**What goes wrong:** Loading all CRM contacts for a large tenant into memory before streaming to zip causes Node.js OOM.
**How to avoid:** Use `archiver` with a streaming query approach: stream Supabase query results row-by-row through a `Transform` stream → append to archiver entry. Never collect a full `SELECT *` result in a JS array for a large table.
**Warning signs:** Export function hitting 1GB memory limit on Vercel Fluid Compute.

---

## Code Examples

### Signup: Double Opt-In with Unverified Buffer

```typescript
// api/auth/signup.ts (route handler)
// Source: supabase-js v2 signInWithOtp pattern + custom buffer
import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { email, botIdToken } = await req.json();

  // 1. Verify BotID token (Vercel BotID server-side verify)
  // ASSUMED: Vercel BotID server verification API
  const botOk = await verifyBotIdToken(botIdToken);
  if (!botOk) return Response.json({ error: 'bot_detected' }, { status: 403 });

  // 2. Rate-check IP
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimitOk = await checkSignupRateLimit(ip); // 5/hour/IP
  if (!rateLimitOk) return Response.json({ error: 'rate_limited' }, { status: 429 });

  // 3. Insert into unverified buffer (not markos_orgs yet)
  const supabase = createRouteHandlerClient({ cookies });
  const { error: bufferError } = await supabase
    .from('markos_unverified_signups')
    .upsert({ email, botid_token: botIdToken, created_at: new Date().toISOString() });
  if (bufferError) return Response.json({ error: 'db_error' }, { status: 500 });

  // 4. Send magic-link
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback` },
  });
  if (error) return Response.json({ error: error.message }, { status: 400 });

  return Response.json({ ok: true });
}
```

### Auth Callback: Promote Unverified → Org+Tenant

```typescript
// api/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'magiclink' | 'email';

  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase.auth.verifyOtp({ token_hash: token_hash!, type });
  if (error || !data.user) return Response.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=invalid_link`);

  // Promote: create org + tenant (if not already exists for this user)
  const existing = await supabase.from('markos_orgs').select('id').eq('owner_user_id', data.user.id).maybeSingle();
  if (!existing.data) {
    await provisionNewOrgAndTenant(supabase, data.user.id, data.user.email!);
  }

  return Response.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/onboarding`);
}
```

### Passkey Registration Options (Server)

```typescript
// api/auth/passkey/register-options/route.ts
import { generateRegistrationOptions } from '@simplewebauthn/server';

export async function POST(req: Request) {
  const session = await requireMarkosSession(); // existing helper

  const options = await generateRegistrationOptions({
    rpName: 'MarkOS',
    rpID: process.env.NEXT_PUBLIC_RP_ID!, // e.g. 'markos.dev'
    userName: session.userId,
    userID: new TextEncoder().encode(session.userId),
    attestationType: 'none',          // fastest; no attestation needed for passwordless
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
    },
    timeout: 60000,
  });

  // Store challenge in short-TTL store (Supabase or KV)
  await storePasskeyChallenge(session.userId, options.challenge, 120); // 2 min TTL

  return Response.json(options);
}
```

### Passkey Registration Verification (Server)

```typescript
// api/auth/passkey/register-verify/route.ts
import { verifyRegistrationResponse } from '@simplewebauthn/server';

export async function POST(req: Request) {
  const session = await requireMarkosSession();
  const body = await req.json();

  const challenge = await getPasskeyChallenge(session.userId);
  if (!challenge) return Response.json({ error: 'challenge_expired' }, { status: 400 });

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challenge,
    expectedOrigin: process.env.NEXT_PUBLIC_ORIGIN!, // https://app.markos.dev
    expectedRPID: process.env.NEXT_PUBLIC_RP_ID!,
  });

  if (!verification.verified) return Response.json({ error: 'verification_failed' }, { status: 400 });

  // Store credential
  await supabase.from('markos_passkey_credentials').insert({
    user_id: session.userId,
    credential_id: verification.registrationInfo!.credential.id,
    public_key: Buffer.from(verification.registrationInfo!.credential.publicKey).toString('base64'),
    counter: verification.registrationInfo!.credential.counter,
    device_type: verification.registrationInfo!.credentialDeviceType,
    backed_up: verification.registrationInfo!.credentialBackedUp,
  });

  return Response.json({ ok: true });
}
```

### Subdomain Middleware (Next.js App Router)

```typescript
// middleware.ts (repo root)
import { NextRequest, NextResponse } from 'next/server';
import { get as edgeConfigGet } from '@vercel/edge-config';

const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'app', 'admin', 'mcp', 'sdk', 'mail', 'status', 'docs']);
const MARKOS_APEX = process.env.NEXT_PUBLIC_APEX_DOMAIN ?? 'markos.dev';

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const url = req.nextUrl.clone();

  // Layer 1: First-party subdomain
  if (host.endsWith(`.${MARKOS_APEX}`)) {
    const subdomain = host.replace(`.${MARKOS_APEX}`, '');
    if (RESERVED_SUBDOMAINS.has(subdomain)) return NextResponse.next(); // handled by app routing

    // Layer 2: Slug → tenant_id (edge-config cache, 60s TTL)
    const tenantId = await edgeConfigGet<string>(`slug:${subdomain}`);
    if (!tenantId) {
      url.pathname = '/404-workspace';
      return NextResponse.rewrite(url);
    }

    const res = NextResponse.next();
    res.headers.set('x-markos-tenant-id', tenantId);
    res.headers.set('x-markos-tenant-slug', subdomain);
    return res;
  }

  // Layer 1: BYOD custom domain
  const tenantId = await edgeConfigGet<string>(`domain:${host}`);
  if (tenantId) {
    const res = NextResponse.next();
    res.headers.set('x-markos-tenant-id', tenantId);
    res.headers.set('x-markos-byod', '1');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Audit Log: Row Hash Writer

```typescript
// lib/markos/audit/writer.ts
import { createHash } from 'node:crypto';

type AuditEntry = {
  tenant_id: string;
  org_id: string;
  source_domain: string;
  action: string;
  actor_id: string;
  actor_role: string;
  payload: Record<string, unknown>;
  occurred_at: string;
};

function canonicalJson(obj: Record<string, unknown>): string {
  // Deterministic key order — required for stable hash across Node versions
  return JSON.stringify(obj, Object.keys(obj).sort());
}

export async function writeAuditRow(supabase: SupabaseClient, entry: AuditEntry): Promise<void> {
  // Serialised per tenant_id via advisory lock in calling context
  const { data: lastRow } = await supabase
    .from('markos_audit_log')
    .select('row_hash')
    .eq('tenant_id', entry.tenant_id)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  const prev_hash = lastRow?.row_hash
    ?? createHash('sha256').update(`genesis:${entry.tenant_id}`).digest('hex');

  const row_hash = createHash('sha256')
    .update(prev_hash + canonicalJson({
      action: entry.action,
      actor_id: entry.actor_id,
      actor_role: entry.actor_role,
      tenant_id: entry.tenant_id,
      occurred_at: entry.occurred_at,
      payload: entry.payload,
    }))
    .digest('hex');

  await supabase.from('markos_audit_log').insert({
    ...entry,
    prev_hash,
    row_hash,
  });
}
```

### GDPR Export: Signed URL Generation

```typescript
// lib/markos/tenant/gdpr-export.ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import archiver from 'archiver';
import { PassThrough } from 'node:stream';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!, // e.g. https://<account>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function generateGdprExportSignedUrl(
  bucket: string,
  key: string
): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 604800 } // 7 days
  );
}
```

### Migration Skeleton: Org + New Audit Log Columns

```sql
-- 81_markos_public_signup.sql (fragment)
CREATE TABLE IF NOT EXISTS markos_orgs (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  owner_user_id text NOT NULL,
  seat_quota integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'offboarding', 'purged')),
  offboarding_initiated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE markos_tenants
  ADD COLUMN IF NOT EXISTS org_id text NOT NULL REFERENCES markos_orgs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'offboarding', 'purged'));

CREATE TABLE IF NOT EXISTS markos_org_memberships (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES markos_orgs(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  org_role text NOT NULL DEFAULT 'member'
    CHECK (org_role IN ('owner', 'billing-admin', 'member', 'readonly')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Audit log: add new columns (migration 82)
ALTER TABLE markos_audit_log
  ADD COLUMN IF NOT EXISTS org_id text,
  ADD COLUMN IF NOT EXISTS source_domain text NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS actor_role text,
  ADD COLUMN IF NOT EXISTS prev_hash text,
  ADD COLUMN IF NOT EXISTS row_hash text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now();
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (v20+) |
| Config file | None — `package.json` `scripts.test` = `node --test test/**/*.test.js` |
| Quick run command | `node --test test/tenant-auth/*.test.js test/auth/*.test.js` |
| Full suite command | `node --test test/**/*.test.js` |

### Phase Requirements → Test Map

| ID | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| D-01/D-02 | Magic-link signup + double opt-in gate | integration | `node --test test/auth/magic-link.test.js` | No — Wave 0 |
| D-03 | BotID token gate blocks bot signups | unit | `node --test test/auth/botid-gate.test.js` | No — Wave 0 |
| D-04 | 30-day rolling session + multi-device revoke | unit | `node --test test/auth/session-lifecycle.test.js` | No — Wave 0 |
| D-01 passkey | Passkey registration + auth ceremonies | unit | `node --test test/auth/passkey.test.js` | No — Wave 0 |
| D-05/D-06 | org→tenant schema FK + RLS | integration | `node --test test/tenant/org-tenant-model.test.js` | No — Wave 0 |
| D-08 | Invite acceptance + seat quota check | integration | `node --test test/tenant/invite-flow.test.js` | No — Wave 0 |
| D-09/D-10 | Middleware slug→tenant_id resolution | unit | `node --test test/routing/subdomain-middleware.test.js` | No — Wave 0 |
| D-11 | Reserved-slug blocklist coverage | unit | `node --test test/tenant/reserved-slugs.test.js` | No — Wave 0 |
| D-12/D-13 | BYOD domain CNAME + vanity login routing | integration | `node --test test/routing/byod-domain.test.js` | No — Wave 0 |
| D-14 | Soft-delete status machine + RLS guard | integration | `node --test test/tenant/lifecycle.test.js` | No — Wave 0 |
| D-15 | GDPR export bundle shape + signed URL | unit | `node --test test/tenant/gdpr-export.test.js` | No — Wave 0 |
| D-16/D-17 | Audit log append-only + hash chain | unit | `node --test test/audit/hash-chain.test.js` | No — Wave 0 |
| QA-04 | 100% coverage: tenant isolation paths | integration | `node --test test/tenant-auth/*.test.js` | Partial (existing) |

### Wave 0 Gaps

- `test/auth/magic-link.test.js` — REQ D-01, D-02
- `test/auth/botid-gate.test.js` — REQ D-03
- `test/auth/session-lifecycle.test.js` — REQ D-04
- `test/auth/passkey.test.js` — REQ D-01 passkey
- `test/tenant/org-tenant-model.test.js` — REQ D-05, D-06
- `test/tenant/invite-flow.test.js` — REQ D-08
- `test/routing/subdomain-middleware.test.js` — REQ D-09, D-10
- `test/tenant/reserved-slugs.test.js` — REQ D-11
- `test/routing/byod-domain.test.js` — REQ D-12, D-13
- `test/tenant/lifecycle.test.js` — REQ D-14
- `test/tenant/gdpr-export.test.js` — REQ D-15
- `test/audit/hash-chain.test.js` — REQ D-16, D-17

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Supabase Auth magic-link + `@simplewebauthn/server` v13 for passkey |
| V3 Session Management | Yes | 30-day rolling Supabase session + `markos_session_devices` revoke table |
| V4 Access Control | Yes | RLS membership-backed policies (existing pattern, extension for orgs) |
| V5 Input Validation | Yes | Zod schemas on all new `api/` route handlers (existing convention) |
| V6 Cryptography | Yes | `node:crypto` SHA-256 for hash chain; `@aws-sdk/s3-request-presigner` SigV4 for signed URLs; NEVER hand-roll |
| V8 Data Protection | Yes | Soft-delete + hard-purge lifecycle; GDPR Art. 20 export bundle |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Slug squatting + phishing on `<brand>.markos.dev` | Spoofing | `reserved-slugs.cjs` blocklist; claimed slug not transferable without owner action |
| Bot-driven signup flood | Denial of Service | Vercel BotID pre-submit gate + 5/hour/IP rate limit on signup API |
| Cross-subdomain session theft | Spoofing | `SameSite=Lax` on session cookies; CSRF token per-origin validation |
| Hash chain tampering via DB direct access | Tampering | Append-only RLS policy (no UPDATE/DELETE on audit_log); checker job detects breaks |
| CNAME hijack on custom domain | Spoofing | Vercel owns SSL issuance; `status = verified` gate in middleware; domain uniqueness FK |
| GDPR export signed URL forwarding | Information Disclosure | 7-day TTL + URL not stored in logs; bundle encryption at rest (S3/R2 SSE-S3 default) |
| Concurrent audit writes forking hash chain | Tampering | Advisory lock per tenant_id in `writeAuditRow` |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vercel BotID server-side token verification API exists at the expected endpoint; integration pattern is pre-submit token + server verify | Standard Stack (Area 1), Code Examples | If API shape differs, signup gate needs re-implementation; fallback: reCAPTCHA v3 or Cloudflare Turnstile |
| A2 | Vercel Domains API for BYOD is at `https://api.vercel.com/v10/projects/:id/domains` | Architecture Patterns (Area 3) | URL path may be v9 or use different project ID resolution; verify against current Vercel docs before implementing |
| A3 | `@vercel/edge-config` is the recommended edge-safe key-value store for slug→tenant_id cache in middleware (vs @vercel/kv) | Standard Stack (Area 3) | @vercel/kv may be preferred for write-through patterns; both are valid choices; planner should confirm with Vercel docs |
| A4 | Supabase Realtime `postgres_changes` does not durably queue events across subscriber downtime (events dropped on disconnect) | Architecture Patterns (Area 5), Pitfalls | If Supabase has added durable queue semantics since training cutoff, the staging-table workaround may be unnecessary |
| A5 | NextAuth / Auth.js conflicts with Supabase Auth in App Router due to competing session models | Standard Stack (Area 1) | Low risk — CONTEXT.md already locked "not NextAuth"; confirmation not needed |
| A6 | Vercel Cron job (via `vercel.ts`) can run the 30-day purge job reliably on a daily schedule | Architecture Patterns (Area 4) | If Vercel Cron TTL limits or function timeout limits are hit for large tenants, a Vercel Queue job may be needed instead |

---

## Open Questions (RESOLVED)

1. **Vercel BotID integration specifics**
   - What we know: BotID is listed in the Quality Baseline (gate 12) and is a Vercel product. Pre-submit token issuance is the pattern.
   - What's unclear: Exact client-side script tag, server-side verification endpoint URL, and whether it integrates with the `@vercel/functions` package or is a separate REST call.
   - Recommendation: Planner should add a Wave 0 task to read current Vercel BotID docs before coding the signup API.
   - **RESOLVED:** Plan 03 uses the BotID REST `verify` endpoint called server-side in `lib/markos/auth/botid.cjs`; the signup form forwards the pre-submit token in the POST body and the API handler at `api/auth/signup.js` verifies server-side before any DB write. No client-side script beyond the standard form submit is required; fail-closed on verification error per `verifyBotIdToken(token, { skipInTest })`.

2. **Supabase CDC → markos_audit_log ingest architecture**
   - What we know: Supabase Realtime `postgres_changes` can subscribe to table inserts. The preferred pattern is a long-running Fluid Compute function.
   - What's unclear: Whether a Vercel background function is the right home for this subscriber, or whether a Supabase Edge Function + Postgres trigger is more reliable given the long-running requirement.
   - Recommendation: Consider a Postgres trigger that writes to a `markos_audit_staging` table (guaranteed at-least-once), drained by a Vercel Queue job. This removes the need for a persistent subscriber and is more consistent with the project's existing Vercel Queues posture from the Quality Baseline.
   - **RESOLVED:** Plan 02 adopts the staging-table pattern — `markos_audit_log_staging` is written synchronously via `enqueueAuditStaging(client, entry)` from every domain handler (Pitfall 3 mitigation — no dependency on `postgres_changes` for correctness). The Vercel cron at `api/audit/drain.js` (scheduled `*/1 * * * *` in `vercel.ts` per Plan 08) claims unclaimed rows via `SELECT ... FOR UPDATE SKIP LOCKED` and calls `append_markos_audit_row` per row. No persistent Supabase Realtime subscriber is needed.

3. **`@vercel/edge-config` write-through for slug cache**
   - What we know: Edge Config is read-optimized (sub-millisecond reads at the edge). Writes go through the Edge Config REST API.
   - What's unclear: Write latency on slug creation/change and whether the 60-second TTL stale window is acceptable for the use case.
   - Recommendation: Accept 60-second stale window as a known tradeoff; document it. If a slug change goes live instantly, a cache-bust call to the Edge Config API on slug save handles the critical path.
   - **RESOLVED:** Plan 08 Task 3 wires `@vercel/edge-config` slug→tenant cache (`lib/markos/tenant/slug-cache.{ts,cjs}` with `readSlugFromEdge`/`writeSlugToEdge`/`invalidateSlug`). Middleware (from Plan 05) tries edge-config first and falls back to Supabase on miss with backfill. Write-through on `markos_tenants` INSERT/UPDATE via hook in `lib/markos/orgs/tenants.cjs` (Plan 01). 60s stale window accepted; slug rename path calls `invalidateSlug` synchronously so the critical path is cache-busted. Contract locked in `test/tenancy/slug-cache.test.js`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥ 20 | `@simplewebauthn/server` engine requirement | ✓ | Verify with `node --version` at deploy | — |
| `@simplewebauthn/server` | Passkey ceremonies | Not in package.json | 13.3.0 (npm) | — |
| `@simplewebauthn/browser` | Passkey ceremonies | Not in package.json | 13.3.0 (npm) | — |
| `archiver` | GDPR zip export | Not in package.json | 7.0.1 (npm) | — |
| `@aws-sdk/client-s3` | GDPR export upload | Not in package.json | 3.1031.0 (npm) | — |
| `@aws-sdk/s3-request-presigner` | GDPR signed URL | Not in package.json | 3.1031.0 (npm) | — |
| `@vercel/edge-config` | Subdomain slug cache | Not in package.json | 1.4.3 (npm) | @vercel/kv 3.0.0 |
| Cloudflare R2 / S3 bucket | GDPR export storage | Not verified | — | Any S3-compatible store |
| Vercel BotID | Signup bot gate | Not verified | — | Cloudflare Turnstile |

**Missing dependencies requiring npm install:**
```bash
npm install @simplewebauthn/server @simplewebauthn/browser archiver @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @vercel/edge-config
```

**Missing infrastructure (planner must address):**
- Cloudflare R2 bucket (or AWS S3) + credentials for GDPR export
- Vercel BotID enabled on the Vercel project dashboard
- `@vercel/edge-config` store created in Vercel dashboard + `EDGE_CONFIG` env var set
- Wildcard DNS `*.markos.dev` CNAME or A record pointed to Vercel

---

## Sources

### Primary (HIGH confidence — verified against npm registry 2026-04-17)
- npm registry `@simplewebauthn/server@13.3.0` — version, Node ≥ 20 engine requirement, last modified 2026-03-10
- npm registry `@simplewebauthn/browser@13.3.0` — version confirmed
- npm registry `@supabase/ssr@0.10.2` — version, last modified 2026-04-09
- npm registry `@supabase/supabase-js@2.103.3` — version confirmed
- npm registry `@vercel/functions@3.4.3` — exports including `./middleware`, deprecation of `@vercel/edge`
- npm registry `archiver@7.0.1`, `@aws-sdk/client-s3@3.1031.0`, `@aws-sdk/s3-request-presigner@3.1031.0`
- npm registry `jose@6.2.2`, `next@16.2.4`, `zod@4.3.6`
- Codebase: `supabase/migrations/51_multi_tenant_foundation.sql` — existing tenant + RLS pattern
- Codebase: `supabase/migrations/37_markos_ui_control_plane.sql` — existing `markos_audit_log` shape
- Codebase: `lib/markos/governance/evidence-pack.ts` + `.cjs` — GDPR export pattern
- Codebase: `lib/markos/webhooks/signing.cjs` — HMAC pattern for signed payloads
- Codebase: `lib/markos/auth/session.ts` — existing session primitives

### Secondary (MEDIUM confidence — inference from npm metadata + codebase patterns)
- `@vercel/edge` marked deprecated in npm registry description (replaced by `@vercel/functions`) — confirmed HIGH
- `@vercel/edge-config@1.4.3` confirmed in registry; suitability for slug cache is ASSUMED
- Supabase Realtime `postgres_changes` drop-on-disconnect behavior — ASSUMED based on training knowledge, not verified in current Supabase docs

### Tertiary (LOW confidence — training knowledge, not verified)
- Vercel BotID integration pattern (pre-submit token + server verify)
- Vercel Domains API endpoint URL for BYOD
- Supabase OTP `shouldCreateUser` behavior pre- vs post-confirmation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry 2026-04-17
- Architecture patterns: HIGH for schema + RLS (codebase evidence), MEDIUM for CDC + middleware (training + codebase inference)
- Pitfalls: MEDIUM — pattern recognition from training; hash-chain concurrency pitfall verified by first-principles analysis
- BotID + Vercel Domains API: LOW — training knowledge only; requires doc verification in planning

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable ecosystem; npm versions shift slowly for these packages)
