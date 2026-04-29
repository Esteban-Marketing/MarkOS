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

// ---------------------------------------------------------------------------
// Phase 201.1 D-104 (closes H5): jittered TTL + transitional-rename helpers.
// ---------------------------------------------------------------------------

const SLUG_CACHE_TTL_BASE_SECONDS = 45;
const SLUG_CACHE_TTL_JITTER_SECONDS = 30;
const TRANSITIONAL_RENAME_TTL_SECONDS = 90;
const TRANSITIONAL_PREFIX = '__renamed:';

function computeJitteredTtl() {
  return SLUG_CACHE_TTL_BASE_SECONDS + Math.floor(Math.random() * (SLUG_CACHE_TTL_JITTER_SECONDS + 1));
}

/** Low-level writer that accepts an explicit ttlSeconds; used by jitter + transitional helpers. */
async function writeSlugToEdgeRaw(slug, value, ttlSeconds, deps) {
  const token = (deps && deps.VERCEL_API_TOKEN) || process.env.VERCEL_API_TOKEN;
  const edgeConfigId = (deps && deps.EDGE_CONFIG_ID) || process.env.EDGE_CONFIG_ID;
  if (!token || !edgeConfigId) return;
  try {
    const fetchImpl = (deps && deps.fetch) || global.fetch;
    if (typeof fetchImpl !== 'function') return;
    const item = { operation: 'upsert', key: keyFor(slug), value };
    if (typeof ttlSeconds === 'number' && ttlSeconds > 0) item.ttl = ttlSeconds;
    await fetchImpl(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: [item] }),
    });
  } catch {
    // Fail soft — DB write is source of truth.
  }
}

/** Writes a slug→tenantId entry with a per-write jittered TTL in [45, 75] seconds.
 *  Use this instead of writeSlugToEdge (fixed 60s) for stampede defense. */
async function writeSlugToEdgeJittered(slug, tenantId, deps) {
  const ttl = computeJitteredTtl();
  return writeSlugToEdgeRaw(slug, tenantId, ttl, deps);
}

/** Writes a transitional 410 pin at markos:slug:{oldSlug} = '__renamed:{newSlug}' for 90 s.
 *  Middleware sees the __renamed: prefix and returns HTTP 410 with Location + Sunset headers. */
async function writeTransitionalRename(oldSlug, newSlug, deps) {
  if (!oldSlug || !newSlug) return;
  return writeSlugToEdgeRaw(oldSlug, `${TRANSITIONAL_PREFIX}${newSlug}`, TRANSITIONAL_RENAME_TTL_SECONDS, deps);
}

module.exports = {
  SLUG_CACHE_TTL_SECONDS,
  SLUG_CACHE_NAMESPACE,
  SLUG_CACHE_TTL_BASE_SECONDS,
  SLUG_CACHE_TTL_JITTER_SECONDS,
  TRANSITIONAL_RENAME_TTL_SECONDS,
  TRANSITIONAL_PREFIX,
  readSlugFromEdge,
  writeSlugToEdge,
  invalidateSlug,
  computeJitteredTtl,
  writeSlugToEdgeJittered,
  writeTransitionalRename,
};
