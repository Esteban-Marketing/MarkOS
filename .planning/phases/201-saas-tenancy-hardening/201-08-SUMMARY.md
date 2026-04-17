---
phase: 201-saas-tenancy-hardening
plan: "08"
subsystem: consolidation-audit-docs-cache
tags: [openapi, docs, llms, audit, cron, slug-cache, edge-config, wave-3]
dependency_graph:
  requires: [201-01, 201-02, 201-03, 201-04, 201-05, 201-06, 201-07]
  provides:
    - contracts/openapi.json (regenerated, 14 phase-201 paths)
    - contracts/F-88-tenant-audit-query-v1.yaml
    - api/tenant/audit/list.js
    - vercel.ts (cron registry)
    - docs/routing.md
    - docs/admin.md
    - docs/tenancy-lifecycle.md
    - docs/gdpr-export.md
    - docs/llms/phase-201-tenancy.md
    - lib/markos/tenant/slug-cache.{cjs,ts}
    - lib/markos/orgs/tenants.{cjs,ts}
    - middleware.ts (edge-config read-through)
  affects: [202+, SOC-2 Type I evidence pack]
tech_stack:
  added:
    - "@vercel/edge-config ^1.4.3"
  patterns:
    - read-through-cache-with-db-fallback
    - write-through-from-create-path
    - fail-closed-on-cache-error
    - static-analysis-grep-lock
    - fire-and-forget-cache-backfill
    - fail-soft-audit-emit
key_files:
  created:
    - api/tenant/audit/list.js
    - contracts/F-88-tenant-audit-query-v1.yaml
    - vercel.ts
    - docs/routing.md
    - docs/admin.md
    - docs/tenancy-lifecycle.md
    - docs/gdpr-export.md
    - docs/llms/phase-201-tenancy.md
    - lib/markos/tenant/slug-cache.cjs
    - lib/markos/tenant/slug-cache.ts
    - lib/markos/orgs/tenants.cjs
    - lib/markos/orgs/tenants.ts
    - test/tenancy/audit-emitter-wiring.test.js
    - test/tenancy/openapi-merge.test.js
    - test/tenancy/docs-mirror.test.js
    - test/tenancy/slug-cache.test.js
  modified:
    - lib/markos/webhooks/engine.cjs
    - lib/markos/webhooks/engine.ts
    - api/approve.js
    - api/submit.js
    - middleware.ts
    - lib/markos/tenant/switcher.cjs
    - contracts/openapi.json
    - contracts/openapi.yaml
    - public/llms.txt
    - package.json
    - package-lock.json
decisions:
  - "Webhooks audit emit uses an optional opts.auditClient carrier so the phase-200 store-based engine stays backward compatible; existing 10 webhook tests remained green."
  - "api/approve.js + api/submit.js audit via a res.end hook that captures status + body — keeps the 2000-line handlers.cjs untouched and maps decision/run_id into the audit payload."
  - "Middleware edge-config cache stores only tenant_id (string) in edge-config, not the full row. org_id lookups on cache hit are deferred — downstream handlers that need org_id still re-query Supabase. Keeps the cache value a primitive and the write-through API simple."
  - "readSlugFromEdge fail-closes on edge-config error (returns null → Supabase fallback), preserving the Plan 05 middleware behaviour as the failure mode. Plan 05's original DB path remains the functional backup — T-201-08-08 mitigation."
  - "Cache invalidation is synchronous on renameTenantSlug (invalidate old + write new) to minimise the race window below the 60s TTL; the purge cron hook for purged-tenant slug invalidation is deferred to phase 201.x follow-up (noted in known-follow-ups)."
  - "vercel.ts mirrors vercel.json's rewrite block so Vercel picking TS over JSON does not drop the phase-200 onboarding routes."
  - "F-88 contract is read-only (no UPDATE/DELETE paths) — enforced by Plan 02 RLS; the handler exposes prev_hash/row_hash so clients can replay verify offline without trusting the server."
metrics:
  tasks_completed: 3
  tasks_total: 3
  files_created: 16
  files_modified: 10
  tests_passing: 122
  new_tests_added: 21
  duration_minutes: ~35
  completed: "2026-04-17"
---

# Phase 201 Plan 08: Consolidation — OpenAPI Merge + Docs + Audit Wiring + Cron Registry + Slug Cache

Consolidates phase 201 into shippable form. Wires the cross-domain audit fabric (D-16),
regenerates `contracts/openapi.json` with all 9 phase-201 F-NN contracts, ships 5 docs pages,
registers cron schedules in `vercel.ts`, and fulfils the T-201-05-06 Plan 05 threat-model
promise by adding the `@vercel/edge-config` slug→tenant cache (read-through in middleware,
write-through from tenants.cjs, audit emit on rename).

Phase 201 Wave 3 complete. Phase 201 eligible for verification.

## Tasks

| # | Task | Status | Tests | Commits |
|---|------|--------|-------|---------|
| 1 | Cross-domain audit wiring + F-88 contract + audit/list handler + vercel.ts cron registry | ✓ | 5/5 | `aae5467` (RED) · `1b148b3` (GREEN) |
| 2 | Regenerate openapi.json + ship 5 docs pages + llms.txt update + 2 static tests | ✓ | 7/7 | `cf7c84b` (RED) · `dc820e4` (GREEN) |
| 3 | @vercel/edge-config slug→tenant cache + write-through + middleware read-through | ✓ | 10/10 | `e6bcbf2` (RED) · `3c5a9fd` (GREEN) |

Plus `chore(201-08): add @vercel/edge-config dep` (`9f9b58e`) — separate dep-install commit.

## Task 1 detail — Cross-domain audit fabric (D-16 complete)

- `lib/markos/webhooks/engine.cjs.subscribe` / `.unsubscribe` — additive `opts` carrier with
  `auditClient`, emits `source_domain='webhooks'` action `webhook_subscription.created |
  webhook_subscription.removed` via `enqueueAuditStaging`. Fail-soft try/catch wraps the
  audit emit so a failed audit never blocks the primary write.
- `lib/markos/webhooks/engine.ts` — mirrors the optional `WebhookAuditOpts` signature.
- `api/approve.js` + `api/submit.js` — wrap existing `handleApprove` / `handleSubmit` with a
  `res.end` hook; on 2xx success emit `source_domain='approvals'` action
  `approval.approved | approval.rejected | approval.submitted` via enqueueAuditStaging.
  Handlers.cjs is untouched.
- `api/tenant/audit/list.js` — F-88 handler. 405 non-GET, 401 no headers, 403 when caller
  not owner/tenant-admin on the tenant. Returns `{ entries, has_more }` with
  `prev_hash` + `row_hash` for hash-chain replay. Filter params: `source_domain`, `action`,
  `from`, `to`, `limit` (max 500).
- `contracts/F-88-tenant-audit-query-v1.yaml` — OpenAPI path + AuditEntry schema.
- `vercel.ts` — cron registry: `/api/audit/drain` (`*/1 * * * *`),
  `/api/tenant/lifecycle/purge-cron` (`0 3 * * *`),
  `/api/auth/cleanup-unverified-signups` (`0 */1 * * *`). Vercel.json's rewrite block is
  mirrored so the phase-200 onboarding rewrites survive the TS-preferred-over-JSON precedence.
- `test/tenancy/audit-emitter-wiring.test.js` — 5 static-analysis locks.

## Task 2 detail — OpenAPI merge + docs + llms.txt (QA-01 + QA-15 closed)

- Existing `scripts/openapi/build-openapi.cjs` already globs `F-*.yaml` — re-ran; merged
  51 flows into 69 paths. `contracts/openapi.json` + `contracts/openapi.yaml` regenerated.
- All 14 phase-201 paths now present in openapi.json (signup, callback, passkey register-
  options, passkey authenticate-options, sessions list/revoke, custom-domain add,
  tenant-branding, invites create/accept, lifecycle offboard/cancel-offboard, switcher list,
  audit list).
- 5 new docs pages:
  - `docs/routing.md` — 5 host kinds, slug cache contract, BYOD CNAME flow, 1-domain quota
  - `docs/admin.md` — /settings/{members,domain,sessions,danger} + TenantSwitcher + audit log
  - `docs/tenancy-lifecycle.md` — D-14 30-day timeline + states + authorization + audit surface
  - `docs/gdpr-export.md` — BUNDLE_DOMAINS + 604800s signed URL + hash chain replay
  - `docs/llms/phase-201-tenancy.md` — 17 decisions, 9 contracts, 7 migrations, cache contract
- `public/llms.txt` — appended "# Phase 201 — Tenancy" section with 5 doc entries.
- `test/tenancy/openapi-merge.test.js` — 14 path coverage + F-80..F-88 presence.
- `test/tenancy/docs-mirror.test.js` — 5 doc files + llms.txt references + content shape locks.

## Task 3 detail — @vercel/edge-config slug cache (T-201-05-06 fulfilled)

- `lib/markos/tenant/slug-cache.{cjs,ts}`:
  - `SLUG_CACHE_TTL_SECONDS = 60`, `SLUG_CACHE_NAMESPACE = 'markos:slug:'`.
  - `readSlugFromEdge(slug, deps?)` — hot-path read; returns tenant_id string or null.
    Never throws (edge-config error → miss → Supabase fallback).
  - `writeSlugToEdge(slug, tenantId, deps?)` — PATCH upsert to
    `https://api.vercel.com/v1/edge-config/{id}/items`. No-ops when
    `VERCEL_API_TOKEN`/`EDGE_CONFIG_ID` unset (local-dev safe). Fail-soft.
  - `invalidateSlug(slug, deps?)` — PATCH delete op. Fail-soft.
- `lib/markos/orgs/tenants.{cjs,ts}`:
  - `upsertTenantWithSlugCache(client, input)` — upsert markos_tenants row + write-through
    to edge-config. Returns `{ tenant_id, slug }`.
  - `renameTenantSlug(client, { tenant_id, old_slug, new_slug, actor_id? })` — updates DB,
    synchronously `invalidateSlug(old)` + `writeSlugToEdge(new)`, then emits
    `source_domain='tenancy'` action `tenant.slug_renamed` via `enqueueAuditStaging`.
  - `writeSlugThroughCache({ slug, tenant_id })` — thin composite re-used by other writers.
- `middleware.ts` — additive edit in first_party branch: `readSlugFromEdge(slug)` before
  Supabase; on hit, attach `x-markos-tenant-id` + slug headers and skip DB. On miss, keep
  existing `resolveTenantBySlug` path and backfill via `writeSlugToEdge(slug, tenant_id)`
  (fire-and-forget, only for active tenants). BYOD branch untouched.
- `lib/markos/tenant/switcher.cjs.createTenantInOrg` — now calls `writeSlugThroughCache`
  right after the INSERT so the very first middleware request for the new slug hits the
  cache.
- `package.json` — `@vercel/edge-config ^1.4.3` added under dependencies.
- `test/tenancy/slug-cache.test.js` — 10 assertions covering TTL + namespace, hit/miss/
  fail-close on read, local-dev no-op + PATCH-upsert on write, delete op on invalidate,
  write-through on upsert, DB update + audit emit on rename, middleware grep.

## Verification

- `node --test test/tenancy/*.test.js` → **122/122 tests pass, 0 fail**.
- `node --test test/auth/{signup,passkey,passkey-prompt,provisioner,botid,rate-limit}.test.js
  test/webhooks/engine.test.js` → **60/60 pass** (regression on auth + webhooks clean).
- Acceptance greps:
  - `source_domain: 'webhooks'` in engine.cjs → 3 matches (subscribe, unsubscribe, comment)
  - `source_domain: 'approvals'` present in both api/approve.js + api/submit.js
  - `api/tenant/audit/list.js`, `contracts/F-88-tenant-audit-query-v1.yaml`, `vercel.ts` all exist
  - vercel.ts crons: 2 matches (audit/drain + purge-cron)
  - openapi.json phase-201 paths: 21 hits (14 unique paths — some appear in operationId/tags too)
  - llms.txt phase-201 references: 6 hits (Phase 201 + 5 stems)
  - middleware.ts `readSlugFromEdge`: 2 hits (import + call)
  - package.json `@vercel/edge-config`: 1 match

## Commits

- `9f9b58e` — `chore(201-08): add @vercel/edge-config dep` (package.json + lock)
- `aae5467` — `test(201-08): add failing audit-emitter-wiring test (Task 1 RED)`
- `1b148b3` — `feat(201-08): cross-domain audit wiring + F-88 + audit/list + vercel.ts crons (Task 1 GREEN)`
- `cf7c84b` — `test(201-08): add failing openapi-merge + docs-mirror tests (Task 2 RED)`
- `dc820e4` — `feat(201-08): regenerate openapi.json + ship 5 phase-201 docs + llms.txt (Task 2 GREEN)`
- `e6bcbf2` — `test(201-08): add failing slug-cache contract test (Task 3 RED)`
- `3c5a9fd` — `feat(201-08): slug-cache + tenants write-through + middleware read-through (Task 3 GREEN)`

## REQ Coverage

Closed by this plan: `API-02`, `QA-01`, `QA-02`, `QA-03`, `QA-04`, `QA-05`, `QA-09`, `QA-11`,
`QA-12`, `QA-13`, `QA-15`.

## Deviations from Plan

**[Rule 2 - Critical correctness] switcher.createTenantInOrg write-through wiring.**
The plan `key_links` mandate `createTenantInOrg` route through `writeSlugThroughCache`, but
the spec's Task 3 Step 6 example only described the middleware edit. Applied Rule 2 — added
the 3-line write-through to `switcher.cjs.createTenantInOrg` (post-INSERT) so the key_links
contract is implementation-backed, not just documented. Commit `3c5a9fd`.

**[Rule 3 - Blocking adaptation] webhooks engine signature evolution.**
The plan's Step 1 example used `engine.subscribe(client, sub)` but the phase-200 engine
signature is `engine.subscribe(store, input)` (abstract `store`, no DB client). Adapted the
audit wiring to an optional third `opts` arg carrying `{ auditClient, actor_id, actor_role,
org_id }`. Backward-compatible — existing 10 webhook tests passed without modification.
This keeps the grep tests green (the source_domain + action strings are still present).

**[Rule 3 - Blocking adaptation] approve/submit audit via wrapper, not handler edit.**
The plan Step 3+4 suggested inserting emit calls inside handlers.cjs success paths. That file
is ~3000 lines with complex runtime-context + entitlement + validation flows. Applied Rule 3 —
wrapped the handlers at the `api/approve.js` + `api/submit.js` level with a `res.end` hook
that captures status+body, parses decision/run_id, and emits after the primary flow
completes. Zero changes to handlers.cjs. Same audit semantics (fires on 2xx success, never
blocks, full payload visibility), less blast radius.

No Rule 4 (architectural) triggers fired. No auth gates encountered.

## Known Stubs

None — every hook is wired through to a real implementation. The BYOD edge-config cache is
intentionally deferred (plan Step 6 explicitly scopes Task 3 to first-party; BYOD-cache is
phase-201.x follow-up), not a stub.

## Known Follow-ups (201-08.1)

- BYOD custom-domain cache in middleware (currently falls through to Supabase each request).
- Purge-cron hook to `invalidateSlug(slug)` on tenant status=purged flip (today only
  renameTenantSlug invalidates; purge leaves a 60s stale entry).
- Cache hit path could also set `x-markos-org-id` if we embed the org_id in the edge-config
  value (e.g. `{tenant_id}:{org_id}`); deferred until a measured need emerges.
- Hash-chain client-side replay verifier (`chain-checker.cjs verifyTenantChain`) — the data
  is exposed through F-88; no CLI/client yet.

## Threat Flags

None — no new public surface introduced beyond F-88 (already in the plan threat model) and
the audit wiring additions (each emit domain was already in AUDIT_SOURCE_DOMAINS).

## Unblocks

Phase 201 → verification. With Plan 08 landed, all 8 plans are complete: Plans 01-02
(foundations), 03-04 (auth + passkey), 05-06 (middleware + sessions + BYOD + branding),
07 (members + invites + lifecycle + GDPR + switcher), 08 (audit fabric + docs + openapi +
slug cache). Phase 201 is eligible for `/gsd-verify-phase 201`.

## Self-Check: PASSED

- All 3 tasks landed with atomic RED/GREEN commits
- 21 new tests, 122 total phase-201 tests green
- 60/60 auth + webhooks regression green
- All 10 acceptance-criteria greps pass
- openapi.json regenerated with 14 phase-201 paths
- 5 docs pages + llms.txt entries shipped
- Slug cache fulfils T-201-05-06 threat-model promise
- Plan matches SUMMARY file list (modulo three documented Rule 2/3 deviations)
