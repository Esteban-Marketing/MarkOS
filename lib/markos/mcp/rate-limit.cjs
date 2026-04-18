'use strict';

// Phase 202 Plan 04: Upstash sliding-window rate-limit (D-17).
// Two limiters: per-session (60 rpm) + per-tenant (600 rpm aggregate across all sessions).
// Rationale: per-tenant cap defeats rate-limit bypass via session rotation (T-202-04-03).

const SESSION_RPM = 60;
const TENANT_RPM = 600;

let _limiters = null;

function getLimiters(overrideRedis) {
  if (_limiters && !overrideRedis) return _limiters;
  const { Redis } = require('@upstash/redis');
  const { Ratelimit } = require('@upstash/ratelimit');
  const redis = overrideRedis || Redis.fromEnv();
  const limiters = {
    perSession: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(SESSION_RPM, '60 s'), prefix: 'rl:mcp:session' }),
    perTenant:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(TENANT_RPM,  '60 s'), prefix: 'rl:mcp:tenant'  }),
  };
  if (!overrideRedis) _limiters = limiters;
  return limiters;
}

async function checkRateLimit(redisOrLimiters, session) {
  if (!session || !session.id || !session.tenant_id) {
    throw new Error('checkRateLimit: session.id + session.tenant_id required');
  }

  // Allow test injection of pre-built limiters via { perSession, perTenant }
  const l = (redisOrLimiters && redisOrLimiters.perSession && redisOrLimiters.perTenant)
    ? redisOrLimiters
    : getLimiters(redisOrLimiters);

  const [s, t] = await Promise.all([
    l.perSession.limit(session.id),
    l.perTenant.limit(session.tenant_id),
  ]);

  if (!s.success || !t.success) {
    const reset = Math.max(s.reset || Date.now(), t.reset || Date.now());
    const retry_after = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    const scope = !s.success ? 'session' : 'tenant';
    const limit = !s.success ? SESSION_RPM : TENANT_RPM;
    return {
      ok: false,
      reason: !s.success ? 'session_rpm' : 'tenant_rpm',
      retry_after,
      scope,
      limit,
      error_429: Object.assign(new Error('rate_limited'), {
        http: 429,
        headers: { 'Retry-After': String(retry_after) },
        body: { error: 'rate_limited', scope, retry_after, limit },
      }),
    };
  }
  return { ok: true };
}

// D-17 JSON-RPC envelope: code: -32002 is the server-defined error code for rate-limited
// (paired with HTTP 429 + Retry-After header at the transport layer).
function buildRateLimitedJsonRpcError(id, req_id, { scope, retry_after, limit }) {
  return {
    jsonrpc: '2.0',
    id: id === undefined ? null : id,
    error: {
      code: -32002,
      message: 'rate_limited',
      data: { error: 'rate_limited', scope, retry_after, limit, req_id },
    },
  };
}

module.exports = {
  SESSION_RPM,
  TENANT_RPM,
  checkRateLimit,
  buildRateLimitedJsonRpcError,
  _getLimiters: getLimiters, // exposed for tests
};
