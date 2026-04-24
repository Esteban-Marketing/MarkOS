'use strict';

// Phase 204 Plan 03 Task 2:
// POST /api/tenant/api-keys/{key_id}/revoke
//
// Revokes an API key by setting revoked_at=now(). Only owner|admin may revoke
// (T-204-03-03). Cross-tenant revoke attempts map to 403 cross_tenant_forbidden
// (T-204-03-04). Library primitive also emits best-effort audit row.
//
// Security envelope:
//   - Header auth (x-markos-user-id + x-markos-tenant-id) — 401 else.
//   - Role gate: markos_tenant_memberships.role IN (owner|admin) — 403 else.
//   - Path param: {key_id} from req.query.key_id.
//   - Delegates to revokeKey which performs the SELECT tenant_id compare +
//     conditional UPDATE.
//   - Endpoint emits authoritative audit (source_domain: 'cli',
//     action: 'api_key.revoked') — payload carries { key_id } only
//     (T-204-03-05). Library emits a belt-and-suspenders audit too.
//   - Error mapping:
//       key_not_found         → 404
//       cross_tenant_forbidden → 403
//
// Success: 200 { revoked_at }.

const { writeJson } = require('../../../../lib/markos/crm/api.cjs');
const { revokeKey } = require('../../../../lib/markos/cli/api-keys.cjs');
const { enqueueAuditStaging } = require('../../../../lib/markos/audit/writer.cjs');

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  return new Promise((resolve) => {
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function getSupabase(deps) {
  if (deps?.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../lib/markos/auth/session.ts');
  return real();
}

async function resolveMembershipRole(client, { user_id, tenant_id }) {
  const builder = client
    .from('markos_tenant_memberships')
    .select('role, user_id, tenant_id')
    .eq('tenant_id', tenant_id)
    .eq('user_id', user_id)
    .maybeSingle();
  const res = typeof builder.then === 'function' ? await builder : builder;
  if (!res) return null;
  if (res.error) throw new Error(`membership_lookup_failed: ${res.error.message || String(res.error)}`);
  return res.data ? res.data.role : null;
}

async function handler(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const key_id = req.query?.key_id;
  if (!key_id) return writeJson(res, 400, { error: 'missing_params', error_description: 'key_id is required' });

  // Body parsing for consistency (optional body; future reason/comment field).
  await readJson(req);

  const supabase = getSupabase(deps);

  // T-204-03-03: role gate.
  let role;
  try {
    role = await resolveMembershipRole(supabase, { user_id, tenant_id });
  } catch (err) {
    return writeJson(res, 500, { error: 'membership_lookup_failed', error_description: err.message });
  }
  if (!role) return writeJson(res, 403, { error: 'not_a_member' });
  if (!(role === 'owner' || role === 'admin')) {
    return writeJson(res, 403, {
      error: 'insufficient_role',
      required: ['owner', 'admin'],
      actual: role,
    });
  }

  // Delegate to revokeKey — handles SELECT/UPDATE with cross-tenant guard.
  let result;
  try {
    result = await revokeKey({ client: supabase, tenant_id, user_id, key_id });
  } catch (err) {
    const msg = err?.message || 'revoke_failed';
    if (msg === 'key_not_found') return writeJson(res, 404, { error: 'key_not_found' });
    if (msg === 'cross_tenant_forbidden') return writeJson(res, 403, { error: 'cross_tenant_forbidden' });
    return writeJson(res, 500, { error: 'revoke_failed', error_description: msg });
  }

  // T-204-03-05: authoritative audit row — actor_role is the resolved role.
  try {
    await enqueueAuditStaging(supabase, {
      tenant_id,
      source_domain: 'cli',
      action: 'api_key.revoked',
      actor_id: user_id,
      actor_role: role,
      payload: {
        key_id,
      },
    });
  } catch {
    // Audit failure must not block revoke (pattern per Plan 203-03).
  }

  return writeJson(res, 200, { revoked_at: result.revoked_at });
}

module.exports = handler;
module.exports.handler = handler;
