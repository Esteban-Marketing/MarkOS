'use strict';

// RFC 9728 §3 — OAuth 2.0 Protected Resource Metadata.
// Declares that /api/mcp is a protected resource whose tokens are issued by the
// MarkOS authorization server (advertised in /.well-known/oauth-authorization-server).

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
    resource: `${base}/api/mcp`,
    authorization_servers: [`${base}/.well-known/oauth-authorization-server`],
    bearer_methods_supported: ['header'],
    resource_documentation: `${base}/docs/oauth`,
  });
};
