'use strict';

// Phase 202 Plan 01: MCP session lifecycle (D-06 opaque token + 24h rolling TTL; D-07 tenant-bound).
// Source of truth for createSession / lookupSession / touchSession / revokeSession.
// Dual-exports via sessions.ts (matches Phase 201 tenant/invites convention).

const { createHash, randomBytes, timingSafeEqual } = require('node:crypto');
const { enqueueAuditStaging } = require('../audit/writer.cjs');

const ROLLING_TTL_MS = 24 * 60 * 60 * 1000; // 24h per D-06
const TABLE = 'markos_mcp_sessions';

function hashToken(opaque) {
  if (typeof opaque !== 'string' || opaque.length < 32) {
    throw new Error('hashToken: opaque token must be >= 32-char hex string');
  }
  return createHash('sha256').update(opaque).digest('hex');
}

async function createSession(client, input) {
  const { user_id, tenant_id, org_id, client_id, scopes, plan_tier } = input || {};
  if (!user_id || !tenant_id || !org_id || !client_id) {
    throw new Error('createSession: user_id + tenant_id + org_id + client_id required');
  }

  // Reject sessions against missing / offboarding / purged tenants (D-07 + Pitfall 9 defense).
  const { data: tenant } = await client
    .from('markos_tenants')
    .select('status')
    .eq('id', tenant_id)
    .maybeSingle();
  if (!tenant) {
    const err = new Error('invalid_tenant');
    err.code = 'invalid_tenant';
    throw err;
  }
  if (tenant.status === 'offboarding' || tenant.status === 'purged') {
    const err = new Error('tenant_unavailable');
    err.code = 'tenant_unavailable';
    throw err;
  }

  const opaque_token = randomBytes(32).toString('hex');
  const token_hash = hashToken(opaque_token);
  const session_id = `mcp-sess-${randomBytes(8).toString('hex')}`;
  const now = new Date();
  const expires_at = new Date(now.getTime() + ROLLING_TTL_MS).toISOString();

  const { error } = await client.from(TABLE).insert({
    id: session_id,
    token_hash,
    user_id,
    tenant_id,
    org_id,
    client_id,
    scopes: Array.isArray(scopes) ? scopes : [],
    plan_tier: plan_tier || 'free',
    created_at: now.toISOString(),
    last_used_at: now.toISOString(),
    expires_at,
  });
  if (error) throw new Error(`createSession: insert failed: ${error.message}`);

  // Audit — best effort; never block session creation on audit failure.
  try {
    await enqueueAuditStaging(client, {
      tenant_id,
      org_id,
      source_domain: 'mcp',
      action: 'session.created',
      actor_id: user_id,
      actor_role: 'mcp-client',
      payload: { session_id, client_id, scopes: scopes || [] },
    });
  } catch (_e) {
    // Intentional: lifecycle audit is at-least-once; drain fills gaps.
  }

  return { session_id, opaque_token, expires_at };
}

async function lookupSession(client, bearer_token) {
  if (typeof bearer_token !== 'string' || bearer_token.length < 32) return null;
  const computedHash = hashToken(bearer_token);

  const { data, error } = await client
    .from(TABLE)
    .select('id, token_hash, user_id, tenant_id, org_id, client_id, scopes, plan_tier, created_at, last_used_at, expires_at, revoked_at')
    .eq('token_hash', computedHash)
    .is('revoked_at', null)
    .maybeSingle();
  if (error || !data) return null;

  // Defense-in-depth constant-time compare. token_hash lookup already matched via index,
  // but timingSafeEqual defeats any residual side-channel between hash compare phases (Pitfall 5).
  const a = Buffer.from(data.token_hash, 'hex');
  const b = Buffer.from(computedHash, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // Expired?
  if (new Date(data.expires_at).getTime() <= Date.now()) return null;

  // Never return token_hash or revoked_at back to callers.
  const { token_hash, revoked_at, ...safe } = data;
  void token_hash;
  void revoked_at;
  return safe;
}

async function touchSession(client, session_id) {
  if (!session_id) throw new Error('touchSession: session_id required');
  const now = new Date();
  const expires_at = new Date(now.getTime() + ROLLING_TTL_MS).toISOString();
  await client
    .from(TABLE)
    .update({ last_used_at: now.toISOString(), expires_at })
    .eq('id', session_id)
    .is('revoked_at', null);
}

async function revokeSession(client, input) {
  const { session_id, actor_id, reason } = input || {};
  if (!session_id || !actor_id) throw new Error('revokeSession: session_id + actor_id required');

  const { data: session } = await client
    .from(TABLE)
    .select('id, tenant_id, org_id, user_id')
    .eq('id', session_id)
    .maybeSingle();
  if (!session) {
    const err = new Error('session_not_found');
    err.code = 'session_not_found';
    throw err;
  }

  const now = new Date().toISOString();
  await client
    .from(TABLE)
    .update({ revoked_at: now, revoke_reason: reason || 'user_revoked' })
    .eq('id', session_id);

  try {
    await enqueueAuditStaging(client, {
      tenant_id: session.tenant_id,
      org_id: session.org_id,
      source_domain: 'mcp',
      action: 'session.revoked',
      actor_id,
      actor_role: 'user',
      payload: { session_id, reason: reason || 'user_revoked' },
    });
  } catch (_e) {
    // Intentional: lifecycle audit is at-least-once.
  }
}

async function listSessionsForTenant(client, tenant_id) {
  if (!tenant_id) throw new Error('listSessionsForTenant: tenant_id required');
  const { data } = await client
    .from(TABLE)
    .select('id, user_id, tenant_id, org_id, client_id, scopes, plan_tier, created_at, last_used_at, expires_at')
    .eq('tenant_id', tenant_id)
    .is('revoked_at', null)
    .order('last_used_at', { ascending: false });
  return Array.isArray(data) ? data : [];
}

async function listSessionsForUser(client, user_id) {
  if (!user_id) throw new Error('listSessionsForUser: user_id required');
  const { data } = await client
    .from(TABLE)
    .select('id, user_id, tenant_id, org_id, client_id, scopes, plan_tier, created_at, last_used_at, expires_at')
    .eq('user_id', user_id)
    .is('revoked_at', null)
    .order('last_used_at', { ascending: false });
  return Array.isArray(data) ? data : [];
}

module.exports = {
  ROLLING_TTL_MS,
  hashToken,
  createSession,
  lookupSession,
  touchSession,
  revokeSession,
  listSessionsForTenant,
  listSessionsForUser,
};
