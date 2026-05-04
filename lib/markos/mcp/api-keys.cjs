'use strict';

// Phase 200.1 D-204: tenant-scoped MCP bearer keys (`mks_<base32>`).
// Only the sha256 hash is persisted; plaintext is returned once on creation.

const crypto = require('node:crypto');

const TABLE = 'markos_mcp_api_keys';
const TOKEN_PREFIX = 'mks_';
const KEY_ID_PREFIX = 'mcp-key-';
const TOKEN_BYTES = 32;
const TOKEN_REGEX = /^mks_[a-z2-7]{52}$/;
const FINGERPRINT_LENGTH = 8;

function assertClient(client, fn) {
  if (!client || typeof client.from !== 'function') {
    throw new Error(`${fn}: supabase client required`);
  }
}

async function runQuery(builder) {
  if (!builder) return { data: null, error: null };
  if (typeof builder.then === 'function') return builder;
  return builder;
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function base32LowerNoPad(buffer) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let bits = 0;
  let value = 0;
  let out = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    out += alphabet[(value << (5 - bits)) & 31];
  }

  return out;
}

function isMcpApiKeyToken(token) {
  return typeof token === 'string' && TOKEN_REGEX.test(token);
}

function inferPlanTier(plan_key) {
  const raw = String(plan_key || '').trim().toLowerCase();
  if (!raw) return 'free';
  return raw.includes('free') ? 'free' : 'team';
}

async function resolveTenantContext(client, tenant_id) {
  assertClient(client, 'resolveTenantContext');
  if (!tenant_id) throw new Error('resolveTenantContext: tenant_id required');

  const tenantRes = await runQuery(
    client
      .from('markos_tenants')
      .select('id, org_id, status')
      .eq('id', tenant_id)
      .maybeSingle(),
  );
  if (tenantRes.error) {
    throw new Error(`resolveTenantContext: tenant lookup failed: ${tenantRes.error.message || String(tenantRes.error)}`);
  }
  if (!tenantRes.data) {
    throw new Error('tenant_not_found');
  }

  const subRes = await runQuery(
    client
      .from('tenant_billing_subscriptions')
      .select('plan_key, billing_state')
      .eq('tenant_id', tenant_id)
      .maybeSingle(),
  );

  if (subRes.error) {
    throw new Error(`resolveTenantContext: subscription lookup failed: ${subRes.error.message || String(subRes.error)}`);
  }

  return {
    tenant_id,
    org_id: tenantRes.data.org_id || null,
    tenant_status: tenantRes.data.status || 'active',
    billing_state: subRes.data ? subRes.data.billing_state || null : null,
    plan_tier: inferPlanTier(subRes.data ? subRes.data.plan_key : null),
  };
}

async function createKey(client, tenant_id, label, scopes = [], created_by_user_id = null) {
  assertClient(client, 'createKey');
  if (!tenant_id) throw new Error('createKey: tenant_id required');
  if (typeof label !== 'string' || !label.trim()) throw new Error('createKey: label required');

  const tenant = await resolveTenantContext(client, tenant_id);
  const plaintext = TOKEN_PREFIX + base32LowerNoPad(crypto.randomBytes(TOKEN_BYTES));
  const key_hash = sha256Hex(plaintext);
  const key_id = KEY_ID_PREFIX + crypto.randomBytes(8).toString('hex');
  const created_at = new Date().toISOString();
  const normalizedScopes = Array.isArray(scopes) ? scopes.filter((scope) => typeof scope === 'string' && scope.trim()) : [];

  const insertRes = await runQuery(
    client.from(TABLE).insert({
      id: key_id,
      tenant_id,
      org_id: tenant.org_id,
      key_hash,
      label: label.trim(),
      scopes: normalizedScopes,
      created_by_user_id: created_by_user_id || null,
      created_at,
    }),
  );
  if (insertRes.error) {
    throw new Error(`createKey: insert failed: ${insertRes.error.message || String(insertRes.error)}`);
  }

  return {
    id: key_id,
    label: label.trim(),
    scopes: normalizedScopes,
    created_at,
    key_fingerprint: key_hash.slice(0, FINGERPRINT_LENGTH),
    plaintext_token_show_once: plaintext,
  };
}

async function listKeys(client, tenant_id) {
  assertClient(client, 'listKeys');
  if (!tenant_id) throw new Error('listKeys: tenant_id required');

  let builder = client
    .from(TABLE)
    .select('id, tenant_id, label, scopes, created_at, last_used_at, revoked_at, key_hash')
    .eq('tenant_id', tenant_id);
  if (typeof builder.order === 'function') {
    builder = builder.order('created_at', { ascending: false });
  }

  const res = await runQuery(builder);
  if (res.error) {
    throw new Error(`listKeys: select failed: ${res.error.message || String(res.error)}`);
  }

  return (Array.isArray(res.data) ? res.data : [])
    .filter((row) => row && row.revoked_at == null)
    .map((row) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      label: row.label,
      scopes: Array.isArray(row.scopes) ? row.scopes : [],
      created_at: row.created_at,
      last_used_at: row.last_used_at || null,
      key_fingerprint: String(row.key_hash || '').slice(0, FINGERPRINT_LENGTH),
    }));
}

async function revokeKey(client, tenant_id, key_id) {
  assertClient(client, 'revokeKey');
  if (!tenant_id) throw new Error('revokeKey: tenant_id required');
  if (!key_id) throw new Error('revokeKey: key_id required');

  const rowRes = await runQuery(
    client
      .from(TABLE)
      .select('id, tenant_id, revoked_at')
      .eq('id', key_id)
      .maybeSingle(),
  );
  if (rowRes.error) {
    throw new Error(`revokeKey: select failed: ${rowRes.error.message || String(rowRes.error)}`);
  }
  if (!rowRes.data) throw new Error('key_not_found');
  if (rowRes.data.tenant_id !== tenant_id) throw new Error('cross_tenant_forbidden');
  if (rowRes.data.revoked_at) {
    return { ok: true, revoked_at: rowRes.data.revoked_at };
  }

  const revoked_at = new Date().toISOString();
  let updateBuilder = client
    .from(TABLE)
    .update({ revoked_at })
    .eq('id', key_id)
    .eq('tenant_id', tenant_id);
  if (typeof updateBuilder.is === 'function') {
    updateBuilder = updateBuilder.is('revoked_at', null);
  }
  const updateRes = await runQuery(updateBuilder);
  if (updateRes.error) {
    throw new Error(`revokeKey: update failed: ${updateRes.error.message || String(updateRes.error)}`);
  }

  return { ok: true, revoked_at };
}

async function resolveKeyByHash(client, key_hash) {
  assertClient(client, 'resolveKeyByHash');
  if (!key_hash || typeof key_hash !== 'string') return null;

  const res = await runQuery(
    client
      .from(TABLE)
      .select('id, tenant_id, org_id, key_hash, label, scopes, created_by_user_id, last_used_at, revoked_at')
      .eq('key_hash', key_hash)
      .maybeSingle(),
  );
  if (res.error) {
    throw new Error(`resolveKeyByHash: select failed: ${res.error.message || String(res.error)}`);
  }
  if (!res.data) return null;

  if (!res.data.revoked_at) {
    runQuery(
      client
        .from(TABLE)
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', res.data.id),
    ).catch(() => {});
  }

  const tenant = await resolveTenantContext(client, res.data.tenant_id);
  return {
    key_id: res.data.id,
    tenant_id: res.data.tenant_id,
    org_id: tenant.org_id || res.data.org_id || null,
    user_id: res.data.created_by_user_id || `mcp-key:${res.data.id}`,
    scopes: Array.isArray(res.data.scopes) ? res.data.scopes : [],
    revoked_at: res.data.revoked_at || null,
    key_hash: res.data.key_hash,
    plan_tier: tenant.plan_tier,
    tenant_status: tenant.tenant_status,
    billing_state: tenant.billing_state,
  };
}

module.exports = {
  TABLE,
  TOKEN_PREFIX,
  TOKEN_REGEX,
  TOKEN_BYTES,
  KEY_ID_PREFIX,
  FINGERPRINT_LENGTH,
  sha256Hex,
  base32LowerNoPad,
  isMcpApiKeyToken,
  inferPlanTier,
  resolveTenantContext,
  createKey,
  listKeys,
  revokeKey,
  resolveKeyByHash,
};
