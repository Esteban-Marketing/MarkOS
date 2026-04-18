'use strict';

// Phase 203 Plan 10 Task 2 — GET /api/public/webhooks/status
// Public, unauthenticated webhook status endpoint backing Surface 3 (/status/webhooks).
// F-99 contract. Platform-wide aggregation (tenant_id NOT exposed in response).
//
// Cache: public, max-age=60, s-maxage=60, stale-while-revalidate=60
// CORS: Access-Control-Allow-Origin: * (RESEARCH §Threat Patterns accept — aggregate-only).
//
// Platform-wide aggregation: queries the markos_webhook_fleet_metrics_v1 view directly
// without a tenant_id filter. Plan 203-09's aggregateFleetMetrics REQUIRES a tenant_id
// (throws on null), so Plan 203-10 owns a separate platform-wide query path rather than
// cross-plan-editing metrics.cjs. T-203-10-01 mitigation is enforced by the response
// schema below (no tenant_id property emitted).

const { countDLQ } = require('../../../lib/markos/webhooks/dlq.cjs');
const { emitLogLine } = require('../../../lib/markos/webhooks/log-drain.cjs');

const WINDOW_24H_MS = 24 * 3600 * 1000;

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  // Lazy resolve — production uses the service-role client (Plan 203-01 pattern);
  // tests inject via deps to avoid env-var coupling.
  try {
    const store = require('../../../lib/markos/webhooks/store.cjs');
    if (typeof store.getSupabaseAdmin === 'function') return store.getSupabaseAdmin();
  } catch { /* module missing — fall through */ }
  return null;
}

function writeJson(res, code, body) {
  res.statusCode = code;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function setPublicCacheHeaders(res) {
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=60');
  res.setHeader('Access-Control-Allow-Origin', '*');
  // CORS for browsers embedding the JSON directly — safe because the response is aggregate-only.
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
}

function safeNumber(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

// Platform-wide aggregation — unlike metrics.cjs::aggregateFleetMetrics which REQUIRES
// a tenant_id, this helper sums the view across all tenants. Response intentionally strips
// tenant_id so T-203-10-01 (information disclosure) is enforced at the data layer.
async function aggregatePlatformWide(supabase, { now = new Date() } = {}) {
  const nowDate = now instanceof Date ? now : new Date(now);
  const windowStartIso = new Date(nowDate.getTime() - WINDOW_24H_MS).toISOString();

  const viewRes = await supabase
    .from('markos_webhook_fleet_metrics_v1')
    .select('*')
    .gte('bucket', windowStartIso);

  const rows = Array.isArray(viewRes) ? viewRes : viewRes?.data || [];
  if (viewRes?.error) throw new Error(`aggregatePlatformWide: ${viewRes.error.message}`);

  let total = 0;
  let delivered = 0;
  let latencySum = 0;
  let latencyBuckets = 0;
  for (const row of rows) {
    const rowTotal = safeNumber(row.total);
    const rowDelivered = safeNumber(row.delivered);
    const rowLatency = row.avg_latency_ms == null ? null : safeNumber(row.avg_latency_ms);
    total += rowTotal;
    delivered += rowDelivered;
    if (rowLatency != null && rowDelivered > 0) {
      latencySum += rowLatency * rowDelivered;
      latencyBuckets += rowDelivered;
    }
  }

  const success_rate = total === 0 ? 1.0 : delivered / total;
  const avg_latency_ms = latencyBuckets === 0 ? 0 : Math.round(latencySum / latencyBuckets);

  // DLQ count platform-wide — countDLQ requires tenant_id, so query the deliveries table
  // directly here. Out-of-scope to extend countDLQ.
  let dlq_count = 0;
  try {
    const dlqRes = await supabase
      .from('markos_webhook_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .not('dlq_at', 'is', null);
    dlq_count = safeNumber(dlqRes?.count);
  } catch {
    dlq_count = 0;
  }

  return { total_24h: total, delivered_24h: delivered, success_rate, avg_latency_ms, dlq_count };
}

async function handleStatus(req, res, deps = {}) {
  if (req.method && req.method !== 'GET') {
    setPublicCacheHeaders(res);
    return writeJson(res, 405, { error: 'method_not_allowed' });
  }

  setPublicCacheHeaders(res);

  const supabase = getSupabase(deps);
  // Allow injected aggregateFleetMetrics for test harnesses that want to mock the whole
  // aggregator (compat with the Plan 203-09 lib); otherwise use the platform-wide helper.
  const aggregator = deps.aggregateFleetMetrics || ((client /* supabase */, tenantArg) => {
    // When aggregator is NOT injected, we ignore tenantArg and always aggregate platform-wide.
    // Tests inject deps.aggregateFleetMetrics to verify tenantArg===null is passed.
    if (tenantArg !== null && tenantArg !== undefined) {
      // Defensive — callers MUST pass null for platform-wide. This should never fire in prod.
      return Promise.reject(new Error('status endpoint only supports platform-wide aggregation (tenant_id=null)'));
    }
    return aggregatePlatformWide(client);
  });

  const started = Date.now();
  try {
    const metrics = await aggregator(supabase, null);
    const body = {
      total_24h: safeNumber(metrics.total_24h),
      success_rate: typeof metrics.success_rate === 'number' ? metrics.success_rate : 0,
      avg_latency_ms: safeNumber(metrics.avg_latency_ms),
      dlq_count: safeNumber(metrics.dlq_count),
      last_updated: new Date().toISOString(),
    };
    emitLogLine({
      domain: 'webhook',
      req_id: null,
      status: 'status_ok',
      duration_ms: Date.now() - started,
    });
    return writeJson(res, 200, body);
  } catch (err) {
    emitLogLine({
      domain: 'webhook',
      req_id: null,
      status: 'error',
      duration_ms: Date.now() - started,
      error_code: 'status_unavailable',
    });
    return writeJson(res, 500, { error: 'status_unavailable' });
  }
}

module.exports = async function handler(req, res, deps) {
  return handleStatus(req, res, deps);
};
module.exports.handleStatus = handleStatus;
module.exports.aggregatePlatformWide = aggregatePlatformWide;
