'use strict';

// Phase 200.1 D-204: MCP bearer auth for tenant-minted `mks_<base32>` keys.
// Unknown/revoked key attempts emit best-effort `source_domain='mcp' action='auth.failed'`.

const crypto = require('node:crypto');
const { enqueueAuditStaging } = require('../audit/writer.cjs');
const { isMcpApiKeyToken, resolveKeyByHash, sha256Hex } = require('./api-keys.cjs');

function extractAuthorization(req) {
  const headers = req && req.headers ? req.headers : {};
  return headers.authorization || headers.Authorization || '';
}

function extractBearer(req) {
  const auth = extractAuthorization(req);
  if (typeof auth !== 'string') return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function emitAuthFailedSafe(client, input = {}) {
  if (!client || typeof client.from !== 'function') return;
  try {
    await enqueueAuditStaging(client, {
      tenant_id: String(input.tenant_id || 'unknown'),
      org_id: input.org_id || null,
      source_domain: 'mcp',
      action: 'auth.failed',
      actor_id: String(input.actor_id || 'unknown'),
      actor_role: String(input.actor_role || 'mcp-client'),
      payload: {
        reason: input.reason || 'unknown_or_revoked_key',
        token_prefix: input.token_prefix || null,
        key_hash_prefix: input.key_hash_prefix || null,
      },
    });
  } catch {
    // Auth failure is already terminal; audit is best-effort on this path.
  }
}

async function verifyBearer(req, client) {
  if (!client || typeof client.from !== 'function') {
    throw new Error('verifyBearer: supabase client required');
  }

  const bearer = typeof req === 'string' ? req : extractBearer(req);
  if (!bearer) return { ok: false, reason: 'missing_authorization' };
  if (!isMcpApiKeyToken(bearer)) return { ok: false, reason: 'malformed_bearer' };

  const key_hash = sha256Hex(bearer);
  const resolved = await resolveKeyByHash(client, key_hash);
  if (!resolved || resolved.revoked_at) {
    await emitAuthFailedSafe(client, {
      tenant_id: resolved ? resolved.tenant_id : 'unknown',
      org_id: resolved ? resolved.org_id : null,
      actor_id: resolved ? resolved.user_id : 'unknown',
      actor_role: 'mcp-client',
      reason: 'unknown_or_revoked_key',
      token_prefix: bearer.slice(0, 10),
      key_hash_prefix: key_hash.slice(0, 8),
    });
    return { ok: false, reason: 'unknown_or_revoked_key' };
  }

  const stored = Buffer.from(String(resolved.key_hash || ''), 'hex');
  const supplied = Buffer.from(key_hash, 'hex');
  if (stored.length !== supplied.length || !crypto.timingSafeEqual(stored, supplied)) {
    await emitAuthFailedSafe(client, {
      tenant_id: resolved.tenant_id,
      org_id: resolved.org_id,
      actor_id: resolved.user_id,
      actor_role: 'mcp-client',
      reason: 'unknown_or_revoked_key',
      token_prefix: bearer.slice(0, 10),
      key_hash_prefix: key_hash.slice(0, 8),
    });
    return { ok: false, reason: 'unknown_or_revoked_key' };
  }

  return {
    ok: true,
    auth_type: 'api_key',
    id: `mcp-key:${resolved.key_id}`,
    key_id: resolved.key_id,
    tenant_id: resolved.tenant_id,
    org_id: resolved.org_id || null,
    user_id: resolved.user_id,
    scopes: resolved.scopes,
    plan_tier: resolved.plan_tier || 'free',
    actor_role: 'mcp-api-key',
  };
}

module.exports = {
  extractBearer,
  verifyBearer,
};
