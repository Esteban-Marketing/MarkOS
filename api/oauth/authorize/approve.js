'use strict';

// POST /oauth/authorize/approve — consent form submission → authorization_code redirect.
//
// Reads { state, target_tenant_id, csrf_token, client_id, redirect_uri, resource, scope,
//         code_challenge, code_challenge_method } from the browser, validates that the
// authenticated Phase-201 user belongs to target_tenant_id (D-07 tenant-bind-at-consent),
// resolves plan_tier via markos_orgs, then calls issueAuthorizationCode to stash the
// payload in Redis (60s TTL) and 302s back to redirect_uri?code=...&state=....
//
// For Wave 2 we accept the Phase-201 user via x-markos-user-id header; the real
// deployment route will be upgraded to consume markos_sess cookie directly when the
// gateway injects decoded claims (Phase 201 pattern mirrored from lib/markos/auth/session).

const { writeJson } = require('../../../lib/markos/crm/api.cjs');
const { issueAuthorizationCode, isAllowedRedirect } = require('../../../lib/markos/mcp/oauth.cjs');
const { listTenantsForUser } = require('../../../lib/markos/tenant/switcher.cjs');

async function readJson(req) {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  await new Promise((r) => req.on('end', r));
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return {};
  }
}

function readSessionUserId(req) {
  return (req.headers && req.headers['x-markos-user-id']) || null;
}

function getRedis(deps) {
  if (deps && deps.redis) return deps.redis;
  const { Redis } = require('@upstash/redis');
  return Redis.fromEnv();
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../lib/markos/auth/session.ts');
  return real();
}

async function handleApprove(req, res, deps = {}) {
  if (req.method !== 'POST') {
    return writeJson(res, 405, { error: 'method_not_allowed' });
  }

  const user_id = readSessionUserId(req);
  if (!user_id) return writeJson(res, 401, { error: 'unauthorized' });

  const body = await readJson(req);
  const {
    state,
    target_tenant_id,
    csrf_token,
    client_id,
    redirect_uri,
    resource,
    scope,
    code_challenge,
    code_challenge_method,
  } = body;

  if (
    !state ||
    !target_tenant_id ||
    !csrf_token ||
    !client_id ||
    !redirect_uri ||
    !resource ||
    !code_challenge
  ) {
    return writeJson(res, 400, {
      error: 'invalid_request',
      error_description: 'missing required field',
    });
  }
  if (code_challenge_method !== 'S256') {
    return writeJson(res, 400, { error: 'invalid_request', error_description: 'S256 only' });
  }
  if (!isAllowedRedirect(redirect_uri)) {
    return writeJson(res, 400, {
      error: 'invalid_request',
      error_description: 'redirect_uri not allowed',
    });
  }

  const supabase = getSupabase(deps);
  const redis = getRedis(deps);

  // D-07: target tenant MUST be in the authenticated user's membership set.
  // listTenantsForUser already filters purged tenants (Plan 201-07 contract).
  let orgs = [];
  try {
    orgs = await listTenantsForUser(supabase, user_id);
  } catch {
    orgs = [];
  }
  const allTenants = [];
  for (const org of orgs || []) {
    for (const t of org.tenants || []) {
      allTenants.push({ ...t, org_id: org.org_id });
    }
  }
  const picked = allTenants.find((t) => t.id === target_tenant_id);
  if (!picked) {
    return writeJson(res, 403, {
      error: 'invalid_tenant',
      error_description: 'tenant not in user set',
    });
  }

  // Re-guard offboarding/purged at server (belt-and-suspenders).
  if (picked.status && picked.status !== 'active') {
    return writeJson(res, 403, {
      error: 'invalid_tenant',
      error_description: 'tenant not active',
    });
  }

  // Resolve plan_tier from org (free | team | enterprise). Default free on missing.
  let plan_tier = 'free';
  try {
    const { data: org } = await supabase
      .from('markos_orgs')
      .select('plan_tier')
      .eq('id', picked.org_id)
      .maybeSingle();
    if (org && org.plan_tier) plan_tier = org.plan_tier;
  } catch {
    plan_tier = 'free';
  }

  const scopes = typeof scope === 'string' ? scope.split(' ').filter(Boolean) : [];

  const { code } = await issueAuthorizationCode(redis, {
    code_challenge,
    code_challenge_method: 'S256',
    user_id,
    tenant_id: picked.id,
    org_id: picked.org_id,
    client_id,
    redirect_uri,
    resource,
    scopes,
    plan_tier,
  });

  const sep = redirect_uri.includes('?') ? '&' : '?';
  const location = `${redirect_uri}${sep}code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

  res.statusCode = 302;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

module.exports = async function handler(req, res) {
  return handleApprove(req, res);
};
module.exports.handleApprove = handleApprove;
