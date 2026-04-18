'use strict';

// Phase 203 Plan 08 Task 2 — Circuit-breaker integration suite (behaviors 2a-2i).
// Verifies the breaker gate is the FIRST gate inside runDispatchGates (before rate-limit),
// short-circuits dispatch when open, allows probe when half-open, and that the state
// machine transitions correctly when driven through recordOutcome.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  runDispatchGates,
  handleGateBlock,
} = require('../../lib/markos/webhooks/dispatch-gates.cjs');
const {
  recordOutcome,
  classifyOutcome,
  WINDOW_SIZE,
  HALF_OPEN_BACKOFF_SEC,
} = require('../../lib/markos/webhooks/breaker.cjs');

// In-memory Redis mock (same surface as breaker.test.js). Also implements `.limit` for the
// rate-limit gate (pre-built limiter dep-injection path in rate-limit.cjs getLimiter()).
function createMockRedis({ limitResults = [{ success: true, remaining: 1000, reset: Date.now() + 1000 }] } = {}) {
  const store = new Map();
  const ops = [];
  let limitIdx = 0;

  function currentTime() {
    return Date.now();
  }

  function getEntry(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt <= currentTime()) {
      store.delete(key);
      return null;
    }
    return entry;
  }

  return {
    _store: store,
    _ops: ops,
    _limitCalls: 0,
    async lpush(key, ...values) {
      ops.push({ op: 'lpush', key, values });
      let entry = getEntry(key);
      if (!entry) {
        entry = { value: [] };
        store.set(key, entry);
      }
      for (const v of values) entry.value.unshift(v);
      return entry.value.length;
    },
    async ltrim(key, start, stop) {
      ops.push({ op: 'ltrim', key, start, stop });
      const entry = getEntry(key);
      if (!entry || !Array.isArray(entry.value)) return 'OK';
      const len = entry.value.length;
      const s = start < 0 ? Math.max(0, len + start) : start;
      const e = stop < 0 ? len + stop : Math.min(stop, len - 1);
      entry.value = entry.value.slice(s, e + 1);
      return 'OK';
    },
    async lrange(key, start, stop) {
      ops.push({ op: 'lrange', key, start, stop });
      const entry = getEntry(key);
      if (!entry || !Array.isArray(entry.value)) return [];
      const len = entry.value.length;
      const s = start < 0 ? Math.max(0, len + start) : start;
      const e = stop < 0 ? len + stop : Math.min(stop, len - 1);
      return entry.value.slice(s, e + 1);
    },
    async expire(key, seconds) {
      ops.push({ op: 'expire', key, seconds });
      const entry = getEntry(key);
      if (!entry) return 0;
      entry.expiresAt = currentTime() + seconds * 1000;
      return 1;
    },
    async get(key) {
      ops.push({ op: 'get', key });
      const entry = getEntry(key);
      if (!entry) return null;
      return entry.value;
    },
    async set(key, value, options) {
      ops.push({ op: 'set', key, value, options });
      const entry = { value };
      if (options && typeof options.ex === 'number') {
        entry.expiresAt = currentTime() + options.ex * 1000;
      }
      store.set(key, entry);
      return 'OK';
    },
    async del(key) {
      ops.push({ op: 'del', key });
      return store.delete(key) ? 1 : 0;
    },
    // Pre-built rate-limiter path: rate-limit.cjs getLimiter() sees .limit() as a function
    // and returns this object as-is (bypasses Upstash SDK construction).
    async limit() {
      this._limitCalls += 1;
      const r = limitResults[Math.min(limitIdx, limitResults.length - 1)];
      limitIdx += 1;
      return r;
    },
  };
}

// 2a — breaker closed + rate-limit ok → allowed
test('Plan 203-08 2a: breaker closed + rate-limit ok → { status: "allowed" }', async () => {
  const redis = createMockRedis();
  const out = await runDispatchGates({
    subId: 'whsub_1',
    tenantId: 't-1',
    eventId: 'evt_1',
    planTier: 'team',
    subscription: { id: 'whsub_1', rps_override: null },
    redis,
  });
  assert.equal(out.status, 'allowed');
});

// 2b — breaker open + probe_at future → breaker_open envelope, rate-limit NOT called
test('Plan 203-08 2b: breaker open (probe_at future) → breaker_open envelope + rate-limit NOT called', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    const probeAt = fixedNow + 60_000;
    await redis.set(
      'cb:webhook:state:whsub_1',
      JSON.stringify({ state: 'open', trips: 2, probe_at: probeAt }),
      { ex: 600 },
    );
    const out = await runDispatchGates({
      subId: 'whsub_1',
      tenantId: 't-1',
      eventId: 'evt_1',
      planTier: 'team',
      subscription: { id: 'whsub_1', rps_override: null },
      redis,
    });
    assert.equal(out.status, 'breaker_open');
    assert.equal(out.reason, 'breaker_open');
    assert.ok(out.retryAfterSec >= 1);
    assert.equal(out.retryAfterSec, Math.ceil((probeAt - fixedNow) / 1000));
    assert.equal(out.breaker.state, 'open');
    assert.equal(out.breaker.trips, 2);
    assert.equal(out.breaker.probe_at, probeAt);
    // Rate-limit gate must NOT be called when breaker short-circuits.
    assert.equal(redis._limitCalls, 0);
  } finally {
    Date.now = originalNow;
  }
});

// 2c — breaker half-open + probe_at elapsed → rate-limit IS called; if rate-limit ok → allowed
test('Plan 203-08 2c: breaker half-open (probe_at elapsed) → rate-limit IS called, probe allowed', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    await redis.set(
      'cb:webhook:state:whsub_1',
      JSON.stringify({ state: 'open', trips: 1, probe_at: fixedNow - 1 }),
      { ex: 600 },
    );
    const out = await runDispatchGates({
      subId: 'whsub_1',
      tenantId: 't-1',
      eventId: 'evt_1',
      planTier: 'team',
      subscription: { id: 'whsub_1', rps_override: null },
      redis,
    });
    assert.equal(out.status, 'allowed');
    assert.equal(redis._limitCalls, 1);
  } finally {
    Date.now = originalNow;
  }
});

// 2d — breaker closed + rate-limit breach → rate_limited envelope (second gate still fires)
test('Plan 203-08 2d: breaker closed + rate-limit breach → rate_limited envelope', async () => {
  const redis = createMockRedis({ limitResults: [{ success: false, reset: Date.now() + 5_000, remaining: 0 }] });
  const out = await runDispatchGates({
    subId: 'whsub_1',
    tenantId: 't-1',
    eventId: 'evt_1',
    planTier: 'team',
    subscription: { id: 'whsub_1', rps_override: null },
    redis,
  });
  assert.equal(out.status, 'rate_limited');
  assert.equal(out.limit, 60);
  assert.equal(out.reason, 'sub_rps');
  assert.ok(out.retryAfterSec >= 1);
});

// 2e — handleGateBlock transitions delivery to retrying with next_attempt_at; attempt NOT incremented
test('Plan 203-08 2e: handleGateBlock on breaker_open transitions delivery to retrying (attempt NOT incremented)', async () => {
  const calls = [];
  const deliveries = {
    async update(id, patch) {
      calls.push({ id, patch });
      return { id, ...patch };
    },
  };
  const gate = {
    status: 'breaker_open',
    retryAfterSec: 60,
    reason: 'breaker_open',
    breaker: { state: 'open', trips: 2, probe_at: 1_700_000_060_000 },
  };
  const result = await handleGateBlock({
    gate,
    deliveryId: 'whdel_abc',
    deliveries,
    now: 1_700_000_000_000,
  });
  assert.equal(result.delivered, false);
  assert.equal(result.status, 'breaker_open');
  assert.equal(result.retry_after, 60);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].patch.status, 'retrying');
  assert.equal(calls[0].patch.next_attempt_at, new Date(1_700_000_000_000 + 60_000).toISOString());
  // CRITICAL: attempt counter must NOT be in the patch — gate blocks are transient.
  assert.equal(calls[0].patch.attempt, undefined);
});

// 2f — state-machine integration: 20 failures → open → next runDispatchGates returns breaker_open
test('Plan 203-08 2f: 20 failures → recordOutcome trips → runDispatchGates returns breaker_open', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    // Seed outcomes list directly with 19 failures, then record 20th via recordOutcome to trigger the trip path.
    for (let i = 0; i < 19; i += 1) {
      await redis.lpush('cb:webhook:outcomes:whsub_1', 'failure');
    }
    await redis.expire('cb:webhook:outcomes:whsub_1', 3600);
    const tripResult = await recordOutcome(redis, 'whsub_1', 'failure');
    assert.equal(tripResult.state, 'open');
    assert.equal(tripResult.trips, 1);
    assert.equal(tripResult.probe_at, fixedNow + HALF_OPEN_BACKOFF_SEC[0] * 1000);

    const out = await runDispatchGates({
      subId: 'whsub_1',
      tenantId: 't-1',
      eventId: 'evt_1',
      planTier: 'team',
      subscription: { id: 'whsub_1', rps_override: null },
      redis,
    });
    assert.equal(out.status, 'breaker_open');
    assert.equal(out.breaker.state, 'open');
    assert.equal(out.breaker.trips, 1);
    // Rate-limit gate must NOT have fired.
    assert.equal(redis._limitCalls, 0);
  } finally {
    Date.now = originalNow;
  }
});

// 2g — recovery: half-open probe success → state key deleted → next runDispatchGates returns allowed
test('Plan 203-08 2g: half-open probe success resets state → runDispatchGates returns allowed (state=closed)', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    // Seed state=half-open with probe_at in the past.
    await redis.set(
      'cb:webhook:state:whsub_1',
      JSON.stringify({ state: 'half-open', trips: 2, probe_at: fixedNow - 1 }),
      { ex: 600 },
    );
    // canDispatch reports half-open — dispatch proceeds.
    const firstGate = await runDispatchGates({
      subId: 'whsub_1',
      tenantId: 't-1',
      eventId: 'evt_1',
      planTier: 'team',
      subscription: { id: 'whsub_1', rps_override: null },
      redis,
    });
    assert.equal(firstGate.status, 'allowed');

    // Simulate Plan 203-10's observability wrapper calling recordOutcome + classifyOutcome after the fetch.
    const outcome = classifyOutcome({ http: 200 });
    assert.equal(outcome, 'success');
    await recordOutcome(redis, 'whsub_1', outcome);

    // State key must be gone; next gate call reports closed + allowed.
    assert.equal(await redis.get('cb:webhook:state:whsub_1'), null);
    const secondGate = await runDispatchGates({
      subId: 'whsub_1',
      tenantId: 't-1',
      eventId: 'evt_1',
      planTier: 'team',
      subscription: { id: 'whsub_1', rps_override: null },
      redis,
    });
    assert.equal(secondGate.status, 'allowed');
  } finally {
    Date.now = originalNow;
  }
});

// 2h — 4xx NOT counted as failure (D-14 fidelity)
test('Plan 203-08 2h: classifyOutcome({ http: 429 }) = success → recordOutcome does NOT trip', async () => {
  const redis = createMockRedis();
  const outcome = classifyOutcome({ http: 429 });
  assert.equal(outcome, 'success');
  // Feed 20 x 429 — should NOT trip (all classified as success).
  for (let i = 0; i < WINDOW_SIZE; i += 1) {
    await recordOutcome(redis, 'sub-4xx', outcome);
  }
  const gate = await runDispatchGates({
    subId: 'sub-4xx',
    tenantId: 't-1',
    eventId: 'evt_1',
    planTier: 'team',
    subscription: { id: 'sub-4xx', rps_override: null },
    redis,
  });
  assert.equal(gate.status, 'allowed');
});

// 2i — timeout classified as failure
test('Plan 203-08 2i: classifyOutcome({ timeout: true }) = failure (counts toward threshold)', () => {
  assert.equal(classifyOutcome({ timeout: true }), 'failure');
  assert.equal(classifyOutcome({ network_error: true }), 'failure');
});

// Invariant: dispatch-gates orders breaker BEFORE rate-limit; marker/import proof.
test('Plan 203-08 invariant: dispatch-gates.cjs imports canDispatch and orders breaker before rate-limit', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'lib', 'markos', 'webhooks', 'dispatch-gates.cjs'),
    'utf8',
  );
  assert.match(src, /require\(['"]\.\/breaker\.cjs['"]\)/);
  assert.match(src, /canDispatch/);
  assert.match(src, /status: 'breaker_open'/);
  const canDispatchIdx = src.indexOf('canDispatch(');
  const rateLimitIdx = src.indexOf('checkWebhookRateLimit(');
  assert.ok(canDispatchIdx > -1, 'expected canDispatch( call site in dispatch-gates.cjs');
  assert.ok(rateLimitIdx > -1, 'expected checkWebhookRateLimit( call site in dispatch-gates.cjs');
  assert.ok(canDispatchIdx < rateLimitIdx, 'canDispatch must appear BEFORE checkWebhookRateLimit (breaker is FIRST gate)');
});
