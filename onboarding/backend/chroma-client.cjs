#!/usr/bin/env node
/**
 * chroma-client.cjs — ChromaDB HTTP Client (MarkOS Vector Memory)
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Thin wrapper around the ChromaDB HTTP API for the MarkOS vector memory layer.
 *   All ChromaDB interaction (health, storage, retrieval) routes through this file.
 *
 * HOST RESOLUTION:
 *   1. configure(host) call overrides the default host at boot time.
 *   2. Default host: http://localhost:8000
 *   3. If CHROMA_CLOUD_URL is set in .env, configure() is called with that value.
 *   4. If CHROMA_CLOUD_TOKEN is set, all requests include Authorization+x-chroma-token headers.
 *
 * COLLECTION NAMING:
 *   MarkOS keeps the legacy `mgsd-{project_slug}` collection prefix during the
 *   v2.1 compatibility window. project_slug is still read from
 *   `.mgsd-project.json` and passed into the storage helpers below.
 *
 * EXPORTS:
 *   configure(host)                        → void (set chromaHost)
 *   healthCheck()                          → Promise<{ ok, message }>
 *   storeDraft(slug, section, text, meta)  → Promise<void>
 *   getDrafts(slug)                        → Promise<{section: text}>
 *   upsertSeed(slug, seed)                 → Promise<results[]>
 *   upsertProjectMeta(slug, meta)          → Promise<void>
 *
 * RELATED FILES:
 *   bin/ensure-chroma.cjs                  (starts/checks local daemon)
 *   onboarding/backend/server.cjs          (calls configure() at boot)
 *   onboarding/backend/agents/orchestrator.cjs (calls storeDraft after generation)
 *   .mgsd-project.json                     (source of project_slug)
 *   .protocol-lore/MEMORY.md              (vector memory architecture)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
'use strict';

const { ChromaClient } = require('chromadb');

let chromaHost = 'http://localhost:8000'; // Overridden by configure() at server boot
let _client = null;
const LEGACY_COLLECTION_PREFIX = 'mgsd';
const FUTURE_COLLECTION_PREFIX = 'markos';
let _bootReport = null;

function getCanonicalCollectionPrefix() {
  const prefix = (process.env.MARKOS_CHROMA_PREFIX || LEGACY_COLLECTION_PREFIX).trim().toLowerCase();
  return prefix || LEGACY_COLLECTION_PREFIX;
}

function getCollectionReadPrefixes() {
  return Array.from(new Set([
    getCanonicalCollectionPrefix(),
    LEGACY_COLLECTION_PREFIX,
    FUTURE_COLLECTION_PREFIX,
  ]));
}

function buildCollectionName(prefix, slug, suffix) {
  return `${prefix}-${slug}-${suffix}`;
}

function buildSectionCollectionName(slug, section) {
  return buildCollectionName(getCanonicalCollectionPrefix(), slug, section);
}

function buildMetaCollectionName(slug) {
  return buildCollectionName(getCanonicalCollectionPrefix(), slug, 'meta');
}

function buildDraftCollectionName(slug) {
  return buildCollectionName(getCanonicalCollectionPrefix(), slug, 'drafts');
}

function getSectionCollectionReadCandidates(slug, section) {
  return getCollectionReadPrefixes().map((prefix) => buildCollectionName(prefix, slug, section));
}

function getMetaCollectionReadCandidates(slug) {
  return getCollectionReadPrefixes().map((prefix) => buildCollectionName(prefix, slug, 'meta'));
}

function getDraftCollectionReadCandidates(slug) {
  return getCollectionReadPrefixes().map((prefix) => buildCollectionName(prefix, slug, 'drafts'));
}

function getClient() {
  if (!_client) {
    const opts = {};
    try {
      const parsed = new URL(chromaHost);
      opts.host = parsed.hostname;
      opts.port = parsed.port ? Number(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80);
      opts.ssl = parsed.protocol === 'https:';
    } catch (_) {
      // Backward compatibility for host-only values (e.g. "localhost", "mock").
      opts.host = chromaHost;
      opts.port = 8000;
      opts.ssl = false;
    }
    const cloudToken = process.env.CHROMA_CLOUD_TOKEN;
    if (cloudToken) {
      // Many hosted vector services accept Bearer token or x-chroma-token
      opts.fetchOptions = {
        headers: {
          'Authorization': `Bearer ${cloudToken}`,
          'x-chroma-token': cloudToken
        }
      };
    }
    _client = new ChromaClient(opts);
  }
  return _client;
}

/**
 * Configure the ChromaDB host (called from server.cjs with config values)
 */
function configure(host) {
  chromaHost = host || 'http://localhost:8000';
  _client = null; // reset so next getClient() uses new host
}

function setBootReport(report) {
  _bootReport = report || null;
}

function inferChromaMode() {
  try {
    const parsed = new URL(chromaHost);
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return 'local';
    }
    return 'cloud';
  } catch (_) {
    return chromaHost === 'localhost' ? 'local' : 'cloud';
  }
}

/**
 * Test connectivity to ChromaDB
 * Returns { ok: true } or { ok: false, error: string }
 */
async function healthCheck() {
  const mode = inferChromaMode();
  try {
    const client = getClient();
    await client.heartbeat();

    if (mode === 'cloud') {
      return {
        ok: true,
        mode,
        status: 'cloud_reachable',
        host: chromaHost,
        memory_state: 'enabled',
      };
    }

    return {
      ok: true,
      mode,
      status: _bootReport?.status === 'local_started' ? 'local_started' : 'local_available',
      host: chromaHost,
      memory_state: 'enabled',
      boot: _bootReport,
    };
  } catch (err) {
    if (mode === 'cloud') {
      return {
        ok: false,
        mode,
        status: 'cloud_unavailable',
        host: chromaHost,
        memory_state: 'degraded',
        error: err.message,
      };
    }

    if (_bootReport && _bootReport.status === 'local_boot_failed') {
      return {
        ok: false,
        mode,
        status: 'local_boot_failed',
        host: chromaHost,
        memory_state: 'degraded',
        error: _bootReport.error || err.message,
        boot: _bootReport,
      };
    }

    return {
      ok: false,
      mode,
      status: 'local_unavailable',
      host: chromaHost,
      memory_state: 'degraded',
      error: err.message,
      boot: _bootReport,
    };
  }
}

/**
 * Upsert all seed sections as separate named collections.
 * Each collection is keyed by the legacy compatibility prefix: mgsd-{slug}-{section}
 * @param {string} slug    — project/client slug (kebab-case)
 * @param {object} seed    — full onboarding-seed.json object
 */
async function upsertSeed(slug, seed) {
  const client = getClient();

  const sections = [
    { name: 'company',     data: seed.company     || {} },
    { name: 'product',     data: seed.product     || {} },
    { name: 'audience',    data: seed.audience    || {} },
    { name: 'competition', data: seed.competition || {} },
    { name: 'market',      data: seed.market      || {} },
    { name: 'content',     data: seed.content     || {} },
  ];

  const results = [];

  for (const section of sections) {
    const collectionName = buildSectionCollectionName(slug, section.name);
    const docText = JSON.stringify(section.data, null, 2);
    const docId   = `${slug}-${section.name}-v1`;

    // Attach business_model to every section's metadata for cross-client queries
    const meta = {
      slug,
      section: section.name,
      generated: new Date().toISOString(),
    };
    if (seed.company && seed.company.business_model) {
      meta.business_model = seed.company.business_model;
    }

    try {
      const collection = await client.getOrCreateCollection({ name: collectionName });
      await collection.upsert({
        ids:       [docId],
        documents: [docText],
        metadatas: [meta],
      });
      results.push({ section: section.name, status: 'ok', collection: collectionName });
    } catch (err) {
      results.push({ section: section.name, status: 'error', error: err.message });
    }
  }

  // Also write a top-level project-meta document for fast lookup by slug
  try {
    const metaCollection = await client.getOrCreateCollection({ name: buildMetaCollectionName(slug) });
    await metaCollection.upsert({
      ids:       [`${slug}-project-meta`],
      documents: [JSON.stringify({ slug, business_model: seed.company?.business_model || null })],
      metadatas: [{ slug, business_model: seed.company?.business_model || null, updated_at: new Date().toISOString() }],
    });
  } catch (_) { /* non-fatal */ }

  return results;
}

/**
 * Retrieve context for a project section from ChromaDB
 * @param {string} slug       — project slug
 * @param {string} section    — e.g. 'company', 'audience'
 * @param {string} query      — natural language query for similarity search
 * @param {number} nResults   — how many results to return
 */
async function getContext(slug, section, query = 'summary', nResults = 1) {
  const client = getClient();
  const candidates = getSectionCollectionReadCandidates(slug, section);

  for (const collectionName of candidates) {
    try {
      const collection = await client.getCollection({ name: collectionName });
      const results = await collection.query({ queryTexts: [query], nResults });
      return results.documents[0] || [];
    } catch (err) {
      // Continue to compatibility candidate.
    }
  }

  return [];
}

/**
 * Store generated draft content in ChromaDB for future retrieval
 * @param {string} slug    — project slug
 * @param {string} section — e.g. 'company_profile_draft'
 * @param {string} content — markdown content to store
 * @param {object} [meta]  — optional extra metadata (e.g. { business_model })
 */
async function storeDraft(slug, section, content, meta = {}) {
  try {
    const client = getClient();
    const collectionName = buildDraftCollectionName(slug);
    const collection = await client.getOrCreateCollection({ name: collectionName });
    await collection.upsert({
      ids:       [`${slug}-draft-${section}`],
      documents: [content],
      metadatas: [{ slug, section, stored_at: new Date().toISOString(), ...meta }],
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Remove all collections for a project (clean slate)
 */
async function clearProject(slug) {
  const client = getClient();
  const allCollections = await client.listCollections();
  const readPrefixes = getCollectionReadPrefixes();
  const toDelete = allCollections.filter((c) => {
    return readPrefixes.some((prefix) => c.name.startsWith(`${prefix}-${slug}-`));
  });
  for (const col of toDelete) {
    await client.deleteCollection({ name: col.name });
  }
  return { deleted: toDelete.map(c => c.name) };
}

module.exports = {
  configure,
  healthCheck,
  upsertSeed,
  getContext,
  storeDraft,
  clearProject,
  setBootReport,
  inferChromaMode,
  LEGACY_COLLECTION_PREFIX,
  FUTURE_COLLECTION_PREFIX,
  getCanonicalCollectionPrefix,
  getCollectionReadPrefixes,
  buildSectionCollectionName,
  buildMetaCollectionName,
  buildDraftCollectionName,
  getSectionCollectionReadCandidates,
  getMetaCollectionReadCandidates,
  getDraftCollectionReadCandidates,
};
