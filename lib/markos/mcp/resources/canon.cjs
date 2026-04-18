'use strict';

// Phase 202 Plan 08 — MCP Resource: brand canon, tenant-scoped.
// URI: mcp://markos/canon/{tenant}
// Resolves via pack-loader (D-25). Cross-tenant URI rejected with cross_tenant_blocked.

const uriTemplate = 'mcp://markos/canon/{tenant}';
const URI_RE = /^mcp:\/\/markos\/canon\/([^/]+)$/;

function parseUri(uri) {
  if (typeof uri !== 'string') return null;
  const m = URI_RE.exec(uri);
  return m ? { tenant: m[1] } : null;
}

async function loadPack(supabase, tenant_id, deps) {
  if (deps && typeof deps.loadPack === 'function') return deps.loadPack(supabase, tenant_id);
  // Fall back to the repo pack-loader when supabase/tenant resolve is unavailable at this layer.
  try {
    const mod = require('../../packs/pack-loader.cjs');
    if (typeof mod.loadPackForTenant === 'function') {
      return await mod.loadPackForTenant(supabase, tenant_id);
    }
  } catch { /* swallow — absence is not a resource-read failure */ }
  return { canon: [] };
}

async function resolve({ uri, session, supabase, deps }) {
  const parsed = parseUri(uri);
  if (!parsed) return { error: 'resource_not_found' };
  if (parsed.tenant !== session.tenant_id) {
    return {
      error: 'cross_tenant_blocked',
      expected: session.tenant_id,
      requested: parsed.tenant,
    };
  }
  const pack = await loadPack(supabase, session.tenant_id, deps);
  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id,
            canon: Array.isArray(pack && pack.canon) ? pack.canon : [],
          },
          null,
          2,
        ),
      },
    ],
  };
}

module.exports = { uriTemplate, parseUri, resolve };
