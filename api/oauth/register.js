'use strict';

// RFC 7591 §3.1 — OAuth 2.0 Dynamic Client Registration (open, per MCP spec).
// Accepts { client_name, redirect_uris } and returns a public (token_endpoint_auth_method=none)
// client with grant_types=[authorization_code] + response_types=[code]. No authentication on
// the registration endpoint itself; clients are ephemeral records that MCP clients discover
// via /.well-known. PKCE is the real auth (D-05 + T-202-02-01).

const { writeJson } = require('../../lib/markos/crm/api.cjs');
const { generateDCRClient } = require('../../lib/markos/mcp/oauth.cjs');

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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return writeJson(res, 405, { error: 'method_not_allowed' });
  }

  const body = await readJson(req);
  try {
    const client = generateDCRClient({
      client_name: body.client_name,
      redirect_uris: body.redirect_uris,
    });
    res.setHeader('Cache-Control', 'no-store');
    return writeJson(res, 201, client);
  } catch (err) {
    const code = err && err.code ? err.code : 'invalid_client_metadata';
    return writeJson(res, 400, {
      error: code,
      error_description: (err && (err.reason || err.message)) || 'invalid',
    });
  }
};
