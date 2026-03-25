#!/usr/bin/env node
/**
 * chroma-client.cjs — ChromaDB HTTP Client (MGSD Vector Memory)
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Thin wrapper around the ChromaDB HTTP API for MGSD's vector memory layer.
 *   All ChromaDB interaction (health, storage, retrieval) routes through this file.
 *
 * HOST RESOLUTION:
 *   1. configure(host) call overrides the default host at boot time.
 *   2. Default host: http://localhost:8000
 *   3. If CHROMA_CLOUD_URL is set in .env, configure() is called with that value.
 *   4. If CHROMA_CLOUD_TOKEN is set, all requests include Authorization+x-chroma-token headers.
 *
 * COLLECTION NAMING:
 *   Every project gets its own isolated ChromaDB collection: `mgsd-{project_slug}`
 *   project_slug is read from .mgsd-project.json by server.cjs and passed into storeDraft().
 *
 * EXPORTS:
 *   configure(host)                        → void (set chromaHost)
 *   healthCheck()                          → Promise<{ ok, message }>
 *   storeDraft(slug, section, text)        → Promise<void>
 *   getDrafts(slug)                        → Promise<{section: text}>
 *   upsertSeed(slug, seed)                 → Promise<results[]>
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

function getClient() {
  if (!_client) {
    const opts = { path: chromaHost };
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

/**
 * Test connectivity to ChromaDB
 * Returns { ok: true } or { ok: false, error: string }
 */
async function healthCheck() {
  try {
    const client = getClient();
    await client.heartbeat();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Upsert all seed sections as separate named collections.
 * Each collection is keyed by: mgsd-{slug}-{section}
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
    const collectionName = `mgsd-${slug}-${section.name}`;
    const docText = JSON.stringify(section.data, null, 2);
    const docId   = `${slug}-${section.name}-v1`;

    try {
      // Get or create collection
      const collection = await client.getOrCreateCollection({ name: collectionName });

      // Upsert the document (overwrite if same id)
      await collection.upsert({
        ids:       [docId],
        documents: [docText],
        metadatas: [{ slug, section: section.name, generated: new Date().toISOString() }],
      });

      results.push({ section: section.name, status: 'ok', collection: collectionName });
    } catch (err) {
      results.push({ section: section.name, status: 'error', error: err.message });
    }
  }

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
  try {
    const client = getClient();
    const collectionName = `mgsd-${slug}-${section}`;
    const collection = await client.getCollection({ name: collectionName });
    const results = await collection.query({ queryTexts: [query], nResults });
    return results.documents[0] || [];
  } catch (err) {
    // Collection may not exist yet — return empty
    return [];
  }
}

/**
 * Store generated draft content in ChromaDB for future retrieval
 * @param {string} slug    — project slug
 * @param {string} section — e.g. 'company_profile_draft'
 * @param {string} content — markdown content to store
 */
async function storeDraft(slug, section, content) {
  try {
    const client = getClient();
    const collectionName = `mgsd-${slug}-drafts`;
    const collection = await client.getOrCreateCollection({ name: collectionName });
    await collection.upsert({
      ids:       [`${slug}-draft-${section}`],
      documents: [content],
      metadatas: [{ slug, section, stored_at: new Date().toISOString() }],
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
  const toDelete = allCollections.filter(c => c.name.startsWith(`mgsd-${slug}-`));
  for (const col of toDelete) {
    await client.deleteCollection({ name: col.name });
  }
  return { deleted: toDelete.map(c => c.name) };
}

module.exports = { configure, healthCheck, upsertSeed, getContext, storeDraft, clearProject };
