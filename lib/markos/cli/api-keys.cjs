'use strict';

// Phase 204 Plan 03 Task 1 — API-key CRUD primitive library.
//
// Four exports back the `markos keys` CLI + `/api/tenant/api-keys/*` endpoints
// + the downstream Bearer auth resolver (Phase 205 consumers):
//
//   - mintKey({ client, tenant_id, user_id, name?, scope='cli' })
//       Generates plaintext `mks_ak_<64 hex>` (32-byte entropy). Computes
//       sha256(plaintext) → key_hash; first 8 chars → key_fingerprint; prefixes
//       `cak_<16 hex>` for primary key. INSERTs into markos_cli_api_keys
//       (migration 74). Returns { key_id, access_token, key_fingerprint, name,
//       created_at } — access_token (plaintext) is the ONLY point plaintext
//       leaves this library (D-06 echo-once).
//
//   - listKeys({ client, tenant_id })
//       SELECT explicit column allow-list (NEVER key_hash) scoped to tenant_id
//       WHERE revoked_at IS NULL, ORDER BY created_at DESC. Returns { keys: [] }.
//       Defense-in-depth over RLS (T-204-03-01): even if RLS were disabled,
//       this enumeration never returns the hash column.
//
//   - revokeKey({ client, tenant_id, user_id, key_id })
//       1. SELECT tenant_id WHERE id=key_id — if null → throws 'key_not_found'
//       2. If row.tenant_id !== tenant_id → throws 'cross_tenant_forbidden'
//          (T-204-03-04; belt-and-suspenders over RLS).
//       3. UPDATE revoked_at=now() WHERE id=key_id AND revoked_at IS NULL.
//       4. Best-effort audit emit: source_domain='cli', action='api_key.revoked',
//          payload={key_id, key_fingerprint} (NEVER key_hash / plaintext —
//          T-204-03-05).
//       5. Returns { revoked_at }.
//
//   - resolveKeyByHash({ client, key_hash })
//       Bearer-auth resolver used by downstream middleware in Phase 205+.
//       SELECTs id/tenant_id/user_id/scope/revoked_at WHERE key_hash=$1.
//       On active row (!revoked_at), best-effort UPDATE last_used_at=now().
//       Returns the row or null. Caller decides policy (a revoked row still
//       resolves; the caller enforces the deny).
//
// Shared with Plan 204-02's device-flow.cjs — that module imports mintKey from
// here in pollToken's approved branch, so we are the single source of truth
// for plaintext generation + sha256-hash persistence + fingerprint convention.

const crypto = require('node:crypto');

// ─── Constants ─────────────────────────────────────────────────────────────

const TABLE = 'markos_cli_api_keys';
const KEY_PLAINTEXT_PREFIX = 'mks_ak_';
const KEY_ID_PREFIX = 'cak_';
const FINGERPRINT_LENGTH = 8;

// Columns returned by list + resolveKeyByHash. Explicitly excludes key_hash
// (T-204-03-01 defense-in-depth; the hash is a one-way digest but still
// treated as secret material per D-06).
const LIST_COLUMNS = 'id, name, key_fingerprint, scope, created_at, last_used_at';
const RESOLVE_COLUMNS = 'id, tenant_id, user_id, scope, revoked_at';

// ─── Helpers ───────────────────────────────────────────────────────────────

function sha256Hex(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

// Normalize Supabase fluent-builder thenables to { data, error }. The library
// consumes the same stub shape used by device-flow.cjs tests (Plan 204-02).
async function runQuery(builder) {
  if (!builder) return { data: null, error: null };
  if (typeof builder.then === 'function') {
    return await builder;
  }
  return builder;
}

// Best-effort audit emit — swallow errors per Plan 203-03 pattern. Audit
// failure NEVER blocks the CRUD primitive.
async function emitAuditSafe(client, entry) {
  try {
    const { enqueueAuditStaging } = require('../audit/writer.cjs');
    await enqueueAuditStaging(client, entry);
  } catch {
    /* audit emit is best-effort — compliance filter still runs via reconciliation */
  }
}

function assertClient(client, fn) {
  if (!client || typeof client.from !== 'function') {
    throw new Error(`${fn}: client required`);
  }
}

// ─── mintKey ───────────────────────────────────────────────────────────────

async function mintKey(params = {}) {
  const { client, tenant_id, user_id, name, scope } = params;
  assertClient(client, 'mintKey');
  if (!tenant_id) throw new Error('mintKey: tenant_id required');
  if (!user_id) throw new Error('mintKey: user_id required');

  // 32 bytes = 64 hex chars of entropy (256-bit). Exceeds OWASP minimum for
  // long-lived bearer credentials.
  const access_token = KEY_PLAINTEXT_PREFIX + crypto.randomBytes(32).toString('hex');
  const key_hash = sha256Hex(access_token);
  const key_fingerprint = key_hash.slice(0, FINGERPRINT_LENGTH);
  const key_id = KEY_ID_PREFIX + crypto.randomBytes(8).toString('hex');
  const created_at = new Date().toISOString();

  const row = {
    id: key_id,
    tenant_id,
    user_id,
    key_hash,
    key_fingerprint,
    scope: scope || 'cli',
    name: name || null,
    created_at,
  };

  const insertRes = await runQuery(client.from(TABLE).insert(row));
  const error = insertRes?.error;
  if (error) throw new Error(`mintKey: insert failed: ${error.message || String(error)}`);

  // Best-effort audit emit for the 'api_key.created' action (T-204-03-05).
  // Payload NEVER includes key_hash or plaintext — only the fingerprint, id,
  // and name (operator-supplied label) which is safe to log.
  await emitAuditSafe(client, {
    tenant_id,
    source_domain: 'cli',
    action: 'api_key.created',
    actor_id: user_id,
    actor_role: 'tenant_admin',
    payload: {
      key_id,
      key_fingerprint,
      name: name || null,
    },
  });

  return {
    key_id,
    access_token,         // ← ONLY point plaintext is returned
    key_fingerprint,
    name: name || null,
    created_at,
  };
}

// ─── listKeys ──────────────────────────────────────────────────────────────

async function listKeys(params = {}) {
  const { client, tenant_id } = params;
  assertClient(client, 'listKeys');
  if (!tenant_id) throw new Error('listKeys: tenant_id required');

  // Explicit column allow-list — NEVER key_hash. Secondary defense over RLS
  // (T-204-03-01). Filter revoked_at IS NULL via .is() where supported;
  // fluent builders vary, so we fall back to in-memory filter when the
  // driver does not support .is.
  let builder = client.from(TABLE).select(LIST_COLUMNS).eq('tenant_id', tenant_id);
  if (typeof builder.is === 'function') {
    builder = builder.is('revoked_at', null);
  }
  if (typeof builder.order === 'function') {
    builder = builder.order('created_at', { ascending: false });
  }

  const res = await runQuery(builder);
  if (res.error) throw new Error(`listKeys: select failed: ${res.error.message || String(res.error)}`);

  let rows = Array.isArray(res.data) ? res.data : [];
  // Defensive in-memory filter for stubs without .is(). Real Postgres already
  // enforces via the .is() or WHERE clause; this is a no-op in production.
  rows = rows.filter((r) => r && r.revoked_at == null);
  rows.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));

  // Whitelist projection: guarantee no key_hash escapes regardless of how the
  // driver/stub shaped the response (T-204-03-01 hard rail).
  const keys = rows.map((r) => ({
    id: r.id,
    name: r.name == null ? null : r.name,
    key_fingerprint: r.key_fingerprint,
    scope: r.scope,
    created_at: r.created_at,
    last_used_at: r.last_used_at == null ? null : r.last_used_at,
  }));

  return { keys };
}

// ─── revokeKey ─────────────────────────────────────────────────────────────

async function revokeKey(params = {}) {
  const { client, tenant_id, user_id, key_id } = params;
  assertClient(client, 'revokeKey');
  if (!tenant_id) throw new Error('revokeKey: tenant_id required');
  if (!user_id) throw new Error('revokeKey: user_id required');
  if (!key_id) throw new Error('revokeKey: key_id required');

  // 1. Fetch row to distinguish 404 vs 403 (T-204-03-04).
  const selectRes = await runQuery(
    client.from(TABLE)
      .select('id, tenant_id, key_fingerprint, revoked_at')
      .eq('id', key_id)
      .maybeSingle(),
  );
  if (selectRes.error) {
    throw new Error(`revokeKey: select failed: ${selectRes.error.message || String(selectRes.error)}`);
  }
  const row = selectRes.data;
  if (!row) throw new Error('key_not_found');

  // 2. Cross-tenant guard. Belt-and-suspenders over RLS claim.
  if (row.tenant_id !== tenant_id) {
    throw new Error('cross_tenant_forbidden');
  }

  // Idempotency: second revoke of same key is a no-op, not an error.
  if (row.revoked_at) {
    return { revoked_at: row.revoked_at };
  }

  const revoked_at = new Date().toISOString();

  // 3. Conditional UPDATE — guards against a race where the key is revoked
  // between SELECT and UPDATE. If revoked_at is already set, the update is a
  // no-op and we still return the pre-existing revoked_at.
  let updateBuilder = client.from(TABLE)
    .update({ revoked_at })
    .eq('id', key_id)
    .eq('tenant_id', tenant_id);
  if (typeof updateBuilder.is === 'function') {
    updateBuilder = updateBuilder.is('revoked_at', null);
  }
  const updateRes = await runQuery(updateBuilder);
  if (updateRes?.error) {
    throw new Error(`revokeKey: update failed: ${updateRes.error.message || String(updateRes.error)}`);
  }

  // 4. Audit emit (T-204-03-05). Payload NEVER includes key_hash or plaintext.
  await emitAuditSafe(client, {
    tenant_id,
    source_domain: 'cli',
    action: 'api_key.revoked',
    actor_id: user_id,
    actor_role: 'tenant_admin', // role details re-asserted at endpoint boundary
    payload: {
      key_id,
      key_fingerprint: row.key_fingerprint,
    },
  });

  return { revoked_at };
}

// ─── resolveKeyByHash ──────────────────────────────────────────────────────

async function resolveKeyByHash(params = {}) {
  const { client, key_hash } = params;
  assertClient(client, 'resolveKeyByHash');
  if (!key_hash || typeof key_hash !== 'string') return null;

  const res = await runQuery(
    client.from(TABLE)
      .select(RESOLVE_COLUMNS)
      .eq('key_hash', key_hash)
      .maybeSingle(),
  );
  if (res.error) {
    throw new Error(`resolveKeyByHash: select failed: ${res.error.message || String(res.error)}`);
  }
  const row = res.data;
  if (!row) return null;

  // Active key → bump last_used_at best-effort. Revoked keys skip the bump.
  if (!row.revoked_at) {
    try {
      await runQuery(
        client.from(TABLE)
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', row.id),
      );
    } catch {
      /* last_used_at is advisory — never fail auth on it */
    }
  }

  return {
    key_id: row.id,
    tenant_id: row.tenant_id,
    user_id: row.user_id,
    scope: row.scope,
    revoked_at: row.revoked_at || null,
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Primitives
  mintKey,
  listKeys,
  revokeKey,
  resolveKeyByHash,
  // Constants (for tests + downstream consumers)
  TABLE,
  KEY_PLAINTEXT_PREFIX,
  KEY_ID_PREFIX,
  FINGERPRINT_LENGTH,
  LIST_COLUMNS,
  RESOLVE_COLUMNS,
  // Internal helper exposed for stub-driver + future expansion
  sha256Hex,
};
