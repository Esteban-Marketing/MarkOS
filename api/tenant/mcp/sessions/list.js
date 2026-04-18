'use strict';

// Phase 202 Plan 09: GET /api/tenant/mcp/sessions
// Lists active MCP sessions for the session's tenant; token_hash NEVER echoed.
// Plan 202-01 RLS filters cross-tenant reads as defense-in-depth.

const { writeJson } = require('../../../../lib/markos/crm/api.cjs');
const { listSessionsForTenant } = require('../../../../lib/markos/mcp/sessions.cjs');

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../lib/markos/auth/session.ts');
  return real();
}

module.exports = async function handler(req, res) { return handleList(req, res); };
module.exports.handleList = handleList;

async function handleList(req, res, deps = {}) {
  if (req.method !== 'GET') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const supabase = getSupabase(deps);
  const sessions = await listSessionsForTenant(supabase, tenant_id);

  return writeJson(res, 200, {
    sessions: sessions.map((s) => ({
      id: s.id,
      client_id: s.client_id,
      scopes: s.scopes || [],
      created_at: s.created_at,
      last_used_at: s.last_used_at,
      expires_at: s.expires_at,
    })),
  });
}
