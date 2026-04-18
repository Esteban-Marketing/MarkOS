'use strict';

// Phase 202 Plan 09: POST /api/tenant/mcp/sessions/revoke
// Revokes an MCP session via /settings/mcp Revoke CTA.
// Cross-tenant hardening: verify session.tenant_id === header.x-markos-tenant-id (T-202-09-01).

const { writeJson } = require('../../../../lib/markos/crm/api.cjs');
const { revokeSession } = require('../../../../lib/markos/mcp/sessions.cjs');

async function readJson(req) {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  await new Promise((r) => req.on('end', r));
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return {};
  }
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../lib/markos/auth/session.ts');
  return real();
}

module.exports = async function handler(req, res) { return handleRevoke(req, res); };
module.exports.handleRevoke = handleRevoke;

async function handleRevoke(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const body = await readJson(req);
  if (!body.session_id) return writeJson(res, 400, { error: 'missing session_id' });

  const supabase = getSupabase(deps);

  // Validate session belongs to caller's tenant before revoking (cross_tenant_forbidden).
  const { data: session } = await supabase
    .from('markos_mcp_sessions')
    .select('id, tenant_id')
    .eq('id', body.session_id)
    .maybeSingle();
  if (!session) return writeJson(res, 404, { error: 'session_not_found' });
  if (session.tenant_id !== tenant_id) return writeJson(res, 403, { error: 'cross_tenant_forbidden' });

  try {
    await revokeSession(supabase, {
      session_id: body.session_id,
      actor_id: user_id,
      reason: 'user_revoked_via_settings',
    });
  } catch (err) {
    if (err && err.code === 'session_not_found') {
      return writeJson(res, 404, { error: 'session_not_found' });
    }
    return writeJson(res, 500, { error: 'revoke_failed' });
  }

  return writeJson(res, 200, { revoked: true, session_id: body.session_id });
}
