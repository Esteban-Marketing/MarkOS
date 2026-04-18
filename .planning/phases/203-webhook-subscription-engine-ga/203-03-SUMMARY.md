---
phase: 203
plan: 03
subsystem: webhooks
tags: [wave-2, dlq, cron, retention, audit, D-07, D-08]
dependency-graph:
  requires: [203-01-store-adapter, 203-02-migration-72]
  provides:
    - "lib/markos/webhooks/dlq.cjs::listDLQ"
    - "lib/markos/webhooks/dlq.cjs::countDLQ"
    - "lib/markos/webhooks/dlq.cjs::markFailed"
    - "lib/markos/webhooks/dlq.cjs::markDelivered"
    - "lib/markos/webhooks/dlq.cjs::purgeExpired"
    - "lib/markos/webhooks/dlq.cjs::DLQ_WINDOW_DAYS"
    - "api/cron/webhooks-dlq-purge.js::handle"
    - "vercel.ts::crons[6] webhooks-dlq-purge @ 30 3 * * *"
  affects: [203-04, 203-09, 203-10]
tech-stack:
  added: []
  patterns:
    - tenant-scope-first-filter
    - dep-injectable-audit-emit
    - fire-and-forget-audit-staging
    - shared-secret-cron-gate
    - dual-filter-delete
key-files:
  created:
    - "lib/markos/webhooks/dlq.cjs"
    - "lib/markos/webhooks/dlq.ts"
    - "api/cron/webhooks-dlq-purge.js"
    - "test/webhooks/dlq.test.js"
    - "test/webhooks/dlq-purge-cron.test.js"
  modified:
    - "vercel.ts"
decisions:
  - "enqueueAuditStaging 2-arg signature — the real module exports enqueueAuditStaging(client, entry), not the single-object form the plan assumed. purgeExpired passes the same Supabase client it uses for the delete so there is no secondary client construction. Documented as Rule 3 blocking deviation below."
  - "tenant_id sentinel 'system' on system-wide audit row — markos_audit_log_staging has tenant_id text NOT NULL with no FK; writer.cjs validateEntry rejects null/empty. Using 'system' as the sentinel is the narrowest change that preserves the plan's intent (cross-tenant DLQ purge batch). Downstream 203-10 status page can filter `tenant_id='system'` + `source_domain='webhooks'` + `action='dlq.purged'` to find all purge batches."
  - "POST-only cron — plan test 2d explicitly requires 405 on non-POST. cleanup.js pattern also accepts GET; this cron tightens to POST-only because Vercel cron triggers are POST by default and GET offers no additional value for a mutating endpoint."
  - "Bearer token alt-header also accepted — mirrors the cleanup.js / mcp-kpi-digest.js pattern so the same secret can be passed either as x-markos-cron-secret OR Authorization: Bearer <secret>."
  - "DLQ_WINDOW_MS module constant — extracted as `DLQ_WINDOW_DAYS * 86400 * 1000` so both listDLQ/countDLQ (read window) and purgeExpired (delete cutoff) share one source of truth. Flipping D-08 means editing one constant."
metrics:
  duration_minutes: 5
  tasks_completed: 2
  tests_added: 26
  tests_total_green: 26
  completed_date: "2026-04-18"
requirements: [WHK-01, QA-05, QA-13]
---

# Phase 203 Plan 03: Webhook DLQ Library + Daily Purge Cron Summary

Wave-2 DLQ substrate: ships `lib/markos/webhooks/dlq.cjs` (5 exports + D-08 window constant) and the daily 03:30 UTC purge cron that enforces the 7-day retention. Every downstream 203 plan (203-04 replay, 203-09 dashboard DLQ tab, 203-10 status metrics) now has a tenant-scoped SELECT + transition + purge API in place.

## What Shipped

**Task 1 — DLQ library (list + count + mark transitions + purge)** (commits `8357fc5` RED → `ad962d5` GREEN)

- `lib/markos/webhooks/dlq.cjs` — 5 exports + `DLQ_WINDOW_DAYS=7` constant:
  - `listDLQ(client, { tenant_id, subscription_id })` — tenant-scoped SELECT filtering `status='failed' AND dlq_at IS NOT NULL AND dlq_at >= now()-7d`, ordered by `dlq_at DESC`. THROWS if `tenant_id` missing (defense-in-depth cross-tenant guard — T-203-03-03).
  - `countDLQ(client, { tenant_id })` — returns integer count via `{ count: 'exact', head: true }`. THROWS if `tenant_id` missing.
  - `markFailed(client, id, { reason, final_attempt })` — UPDATE to `status='failed' + dlq_reason + final_attempt + dlq_at=now() + updated_at=now()`. Does NOT delete the row (test 1j guarantees).
  - `markDelivered(client, id)` — UPDATE to `status='delivered' + updated_at`. Does NOT touch `dlq_at`.
  - `purgeExpired(client, { now?, deps? })` — DELETE where `status='failed' AND dlq_at < now-7d`; emits one audit row per batch via `enqueueAuditStaging(client, { source_domain:'webhooks', action:'dlq.purged', tenant_id:'system', payload:{ count, older_than:'7d', purged_at } })`; audit failure is swallowed (fire-and-forget). Returns `{ count }`.
- `lib/markos/webhooks/dlq.ts` — TypeScript dual-export mirror (Phase 202 sessions.ts convention).
- `test/webhooks/dlq.test.js` — 17 tests (behaviors 1a–1k + 3 supporting cases) using a chain-recording mock Supabase client + dep-injected `enqueueAuditStaging`.

**Task 2 — Cron wrapper + vercel.ts registration** (commits `8881353` RED → `3f64522` GREEN)

- `api/cron/webhooks-dlq-purge.js` — POST-only handler gated by `MARKOS_WEBHOOK_CRON_SECRET` (x-markos-cron-secret header OR Bearer token); delegates to `purgeExpired(supabase)`; returns `{ success, count, duration_ms }` on 200, `{ success:false }` on 401/405/500. Exports `handle(req, res, deps)` seam for unit tests (Plan 202-01 cleanup.js pattern).
- `vercel.ts` — 6th cron entry: `{ path: '/api/cron/webhooks-dlq-purge', schedule: '30 3 * * *' }`. All 5 prior crons preserved (audit/drain, lifecycle purge-cron, cleanup-unverified-signups, mcp/session/cleanup, mcp-kpi-digest) and the Plan 203-01 queue trigger (`queue/v2beta` / `markos-webhook-delivery`) untouched.
- `test/webhooks/dlq-purge-cron.test.js` — 9 tests (2a–2f + 3 supporting: 2c.err 500, 2c.bearer Bearer alt-header, 2f.queue queue trigger persistence).

## Tests

| Suite | File | Tests | Status |
|-------|------|-------|--------|
| DLQ library — list + count + mark + purge | `test/webhooks/dlq.test.js` | 17 | 17/17 |
| Cron handler + vercel.ts registration | `test/webhooks/dlq-purge-cron.test.js` | 9 | 9/9 |
| **Plan 203-03 targeted total** |  | **26** | **26/26** |
| 200-03 regression: signing / engine / delivery / api-endpoints |  | 38 | 38/38 |
| Audit hash-chain regression (AUDIT_SOURCE_DOMAINS unchanged) | `test/audit/hash-chain.test.js` | 7 | 7/7 |

Commands used:

```bash
# Plan 203-03 targeted
node --test test/webhooks/dlq.test.js test/webhooks/dlq-purge-cron.test.js

# 200-03 regression (SSRF-independent suites)
node --test test/webhooks/signing.test.js test/webhooks/engine.test.js test/webhooks/delivery.test.js test/webhooks/api-endpoints.test.js

# Audit regression
node --test test/audit/hash-chain.test.js
```

## Acceptance Criteria Verification

**Task 1:**
- `grep -c "eq('tenant_id', tenant_id)" lib/markos/webhooks/dlq.cjs` → **2** (listDLQ + countDLQ; ≥2 required)
- `grep -c "DLQ_WINDOW_DAYS = 7" lib/markos/webhooks/dlq.cjs` → **1** (D-08 locked constant)
- `grep -cE "source_domain: 'webhooks'" lib/markos/webhooks/dlq.cjs` → **1** (audit emit on purge)
- `grep -cE "^module\\.exports = \\{" lib/markos/webhooks/dlq.cjs` → **1** (5 functions + DLQ_WINDOW_DAYS)
- `grep -c "'webhooks'" lib/markos/audit/writer.cjs` → **1** (AUDIT_SOURCE_DOMAINS — not modified)
- Dual export: both `lib/markos/webhooks/dlq.cjs` + `lib/markos/webhooks/dlq.ts` present
- `node --test test/audit/hash-chain.test.js` → 7/7 green (AUDIT_SOURCE_DOMAINS untouched)

**Task 2:**
- `grep -c "MARKOS_WEBHOOK_CRON_SECRET" api/cron/webhooks-dlq-purge.js` → **2** (≥1)
- `grep -c "purgeExpired" api/cron/webhooks-dlq-purge.js` → **3** (≥1)
- `grep -c "webhooks-dlq-purge" vercel.ts` → **1** (≥1)
- `grep -c "30 3 \\* \\* \\*" vercel.ts` → **1** (schedule literal present)
- `grep -cE "audit/drain|lifecycle/purge-cron|cleanup-unverified-signups|mcp/session/cleanup|mcp-kpi-digest" vercel.ts` → **5** (all pre-existing crons preserved)
- `grep -cE "webhooks-dlq-purge|queue/v2beta" vercel.ts` → **4** (Plan 203-01 queue trigger + Plan 203-03 cron both present)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 – Blocking] enqueueAuditStaging takes (client, entry), not a single object**

- **Found during:** Task 1 implementation (reading `lib/markos/audit/writer.cjs:54`).
- **Issue:** The plan body specifies `await enqueueAuditStaging({ source_domain: 'webhooks', action: 'dlq.purged', tenant_id: null, ... })` — a single-argument call. The real module exports `async function enqueueAuditStaging(client, entry)` — the first arg is the Supabase client.
- **Fix:** `purgeExpired` now calls `emit(client, entry)` with the same Supabase client it used for the DELETE. Dep-injection seam preserved (`deps.enqueueAuditStaging` still works for tests that pass their own mock). Tests were authored to match this actual signature; no re-write needed after discovery.
- **Files modified:** `lib/markos/webhooks/dlq.cjs`.
- **Commit:** `ad962d5`.

**2. [Rule 3 – Blocking] tenant_id cannot be null in audit staging**

- **Found during:** Task 1 GREEN (reading `writer.cjs:14` — `validateEntry` throws `tenant_id required` if falsy).
- **Issue:** Plan specified `tenant_id: null` for the purge audit row. `validateEntry` rejects this; `markos_audit_log_staging.tenant_id` is `text NOT NULL` (no FK — migration 82:53).
- **Fix:** Use `'system'` as a sentinel tenant_id on cross-tenant system audit rows. Sentinel is distinguishable in queries and preserves the NOT NULL contract. Downstream 203-10 status page can filter `tenant_id='system' + source_domain='webhooks' + action='dlq.purged'` to retrieve all purge batches.
- **Files modified:** `lib/markos/webhooks/dlq.cjs`.
- **Commit:** `ad962d5`.

**3. [Rule 2 – Missing Critical] actor_role field required by validateEntry**

- **Found during:** Task 1 GREEN (test 1h execution traced through writer.cjs).
- **Issue:** Plan emit shape `{ source_domain, action, tenant_id, actor_id, target_id, payload }` omits `actor_role`, which `validateEntry` requires (writer.cjs:21). Running purgeExpired with the plan's shape would throw every time `enqueueAuditStaging` is invoked.
- **Fix:** Emit `actor_role: 'system'` alongside `actor_id: 'system:cron'`. Consistent with existing system-audit emits (e.g. `switcher.cjs:84-89` uses `actor_role: 'owner'`).
- **Files modified:** `lib/markos/webhooks/dlq.cjs`.
- **Commit:** `ad962d5`.

### No architectural or Rule 4 issues raised.

Total deviations: 3 (2 Rule 3 blocking + 1 Rule 2 missing-critical). Every deviation was a correctness fix against an existing contract in `lib/markos/audit/writer.cjs`; none expanded plan scope.

## Security Posture

- **T-203-03-01** (Elev · cron handler) — `x-markos-cron-secret` header OR `Authorization: Bearer` matches `MARKOS_WEBHOOK_CRON_SECRET`; 401 on mismatch; mirrors Plan 202-01 cleanup.js + Plan 202-10 mcp-kpi-digest.js patterns.
- **T-203-03-02** (Tampering · purge DELETE) — Double-filter `status='failed' AND dlq_at < cutoff` on every DELETE. Partial index `idx_deliveries_dlq_retention` (migration 72) backs the query. Rows with `status in ('pending','retrying','delivered')` cannot match.
- **T-203-03-03** (Info Disclosure · cross-tenant) — `listDLQ` + `countDLQ` both THROW if `tenant_id` is missing. `.eq('tenant_id', ...)` is always the first filter. Postgres RLS on `markos_webhook_deliveries` (migration 70) is defense-in-depth when the service-role client is not used.
- **T-203-03-04** (DoS · oversize batch) — ACCEPTED. 7-day window + daily cadence bound realistic batch size. `duration_ms` logged for p95 measurement once 203-10 log-drain ships.
- **T-203-03-05** (Repudiation · deleted without audit) — Single `enqueueAuditStaging` batch row per purge with `payload.count`. Audit log retains the row forever even after DLQ rows are hard-deleted. Audit emit is fire-and-forget so purge never blocks on staging.

## Known Stubs

None. Every plan artifact is production-ready.

## User Setup Required

**Vercel Project → Environment Variables:**
- `MARKOS_WEBHOOK_CRON_SECRET` — generate 32-byte random (e.g. `openssl rand -hex 32`). Used on `/api/cron/webhooks-*` endpoints. Mirrors the `MARKOS_MCP_CRON_SECRET` pattern from Plan 202-01.

No database migration required — the 4 DLQ columns + `idx_deliveries_dlq_retention` ship in migration 72 (Plan 203-02).

## Commits

| Task | Step  | Hash      | Message                                                                |
| ---- | ----- | --------- | ---------------------------------------------------------------------- |
| 1    | RED   | `8357fc5` | test(203-03): add failing tests for DLQ library                        |
| 1    | GREEN | `ad962d5` | feat(203-03): DLQ library with list + count + mark transitions + purge |
| 2    | RED   | `8881353` | test(203-03): add failing tests for DLQ purge cron + vercel.ts         |
| 2    | GREEN | `3f64522` | feat(203-03): DLQ purge cron wrapper + vercel.ts 6th cron entry        |

## Unblocks

- **Plan 203-04 (Replay)** — `listDLQ` + `markFailed` + `markDelivered` are the transition API replay iterates.
- **Plan 203-09 (Dashboard S2 DLQ tab)** — `listDLQ` + `countDLQ` back the DLQ pane and fleet-metric hero counter.
- **Plan 203-10 (Status page / runbook)** — purge cron line + audit query (`source_domain='webhooks' AND action='dlq.purged'`) source the final ops docs.

D-07 (no auto-retry) expressed by absence: no code path re-enqueues a DLQ row. D-08 (7-day TTL) enforced at both read (listDLQ window) and write (purgeExpired cutoff) using the single `DLQ_WINDOW_DAYS = 7` constant.

## Self-Check: PASSED

**Files verified:**
- FOUND: `lib/markos/webhooks/dlq.cjs`
- FOUND: `lib/markos/webhooks/dlq.ts`
- FOUND: `api/cron/webhooks-dlq-purge.js`
- FOUND: `test/webhooks/dlq.test.js`
- FOUND: `test/webhooks/dlq-purge-cron.test.js`
- MODIFIED: `vercel.ts` (6th cron entry + Plan 203-03 comment line)

**Commits verified:**
- FOUND: `8357fc5` (Task 1 RED)
- FOUND: `ad962d5` (Task 1 GREEN)
- FOUND: `8881353` (Task 2 RED)
- FOUND: `3f64522` (Task 2 GREEN)

**Test suites verified:**
- `node --test test/webhooks/dlq.test.js` → 17/17 green
- `node --test test/webhooks/dlq-purge-cron.test.js` → 9/9 green
- `node --test test/webhooks/signing.test.js test/webhooks/engine.test.js test/webhooks/delivery.test.js test/webhooks/api-endpoints.test.js` → 38/38 green
- `node --test test/audit/hash-chain.test.js` → 7/7 green

---
*Phase: 203-webhook-subscription-engine-ga*
*Plan: 03*
*Completed: 2026-04-18*
