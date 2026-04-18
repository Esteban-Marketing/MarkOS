'use strict';

// Phase 203 Plan 08 Task 1 — Circuit-breaker state machine (behaviors 1a..1v).
// D-14: WINDOW_SIZE=20, TRIP_THRESHOLD=0.5 (>50% failures of last 20 trips).
// D-15: HALF_OPEN_BACKOFF_SEC=[30, 60, 120, 300, 600] (exponential; capped at 10min).
// 4xx is NOT a failure (explicit D-14 reading: "5xx or timeout"); 2xx/3xx/4xx = success.

const test = require('node:test');
const assert = require('node:assert/strict');

const breaker = require('../../lib/markos/webhooks/breaker.cjs');
const {
  recordOutcome,
  canDispatch,
  classifyOutcome,
  getBreakerState,
  WINDOW_SIZE,
  TRIP_THRESHOLD,
  HALF_OPEN_BACKOFF_SEC,
} = breaker;

// In-memory Redis mock mirroring Upstash command surface we need:
// lpush / ltrim / lrange / expire / get / set (with { ex }) / del.
function createMockRedis() {
  const store = new Map(); // key -> { value, expiresAt? }  // value may be string or array
  const ops = []; // recorded operations for assertions

  function now() {
    return Date.now();
  }

  function getEntry(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt <= now()) {
      store.delete(key);
      return null;
    }
    return entry;
  }

  return {
    _store: store,
    _ops: ops,
    async lpush(key, ...values) {
      ops.push({ op: 'lpush', key, values });
      let entry = getEntry(key);
      if (!entry) {
        entry = { value: [] };
        store.set(key, entry);
      }
      // LPUSH pushes one-by-one to head: `lpush k a b c` yields list [c, b, a]
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
      entry.expiresAt = now() + seconds * 1000;
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
        entry.expiresAt = now() + options.ex * 1000;
      }
      store.set(key, entry);
      return 'OK';
    },
    async del(key) {
      ops.push({ op: 'del', key });
      return store.delete(key) ? 1 : 0;
    },
  };
}

// ---- 1a..1h classifyOutcome ----

test('Plan 203-08 1a: classifyOutcome({ http: 200 }) → success', () => {
  assert.equal(classifyOutcome({ http: 200 }), 'success');
});

test('Plan 203-08 1b: classifyOutcome({ http: 204 }) → success', () => {
  assert.equal(classifyOutcome({ http: 204 }), 'success');
});

test('Plan 203-08 1c: classifyOutcome({ http: 301 }) → success (3xx non-failure)', () => {
  assert.equal(classifyOutcome({ http: 301 }), 'success');
});

test('Plan 203-08 1d: classifyOutcome({ http: 404 }) → success (4xx client mispelling, not breaker failure)', () => {
  assert.equal(classifyOutcome({ http: 404 }), 'success');
});

test('Plan 203-08 1e: classifyOutcome({ http: 500 }) → failure', () => {
  assert.equal(classifyOutcome({ http: 500 }), 'failure');
});

test('Plan 203-08 1f: classifyOutcome({ http: 502 }) → failure', () => {
  assert.equal(classifyOutcome({ http: 502 }), 'failure');
});

test('Plan 203-08 1g: classifyOutcome({ timeout: true }) → failure', () => {
  assert.equal(classifyOutcome({ timeout: true }), 'failure');
});

test('Plan 203-08 1h: classifyOutcome({ network_error: true }) → failure', () => {
  assert.equal(classifyOutcome({ network_error: true }), 'failure');
});

// ---- 1i recordOutcome LPUSH + LTRIM + EXPIRE + no trip below threshold ----

test('Plan 203-08 1i: recordOutcome LPUSHes + LTRIMs to 20 + EXPIREs outcomes key', async () => {
  const redis = createMockRedis();
  const out = await recordOutcome(redis, 'sub1', 'success');
  assert.equal(out.state, 'closed');
  const lpushOps = redis._ops.filter((o) => o.op === 'lpush');
  const ltrimOps = redis._ops.filter((o) => o.op === 'ltrim');
  const expireOps = redis._ops.filter((o) => o.op === 'expire');
  assert.equal(lpushOps.length, 1);
  assert.equal(lpushOps[0].key, 'cb:webhook:outcomes:sub1');
  assert.deepEqual(lpushOps[0].values, ['success']);
  assert.equal(ltrimOps.length, 1);
  assert.equal(ltrimOps[0].key, 'cb:webhook:outcomes:sub1');
  assert.equal(ltrimOps[0].start, 0);
  assert.equal(ltrimOps[0].stop, WINDOW_SIZE - 1);
  assert.equal(expireOps.length, 1);
  assert.equal(expireOps[0].key, 'cb:webhook:outcomes:sub1');
  assert.equal(expireOps[0].seconds, 3600);
});

// ---- 1j recordOutcome trips after 20 failures in a row ----

test('Plan 203-08 1j: 20 failures in a row → trips with probe_at = now + 30s, trips=1', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    let last = null;
    for (let i = 0; i < WINDOW_SIZE; i += 1) {
      last = await recordOutcome(redis, 'sub1', 'failure');
    }
    assert.equal(last.state, 'open');
    assert.equal(last.trips, 1);
    assert.equal(last.probe_at, fixedNow + HALF_OPEN_BACKOFF_SEC[0] * 1000);

    // state key contains the JSON payload
    const stateRaw = await redis.get('cb:webhook:state:sub1');
    const stateParsed = typeof stateRaw === 'string' ? JSON.parse(stateRaw) : stateRaw;
    assert.equal(stateParsed.state, 'open');
    assert.equal(stateParsed.trips, 1);
    assert.equal(stateParsed.probe_at, fixedNow + HALF_OPEN_BACKOFF_SEC[0] * 1000);
  } finally {
    Date.now = originalNow;
  }
});

// ---- 1k exactly 50% fails does NOT trip ----

test('Plan 203-08 1k: 20 samples with 10 failures + 10 successes (50%) → NOT tripped', async () => {
  const redis = createMockRedis();
  for (let i = 0; i < 10; i += 1) await recordOutcome(redis, 'sub1', 'failure');
  for (let i = 0; i < 10; i += 1) await recordOutcome(redis, 'sub1', 'success');
  const state = await getBreakerState(redis, 'sub1');
  assert.equal(state.state, 'closed');
});

// ---- 1l 55% fails trips ----

test('Plan 203-08 1l: 11 failures + 9 successes (55%) → trips', async () => {
  const redis = createMockRedis();
  for (let i = 0; i < 9; i += 1) await recordOutcome(redis, 'sub1', 'success');
  for (let i = 0; i < 11; i += 1) await recordOutcome(redis, 'sub1', 'failure');
  const state = await getBreakerState(redis, 'sub1');
  assert.equal(state.state, 'open');
  assert.equal(state.trips, 1);
});

// ---- 1m fewer than 20 samples → no trip ----

test('Plan 203-08 1m: 19 failures (below WINDOW_SIZE) → state remains closed', async () => {
  const redis = createMockRedis();
  let last = null;
  for (let i = 0; i < 19; i += 1) last = await recordOutcome(redis, 'sub1', 'failure');
  assert.equal(last.state, 'closed');
  const state = await getBreakerState(redis, 'sub1');
  assert.equal(state.state, 'closed');
});

// ---- 1n second trip (trips=2) uses backoff index 1 = 60s ----
// NOTE: In production, recordOutcome is only called AFTER a dispatch. When state is open
// with probe_at in the future, canDispatch blocks the dispatch so recordOutcome is never
// invoked. The only legitimate flow that revisits recordOutcome while state exists is:
// half-open probe → single outcome. For trip-counter increment tests we seed the
// outcomes list directly via raw Redis so the pre-trip-check reads an existing state
// and increments trips cleanly.

test('Plan 203-08 1n: second trip uses HALF_OPEN_BACKOFF_SEC[1] = 60s', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    // seed first trip state: trips=1, half-open elapsed
    await redis.set(
      'cb:webhook:state:sub1',
      JSON.stringify({ state: 'open', trips: 1, probe_at: fixedNow - 1 }),
      { ex: 3630 },
    );
    // Seed outcomes list DIRECTLY so no success interrupts the trip counter
    // 19 prior failures already in the window (head = newest).
    for (let i = 0; i < 19; i += 1) {
      await redis.lpush('cb:webhook:outcomes:sub1', 'failure');
    }
    await redis.expire('cb:webhook:outcomes:sub1', 3600);
    // Single half-open probe FAIL record — 20th failure → rate 1.0 > 0.5 → trip
    const out = await recordOutcome(redis, 'sub1', 'failure');
    assert.equal(out.state, 'open');
    assert.equal(out.trips, 2);
    assert.equal(out.probe_at, fixedNow + HALF_OPEN_BACKOFF_SEC[1] * 1000);
  } finally {
    Date.now = originalNow;
  }
});

// ---- 1o trips=5 → cap at 600s ----

test('Plan 203-08 1o: trips=5 uses HALF_OPEN_BACKOFF_SEC[4] = 600s', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    await redis.set(
      'cb:webhook:state:sub1',
      JSON.stringify({ state: 'open', trips: 4, probe_at: fixedNow - 1 }),
      { ex: 3630 },
    );
    for (let i = 0; i < 19; i += 1) {
      await redis.lpush('cb:webhook:outcomes:sub1', 'failure');
    }
    await redis.expire('cb:webhook:outcomes:sub1', 3600);
    const out = await recordOutcome(redis, 'sub1', 'failure');
    assert.equal(out.state, 'open');
    assert.equal(out.trips, 5);
    assert.equal(out.probe_at, fixedNow + HALF_OPEN_BACKOFF_SEC[4] * 1000);
  } finally {
    Date.now = originalNow;
  }
});

// ---- 1p trips=10 still uses 600s ----

test('Plan 203-08 1p: trips=10 still caps at HALF_OPEN_BACKOFF_SEC[4] = 600s', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    await redis.set(
      'cb:webhook:state:sub1',
      JSON.stringify({ state: 'open', trips: 9, probe_at: fixedNow - 1 }),
      { ex: 3630 },
    );
    for (let i = 0; i < 19; i += 1) {
      await redis.lpush('cb:webhook:outcomes:sub1', 'failure');
    }
    await redis.expire('cb:webhook:outcomes:sub1', 3600);
    const out = await recordOutcome(redis, 'sub1', 'failure');
    assert.equal(out.state, 'open');
    assert.equal(out.trips, 10);
    assert.equal(out.probe_at, fixedNow + HALF_OPEN_BACKOFF_SEC[4] * 1000);
  } finally {
    Date.now = originalNow;
  }
});

// ---- 1q canDispatch with no state → closed ----

test('Plan 203-08 1q: canDispatch with no state key → { can_dispatch: true, state: closed }', async () => {
  const redis = createMockRedis();
  const out = await canDispatch(redis, 'sub1');
  assert.equal(out.can_dispatch, true);
  assert.equal(out.state, 'closed');
});

// ---- 1r canDispatch with state=open + probe_at future → blocked ----

test('Plan 203-08 1r: canDispatch with state=open + future probe_at → { can_dispatch: false, state: open }', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    const probeAt = fixedNow + 30_000;
    await redis.set(
      'cb:webhook:state:sub1',
      JSON.stringify({ state: 'open', trips: 1, probe_at: probeAt }),
      { ex: 30 },
    );
    const out = await canDispatch(redis, 'sub1');
    assert.equal(out.can_dispatch, false);
    assert.equal(out.state, 'open');
    assert.equal(out.probe_at, probeAt);
    assert.equal(out.trips, 1);
  } finally {
    Date.now = originalNow;
  }
});

// ---- 1s canDispatch with state=open + probe_at<=now → half-open ----

test('Plan 203-08 1s: canDispatch with state=open + elapsed probe_at → { can_dispatch: true, state: half-open }', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    const probeAt = fixedNow - 1;
    await redis.set(
      'cb:webhook:state:sub1',
      JSON.stringify({ state: 'open', trips: 1, probe_at: probeAt }),
      { ex: 600 },
    );
    const out = await canDispatch(redis, 'sub1');
    assert.equal(out.can_dispatch, true);
    assert.equal(out.state, 'half-open');
    assert.equal(out.trips, 1);
  } finally {
    Date.now = originalNow;
  }
});

// ---- 1t half-open probe success → state reset to closed (state key deleted) ----

test('Plan 203-08 1t: half-open probe success → recordOutcome(success) DELETEs state key', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    await redis.set(
      'cb:webhook:state:sub1',
      JSON.stringify({ state: 'half-open', trips: 2, probe_at: fixedNow - 1 }),
      { ex: 600 },
    );
    // Verify present
    assert.ok(await redis.get('cb:webhook:state:sub1'));

    await recordOutcome(redis, 'sub1', 'success');

    // state key deleted (canonical: canDispatch sees closed)
    const stateAfter = await redis.get('cb:webhook:state:sub1');
    assert.equal(stateAfter, null);

    const brk = await getBreakerState(redis, 'sub1');
    assert.equal(brk.state, 'closed');

    const delOps = redis._ops.filter((o) => o.op === 'del' && o.key === 'cb:webhook:state:sub1');
    assert.ok(delOps.length >= 1, 'expected at least one del(stateKey)');
  } finally {
    Date.now = originalNow;
  }
});

// ---- 1u half-open probe failure → increments trips + updates backoff ----

test('Plan 203-08 1u: half-open probe failure → trips+=1 + backoff = HALF_OPEN_BACKOFF_SEC[min(trips-1,4)]', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    // seed half-open with trips=1 probe elapsed
    await redis.set(
      'cb:webhook:state:sub1',
      JSON.stringify({ state: 'open', trips: 1, probe_at: fixedNow - 1 }),
      { ex: 3630 },
    );
    // Seed outcomes list directly so no intermediate success resets the trip counter.
    // After canDispatch returns half-open the probe fires ONCE; we then record its failure.
    for (let i = 0; i < 19; i += 1) {
      await redis.lpush('cb:webhook:outcomes:sub1', 'failure');
    }
    await redis.expire('cb:webhook:outcomes:sub1', 3600);
    const out = await recordOutcome(redis, 'sub1', 'failure');
    assert.equal(out.state, 'open');
    assert.equal(out.trips, 2);
    assert.equal(out.probe_at, fixedNow + HALF_OPEN_BACKOFF_SEC[1] * 1000);
  } finally {
    Date.now = originalNow;
  }
});

// ---- 1v getBreakerState returns state without modifying Redis ----

test('Plan 203-08 1v: getBreakerState returns state + does not mutate Redis', async () => {
  const redis = createMockRedis();
  const originalNow = Date.now;
  const fixedNow = 1_700_000_000_000;
  Date.now = () => fixedNow;
  try {
    await redis.set(
      'cb:webhook:state:sub1',
      JSON.stringify({ state: 'open', trips: 3, probe_at: fixedNow + 120_000 }),
      { ex: 600 },
    );
    // reset ops counter snapshot
    const opsBefore = redis._ops.length;
    const state = await getBreakerState(redis, 'sub1');
    assert.equal(state.state, 'open');
    assert.equal(state.trips, 3);
    assert.equal(state.probe_at, fixedNow + 120_000);
    // getBreakerState should only GET, never SET/LPUSH/LTRIM/DEL
    const mutatingOps = redis._ops.slice(opsBefore).filter((o) => ['set', 'lpush', 'ltrim', 'del', 'expire'].includes(o.op));
    assert.equal(mutatingOps.length, 0);

    // with no state key → returns closed
    await redis.del('cb:webhook:state:sub1');
    const out = await getBreakerState(redis, 'sub1');
    assert.equal(out.state, 'closed');
  } finally {
    Date.now = originalNow;
  }
});

// ---- acceptance invariant: module.exports surface ----

test('Plan 203-08: module exports surface for Plan 203-10 consumption', () => {
  assert.equal(typeof recordOutcome, 'function');
  assert.equal(typeof classifyOutcome, 'function');
  assert.equal(typeof canDispatch, 'function');
  assert.equal(typeof getBreakerState, 'function');
  assert.equal(WINDOW_SIZE, 20);
  assert.equal(TRIP_THRESHOLD, 0.5);
  assert.deepEqual(HALF_OPEN_BACKOFF_SEC, [30, 60, 120, 300, 600]);
});
