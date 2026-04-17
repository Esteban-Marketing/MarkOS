'use strict';

// Phase 201 Plan 08 Task 3: @vercel/edge-config slug→tenant cache.
// Fulfils T-201-05-06 (Plan 05 threat model) — eliminates DB hit on every middleware request.
// Stale window: SLUG_CACHE_TTL_SECONDS (60s) accepted tradeoff per RESEARCH.md Open Q #3 RESOLVED.
//
// Contracts:
//   readSlugFromEdge(slug, deps?)         → tenantId | null   (never throws; miss on error)
//   writeSlugToEdge(slug, tenantId, deps?) → void             (fail-soft; DB is source of truth)
//   invalidateSlug(slug, deps?)           → void              (fail-soft delete op)
//
// deps injection used by tests to avoid a real @vercel/edge-config install in node:test:
//   { edgeConfigGet?: async (key) => string | null, VERCEL_API_TOKEN?, EDGE_CONFIG_ID?, fetch? }

const SLUG_CACHE_TTL_SECONDS = 60;
const SLUG_CACHE_NAMESPACE = 'markos:slug:';

function keyFor(slug) {
  return `${SLUG_CACHE_NAMESPACE}${String(slug || '').trim().toLowerCase()}`;
}

async function loadEdgeConfigClient(deps) {
  if (deps && typeof deps.edgeConfigGet === 'function') return { get: deps.edgeConfigGet };
  try {
    const mod = require('@vercel/edge-config');
    return { get: mod.get };
  } catch {
    return { get: async () => null };
  }
}

async function readSlugFromEdge(slug, deps) {
  try {
    const client = await loadEdgeConfigClient(deps);
    const val = await client.get(keyFor(slug));
    return typeof val === 'string' && val.length > 0 ? val : null;
  } catch {
    return null;
  }
}

async function writeSlugToEdge(slug, tenantId, deps) {
  const token = (deps && deps.VERCEL_API_TOKEN) || process.env.VERCEL_API_TOKEN;
  const edgeConfigId = (deps && deps.EDGE_CONFIG_ID) || process.env.EDGE_CONFIG_ID;
  if (!token || !edgeConfigId) return;

  try {
    const fetchImpl = (deps && deps.fetch) || global.fetch;
    if (typeof fetchImpl !== 'function') return;
    await fetchImpl(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ operation: 'upsert', key: keyFor(slug), value: tenantId }],
      }),
    });
  } catch {
    // Fail soft — DB write is source of truth.
  }
}

async function invalidateSlug(slug, deps) {
  const token = (deps && deps.VERCEL_API_TOKEN) || process.env.VERCEL_API_TOKEN;
  const edgeConfigId = (deps && deps.EDGE_CONFIG_ID) || process.env.EDGE_CONFIG_ID;
  if (!token || !edgeConfigId) return;

  try {
    const fetchImpl = (deps && deps.fetch) || global.fetch;
    if (typeof fetchImpl !== 'function') return;
    await fetchImpl(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ operation: 'delete', key: keyFor(slug) }],
      }),
    });
  } catch {
    // Fail soft.
  }
}

module.exports = {
  SLUG_CACHE_TTL_SECONDS,
  SLUG_CACHE_NAMESPACE,
  readSlugFromEdge,
  writeSlugToEdge,
  invalidateSlug,
};
