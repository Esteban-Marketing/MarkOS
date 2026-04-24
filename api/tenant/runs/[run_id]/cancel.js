'use strict';

// Phase 204 Plan 06 Task 2:
// POST /api/tenant/runs/{run_id}/cancel
//
// Transitions a non-terminal run to `cancelled`. Idempotent on terminal runs
// (returns the current state unchanged). Used by the CLI SIGINT handler in
// watch mode.
//
// Auth: Bearer (mks_ak_<64 hex>) OR legacy x-markos-user-id+tenant-id headers.
// Cross-tenant: getRun already tenant-guards; a null result implies either
// missing or foreign → 404.
//
// Responses:
//   200 → { run_id, status:'cancelled', was_terminal:false }
//   200 → { run_id, status:<terminal>, was_terminal:true } on idempotent hit
//   401 → { error: 'unauthorized'|'invalid_token'|'revoked_token' }
//   404 → { error: 'run_not_found' }
//   405 → { error: 'method_not_allowed' }

const { writeJson } = require('../../../../lib/markos/crm/api.cjs');
const { resolveWhoami, resolveSessionWhoami } = require('../../../../lib/markos/cli/whoami.cjs');
const { cancelRun } = require('../../../../lib/markos/cli/runs.cjs');
const { hashToken } = require('../../../../lib/markos/cli/plan.cjs');

function extractBearer(req) {
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth || typeof auth !== 'string') return null;
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../lib/markos/auth/session.ts');
  return real();
}

async function resolveCaller(req, res, supabase) {
  const bearer = extractBearer(req);
  if (bearer) {
    const key_hash = hashToken(bearer);
    try {
      const envelope = await resolveWhoami({ client: supabase, key_hash });
      return { tenant_id: envelope.tenant_id, user_id: envelope.user_id, scope: 'cli' };
    } catch (err) {
      const msg = err?.message || 'invalid_token';
      if (msg === 'revoked_token') {
        writeJson(res, 401, { error: 'revoked_token' }); return null;
      }
      writeJson(res, 401, { error: 'invalid_token' });
      return null;
    }
  }
  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (user_id && tenant_id) {
    try {
      const envelope = await resolveSessionWhoami({ client: supabase, user_id, tenant_id });
      return { tenant_id: envelope.tenant_id, user_id: envelope.user_id, scope: 'session' };
    } catch {
      writeJson(res, 401, { error: 'invalid_token' }); return null;
    }
  }
  writeJson(res, 401, { error: 'unauthorized' });
  return null;
}

function extractRunId(req) {
  if (req.query && req.query.run_id) return String(req.query.run_id);
  if (req.url && typeof req.url === 'string') {
    const m = req.url.match(/\/api\/tenant\/runs\/([^/?#]+)\/cancel/);
    if (m) return m[1];
  }
  return null;
}

async function handler(req, res, deps = {}) {
  if (req.method !== 'POST') {
    return writeJson(res, 405, { error: 'method_not_allowed' });
  }

  const supabase = getSupabase(deps);
  const caller = await resolveCaller(req, res, supabase);
  if (!caller) return;

  const run_id = extractRunId(req);
  if (!run_id) return writeJson(res, 400, { error: 'invalid_request', errors: ['run_id required'] });

  try {
    const result = await cancelRun({
      client: supabase,
      tenant_id: caller.tenant_id,
      user_id: caller.user_id,
      run_id,
    });
    if (!result) return writeJson(res, 404, { error: 'run_not_found' });
    return writeJson(res, 200, result);
  } catch (err) {
    return writeJson(res, 500, {
      error: 'cancel_failed',
      error_description: err?.message || String(err),
    });
  }
}

module.exports = handler;
module.exports.handler = handler;
module.exports._extractRunId = extractRunId;
