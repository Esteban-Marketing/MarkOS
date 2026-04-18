'use strict';

// RFC 8414 §3 — OAuth 2.0 Authorization Server Metadata.
// Advertises the 4 OAuth endpoints (authorize / token / register / revoke) plus PKCE
// S256-only policy (D-05). Spec-compliant shape so MCP clients (Claude, VS Code, Cursor)
// can auto-discover and adapt without code changes when endpoints move.

const { writeJson } = require('../../lib/markos/crm/api.cjs');

function issuerBase() {
  return process.env.OAUTH_ISSUER_URL || 'https://markos.dev';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return writeJson(res, 405, { error: 'method_not_allowed' });
  }

  const base = issuerBase();
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return writeJson(res, 200, {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    registration_endpoint: `${base}/oauth/register`,
    revocation_endpoint: `${base}/oauth/revoke`,
    code_challenge_methods_supported: ['S256'],
    grant_types_supported: ['authorization_code'],
    response_types_supported: ['code'],
    scopes_supported: ['read', 'write', 'plan', 'audit', 'crm', 'tenancy'],
    token_endpoint_auth_methods_supported: ['none'],
  });
};
