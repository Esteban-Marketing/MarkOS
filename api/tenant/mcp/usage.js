'use strict';

// Phase 202 Plan 09: GET /api/tenant/mcp/usage
// Returns rolling-24h spend vs cap for the session's tenant.
// Feeds Surface S1 `/settings/mcp` usage gauge (D-12).

const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { readCurrentSpendCents } = require('../../../lib/markos/mcp/cost-meter.cjs');
const { capCentsForPlanTier } = require('../../../lib/markos/mcp/cost-table.cjs');

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../lib/markos/auth/session.ts');
  return real();
}

module.exports = async function handler(req, res) { return handleUsage(req, res); };
module.exports.handleUsage = handleUsage;

async function handleUsage(req, res, deps = {}) {
  if (req.method !== 'GET') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  const org_id = req.headers['x-markos-org-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const supabase = getSupabase(deps);

  let plan_tier = 'free';
  if (org_id) {
    const { data: org } = await supabase
      .from('markos_orgs')
      .select('plan_tier')
      .eq('id', org_id)
      .maybeSingle();
    if (org && org.plan_tier) plan_tier = org.plan_tier;
  }
  const cap_cents = capCentsForPlanTier(plan_tier);

  const { spent_cents, window_start } = await readCurrentSpendCents(supabase, tenant_id);

  const now = new Date();
  const reset_at = new Date(Math.ceil(now.getTime() / 3600_000) * 3600_000).toISOString();

  return writeJson(res, 200, { tenant_id, spent_cents, cap_cents, plan_tier, reset_at, window_start });
}
