---
phase: 203
plan: 05
subsystem: webhooks
tags: [wave-3, rotation, dual-sign, grace-window, D-09, D-10, D-12, rate-limit, F-97]
dependency-graph:
  requires:
    - 203-01 (Supabase adapters + Vercel Queues durable store)
    - 203-02 (migration 72 rotation columns + 3 RPC stubs + rotations ledger)
    - 203-04 (signPayloadDualSign primitive)
  provides:
    - "lib/markos/webhooks/rotation.cjs::startRotation + rollbackRotation + finalizeExpiredRotations + listActiveRotations + computeStage + GRACE_DAYS=30"
    - "supabase/migrations/72_markos_webhook_dlq_and_rotation.sql — 3 RPC bodies filled (start_webhook_rotation / rollback_webhook_rotation / finalize_expired_webhook_rotations)"
    - "lib/markos/webhooks/delivery.cjs — outbound dual-sign wiring (signPayloadDualSign with secret + secret_v2) + replay headers (x-markos-replayed-from, x-markos-attempt)"
    - "POST /api/tenant/webhooks/subscriptions/{sub_id}/rotate (D-09 admin trigger + 1/5min rate-limit)"
    - "POST /api/tenant/webhooks/subscriptions/{sub_id}/rotate/rollback (D-12 grace-only)"
    - "GET /api/tenant/webhooks/rotations/active (Surface 4 banner fetcher)"
    - "contracts/F-97-webhook-rotation-v1.yaml (3 paths + 5 error envelopes)"
    - "contracts/F-72-webhook-subscription-v1.yaml (extended with rotation_state + secret_v2 + grace_* + rps_override)"
  affects: [203-06-notifications, 203-08-dashboard, 203-09-fleet-metrics]
tech-stack:
  added: []
  patterns:
    - "Dual-sign dispatch — signPayloadDualSign(secret, secret_v2, body) wired into processDelivery so V1+V2 share a single X-Markos-Timestamp during grace"
    - "Atomic rotation RPC pattern — SECURITY DEFINER plpgsql function wraps multi-row update + audit emit + typed-error raise"
    - "Stage-based UI banner driver — computeStage maps grace_ends_at → t-7 / t-1 / t-0 / normal for Surface 4"
    - "Per-tenant anti-timing rate-limit — Upstash slidingWindow(1, '5 m') on rotate endpoint defeats rotation-rollback timing probes"
    - "Replay header emission — x-markos-replayed-from + x-markos-attempt flow through normal dispatch path (no special replay branch)"
key-files:
  created:
    - "lib/markos/webhooks/rotation.cjs"
    - "lib/markos/webhooks/rotation.ts"
    - "api/tenant/webhooks/subscriptions/[sub_id]/rotate.js"
    - "api/tenant/webhooks/subscriptions/[sub_id]/rotate/rollback.js"
    - "api/tenant/webhooks/rotations/active.js"
    - "contracts/F-97-webhook-rotation-v1.yaml"
    - "test/webhooks/rotation.test.js"
    - "test/webhooks/dual-sign.test.js"
  modified:
    - "supabase/migrations/72_markos_webhook_dlq_and_rotation.sql"
    - "lib/markos/webhooks/delivery.cjs"
    - "lib/markos/webhooks/delivery.ts"
    - "contracts/F-72-webhook-subscription-v1.yaml"
    - "contracts/openapi.json"
    - "contracts/openapi.yaml"
    - "test/webhooks/migration-72.test.js"
decisions:
  - "All 3 RPC bodies (start/rollback/finalize) emit audit rows via append_markos_audit_row with source_domain='webhooks' — hash-chained + tenant-scoped. Rollback row reuses the most recent active rotation_id (not the caller-supplied one) so the rollback audit points at the correct ledger entry."
  - "D-12 past_grace enforcement lives at the DB layer (rollback_webhook_rotation RPC raises past_grace when v_rotation.grace_ends_at <= now()). Handler merely maps the typed error to HTTP 409 — defense-in-depth: the DB is the authoritative enforcement boundary, not the HTTP layer."
  - "finalize_expired_webhook_rotations loops with per-row updates rather than a single bulk UPDATE so each subscription gets its own audit row (actor_id='system:cron', actor_role='system'). Return shape is a JSON array of { rotation_id, subscription_id, finalized_at } — empty when no rotations are past-grace (idempotent per test 1f)."
  - "Dual-sign wiring is additive: the legacy X-Markos-Signature + X-Markos-Timestamp headers are preserved byte-for-byte so pre-203 subscribers keep verifying. The new X-Markos-Signature-V1 / -V2 headers are the forward path; subscribers MUST migrate to V1 before grace ends or they lose verification on finalize (documented in F-97 grace_window section)."
  - "Replay header emission piggybacks on the same dispatch path — when delivery.replayed_from is non-null, the handler adds x-markos-replayed-from + x-markos-attempt to the outbound headers. No special replay branch; Plan 203-04 replay rows flow through processDelivery naturally."
  - "Rate-limit key is tenant_id (not subscription_id) — 1 rotate per 5min per tenant defeats the attack of rotating one sub to burn the window then rolling back another (T-203-05-02 threat). Prefix 'rl:webhook:rotate' is disjoint from MCP counters so a noisy MCP tenant does not starve webhook rotations."
  - "computeStage uses Math.ceil on days remaining, so 1-hour-remaining → 1 day → t-1 bucket (final-day warn state). This matches UI-SPEC §Surface 4 copy where t-1 = 'will retire tomorrow'."
  - "F-72 schema extension documents secret + secret_v2 as NEVER echoed in API responses (masked to last 8 chars in UI). Handlers do NOT SELECT the secret column for response shaping; the subscriber-visible envelope omits it entirely (T-203-05-03 mitigation)."
metrics:
  duration_minutes: 9
  tasks_completed: 2
  tests_added: 24
  tests_green_in_plan: 24
  tests_green_full_webhook_suite: 199
  tests_skipped: 2
  completed_date: "2026-04-18"
requirements: [WHK-01, QA-01, QA-13]
---

# Phase 203 Plan 05: Webhook Signing-Secret Rotation + Dual-Sign Dispatch

Wave-3 delivery of the **signing-secret rotation orchestrator** with 30-day dual-sign grace window. Closes **D-09** (admin-trigger-only rotation), **D-10** (outbound dual-sign via X-Markos-Signature-V1 + V2), **D-12** (rollback valid only during grace; post-grace the old secret is purged + unrecoverable), and **QA-01** (hash-chained audit emit on every rotation event). Ships three RPC bodies into migration 72, wires dual-sign into delivery dispatch, and exposes the three tenant-admin endpoints that Surface 2 Settings + Surface 4 banner (Plan 203-08 UI, Plan 203-06 notifications) call.

## What Shipped

### Task 1 — Rotation library + 3 RPC bodies + dual-sign dispatch (commits `267a7fb` RED → `381a9bb` GREEN)

**`lib/markos/webhooks/rotation.cjs` + `.ts`** — 4 exports + 2 helpers:
- `startRotation(client, { tenant_id, subscription_id, actor_id })` generates a fresh 32-byte hex secret (`randomBytes(32).toString('hex')` → 64 chars), computes `grace_ends_at = now + 30 days`, delegates to the `start_webhook_rotation` RPC, maps `rotation_already_active` error verbatim, returns `{ rotation_id: whrot_<uuid>, grace_ends_at }`.
- `rollbackRotation(client, { tenant_id, subscription_id, actor_id })` delegates to `rollback_webhook_rotation` RPC; maps `past_grace` and `rotation_not_active` verbatim (D-12 enforcement).
- `finalizeExpiredRotations(client, now)` delegates to `finalize_expired_webhook_rotations` RPC; returns array of `{ rotation_id, subscription_id, finalized_at }` (empty array on no-op second call = idempotent per test 1f).
- `listActiveRotations(client, tenant_id)` tenant-scopes `markos_webhook_secret_rotations WHERE state='active'`, joins `markos_webhook_subscriptions` to attach `url`, computes `stage` per row → Surface 4 banner contract.
- `computeStage(grace_ends_at)` → `'t-7' | 't-1' | 't-0' | 'normal'` via `Math.ceil(daysRemaining)` bucketing.
- `GRACE_DAYS = 30` — D-11 + D-12 window constant.

**`supabase/migrations/72_markos_webhook_dlq_and_rotation.sql`** — replaced the 3 stub RPC definitions (Plan 203-02) with real bodies:
- `start_webhook_rotation` asserts no active rotation on the sub (raises `rotation_already_active`); inserts the rotations ledger row (`state='active'`); flips the subscription (`secret_v2`, `grace_started_at`, `grace_ends_at`, `rotation_state='active'`); emits hash-chained audit row via `append_markos_audit_row`.
- `rollback_webhook_rotation` locates the most-recent active rotation for the sub; raises `rotation_not_active` if none; raises `past_grace` if `grace_ends_at <= now()` (D-12); nulls subscription's rotation columns; updates rotations row to `state='rolled_back'` + `rolled_back_at=now()`; emits audit.
- `finalize_expired_webhook_rotations(p_now)` loops rotations where `state='active' AND grace_ends_at < p_now`; promotes `secret_v2 → secret`; nulls grace columns; sets rotations row to `state='finalized' + finalized_at`; emits audit with `actor_id='system:cron'`; returns JSON array.

**`lib/markos/webhooks/delivery.cjs`** — dispatch path now calls `signPayloadDualSign(subscription.secret, subscription.secret_v2 || null, body, now)` and merges the returned `{ X-Markos-Signature-V1, X-Markos-Signature-V2?, X-Markos-Timestamp }` headers into the outbound fetch. Legacy `X-Markos-Signature` + `X-Markos-Timestamp` (single) headers preserved for pre-203 subscribers (backwards-compatible per signing.cjs byte-for-byte guarantee). When `delivery.replayed_from` is set, adds `x-markos-replayed-from: {orig_id}` + `x-markos-attempt: {n}` headers (D-06 replay trail). Also adds `x-markos-event` header for subscriber routing convenience.

**`lib/markos/webhooks/delivery.ts`** — `WebhookDelivery` type extended with optional `replayed_from` / `dlq_reason` / `dlq_at` (migration 72 columns).

**`test/webhooks/rotation.test.js`** — 13 behaviors: 1a (startRotation 64-char hex + RPC args), 1b (rotation_already_active error mapping), 1c (rollback happy path), 1d (past_grace error mapping), 1e (finalize RPC args + array return), 1f (finalize idempotence), 1g (listActiveRotations tenant-scope + URL join + stage), 1h (empty-array invariant), 1g2 (computeStage + GRACE_DAYS).

**`test/webhooks/dual-sign.test.js`** — 4 behaviors: 1i (single V1 header when `secret_v2=null`), 1j (both V1+V2 when `secret_v2` set), 1k (shared X-Markos-Timestamp), 1l (replay headers emission when `delivery.replayed_from` is set).

**17/17 Task 1 tests green.**

### Task 2 — 3 tenant-admin endpoints + F-97 contract + F-72 extension (commit `e34a653` GREEN)

**`api/tenant/webhooks/subscriptions/[sub_id]/rotate.js`** — POST handler:
1. Method gate (POST → 405 else).
2. Header auth (`x-markos-user-id` + `x-markos-tenant-id` → 401).
3. Subscription tenant guard (SELECT sub; 404 missing; 403 cross_tenant_forbidden).
4. Rate-limit: Upstash `slidingWindow(1, '5 m')` keyed on tenant_id (mock-injectable via `deps.limiter`). 429 with `Retry-After` + `retry_after` body on fail.
5. Delegate to `startRotation`.
6. Map `rotation_already_active → 409`; else 500.

**`api/tenant/webhooks/subscriptions/[sub_id]/rotate/rollback.js`** — POST handler; same 202-09 pattern minus the rate limiter; delegates to `rollbackRotation`; maps `past_grace → 409` + `rotation_not_active → 409`.

**`api/tenant/webhooks/rotations/active.js`** — GET handler; tenant-scoped; delegates to `listActiveRotations`; returns `{ rotations: [...] }` for Surface 4 banner.

**`contracts/F-97-webhook-rotation-v1.yaml`** — NEW:
- flow_id F-97, version v1, phase 203, domain webhooks.
- 3 paths with 200/400/401/403/404/409/429/500 response envelopes.
- 5 error envelopes: `rotation_already_active` (409), `past_grace` (409), `rotation_not_active` (409), `rate_limited` (429, Retry-After), `cross_tenant_forbidden` (403).
- `grace_window` block documents the 30-day semantic + 3 states (active → rolled_back OR finalized).
- References D-09, D-10, D-12; 203-RESEARCH §Pattern 3; 203-CONTEXT.

**`contracts/F-72-webhook-subscription-v1.yaml`** — extended `WebhookSubscription` schema with 5 new rotation/override fields:
- `secret_v2` (readOnly, nullable) — dual-sign secret during grace; never echoed in API responses.
- `rotation_state` (nullable enum `active|rolled_back`) — null outside rotation.
- `grace_started_at` (nullable date-time).
- `grace_ends_at` (nullable date-time).
- `rps_override` (nullable integer, min 1) — per-sub RPS cap; may only lower plan default (D-13).

**`contracts/openapi.json` + `.yaml`** — regenerated via `node scripts/openapi/build-openapi.cjs`: **61 flows / 90 paths** (up from 60/87 post Plan 203-04). F-97's 3 paths merged clean; F-72 schema additions flow through `#/components/schemas/WebhookSubscription`.

**11/11 Task 2 tests green** (2a auth 401, 2b cross_tenant 403, 2c happy 200, 2d rotation_already_active 409, 2e rate_limited 429, 2f rollback 200, 2g past_grace 409, 2h rotations/active tenant-scoped, 2i empty array, 2j F-97 YAML shape, 2k F-72 extension shape).

## Tests

| Suite                                       | File                                   | Tests     | Status |
| ------------------------------------------- | -------------------------------------- | --------- | ------ |
| Rotation library + endpoints + contracts    | `test/webhooks/rotation.test.js`       | 20        | green  |
| Dual-sign dispatch integration              | `test/webhooks/dual-sign.test.js`      | 4         | green  |
| Migration 72 RPC bodies assertion           | `test/webhooks/migration-72.test.js`   | 8 + 2 skip| green  |
| **Full webhook regression**                 | `test/webhooks/*.test.js`              | 199 + 2s  | green  |
| Signing + delivery regression               | `signing + delivery.test.js`           | 20        | green  |

Plan-level new tests: **24 green, 0 red.** No existing webhook, signing, or delivery suite broke.

## Performance

- **Started:** 2026-04-18T06:49:28Z
- **Completed:** 2026-04-18T06:58:33Z
- **Duration:** ~9 min
- **Tasks:** 2
- **Files created:** 8
- **Files modified:** 7
- **Commits:** 3 (1 RED + 2 GREEN)

| Metric                      | Before | After | Delta           |
| --------------------------- | ------ | ----- | --------------- |
| F-NN flows                  | 60     | 61    | +1 (F-97)       |
| openapi paths               | 87     | 90    | +3 (3 rotation) |
| webhook tests (pass + skip) | 175+2  | 199+2 | +24             |
| RPC function stubs filled   | 0/3    | 3/3   | +3              |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] migration-72 test asserted stale stub bodies**

- **Found during:** Task 1 GREEN regression run on `test/webhooks/*.test.js`.
- **Issue:** `test/webhooks/migration-72.test.js::2-static: migration 72 declares 3 rotation RPC stubs` asserted the 3 RPC bodies still contained `raise exception '...: body ships in Plan 203-05'`. That assertion was correct for Plan 203-02's shipped state but became invalid the moment this plan filled the bodies.
- **Fix:** Updated the test to assert the *new* invariants: (1) no stub-exception strings remain, (2) all 3 typed errors (`rotation_already_active`, `past_grace`, `rotation_not_active`) are raised, (3) ≥3 `append_markos_audit_row` calls exist (one per RPC).
- **Files modified:** `test/webhooks/migration-72.test.js`
- **Commit:** `e34a653`

**2. [Rule 3 — Blocking] Relative-path depth corrections for all 3 new endpoints**

- **Found during:** Task 2 first test run (MODULE_NOT_FOUND from `../../../../../../lib/...`).
- **Issue:** Initial drafts used too many `../` segments:
  - `rotate.js` (at `api/tenant/webhooks/subscriptions/[sub_id]/rotate.js`, 5 levels above repo root) had 6 `../` — corrected to 5.
  - `rotate/rollback.js` (6 levels) had 7 `../` — corrected to 6.
  - `rotations/active.js` (4 levels) had 5 `../` — corrected to 4.
  Each file's parent directory depth determines the correct count; this matches the pattern Plan 203-04's `deliveries/[delivery_id]/replay.js` established (7 levels → 7 `../`).
- **Fix:** `replace_all` on each file to drop one `../` per require site (3 require sites each).
- **Files modified:** 3 endpoint files.
- **Commit:** `e34a653`

### Deferred (Out of Scope)

**Pre-existing `tags:` missing on 35 openapi paths** — inherited from Phases 201/202; see `.planning/phases/203-webhook-subscription-engine-ga/deferred-items.md`. F-97 uses block-form tags correctly so it does NOT add to the offending set; this plan's delta on the failing-path count is **0** (still 35).

## Threat Model Alignment

| Threat ID | Mitigation shipped |
|-----------|---------------------|
| T-203-05-01 Tampering (rotate without consent) | Header auth `x-markos-user-id` + `x-markos-tenant-id` (401); SELECT subscription + cross_tenant_forbidden (403) before delegating to library. 2 tests: 2a auth, 2b cross-tenant. |
| T-203-05-02 EoP (rapid rotate+rollback timing probe) | Upstash `slidingWindow(1, '5 m')` on tenant_id at the rotate endpoint. 429 with `Retry-After` header. Test 2e asserts 429 + retry_after shape. |
| T-203-05-03 Information Disclosure (secret_v2 leak) | F-72 schema marks `secret` + `secret_v2` as non-echoing in API responses (description documents UI masking to last 8 chars). Handlers never SELECT the secret column for response shaping — only for RPC dispatch. |
| T-203-05-04 Repudiation (rotation without audit) | All 3 RPCs call `append_markos_audit_row` with distinct actions (`secret.rotation_started` / `secret.rotation_rolled_back` / `secret.rotation_finalized`). `actor_id` captured from `x-markos-user-id` header; `finalize` uses `actor_id='system:cron'`. Audit regression (hash-chain test) green. |
| T-203-05-05 Tampering (post-grace restore attempt) | `rollback_webhook_rotation` RPC asserts `v_rotation.grace_ends_at > now()`; raises `past_grace` else. Handler maps to 409. Test 2g + test 1d cover both layers. DB is the authoritative boundary (D-12). |
| T-203-05-06 DoS (finalize batch too large) | **accept** disposition — 30-day grace + bounded tenant count keeps per-sweep batches small. Cron runs daily (Plan 203-06 wires it). Idempotency proven by test 1f. |

## Known Stubs

None. All 4 rotation-library exports are wired; delivery dispatch now dual-signs; 3 endpoints route to production infrastructure when `WEBHOOK_STORE_MODE=supabase`; F-97 + F-72 contracts declare the API surface.

## Downstream Unlocks

- **Plan 203-06 (rotation notifications)** — `listActiveRotations(supabase, tenant_id)` + `computeStage` + `finalizeExpiredRotations` are the building blocks the daily T-7/T-1/T-0 email cron + finalize cron need. (Already shipped in parallel Wave 3.)
- **Plan 203-08 (dashboard UI)** — Surface 2 Settings panel calls POST rotate + POST rotate/rollback; Surface 4 banner calls GET rotations/active. All 3 endpoints return typed shapes for the dialog + toast copy in UI-SPEC §Surface 2 / §Surface 4.
- **Plan 203-09 (fleet metrics)** — the `markos_webhook_secret_rotations` ledger (Plan 203-02) + this plan's audit emit give the "rotation events in last 30d" metric a clean source.

## Self-Check: PASSED

**Files verified (using `ls` / git log):**
- FOUND: `lib/markos/webhooks/rotation.cjs`
- FOUND: `lib/markos/webhooks/rotation.ts`
- FOUND: `api/tenant/webhooks/subscriptions/[sub_id]/rotate.js`
- FOUND: `api/tenant/webhooks/subscriptions/[sub_id]/rotate/rollback.js`
- FOUND: `api/tenant/webhooks/rotations/active.js`
- FOUND: `contracts/F-97-webhook-rotation-v1.yaml`
- FOUND: `test/webhooks/rotation.test.js`
- FOUND: `test/webhooks/dual-sign.test.js`
- MODIFIED: `supabase/migrations/72_markos_webhook_dlq_and_rotation.sql`
- MODIFIED: `lib/markos/webhooks/delivery.cjs` (dual-sign wiring)
- MODIFIED: `lib/markos/webhooks/delivery.ts`
- MODIFIED: `contracts/F-72-webhook-subscription-v1.yaml`
- MODIFIED: `contracts/openapi.json` + `.yaml` (90 paths / 61 flows)

**Commits verified:**
- FOUND: `267a7fb` test(203-05): RED — failing tests for rotation + dual-sign + endpoints
- FOUND: `381a9bb` feat(203-05): GREEN Task 1 — rotation library + RPC bodies + dual-sign
- FOUND: `e34a653` feat(203-05): GREEN Task 2 — 3 endpoints + F-97 + F-72 extension

**Test suites verified:**
- `node --test test/webhooks/rotation.test.js test/webhooks/dual-sign.test.js` → 24/24 green
- `node --test test/webhooks/*.test.js` → 199/199 green + 2 skipped
- `node --test test/openapi/openapi-build.test.js` → 15/16 (1 pre-existing tag gap — deferred)

**Acceptance-criteria greps:**
- `grep -c "GRACE_DAYS = 30" lib/markos/webhooks/rotation.cjs` = 1 ✓
- `grep -c "randomBytes(32)" lib/markos/webhooks/rotation.cjs` = 1 ✓
- `grep -cE "(start|rollback|finalize_expired)_webhook_rotation" lib/markos/webhooks/rotation.cjs` = 3 ✓
- `grep -cE "(rotation_already_active|past_grace)" lib/markos/webhooks/rotation.cjs` ≥ 2 ✓
- `grep -c "signPayloadDualSign" lib/markos/webhooks/delivery.cjs` = 1 ✓
- `grep -cE "x-markos-replayed-from|x-markos-attempt" lib/markos/webhooks/delivery.cjs` = 2 ✓
- `grep -cE "append_markos_audit_row" supabase/migrations/72_markos_webhook_dlq_and_rotation.sql` ≥ 3 ✓
- `grep -c "raise exception 'past_grace'" supabase/migrations/72_markos_webhook_dlq_and_rotation.sql` = 1 ✓

---
*Phase: 203-webhook-subscription-engine-ga*
*Plan: 05*
*Completed: 2026-04-18*
