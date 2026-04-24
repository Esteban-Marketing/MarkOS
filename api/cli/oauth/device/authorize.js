'use strict';

// Phase 204 Plan 02 Task 2:
// POST /api/cli/oauth/device/authorize — user-facing approval endpoint.
//
// Authenticated endpoint (Phase 201 session). The approval UI posts the
// user_code (typed by the user after reading it on the CLI) + confirms the
// active tenant. We:
//   1. Require x-markos-user-id + x-markos-tenant-id headers (401 else)
//   2. Verify body.tenant_id matches header (403 cross_tenant_forbidden)
//   3. Look up markos_tenant_memberships.role — must be 'owner' or 'admin'
//      (403 insufficient_role else) to prevent T-204-02-07 elevation
//   4. Delegate to approveDeviceSession
//   5. Map typed errors:
//        user_code_not_found → 404
//        already_approved    → 409
//        expired             → 410
//   6. Success: 200 { approved: true }
//
// Audit emit happens inside approveDeviceSession (source_domain='cli',
// action='device.approved') per T-204-02-08.

const { writeJson } = require('../../../../lib/markos/crm/api.cjs');
const { approveDeviceSession } = require('../../../../lib/markos/cli/device-flow.cjs');

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
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../lib/markos/auth/session.ts');
  return real();
}

// Returns the caller's role IN the claimed tenant, or null if no membership.
async function resolveMembershipRole(client, { user_id, tenant_id }) {
  const builder = client
    .from('markos_tenant_memberships')
    .select('role, user_id, tenant_id')
    .eq('tenant_id', tenant_id)
    .eq('user_id', user_id)
    .maybeSingle();

  // Fluent builders are usually thenable — normalize.
  const res = typeof builder.then === 'function' ? await builder : builder;
  if (!res) return null;
  if (res.error) throw new Error(`membership_lookup_failed: ${res.error.message || String(res.error)}`);
  return res.data ? res.data.role : null;
}

async function handler(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const header_tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !header_tenant_id) {
    return writeJson(res, 401, { error: 'unauthorized' });
  }

  const body = await readJson(req);
  const { user_code, tenant_id } = body;
  if (!user_code) return writeJson(res, 400, { error: 'missing_params', error_description: 'user_code is required' });
  if (!tenant_id) return writeJson(res, 400, { error: 'missing_params', error_description: 'tenant_id is required' });

  // T-204-02-06: session tenant MUST match body tenant to neutralize CSRF/replay
  // across tenants (prevents a session holder from approving a device for a
  // tenant they are not currently acting as).
  if (tenant_id !== header_tenant_id) {
    return writeJson(res, 403, { error: 'cross_tenant_forbidden' });
  }

  const supabase = getSupabase(deps);

  // T-204-02-07: enforce role IN ('owner', 'admin') on the claimed tenant.
  let role;
  try {
    role = await resolveMembershipRole(supabase, { user_id, tenant_id });
  } catch (err) {
    return writeJson(res, 500, { error: 'membership_lookup_failed', error_description: err.message });
  }
  if (!role) return writeJson(res, 403, { error: 'not_a_member' });
  if (!(role === 'owner' || role === 'admin')) {
    return writeJson(res, 403, { error: 'insufficient_role', required: ['owner', 'admin'] });
  }

  try {
    const result = await approveDeviceSession({
      client: supabase,
      user_code,
      tenant_id,
      user_id,
      user_role: role,
    });
    return writeJson(res, 200, { approved: true, device_code: result.device_code });
  } catch (err) {
    const msg = err && err.message ? err.message : 'authorize_failed';
    if (msg === 'user_code_not_found') return writeJson(res, 404, { error: 'user_code_not_found' });
    if (msg === 'already_approved')    return writeJson(res, 409, { error: 'already_approved' });
    if (msg === 'expired')             return writeJson(res, 410, { error: 'expired' });
    return writeJson(res, 500, { error: 'authorize_failed', error_description: msg });
  }
}

module.exports = handler;
module.exports.handler = handler;
