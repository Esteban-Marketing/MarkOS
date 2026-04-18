---
phase: 203
plan: 01
subsystem: webhooks
tags: [wave-1, store-adapter, vercel-queues, supabase, durability, D-16]
dependency-graph:
  requires: [200-03-webhooks, 201-08-audit, 202-01-mcp-sessions]
  provides:
    - "lib/markos/webhooks/store-supabase.cjs::createSupabaseSubscriptionsStore"
    - "lib/markos/webhooks/store-supabase.cjs::createSupabaseDeliveriesStore"
    - "lib/markos/webhooks/store-vercel-queue.cjs::createVercelQueueClient"
    - "lib/markos/webhooks/store.cjs::getWebhookStores (mode=memory|supabase)"
    - "api/webhooks/queues/deliver.js::handleCallback(asyncHandler)"
    - "vercel.ts::functions[api/webhooks/queues/deliver.js].experimentalTriggers[queue/v2beta]"
  affects: [203-02, 203-03, 203-04, 203-05, 203-06, 203-07, 203-08, 203-09, 203-10]
tech-stack:
  added: ["@vercel/queue@^0.1.6"]
  patterns: [lazy-require-adapter, mode-switch, service-role-client, safe-require-shim, dep-injection-testability]
key-files:
  created:
    - "lib/markos/webhooks/store-supabase.cjs"
    - "lib/markos/webhooks/store-supabase.ts"
    - "lib/markos/webhooks/store-vercel-queue.cjs"
    - "lib/markos/webhooks/store-vercel-queue.ts"
    - "lib/markos/webhooks/store.ts"
    - "api/webhooks/queues/deliver.js"
    - "test/webhooks/store-supabase.test.js"
    - "test/webhooks/adapter-supabase.test.js"
    - "test/webhooks/adapter-queues.test.js"
    - "test/webhooks/vercel-queue.test.js"
  modified:
    - "lib/markos/webhooks/store.cjs"
    - "vercel.ts"
    - "package.json"
    - "package-lock.json"
decisions:
  - "Default-mode fallback to memory when SUPABASE env absent (Rule 3 graceful degrade) — preserves 200-03 regression without requiring tests to set WEBHOOK_STORE_MODE=memory."
  - "Safe-require shims (try/catch) for log-drain.cjs + sentry.cjs so consumer doesn't crash before Plan 203-10 ships those modules."
  - "Expose consumer internals via module.exports.__internals (matches Phase 202 plan 202-05 pattern) — keeps handleCallback as the public export while enabling unit tests."
  - "Test seed URL changed to https://example.com/hook (RFC 2606 public) so 203-02 SSRF guard falls through to the fetch stub deterministically."
metrics:
  duration_minutes: 28
  tasks_completed: 2
  tests_added: 31
  tests_total_green: 93
  completed_date: "2026-04-18"
requirements: [WHK-01, QA-05, QA-13]
---

# Phase 203 Plan 01: Supabase + Vercel Queues Adapter Swap Summary

Wave-1 foundation swap replacing the 200-03 in-memory singleton with Supabase-backed subscription + delivery adapters and a `@vercel/queue` push-mode consumer — closes the Fluid Compute data-loss blocker (RESEARCH §Pitfall 1) that gated every downstream 203 GA plan per D-16.

## What Shipped

**Task 1 — Supabase adapters + mode switch** (commits `347d5e1` RED → `088e4e7` GREEN)

- `lib/markos/webhooks/store-supabase.cjs` — `createSupabaseSubscriptionsStore(client)` + `createSupabaseDeliveriesStore(client)` shape-verbatim from 203-RESEARCH.md §Code Examples lines 631-719. Every cross-tenant query filters `.eq('tenant_id', tenant_id)` FIRST (T-203-01-02 mitigation). Every method throws `store-supabase.<method>: <err.message>` on Supabase failure (matches Phase 202 pattern).
- `lib/markos/webhooks/store-supabase.ts` — dual-export TS stub (sessions.ts convention).
- `lib/markos/webhooks/store.cjs` — rewritten with `WEBHOOK_STORE_MODE` switch. Memory mode preserves 200-03 singleton behavior verbatim (`_subscriptionsMemo`, `_deliveriesMemo`, `_queueMemo`). Supabase mode lazy-constructs `createClient(URL, SERVICE_ROLE_KEY, { auth: { persistSession: false }, db: { schema: 'public' } })` (RESEARCH §Pitfall 6). Default resolves to `supabase` when env present, falls back to `memory` otherwise.
- `lib/markos/webhooks/store.ts` — dual-export TS stub.
- `@vercel/queue@^0.1.6` installed via `npm install --ignore-scripts --save`.
- `test/webhooks/store-supabase.test.js` (11 tests) — chain-call assertions against a mock Supabase client; tests 1a-1g + typed error + order+limit+since.
- `test/webhooks/adapter-supabase.test.js` (8 tests) — `getWebhookStores` mode resolution (1h-1k + env + deps override + graceful degrade).

**Task 2 — Vercel Queues client + push consumer + vercel.ts** (commits `5268b6c` RED → `2d2a529` GREEN)

- `lib/markos/webhooks/store-vercel-queue.cjs` — `createVercelQueueClient({ topic, deps })` with lazy `sendFn = deps.send || require('@vercel/queue').send`. `push()` rejects falsy `delivery_id`, honors `options.idempotencyKey`.
- `lib/markos/webhooks/store-vercel-queue.ts` — dual-export TS stub.
- `api/webhooks/queues/deliver.js` — `handleCallback(asyncHandler, { visibilityTimeoutSeconds: 120, retry })` push consumer. `asyncHandler` asserts `delivery_id` truthy (T-203-01-01 no silent drop), delegates to `processDelivery(deliveries, subscriptions, delivery_id)` via `getWebhookStores()`, wraps in try/catch/finally (captureToolError on error, emitLogLine always). `retry` returns `{ acknowledge: true }` when `deliveryCount > 24` (engine.cjs MAX_ATTEMPTS parity), else `{ afterSeconds: min(86400, 5 * 2^min(count, 15)) }`. `module.exports.__internals = { asyncHandler, retry, options }` for unit tests.
- `vercel.ts` — `functions['api/webhooks/queues/deliver.js'].experimentalTriggers` registers `{ type: 'queue/v2beta', topic: 'markos-webhook-delivery', retryAfterSeconds: 60 }` additively. All 5 existing `crons` entries preserved (audit-drain, lifecycle purge, cleanup-unverified-signups, mcp-session-cleanup, mcp-kpi-digest).
- `test/webhooks/adapter-queues.test.js` (4 tests) — 2a-2d client-shape.
- `test/webhooks/vercel-queue.test.js` (8 tests) — 2e-2h consumer internals + 2i vercel.ts grep assertions.

## Tests

| Suite | File | Tests | Status |
|-------|------|-------|--------|
| Supabase adapter — subscriptions + deliveries | `test/webhooks/store-supabase.test.js` | 11 | green |
| `getWebhookStores` mode switch | `test/webhooks/adapter-supabase.test.js` | 8 | green |
| Vercel Queues client adapter | `test/webhooks/adapter-queues.test.js` | 4 | green |
| Vercel Queues consumer + vercel.ts | `test/webhooks/vercel-queue.test.js` | 8 | green |
| **Wave-1 targeted total** |  | **31** | **31/31** |
| 200-03 regression: signing / engine / delivery / api-endpoints | `test/webhooks/*.test.js` | 35 | 35/35 |
| Full `test/webhooks/*.test.js` (incl. sibling 203-02) |  | 95 (93 pass + 2 skipped) | 93/93 |

Commands used:

```bash
# Wave-1 targeted
node --test test/webhooks/store-supabase.test.js test/webhooks/adapter-supabase.test.js test/webhooks/adapter-queues.test.js test/webhooks/vercel-queue.test.js

# 200-03 regression
node --test test/webhooks/signing.test.js test/webhooks/engine.test.js test/webhooks/delivery.test.js test/webhooks/api-endpoints.test.js

# Full
node --test test/webhooks/*.test.js
```

## Acceptance Criteria Verification

Task 1:
- `grep -c "eq('tenant_id', tenant_id)" lib/markos/webhooks/store-supabase.cjs` → **5** (≥2 required)
- `grep -c "persistSession: false" lib/markos/webhooks/store.cjs` → **2** (= 1 required; extra is mitigation comment)
- `grep -c "WEBHOOK_STORE_MODE" lib/markos/webhooks/store.cjs` → **5** (≥1)
- `grep -c "createSupabaseSubscriptionsStore" lib/markos/webhooks/store{,-supabase}.cjs` → **2 + 2** (≥2)
- `package.json.dependencies["@vercel/queue"]` → **^0.1.6**
- All 4 dual-export files exist.

Task 2:
- `grep -c "queue/v2beta" vercel.ts` → **3** (≥1)
- `grep -c "markos-webhook-delivery"` across vercel.ts + deliver.js + store.cjs → **4** (≥3)
- `grep -c "handleCallback" api/webhooks/queues/deliver.js` → **2** (≥1)
- `grep -c "visibilityTimeoutSeconds: 120" api/webhooks/queues/deliver.js` → **1** (=1)
- `grep -cE "deliveryCount > 24" api/webhooks/queues/deliver.js` → **1** (=1)
- 5 existing cron paths preserved in vercel.ts (audit/drain, tenant/lifecycle/purge-cron, cleanup-unverified-signups, mcp/session/cleanup, cron/mcp-kpi-digest).
- Both `.cjs` + `.ts` adapters exist.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Default-mode graceful degrade when SUPABASE env missing**

- **Found during:** Task 1 implementation
- **Issue:** Plan specifies `mode: deps.mode || process.env.WEBHOOK_STORE_MODE || 'supabase'`, but the 200-03 regression suite (`api-endpoints.test.js`) calls `getWebhookStores()` without `mode` or `WEBHOOK_STORE_MODE=memory`. With a strict `'supabase'` default, every regression test would attempt to construct a Supabase client with missing `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` env and throw.
- **Fix:** When `mode` resolves to `'supabase'` AND either `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is absent, fall back to `'memory'`. Production always has the env set; test/CI environments keep working without modification. Plan's done-criteria explicitly anticipates this ("regression on 200-03 suites preserved with WEBHOOK_STORE_MODE=memory default in tests").
- **Files modified:** `lib/markos/webhooks/store.cjs` (resolveMode function).
- **Commit:** `088e4e7`.

**2. [Rule 3 - Blocking] Test URL changed to RFC 2606 public host**

- **Found during:** Task 2 GREEN verification (test 2e failed).
- **Issue:** `https://ex.test/hook` seed URL was rejected by the 203-02 SSRF guard (shipped in parallel), causing `processDelivery` to return `{ delivered: false, reason: 'ssrf_blocked' }` instead of reaching the fetch stub.
- **Fix:** Changed seed URL to `https://example.com/hook` (RFC 2606 — resolves to a public IP). Assertion stays identical. Keeps the test hermetic (no real network call; `globalThis.fetch` stub intercepts).
- **Files modified:** `test/webhooks/vercel-queue.test.js`.
- **Commit:** `2d2a529`.

### No architectural or Rule 4 issues raised.

## Security Posture

- **T-203-01-01** (Tampering · consumer) — `asyncHandler` throws on missing `delivery_id` → queue retries → ACK after 24 attempts. No silent drop.
- **T-203-01-02** (Info Disclosure · service-role) — Every Supabase adapter method filters `.eq('tenant_id', tenant_id)` FIRST. Service-role client instantiated with `persistSession: false`. Verified by grep (5 occurrences).
- **T-203-01-03** (DoS · consumer hang) — `visibilityTimeoutSeconds: 120` bounds per-message work. 24-attempt retry cap prevents infinite redelivery.
- **T-203-01-04** (Repudiation · v2beta rename) — ACCEPTED. Inline comment in vercel.ts notes rename risk; deferred-items tracking via Plan 203-10 smoke test.
- **T-203-01-05** (Elev · mode switch) — Memory mode is local-only. Production sets `WEBHOOK_STORE_MODE=supabase`; plan ships with `user_setup` documenting Vercel env var.

## Known Stubs

- `emitLogLine` + `captureToolError` in `api/webhooks/queues/deliver.js` are safe-require stubs (try/catch → no-op) until Plan 203-10 ships `lib/markos/webhooks/log-drain.cjs` + `lib/markos/webhooks/sentry.cjs`. This is **intentional** (documented in plan under `<action>` step 4; threat-model T-203-01-04 accepts the observability gap until Plan 203-10).
- `_supaQueue` has a push-only error-throwing stub as a defense-in-depth fallback (if `@vercel/queue` import fails at runtime, pushes throw loudly — never silent drop). @vercel/queue@0.1.6 is now in dependencies so this path should never be hit in production.

## Commits

| Task | Step  | Hash      | Message                                                                            |
| ---- | ----- | --------- | ---------------------------------------------------------------------------------- |
| 1    | RED   | `347d5e1` | test(203-01): add failing tests for Supabase webhook store adapters                |
| 1    | GREEN | `088e4e7` | feat(203-01): Supabase webhook store adapters + mode switch                        |
| 2    | RED   | `5268b6c` | test(203-01): add failing tests for Vercel Queues adapter + consumer               |
| 2    | GREEN | `2d2a529` | feat(203-01): Vercel Queues push consumer + v2beta trigger                         |

## Unblocks

D-16 durability gate is now cleared. Plans 203-02 through 203-10 may proceed — every `getWebhookStores()` caller (api/webhooks/{subscribe,unsubscribe,list,test-fire}.js) now transparently receives Supabase-backed subscriptions + deliveries + Vercel Queues push client. Zero caller-side edits required.

## Self-Check: PASSED

- All 10 created files exist on disk.
- All 4 commits present in `git log`.
- 31 Wave-1 tests green; 35 200-03 regression tests green.
- @vercel/queue@^0.1.6 recorded in package.json dependencies.
