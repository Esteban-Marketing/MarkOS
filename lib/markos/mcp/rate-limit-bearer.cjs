'use strict';

// Phase 200.1 D-204: SQL-backed 100 req/min bearer rate-limit keyed by tenant_id.

const LIMIT_PER_MINUTE = 100;

function currentMinuteWindowStart(now = Date.now()) {
  return new Date(Math.floor(Number(now) / 60_000) * 60_000).toISOString();
}

async function checkRateLimit(client, tenant_id, opts = {}) {
  if (!client || typeof client.rpc !== 'function') {
    throw new Error('checkRateLimit: supabase client required');
  }
  if (!tenant_id) throw new Error('checkRateLimit: tenant_id required');

  const limit = Number.isFinite(opts.limit) ? Number(opts.limit) : LIMIT_PER_MINUTE;
  const nowMs = Number.isFinite(opts.now) ? Number(opts.now) : Date.now();
  const window_start = currentMinuteWindowStart(nowMs);

  const { data, error } = await client.rpc('markos_mcp_increment_rate_window', {
    p_tenant_id: tenant_id,
    p_window_start: window_start,
  });
  if (error) {
    throw new Error(`checkRateLimit: rpc failed: ${error.message || String(error)}`);
  }

  const count = Number(Array.isArray(data) ? data[0] : data);
  if (!Number.isFinite(count)) {
    throw new Error('checkRateLimit: rpc returned non-numeric count');
  }

  const retry_after_seconds = Math.max(1, Math.ceil(((Date.parse(window_start) + 60_000) - nowMs) / 1000));
  if (count > limit) {
    return {
      ok: false,
      reason: 'rate_limited',
      count,
      limit,
      retry_after_seconds,
      window_start,
    };
  }

  return { ok: true, count, limit, window_start };
}

module.exports = {
  LIMIT_PER_MINUTE,
  currentMinuteWindowStart,
  checkRateLimit,
};
