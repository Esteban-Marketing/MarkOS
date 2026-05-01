'use strict';

const crypto = require('node:crypto');

const { verifyBotIdToken } = require('../auth/botid.cjs');
const { enqueueAuditStaging } = require('../audit/writer.cjs');
const { recordCostEvent } = require('../mcp/cost-events.cjs');

const DEMO_TOKEN_TTL_SECONDS = 900;
const DEMO_COST_CAP_CENTS = 50;
const DEMO_ALLOWED_TOOLS = Object.freeze(['draft_message', 'audit_claim']);
const DEMO_AUDIENCE = 'demo-sandbox';
const DEMO_ISSUER = 'markos.dev';
const DEMO_SYNTHETIC_ORG_ID = 'org-demo-sandbox';
const DEMO_SYNTHETIC_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_SYNTHETIC_USER_ID = 'demo-anonymous';
const DEMO_SYNTHETIC_TENANT_SLUG = 'demo-sandbox';

const _memoryCostTotals = new Map();

function getSecret() {
  const value = process.env.MARKOS_DEMO_TOKEN_SECRET;
  if (!value || value.length < 32) {
    throw new Error('MARKOS_DEMO_TOKEN_SECRET missing or <32 chars');
  }
  return value;
}

function jsonBase64Url(value) {
  return Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
}

function parseBase64UrlJson(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function currentEpochSeconds() {
  return Math.floor(Date.now() / 1000);
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = jsonBase64Url(header);
  const encodedBody = jsonBase64Url(payload);
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function verifyJwt(token) {
  if (typeof token !== 'string') return { ok: false, reason: 'malformed' };

  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };

  const [encodedHeader, encodedBody, signature] = parts;

  let expected;
  try {
    expected = crypto
      .createHmac('sha256', getSecret())
      .update(`${encodedHeader}.${encodedBody}`)
      .digest('base64url');
  } catch {
    return { ok: false, reason: 'signature_invalid' };
  }

  const actualBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return { ok: false, reason: 'signature_invalid' };
  }

  let header;
  let claims;
  try {
    header = parseBase64UrlJson(encodedHeader);
    claims = parseBase64UrlJson(encodedBody);
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  if (!header || header.alg !== 'HS256' || header.typ !== 'JWT') {
    return { ok: false, reason: 'malformed' };
  }
  if (claims.aud !== DEMO_AUDIENCE || claims.iss !== DEMO_ISSUER) {
    return { ok: false, reason: 'aud_mismatch' };
  }
  if (typeof claims.exp !== 'number' || claims.exp <= currentEpochSeconds()) {
    return { ok: false, reason: 'token_expired' };
  }
  if (claims.synthetic_tenant_id !== DEMO_SYNTHETIC_TENANT_ID) {
    return { ok: false, reason: 'malformed' };
  }
  if (!Array.isArray(claims.allowed_tools)) {
    return { ok: false, reason: 'malformed' };
  }
  if (claims.allowed_tools.some((toolName) => !DEMO_ALLOWED_TOOLS.includes(toolName))) {
    return { ok: false, reason: 'tool_not_allowed' };
  }
  if (Number(claims.cost_cap_cents) > DEMO_COST_CAP_CENTS) {
    return { ok: false, reason: 'cost_cap_exceeded' };
  }

  return { ok: true, claims };
}

function buildClaims() {
  const iat = currentEpochSeconds();
  const exp = iat + DEMO_TOKEN_TTL_SECONDS;
  return {
    iss: DEMO_ISSUER,
    aud: DEMO_AUDIENCE,
    sub: `demo:${crypto.randomUUID()}`,
    iat,
    exp,
    allowed_tools: [...DEMO_ALLOWED_TOOLS],
    cost_cap_cents: DEMO_COST_CAP_CENTS,
    synthetic_tenant_id: DEMO_SYNTHETIC_TENANT_ID,
  };
}

function hashIpOrUa(value) {
  if (!value) return null;
  return sha256Hex(value).slice(0, 16);
}

async function ensureSyntheticIdentity(client, tokenSub) {
  if (!client || typeof client.from !== 'function') return;

  const now = new Date().toISOString();

  const { error: orgError } = await client.from('markos_orgs').upsert({
    id: DEMO_SYNTHETIC_ORG_ID,
    slug: DEMO_SYNTHETIC_TENANT_SLUG,
    name: 'Demo Sandbox',
    owner_user_id: DEMO_SYNTHETIC_USER_ID,
    seat_quota: 1,
    status: 'active',
    created_at: now,
    updated_at: now,
  });
  if (orgError) throw new Error(`demo synthetic org upsert failed: ${orgError.message}`);

  const { error: tenantError } = await client.from('markos_tenants').upsert({
    id: DEMO_SYNTHETIC_TENANT_ID,
    name: 'Demo Sandbox',
    workspace_id: null,
    org_id: DEMO_SYNTHETIC_ORG_ID,
    slug: DEMO_SYNTHETIC_TENANT_SLUG,
    status: 'active',
    created_at: now,
    updated_at: now,
  });
  if (tenantError) throw new Error(`demo synthetic tenant upsert failed: ${tenantError.message}`);

  const { error: sessionError } = await client.from('markos_mcp_sessions').upsert({
    id: tokenSub,
    token_hash: sha256Hex(`demo-session:${tokenSub}`),
    user_id: DEMO_SYNTHETIC_USER_ID,
    tenant_id: DEMO_SYNTHETIC_TENANT_ID,
    org_id: DEMO_SYNTHETIC_ORG_ID,
    client_id: 'demo-sandbox',
    scopes: [...DEMO_ALLOWED_TOOLS],
    plan_tier: 'free',
    created_at: now,
    last_used_at: now,
    expires_at: new Date(Date.now() + DEMO_TOKEN_TTL_SECONDS * 1000).toISOString(),
    revoked_at: null,
    revoke_reason: null,
  });
  if (sessionError) throw new Error(`demo synthetic session upsert failed: ${sessionError.message}`);
}

async function sumExistingCost(client, tokenSub, syntheticTenantId) {
  const { data, error } = await client
    .from('markos_mcp_cost_events')
    .select('cost_cents')
    .eq('tenant_id', syntheticTenantId)
    .eq('mcp_session_id', tokenSub);

  if (error) throw new Error(`demo cost read failed: ${error.message}`);
  return (data || []).reduce((sum, row) => sum + (Number(row.cost_cents) || 0), 0);
}

async function recordMemoryCost(tokenSub, costCents) {
  const previous = _memoryCostTotals.get(tokenSub) || 0;
  const total = previous + Math.max(0, Number(costCents) || 0);
  if (total > DEMO_COST_CAP_CENTS) {
    return { ok: false, reason: 'cost_cap_exceeded', total_cents: total };
  }
  _memoryCostTotals.set(tokenSub, total);
  return { ok: true, total_cents: total };
}

async function issueDemoSessionToken({ botid_token, ip, ua, supabaseClient } = {}) {
  const botid = await verifyBotIdToken(botid_token);
  if (!botid.ok) {
    return { ok: false, reason: 'botid_failed', detail: botid.reason };
  }

  const claims = buildClaims();
  const token = signJwt(claims);

  try {
    if (supabaseClient) {
      await enqueueAuditStaging(supabaseClient, {
        tenant_id: DEMO_SYNTHETIC_TENANT_ID,
        org_id: DEMO_SYNTHETIC_ORG_ID,
        source_domain: 'marketing',
        action: 'demo.session_started',
        actor_id: claims.sub,
        actor_role: 'anonymous',
        payload: {
          ip_hash: hashIpOrUa(ip),
          ua_hash: hashIpOrUa(ua),
          sub: claims.sub,
          exp: claims.exp,
        },
      });
    }
  } catch {
    // Audit is intentionally fail-soft here; BotID and token issue are the real gate.
  }

  return {
    ok: true,
    demo_session_token: token,
    expires_at: new Date(claims.exp * 1000).toISOString(),
    cost_cap_cents: DEMO_COST_CAP_CENTS,
    allowed_tools: [...DEMO_ALLOWED_TOOLS],
  };
}

function assertToolAllowed(claims, toolName) {
  if (!claims || !Array.isArray(claims.allowed_tools)) {
    return { ok: false, reason: 'malformed' };
  }
  if (!claims.allowed_tools.includes(toolName)) {
    return { ok: false, reason: 'tool_not_allowed', detail: toolName };
  }
  return { ok: true };
}

async function recordDemoCost(supabaseClient, tokenSub, syntheticTenantId, costCents, toolName = 'demo') {
  const normalizedCost = Math.max(0, Number(costCents) || 0);

  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    return recordMemoryCost(tokenSub, normalizedCost);
  }

  try {
    await ensureSyntheticIdentity(supabaseClient, tokenSub);
    const previous = await sumExistingCost(supabaseClient, tokenSub, syntheticTenantId);
    const total = previous + normalizedCost;
    if (total > DEMO_COST_CAP_CENTS) {
      return { ok: false, reason: 'cost_cap_exceeded', total_cents: total };
    }

    await recordCostEvent(supabaseClient, {
      tenant_id: syntheticTenantId,
      org_id: DEMO_SYNTHETIC_ORG_ID,
      mcp_session_id: tokenSub,
      tool_name: toolName,
      cost_cents: normalizedCost,
    });

    return { ok: true, total_cents: total };
  } catch (error) {
    return {
      ok: false,
      reason: 'db_error',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function _resetDemoCostTotalsForTests() {
  _memoryCostTotals.clear();
}

module.exports = {
  DEMO_TOKEN_TTL_SECONDS,
  DEMO_COST_CAP_CENTS,
  DEMO_ALLOWED_TOOLS,
  DEMO_AUDIENCE,
  DEMO_ISSUER,
  DEMO_SYNTHETIC_ORG_ID,
  DEMO_SYNTHETIC_TENANT_ID,
  DEMO_SYNTHETIC_USER_ID,
  issueDemoSessionToken,
  verifyDemoSessionToken: verifyJwt,
  assertToolAllowed,
  recordDemoCost,
  _resetDemoCostTotalsForTests,
};
