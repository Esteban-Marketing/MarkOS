'use strict';

// Phase 202 Plan 08 — MCP Resource: literacy library, tenant-scoped.
// URI: mcp://markos/literacy/{tenant}
// Returns pack.archetypes + pack.literacy via pack-loader. Cross-tenant URI rejected.

const uriTemplate = 'mcp://markos/literacy/{tenant}';
const URI_RE = /^mcp:\/\/markos\/literacy\/([^/]+)$/;

function parseUri(uri) {
  if (typeof uri !== 'string') return null;
  const m = URI_RE.exec(uri);
  return m ? { tenant: m[1] } : null;
}

async function loadPack(supabase, tenant_id, deps) {
  if (deps && typeof deps.loadPack === 'function') return deps.loadPack(supabase, tenant_id);
  try {
    const mod = require('../../packs/pack-loader.cjs');
    if (typeof mod.loadPackForTenant === 'function') {
      return await mod.loadPackForTenant(supabase, tenant_id);
    }
  } catch { /* swallow */ }
  return { archetypes: [], literacy: {} };
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
            archetypes: Array.isArray(pack && pack.archetypes) ? pack.archetypes : [],
            literacy: (pack && pack.literacy) || {},
          },
          null,
          2,
        ),
      },
    ],
  };
}

module.exports = { uriTemplate, parseUri, resolve };
