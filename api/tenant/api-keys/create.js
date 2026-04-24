'use strict';

// Phase 204 Plan 03 Task 2:
// POST /api/tenant/api-keys
//
// Mints a new API key for the caller's tenant. Only owner|admin roles may
// create keys (T-204-03-03). The plaintext `access_token` is returned ONCE
// in the response body and never persisted — only sha256(access_token) lives
// in the DB (D-06 echo-once).
//
// Security envelope:
//   - Header auth (x-markos-user-id + x-markos-tenant-id) — 401 else.
//   - Role gate: markos_tenant_memberships.role IN (owner|admin) — 403 else.
//   - Body validation: optional `name` (1-64 chars). Missing is fine; out-of-range
//     returns 400 invalid_name.
//   - Delegates to mintKey for crypto + sha256 + DB insert.
//   - Endpoint emits authoritative audit row (source_domain: 'cli',
//     action: 'api_key.created', actor_role: <resolved>) — payload contains
//     only { key_id, key_fingerprint, name } — NEVER key_hash or plaintext
//     (T-204-03-02 + T-204-03-05).
//   - Response: 201 { key_id, access_token, key_fingerprint, name, created_at }.
//     access_token is plaintext; clients must persist immediately.

const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { mintKey } = require('../../../lib/markos/cli/api-keys.cjs');
const { enqueueAuditStaging } = require('../../../lib/markos/audit/writer.cjs');

const MAX_NAME_LENGTH = 64;

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
  const { getSupabase: real } = require('../../../lib/markos/auth/session.ts');
  return real();
}

// Look up the caller's role in the claimed tenant. Re-used pattern from
// api/cli/oauth/device/authorize.js (Plan 204-02).
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

function validateName(raw) {
  if (raw === undefined || raw === null) return { value: null };
  if (typeof raw !== 'string') return { error: 'invalid_name' };
  if (raw.length < 1 || raw.length > MAX_NAME_LENGTH) return { error: 'invalid_name' };
  return { value: raw };
}

async function handler(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const body = await readJson(req);

  // Validate optional name (1-64 chars when provided).
  const nameCheck = validateName(body.name);
  if (nameCheck.error) {
    return writeJson(res, 400, {
      error: 'invalid_name',
      error_description: `name must be a string between 1 and ${MAX_NAME_LENGTH} chars`,
    });
  }

  const supabase = getSupabase(deps);

  // T-204-03-03: role gate. Only owner|admin can create keys.
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

  // Delegate to mintKey — the single source of truth for key generation,
  // hashing, and DB insert.
  let result;
  try {
    result = await mintKey({
      client: supabase,
      tenant_id,
      user_id,
      name: nameCheck.value,
      scope: 'cli',
    });
  } catch (err) {
    const msg = err?.message || 'create_failed';
    return writeJson(res, 500, { error: 'create_failed', error_description: msg });
  }

  // T-204-03-05: authoritative audit row — endpoint-level so actor_role is
  // the real resolved role, not the library's generic default. Payload is
  // fingerprint + id + name only; NEVER key_hash / plaintext.
  try {
    await enqueueAuditStaging(supabase, {
      tenant_id,
      source_domain: 'cli',
      action: 'api_key.created',
      actor_id: user_id,
      actor_role: role,
      payload: {
        key_id: result.key_id,
        key_fingerprint: result.key_fingerprint,
        name: result.name,
      },
    });
  } catch {
    // Audit failure must not block create (pattern per Plan 203-03).
  }

  // 201 Created. access_token is plaintext and appears in the response
  // body ONLY on this path — clients must persist/store it immediately.
  return writeJson(res, 201, {
    key_id: result.key_id,
    access_token: result.access_token,
    key_fingerprint: result.key_fingerprint,
    name: result.name,
    created_at: result.created_at,
  });
}

module.exports = handler;
module.exports.handler = handler;
