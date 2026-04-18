'use strict';

// GET /oauth/authorize — consent page bootstrap.
//
// Validates query params per MCP 2025-06-18 (RFC 6749 + 7636 + 8707), then either:
//   - 302 → /login?return_to=... when no Phase-201 session cookie
//   - 302 → /oauth/consent?... preserving full query string when authenticated
//
// The consent UI (app/(markos)/oauth/consent/page.tsx) reads params from its URL,
// fetches tenant list + CSRF, and POSTs to /oauth/authorize/approve. We re-validate
// params at the approve step so this redirect is a hint, not a security boundary.

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { isAllowedRedirect } = require('../../lib/markos/mcp/oauth.cjs');

function invalidRequest(res, description) {
  return writeJson(res, 400, { error: 'invalid_request', error_description: description });
}

function parseQuery(url) {
  const q = (typeof url === 'string' ? url.split('?')[1] : '') || '';
  const out = {};
  if (!q) return out;
  for (const part of q.split('&')) {
    if (!part) continue;
    const [k, v = ''] = part.split('=');
    try {
      out[decodeURIComponent(k)] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

function hasPhase201Session(req) {
  const c = (req.headers && req.headers.cookie) || '';
  return /(^|;\s*)markos_sess=/.test(c);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return writeJson(res, 405, { error: 'method_not_allowed' });
  }

  const q = parseQuery(req.url || '');
  const required = [
    'client_id',
    'redirect_uri',
    'response_type',
    'code_challenge',
    'code_challenge_method',
    'scope',
    'state',
    'resource',
  ];
  for (const k of required) {
    if (!q[k]) return invalidRequest(res, `missing ${k}`);
  }
  if (q.response_type !== 'code') return invalidRequest(res, 'response_type must be code');
  if (q.code_challenge_method !== 'S256') {
    return invalidRequest(res, 'code_challenge_method must be S256');
  }
  if (!isAllowedRedirect(q.redirect_uri)) {
    return invalidRequest(res, 'redirect_uri not allowed');
  }

  if (!hasPhase201Session(req)) {
    const returnTo = encodeURIComponent(req.url || '/oauth/authorize');
    res.statusCode = 302;
    res.setHeader('Location', `/login?return_to=${returnTo}`);
    res.setHeader('Cache-Control', 'no-store');
    res.end();
    return;
  }

  // Hand off to consent surface; client reads params from the URL and posts to /oauth/authorize/approve.
  const qs = (req.url || '').split('?')[1] || '';
  const forward = qs ? `/oauth/consent?${qs}` : '/oauth/consent';
  res.statusCode = 302;
  res.setHeader('Location', forward);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
};
