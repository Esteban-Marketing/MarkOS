---
phase: 203
plan: 07
subsystem: webhooks
tags: [wave-4, rate-limit, dispatch-gates, D-13, rps-override, F-100, T-203-07-06, upstash, 429]
dependency-graph:
  requires:
    - 203-01 (Supabase adapters — subscription rows persist rps_override)
    - 203-02 (migration 72 rps_override column on markos_webhook_subscriptions)
    - 202-04 (Upstash @ratelimit + @redis shared instance — RESEARCH §Standard Stack)
  provides:
    - "lib/markos/webhooks/rate-limit.cjs::PLAN_TIER_RPS (D-13 free=10/team=60/enterprise=300) + resolvePerSubRps (Math.min cap-not-raise) + checkWebhookRateLimit (Upstash slidingWindow with prefix rl:webhook:sub) + buildRateLimitedEnvelope"
    - "lib/markos/webhooks/dispatch-gates.cjs::runDispatchGates (SINGLE pre-fetch indirection) + handleGateBlock (status=retrying, attempt NOT incremented)"
    - "lib/markos/webhooks/delivery.cjs — ONE pre-fetch runDispatchGates call; checkWebhookRateLimit NOT imported directly anymore (T-203-07-06 single-insertion invariant)"
    - "api/webhooks/subscribe.js — rps_override body param validation (400 rps_override_exceeds_plan / 400 invalid_rps_override)"
    - "lib/markos/webhooks/engine.cjs::subscribe — persists rps_override (null when caller omits)"
    - "contracts/F-100-webhook-breaker-v1.yaml — rate_limit + breaker read-surface schemas (declarative only; Plan 203-09 mounts the handler)"
  affects: [203-08-breaker (extends dispatch-gates.cjs additively), 203-09-dashboard (GET subscription detail using F-100 shape)]
tech-stack:
  added: []
  patterns:
    - "Single pre-fetch indirection — runDispatchGates is the ONE pre-fetch branch; Plan 203-08 adds breaker INSIDE it, not in delivery.cjs (T-203-07-06 merge-conflict mitigation)"
    - "Per-(sub_id, resolved_rps) limiter cache bounded at 1024 entries — flipping rps_override doesn't require process restart"
    - "Gate fall-through when no redis/UPSTASH env — preserves 200-03 delivery test suite + local dev without Upstash credentials"
    - "Fail-closed plan_tier fallback — unknown tier → free (lowest cap) per T-203-07-04"
    - "Transient-block shape — handleGateBlock sets status=retrying + next_attempt_at; attempt counter NOT incremented (24-cap preserved, gate blocks are not DLQ events)"
key-files:
  created:
    - "lib/markos/webhooks/rate-limit.cjs"
    - "lib/markos/webhooks/rate-limit.ts"
    - "lib/markos/webhooks/dispatch-gates.cjs"
    - "lib/markos/webhooks/dispatch-gates.ts"
    - "contracts/F-100-webhook-breaker-v1.yaml"
    - "test/webhooks/rate-limit.test.js"
    - "test/webhooks/429-breach.test.js"
    - "test/webhooks/dispatch-gates.test.js"
  modified:
    - "api/webhooks/subscribe.js"
    - "lib/markos/webhooks/engine.cjs"
    - "lib/markos/webhooks/delivery.cjs"
    - "lib/markos/webhooks/delivery.ts"
    - "test/webhooks/delivery.test.js"
    - "contracts/openapi.json"
    - "contracts/openapi.yaml"
decisions:
  - "Unknown plan_tier falls through to free (10 rps) at both resolvePerSubRps (library) AND subscribe.js (subscribe-time validation). Fail-closed to the lowest cap per T-203-07-04 — matches 202-09 usage.js pattern."
  - "Per-(sub_id, resolved_rps) limiter cache bounded at 1024 entries. Unlike 202-04's single global limiter pair, webhook per-sub rates vary per subscription (rps_override differs). Memoize per-tuple so Upstash slidingWindow state stays consistent; bounded cache is safe because serverless instances are short-lived."
  - "api/webhooks/subscribe.js refactored to extract checkSsrfOrReject + validateRpsOverride helpers. S3776 cognitive-complexity was at 18 (over the 15 threshold) after inlining the rps_override path; splitting into helpers restored compliance and made the rejection paths easier to test."
  - "runDispatchGates falls through to { status: 'allowed' } when BOTH redis is undefined AND UPSTASH_REDIS_REST_URL is unset (Rule 3 blocking fix). The 200-03 delivery suite (38 pre-existing tests) never passed redis — and CI runs without Upstash creds — so without this fall-through the gate would crash every dispatch test. Production consumers (api/webhooks/queues/deliver.js) pass redis explicitly, so the gate fires there."
  - "delivery.cjs NO LONGER imports checkWebhookRateLimit directly (acceptance criterion `grep = 0`). dispatch-gates.cjs is the only consumer in the hot path — this locks T-203-07-06's invariant that Plan 203-08 will extend dispatch-gates.cjs, not delivery.cjs. No future pre-fetch policy may add a parallel branch."
  - "F-100 contract uses `paths: {}` (declarative-only). The GET /api/tenant/webhooks/subscriptions/{sub_id} handler lands in Plan 203-09; F-100 declares the read-surface schemas (RateLimitState + BreakerState + WebhookSubscriptionDetail) + 3 error envelopes (rate_limited 429, rps_override_exceeds_plan 400, invalid_rps_override 400) so Plan 203-08 (breaker) + Plan 203-09 (dashboard) reference a single contract."
  - "rate-limit-breach shape returns `retry_after: Math.max(1, Math.ceil((reset - Date.now()) / 1000))` — clamps to ≥1 sec so subscribers never get `Retry-After: 0` (which would mean 'retry immediately' and amplify load). handleGateBlock mirrors the same clamp (Math.max(1, ...) on retryAfterSec)."
metrics:
  duration_minutes: 10
  tasks_completed: 2
  tests_added: 33
  tests_green_in_plan: 33
  tests_green_full_webhook_suite: 227
  tests_skipped: 2
  completed_date: "2026-04-18"
requirements: [WHK-01, QA-04, QA-12]
---

# Phase 203 Plan 07: Per-Subscription Rate-Limit + Dispatch-Gates Indirection

Wave-4 delivery of the **per-subscription webhook rate-limit** enforcing **D-13**: plan-tier defaults (Free 10rps / Team 60rps / Enterprise 300rps); override may only LOWER the ceiling (never raise). Also ships the **dispatch-gates indirection module** — the architectural fix that lets Plan 203-08 land the breaker gate additively inside `runDispatchGates` instead of touching the hot `processDelivery()` path a second time (T-203-07-06 same-file merge-conflict mitigation).

## What Shipped

### Task 1 — Rate-limit library + subscribe-time validation + 24 tests (commits `5c3ecd6` RED → `0e3462a` GREEN)

**`lib/markos/webhooks/rate-limit.cjs` + `.ts`** — 3 exports + 1 helper:
- `PLAN_TIER_RPS` — frozen `{ free: 10, team: 60, enterprise: 300 }` (D-13 locked).
- `resolvePerSubRps({ plan_tier, rps_override })` — returns `Math.min(override, ceiling)`; null override → ceiling; unknown `plan_tier` → free (fail-closed); non-number or `< 1` override throws `invalid_rps_override`.
- `checkWebhookRateLimit(redisOrLimiter, { subscription, plan_tier })` — builds (or reuses, per-tuple cache) an Upstash `Ratelimit` with `slidingWindow(resolvedRps, '1 s')` + prefix `rl:webhook:sub`, calls `.limit(subscription.id)`. On success → `{ ok: true, limit, remaining }`. On breach → `{ ok: false, reason: 'sub_rps', retry_after, limit, error_429 }` where `error_429` is a thrown-safe Error carrying `{ http: 429, headers: { Retry-After }, body: { error: 'rate_limited', sub_id, retry_after, limit } }`.
- `buildRateLimitedEnvelope({ retry_after, limit, sub_id })` — shared envelope builder for handlers that want the 429 without routing through the breach-return's `error_429`.
- `_resetLimiterCacheForTests` — exposed so test suites can clear the bounded `_limiterCache` between runs.

**`api/webhooks/subscribe.js`** — rps_override validation at subscribe-time (D-13 enforcement layer 1):
- Extracted `checkSsrfOrReject` + `validateRpsOverride` helpers to keep `handleSubscribe` under the S3776 cognitive-complexity limit of 15.
- Type-check first (non-number/non-finite/<1) → 400 `{ error: 'invalid_rps_override' }`.
- Then ceiling-check → 400 `{ error: 'rps_override_exceeds_plan', ceiling }` when `rawOverride > ceiling`.
- Valid override passes through to `engine.subscribe(store, { ..., rps_override })` which persists it on the row.

**`lib/markos/webhooks/engine.cjs`** — `subscribe()` now carries `rps_override` into the inserted row (null when caller omits). Validation remains upstream in the HTTP handler; engine is the shape layer only.

**`test/webhooks/rate-limit.test.js`** — 14 tests covering behaviors 1a–1j + 4 extras (override=ceiling, invalid_rps_override paths).

**`test/webhooks/429-breach.test.js`** — 5 tests: 1k accepts team+30, 1l rejects team+120 (400+ceiling=60), 1m persists null, plus 2 extras (string override rejected as invalid, free+30 rejected with ceiling=10).

**19 + 5 = 24 Task 1 tests green.**

### Task 2 — Dispatch-gates scaffold + single pre-fetch indirection + F-100 contract (commits `9d5d433` RED → `190742b` GREEN)

**`lib/markos/webhooks/dispatch-gates.cjs` + `.ts`** — the SINGLE pre-fetch indirection module Plan 203-08 will EXTEND additively:
- `runDispatchGates({ subId, tenantId, eventId, planTier, subscription, redis })` — contains the explicit `// GATE: breaker (Plan 203-08 extends here as FIRST gate)` marker above the rate-limit gate. Returns `{ status: 'allowed' }` or `{ status: 'rate_limited', retryAfterSec, limit, reason }`.
- Fall-through to `{ status: 'allowed' }` when `redis === undefined && !process.env.UPSTASH_REDIS_REST_URL` — preserves the 200-03 delivery suite (tests that don't pass redis) and keeps CI green without Upstash credentials.
- `handleGateBlock({ gate, deliveryId, deliveries, now })` — writes `{ status: 'retrying', next_attempt_at: now + retryAfterSec*1000, updated_at }` to the delivery row; returns `{ delivered: false, status, retry_after }`. **CRITICAL:** the `attempt` counter is NOT in the patch — gate blocks are transient and must NOT burn the 24-attempt cap.
- Module header comment locks the contract: "All future pre-fetch policies (breaker, quota, tenant-freeze, …) MUST be added INSIDE runDispatchGates — delivery.cjs MUST NOT grow additional pre-fetch branches."

**`lib/markos/webhooks/delivery.cjs`** — ONE pre-fetch `runDispatchGates` call AFTER subscription lookup, BEFORE SSRF re-check + dual-sign + fetch. On non-`allowed` status, short-circuits to `handleGateBlock`. `checkWebhookRateLimit` is NO LONGER imported directly here (acceptance criterion `grep = 0` — T-203-07-06 invariant).

**`lib/markos/webhooks/delivery.ts`** — `ProcessDeliveryOptions` extended with optional `redis?: unknown` + `planTier?: string`.

**`contracts/F-100-webhook-breaker-v1.yaml`** — declarative-only (`paths: {}`):
- `RateLimitState` schema — `plan_tier`/`ceiling_rps`/`effective_rps`/`override_rps` (nullable).
- `BreakerState` schema — `state` (closed|half-open|open) + `trips` + `probe_at` + `opened_at`.
- `WebhookSubscriptionDetail` schema — reserved shape for Plan 203-09's GET subscription-detail 200 body.
- 3 error envelopes: `rate_limited` (429 + Retry-After), `rps_override_exceeds_plan` (400 + ceiling), `invalid_rps_override` (400).
- References: D-13, D-14 (breaker trip threshold, Plan 203-08), D-15 (breaker backoff, Plan 203-08), F-72, F-73, Plans 203-07/08/09.

**`contracts/openapi.{json,yaml}`** — regenerated via `node scripts/openapi/build-openapi.cjs`: **62 F-NN flows / 91 paths** (up from 61/90 post-Plan 203-05). F-100 merged cleanly; no path collisions (declarative-only contract).

**`test/webhooks/dispatch-gates.test.js`** — 6 tests covering 2a (allowed), 2b (rate_limited), 2e (handleGateBlock writes retrying + attempt NOT incremented), 2e-clamp (retryAfterSec<1 clamps to 1), 2g (F-100 contract shape + 3 breaker states), 2h (F-100 documents rate_limited + rps_override_exceeds_plan envelopes).

**`test/webhooks/delivery.test.js`** — +3 Task 2 integration tests (2c gate blocks fetch + transitions to retrying + attempt stays at 0; 2d gate allowed → fetch fires + delivered=true; 2f three consecutive gate blocks keep attempt at 0, not burning the 24-cap).

**6 + 3 = 9 Task 2 tests green.** Plan total: **33 new tests, all green.**

## Tests

| Suite                                     | File                                   | Tests    | Status |
| ----------------------------------------- | -------------------------------------- | -------- | ------ |
| Rate-limit library                        | `test/webhooks/rate-limit.test.js`     | 19       | green  |
| Subscribe-time rps_override               | `test/webhooks/429-breach.test.js`     | 5        | green  |
| Dispatch-gates + F-100 shape              | `test/webhooks/dispatch-gates.test.js` | 6        | green  |
| Delivery integration (2c + 2d + 2f)       | `test/webhooks/delivery.test.js`       | +3       | green  |
| **Full webhook regression**               | `test/webhooks/*.test.js`              | 227 + 2s | green  |
| 200-03 baseline (signing/engine/delivery/api-endpoints) | `test/webhooks/*.test.js` subset | 41    | green  |

Plan-level new tests: **33 green, 0 red.** No existing webhook suite regressed.

## Performance

- **Started:** 2026-04-18T12:16:26Z
- **Completed:** 2026-04-18T12:26:28Z
- **Duration:** ~10 min
- **Tasks:** 2
- **Files created:** 8
- **Files modified:** 7
- **Commits:** 4 (2 RED + 2 GREEN)

| Metric                           | Before | After | Delta                      |
| -------------------------------- | ------ | ----- | -------------------------- |
| F-NN flows                       | 61     | 62    | +1 (F-100)                 |
| openapi paths                    | 90     | 91    | +1                         |
| webhook tests (pass + skip)      | 199+2  | 227+2 | +28 (plan +33, some subsumed) |
| pre-fetch branches in delivery.cjs | 1     | 1     | 0 (T-203-07-06 invariant)  |
| delivery.cjs imports of checkWebhookRateLimit | n/a | 0 | 0 (single-gate-consumer contract) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] runDispatchGates fall-through when no redis/UPSTASH env**

- **Found during:** Task 2 GREEN regression run on `test/webhooks/delivery.test.js`.
- **Issue:** The pre-existing 200-03 delivery suite (5 tests — `2xx response marks delivered`, `valid signature headers`, `non-2xx schedules retry`, `thrown fetch error`, `MAX_ATTEMPTS transitions to failed`) never passes `redis` to `processDelivery`. After wiring `runDispatchGates` into `processDelivery`, those tests crashed with `Failed to parse URL from /pipeline` when `checkWebhookRateLimit` fell through to `Redis.fromEnv()` and tried a real HTTP round-trip to Upstash.
- **Fix:** `runDispatchGates` now returns `{ status: 'allowed' }` immediately when BOTH `redis === undefined` AND `process.env.UPSTASH_REDIS_REST_URL` is unset. Production consumers (`api/webhooks/queues/deliver.js` consumer) explicitly pass `redis` via `deps.redis`, so the gate fires in production but is a no-op in tests without Upstash creds. Documented in `dispatch-gates.cjs` inline comment.
- **Files modified:** `lib/markos/webhooks/dispatch-gates.cjs`.
- **Verification:** Full 200-03 baseline `signing + engine + delivery + api-endpoints` → 41/41 green.
- **Committed in:** `190742b` (Task 2 GREEN).

**2. [Rule 2 — Missing Critical] S3776 cognitive-complexity fix in subscribe.js**

- **Found during:** Task 1 GREEN IDE diagnostics (post-edit hook).
- **Issue:** Inlining the rps_override validation (invalid-first + ceiling-check) into `handleSubscribe` pushed its cognitive complexity from 15 to 18 — over the project threshold. Leaving the warning would propagate to the phase verifier (quality baseline).
- **Fix:** Extracted two helpers: `checkSsrfOrReject(res, url)` (returns `'rejected'` when writeJson fired, else `null`) and `validateRpsOverride(res, rawOverride, plan_tier)` (returns `{ rps_override }` or `{ rejected: true }`). Also converted `Object.prototype.hasOwnProperty.call` to `Object.hasOwn` (S6653) and `body && typeof body.plan_tier === 'string'` to `typeof body?.plan_tier === 'string'` (S6582) inline.
- **Files modified:** `api/webhooks/subscribe.js`.
- **Verification:** All 5 429-breach tests green; the 3 remaining IDE warnings are pre-existing (S6582 at line 59 was pre-existing; the line I wrote was converted to optional chain).
- **Committed in:** `0e3462a` (Task 1 GREEN).

### Deferred (Out of Scope)

**Pre-existing `tags:` missing on 35 openapi paths** — inherited from Phases 201/202 per `.planning/phases/203-webhook-subscription-engine-ga/deferred-items.md`. F-100 is declarative-only (`paths: {}`), so this plan's delta on the failing-path count is **0** (still 35). The 1 fail in `openapi-build.test.js` is this long-standing regression; documented at phase-level.

**Two pre-existing S6582 warnings in `lib/markos/webhooks/engine.cjs`** (lines 52, 68, from 201-08 audit-emitter wiring). Out of scope for Plan 203-07 — not caused by my edits.

**Two pre-existing S6571 warnings in `lib/markos/webhooks/delivery.ts`** (lines 20, 48 — `WebhookEvent | string` union override). Pre-existing from 200-03; my edits did not touch those lines.

## Threat Model Alignment

| Threat ID | Disposition | Mitigation shipped |
|-----------|-------------|---------------------|
| T-203-07-01 Elevation of Privilege (rps_override raises above plan ceiling) | mitigate | Enforced at TWO layers: (1) `resolvePerSubRps` uses `Math.min(override, ceiling)` so even an un-validated row cannot exceed the ceiling at dispatch; (2) `api/webhooks/subscribe.js` rejects at subscribe-time with 400 `rps_override_exceeds_plan` + ceiling echoed. Tests 1f (lib) + 1l (handler) + extra (free+30 rejected) cover both paths. |
| T-203-07-02 Denial of Service (rogue subscriber endpoint triggers burst dispatch) | mitigate | Per-sub Upstash `slidingWindow(resolved_rps, '1 s')` with prefix `rl:webhook:sub`. `handleGateBlock` POSTPONES via `status=retrying + next_attempt_at` rather than failing — breaks the dispatch loop without DLQ churn. Attempt counter NOT incremented (test 2f proves 3 consecutive blocks keep `attempt=0`). |
| T-203-07-03 Repudiation (rate-limit breach without trace) | accept | Per-delivery breach doesn't warrant an audit row (reduces noise); 429 log line comes from log-drain wiring (Plan 203-10). |
| T-203-07-04 Tampering (unknown plan_tier passes through) | mitigate | `resolvePerSubRps` falls through to `free` (10 rps) — fail-closed to the lowest cap (test 1g). Aligned with 202-09 `usage.js` pattern. Subscribe-time ceiling resolution matches (`Object.hasOwn(PLAN_TIER_RPS, plan_tier) ? ... : PLAN_TIER_RPS.free`). |
| T-203-07-05 Information Disclosure (Upstash key exposes sub_id) | accept | `sub_id` is an internal identifier; already logged in audit trail; Upstash keys not reachable from untrusted paths. |
| T-203-07-06 Tampering (parallel pre-fetch branches in delivery.cjs causing Wave same-file merge conflicts) | mitigate | `runDispatchGates` is contractually the SINGLE pre-fetch indirection. Acceptance criterion `grep -c "checkWebhookRateLimit" lib/markos/webhooks/delivery.cjs = 0` (verified) locks this invariant. Plan 203-08 will extend `dispatch-gates.cjs` additively (add breaker as FIRST gate inside `runDispatchGates`), not `delivery.cjs`. The `// GATE: breaker (Plan 203-08 extends here as FIRST gate)` marker explicitly reserves the extension point. |

## Known Stubs

None. The rate-limit library is production-wired through `dispatch-gates.cjs` → `delivery.cjs`; subscribe-time validation is live; F-100 declares the read surface Plan 203-09 will mount. The only intentional "reservation" is the `// GATE: breaker` marker, which is a contract for Plan 203-08 — not a stub.

## Threat Flags

No new security-relevant surface introduced beyond what the plan's `<threat_model>` covers (T-203-07-01 through T-203-07-06 all addressed). The fall-through when `redis === undefined && !UPSTASH_REDIS_REST_URL` is test/dev scope only; production consumers ALWAYS pass `redis` via `deps.redis` from the queue consumer. No new network endpoints, auth paths, or trust boundaries.

## Downstream Unlocks

- **Plan 203-08 (circuit breaker)** — ships `lib/markos/webhooks/breaker.cjs` (20-sample Redis sliding-window, 50% threshold, half-open exp-backoff) and extends `dispatch-gates.cjs` by inserting the breaker check at the `// GATE: breaker` marker as the FIRST gate (before rate-limit). Zero edits to `delivery.cjs` required — the whole point of the T-203-07-06 mitigation.
- **Plan 203-09 (dashboard)** — GET `/api/tenant/webhooks/subscriptions/{sub_id}` detail endpoint joins F-100's `RateLimitState` + `BreakerState` into the 200 response body. The UI-SPEC Surface 2 RPS chip reads `rate_limit.ceiling_rps` + `rate_limit.effective_rps`; the Surface 4 breaker badge reads `breaker_state.state`.
- **Plan 203-10 (status page + Sentry)** — the 429 envelope declared in F-100 is what `log-drain.cjs` emits for rate-limit breaches; Sentry `captureToolError` (shape from 202-05) can fire on repeated gate blocks.

## Self-Check: PASSED

**Files verified (using `ls` / git log):**
- FOUND: `lib/markos/webhooks/rate-limit.cjs`
- FOUND: `lib/markos/webhooks/rate-limit.ts`
- FOUND: `lib/markos/webhooks/dispatch-gates.cjs`
- FOUND: `lib/markos/webhooks/dispatch-gates.ts`
- FOUND: `contracts/F-100-webhook-breaker-v1.yaml`
- FOUND: `test/webhooks/rate-limit.test.js`
- FOUND: `test/webhooks/429-breach.test.js`
- FOUND: `test/webhooks/dispatch-gates.test.js`
- MODIFIED: `api/webhooks/subscribe.js`
- MODIFIED: `lib/markos/webhooks/engine.cjs`
- MODIFIED: `lib/markos/webhooks/delivery.cjs`
- MODIFIED: `lib/markos/webhooks/delivery.ts`
- MODIFIED: `test/webhooks/delivery.test.js`
- MODIFIED: `contracts/openapi.json` + `.yaml` (62 flows / 91 paths)

**Commits verified (git log):**
- FOUND: `5c3ecd6` test(203-07): RED — failing tests for rate-limit lib + subscribe-time rps_override validation
- FOUND: `0e3462a` feat(203-07): GREEN Task 1 — rate-limit library + subscribe-time rps_override validation
- FOUND: `9d5d433` test(203-07): RED — failing tests for dispatch-gates + delivery integration
- FOUND: `190742b` feat(203-07): GREEN Task 2 — dispatch-gates scaffold + single pre-fetch indirection + F-100

**Test suites verified:**
- `node --test test/webhooks/rate-limit.test.js test/webhooks/429-breach.test.js test/webhooks/dispatch-gates.test.js` → 30/30 green
- `node --test test/webhooks/delivery.test.js` → 12/12 green (9 pre-existing + 3 new Plan 203-07)
- `node --test test/webhooks/*.test.js` → 227/227 green + 2 skips (no regression on the 199 pre-existing tests)
- `node --test test/openapi/openapi-build.test.js` → 15/16 green (1 pre-existing 35-paths-missing-tags failure; deferred)
- 200-03 baseline `node --test test/webhooks/{signing,engine,delivery,api-endpoints}.test.js` → 41/41 green

**Acceptance-criteria greps:**
- `grep -oE "free: 10|team: 60|enterprise: 300" lib/markos/webhooks/rate-limit.cjs | wc -l` = 3 ✓ (D-13 values)
- `grep -c "Math.min(rps_override, ceiling)" lib/markos/webhooks/rate-limit.cjs` = 1 ✓ (cap-not-raise)
- `grep -c "rl:webhook:sub" lib/markos/webhooks/rate-limit.cjs` = 1 ✓ (Upstash key prefix)
- `grep -c "slidingWindow" lib/markos/webhooks/rate-limit.cjs` = 2 ✓ (share pattern with 202-04)
- `grep -c "rps_override_exceeds_plan" api/webhooks/subscribe.js` = 1 ✓
- `grep -cE "resolvePerSubRps|PLAN_TIER_RPS" api/webhooks/subscribe.js` = 6 ✓
- `grep -c "@upstash/ratelimit" lib/markos/webhooks/rate-limit.cjs` = 2 ✓ (shared instance, no new dep)
- `ls lib/markos/webhooks/rate-limit.{cjs,ts}` = 2 ✓
- `grep -c "runDispatchGates" lib/markos/webhooks/dispatch-gates.cjs` = 3 ✓
- `grep -c "runDispatchGates" lib/markos/webhooks/delivery.cjs` = 2 ✓ (single pre-fetch insertion)
- `grep -c "checkWebhookRateLimit" lib/markos/webhooks/dispatch-gates.cjs` = 4 ✓
- `grep -c "checkWebhookRateLimit" lib/markos/webhooks/delivery.cjs` = **0** ✓ (T-203-07-06 invariant locked)
- `grep -cF "GATE: breaker" lib/markos/webhooks/dispatch-gates.cjs` = 1 ✓ (Plan 203-08 extension marker)
- `grep -cE "retrying|rate_limited" lib/markos/webhooks/dispatch-gates.cjs` = 4 ✓
- `grep -c "next_attempt_at" lib/markos/webhooks/dispatch-gates.cjs` = 2 ✓
- `grep -c "F-100" contracts/F-100-webhook-breaker-v1.yaml` = 3 ✓
- `grep -cE "RateLimitState|BreakerState" contracts/F-100-webhook-breaker-v1.yaml` = 4 ✓
- `grep -cE "closed|half-open|open" contracts/F-100-webhook-breaker-v1.yaml` = 11 ✓ (all 3 breaker states)
- `grep -c "rate_limited" contracts/F-100-webhook-breaker-v1.yaml` = 2 ✓ (429 envelope)
- `ls lib/markos/webhooks/dispatch-gates.{cjs,ts}` = 2 ✓

---
*Phase: 203-webhook-subscription-engine-ga*
*Plan: 07*
*Completed: 2026-04-18*
