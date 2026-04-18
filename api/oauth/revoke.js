'use strict';

// POST /oauth/revoke — RFC 7009 token revocation.
//
// Requires a Phase-201 session (actor_id) to prevent token-probing by anonymous callers.
// Always returns 200 regardless of whether the token was known (RFC 7009 §2.2 anti-probing)
// when the actor is authenticated — so a compromised attacker still cannot enumerate
// valid tokens via revoke responses.

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { hashToken, revokeSession } = require('../../lib/markos/mcp/sessions.cjs');

async function readBody(req) {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  await new Promise((r) => req.on('end', r));
  const body = Buffer.concat(chunks).toString('utf8');
  if (!body) return {};
  if (body.trim().startsWith('{')) {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  const out = {};
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

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../lib/markos/auth/session.ts');
  return real();
}

async function handleRevoke(req, res, deps = {}) {
  if (req.method !== 'POST') {
    return writeJson(res, 405, { error: 'method_not_allowed' });
  }

  const actor_id = (req.headers && req.headers['x-markos-user-id']) || null;
  if (!actor_id) return writeJson(res, 401, { error: 'unauthorized' });

  const body = await readBody(req);
  const { token } = body;
  if (!token) {
    return writeJson(res, 400, { error: 'invalid_request', error_description: 'token required' });
  }

  const supabase = getSupabase(deps);
  let session_row = null;
  try {
    const token_hash = hashToken(token);
    const { data } = await supabase
      .from('markos_mcp_sessions')
      .select('id')
      .eq('token_hash', token_hash)
      .maybeSingle();
    session_row = data || null;
  } catch {
    session_row = null;
  }

  // Always 200 (RFC 7009 §2.2) — never leak whether token was valid.
  if (!session_row) {
    res.setHeader('Cache-Control', 'no-store');
    return writeJson(res, 200, {});
  }

  try {
    await revokeSession(supabase, {
      session_id: session_row.id,
      actor_id,
      reason: 'client_revoked',
    });
  } catch {
    // Swallow — RFC 7009 requires 200 even on internal failures to prevent probing.
  }

  res.setHeader('Cache-Control', 'no-store');
  return writeJson(res, 200, {});
}

module.exports = async function handler(req, res) {
  return handleRevoke(req, res);
};
module.exports.handleRevoke = handleRevoke;
