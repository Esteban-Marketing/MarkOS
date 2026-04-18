'use strict';

// Phase 203 Plan 05 Task 2:
// GET /api/tenant/webhooks/rotations/active
//
// Drives Surface 4 — global rotation-grace banner. Returns all active rotations for the
// authenticated tenant with { id, subscription_id, url, grace_ends_at, stage }. Tenant
// guard via x-markos-tenant-id header; listActiveRotations RPC re-checks .eq('tenant_id').

const { writeJson } = require('../../../../lib/markos/crm/api.cjs');
const { listActiveRotations } = require('../../../../lib/markos/webhooks/rotation.cjs');

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../lib/markos/auth/session.ts');
  return real();
}

module.exports = async function handler(req, res) { return handleRotationsActive(req, res); };
module.exports.handleRotationsActive = handleRotationsActive;

async function handleRotationsActive(req, res, deps = {}) {
  if (req.method !== 'GET') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const supabase = getSupabase(deps);

  try {
    const rotations = await listActiveRotations(supabase, tenant_id);
    return writeJson(res, 200, { rotations });
  } catch (err) {
    return writeJson(res, 500, { error: 'list_failed' });
  }
}
