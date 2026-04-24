'use strict';

// Phase 204 Plan 03 Task 2:
// GET /api/tenant/api-keys
//
// Returns the caller's tenant-scoped active API keys. Any authed member of the
// tenant can list (no role gate — consistent with other read surfaces like
// webhook subscriptions list). Mutating ops require owner|admin (see create.js +
// [key_id]/revoke.js).
//
// Security envelope:
//   - Header auth (x-markos-user-id + x-markos-tenant-id) — 401 else.
//   - Delegates to listKeys (lib/markos/cli/api-keys.cjs) which applies an
//     explicit column allow-list (NEVER key_hash) as defense-in-depth over RLS
//     (T-204-03-01).
//   - Response shape: { keys: [{ id, name, key_fingerprint, scope, created_at, last_used_at }] }.

const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { listKeys } = require('../../../lib/markos/cli/api-keys.cjs');

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../lib/markos/auth/session.ts');
  return real();
}

async function handler(req, res, deps = {}) {
  if (req.method !== 'GET') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const supabase = getSupabase(deps);

  try {
    const { keys } = await listKeys({ client: supabase, tenant_id });
    return writeJson(res, 200, { keys });
  } catch (err) {
    const msg = err && err.message ? err.message : 'list_failed';
    return writeJson(res, 500, { error: 'list_failed', error_description: msg });
  }
}

module.exports = handler;
module.exports.handler = handler;
