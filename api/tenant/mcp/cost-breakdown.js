'use strict';

// Phase 202 Plan 09: GET /api/tenant/mcp/cost-breakdown
// Aggregates last-24h markos_audit_log rows (source_domain='mcp', action='tool.invoked')
// grouped by payload.tool_id. Feeds Surface S1 /settings/mcp breakdown section.

const { writeJson } = require('../../../lib/markos/crm/api.cjs');

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../lib/markos/auth/session.ts');
  return real();
}

module.exports = async function handler(req, res) { return handleBreakdown(req, res); };
module.exports.handleBreakdown = handleBreakdown;

async function handleBreakdown(req, res, deps = {}) {
  if (req.method !== 'GET') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const supabase = getSupabase(deps);
  const window_start = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const window_end = new Date().toISOString();

  const { data, error } = await supabase
    .from('markos_audit_log')
    .select('payload, created_at')
    .eq('tenant_id', tenant_id)
    .eq('source_domain', 'mcp')
    .eq('action', 'tool.invoked')
    .gt('created_at', window_start);
  if (error) return writeJson(res, 500, { error: 'db_error' });

  const agg = new Map();
  for (const row of (data || [])) {
    const tool_id = row && row.payload ? row.payload.tool_id : null;
    const cost = Number((row && row.payload && row.payload.cost_cents) || 0);
    if (!tool_id) continue;
    const cur = agg.get(tool_id) || { tool_id, calls: 0, total_cost_cents: 0 };
    cur.calls += 1;
    cur.total_cost_cents += cost;
    agg.set(tool_id, cur);
  }
  // Primary: total_cost_cents desc (most expensive first).
  // Secondary: calls asc — on ties, fewer calls means higher per-call cost (more interesting signal).
  const by_tool = Array.from(agg.values()).sort((a, b) => {
    if (b.total_cost_cents !== a.total_cost_cents) return b.total_cost_cents - a.total_cost_cents;
    return a.calls - b.calls;
  });

  return writeJson(res, 200, { by_tool, window_start, window_end, tenant_id });
}
