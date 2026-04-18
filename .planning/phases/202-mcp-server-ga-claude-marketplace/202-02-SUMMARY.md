---
phase: 202-mcp-server-ga-claude-marketplace
plan: 02
subsystem: oauth-pkce-consent
tags: [mcp, oauth, pkce, rfc-7636, rfc-8414, rfc-9728, rfc-7591, rfc-8707, rfc-7009, dcr, consent, upstash-redis, surface-s2, a11y, tenant-binding]

# Dependency graph
requires:
  - phase: 202-mcp-server-ga-claude-marketplace
    plan: 01
    provides: lib/markos/mcp/sessions.cjs (createSession + revokeSession + hashToken) + markos_mcp_sessions table + markos_tenants status cascade guard
  - phase: 202-mcp-server-ga-claude-marketplace
    plan: 03
    provides: "@upstash/redis@^1.37.0 dep in package.json (Redis.fromEnv for 60s auth-code storage)"
  - phase: 201-saas-tenancy-hardening
    plan: 07
    provides: lib/markos/tenant/switcher.cjs listTenantsForUser contract (filters purged tenants, projects iam_role + org_id)
  - phase: 201-saas-tenancy-hardening
    plan: 02
    provides: lib/markos/audit/writer.cjs enqueueAuditStaging + AUDIT_SOURCE_DOMAINS whitelist (mcp added by Plan 202-01 Rule 3 fix)
provides:
  - lib/markos/mcp/oauth.cjs (.ts dual-export) — AUTH_CODE_TTL_SECONDS=60 + isAllowedRedirect + issueAuthorizationCode (Redis SET NX EX60) + consumeAuthorizationCode (GETDEL one-time) + verifyPKCE (timingSafeEqual + RFC 7636 length gate) + generateDCRClient (mcp-cli-<hex32>)
  - api/.well-known/oauth-protected-resource.js (RFC 9728 RS metadata, Cache-Control max-age=3600)
  - api/.well-known/oauth-authorization-server.js (RFC 8414 AS metadata, S256-only per D-05, Cache-Control max-age=3600)
  - api/oauth/register.js (RFC 7591 DCR — 201 + Cache-Control no-store)
  - api/oauth/authorize.js (GET — 302 to /login or /oauth/consent with preserved query string)
  - api/oauth/authorize/approve.js (POST — listTenantsForUser membership guard + issueAuthorizationCode + 302 to redirect_uri?code=&state=)
  - api/oauth/token.js (POST — PKCE S256 exchange + RFC 8707 exact-match + createSession delegate → Bearer access_token with 86400s TTL, no refresh_token per D-06)
  - api/oauth/revoke.js (POST — RFC 7009 anti-probing always-200 for authenticated actor + revokeSession delegate)
  - contracts/F-89-mcp-oauth-v1.yaml (7 OAuth paths + full RFC reference)
  - app/(markos)/oauth/consent/page.tsx (Surface S2 — 'use client' consent screen, tenant picker, scope chips, What is MCP details)
  - app/(markos)/oauth/consent/page.module.css (UI-SPEC tokens: Sora 28px heading, 28px card radius, 12px button radius, #0d9488 accent, 44px tap targets, prefers-reduced-motion)
  - test/mcp/oauth.test.js (47 end-to-end + grep tests)
  - test/mcp/consent-ui-a11y.test.js (14 UI-SPEC grep-shape + a11y tests)
affects:
  - 202-04 (tool pipeline + per-call audit — bearer tokens now issued, lookupSession is the auth gate)
  - 202-05 (tenant-scoped tool dispatch — session.tenant_id is now populated at consent)
  - 202-06 (/settings/mcp UI — revokeSession is exposed through api/oauth/revoke + D-07 tenant binding visible in list)
  - 202-08 (Claude Marketplace submission — RFC 8414/9728/7591/7636/8707 surface now present, cert-eligible)

# Tech tracking
tech-stack:
  added: []  # Zero new deps — @upstash/redis was added by parallel Plan 202-03 (758f2a1) and is required only at handler-runtime (Redis.fromEnv). Tests use an in-memory mockRedis.
  patterns:
    - "PKCE S256-only enforcement at 3 gates (lib/markos/mcp/oauth.cjs, api/oauth/authorize.js, api/oauth/authorize/approve.js) — D-05 never admits 'plain'"
    - "Authorization-code one-time use via Redis GETDEL (falls back to GET+DEL when getdel not available in client)"
    - "Defense-in-depth timingSafeEqual over length-gated buffer compare in verifyPKCE; matches Phase 201 rate-limit + sessions.cjs convention"
    - "Dual-export library convention — oauth.ts re-exports oauth.cjs with typed named bindings + module.exports pass-through (matches Phase 201 tenant/invites + Plan 202-01 sessions)"
    - "Handler deps injection (getRedis/getSupabase with deps.redis/deps.supabase override) — keeps tests mock-driven without rewriting @upstash/redis import surface"
    - "D-07 tenant-bind-at-consent: listTenantsForUser resolves the user's org+tenant set, approve handler verifies target_tenant_id ∈ set AND tenant.status === 'active' before issuing the code"
    - "RFC 7009 anti-probing on /oauth/revoke — 401 only on anonymous actor; always 200 for authenticated actor regardless of token existence"
    - "RFC 8707 resource-indicator enforcement at /oauth/token — exact-match stored.resource against form.resource prevents cross-resource confusion"

key-files:
  created:
    - lib/markos/mcp/oauth.cjs
    - lib/markos/mcp/oauth.ts
    - api/.well-known/oauth-protected-resource.js
    - api/.well-known/oauth-authorization-server.js
    - api/oauth/register.js
    - api/oauth/authorize.js
    - api/oauth/authorize/approve.js
    - api/oauth/token.js
    - api/oauth/revoke.js
    - contracts/F-89-mcp-oauth-v1.yaml
    - app/(markos)/oauth/consent/page.tsx
    - app/(markos)/oauth/consent/page.module.css
    - test/mcp/oauth.test.js
    - test/mcp/consent-ui-a11y.test.js
  modified: []

key-decisions:
  - "S256-only enforced at 3 independent gates (lib helper, GET /oauth/authorize, POST /oauth/authorize/approve). 202-CONTEXT.md D-05 mandates PKCE S256; research pitfall 5 warned about downgrade attacks via plain. Triple-gate makes it impossible to accidentally issue a plain-bound code even if one layer regresses."
  - "No refresh tokens issued (D-06). expires_in: 86400 is advisory; the real TTL is rolling via sessions.touchSession (Plan 202-01). Eliminates refresh-token-leak attack surface entirely (T-202-02-07 accept disposition)."
  - "Handler deps injection for getRedis/getSupabase. Runtime calls Redis.fromEnv() + lib/markos/auth/session.ts getSupabase(), but tests pass deps.redis + deps.supabase directly. Avoids installing @upstash/redis at test time (not installed in repo yet — package.json declares it from Plan 202-03 but npm install has not run)."
  - "RFC 7009 anti-probing on /oauth/revoke: 401 for anonymous actor, 200 for authenticated actor regardless of whether token is known. Prevents timing/response-code probing to enumerate valid tokens (T-202-02-08 mitigate)."
  - "Consent page reads params client-side (URLSearchParams on window.location.search) instead of SSR injection. Rationale: the /oauth/authorize handler 302-forwards full query string to /oauth/consent, and the consent page re-validates every field server-side at approve time. This matches Phase 201 invite/[token]/page.tsx pattern and keeps page.tsx pure client-side (no server deps, no SSR props plumbing required)."
  - "listTenantsForUser-based membership guard (not markos_tenant_memberships direct query). Rationale: listTenantsForUser is the canonical Phase 201 contract and already filters purged tenants + projects iam_role. Re-using it prevents drift and ensures Wave-2 consent respects the same membership model as /settings/sessions."
  - "Consent page CSS copy-pastes Phase 201 invite/[token]/page.module.css tokens rather than extending a shared base. Rationale: UI-SPEC explicitly scopes Surface S2 as a standalone centered-card page (not in the /settings shell); copy-paste-rename keeps each surface self-contained and avoids a premature shared-stylesheet abstraction that would break independent redesigns."

patterns-established:
  - "OAuth handler shape: readJson/readForm → validate grant_type → dep-injected redis/supabase → delegate to sessions.cjs lifecycle fn → writeJson with Cache-Control: no-store on 200. Reusable for any future OAuth extension."
  - "Surface S2 testability — a11y test asserts presence of copy strings + aria-* + fieldset/legend/details/summary/code via grep on the compiled .tsx source. No JSDOM or RTL dependency; tests run in pure node:test."
  - "F-89 mirrors F-71 YAML shape (top-level summary + paths:) so scripts/openapi/build-openapi.cjs picks it up without schema-change. Validates locally by inspecting top-level path keys, not external YAML libraries."

requirements-completed: [MCP-01, QA-01, QA-14]

# Metrics
duration: ~45min
completed: 2026-04-18
---

# Phase 202 Plan 02: OAuth 2.1 + PKCE + Surface S2 Consent Summary

**OAuth 2.1 + PKCE (MCP 2025-06-18) shipped end-to-end: 7 RFC-compliant endpoints (RFC 8414 + 9728 + 7591 + 7636 + 8707 + 7009), `lib/markos/mcp/oauth.cjs` S256-only PKCE helper with Redis-backed 60s one-time authorization codes, opaque Bearer tokens via Plan 202-01's `createSession` (no refresh tokens per D-06), Surface S2 `/oauth/consent` page with D-07 tenant-bind-at-consent picker, and F-89 contract. 61 tests green; 66/66 Wave-1 regression green.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-04-18T00:00:00Z (approx)
- **Completed:** 2026-04-18T00:44:28Z
- **Tasks:** 3/3 complete
- **Files created:** 14 (no modifications)
- **Tests added:** 61 (47 oauth.test.js + 14 consent-ui-a11y.test.js)
- **Tests green:** 61/61 in 202-02 suite; 66/66 in Wave-1 regression (202-01 session + rls + migration-idempotency + 202-03 cost-table + cost-meter + 402-breach); 25/25 Phase 201 audit + tenancy regression.

## Accomplishments

- **`lib/markos/mcp/oauth.cjs` + `.ts` dual-export** ships the full D-05/D-06/D-07 PKCE substrate: `AUTH_CODE_TTL_SECONDS=60`, `isAllowedRedirect` (https/loopback/vscode.dev/claude.ai whitelist), `issueAuthorizationCode` (Redis SET NX EX60, randomBytes(32) hex), `consumeAuthorizationCode` (GETDEL one-time; falls back to GET+DEL), `verifyPKCE` (createHash sha256 base64url + RFC 7636 length gate 43..128 + `timingSafeEqual`), `generateDCRClient` (`mcp-cli-<hex32>` client_id + `token_endpoint_auth_method: none` + grant/response type defaults).
- **Two `.well-known` endpoints match RFC 9728 + RFC 8414 shapes**: RS metadata advertises `resource`, `authorization_servers`, `bearer_methods_supported: ['header']`; AS metadata advertises S256-only, `registration_endpoint`, `revocation_endpoint`, `token_endpoint_auth_methods_supported: ['none']`. Both set `Cache-Control: public, max-age=3600` so MCP clients can cache discovery.
- **5 OAuth endpoints conform to MCP 2025-06-18 spec**: `/oauth/register` (RFC 7591 DCR, 201 + `Cache-Control: no-store`), `/oauth/authorize` (query validation + /login fallback or /oauth/consent forward, preserves query string), `/oauth/authorize/approve` (listTenantsForUser membership guard + plan_tier lookup + `issueAuthorizationCode` + 302 redirect), `/oauth/token` (PKCE S256 exchange + RFC 8707 exact-match on client_id/redirect_uri/resource + `createSession` delegate → `{ access_token, token_type: 'Bearer', expires_in: 86400, scope }`, **zero `refresh_token` emission per D-06**), `/oauth/revoke` (401 for anonymous + RFC 7009 anti-probing always-200 for authenticated actor + `revokeSession` delegate).
- **F-89 contract declares all 7 OAuth paths** (the 4 OAuth endpoints + approve + 2 well-known) with full request/response schemas and RFC references (7636/7591/8414/9728/8707/7009 + MCP 2025-06-18). YAML shape mirrors F-71 + F-85 so `scripts/openapi/build-openapi.cjs` will merge it without changes.
- **Surface S2 `/oauth/consent` page** (Next.js App Router, 'use client') renders the full consent UX per UI-SPEC: Sora 28px heading, Authorize {client_name}, scope chips (`#e6fffb` bg, `#0f766e` text), tenant picker via `<fieldset><legend>Which workspace?</legend>` + radios for multi-tenant users (single-tenant users skip the picker), Approve access button (`#0d9488` → `#0b877c` hover, `#94a3b8` disabled) + Deny neutral-outline, `<details><summary>What is MCP?</summary>` expandable, `<code>` for redirect_uri, `role="alert"` error region for invalid/expired requests. Accessibility: `aria-labelledby="consent-heading"`, `aria-describedby` on button helper, 44px tap targets, focus-visible 2px teal outline, `@media (prefers-reduced-motion: reduce)` override.
- **Three security gates keep PKCE S256-only (D-05)**: helper throws on `code_challenge_method !== 'S256'`, GET handler 400s on `code_challenge_method != S256`, approve handler 400s on `code_challenge_method !== 'S256'`. Triple-gate defeats accidental regression via any one layer.
- **D-07 tenant-bind-at-consent**: approve handler invokes Phase-201 `listTenantsForUser` (filters purged) and verifies `target_tenant_id ∈ user.tenants`; also re-checks `tenant.status === 'active'` server-side before issuing the authorization code. Cross-tenant consent (T-202-02-06) is impossible.

## Task Commits

Each task committed atomically with `--no-verify` (parallel-executor flag):

1. **Task 1 RED** — `b3a6cfa` — `test(202-02): add failing OAuth 2.1 + PKCE test suite (Task 1 + Task 2 RED)` — wrote full 47-case oauth.test.js up-front so both GREEN commits for Tasks 1 + 2 regress against the same suite.
2. **Task 1 GREEN** — `d58d08a` — `feat(202-02): OAuth helpers + well-known discovery + DCR (Task 1 GREEN)` — oauth.cjs + .ts + 2 well-known handlers + /oauth/register.
3. **Task 2 GREEN** — `4021bee` — `feat(202-02): OAuth authorize + approve + token + revoke endpoints (Task 2 GREEN)` — 4 OAuth handlers wire to Redis + Plan 202-01 sessions + listTenantsForUser.
4. **Task 3 RED** — `fc9ff52` — `test(202-02): add failing consent UI a11y + F-89 contract tests (Task 3 RED)` — 14 grep-shape tests over page.tsx + page.module.css + F-89 YAML.
5. **Task 3 GREEN** — `c2ab450` — `feat(202-02): F-89 OAuth contract + Surface S2 consent page (Task 3 GREEN)` — F-89 YAML + Next.js consent page + CSS tokens.

## Files Created/Modified

Created (14):
- `lib/markos/mcp/oauth.cjs` — 145 LOC — PKCE + DCR + Redis lifecycle source of truth
- `lib/markos/mcp/oauth.ts` — 32 LOC — typed named re-exports + module.exports pass-through
- `api/.well-known/oauth-protected-resource.js` — RFC 9728 RS metadata handler
- `api/.well-known/oauth-authorization-server.js` — RFC 8414 AS metadata handler
- `api/oauth/register.js` — RFC 7591 DCR handler
- `api/oauth/authorize.js` — GET handler with 302 /login vs /oauth/consent branching
- `api/oauth/authorize/approve.js` — POST approve with tenant membership guard
- `api/oauth/token.js` — POST PKCE exchange + createSession delegate
- `api/oauth/revoke.js` — POST RFC 7009 anti-probing + revokeSession delegate
- `contracts/F-89-mcp-oauth-v1.yaml` — 189 LOC, 7 paths, 6 RFC references
- `app/(markos)/oauth/consent/page.tsx` — 220 LOC, Surface S2
- `app/(markos)/oauth/consent/page.module.css` — 196 LOC, UI-SPEC tokens
- `test/mcp/oauth.test.js` — 47 tests (lifecycle + all 5 OAuth handlers)
- `test/mcp/consent-ui-a11y.test.js` — 14 tests (UI-SPEC grep + F-89 shape)

Modified (0).

## Decisions Made

See `key-decisions` frontmatter above. Summary:

- **Triple-gate S256 enforcement** — lib helper + authorize GET + approve POST all reject non-S256; defeats accidental regression.
- **No refresh tokens** (D-06) — removes T-202-02-07 refresh-leak attack surface entirely.
- **Deps injection for Redis + Supabase** — runtime uses `@upstash/redis` + `lib/markos/auth/session.ts`; tests pass `deps.redis + deps.supabase` without requiring npm-installed Upstash.
- **RFC 7009 anti-probing** — 401 for anon, always 200 for authenticated actor; no timing signal.
- **Client-side query-string reading on consent page** — matches Phase 201 invite page pattern; no SSR prop plumbing.
- **listTenantsForUser membership guard** — reuses Phase 201 canonical tenant-set helper; re-validates tenant.status server-side.
- **CSS copy-paste from Phase 201 invite page** — Surface S2 is a standalone centered-card page; no premature shared-stylesheet abstraction.

## Deviations from Plan

**None.** Plan executed exactly as written. All 3 tasks completed in TDD RED → GREEN cycle without deviation.

Notes on parallel Wave-2 coordination:
- Plan 202-04 shipped commits during this plan's execution (`a2d1c95`, `a31ca6a`, `bec41e7`, `0c947cc`, `2043686`). No file-level conflict — 202-04 owns `lib/markos/mcp/tools/*` + `lib/markos/mcp/pipeline.cjs` + ajv dependencies; 202-02 owns `api/oauth/*` + `lib/markos/mcp/oauth.cjs` + consent UI. Both plans read the Plan 202-01 session library.
- `@upstash/redis` was declared in package.json by Plan 202-03 (commit `758f2a1`) but npm install has not run in the working tree. Runtime handlers call `Redis.fromEnv()`; tests pass an in-memory mockRedis via deps injection. The package will resolve at deploy time (Vercel runs npm install on build). No deferred item — installation is a deploy concern, not a plan-scope concern.

## Verification Log

- `node --test test/mcp/oauth.test.js test/mcp/consent-ui-a11y.test.js` → **61 pass / 0 fail**
- `node --test test/mcp/session.test.js test/mcp/rls.test.js test/mcp/migration-idempotency.test.js test/mcp/cost-table.test.js test/mcp/cost-meter.test.js test/mcp/402-breach.test.js` → **66 pass / 0 fail** (Wave-1 regression)
- `node --test test/audit/hash-chain.test.js test/tenancy/invites.test.js test/tenancy/lifecycle.test.js` → **25 pass / 0 fail** (Phase 201 regression)
- Acceptance greps (all met):
  - `grep "AUTH_CODE_TTL_SECONDS = 60" lib/markos/mcp/oauth.cjs` → 1 ✓
  - `grep "timingSafeEqual" lib/markos/mcp/oauth.cjs` → 2 ✓ (import + call)
  - `grep "code_challenge_method !== 'S256'" lib/markos/mcp/oauth.cjs` → 1 ✓
  - `grep "code_challenge_methods_supported" api/.well-known/oauth-authorization-server.js` → 1 ✓
  - `grep "authorization_servers" api/.well-known/oauth-protected-resource.js` → 1 ✓
  - `grep "require('./oauth.cjs')" lib/markos/mcp/oauth.ts` → 2 ✓
  - `grep "grant_type !== 'authorization_code'" api/oauth/token.js` → 1 ✓
  - `grep "verifyPKCE" api/oauth/token.js` → 2 ✓ (import + call)
  - `grep "createSession" api/oauth/token.js` → 3 ✓ (import + call + error branch)
  - `grep "PKCE verifier mismatch" api/oauth/token.js` → 1 ✓
  - `grep "expires_in: 86400" api/oauth/token.js` → 1 ✓
  - `grep "refresh_token" api/oauth/token.js` → 0 ✓ (D-06)
  - `grep "issueAuthorizationCode" api/oauth/authorize/approve.js` → 3 ✓ (import + call + comment)
  - `grep "listTenantsForUser" api/oauth/authorize/approve.js` → 3 ✓
  - `grep "revokeSession" api/oauth/revoke.js` → 2 ✓
  - `grep "invalid_target" api/oauth/token.js` → 1 ✓ (RFC 8707)
  - F-89: `grep -c "^  /" contracts/F-89-mcp-oauth-v1.yaml` → 7 paths ✓
  - F-89 RFC refs: `grep -cE "rfc_7636|rfc_8707|rfc_8414|rfc_9728|rfc_7591"` → 5 ✓
  - Consent page UI-SPEC tokens: 8× #0d9488, 2× #0f766e, 1× `border-radius: 28px`, 2× `min-height: 44px`, 1× `prefers-reduced-motion` — all present ✓

## Threat Surface Coverage

All STRIDE threats from PLAN `<threat_model>` addressed:

| Threat ID | Disposition | Evidence |
|-----------|-------------|----------|
| T-202-02-01 (PKCE downgrade to plain) | mitigate | S256 rejected at 3 gates: oauth.cjs throws, /oauth/authorize 400s, /oauth/authorize/approve 400s. Well-known AS metadata advertises S256-only. |
| T-202-02-02 (authorization_code replay) | mitigate | Redis GETDEL in `consumeAuthorizationCode` → one-time; second /oauth/token call returns 400 invalid_grant (test: "one-time use"). |
| T-202-02-03 (PKCE verifier brute-force via timing) | mitigate | `timingSafeEqual` after RFC 7636 length gate (43..128) in `verifyPKCE`. |
| T-202-02-04 (open-redirect on /oauth/authorize) | mitigate | `isAllowedRedirect` whitelist; DCR stores + /oauth/token exact-matches against stored redirect_uri. Test covers `javascript:` and `ftp://` rejection. |
| T-202-02-05 (CSRF on /oauth/authorize/approve) | mitigate | Approve handler requires `csrf_token` body field (validated against session-bound token via Phase-201 `/api/auth/csrf`) + `x-markos-user-id` header (Phase-201 session). |
| T-202-02-06 (cross-tenant consent) | mitigate | `listTenantsForUser` scoped to user's own memberships; approve verifies `target_tenant_id ∈ user.tenants` AND `tenant.status === 'active'`. 403 invalid_tenant test covers both. |
| T-202-02-07 (refresh token leak) | accept | No refresh tokens issued (D-06); `grep refresh_token api/oauth/token.js` → 0. Attack surface removed. |
| T-202-02-08 (token probing via /oauth/revoke) | mitigate | RFC 7009 always-200 for authenticated actor; 401 only for anonymous. Test: "returns 200 even for unknown token". |
| T-202-02-09 (resource confusion per RFC 8707) | mitigate | /oauth/token exact-matches `stored.resource === form.resource`; 400 invalid_target on mismatch. Test covers. |
| T-202-02-10 (DCR flood) | mitigate | DCR is open per MCP spec; rate-limit handled by Plan 202-04/05 pipeline. Per-call no DB writes (client_id is ephemeral). |
| T-202-02-11 (scope/tenant leak in deny 302) | accept | Only `error=access_denied` + `state` echoed back per OAuth 2.1 error response spec. |
| T-202-02-12 (client_id substitution in /oauth/token) | mitigate | Exact-match stored.client_id vs form.client_id; 400 invalid_client on mismatch. Test covers. |

## Known Stubs

**None.** All handlers wire to real dependencies:
- `api/oauth/authorize/approve.js` calls real `listTenantsForUser` (Phase 201), real `issueAuthorizationCode` (this plan), real Supabase `markos_orgs.plan_tier` lookup.
- `api/oauth/token.js` calls real `consumeAuthorizationCode`, `verifyPKCE`, and Plan 202-01 `createSession`.
- `api/oauth/revoke.js` calls real `hashToken` + Plan 202-01 `revokeSession`.
- `/oauth/consent/page.tsx` fetches real `/api/tenant/switcher/list` + `/api/auth/csrf` + posts to real `/oauth/authorize/approve`.

## Authentication Gates Encountered

None. This plan is fully server-side + client-side-no-network-needed (tests use mockRedis + mockSupabase). Deployment requires:
- `OAUTH_ISSUER_URL` env var (defaults to `https://markos.dev`)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (consumed by `Redis.fromEnv()` at handler time)
- Phase-201 session middleware must inject `x-markos-user-id` header on authenticated requests (current Phase-201 pattern)

Documented for the Phase 202 operator checklist but not blocking — handlers fail closed (401 / 400) when env is missing.

## User Setup Required

None for development/testing. Deployment:
1. Set `OAUTH_ISSUER_URL=https://markos.dev` (or staging equivalent) in Vercel env
2. Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (Plan 202-03 dep)
3. Run `npm install` to resolve `@upstash/redis@^1.37.0` + `@upstash/ratelimit@^2.0.8` from package.json

## Threat Flags

None. All new trust boundaries are enumerated in the plan's `<threat_model>` with explicit mitigations (see table above).

## Next Plan Readiness

- **202-04 (tool pipeline + per-call audit)** — `lookupSession` from Plan 202-01 is now the auth gate for MCP tool calls. Bearer tokens issued by this plan flow directly into `lookupSession(client, token)` → returns `{ user_id, tenant_id, org_id, scopes, plan_tier }` — pipeline has all it needs.
- **202-05 (tenant-scoped tool dispatch)** — `session.tenant_id` is populated at consent (D-07); dispatcher can gate by `session.tenant_id === request.tenant_id` with zero additional plumbing.
- **202-06 (/settings/mcp UI)** — `/oauth/revoke` provides the revoke-from-UI path; `listSessionsForTenant` + `listSessionsForUser` (Plan 202-01) provide the active-sessions rows. No token_hash ever reaches the UI.
- **202-08 (Claude Marketplace submission)** — all 5 RFCs (7636 + 8414 + 9728 + 7591 + 8707) + RFC 7009 + MCP 2025-06-18 spec now implemented. Cert-eligible after Plan 202-07 (SDK CI) and Plan 202-10 (verification).

## Self-Check: PASSED

Created files verified on disk:
- FOUND: lib/markos/mcp/oauth.cjs
- FOUND: lib/markos/mcp/oauth.ts
- FOUND: api/.well-known/oauth-protected-resource.js
- FOUND: api/.well-known/oauth-authorization-server.js
- FOUND: api/oauth/register.js
- FOUND: api/oauth/authorize.js
- FOUND: api/oauth/authorize/approve.js
- FOUND: api/oauth/token.js
- FOUND: api/oauth/revoke.js
- FOUND: contracts/F-89-mcp-oauth-v1.yaml
- FOUND: app/(markos)/oauth/consent/page.tsx
- FOUND: app/(markos)/oauth/consent/page.module.css
- FOUND: test/mcp/oauth.test.js
- FOUND: test/mcp/consent-ui-a11y.test.js

Commits verified in git log:
- FOUND: b3a6cfa (Task 1+2 RED)
- FOUND: d58d08a (Task 1 GREEN)
- FOUND: 4021bee (Task 2 GREEN)
- FOUND: fc9ff52 (Task 3 RED)
- FOUND: c2ab450 (Task 3 GREEN)

Test suites green at self-check:
- test/mcp/oauth.test.js — 47/47
- test/mcp/consent-ui-a11y.test.js — 14/14
- test/mcp/session.test.js + rls.test.js + migration-idempotency.test.js — 30/30 (Plan 202-01 regression)
- test/mcp/cost-table.test.js + cost-meter.test.js + 402-breach.test.js — 36/36 (Plan 202-03 regression)
- test/audit/hash-chain.test.js + tenancy/invites.test.js + tenancy/lifecycle.test.js — 25/25 (Phase 201 regression)
- **Total: 152/152 green after plan close.**

---
*Phase: 202-mcp-server-ga-claude-marketplace*
*Plan: 02*
*Completed: 2026-04-18*
