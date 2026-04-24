'use strict';

// Phase 204 Plan 04 Task 1 — resolveWhoami primitive.
//
// Canonical Bearer-to-context resolver consumed by:
//   - api/tenant/whoami.js (this plan)
//   - Wave 2+ endpoints that need to translate an incoming Bearer token into
//     tenant/user/role context (204-06 run, 204-07 env, 204-08 status, etc.)
//   - Phase 205 Bearer auth middleware (imports resolveKeyByHash directly)
//
// Responsibility: given a sha256 hex digest of a Bearer token, resolve the
// owning tenant/user/role and the operator's email + tenant name. Throws
// typed error strings on failure so callers can render precise HTTP status.
//
// Flow:
//   1. resolveKeyByHash({ client, key_hash }) delegates to api-keys.cjs.
//      - null  → throws 'invalid_token'
//      - revoked_at !== null → throws 'revoked_token'
//   2. Parallel-fetch the three joins needed for the whoami envelope:
//      - markos_tenants      (id, name)
//      - markos_users        (id, email)
//      - markos_tenant_memberships (tenant_id, user_id, role)
//   3. Returns the envelope:
//      {
//        tenant_id, tenant_name, role,
//        email, user_id,
//        key_fingerprint (may be undefined when the caller supplied legacy
//          session headers instead of a Bearer — see resolveSessionWhoami),
//        scope, last_used_at
//      }
//
// Sibling helper:
//   - resolveSessionWhoami({ client, user_id, tenant_id }) — for the legacy
//     Phase 201 web-session header path (x-markos-user-id + x-markos-tenant-id).
//     Skips the api-keys table (no Bearer involved); just runs the three joins.
//
// This file is the SINGLE canonical Bearer-to-context resolver. All future
// authed endpoints should call resolveWhoami (for Bearer paths) or the
// combined helper on /api/tenant/whoami.js (for dual-mode endpoints).

const { resolveKeyByHash } = require('./api-keys.cjs');

// ─── Constants ─────────────────────────────────────────────────────────────

const TENANTS_TABLE = 'markos_tenants';
const USERS_TABLE = 'markos_users';
const MEMBERSHIPS_TABLE = 'markos_tenant_memberships';
const API_KEYS_TABLE = 'markos_cli_api_keys';

// ─── Helpers ───────────────────────────────────────────────────────────────

function assertClient(client, fn) {
  if (!client || typeof client.from !== 'function') {
    throw new Error(`${fn}: client required`);
  }
}

async function runQuery(builder) {
  if (!builder) return { data: null, error: null };
  if (typeof builder.then === 'function') return await builder;
  return builder;
}

// Look up an active key row to pull key_fingerprint + last_used_at. The row is
// already resolved (we have the id), but the explicit column allow-list keeps
// key_hash out of whoami's reach.
async function fetchKeyMeta(client, key_id) {
  try {
    const res = await runQuery(
      client.from(API_KEYS_TABLE)
        .select('id, key_fingerprint, last_used_at, created_at')
        .eq('id', key_id)
        .maybeSingle(),
    );
    if (res?.error) return null;
    return res?.data || null;
  } catch {
    return null;
  }
}

async function fetchTenant(client, tenant_id) {
  const res = await runQuery(
    client.from(TENANTS_TABLE)
      .select('id, name')
      .eq('id', tenant_id)
      .maybeSingle(),
  );
  if (res?.error) throw new Error(`tenant_lookup_failed: ${res.error.message || String(res.error)}`);
  return res?.data || null;
}

async function fetchUser(client, user_id) {
  const res = await runQuery(
    client.from(USERS_TABLE)
      .select('id, email')
      .eq('id', user_id)
      .maybeSingle(),
  );
  if (res?.error) throw new Error(`user_lookup_failed: ${res.error.message || String(res.error)}`);
  return res?.data || null;
}

async function fetchRole(client, tenant_id, user_id) {
  const res = await runQuery(
    client.from(MEMBERSHIPS_TABLE)
      .select('role, tenant_id, user_id')
      .eq('tenant_id', tenant_id)
      .eq('user_id', user_id)
      .maybeSingle(),
  );
  if (res?.error) throw new Error(`membership_lookup_failed: ${res.error.message || String(res.error)}`);
  return res?.data ? res.data.role : null;
}

// Best-effort async `last_used_at` touch. Fire-and-forget so it does not block
// the caller's response. Errors are swallowed (advisory metric only).
function touchLastUsedAsync(client, key_id) {
  setImmediate(() => {
    try {
      const builder = client.from(API_KEYS_TABLE)
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', key_id);
      const p = typeof builder.then === 'function' ? builder : Promise.resolve();
      Promise.resolve(p).catch(() => { /* advisory */ });
    } catch {
      /* advisory */
    }
  });
}

// ─── resolveWhoami (Bearer path) ───────────────────────────────────────────

async function resolveWhoami(params = {}) {
  const { client, key_hash } = params;
  assertClient(client, 'resolveWhoami');
  if (!key_hash || typeof key_hash !== 'string') {
    throw new Error('invalid_token');
  }

  // 1. Resolve the key. resolveKeyByHash returns null for unknown keys; the
  //    revoked_at field is preserved on revoked rows so we can distinguish.
  const keyRow = await resolveKeyByHash({ client, key_hash });
  if (!keyRow) throw new Error('invalid_token');
  if (keyRow.revoked_at) throw new Error('revoked_token');

  const { tenant_id, user_id, scope, key_id } = keyRow;

  // 2. Parallel fan-out: tenant + user + membership + key meta. Wrapping each
  //    in a single Promise.all cuts whoami latency to the slowest single query.
  const [tenant, user, role, keyMeta] = await Promise.all([
    fetchTenant(client, tenant_id),
    fetchUser(client, user_id),
    fetchRole(client, tenant_id, user_id),
    fetchKeyMeta(client, key_id),
  ]);

  if (!user) throw new Error('invalid_token');   // session purged / orphaned
  if (!tenant) throw new Error('invalid_token');
  if (!role) throw new Error('invalid_token');   // membership revoked

  // 3. Fire-and-forget last_used_at touch. resolveKeyByHash already attempted a
  //    best-effort bump, but keyMeta.last_used_at was read BEFORE that update
  //    landed (Promise.all racing). Re-touch so downstream reads see fresh ts.
  //    setImmediate ensures zero observable latency on the response path.
  touchLastUsedAsync(client, key_id);

  return {
    tenant_id,
    tenant_name: tenant.name,
    role,
    email: user.email,
    user_id,
    key_fingerprint: keyMeta ? keyMeta.key_fingerprint : null,
    scope,
    last_used_at: keyMeta ? (keyMeta.last_used_at || null) : null,
  };
}

// ─── resolveSessionWhoami (legacy header path) ─────────────────────────────

// For the Phase 201 web-session header flow. No Bearer involved: caller already
// asserted a logged-in session via x-markos-user-id + x-markos-tenant-id, and
// we just need to hydrate the display envelope.
async function resolveSessionWhoami(params = {}) {
  const { client, user_id, tenant_id } = params;
  assertClient(client, 'resolveSessionWhoami');
  if (!user_id || !tenant_id) throw new Error('invalid_token');

  const [tenant, user, role] = await Promise.all([
    fetchTenant(client, tenant_id),
    fetchUser(client, user_id),
    fetchRole(client, tenant_id, user_id),
  ]);

  if (!user) throw new Error('invalid_token');
  if (!tenant) throw new Error('invalid_token');
  if (!role) throw new Error('invalid_token');

  return {
    tenant_id,
    tenant_name: tenant.name,
    role,
    email: user.email,
    user_id,
    key_fingerprint: null, // legacy session path — no API key involved
    scope: 'session',
    last_used_at: null,
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  resolveWhoami,
  resolveSessionWhoami,
  // Constants exposed for tests + downstream consumers
  TENANTS_TABLE,
  USERS_TABLE,
  MEMBERSHIPS_TABLE,
  API_KEYS_TABLE,
};
