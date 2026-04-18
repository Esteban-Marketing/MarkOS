'use strict';

// POST /oauth/token — PKCE S256 exchange → opaque bearer token.
//
// Consumes the one-time authorization_code from Redis (GETDEL), verifies PKCE via
// timingSafeEqual, exact-matches client_id + redirect_uri + resource (RFC 8707), then
// delegates session creation to Plan 202-01's sessions.createSession. Returns the
// opaque token in the access_token field per OAuth 2.1 spec. No refresh tokens (D-06).
//
// All failure paths return 400 per OAuth spec; Cache-Control: no-store on success.

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { consumeAuthorizationCode, verifyPKCE } = require('../../lib/markos/mcp/oauth.cjs');
const { createSession } = require('../../lib/markos/mcp/sessions.cjs');

async function readForm(req) {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  await new Promise((r) => req.on('end', r));
  const body = Buffer.concat(chunks).toString('utf8');
  const out = {};
  if (!body) return out;
  for (const part of body.split('&')) {
    if (!part) continue;
    const [k, v = ''] = part.split('=');
    try {
      out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    } catch {
      out[k] = v;
    }
  }
  return out;
}

function getRedis(deps) {
  if (deps && deps.redis) return deps.redis;
  const { Redis } = require('@upstash/redis');
  return Redis.fromEnv();
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../lib/markos/auth/session.ts');
  return real();
}

async function handleToken(req, res, deps = {}) {
  if (req.method !== 'POST') {
    return writeJson(res, 405, { error: 'method_not_allowed' });
  }

  const form = await readForm(req);
  if (form.grant_type !== 'authorization_code') {
    return writeJson(res, 400, { error: 'unsupported_grant_type' });
  }

  const { code, code_verifier, client_id, redirect_uri, resource } = form;
  if (!code || !code_verifier || !client_id || !redirect_uri || !resource) {
    return writeJson(res, 400, {
      error: 'invalid_request',
      error_description: 'missing required field',
    });
  }

  const redis = getRedis(deps);
  const stored = await consumeAuthorizationCode(redis, code);
  if (!stored) return writeJson(res, 400, { error: 'invalid_grant' });

  if (!verifyPKCE(code_verifier, stored.code_challenge)) {
    return writeJson(res, 400, {
      error: 'invalid_grant',
      error_description: 'PKCE verifier mismatch',
    });
  }

  if (stored.client_id !== client_id) {
    return writeJson(res, 400, { error: 'invalid_client' });
  }
  if (stored.redirect_uri !== redirect_uri) {
    return writeJson(res, 400, { error: 'invalid_grant' });
  }
  // RFC 8707 §2.2 — resource MUST match the authorization request.
  if (stored.resource !== resource) {
    return writeJson(res, 400, { error: 'invalid_target' });
  }

  const supabase = getSupabase(deps);
  let session;
  try {
    session = await createSession(supabase, {
      user_id: stored.user_id,
      tenant_id: stored.tenant_id,
      org_id: stored.org_id,
      client_id: stored.client_id,
      scopes: stored.scopes,
      plan_tier: stored.plan_tier,
    });
  } catch (err) {
    const msg = (err && err.message) || 'session_create_failed';
    const code = (err && err.code) || 'server_error';
    return writeJson(res, 400, { error: 'invalid_grant', error_description: `${code}: ${msg}` });
  }

  res.setHeader('Cache-Control', 'no-store');
  return writeJson(res, 200, {
    access_token: session.opaque_token,
    token_type: 'Bearer',
    expires_in: 86400,
    scope: (stored.scopes || []).join(' '),
  });
}

module.exports = async function handler(req, res) {
  return handleToken(req, res);
};
module.exports.handleToken = handleToken;
