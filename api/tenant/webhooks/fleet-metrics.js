'use strict';

// Phase 203 Plan 09 Task 1:
// GET /api/tenant/webhooks/fleet-metrics
//
// Surface 1 hero banner source — returns the 4 headline numbers for the tenant:
// { tenant_id, total_24h, success_rate, avg_latency_ms, dlq_count, window_start, window_end }.
// Mirrors the 202-09 tenant-scope guard pattern (api/tenant/mcp/usage.js): method gate →
// header auth → supabase lookup → writeJson. F-96 declares the response schema.
//
// T-203-09-01 mitigation: header tenant_id is the sole scope — library filters by
// tenant_id first so cross-tenant data never reaches the response.

const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { aggregateFleetMetrics } = require('../../../lib/markos/webhooks/metrics.cjs');

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../lib/markos/auth/session.ts');
  return real();
}

module.exports = async function handler(req, res) { return handleFleetMetrics(req, res); };
module.exports.handleFleetMetrics = handleFleetMetrics;

async function handleFleetMetrics(req, res, deps = {}) {
  if (req.method !== 'GET') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const supabase = getSupabase(deps);

  try {
    const metrics = await aggregateFleetMetrics(supabase, tenant_id);
    return writeJson(res, 200, metrics);
  } catch (err) {
    return writeJson(res, 500, { error: 'fleet_metrics_failed' });
  }
}
