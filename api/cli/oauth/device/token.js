'use strict';

// Phase 204 Plan 02 Task 2:
// POST /api/cli/oauth/device/token — RFC 8628 §3.4 Device Access Token Request
//
// Public endpoint. Accepts application/x-www-form-urlencoded (RFC 6749 spec)
// with the three required fields:
//   grant_type   = urn:ietf:params:oauth:grant-type:device_code
//   device_code  = opaque code returned by /start
//   client_id    = markos-cli
//
// Also accepts application/json for CLI convenience (zero-dep implementation).
// Maps device-flow errors to RFC 8628 §3.5 HTTP status codes:
//   authorization_pending / slow_down / expired_token / access_denied → 400
//   invalid_grant (missing/bogus device_code OR one-shot replay)       → 400
//   200 on success with { access_token, token_type, tenant_id, key_fingerprint, scope }

const { writeJson } = require('../../../../lib/markos/crm/api.cjs');
const { pollToken } = require('../../../../lib/markos/cli/device-flow.cjs');

const DEVICE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code';

async function readRawBody(req) {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  const chunks = [];
  return new Promise((resolve) => {
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => resolve(''));
  });
}

function parseBody(raw, contentType) {
  const ct = (contentType || '').toLowerCase();
  if (ct.startsWith('application/json')) {
    try { return JSON.parse(raw || '{}'); } catch { return {}; }
  }
  // Default to urlencoded per RFC 6749 §4.2.
  const params = new URLSearchParams(raw || '');
  const out = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../lib/markos/auth/session.ts');
  return real();
}

async function handler(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const raw = await readRawBody(req);
  const body = parseBody(raw, req.headers && req.headers['content-type']);

  const grant_type = body.grant_type;
  const device_code = body.device_code;
  const client_id = body.client_id;

  if (grant_type !== DEVICE_GRANT_TYPE) {
    return writeJson(res, 400, { error: 'unsupported_grant_type', error_description: `grant_type must be ${DEVICE_GRANT_TYPE}` });
  }
  if (!device_code) {
    return writeJson(res, 400, { error: 'invalid_grant', error_description: 'device_code is required' });
  }
  if (client_id !== 'markos-cli') {
    return writeJson(res, 400, { error: 'invalid_client', error_description: 'client_id must be "markos-cli"' });
  }

  const supabase = getSupabase(deps);

  let result;
  try {
    result = await pollToken({ client: supabase, device_code, client_id });
  } catch (err) {
    const msg = err && err.message ? err.message : 'token_failed';
    return writeJson(res, 500, { error: 'token_failed', error_description: msg });
  }

  // Typed error → 400 per RFC 8628 §3.5 (all polling errors are client-side).
  if (result && result.error) {
    return writeJson(res, 400, { error: result.error });
  }

  // Success envelope.
  return writeJson(res, 200, {
    access_token: result.access_token,
    token_type: result.token_type || 'bearer',
    tenant_id: result.tenant_id,
    key_fingerprint: result.key_fingerprint,
    scope: result.scope || 'cli',
  });
}

module.exports = handler;
module.exports.handler = handler;
