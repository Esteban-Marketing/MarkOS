# Phase 203: Webhook Subscription Engine GA — Research

**Researched:** 2026-04-17
**Domain:** Production-grade outbound webhooks (dashboard, DLQ, signing-secret rotation, rate-limit + circuit breaker, Sentry observability)
**Confidence:** HIGH (standard-stack + adapters), MEDIUM (circuit-breaker state choice — requires small decision call-out)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dashboard UX (`/settings/webhooks`)**
- **D-01:** Subscription list is a **table** — columns: URL, events, status, last delivery, success rate, actions. Mirrors `/settings/mcp` sessions table pattern from 202-09.
- **D-02:** Delivery log uses **inline row expand** — click delivery row → expand shows request/response/headers inline. No drawer, no separate page.
- **D-03:** DLQ pane lives as a **tab on each sub's detail** — `Deliveries | DLQ | Settings` tabs. Scoped to the sub where the problem exists.
- **D-04:** Fleet metrics render as a **hero banner on the index** — 4 hero numbers (24h deliveries / success % / avg latency / DLQ count). Mirrors cost-meter hero from `/settings/mcp`.

**DLQ + Replay**
- **D-05:** Replay supports **single + batch select** — checkbox rows → Replay button, plus single-row replay. No time-range filter (deferred).
- **D-06:** Replay **re-signs with fresh HMAC + current timestamp**. Adds headers `x-markos-replayed-from: {original_ts}` and `x-markos-attempt: {n}` for subscriber audit. Original signature/ts NOT preserved (would force bypassing the 300s skew window from 200-03 — replay-attack vector).
- **D-07:** **No auto-retry from DLQ.** DLQ is terminal after the 24-attempt cap (from 200-03). Replay is always human-triggered. Prevents replay→fail→replay loops.
- **D-08:** **DLQ TTL: 7 days.** Matches Stripe/GitHub replay windows. After 7 days entries are purged from DLQ storage.

**Signing-Secret Rotation**
- **D-09:** Rotation is **admin-triggered only** — tenant admin clicks Rotate. No scheduler. SOC2 expects human-in-loop on secret events.
- **D-10:** Overlap window uses **outbound dual-sign** — during the 30-day grace both secrets sign every webhook. Two headers: `x-markos-signature-v1` (current) + `x-markos-signature-v2` (new). Subscribers verify either. Stripe pattern.
- **D-11:** Notifications at **T-7 + T-1 + T-0 via email to tenant admins** plus dashboard banner during grace. Covers async teams, prevents 401 surprise.
- **D-12:** **Rollback = promote old secret back to active** during the 30-day grace window only. After grace, old secret is purged and unrecoverable. No emergency-restore post-grace.

**Rate-Limit + Circuit Breaker**
- **D-13:** Per-subscription RPS: **plan-tier default + per-sub override (cap, not raise)** — Free 10rps, Team 60rps, Enterprise 300rps. Tenant admin may lower per-sub; cannot exceed plan ceiling. Shares `@upstash/ratelimit` sliding-window instance with 202-04 pipeline.
- **D-14:** Circuit breaker trips on **error-rate window**: >50% of last 20 deliveries fail (5xx or timeout). Sliding window survives single-deploy blips.
- **D-15:** Half-open re-probe uses **exponential backoff 30s → 1m → 2m → 5m → 10m, capped at 10m**. Aligns with existing 200-03 delivery-retry shape.

**Store Adapter**
- **D-16:** **Swap in-memory store → Supabase (durable state) + Vercel Queues (delivery queue) in Wave 1** — per 200-03.1 deferred note. Process-local singleton won't survive Vercel Fluid concurrency across instances. All GA features (DLQ, dashboard, rotation, metrics) need durable state; swap first, build features on it.

### Claude's Discretion
- Internal telemetry schema for Sentry (req_id, sub_id, event_type, delivery_attempt, duration_ms, outcome) — match 202-05 log-drain shape.
- Test-fire flow visual (button placement, payload preview) — follow 200-03 `test-fire.js` endpoint contract.
- Egress SSRF guard for subscriber URLs (DNS rebinding, private-IP block, localhost deny) — standard implementation.
- Event-type filtering at subscribe time — reuse existing `events: string[]` from migration 70 schema.
- Public webhook status page shape (covered by fleet metrics hero; public version = same numbers without per-sub detail).

### Deferred Ideas (OUT OF SCOPE)
- **Custom payload transformations** — Phase 210 connector framework (pre-declared out-of-scope in DISCUSS.md).
- **Time-range replay filter** — single + batch select covers 90% (D-05). Power-user feature deferred.
- **Auto-rotation scheduler (90-day rotate)** — admin-triggered only for now (D-09). Revisit if SOC2 Type 2 compliance demands.
- **Compromise-triggered rotation** — needs anomaly-detection signal source, not in this phase.
- **Post-grace secret restore** — security anti-pattern, explicitly rejected in D-12.
- **Per-sub auto-drain on circuit close** — opt-in flag deferred; manual-only replay for now (D-07).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WHK-01 | Webhook primitive → GA (delivery dashboard, DLQ + replay, signing-secret rotation, per-sub rate-limits, status page, telemetry → Sentry) | Full coverage — Standard Stack (adapter swap + Vercel Queues + dual-sign HMAC), Architecture Patterns (Stripe-style rotation, Opossum-style circuit breaker), Code Examples (Supabase store, dual-sign verify), Common Pitfalls (Fluid Compute in-memory loss, SSRF) |
| QA-01 Contract-first | No new endpoint without F-NN contract | F-72 + F-73 extension + 5 new F-NN contracts sketched in §Contract Plan |
| QA-02 Typed boundary | Zod on every API handler | Reuse pattern from 202-04 pipeline + 202-09 /api/tenant/mcp handlers |
| QA-04 Coverage ≥ 80% | 100% on tenant-isolation/auth paths | Test-architecture §Validation Architecture maps REQ→test file |
| QA-05 Integration-real | Real Supabase (not mocks) for boundary tests | Adapter §Code Examples uses live client injection |
| QA-06 E2E smoke | Playwright for /settings/webhooks critical path | Noted as deferred per 202-10 precedent if project still gated |
| QA-07 Load tests | k6/artillery before GA | §Validation Architecture — reuse 202-10 `scripts/load/mcp-smoke.mjs` shape |
| QA-09 OTEL | Include `webhook_subscription_id` in traces | §Observability — Sentry tags + log-drain shape mirrors D-30 |
| QA-10 Per-tenant cost + kill-switch | Atomic RPC pattern | §Code Examples — share `check_and_charge_mcp_budget` shape for RPS cap |
| QA-11 Threat model | STRIDE doc in DISCUSS.md | §Security Domain — replay/SSRF/leak already scoped |
| QA-12 Platform baseline | CSP / HSTS / rate-limit per-key / signed cookies | Mostly inherited from 201 middleware; webhook-specific SSRF + signed-inbound gates noted |
| QA-13 Idempotent migrations + rollback | Migration 72 + rollback script | §Migration Plan — 72_markos_webhook_dlq_and_rotation.sql + rollback |
| QA-14 Accessibility AA | axe-playwright | §UI-SPEC shipped — tokens + a11y contract locked |
| QA-15 Docs-as-code | docs + llms.txt | §Documentation Plan — `docs/webhooks.md` + `docs/webhooks/rotation.md` + llms.txt append |

Requirements covered: **WHK-01 + QA-01..15 (15/15)**. Coverage mapping is exhaustive; planner should map each Plan's tasks to requirement IDs on the way in.
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **`.protocol-lore/QUICKSTART.md`** first, `.planning/STATE.md` is canonical state.
- **GSD vs MarkOS split:** GSD engineering methodology under `.agent/get-shit-done/`; MarkOS marketing protocol under `.agent/markos/`. 203 is a GSD engineering phase.
- **Dual-export `.cjs` + `.ts`** for every `lib/markos/*` module. CI enforces parity. Webhook additions follow it.
- **Tenant-scoped RLS** on every new table (precedent: migration 70 already does this for webhook subscriptions/deliveries).
- **TDD RED → GREEN per task** — established across 200/201/202.
- **Contracts before implementation** — F-72/F-73 YAML updated first; `scripts/openapi/build-openapi.cjs` regenerates.
- **Tests:** `npm test` → `node --test test/**/*.test.js`.
- **`--no-verify` in parallel waves** (202 precedent); orchestrator validates hooks on merge.

## Summary

Phase 203 graduates the 200-03 webhook primitive (4 HTTP endpoints + HMAC signer + in-memory store singleton) into a GA-grade service on top of **Supabase durable state + Vercel Queues push-mode consumers** with a tenant-admin dashboard mirroring `/settings/mcp` from 202-09. The stack is overwhelmingly "reuse, don't re-invent" — `@upstash/ratelimit 2.0.8` (already in tree, 202-04 instance), `@sentry/nextjs 10.49.0` (already in tree, 202-05 `captureToolError`/`emitLogLine` wired), `@supabase/supabase-js 2.58.0`, and `@vercel/queue 0.1.6` (net-new dependency, the one and only new dep).

The two areas that need careful planning: (1) **the store-adapter swap must land in Wave 1 before any GA feature**, because dual-sign HMAC, DLQ, rotation grace, and circuit-breaker state are all stateful across Fluid Compute instances — the current process-local store silently loses everything on the second invocation; (2) **circuit-breaker state storage** has three options (Upstash Redis sliding window, Supabase sliding view, in-memory fallback) — the recommendation is **Upstash Redis** because `@upstash/ratelimit` sliding-window already survives multi-instance and the 202-04 pattern is identical.

**Primary recommendation:** Wave 1 = Supabase + Vercel Queues adapter swap (zero GA feature work, just durable substrate); Waves 2-5 layer DLQ → rotation → dashboard → rate-limit/breaker → status-page+Sentry on top, each a drop-in because the adapter interfaces (`subscriptions`, `deliveries`, `queue`) are already in `store.cjs`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@vercel/queue` | 0.1.6 | Durable push-mode delivery queue (replaces in-memory `createInMemoryQueue`) | [CITED: vercel.com/docs/queues] Vercel-native, at-least-once delivery, 3-AZ durability, `handleCallback` with `retry` callback, native `idempotencyKey` deduplication, 60s-7d retention. Aligns with QUALITY-BASELINE §Platform Choices "Vercel Queues — all async work (webhook delivery, evals, fine-tune prep, connector ingest)." `[VERIFIED: npm view @vercel/queue version → 0.1.6]` |
| `@supabase/supabase-js` | ^2.58.0 (in tree) | Durable subscription + delivery + DLQ + rotation + metrics state | `[VERIFIED: package.json]` 11 Supabase migrations already in project. Extends migration 70 pattern with migration 72. |
| `@upstash/ratelimit` | ^2.0.8 (in tree) | Per-subscription RPS cap (D-13) + circuit-breaker state substrate (MEDIUM conf) | `[VERIFIED: package.json + lib/markos/mcp/rate-limit.cjs]` Already ships sliding-window 60 rpm/session + 600 rpm/tenant for MCP (202-04). Reuse Redis connection; different key prefix. |
| `@upstash/redis` | ^1.37.0 (in tree) | Connection primitive for ratelimit + breaker-state | `[VERIFIED: package.json]` |
| `@sentry/nextjs` | ^10.49.0 (in tree) | Exception capture for delivery + rotation + replay failures (D-32 shape from 202-05) | `[VERIFIED: package.json + lib/markos/mcp/sentry.cjs]` `captureToolError` pattern with lazy-import + triple-safety is directly reusable. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ajv` + `ajv-formats` | ^8.18.0 / ^3.0.1 (in tree) | Input validation on `/api/tenant/webhooks/*` handlers (QA-02) | Mirror 202-04 `lib/markos/mcp/ajv.cjs` strict-mode config verbatim |
| `@vercel/edge-config` | ^1.4.3 (in tree) | Optional: plan-tier RPS cap lookup if hot-path latency demands (not 203 priority) | Noted only; 203 reads `markos_orgs.plan_tier` via Supabase like 202-09 `usage.js` |
| `node:crypto` (stdlib) | — | HMAC-SHA256 signer (existing), randomBytes for new secret generation, randomUUID for delivery_id/rotation_id | Already used in `lib/markos/webhooks/signing.cjs` and `engine.cjs` |

### Explicitly NOT added
| Would-be addition | Why rejected |
|-------------------|--------------|
| `opossum` (circuit breaker) | Designed for in-process state; Vercel Fluid Compute's concurrency-across-instances model breaks its rolling window. Build the breaker on Upstash Redis sliding-window (pattern already in `lib/markos/mcp/rate-limit.cjs`) + an explicit "closed/half-open/open" state cell keyed `cb:webhook:sub:{sub_id}`. See §Common Pitfalls. |
| `bull`/`bullmq` | Redis-backed queue; Vercel Queues is the blessed platform primitive (QUALITY-BASELINE §Platform Choices) — adding a second queue doubles ops surface. |
| `request-filtering-agent` | `[CITED: github.com/azu/request-filtering-agent]` Does NOT support native Node.js `fetch`/undici — project uses `fetch` in `lib/markos/webhooks/engine.cjs` line 91. Inline SSRF check (resolve DNS, validate IP ranges pre-fetch) is the right shape. See §Common Pitfalls Pitfall 4. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel Queues | Upstash QStash | QStash has native DLQ + per-endpoint rate-limit at the queue layer, saves some code. **Rejected:** Vercel Queues is the quality-baseline platform choice; diverging splits platform governance. |
| Supabase rollup table for metrics | Read-through Supabase MVs / materialized views | MVs need scheduled refresh; 30s auto-refresh cadence on the dashboard is fine-grained enough that a simple `select count(*) group by` over `markos_webhook_deliveries` with a tenant_id + created_at index is cheaper than MV maintenance. Recommendation: **no rollup table in Wave 1**; revisit if the `count(*)` hits p95 > 150ms. |
| Opossum in-process breaker | Upstash Redis sliding-window state | Opossum loses state on Fluid Compute reuse; Redis survives. See Pitfall 1. |

**Installation (net-new dep in Wave 1 only):**

```bash
npm install @vercel/queue
# version: 0.1.6  [VERIFIED: npm view @vercel/queue version]
```

**Version verification** (run before Wave 1 execution):

```bash
npm view @vercel/queue version         # currently 0.1.6 — BETA (queue/v2beta trigger)
npm view @upstash/ratelimit version    # currently 2.0.8 — matches tree
npm view @sentry/nextjs version        # currently 10.49.0 — matches tree
```

Note: Vercel Queues is currently in public beta (`queue/v2beta` trigger name). `[CITED: vercel.com/docs/queues/concepts]` The `@vercel/queue` SDK is stable and the API surface (`send`, `handleCallback`, `retry`) is documented for production use, but the `experimentalTriggers` schema in `vercel.json` is explicitly `v2beta`. Planner: include a one-line deferred-risk note that a Vercel GA schema bump may require a trigger-name rename (`queue/v2beta` → `queue/v1`-or-similar). No behavior change expected.

## Architecture Patterns

### Recommended Project Structure

```
lib/markos/webhooks/
├── signing.cjs + .ts        # EXISTING — extend: add signPayloadDualSign(v1Secret, v2Secret, body)
├── engine.cjs + .ts         # EXISTING — extend: subscribe adds secret_version + rps_override_rps
├── delivery.cjs + .ts       # EXISTING — extend: processDelivery consults breaker + signs dual during grace
├── store.cjs + .ts          # SWAP — new module holds adapter wiring; exports getWebhookStores()
├── store-supabase.cjs + .ts # NEW Wave 1 — implements subscriptions, deliveries, dlq, rotations, breaker-state
├── store-vercel-queue.cjs + .ts  # NEW Wave 1 — implements queue.push via @vercel/queue send()
├── rate-limit.cjs + .ts     # NEW Wave 4 — per-sub RPS cap wrapper around @upstash/ratelimit
├── breaker.cjs + .ts        # NEW Wave 4 — Upstash Redis sliding-window circuit breaker
├── rotation.cjs + .ts       # NEW Wave 3 — startRotation / rollback / finalize + grace-window tick
├── dlq.cjs + .ts            # NEW Wave 2 — listDLQ / replaySingle / replayBatch / purgeExpired
├── metrics.cjs + .ts        # NEW Wave 5 — fleet aggregation query + per-sub breakdown
├── ssrf-guard.cjs + .ts     # NEW Wave 1 (security) — pre-flight DNS resolve + private-IP block
└── sentry.cjs + .ts         # NEW Wave 5 — reuse 202-05 sentry.cjs shape with domain:'webhook' tag

api/
├── webhooks/                       # EXISTING — 4 endpoints preserved; subscribe gets SSRF guard + rps_override param
│   ├── subscribe.js                # extended
│   ├── unsubscribe.js              # unchanged
│   ├── list.js                     # unchanged
│   └── test-fire.js                # extended — emits log-drain + Sentry tag
└── tenant/webhooks/                # NEW — all tenant-admin dashboard endpoints (mirrors api/tenant/mcp/)
    ├── fleet-metrics.js            # GET /api/tenant/webhooks/fleet-metrics (S1 hero)
    ├── subscriptions/
    │   ├── list.js                 # GET /api/tenant/webhooks/subscriptions (dashboard reload)
    │   └── [sub_id]/
    │       ├── update.js           # POST (Settings tab save)
    │       ├── delete.js           # POST (Danger zone)
    │       ├── rotate.js           # POST (Start rotation)
    │       ├── rotate/rollback.js  # POST (Rollback during grace)
    │       ├── deliveries/
    │       │   └── [delivery_id]/replay.js  # POST (Single replay)
    │       └── dlq/
    │           └── replay.js       # POST (Batch replay)
    └── rotations/
        └── active.js               # GET /api/tenant/webhooks/rotations/active (S4 banner fetch)

api/public/
└── webhooks/
    └── status.js                   # GET /api/public/webhooks/status (S3 public page; 60s cache)

api/cron/
├── webhooks-dlq-purge.js           # NEW Wave 2 — daily DLQ TTL sweep (>7d)
└── webhooks-rotation-notify.js     # NEW Wave 3 — daily T-7/T-1/T-0 email send

app/(markos)/
├── settings/webhooks/              # NEW — S1 + S2
│   ├── page.tsx / .module.css                  (S1 index)
│   └── [sub_id]/page.tsx / .module.css         (S2 detail)
├── status/webhooks/
│   └── page.tsx / .module.css      (S3 public status — standalone)
└── _components/
    ├── RotationGraceBanner.tsx
    └── RotationGraceBanner.module.css          (S4 global banner)

contracts/
├── F-72-webhook-subscription-v1.yaml   # EXISTING — extend: rotation fields, rps_override
├── F-73-webhook-delivery-v1.yaml        # EXISTING — extend: dlq_reason, replayed_from, attempt headers
├── F-96-webhook-dashboard-v1.yaml       # NEW — all /api/tenant/webhooks/* paths + 402/403/404 envelopes
├── F-97-webhook-rotation-v1.yaml        # NEW — rotate / rollback / T-0 semantics
├── F-98-webhook-dlq-v1.yaml             # NEW — replay/delete endpoints + retention envelope
├── F-99-webhook-status-v1.yaml          # NEW — public status page GET (no auth)
└── F-100-webhook-breaker-v1.yaml        # NEW — per-sub rate-limit + breaker state descriptor

supabase/migrations/
├── 72_markos_webhook_dlq_and_rotation.sql          # NEW — columns on existing tables + 3 new tables
└── rollback/72_markos_webhook_dlq_and_rotation.rollback.sql
```

### Pattern 1: Store Adapter Swap (Wave 1 foundation)

**What:** Replace `createInMemoryStore()` / `createInMemoryDeliveryStore()` / `createInMemoryQueue()` with Supabase + Vercel Queues adapters. The interface shape in `store.cjs` is already designed for this.

**When to use:** Immediately — all GA features depend on cross-instance durable state.

**Example shape** (reuse existing interface — zero caller changes):

```javascript
// lib/markos/webhooks/store.cjs (rewritten)
'use strict';
const { createSupabaseSubscriptionsStore, createSupabaseDeliveriesStore } = require('./store-supabase.cjs');
const { createVercelQueueClient } = require('./store-vercel-queue.cjs');
const { createInMemoryStore } = require('./engine.cjs');
const { createInMemoryDeliveryStore, createInMemoryQueue } = require('./delivery.cjs');

function getWebhookStores(deps = {}) {
  // Test + local dev: fall back to in-memory if NO_SUPABASE env is set OR deps.mode === 'memory'
  const mode = deps.mode || (process.env.WEBHOOK_STORE_MODE || 'supabase');
  if (mode === 'memory') {
    return {
      subscriptions: createInMemoryStore(),
      deliveries:    createInMemoryDeliveryStore(),
      queue:         createInMemoryQueue(),
    };
  }
  const supabase = deps.supabase || require('@supabase/supabase-js').createClient(
    process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  return {
    subscriptions: createSupabaseSubscriptionsStore(supabase),
    deliveries:    createSupabaseDeliveriesStore(supabase),
    queue:         createVercelQueueClient({ topic: 'markos-webhook-delivery' }),
  };
}

function _resetWebhookStoresForTests() { /* unchanged — per-test isolation */ }

module.exports = { getWebhookStores, _resetWebhookStoresForTests };
```

**Key shape constraints the adapters MUST preserve:**
- `subscriptions.insert(row)` → `Promise<Row>` (ignore RLS on service-role client)
- `subscriptions.updateActive(tenant_id, id, active)` → `Promise<Row | null>`
- `subscriptions.listByTenant(tenant_id)` → `Promise<Row[]>`
- `subscriptions.findById(tenant_id, id)` → `Promise<Row | null>` (tenant_id is the FIRST filter, then id)
- `deliveries.insert(row)` → `Promise<Row>`
- `deliveries.findById(id)` → `Promise<Row | null>`
- `deliveries.update(id, patch)` → `Promise<Row | null>` (last-write-wins is fine; Vercel Queues at-least-once means we may see duplicate `update` — make status transitions idempotent)
- `queue.push(delivery_id)` → `Promise<void>` (Vercel `send('markos-webhook-delivery', { delivery_id })`)

Any caller that resolves stores via `getWebhookStores()` (all 4 existing endpoints do) gets durable state transparently.

### Pattern 2: Vercel Queues Push-Mode Consumer

**What:** Replace `createInMemoryQueue().drain()` sync dispatch with Vercel Queues push handler.

**When to use:** Wave 1 — every delivery enqueued via `queue.push(delivery_id)` is processed by a route handler registered in `vercel.json`.

**Example:**

```javascript
// api/webhooks/queues/deliver.js  (NEW Wave 1 — Vercel Queues consumer)
'use strict';
const { handleCallback } = require('@vercel/queue');
const { processDelivery } = require('../../lib/markos/webhooks/delivery.cjs');
const { getWebhookStores } = require('../../lib/markos/webhooks/store.cjs');
const { emitLogLine } = require('../../lib/markos/webhooks/log-drain.cjs'); // NEW — webhook variant
const { captureToolError } = require('../../lib/markos/webhooks/sentry.cjs');

module.exports = handleCallback(
  async (message, metadata) => {
    const { delivery_id } = message;
    const { deliveries, subscriptions } = getWebhookStores();
    const started = Date.now();
    let result;
    try {
      result = await processDelivery(deliveries, subscriptions, delivery_id);
      return result; // auto-ack on non-throw
    } catch (err) {
      captureToolError(err, { req_id: metadata.messageId, delivery_id });
      throw err; // let Vercel retry per `retry` callback below
    } finally {
      emitLogLine({
        domain: 'webhook',
        req_id: metadata.messageId,
        delivery_id,
        delivery_count: metadata.deliveryCount,
        duration_ms: Date.now() - started,
        status: result?.delivered ? 'delivered' : (result?.status || 'unknown'),
      });
    }
  },
  {
    visibilityTimeoutSeconds: 120,  // allow slow subscribers (D-18 webhook latency budget)
    retry: (error, metadata) => {
      // Bounded retry: after 24 attempts, ack (→ DLQ handled by delivery.cjs state)
      if (metadata.deliveryCount > 24) return { acknowledge: true };
      // Reuse existing computeBackoffSeconds(attempt) shape from engine.cjs
      const delay = Math.min(86400, 5 * Math.pow(2, Math.min(metadata.deliveryCount, 15)));
      return { afterSeconds: delay };
    },
  },
);
```

And `vercel.json` registration:

```json
{
  "functions": {
    "api/webhooks/queues/deliver.js": {
      "experimentalTriggers": [
        { "type": "queue/v2beta", "topic": "markos-webhook-delivery", "retryAfterSeconds": 60 }
      ]
    }
  }
}
```

**IMPORTANT:** `[CITED: vercel.com/docs/queues/concepts]` Vercel Queues does **NOT** have a native DLQ — when the retry callback returns `{ acknowledge: true }` the message is dropped. The application-level DLQ is the `markos_webhook_deliveries.status='failed'` rows (existing from 200-03). We build the DLQ pane (D-03) as a tenant-scoped `SELECT ... WHERE status='failed' AND created_at > now() - 7 days` — Supabase is the DLQ substrate, not Vercel Queues.

### Pattern 3: Dual-Signature Rotation (Stripe canonical)

**What:** During the 30-day grace window, outbound webhooks carry two HMAC headers. Subscribers verify either.

**When to use:** Wave 3 — rotation flow.

**Example:**

```javascript
// lib/markos/webhooks/signing.cjs — extend
function signPayloadDualSign(v1Secret, v2Secret, body, now = Date.now) {
  const { signature: sig1, timestamp } = signPayload(v1Secret, body, now);
  if (!v2Secret) return { headers: { 'X-Markos-Signature-V1': sig1, 'X-Markos-Timestamp': timestamp } };
  const sig2 = `sha256=${require('node:crypto')
    .createHmac('sha256', v2Secret)
    .update(`${timestamp}.${body}`)
    .digest('hex')}`;
  return {
    headers: {
      'X-Markos-Signature-V1': sig1,
      'X-Markos-Signature-V2': sig2,
      'X-Markos-Timestamp': timestamp,
    },
  };
}
```

`[CITED: docs.stripe.com/webhooks/signature]` Stripe's `Stripe-Signature: t=...,v1=sig1,v1=sig2` single-header format is the alternative (one header, multiple `v1=`). UI-SPEC locks **two headers** (`x-markos-signature-v1`, `x-markos-signature-v2`) — this is the cleaner spec choice for developer-native audiences (easier to grep/curl/log) and explicitly locked in D-10. Do not switch to the Stripe single-header shape mid-flight.

**Subscriber verification copy** (ships in `docs/webhooks.md`):
```
const v1 = req.headers['x-markos-signature-v1'];
const v2 = req.headers['x-markos-signature-v2'];  // present during rotation grace only
const ts = req.headers['x-markos-timestamp'];
const body = rawBody.toString('utf8');
if (verify(SECRET, body, v1, ts) || (v2 && verify(SECRET_NEW, body, v2, ts))) {
  // OK
}
```

### Pattern 4: Upstash Redis Circuit Breaker (D-14, D-15)

**What:** Track last-20-delivery outcomes in a Redis list; trip when error rate > 50%; half-open probe after exponential backoff.

**When to use:** Wave 4 — wraps `processDelivery` call.

**Why Redis not in-memory:** Vercel Fluid Compute reuses function instances but there is no guarantee all deliveries for one subscription hit the same instance. An in-memory `Map<sub_id, recentOutcomes[]>` silently loses state on instance turnover. Upstash Redis sliding-window is the existing pattern from 202-04 (`lib/markos/mcp/rate-limit.cjs` line 18).

**Example:**

```javascript
// lib/markos/webhooks/breaker.cjs (NEW Wave 4)
'use strict';
const WINDOW_SIZE = 20;
const TRIP_THRESHOLD = 0.5;  // D-14
const HALF_OPEN_BACKOFF_SEC = [30, 60, 120, 300, 600];  // D-15 exponential

async function recordOutcome(redis, sub_id, outcome /* 'success' | 'failure' */) {
  const listKey = `cb:webhook:outcomes:${sub_id}`;
  const stateKey = `cb:webhook:state:${sub_id}`;
  await redis.lpush(listKey, outcome);
  await redis.ltrim(listKey, 0, WINDOW_SIZE - 1);   // keep last 20
  await redis.expire(listKey, 3600);                // 1h TTL — resets on idle
  const last20 = await redis.lrange(listKey, 0, WINDOW_SIZE - 1);
  if (last20.length < WINDOW_SIZE) return { state: 'closed' }; // need 20 samples first
  const failures = last20.filter(o => o === 'failure').length;
  const rate = failures / WINDOW_SIZE;
  if (rate > TRIP_THRESHOLD) {
    const currentState = await redis.get(stateKey);
    const attempt = currentState ? JSON.parse(currentState).trips + 1 : 1;
    const backoff = HALF_OPEN_BACKOFF_SEC[Math.min(attempt - 1, HALF_OPEN_BACKOFF_SEC.length - 1)];
    await redis.set(stateKey, JSON.stringify({
      state: 'open',
      trips: attempt,
      probe_at: Date.now() + backoff * 1000,
    }), { ex: backoff + 3600 });
    return { state: 'open', probe_at: Date.now() + backoff * 1000, trips: attempt };
  }
  return { state: 'closed' };
}

async function canDispatch(redis, sub_id) {
  const stateKey = `cb:webhook:state:${sub_id}`;
  const raw = await redis.get(stateKey);
  if (!raw) return { can_dispatch: true, state: 'closed' };
  const { state, probe_at, trips } = JSON.parse(raw);
  if (state === 'closed') return { can_dispatch: true, state };
  if (Date.now() >= probe_at) {
    // Half-open — allow ONE probe call through; closing happens in recordOutcome on success
    return { can_dispatch: true, state: 'half-open', trips };
  }
  return { can_dispatch: false, state: 'open', probe_at, trips };
}

module.exports = { recordOutcome, canDispatch, WINDOW_SIZE, TRIP_THRESHOLD, HALF_OPEN_BACKOFF_SEC };
```

**NOTE:** This is a pragmatic approximation. True "last N rolling" requires either ZSETs with timestamp scores or a dedicated Redis module. The simple LPUSH/LTRIM window is race-prone (two concurrent failures may trim each other's samples), but for a 20-sample window deciding a 50% threshold, the noise floor is acceptable. Document this in the plan's threat-model as an `accept` disposition.

### Anti-Patterns to Avoid

- **In-memory circuit-breaker state** (opossum in-process). Fluid Compute will silently break it.
- **Single-header dual-signature (Stripe `v1=a,v1=b` shape)** mid-implementation. UI-SPEC locked two separate headers in D-10. Do not refactor.
- **DLQ-as-separate-Vercel-Queue.** Vercel Queues has no native DLQ; trying to bolt one on (publish on final failure) creates a second moving part. `status='failed'` rows in Supabase ARE the DLQ.
- **Auto-rotation scheduler.** Explicitly deferred in D-09. Do not add a cron that triggers secret rotation without admin click.
- **Bypassing `getWebhookStores()`.** Every subsystem MUST resolve stores through the singleton or tests break and prod loses the adapter indirection.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Durable webhook queue | Custom Redis list + LPOP worker | **`@vercel/queue`** | Native 3-AZ durability, idempotency keys, visibility timeouts, push-mode security (air-gapped consumer route); QUALITY-BASELINE platform choice. `[CITED: vercel.com/docs/queues]` |
| Rate limiting per-sub | Custom token bucket | **`@upstash/ratelimit` sliding-window** | Already in tree at version 2.0.8 for MCP pipeline (202-04); tested; sliding window survives Fluid Compute. `[VERIFIED: lib/markos/mcp/rate-limit.cjs]` |
| HMAC sign/verify | `crypto.createHmac` in each handler | **Existing `lib/markos/webhooks/signing.cjs`** — extend with `signPayloadDualSign` | Already tested (8 tests); timestamp-skew protection already in place; extend the module, don't rewrite. |
| Exception capture | Custom try/catch log + email | **`@sentry/nextjs` + 202-05 `lib/markos/mcp/sentry.cjs` shape (copy to webhook domain)** | Lazy-import + triple-safety already proven in Phase 202. Copy the file, change `domain: 'mcp'` tag to `domain: 'webhook'`. Zero new deps. `[VERIFIED: lib/markos/mcp/sentry.cjs]` |
| Structured log lines | `console.log({...})` ad-hoc | **`emitLogLine` pattern from 202-05** (copy to `lib/markos/webhooks/log-drain.cjs`) | D-30 enumerated-field shape prevents log-drain injection; proven wire-safe (9 tests). Copy verbatim with `domain: 'webhook'`. `[VERIFIED: lib/markos/mcp/log-drain.cjs]` |
| Email send (T-7/T-1/T-0 notifications) | SMTP client in-repo | **Resend** (already used by 202-10 `scripts/mcp/emit-kpi-digest.mjs`) | In-tree pattern with dry-run fallback. Reuse it; do not add Nodemailer. |
| OpenAPI merge | Hand-editing `contracts/openapi.json` | **`scripts/openapi/build-openapi.cjs`** | Already globs `contracts/F-*.yaml` — adds our F-96..F-100 automatically. |
| Audit event emission | Direct INSERT into `markos_audit_log` | **`enqueueAuditStaging` from `lib/markos/audit/writer.cjs`** | Phase 201 hash-chain fabric. `source_domain: 'webhooks'` is **already in AUDIT_SOURCE_DOMAINS** (writer.cjs line 7 — `'webhooks'` is the 7th entry). **NO writer.cjs edit needed** — this is the one 200-03 teed up correctly. `[VERIFIED: lib/markos/audit/writer.cjs:5-10]` |
| SSRF pre-flight | Regex on URL string | **DNS resolve + IP range check** — see §Code Examples | Regex can't catch DNS-rebinding; resolve at dispatch time and compare against RFC1918/loopback/link-local ranges. `[CITED: owasp.org/www-community/pages/controls/SSRF_Prevention_in_Nodejs]` |

**Key insight:** Phase 203 is an integration phase, not a build phase. Nearly every primitive already exists in the repo. The new code is **glue + adapters + UI** — and the UI is already design-contracted by UI-SPEC.

## Runtime State Inventory

This is a greenfield GA phase, not a rename/refactor — but there ARE runtime concerns because Wave 1 migrates from in-memory to durable storage.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | (empty — Phase 200-03 shipped with in-memory store, no production data yet). Once Wave 1 ships, `markos_webhook_subscriptions` + `markos_webhook_deliveries` become canonical stores. | **None for 203.** Planner: verify with user that 200-03 has not yet served production tenants; if it has, add an "export in-memory state at deploy time" side-task (ephemeral so effectively impossible — clarify with user). |
| Live service config | Vercel `vercel.json` cron registry (4 entries, from 202-10: session-cleanup, audit-drain, lifecycle-purge, mcp-kpi-digest). Wave 2 + Wave 3 add two more: `webhooks-dlq-purge` + `webhooks-rotation-notify`. | Extend `vercel.ts` — atomic edit preserves existing 5 entries. Existing 202 crons unaffected. |
| OS-registered state | **None.** Vercel/serverless — no OS-level daemons or scheduled tasks. | None — verified by architecture model. |
| Secrets / env vars | New: `SUPABASE_SERVICE_ROLE_KEY` (already in tree for 201+), `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (already in tree for 202-04), `SENTRY_DSN` (already in tree for 202-05), `RESEND_API_KEY` (already in tree for 202-10). **Net-new env:** `MARKOS_WEBHOOK_CRON_SECRET` for the 2 new crons. | Planner: document `MARKOS_WEBHOOK_CRON_SECRET` in deployment runbook; match 202-01 cron-secret pattern from `api/mcp/session/cleanup.js`. |
| Build artifacts | None — plain JS/TS, no compilation pipeline beyond Next.js build. | None. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥ 20.16.0 | Entire project | ✓ | per package.json engines | — |
| Supabase (live project) | Wave 1 adapter + migration 72 | ✓ | Already ships 11 migrations | In-memory mode via `WEBHOOK_STORE_MODE=memory` for local dev |
| Upstash Redis | Wave 4 rate-limit + breaker | ✓ | Already used by 202-04 | None needed — required for multi-instance state |
| Vercel Queues | Wave 1 delivery queue | ✓ (Vercel platform, public beta) | `@vercel/queue` 0.1.6 `[VERIFIED: npm]` | Poll-mode consumer if push triggers flake; in-memory for local tests |
| Sentry project | Wave 5 telemetry | ✓ | `@sentry/nextjs` 10.49.0 already wired | Graceful degrade: sentry.cjs no-op when `SENTRY_DSN` unset (202-05 pattern) |
| Resend | Wave 3 rotation T-7/T-1/T-0 emails | ✓ (via `emit-kpi-digest.mjs`) | SDK version per 202-10 | Console-log fallback (same pattern as 202-10) |
| `npm view` for version check | Research-time only | ✓ | — | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None — every capability is either present or has a proven fallback pattern from 202.

## Common Pitfalls

### Pitfall 1: Process-local store survives local tests, silently drops data in production

**What goes wrong:** The current `lib/markos/webhooks/store.cjs` uses module-level `_subscriptions`, `_deliveries`, `_queue` singletons. In Node test mode the singletons live for the process lifetime. In Vercel Fluid Compute each function invocation may or may not reuse an instance. When it does NOT reuse (cold start, cross-instance concurrency), the new process has empty maps — every subscription looks deleted, every delivery vanishes.

**Why it happens:** Serverless concurrency model. A subscription created on instance A is invisible to delivery processing on instance B. Test suites don't catch it because Node test mode is single-process.

**How to avoid:** Wave 1 swap MUST ship before any other GA feature. Adapter-backed stores read from Supabase on every call — stateless. Planner: make Wave 1 the hard dependency gate for Waves 2+.

**Warning signs:** 200-03 currently passes 48/48 tests — that's in-memory mode. First production tenant → deliveries disappear → user-visible 404. **Never** launch 203 to production with 200-03 store unchanged.

### Pitfall 2: Circuit breaker in-memory state lost on Fluid Compute instance turnover

**What goes wrong:** If the breaker tracks "last 20 outcomes" in a JS `Map` inside `delivery.cjs`, a new function instance starts with an empty map. The breaker never trips. Tripped breakers reset to closed on cold start.

**Why it happens:** Same as Pitfall 1 — shared state across invocations is NOT a serverless guarantee. Fluid Compute reuse is opportunistic.

**How to avoid:** Use Upstash Redis for the outcome history + breaker state (§Pattern 4). The 202-04 rate-limit pattern is the proof-of-life.

**Warning signs:** Breaker tests pass in `node --test` (same process) but production dashboards show "Healthy" for endpoints that have been 500-ing for an hour.

### Pitfall 3: Replay preserves original signature + timestamp → bypasses 300s skew window

**What goes wrong:** Naïve replay re-sends the original body WITH the original `X-Markos-Signature` + `X-Markos-Timestamp`. Subscribers correctly reject it (timestamp older than 300s) — but if the system accepts-and-forwards, it's a replay-attack oracle.

**Why it happens:** "Replay" as a mental model conflates "re-send the same event" with "re-sign and re-deliver." The correct semantic is the second: re-sign with **current** timestamp + current secret, add audit headers.

**How to avoid:** D-06 already locks this. `lib/markos/webhooks/dlq.cjs` replay function MUST call `signPayload(subscription.secret, body, Date.now)` (fresh) and add `x-markos-replayed-from: {original_ts}` + `x-markos-attempt: {n}` headers. Never pass original ts/sig through.

**Warning signs:** Subscribers start failing replayed deliveries with "signature timestamp too old" — trace back to replay code path.

### Pitfall 4: SSRF via subscribe URL → callback hits internal services

**What goes wrong:** Tenant creates subscription with `url: "http://169.254.169.254/latest/meta-data"` (AWS IMDS) or `url: "http://localhost:8080/admin"` or `url: "http://attacker.com/rebind"` where DNS flips between safe and internal IPs (DNS-rebinding).

**Why it happens:** Current `assertValidUrl()` in `engine.cjs` only checks `protocol === 'http:' || 'https:'`. No private-IP block, no DNS pre-resolution.

**How to avoid:** Ship `lib/markos/webhooks/ssrf-guard.cjs` in Wave 1. Pattern:

```javascript
// lib/markos/webhooks/ssrf-guard.cjs
'use strict';
const { lookup } = require('node:dns').promises;
const net = require('node:net');

const BLOCKED_V4 = [
  { cidr: '127.0.0.0/8',   name: 'loopback' },
  { cidr: '10.0.0.0/8',    name: 'private' },
  { cidr: '172.16.0.0/12', name: 'private' },
  { cidr: '192.168.0.0/16',name: 'private' },
  { cidr: '169.254.0.0/16',name: 'link-local (cloud IMDS)' },
  { cidr: '0.0.0.0/8',     name: 'unspecified' },
];

function cidrContains(cidr, ip) { /* standard 32-bit-mask impl */ }

async function assertUrlIsPublic(urlString) {
  const url = new URL(urlString);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('invalid_scheme');
  // HTTPS-only enforcement for subscriber URLs (UI-SPEC locks "HTTPS required")
  if (url.protocol !== 'https:') throw new Error('https_required');
  const host = url.hostname;
  // Short-circuit obvious cases
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) throw new Error('private_ip');
  const { address: ip, family } = await lookup(host, { family: 0 });
  if (family === 4) {
    for (const { cidr, name } of BLOCKED_V4) {
      if (cidrContains(cidr, ip)) throw new Error(`private_ip:${name}`);
    }
  }
  // IPv6: reject ::1, fc00::/7, fe80::/10, ::ffff:*/96 mapped v4 private
  if (family === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) {
      throw new Error('private_ip:v6');
    }
  }
  return { ip, family };
}

module.exports = { assertUrlIsPublic };
```

Call from `api/webhooks/subscribe.js` AND `lib/markos/webhooks/delivery.cjs` (DNS-rebinding defense — DNS may change between subscribe-time and dispatch-time; re-resolve at dispatch and reject on flip). `[CITED: owasp.org/www-community/pages/controls/SSRF_Prevention_in_Nodejs]`

**DNS-rebinding specific note:** `assertUrlIsPublic` at subscribe-time catches subscribe-time attacks. At dispatch time, `fetch()` does its OWN DNS lookup — if the host rebound to a private IP between subscribe and dispatch, fetch will connect to the private IP without the guard noticing. The truly-robust fix is pinning the validated IP via a custom `undici.Agent` with a `connect` hook that re-validates the resolved IP immediately before the connection. `[CITED: github.com/nodejs/undici/issues/2019]` For 203 Wave 1, ship the subscribe-time check + document this as an explicit `accept` in the threat model (DNS rebinding mid-flight is a real but rare attack; rotating to a pinned undici dispatcher is Phase 203.1 work).

**Warning signs:** Penetration-test finding "SSRF via webhook URL" — and it WILL be a pentest finding if left unchecked for QA-11.

### Pitfall 5: Vercel Queues `queue/v2beta` trigger rename breaks consumer after Vercel GA

**What goes wrong:** `vercel.json` registers `{"type": "queue/v2beta", ...}`. When Vercel Queues exits beta (timeline unknown), the trigger type may rename. Deployment silently fails: messages publish successfully but no consumer picks them up.

**Why it happens:** Beta APIs. `[CITED: vercel.com/docs/queues/sdk]` The SDK top-level `send`/`handleCallback` are stable but the `experimentalTriggers` schema carries `v2beta` in its name.

**How to avoid:** Include a health-check smoke test in the phase 203 verifier: deploy → publish a test-fire → assert consumer processed it within 10s. Alert on regression. Document the trigger-type as a deferred migration item (`deferred-items.md`).

**Warning signs:** Dashboard shows backlog of messages; `status='pending'` rows accumulate in `markos_webhook_deliveries`; no ERR in logs.

### Pitfall 6: Supabase RLS blocks service-role inserts for delivery updates

**What goes wrong:** The 200-03 migration 70 sets `ENABLE ROW LEVEL SECURITY` with membership-backed policies on `markos_webhook_deliveries`. When the Vercel Queues consumer (running with service-role key) writes delivery status updates, the RLS insert policy fails because `auth.jwt()->>'sub'` is NULL (service-role bypasses, but only via the right client flag).

**Why it happens:** Service-role key bypasses RLS only when the client is instantiated without user-JWT context. If the consumer code uses the same `createClient` that the user-facing routes use, RLS engages.

**How to avoid:** Use a dedicated admin client for the consumer:

```javascript
// lib/markos/webhooks/store-supabase.cjs
const { createClient } = require('@supabase/supabase-js');
const adminClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, db: { schema: 'public' } }
);
```

Service-role bypasses RLS when `persistSession: false` and no user JWT is attached. This is the pattern 201 uses for the audit-drain cron.

**Warning signs:** Migration test fixture writes work. Production writes get "new row violates row-level security policy" errors.

### Pitfall 7: Batch replay double-spends a stale DLQ entry

**What goes wrong:** Admin clicks "Replay 10 selected", request lands, replay writes NEW delivery rows, admin doesn't see the batch complete, clicks Replay again. Now 10 duplicate replays are dispatched.

**Why it happens:** No idempotency on the batch replay endpoint.

**How to avoid:** Batch replay MUST use a server-generated `batch_id`; store `{batch_id, dlq_delivery_id, replayed_delivery_id}` rows; reject second calls with the same batch_id (or the same dlq_delivery_id within a 5-minute window). Vercel Queues `idempotencyKey` can enforce this at the queue layer too: `idempotencyKey: \`replay-\${dlq_delivery_id}-\${Math.floor(Date.now() / 300000)}\`` (5-min bucket).

**Warning signs:** Subscribers report receiving the same event twice within seconds; dashboard shows two `status=delivered` rows sharing a `replayed_from`.

## Code Examples

### Supabase subscriptions adapter (Wave 1)

```javascript
// lib/markos/webhooks/store-supabase.cjs (NEW Wave 1)
'use strict';

function createSupabaseSubscriptionsStore(client) {
  return {
    async insert(row) {
      const { data, error } = await client
        .from('markos_webhook_subscriptions')
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(`store-supabase.insert: ${error.message}`);
      return data;
    },
    async updateActive(tenant_id, id, active) {
      const { data, error } = await client
        .from('markos_webhook_subscriptions')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenant_id)  // CRITICAL — tenant scope first
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw new Error(`store-supabase.updateActive: ${error.message}`);
      return data || null;
    },
    async listByTenant(tenant_id) {
      const { data, error } = await client
        .from('markos_webhook_subscriptions')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('active', true);
      if (error) throw new Error(`store-supabase.listByTenant: ${error.message}`);
      return data || [];
    },
    async findById(tenant_id, id) {
      const { data, error } = await client
        .from('markos_webhook_subscriptions')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(`store-supabase.findById: ${error.message}`);
      return data || null;
    },
  };
}

function createSupabaseDeliveriesStore(client) {
  return {
    async insert(row) {
      const { data, error } = await client
        .from('markos_webhook_deliveries')
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(`store-supabase.deliveries.insert: ${error.message}`);
      return data;
    },
    async findById(id) {
      const { data, error } = await client
        .from('markos_webhook_deliveries')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(`store-supabase.deliveries.findById: ${error.message}`);
      return data || null;
    },
    async update(id, patch) {
      const { data, error } = await client
        .from('markos_webhook_deliveries')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw new Error(`store-supabase.deliveries.update: ${error.message}`);
      return data || null;
    },
    async listByTenant(tenant_id, { status, since, limit = 100 } = {}) {
      let q = client
        .from('markos_webhook_deliveries')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (status) q = q.eq('status', status);
      if (since) q = q.gte('created_at', since);
      const { data, error } = await q;
      if (error) throw new Error(`store-supabase.deliveries.listByTenant: ${error.message}`);
      return data || [];
    },
  };
}

module.exports = { createSupabaseSubscriptionsStore, createSupabaseDeliveriesStore };
```

### Migration 72 sketch

```sql
-- supabase/migrations/72_markos_webhook_dlq_and_rotation.sql

-- ============================================================================
-- Extend markos_webhook_subscriptions with rotation + rate-limit override
-- ============================================================================
alter table markos_webhook_subscriptions
  add column if not exists secret_v2 text null,         -- dual-sign during grace
  add column if not exists grace_started_at timestamptz null,
  add column if not exists grace_ends_at    timestamptz null,
  add column if not exists rotation_state   text null
    check (rotation_state is null or rotation_state in ('active', 'rolled_back')),
  add column if not exists rps_override     integer null;

comment on column markos_webhook_subscriptions.secret_v2 is 'New secret during 30-day grace window; null outside rotation';
comment on column markos_webhook_subscriptions.rps_override is 'Per-subscription RPS override; may only LOWER the plan-tier default (D-13)';

-- ============================================================================
-- Extend markos_webhook_deliveries with replay + DLQ audit columns
-- ============================================================================
alter table markos_webhook_deliveries
  add column if not exists replayed_from text null references markos_webhook_deliveries(id),
  add column if not exists dlq_reason    text null,
  add column if not exists final_attempt integer null,
  add column if not exists dlq_at        timestamptz null;

comment on column markos_webhook_deliveries.replayed_from is 'Original delivery_id this replay was derived from (D-06)';
comment on column markos_webhook_deliveries.dlq_at is 'Set when delivery transitions to status=failed (24-attempt exhaustion)';

create index if not exists idx_deliveries_dlq_retention
  on markos_webhook_deliveries(dlq_at)
  where status = 'failed';

-- ============================================================================
-- markos_webhook_secret_rotations — audit ledger of rotations
-- ============================================================================
create table if not exists markos_webhook_secret_rotations (
  id              text primary key,
  subscription_id text not null references markos_webhook_subscriptions(id) on delete cascade,
  tenant_id       text not null references markos_tenants(id) on delete cascade,
  initiated_by    text not null,           -- actor_id (tenant-admin user)
  initiated_at    timestamptz not null default now(),
  state           text not null
    check (state in ('active', 'rolled_back', 'finalized')),
  grace_ends_at   timestamptz not null,
  finalized_at    timestamptz null,
  rolled_back_at  timestamptz null
);

alter table markos_webhook_secret_rotations enable row level security;

create policy if not exists rotations_read_via_tenant on markos_webhook_secret_rotations
  as permissive for select
  using (
    exists (
      select 1 from markos_tenant_memberships
      where markos_tenant_memberships.tenant_id = markos_webhook_secret_rotations.tenant_id
      and markos_tenant_memberships.user_id = auth.jwt()->>'sub'
    )
  );

create index if not exists idx_rotations_active
  on markos_webhook_secret_rotations(tenant_id, state, grace_ends_at)
  where state = 'active';

-- ============================================================================
-- markos_webhook_fleet_metrics_hourly — optional rollup for dashboard hero
-- ============================================================================
-- Ship as a VIEW first (cheap); materialize later only if p95 > 150ms
create or replace view markos_webhook_fleet_metrics_v1 as
  select
    tenant_id,
    date_trunc('hour', created_at) as bucket,
    count(*)                       as total,
    count(*) filter (where status = 'delivered') as delivered,
    count(*) filter (where status = 'failed')    as failed,
    count(*) filter (where status = 'retrying')  as retrying,
    avg(
      extract(epoch from (updated_at - created_at)) * 1000
    ) filter (where status = 'delivered')         as avg_latency_ms
  from markos_webhook_deliveries
  where created_at > now() - interval '48 hours'
  group by tenant_id, bucket;

comment on view markos_webhook_fleet_metrics_v1 is 'S1 hero banner source: 24h deliveries / success % / avg latency. Recompute over last 48h window.';
```

**Rollback** (`supabase/migrations/rollback/72_markos_webhook_dlq_and_rotation.rollback.sql`):

```sql
drop view if exists markos_webhook_fleet_metrics_v1;
drop table if exists markos_webhook_secret_rotations;
drop index if exists idx_deliveries_dlq_retention;
alter table markos_webhook_deliveries
  drop column if exists dlq_at,
  drop column if exists final_attempt,
  drop column if exists dlq_reason,
  drop column if exists replayed_from;
alter table markos_webhook_subscriptions
  drop column if exists rps_override,
  drop column if exists rotation_state,
  drop column if exists grace_ends_at,
  drop column if exists grace_started_at,
  drop column if exists secret_v2;
```

### Rotation orchestrator (Wave 3)

```javascript
// lib/markos/webhooks/rotation.cjs (NEW Wave 3)
'use strict';
const { randomUUID, randomBytes } = require('node:crypto');
const GRACE_DAYS = 30;

async function startRotation(client, { tenant_id, subscription_id, actor_id }) {
  const sub = await client.from('markos_webhook_subscriptions')
    .select('*').eq('tenant_id', tenant_id).eq('id', subscription_id).maybeSingle();
  if (sub.error || !sub.data) throw new Error('subscription_not_found');
  if (sub.data.rotation_state === 'active') throw new Error('rotation_already_active');

  const newSecret = randomBytes(32).toString('hex');
  const graceEnd = new Date(Date.now() + GRACE_DAYS * 86400 * 1000).toISOString();
  const rotationId = `whrot_${randomUUID()}`;

  // Supabase does not have a proper transaction API in the JS client; use an RPC
  // that updates both rows atomically (rpc function appended to migration 72)
  const { data, error } = await client.rpc('start_webhook_rotation', {
    p_rotation_id: rotationId,
    p_subscription_id: subscription_id,
    p_tenant_id: tenant_id,
    p_new_secret: newSecret,
    p_grace_ends_at: graceEnd,
    p_actor_id: actor_id,
  });
  if (error) throw new Error(`rotation.startRotation: ${error.message}`);

  return { rotation_id: rotationId, grace_ends_at: graceEnd };
}

async function rollbackRotation(client, { tenant_id, subscription_id, actor_id }) {
  // Rollback is valid only during grace — RPC enforces `grace_ends_at > now()`
  const { data, error } = await client.rpc('rollback_webhook_rotation', {
    p_subscription_id: subscription_id,
    p_tenant_id: tenant_id,
    p_actor_id: actor_id,
  });
  if (error) throw new Error(`rotation.rollbackRotation: ${error.message}`);
  return data;
}

async function finalizeExpiredRotations(client, now = new Date().toISOString()) {
  // Cron-triggered daily — discards old secret, sets secret_v2 → secret
  const { data, error } = await client.rpc('finalize_expired_webhook_rotations', { p_now: now });
  if (error) throw new Error(`rotation.finalizeExpiredRotations: ${error.message}`);
  return data || [];
}

async function listActiveRotations(client, tenant_id) {
  const { data, error } = await client
    .from('markos_webhook_secret_rotations')
    .select('id, subscription_id, grace_ends_at, initiated_at')
    .eq('tenant_id', tenant_id)
    .eq('state', 'active');
  if (error) throw new Error(`rotation.listActive: ${error.message}`);
  return data || [];
}

module.exports = { startRotation, rollbackRotation, finalizeExpiredRotations, listActiveRotations, GRACE_DAYS };
```

The three RPCs (`start_webhook_rotation`, `rollback_webhook_rotation`, `finalize_expired_webhook_rotations`) are appended to migration 72. They wrap the multi-row update in `BEGIN/COMMIT` + audit-emit via `append_markos_audit_row` (same pattern 201 uses). Planner MUST spec the RPC bodies; they are the atomicity boundary.

## State of the Art

| Old Approach (200-03) | Current Approach (203 target) | Impact |
|-----------------------|-------------------------------|--------|
| In-memory Map store | Supabase (durable) + Vercel Queues (push) | Survives instance turnover; GA-ready |
| In-memory `createInMemoryQueue().drain()` poll | `@vercel/queue` push-mode consumer + retry callback | Managed durability + at-least-once; visibility timeouts |
| Single HMAC header `X-Markos-Signature` | Dual header `X-Markos-Signature-V1` + `X-Markos-Signature-V2` during grace | Zero-downtime secret rotation; Stripe-compatible |
| No rate-limit per-sub | `@upstash/ratelimit` sliding-window per sub + plan-tier cap | Plan-tier monetization hook; prevents rogue-endpoint DDoS of MarkOS |
| No circuit breaker | Upstash Redis sliding-window breaker (20-sample, 50% threshold) | Saves subscriber burn + compute dollars on failing endpoints |
| `assertValidUrl` regex-only | DNS-resolve SSRF guard + HTTPS-only enforcement | OWASP-compliant; blocks cloud IMDS access |
| No DLQ surface | Supabase `status='failed'` rows with 7-day TTL + dashboard replay | Human-in-loop recovery per SOC 2 expectations |
| Ad-hoc logging | D-30 `emitLogLine` + Sentry `captureToolError` (domain: 'webhook') | QA-09 observability compliance; correlation via `req_id` |

**Deprecated / outdated:**
- None specific to webhook primitives — HMAC-SHA256 + timestamp-bind is still the industry-standard shape (Stripe, GitHub, Shopify all use it). Ed25519 signed webhooks exist but are not widespread enough to demand.

## Contract Plan (F-contracts to add/extend)

| F-NN | Status | Shape |
|------|--------|-------|
| F-72 webhook-subscription-v1 | **EXTEND** | Add `rps_override`, `rotation_state`, `grace_ends_at` to subscription schema; document `secret` field is now lifecycle-aware |
| F-73 webhook-delivery-v1 | **EXTEND** | Add `replayed_from`, `dlq_at`, `final_attempt` to delivery schema; document outbound `x-markos-replayed-from` + `x-markos-attempt` headers; document dual-sig `X-Markos-Signature-V1` + `X-Markos-Signature-V2` |
| F-96 webhook-dashboard-v1 | **NEW** | `/api/tenant/webhooks/fleet-metrics` (GET), `/api/tenant/webhooks/subscriptions` (GET), `/api/tenant/webhooks/subscriptions/{id}/update` (POST), `/api/tenant/webhooks/subscriptions/{id}/delete` (POST) |
| F-97 webhook-rotation-v1 | **NEW** | `/api/tenant/webhooks/subscriptions/{id}/rotate` (POST), `/rotate/rollback` (POST), `/api/tenant/webhooks/rotations/active` (GET) |
| F-98 webhook-dlq-v1 | **NEW** | `/api/tenant/webhooks/subscriptions/{id}/deliveries/{delivery_id}/replay` (POST single), `/subscriptions/{id}/dlq/replay` (POST batch) |
| F-99 webhook-status-v1 | **NEW** | `/api/public/webhooks/status` (GET, no auth, 60s cache) |
| F-100 webhook-breaker-v1 | **NEW** | Per-sub breaker state descriptor (read-only via F-96 sub detail; F-100 describes the envelope and state transitions) |

All F-NN YAML files land in `contracts/`; `scripts/openapi/build-openapi.cjs` globs and merges. No edits to `openapi.json` by hand.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Plan-tier defaults (Free 10rps / Team 60rps / Enterprise 300rps) align with `markos_orgs.plan_tier` values | §Rate-Limit (D-13 restated) | Low — D-13 explicitly sets these numbers; user-locked. If the actual plan_tier enum differs (e.g., `pro` instead of `team`), name the variable `PLAN_TIER_RPS_MAP` and wire via the same lookup pattern as 202-09 `usage.js`. |
| A2 | Vercel Queues `queue/v2beta` trigger type will remain stable through 203 development window | §Pattern 2 + Pitfall 5 | Medium — beta API. Mitigation: include a smoke test in phase verifier that end-to-end publishes + consumes; alert on regression. |
| A3 | Upstash Redis sliding-window LPUSH/LTRIM race is acceptable for 20-sample, 50%-threshold breaker | §Pattern 4 | Low — the race window is tiny; noise floor is a handful of false-positive trips per thousand invocations. If pentest or SRE review flags it, upgrade to Redis ZSETs with timestamp scores (small refactor). |
| A4 | DNS-rebinding mid-flight (between validate-at-subscribe and fetch-at-dispatch) is an `accept` disposition for 203 Wave 1 | §Pitfall 4 | Medium — it's a real attack class. Mitigation: Phase 203.1 follow-up or fold into Phase 206 SOC 2 Type II remediation list. Document explicitly in DISCUSS.md threat-model. |
| A5 | `@vercel/edge-config` not needed for plan-tier lookup hot path | §Supporting Stack | Low — 202-09 uses direct Supabase lookup with acceptable p95; webhook path has no stricter SLA than MCP. |

**All other claims in this research are `[VERIFIED]` (via Read of existing source or npm view) or `[CITED]` (with specific URL to official docs).**

## Open Questions (RESOLVED)

1. **Rotation notification channel**
   - What we know: D-11 locks email + dashboard banner (S4); Resend is the in-tree email sender (202-10 precedent).
   - What's unclear: Which admin role(s) receive the email? Any admin in the tenant, or only specific sub-owner? Need tenant-membership filter.
   - RESOLVED: Recommendation: Send to all users with `role IN ('owner', 'admin')` in the tenant's `markos_tenant_memberships` table. Planner: confirm with user on plan kick-off.

2. **DLQ retention purge source of truth**
   - What we know: D-08 locks 7-day TTL; `api/cron/webhooks-dlq-purge.js` runs daily.
   - What's unclear: Does purge HARD DELETE or move to a cold-storage table? SOC 2 evidence pipeline (Phase 206) may need rows retained longer than 7 days for audit.
   - RESOLVED: Recommendation: HARD DELETE the `markos_webhook_deliveries` row but keep the `markos_audit_log` trail (`source_domain='webhooks' action='webhook_delivery.failed'`) — audit is forever. Dashboard only reads deliveries table so UX matches D-08; SOC 2 reads audit.

3. **Fleet-metrics cache policy**
   - What we know: UI auto-refreshes every 30s; S3 public page caches 60s.
   - What's unclear: Is the Supabase view fast enough under load (Phase 206 SOC 2 may add 10× ingest)? Or do we need to introduce a lightweight rollup table right now?
   - RESOLVED: Recommendation: Ship as a view in Wave 5. Load test (QA-07) validates p95 at realistic volume. If it fails, upgrade to `markos_webhook_fleet_metrics_hourly` table populated by a 5-minute cron + Supabase `pg_cron` extension (already available). Document the upgrade path in `deferred-items.md`.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js `node --test` (built-in) with `--experimental-test-coverage` |
| Config file | none — test discovery via glob `test/**/*.test.js` |
| Quick run command | `node --test test/webhooks/**/*.test.js` |
| Full suite command | `npm test` (runs `node --test test/**/*.test.js`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WHK-01 Wave 1 adapter swap | Supabase subscriptions/deliveries adapter matches in-memory contract | unit + integration | `node --test test/webhooks/store-supabase.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 1 queue | Vercel Queues send/consume round-trip | integration | `node --test test/webhooks/vercel-queue.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 1 SSRF | `assertUrlIsPublic` blocks private IPs + localhost + link-local | unit | `node --test test/webhooks/ssrf-guard.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 2 DLQ | DLQ list/replay single/replay batch/delete + idempotency on batch replay | unit + integration | `node --test test/webhooks/dlq.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 2 DLQ-cron | `webhooks-dlq-purge` cron hard-deletes entries >7d, preserves audit | unit | `node --test test/webhooks/dlq-purge-cron.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 3 rotation | startRotation / rollback / finalize + dual-sign at dispatch | unit + integration | `node --test test/webhooks/rotation.test.js test/webhooks/signing.test.js -x` | signing.test.js exists (extend); rotation.test.js ❌ Wave 0 |
| WHK-01 Wave 3 notify | T-7 / T-1 / T-0 email cron + dashboard banner visibility | unit | `node --test test/webhooks/rotation-notify.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 4 rate-limit | Per-sub RPS cap enforcement + plan-tier ceiling + override-lower-only | unit + integration | `node --test test/webhooks/rate-limit.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 4 breaker | 50% threshold trip + half-open exponential backoff + Redis state persistence | unit + integration | `node --test test/webhooks/breaker.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 5 dashboard APIs | 5 `/api/tenant/webhooks/*` handlers + cross-tenant guard | unit | `node --test test/webhooks/api-tenant.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 5 S1 a11y | Surface 1 grep-shape copy + token + aria | unit | `node --test test/webhooks/ui-s1-a11y.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 5 S2 a11y | Surface 2 tabs + inline expand + DLQ checkboxes | unit | `node --test test/webhooks/ui-s2-a11y.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 5 S3 a11y | Surface 3 public status standalone | unit | `node --test test/webhooks/ui-s3-a11y.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 5 S4 a11y | Rotation banner data-stage variants + role="status" | unit | `node --test test/webhooks/ui-s4-a11y.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 5 status page | `/api/public/webhooks/status` returns cached fleet aggregates | unit | `node --test test/webhooks/public-status.test.js -x` | ❌ Wave 0 |
| WHK-01 Wave 5 observability | emitLogLine webhook shape + Sentry captureToolError | unit | `node --test test/webhooks/observability.test.js -x` | ❌ Wave 0 |
| QA-01 Contracts | F-72/F-73 extend + F-96..F-100 YAML lint + openapi.json regen coverage | unit | `node --test test/openapi/openapi-build.test.js` | exists (extend with 203 F-NNs) |
| QA-13 Migration rollback | Migration 72 + rollback both apply cleanly | integration | `node --test test/webhooks/migration-idempotency.test.js` | ❌ Wave 0 |
| QA-07 Load tests | 60-concurrent webhook test-fire × 60s gates p95 ≤ 500ms + err_rate ≤ 1% | load | `node scripts/load/webhooks-smoke.mjs` | ❌ Wave 0 (reuse 202-10 shape) |

### Sampling Rate
- **Per task commit:** `node --test test/webhooks/*.test.js` (runs all Wave-N tests fast)
- **Per wave merge:** `node --test test/webhooks/**/*.test.js test/openapi/openapi-build.test.js` (webhooks + openapi regression)
- **Phase gate:** Full suite green before `/gsd-verify-work 203`; load smoke green in CI at phase close.

### Wave 0 Gaps

All files need creation. Planner: include a Wave 0 task list per wave. The gaps are:

- [ ] `test/webhooks/store-supabase.test.js` — covers WHK-01 Wave 1 adapter
- [ ] `test/webhooks/vercel-queue.test.js` — covers WHK-01 Wave 1 queue
- [ ] `test/webhooks/ssrf-guard.test.js` — covers WHK-01 Wave 1 security
- [ ] `test/webhooks/dlq.test.js` — covers WHK-01 Wave 2
- [ ] `test/webhooks/dlq-purge-cron.test.js` — covers WHK-01 Wave 2 cron
- [ ] `test/webhooks/rotation.test.js` — covers WHK-01 Wave 3
- [ ] `test/webhooks/rotation-notify.test.js` — covers WHK-01 Wave 3 cron
- [ ] `test/webhooks/rate-limit.test.js` — covers WHK-01 Wave 4
- [ ] `test/webhooks/breaker.test.js` — covers WHK-01 Wave 4
- [ ] `test/webhooks/api-tenant.test.js` — covers WHK-01 Wave 5 dashboard APIs
- [ ] `test/webhooks/ui-s1-a11y.test.js` — covers S1 UI contract
- [ ] `test/webhooks/ui-s2-a11y.test.js` — covers S2 UI contract
- [ ] `test/webhooks/ui-s3-a11y.test.js` — covers S3 UI contract
- [ ] `test/webhooks/ui-s4-a11y.test.js` — covers S4 UI contract
- [ ] `test/webhooks/public-status.test.js` — covers status page handler
- [ ] `test/webhooks/observability.test.js` — covers Sentry + log-drain webhook variant
- [ ] `test/webhooks/migration-idempotency.test.js` — covers migration 72 idempotency + rollback
- [ ] `scripts/load/webhooks-smoke.mjs` — copy + rename `scripts/load/mcp-smoke.mjs` from 202-10; re-target test-fire endpoint

**Extend** (do not create):
- `test/webhooks/signing.test.js` — add dual-sign test cases (currently 8 tests).
- `test/webhooks/engine.test.js` — add SSRF guard call + rps_override validation (currently 10 tests).
- `test/webhooks/delivery.test.js` — add breaker check + dual-sign dispatch path (currently 9 tests).
- `test/webhooks/api-endpoints.test.js` — add SSRF rejection on subscribe + rps_override param (currently 8 tests).
- `test/openapi/openapi-build.test.js` — add F-96..F-100 path-count assertions (currently 13 tests).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Bearer-auth on `/api/tenant/webhooks/*` (inherited from 201 middleware); tenant-admin role check |
| V3 Session Management | yes | Reuse 201 rolling session cookie; no per-endpoint sessions. MCP session model does NOT apply to webhooks. |
| V4 Access Control | yes | Every handler SELECTs + asserts `subscription.tenant_id === header tenant_id` before any write (cross-tenant guard) — mirrors 202-09 `sessions/revoke.js` pattern; T-203-XX-01 mitigation |
| V5 Input Validation | yes | AJV strict on every `/api/tenant/webhooks/*` body; `assertUrlIsPublic` on subscribe; AJV deny-list unnecessary here (no LLM args) |
| V6 Cryptography | yes | `node:crypto` HMAC-SHA256 (existing `signPayload`) + `randomBytes(32)` for secrets + `timingSafeEqual` for verify (existing `verifySignature`); **never hand-roll HMAC** |
| V8 Data Protection | yes | Secrets stored plain in migration 70 column but marked "hashed in production" (existing comment). 203 does NOT change this; future phase 206 SOC 2 may require `pgcrypto`-based encryption-at-rest. |
| V10 Malicious Code | partial | SSRF guard blocks private-IP + localhost; does not block DNS-rebinding mid-flight (A4 accept disposition) |
| V13 API | yes | All new endpoints contract-first; rate-limit enforced (D-13); 402 envelope for over-cap |

### Known Threat Patterns for Webhook Subsystems

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Replay attack via old signature | Tampering | Timestamp-binding in HMAC input + 300s skew window (existing in `verifySignature`); replay-from-DLQ uses fresh ts (D-06) |
| SSRF via subscriber URL | Info Disclosure | `assertUrlIsPublic` at subscribe + at dispatch-time re-resolve (Pitfall 4) |
| Signing-secret leak via dashboard | Info Disclosure | UI masks all but last 8 chars (UI-SPEC `.secretHeader`); `/api/tenant/webhooks/subscriptions/*` SELECT never echoes `secret` column in plain form |
| Cross-tenant subscription hijack | Elevation of Privilege | RLS policy + handler-level `eq('tenant_id', tenant_id)` filter (202-09 pattern) |
| Batch replay double-dispatch | Tampering + DoS | Server-generated `batch_id` + Vercel Queues `idempotencyKey` (Pitfall 7) |
| Subscriber endpoint DoS (rogue webhook → us) | Denial of Service | Circuit breaker (D-14) sheds bad endpoints; RPS cap (D-13) prevents runaway dispatch |
| Signature-verification-bypass via case flip or encoding trick | Tampering | `timingSafeEqual` on hex-decoded buffers (existing); HTTPS-only at subscribe; no plaintext transport allowed |
| Over-permissive CORS on `/api/public/webhooks/status` | Info Disclosure | S3 is GET-only, no sensitive data (aggregate numbers); CORS can be `*` safely |
| Rotation rollback abuse (admin repeatedly rotates + rolls back to discover timing) | Tampering | Rate-limit rotate endpoint at per-tenant 1 call per 5 minutes (Upstash); audit every `rotation.started` + `rotation.rolled_back` event (`source_domain='webhooks'`) |

Each threat is enumerated in DISCUSS.md (existing §Threat model focus line). Planner: expand to full STRIDE table in PLAN `<threat_model>` blocks per wave.

## Documentation Plan

| Doc | Purpose | Notes |
|-----|---------|-------|
| `docs/webhooks.md` | Subscriber integration guide — verify HMAC, handle replay headers, respond 2xx | Copy-paste Node.js + Python + Go verify snippets |
| `docs/webhooks/rotation.md` | Rotation lifecycle — detecting v1/v2, grace window, what to do at T-7/T-1/T-0 | Reference to Stripe pattern for credibility |
| `docs/webhooks/dlq.md` | DLQ semantics for subscribers — what triggers DLQ, how to read replay headers, 7-day window | Ties to D-06 / D-08 |
| `docs/webhooks/status.md` | Public status page intro — how `/status/webhooks` numbers are computed | Short; mirrors Stripe/Vercel status page tone |
| `docs/llms/phase-203-webhooks.md` | LLM-friendly overview | Added to `public/llms.txt` (QA-15) |

## Sources

### Primary (HIGH confidence)
- `C:\...\MarkOS\lib\markos\webhooks\*` + `api\webhooks\*` + `supabase\migrations\70_markos_webhook_subscriptions.sql` — existing 200-03 code read in full
- `C:\...\MarkOS\lib\markos\mcp\rate-limit.cjs` — 202-04 rate-limit reference pattern
- `C:\...\MarkOS\lib\markos\mcp\cost-meter.cjs` — atomic-RPC pattern for per-tenant caps
- `C:\...\MarkOS\lib\markos\mcp\sentry.cjs` + `lib\markos\mcp\log-drain.cjs` — 202-05 observability primitives
- `C:\...\MarkOS\lib\markos\audit\writer.cjs` — `webhooks` already in `AUDIT_SOURCE_DOMAINS`
- `C:\...\MarkOS\.planning\phases\202-mcp-server-ga-claude-marketplace\202-{04,05,09}-SUMMARY.md` — implementation patterns to mirror
- `C:\...\MarkOS\package.json` — verified deps + versions in tree
- [Vercel Queues concepts](https://vercel.com/docs/queues/concepts) — explicit "no native DLQ", 3-AZ durability, at-least-once, `retry` callback semantics
- [Vercel Queues SDK reference](https://vercel.com/docs/queues/sdk) — `@vercel/queue` `send`/`handleCallback` API
- [Stripe webhook signature rotation docs](https://docs.stripe.com/webhooks/signature) — dual-sig precedent (single-header multi-value shape); MarkOS diverges to two-header shape per D-10

### Secondary (MEDIUM confidence)
- [OWASP SSRF Prevention in Node.js](https://owasp.org/www-community/pages/controls/SSRF_Prevention_in_Nodejs) — standard private-IP block list
- [nodejs/undici issue #2019 — SSRF protection in native-node-fetch](https://github.com/nodejs/undici/issues/2019) — documents that `request-filtering-agent` does NOT work with native fetch
- [opossum circuit breaker docs](https://github.com/nodeshift/opossum) — reference for half-open + rolling window semantics (not adopted; in-process state incompatible with Fluid Compute)
- [Convoy "Generating Stripe-like Webhook Signatures"](https://www.getconvoy.io/blog/generating-stripe-like-webhook-signatures) — cross-reference on dual-sig header schemes

### Tertiary (LOW confidence — flagged for validation at plan time)
- Industry convention that 20-sample error-rate breakers are acceptable at low-QPS endpoints — broadly believed, not vendor-cited. Planner: if breaker surfaces false-positive trips in load test, raise sample to 50.
- Upstash `LPUSH/LTRIM` race acceptability at 20-sample window — qualitative engineering judgement (noted as A3 in Assumptions Log).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every library version verified via `npm view` or direct `package.json` read
- Architecture: HIGH — patterns are direct reuse of 202-04 / 202-05 / 202-09 shapes proven across 10 plans
- Pitfalls: HIGH — Pitfalls 1, 2, 6 come from direct code reads of existing store/delivery/RLS behavior; Pitfall 4 is OWASP; Pitfall 5 is Vercel's own docs declaring `v2beta`
- Circuit-breaker state choice: MEDIUM — Redis LPUSH/LTRIM race is a real but bounded concern (A3)
- DNS-rebinding disposition: MEDIUM — `accept` is pragmatic but must be explicit in threat model (A4)
- Contract extensions: HIGH — F-72/F-73 shapes inspected directly; F-96..F-100 patterned off F-95

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (30 days — stable ecosystem, no known breaking upstream changes imminent. Re-verify `@vercel/queue` beta status at plan kickoff if ≥14 days elapsed.)

---

*Phase: 203-webhook-subscription-engine-ga*
*Researched: 2026-04-17 by gsd-researcher*
*Downstream: gsd-planner → gsd-ui-checker → gsd-executor waves 1..5*
