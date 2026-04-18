'use strict';

// Phase 203 Plan 08 — Webhook circuit breaker (D-14 + D-15).
//
// D-14: WINDOW_SIZE = 20, TRIP_THRESHOLD = 0.5. Trips when >50% of the last 20 delivery
//       outcomes are failures. Failure = HTTP 5xx OR timeout OR network error. 4xx is NOT
//       a failure (client-side misrouting should not trip the breaker — an explicit reading
//       of "5xx or timeout" in the UI-SPEC). 2xx/3xx = success.
//
// D-15: HALF_OPEN_BACKOFF_SEC = [30, 60, 120, 300, 600]. Half-open probe backoff is
//       exponential and capped at 10 min. Index = min(trips - 1, length - 1).
//
// Storage: Upstash Redis (shares @upstash/redis with 202-04 MCP rate-limit pipeline;
// no new deps). In-memory storage is explicitly rejected per RESEARCH §Pitfall 1 —
// Vercel Fluid Compute silently loses state on instance turnover.
//
// Integration: Plan 203-07 shipped dispatch-gates.cjs with the pre-fetch indirection
// point. Plan 203-08 (this file) EXTENDS dispatch-gates.cjs by inserting canDispatch as
// the FIRST gate (before rate-limit). recordOutcome + classifyOutcome are exported as
// PURE primitives — Plan 203-10 imports them and invokes them inside its own
// observability wrapper around the fetch() call in delivery.cjs. This plan does NOT
// edit delivery.cjs (T-203-08-06 single-owner-per-file-per-wave invariant).
//
// Storage schema:
//   cb:webhook:outcomes:<sub_id>  — Redis list of 'success'|'failure' (newest at head;
//                                   trimmed to WINDOW_SIZE=20 with 1h idle TTL).
//   cb:webhook:state:<sub_id>     — JSON blob { state: 'open'|'half-open', trips, probe_at }
//                                   with TTL = backoff + 3600s; absent = closed.
//
// RACE TOLERANCE (T-203-08-02 / RESEARCH §Assumptions Log A3): LPUSH/LTRIM across
// concurrent failures may occasionally trim each other's samples. For a 20-sample /
// 50% threshold the noise floor is a handful of false trips per thousand invocations,
// which is tolerable. Upgrade to ZSET if pentest finds an exploit path.

const WINDOW_SIZE = 20;
const TRIP_THRESHOLD = 0.5;
const HALF_OPEN_BACKOFF_SEC = Object.freeze([30, 60, 120, 300, 600]);

const STATE_KEY_PREFIX = 'cb:webhook:state';
const OUTCOMES_KEY_PREFIX = 'cb:webhook:outcomes';
const OUTCOMES_TTL_SECONDS = 3600;
const STATE_IDLE_PAD_SECONDS = 3600;

function stateKeyFor(sub_id) {
  return `${STATE_KEY_PREFIX}:${sub_id}`;
}

function outcomesKeyFor(sub_id) {
  return `${OUTCOMES_KEY_PREFIX}:${sub_id}`;
}

function parseStateBlob(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'object') return raw; // Upstash SDK may auto-parse JSON responses
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  }
  return null;
}

// Pure classifier — D-14 "5xx or timeout" reading.
function classifyOutcome({ http, timeout, network_error } = {}) {
  if (timeout || network_error) return 'failure';
  if (typeof http !== 'number' || !Number.isFinite(http)) {
    // Unknown fetch result — fail closed (counts as failure so the breaker protects the subscriber).
    return 'failure';
  }
  if (http >= 500) return 'failure';
  // 2xx, 3xx, 4xx all treated as success for breaker purposes.
  // 4xx explicit non-failure per D-14: client-side misrouting shouldn't trip the breaker.
  return 'success';
}

async function recordOutcome(redis, sub_id, outcome) {
  if (outcome !== 'success' && outcome !== 'failure') {
    throw new Error('recordOutcome: outcome must be "success" or "failure"');
  }
  if (!sub_id) {
    throw new Error('recordOutcome: sub_id required');
  }

  const listKey = outcomesKeyFor(sub_id);
  const stateKey = stateKeyFor(sub_id);

  await redis.lpush(listKey, outcome);
  await redis.ltrim(listKey, 0, WINDOW_SIZE - 1);
  await redis.expire(listKey, OUTCOMES_TTL_SECONDS);

  // Read state pre-trip-check. Upstash SDK may return either a JSON string or an already-parsed object.
  const currentRaw = await redis.get(stateKey);
  const currentState = parseStateBlob(currentRaw);

  // Recovery path: a success outcome while the breaker is open/half-open clears the state.
  if (outcome === 'success' && currentState && currentState.state && currentState.state !== 'closed') {
    await redis.del(stateKey);
    return { state: 'closed' };
  }

  const last20 = await redis.lrange(listKey, 0, WINDOW_SIZE - 1);
  if (!Array.isArray(last20) || last20.length < WINDOW_SIZE) {
    return { state: 'closed' };
  }

  const failures = last20.filter((o) => o === 'failure').length;
  const rate = failures / WINDOW_SIZE;

  if (rate > TRIP_THRESHOLD) {
    const priorTrips = currentState && typeof currentState.trips === 'number' ? currentState.trips : 0;
    const trips = priorTrips + 1;
    const idx = Math.min(trips - 1, HALF_OPEN_BACKOFF_SEC.length - 1);
    const backoff = HALF_OPEN_BACKOFF_SEC[idx];
    const probe_at = Date.now() + backoff * 1000;
    await redis.set(
      stateKey,
      JSON.stringify({ state: 'open', trips, probe_at }),
      { ex: backoff + STATE_IDLE_PAD_SECONDS },
    );
    return { state: 'open', trips, probe_at };
  }

  return { state: 'closed' };
}

async function canDispatch(redis, sub_id) {
  if (!sub_id) {
    throw new Error('canDispatch: sub_id required');
  }
  const stateKey = stateKeyFor(sub_id);
  const raw = await redis.get(stateKey);
  const parsed = parseStateBlob(raw);
  if (!parsed) return { can_dispatch: true, state: 'closed' };
  if (parsed.state === 'closed') return { can_dispatch: true, state: 'closed' };
  if (typeof parsed.probe_at === 'number' && Date.now() >= parsed.probe_at) {
    return { can_dispatch: true, state: 'half-open', trips: parsed.trips };
  }
  return {
    can_dispatch: false,
    state: 'open',
    probe_at: parsed.probe_at,
    trips: parsed.trips,
  };
}

async function getBreakerState(redis, sub_id) {
  if (!sub_id) {
    throw new Error('getBreakerState: sub_id required');
  }
  const stateKey = stateKeyFor(sub_id);
  const raw = await redis.get(stateKey);
  const parsed = parseStateBlob(raw);
  if (!parsed) return { state: 'closed' };
  return {
    state: parsed.state || 'closed',
    trips: parsed.trips,
    probe_at: parsed.probe_at,
  };
}

module.exports = {
  recordOutcome,
  canDispatch,
  classifyOutcome,
  getBreakerState,
  WINDOW_SIZE,
  TRIP_THRESHOLD,
  HALF_OPEN_BACKOFF_SEC,
};
