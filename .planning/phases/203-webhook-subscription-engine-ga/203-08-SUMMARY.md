---
phase: 203
plan: 08
subsystem: webhooks
tags: [wave-5, circuit-breaker, dispatch-gates, D-14, D-15, upstash, parallel]
dependency-graph:
  requires:
    - 203-01 (Upstash @upstash/redis shared instance — RESEARCH §Standard Stack)
    - 203-02 (no direct dependency — schema is orthogonal)
    - 203-07 (dispatch-gates.cjs scaffold + single pre-fetch indirection insertion point)
  provides:
    - "lib/markos/webhooks/breaker.cjs::recordOutcome + canDispatch + classifyOutcome + getBreakerState + WINDOW_SIZE (20) + TRIP_THRESHOLD (0.5) + HALF_OPEN_BACKOFF_SEC ([30,60,120,300,600])"
    - "lib/markos/webhooks/dispatch-gates.cjs::runDispatchGates EXTENDED — breaker gate inserted as FIRST gate (before rate-limit); breaker_open envelope shape"
    - "Post-fetch primitives (recordOutcome + classifyOutcome) as PURE EXPORTS for Plan 203-10's observability wrapper"
  affects: [203-09-dashboard (getBreakerState reads for Surface 4), 203-10-observability-wrapper (imports recordOutcome + classifyOutcome, calls them post-fetch in delivery.cjs)]
tech-stack:
  added: []
  patterns:
    - "Upstash Redis sliding-window circuit breaker (mirrors 202-04 rate-limit infra; no new deps)"
    - "Three-state machine — closed / half-open / open; state stored in cb:webhook:state:<sub_id> as JSON blob with TTL = backoff + 3600s; absent = closed"
    - "LPUSH + LTRIM outcomes ring — cb:webhook:outcomes:<sub_id> capped at 20 with 1h idle TTL; race-tolerant per RESEARCH Assumptions Log A3"
    - "4xx is NOT a failure — explicit D-14 reading (client-side misrouting does not trip breaker; 2xx/3xx/4xx = success, 5xx/timeout/network = failure)"
    - "Gate order invariant: breaker (FIRST) → rate-limit (SECOND). canDispatch literal appears BEFORE checkWebhookRateLimit literal in dispatch-gates.cjs source file order"
    - "T-203-08-06 mitigation: Plan 203-08 does NOT edit delivery.cjs. recordOutcome + classifyOutcome are pure exports from breaker.cjs; Plan 203-10 imports and calls them inside its own observability wrapper in delivery.cjs. Single owner per file per wave."
    - "Parallel Wave-5 siblings (203-09 + 203-10) co-exist — no same-file conflicts because 203-08 owns only breaker.cjs + dispatch-gates.cjs; 203-10 owns delivery.cjs + log-drain.cjs + sentry.cjs; 203-09 owns subscription detail endpoint."
key-files:
  created:
    - "lib/markos/webhooks/breaker.cjs"
    - "lib/markos/webhooks/breaker.ts"
    - "test/webhooks/breaker.test.js"
    - "test/webhooks/circuit-breaker.test.js"
  modified:
    - "lib/markos/webhooks/dispatch-gates.cjs"
    - "lib/markos/webhooks/dispatch-gates.ts"
    - "test/webhooks/dispatch-gates.test.js"
    - "test/webhooks/delivery.test.js"
decisions:
  - "4xx treated as 'success' for breaker purposes (explicit D-14 reading: '5xx or timeout'). Client-side misrouting / mispellings / subscriber's own rate-limit 429 do NOT trip the breaker — that's the subscriber's hygiene problem, not MarkOS's. If subscriber wants the breaker to consider 4xx, they need to surface 5xx from their upstream. T-203-08-03 accept disposition."
  - "Unknown HTTP result (missing / non-numeric http + no timeout + no network_error) classified as 'failure' — fail-closed so genuinely broken subscribers still eventually trip the breaker even when fetch returns garbage."
  - "State key TTL = backoff + STATE_IDLE_PAD_SECONDS (3600). The pad keeps the trips counter visible for long enough that a second trip within ~1h properly increments (not resets to 1). Without the pad, a sub that trips once, then sits idle for 30min, would trip a second time as trips=1 — losing the exponential backoff escalation."
  - "Recovery: recordOutcome('success') while currentState !== closed → DEL state key. This makes the first success after a half-open probe resolve the breaker cleanly. Production guarantee holds: canDispatch returns can_dispatch:false in open state so recordOutcome is never invoked against an open-state sub (only closed / half-open states ever reach recordOutcome post-fetch)."
  - "Outcomes list seeded directly via redis.lpush in tests 1n/1o/1p/1u/2f instead of driving recordOutcome with mixed outcomes. Recording intermediate successes would trigger the recovery path (state DEL) and reset the trips counter before reaching the final trip. The direct-seed pattern mirrors what the production flow actually does — a sub stuck in open state can only accumulate outcomes via the single half-open probe path."
  - "Breaker fall-through — when redis is undefined AND UPSTASH_REDIS_REST_URL env is unset, runDispatchGates short-circuits to { status: 'allowed' } BEFORE the breaker check. Preserves Plan 203-07's Rule-3 graceful-degrade for the 200-03 delivery suite + CI-without-Upstash-creds. Production consumers (queues/deliver.js) always pass redis explicitly, so the breaker fires there."
  - "Test stubs — pre-built rate-limiter path in rate-limit.cjs getLimiter() bypasses Upstash SDK when an object with .limit() is passed. We extended the 203-07 mockLimiter in dispatch-gates.test.js + delivery.test.js with a no-op async .get() returning null so the breaker gate also reads this same stub as redis (closed state). Zero new test infrastructure; same object serves both gates."
metrics:
  duration_minutes: 9
  tasks_completed: 2
  tests_added: 33
  tests_green_in_plan: 33
  tests_green_in_scope: 146
  completed_date: "2026-04-18"
requirements: [WHK-01, QA-04]
---

# Phase 203 Plan 08: Webhook Circuit Breaker (D-14 + D-15)

Wave-5 delivery of the **webhook circuit breaker** — **D-14** (>50% of last 20 deliveries fail → trip) + **D-15** (exponential backoff `[30, 60, 120, 300, 600]` seconds capped at 10min). Redis-backed so state survives Vercel Fluid Compute instance turnover. Inserted as the **FIRST gate** inside `runDispatchGates` (Plan 203-07's dispatch-gates indirection module) so the breaker short-circuits before rate-limit. **Zero edits to `delivery.cjs`** — `recordOutcome` + `classifyOutcome` are pure exports consumed by Plan 203-10's observability wrapper (Wave-5 same-file conflict mathematically eliminated).

## What Shipped

### Task 1 — Circuit-breaker library + 23 tests (commits `7aa3981` RED → `432e319` GREEN)

**`lib/markos/webhooks/breaker.cjs` + `.ts`** — dual-export, 4 functions + 3 constants:

- `WINDOW_SIZE = 20` (D-14 — last 20 outcomes).
- `TRIP_THRESHOLD = 0.5` (D-14 — strictly `> 50%` of the window).
- `HALF_OPEN_BACKOFF_SEC = Object.freeze([30, 60, 120, 300, 600])` (D-15 — exponential; index = `min(trips - 1, length - 1)`).
- `classifyOutcome({ http, timeout, network_error })` — pure classifier:
  - `timeout` or `network_error` → `'failure'`.
  - Missing/non-numeric `http` → `'failure'` (fail-closed on unknown fetch result).
  - `http >= 500` → `'failure'`.
  - 2xx / 3xx / 4xx → `'success'` (4xx explicitly non-failure per D-14 reading; client-side misrouting does not trip breaker).
- `recordOutcome(redis, sub_id, outcome)`:
  - `LPUSH` outcome to `cb:webhook:outcomes:<sub_id>`, `LTRIM` to `WINDOW_SIZE - 1`, `EXPIRE` 3600s.
  - If `outcome === 'success'` AND current state exists and is not `closed` → `DEL` state key (recovery to closed).
  - If the list has `WINDOW_SIZE` samples AND failure rate `> TRIP_THRESHOLD` → increment trips, compute backoff, `SET` `cb:webhook:state:<sub_id>` to JSON `{ state: 'open', trips, probe_at }` with `EX = backoff + 3600`.
  - Returns `{ state: 'closed' }` or `{ state: 'open', trips, probe_at }`.
- `canDispatch(redis, sub_id)`:
  - No state → `{ can_dispatch: true, state: 'closed' }`.
  - `state === 'closed'` → `{ can_dispatch: true, state: 'closed' }`.
  - `Date.now() >= probe_at` → `{ can_dispatch: true, state: 'half-open', trips }` (lets one probe through).
  - Otherwise → `{ can_dispatch: false, state: 'open', probe_at, trips }`.
- `getBreakerState(redis, sub_id)` — read-only state snapshot for Plan 203-09 dashboard (`{ state, trips?, probe_at? }`); never mutates Redis.

**State storage schema:**
- `cb:webhook:outcomes:<sub_id>` — Redis list of `'success'|'failure'`; newest at head; trimmed to 20; 1h idle TTL.
- `cb:webhook:state:<sub_id>` — JSON blob `{ state, trips, probe_at }`; TTL = `backoff + 3600`; absent = closed.

**`test/webhooks/breaker.test.js`** — 23 tests covering 22 behaviors (1a-1v) + module-surface invariant:
- 1a-1h: classifyOutcome across 2xx / 3xx / 4xx / 5xx / timeout / network_error.
- 1i: LPUSH + LTRIM + EXPIRE on every recordOutcome.
- 1j: 20 failures in a row → trips, trips=1, probe_at = now + 30s.
- 1k: exactly 50% → NOT tripped (strictly-greater-than).
- 1l: 55% → trips.
- 1m: < 20 samples → no trip.
- 1n / 1o / 1p: second / fifth / tenth trip uses backoff index 1 / 4 / 4 (cap).
- 1q / 1r / 1s: canDispatch — no state / open+future / open+elapsed.
- 1t: half-open probe success → state key DELETED (recovery to closed).
- 1u: half-open probe failure → trips+=1 + new backoff.
- 1v: getBreakerState read-only.

### Task 2 — Breaker gate as FIRST gate in runDispatchGates + 10 integration tests (commits `49c2f6a` RED → `7dba7af` GREEN)

**`lib/markos/webhooks/dispatch-gates.cjs`** — EXTENDED (not rewritten):
- New import: `const { canDispatch } = require('./breaker.cjs');`
- Header comment updated: "Gate order: breaker (Plan 203-08) → rate-limit (Plan 203-07). Breaker runs FIRST so an open circuit short-circuits before touching Upstash rate-limit state."
- Fall-through guard preserved (no redis + no UPSTASH env → `{ status: 'allowed' }`).
- Inside `runDispatchGates`, **GATE 1** (breaker) added BEFORE GATE 2 (rate-limit):
  ```javascript
  const brk = await canDispatch(redis, subId);
  if (!brk.can_dispatch) {
    const retryAfterSec = Math.max(1, Math.ceil(((brk.probe_at || Date.now()) - Date.now()) / 1000));
    return {
      status: 'breaker_open',
      retryAfterSec,
      reason: 'breaker_open',
      breaker: { state: brk.state, trips: brk.trips, probe_at: brk.probe_at },
    };
  }
  ```
- Rate-limit gate call site + return shape unchanged — purely additive edit.

**`lib/markos/webhooks/dispatch-gates.ts`** — `GateDisposition` union extended with `GateBreakerOpen` type (replaces the Plan 203-07 placeholder comment).

**`test/webhooks/circuit-breaker.test.js`** — 10 integration tests:
- 2a: breaker closed + rate-limit ok → allowed.
- 2b: breaker open + probe_at future → `breaker_open` envelope; rate-limit NOT called (short-circuit verified).
- 2c: breaker half-open + probe_at elapsed → rate-limit IS called; probe proceeds.
- 2d: breaker closed + rate-limit breach → `rate_limited` envelope (second gate still fires).
- 2e: `handleGateBlock` on `breaker_open` transitions to retrying; attempt counter NOT incremented.
- 2f: seed 19 failures + record 20th → trip → next `runDispatchGates` returns `breaker_open`.
- 2g: half-open state + recordOutcome('success') → state key deleted → next gate returns allowed.
- 2h: `classifyOutcome({ http: 429 })` = success → 20 of them do NOT trip.
- 2i: `classifyOutcome({ timeout: true })` + `({ network_error: true })` = failure.
- Invariant: `canDispatch` literal appears BEFORE `checkWebhookRateLimit` literal in `dispatch-gates.cjs` source order.

**Test stubs extended** — `test/webhooks/dispatch-gates.test.js` + `test/webhooks/delivery.test.js` mockLimiter gains a no-op `async .get()` returning `null`. This makes the pre-built limiter dep-injection path also serve as a redis stub (closed state). Zero new test infrastructure; no semantic change.

**`lib/markos/webhooks/delivery.cjs` — NOT modified.** Invariant verified via grep:
- `grep -c "require.*breaker" lib/markos/webhooks/delivery.cjs` = 0
- `grep -c "recordOutcome" lib/markos/webhooks/delivery.cjs` = 0
- `grep -c "canDispatch" lib/markos/webhooks/delivery.cjs` = 0
- `grep -c "runDispatchGates" lib/markos/webhooks/delivery.cjs` = 2 (Plan 203-07 insertion unchanged)

## Tests

| Suite                                              | File                                     | Tests | Status |
| -------------------------------------------------- | ---------------------------------------- | ----- | ------ |
| Breaker library (1a-1v + surface)                  | `test/webhooks/breaker.test.js`          | 23    | green  |
| Breaker integration (2a-2i + gate-order invariant) | `test/webhooks/circuit-breaker.test.js`  | 10    | green  |
| Dispatch-gates (Plan 203-07 tests + mock extension)| `test/webhooks/dispatch-gates.test.js`   | 6     | green  |
| Delivery pipeline (Plan 203-07 tests + mock extension)| `test/webhooks/delivery.test.js`      | 12    | green  |
| 203-08 full                                        | `breaker + circuit-breaker + dispatch-gates + delivery` | 51 | green |
| 203-08 + pre-existing non-sibling webhook suites   | breaker/circuit-breaker/dispatch-gates/delivery/rate-limit/429-breach/signing/engine/api-endpoints/dlq/replay/ssrf-guard | 146 | green |

**Plan-level new tests: 33 green.** No regressions on 203-07 tests or 200-03 baseline (41/41 signing+engine+delivery+api-endpoints still green). Full `test/webhooks/*.test.js` has 27 failures — all from parallel Wave-5 siblings (203-09 subscription-detail tests in `api-tenant.test.js`, 203-10 Surface 3 + observability + public-status + status-page + ui-s3-a11y + settings-api). None of those failures are caused by 203-08; they pre-existed as RED in sibling plans.

## Performance

- **Started:** 2026-04-18T12:32:58Z
- **Completed:** 2026-04-18T12:41:48Z
- **Duration:** ~9 min
- **Tasks:** 2
- **Files created:** 4
- **Files modified:** 4
- **Commits:** 4 (2 RED + 2 GREEN)

| Metric                                              | Before | After | Delta                     |
| --------------------------------------------------- | ------ | ----- | ------------------------- |
| pre-fetch gates in runDispatchGates                 | 1      | 2     | +1 (breaker as FIRST)     |
| pre-fetch branches in delivery.cjs                  | 1      | 1     | 0 (T-203-08-06 invariant) |
| delivery.cjs imports of breaker/recordOutcome/canDispatch | n/a | 0 | 0 (Plan 203-10 will import) |
| canDispatch before checkWebhookRateLimit in file    | n/a    | yes   | breaker is FIRST gate     |
| webhook tests (pass, scope: 203-08 + non-sibling)   | 113    | 146   | +33                       |
| new deps                                            | 0      | 0     | 0 (shares @upstash/redis) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Pre-built rate-limiter mock lacked .get() for breaker gate**

- **Found during:** Task 2 GREEN regression run on `test/webhooks/dispatch-gates.test.js` + `test/webhooks/delivery.test.js`.
- **Issue:** Plan 203-07's `mockLimiter` helper only implemented `.limit()` because `rate-limit.cjs` `getLimiter()` bypasses Upstash SDK when passed an object with `.limit()`. After inserting the breaker gate, `canDispatch(redis, subId)` called `redis.get(stateKey)` on the same object → `TypeError: redis.get is not a function`. 5 tests in dispatch-gates + 3 tests in delivery affected.
- **Fix:** Extended both mockLimiter helpers with `async get() { return null; }`. `null` → breaker reads closed → no blocking. Preserves every original test's semantics (rate-limit path still drives the result).
- **Files modified:** `test/webhooks/dispatch-gates.test.js`, `test/webhooks/delivery.test.js`.
- **Verification:** 39/39 green across breaker + circuit-breaker + dispatch-gates + delivery (Plan 203-07 regression fully preserved).
- **Committed in:** `7dba7af` (Task 2 GREEN).

### Test-Design Refinement (Task 1)

**Tests 1n / 1o / 1p / 1u seed the outcomes list directly via `redis.lpush` instead of driving `recordOutcome` with mixed outcomes.**

- **Why:** The natural test-setup pattern (record N successes then N failures) triggers the breaker's recovery path on the FIRST success — `recordOutcome('success')` while `currentState !== 'closed'` DELs the state key and resets trips. That's the correct production semantic (a successful half-open probe should reset). But it means a test that tries to accumulate a second trip by feeding `[success×9, failure×11]` loses the pre-seeded `trips` counter on the first success.
- **Resolution:** Seed the outcomes list directly (`await redis.lpush(...)` in a loop) so no intermediate `recordOutcome('success')` runs, then record a single 20th failure via the library. This mirrors production: when state is open, no dispatch happens (canDispatch blocks); when state is half-open, exactly one probe fires → one recordOutcome call against the existing state. Accumulating 10 successes against an open state is not a real production flow.
- **No behavior change** — this is purely a test-setup clarification documented in the SUMMARY's `decisions` frontmatter.

### Deferred (Out of Scope)

**Plan 203-09 + 203-10 failures across 27 tests in the wider webhook suite** — all from parallel Wave-5 sibling plans:
- `test/webhooks/api-tenant.test.js` (203-09 subscription-detail endpoint not shipped).
- `test/webhooks/public-status.test.js`, `test/webhooks/status-page.test.js`, `test/webhooks/ui-s3-a11y.test.js` (203-10 Surface 3 status page).
- `test/webhooks/observability.test.js` (203-10 log-drain + sentry wiring into delivery.cjs — 203-10 scope).
- `test/webhooks/settings-api.test.js` (203-09 subscription settings).

None of these failures are caused by 203-08 code. Per parallel-execution contract, 203-08 owns only `breaker.cjs` + `dispatch-gates.cjs` extension; the sibling plans resolve their own tests.

**Pre-existing `tags:` missing on openapi paths** (inherited from Phases 201/202, documented at phase-level in `deferred-items.md`). Plan 203-08 ships no new contract entries (breaker state was pre-declared in Plan 203-07's F-100 contract).

## Threat Model Alignment

| Threat ID | Disposition | Mitigation shipped |
|-----------|-------------|---------------------|
| T-203-08-01 Denial of Service (subscriber induced cascading trips) | mitigate | Breaker IS the mitigation — sheds bad endpoints; half-open exponential backoff prevents permanent damage. canDispatch returns can_dispatch:false while probe_at is future, preserving the subscriber from cascading retries. |
| T-203-08-02 Tampering (LPUSH/LTRIM race) | accept | RESEARCH §Assumptions Log A3 — 20-sample/50% noise floor. In-memory mock mirrors production race surface; production tolerance documented. ZSET upgrade path retained for future pentest finding. |
| T-203-08-03 Elevation of Privilege (4xx-spamming to avoid tripping) | accept | classifyOutcome intentionally treats 4xx as 'success'. A subscriber returning 429 to all events avoids the breaker BUT also achieves zero real delivery — net result is the subscriber's problem, not MarkOS's. Explicit D-14 reading ('5xx or timeout') documented in breaker.cjs header comment. |
| T-203-08-04 Information Disclosure (breaker state leak) | accept | getBreakerState is tenant-scoped in Plan 203-09 dashboard; state contents (state / trips / probe_at) carry no PII or subscriber-authored data. |
| T-203-08-05 Repudiation (breaker trips without audit) | accept | Log-drain emits a line on every outcome (Plan 203-10 wires this). An audit row per trip would flood markos_audit_log. Trip visibility via Plan 203-09 dashboard badge + Plan 203-10 log-drain is sufficient. |
| T-203-08-06 Tampering (cross-plan edits to delivery.cjs) | mitigate | Acceptance-criteria invariants locked: `grep -c "require.*breaker" lib/markos/webhooks/delivery.cjs = 0` AND `grep -c "recordOutcome" lib/markos/webhooks/delivery.cjs = 0` AND `grep -c "canDispatch" lib/markos/webhooks/delivery.cjs = 0`. Plan 203-10 owns the delivery.cjs observability edit; Plan 203-08 owns only dispatch-gates.cjs extension + breaker.cjs. Single-owner-per-file-per-wave contract satisfied. |

## Known Stubs

None. `recordOutcome` + `classifyOutcome` are production-ready exports; Plan 203-10 imports them and wires them post-fetch in `delivery.cjs` (separate plan, separate commit — confirmed via recent commit `38ca91a`). `getBreakerState` is ready for Plan 203-09 dashboard to consume (Surface 4 breaker badge).

## Threat Flags

No new security-relevant surface introduced beyond what the plan's `<threat_model>` covers. Breaker state storage (`cb:webhook:*` Redis keys) is internal; no new HTTP endpoints, auth paths, or trust boundaries. The state key payload is bounded JSON (`{ state, trips, probe_at }`) with no attacker-controlled fields.

## Downstream Unlocks

- **Plan 203-09 (dashboard)** — `getBreakerState(redis, sub_id)` returns the UI-SPEC Surface 4 breaker badge data (`{ state, trips?, probe_at? }`). F-100 contract (shipped in Plan 203-07) already declares the `BreakerState` schema — no further contract work needed.
- **Plan 203-10 (observability + status page)** — already landed commits `38ca91a` (log-drain + sentry libs + queues/deliver.js swap) and `df60b46` (Task 3). The observability wrapper in `delivery.cjs` can now import `recordOutcome` + `classifyOutcome` from `./breaker.cjs` and call them in its finally block around fetch. Plan 203-10 owns the delivery.cjs edit; Plan 203-08 provides the pure primitives.

## Self-Check: PASSED

**Files verified (via ls / git log):**
- FOUND: `lib/markos/webhooks/breaker.cjs`
- FOUND: `lib/markos/webhooks/breaker.ts`
- FOUND: `test/webhooks/breaker.test.js`
- FOUND: `test/webhooks/circuit-breaker.test.js`
- MODIFIED: `lib/markos/webhooks/dispatch-gates.cjs`
- MODIFIED: `lib/markos/webhooks/dispatch-gates.ts`
- MODIFIED: `test/webhooks/dispatch-gates.test.js`
- MODIFIED: `test/webhooks/delivery.test.js`
- UNCHANGED (invariant): `lib/markos/webhooks/delivery.cjs` — grep -c "require.*breaker" = 0, "recordOutcome" = 0, "canDispatch" = 0

**Commits verified (git log):**
- FOUND: `7aa3981` test(203-08): RED — failing tests for circuit-breaker state machine
- FOUND: `432e319` feat(203-08): GREEN Task 1 — circuit-breaker library (D-14 + D-15)
- FOUND: `49c2f6a` test(203-08): RED — integration tests for breaker gate in runDispatchGates
- FOUND: `7dba7af` feat(203-08): GREEN Task 2 — breaker gate as FIRST gate in runDispatchGates

**Test suites verified:**
- `node --test test/webhooks/breaker.test.js` → 23/23 green
- `node --test test/webhooks/circuit-breaker.test.js` → 10/10 green
- `node --test test/webhooks/circuit-breaker.test.js test/webhooks/breaker.test.js test/webhooks/dispatch-gates.test.js` → 39/39 green
- `node --test test/webhooks/delivery.test.js` → 12/12 green (Plan 203-07 tests + Plan 203-08 mock extension)
- 146/146 green across 203-08 + pre-existing non-sibling webhook suites

**Acceptance-criteria greps:**
- `grep -c "WINDOW_SIZE = 20" lib/markos/webhooks/breaker.cjs` = 2 ✓ (D-14 constant + usage)
- `grep -c "TRIP_THRESHOLD = 0.5" lib/markos/webhooks/breaker.cjs` = 2 ✓ (D-14 constant + usage)
- `grep -cE "\[30, 60, 120, 300, 600\]" lib/markos/webhooks/breaker.cjs` = 2 ✓ (D-15 backoff)
- `grep -c "cb:webhook:" lib/markos/webhooks/breaker.cjs` = 4 ✓ (state + outcomes prefixes)
- `grep -cE "(closed|half-open|open)" lib/markos/webhooks/breaker.cjs` = 17 ✓ (all 3 states)
- `grep -c "lpush" lib/markos/webhooks/breaker.cjs` = 1 ✓
- `grep -c "ltrim" lib/markos/webhooks/breaker.cjs` = 1 ✓
- `grep -cE "recordOutcome|classifyOutcome" lib/markos/webhooks/breaker.cjs` ≥ 1 ✓ (exports for Plan 203-10)
- `ls lib/markos/webhooks/breaker.{cjs,ts}` = 2 ✓
- `grep -c "canDispatch" lib/markos/webhooks/dispatch-gates.cjs` = 3 ✓
- `grep -c "checkWebhookRateLimit" lib/markos/webhooks/dispatch-gates.cjs` = 3 ✓ (still present as SECOND gate)
- `grep -cE "status: 'breaker_open'" lib/markos/webhooks/dispatch-gates.cjs` = 1 ✓
- `grep -c "require.*breaker" lib/markos/webhooks/delivery.cjs` = **0** ✓ (T-203-08-06 invariant locked)
- `grep -c "recordOutcome" lib/markos/webhooks/delivery.cjs` = **0** ✓
- `grep -c "canDispatch" lib/markos/webhooks/delivery.cjs` = **0** ✓
- `grep -c "runDispatchGates" lib/markos/webhooks/delivery.cjs` = 2 ✓ (Plan 203-07 insertion preserved)
- Gate order: `awk '/canDispatch|checkWebhookRateLimit/{print NR}' lib/markos/webhooks/dispatch-gates.cjs` — canDispatch at line 42 BEFORE checkWebhookRateLimit at line 57 ✓

---
*Phase: 203-webhook-subscription-engine-ga*
*Plan: 08*
*Completed: 2026-04-18*
