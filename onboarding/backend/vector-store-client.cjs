'use strict';

const crypto = require('crypto');
const { createPageIndexAdapter } = require('./pageindex/pageindex-client.cjs');

let runtimeConfig = {};
let _supabaseClient = null;
let _upstashIndex = null;
let _bootReport = null;

const LEGACY_NAMESPACE_PREFIX = 'markos';
const FUTURE_NAMESPACE_PREFIX = 'markos';
const STANDARDS_NAMESPACE_PREFIX = 'markos-standards';
const DEFAULT_COVERAGE_DISCIPLINES = Object.freeze([
  'Paid_Media',
  'Content_SEO',
  'Lifecycle_Email',
  'Social',
  'Landing_Pages',
]);

function slugifyDiscipline(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function escapeFilterValue(value) {
  return String(value || '').replace(/'/g, "\\'");
}

function buildStandardsNamespaceName(discipline) {
  const normalized = slugifyDiscipline(discipline);
  if (!normalized) {
    throw new Error('DISCIPLINE_REQUIRED');
  }
  return `${STANDARDS_NAMESPACE_PREFIX}-${normalized}`;
}

function buildLiteracyFilter(filters = {}) {
  const parts = ["status = 'canonical'"];

  if (filters.business_model) {
    parts.push(`business_model CONTAINS '${escapeFilterValue(filters.business_model)}'`);
  }

  if (filters.funnel_stage) {
    parts.push(`funnel_stage = '${escapeFilterValue(filters.funnel_stage)}'`);
  }

  if (filters.content_type) {
    parts.push(`content_type = '${escapeFilterValue(filters.content_type)}'`);
  }

  if (filters.pain_point_tag) {
    parts.push(`pain_point_tags CONTAINS '${escapeFilterValue(filters.pain_point_tag)}'`);
  }

  if (Array.isArray(filters.pain_point_tags) && filters.pain_point_tags.length > 0) {
    const tagClauses = filters.pain_point_tags
      .map((tag) => String(tag || '').trim())
      .filter(Boolean)
      .map((tag) => `pain_point_tags CONTAINS '${escapeFilterValue(tag)}'`);

    if (tagClauses.length > 0) {
      parts.push(`(${tagClauses.join(' OR ')})`);
    }
  }

  return parts.join(' AND ');
}

function normalizeFilterList(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((entry) => String(entry || '').trim()).filter(Boolean))).sort();
  }

  const single = String(value || '').trim();
  return single ? [single] : [];
}

function getCanonicalCollectionPrefix() {
  const prefix = (process.env.MARKOS_VECTOR_PREFIX || LEGACY_NAMESPACE_PREFIX).trim().toLowerCase();
  return prefix || LEGACY_NAMESPACE_PREFIX;
}

function getCollectionReadPrefixes() {
  const canonical = getCanonicalCollectionPrefix();
  const prefixes = [canonical, LEGACY_NAMESPACE_PREFIX];
  if (FUTURE_NAMESPACE_PREFIX && FUTURE_NAMESPACE_PREFIX !== LEGACY_NAMESPACE_PREFIX) {
    prefixes.push(FUTURE_NAMESPACE_PREFIX);
  }
  return prefixes;
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

function buildMarkosdbCollectionName(slug) {
  return buildCollectionName(getCanonicalCollectionPrefix(), slug, 'markosdb');
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

function getCampaignCollectionReadCandidates(slug) {
  return getCollectionReadPrefixes().map((prefix) => buildCollectionName(prefix, slug, 'campaign-results'));
}

function getSupabaseUrl() {
  return runtimeConfig.supabase_url || process.env.SUPABASE_URL || null;
}

function getSupabaseKey() {
  return runtimeConfig.supabase_service_role_key
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || null;
}

function getLegacyUpstashUrl() {
  return runtimeConfig.upstash_vector_rest_url || process.env.UPSTASH_VECTOR_REST_URL || null;
}

function getLegacyUpstashToken() {
  return runtimeConfig.upstash_vector_rest_token || process.env.UPSTASH_VECTOR_REST_TOKEN || null;
}

function hasLegacyUpstashConfig() {
  return Boolean(getLegacyUpstashUrl() && getLegacyUpstashToken());
}

function getSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) return null;

  if (!_supabaseClient) {
    const { createClient } = require('@supabase/supabase-js');
    _supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return _supabaseClient;
}

function getUpstashIndex() {
  const url = getLegacyUpstashUrl();
  const token = getLegacyUpstashToken();
  if (!url || !token) return null;

  if (!_upstashIndex) {
    const { Index } = require('@upstash/vector');
    _upstashIndex = new Index({ url, token });
  }

  return _upstashIndex;
}

function inferStorageMode() {
  return 'cloud';
}

function configure(config = {}) {
  runtimeConfig = typeof config === 'object' && config !== null ? { ...config } : {};
  _supabaseClient = null;
  _upstashIndex = null;
}

function setBootReport(report) {
  _bootReport = report || null;
}

async function healthCheck() {
  const mode = inferStorageMode();
  const supabaseConfigured = Boolean(getSupabaseUrl() && getSupabaseKey());
  const upstashConfigured = hasLegacyUpstashConfig();

  const providers = {
    supabase: { configured: supabaseConfigured, ok: false, role: 'active_retrieval' },
    pageindex: {
      configured: supabaseConfigured,
      ok: false,
      role: 'active_retrieval_contract',
      mode: 'supabase_rls_scoped_query',
    },
    upstash_vector: { configured: upstashConfigured, ok: false, role: 'legacy_optional' },
  };

  if (!supabaseConfigured) {
    return {
      ok: false,
      mode,
      status: upstashConfigured ? 'providers_degraded' : 'providers_unconfigured',
      memory_state: 'degraded',
      providers,
      error: 'SUPABASE_* variables are required for active PageIndex retrieval.',
      boot: _bootReport,
    };
  }

  if (supabaseConfigured) {
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('markos_projects')
        .select('project_slug', { head: true, count: 'exact' })
        .limit(1);

      if (error) {
        providers.supabase.error = error.message;
      } else {
        providers.supabase.ok = true;
        providers.pageindex.ok = true;
      }
    } catch (error) {
      providers.supabase.error = error.message;
      providers.pageindex.error = error.message;
    }
  }

  if (upstashConfigured) {
    try {
      const index = getUpstashIndex();
      const namespace = index.namespace('__health__');
      await namespace.query({ data: 'health', topK: 1 });
      providers.upstash_vector.ok = true;
    } catch (error) {
      providers.upstash_vector.error = error.message;
    }
  }

  const activeReady = providers.supabase.ok && providers.pageindex.ok;
  const upstashFailed = upstashConfigured && !providers.upstash_vector.ok;
  const overallOk = activeReady && !upstashFailed;

  return {
    ok: overallOk,
    mode,
    status: overallOk ? 'providers_ready' : 'providers_degraded',
    memory_state: activeReady ? 'enabled' : 'degraded',
    providers,
    warning: upstashFailed
      ? 'Upstash provider is configured but not reachable.'
      : null,
    boot: _bootReport,
  };
}

async function buildProvisioningHealthSnapshot(overrides = {}) {
  const previousConfig = { ...runtimeConfig };
  configure({ ...runtimeConfig, ...overrides });
  try {
    return await healthCheck();
  } finally {
    configure(previousConfig);
  }
}

function createChecksum(content) {
  return crypto.createHash('sha256').update(String(content || ''), 'utf8').digest('hex');
}

async function upsertRelationalArtifact(slug, section, content, artifactType = 'draft_document') {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: 'SUPABASE_UNCONFIGURED' };

  const sourcePath = `drafts/${section}.md`;
  const checksum = createChecksum(content);
  const artifactId = `${slug}:${sourcePath}`;

  const payload = {
    artifact_id: artifactId,
    project_slug: slug,
    artifact_type: artifactType,
    source_path: sourcePath,
    checksum_sha256: checksum,
    content_length: Buffer.byteLength(String(content || ''), 'utf8'),
    updated_at: new Date().toISOString(),
  };

  const { error } = await client
    .from('markos_artifacts')
    .upsert(payload, { onConflict: 'artifact_id' });

  if (error) return { ok: false, error: error.message };
  return { ok: true, artifact_id: artifactId };
}

async function upsertVectorDocument(namespaceName, id, content, metadata = {}) {
  const index = getUpstashIndex();
  if (!index) return { ok: false, error: 'UPSTASH_UNCONFIGURED' };

  const namespace = index.namespace(namespaceName);
  await namespace.upsert({
    id,
    data: String(content || ''),
    metadata,
  });

  return { ok: true, namespace: namespaceName, id };
}

async function upsertSeed(slug, seed) {
  const sections = [
    { name: 'company', data: seed.company || {} },
    { name: 'product', data: seed.product || {} },
    { name: 'audience', data: seed.audience || {} },
    { name: 'competition', data: seed.competition || {} },
    { name: 'market', data: seed.market || {} },
    { name: 'content', data: seed.content || {} },
  ];

  const results = [];

  for (const section of sections) {
    const docText = JSON.stringify(section.data, null, 2);
    const id = `${slug}-${section.name}-seed-v1`;
    const metadata = {
      slug,
      section: section.name,
      generated: new Date().toISOString(),
      type: 'seed_section',
      business_model: seed.company?.business_model || null,
    };

    const relational = await upsertRelationalArtifact(slug, `seed-${section.name}`, docText, 'seed_section');
    let vectorResult = { ok: false, error: 'UPSTASH_UNCONFIGURED' };

    try {
      vectorResult = await upsertVectorDocument(buildSectionCollectionName(slug, section.name), id, docText, metadata);
    } catch (error) {
      vectorResult = { ok: false, error: error.message };
    }

    results.push({
      section: section.name,
      status: relational.ok || vectorResult.ok ? 'ok' : 'error',
      relational,
      vector: vectorResult,
    });
  }

  return results;
}

async function _upstashContextFallback(slug, section, query, nResults) {
  const index = getUpstashIndex();
  if (!index) return [];
  const candidates = getSectionCollectionReadCandidates(
    String(slug || '').trim(),
    String(section || '').trim()
  );
  for (const ns of candidates) {
    try {
      const results = await index.namespace(ns).query({
        data: String(query || 'summary'),
        topK: Math.max(1, Number(nResults) || 1),
      });
      if (Array.isArray(results) && results.length > 0) {
        return results
          .slice(0, Math.max(1, Number(nResults) || 1))
          .map((r) => String(r.data || ''));
      }
    } catch {
      // try next candidate
    }
  }
  return [];
}

async function getContext(slug, section, query = 'summary', nResults = 1) {
  const client = getSupabaseClient();
  if (!client) {
    return _upstashContextFallback(slug, section, query, nResults);
  }

  const normalizedSlug = String(slug || '').trim();
  const normalizedSection = String(section || '').trim();
  if (!normalizedSlug || !normalizedSection) {
    return [];
  }

  const sourcePath = `drafts/seed-${normalizedSection}.md`;
  const { data, error } = await client
    .from('markos_artifacts')
    .select('artifact_id, source_path')
    .eq('project_slug', normalizedSlug)
    .ilike('source_path', `%${normalizedSection}%`)
    .order('updated_at', { ascending: false })
    .limit(Math.max(1, Number(nResults) || 1));

  if (error || !Array.isArray(data)) {
    return [];
  }

  const queryToken = String(query || '').trim().toLowerCase();
  const prioritized = data
    .map((row) => ({
      text: `${row.source_path || sourcePath} (${row.artifact_id || 'artifact'})`,
      score: queryToken && String(row.source_path || '').toLowerCase().includes(queryToken) ? 1 : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Number(nResults) || 1));

  return prioritized.map((entry) => entry.text);
}

async function _upstashLiteracyContextFallback(discipline, query, filters, topK) {
  const index = getUpstashIndex();
  if (!index) return [];
  const normalizedDiscipline = String(discipline || '').trim();
  if (!normalizedDiscipline) return [];
  const namespaceName = buildStandardsNamespaceName(normalizedDiscipline);
  const filter = buildLiteracyFilter(filters);
  try {
    const results = await index.namespace(namespaceName).query({
      data: String(query || 'summary'),
      topK: Math.max(1, Number(topK) || 5),
      filter,
    });
    return (Array.isArray(results) ? results : [])
      .map((r) => ({ text: String(r.data || ''), metadata: r.metadata || {}, score: r.score || 0 }))
      .filter((entry) => entry.text.trim().length > 0);
  } catch {
    return [];
  }
}

async function getLiteracyContext(discipline, query = 'summary', filters = {}, topK = 5) {
  const client = getSupabaseClient();
  if (!client) {
    return _upstashLiteracyContextFallback(discipline, query, filters, topK);
  }

  const normalizedDiscipline = String(discipline || '').trim();
  if (!normalizedDiscipline) return [];

  const disciplineCandidates = Array.from(new Set([
    normalizedDiscipline,
    normalizeDisciplineLabel(normalizedDiscipline),
    slugifyDiscipline(normalizedDiscipline),
  ].filter(Boolean)));

  const envelope = {
    mode: 'reason',
    discipline: normalizedDiscipline,
    audience: String(filters.audience || '').trim() || null,
    filters: {
      pain_point_tags: normalizeFilterList(filters.pain_point_tags || filters.pain_point_tag),
      business_model: normalizeFilterList(filters.business_model),
      funnel_stage: normalizeFilterList(filters.funnel_stage),
      content_type: normalizeFilterList(filters.content_type),
      tenant_scope: String(filters.tenant_scope || filters.tenantId || runtimeConfig.tenant_scope || 'global').trim(),
    },
    provenance_required: true,
  };

  const adapter = createPageIndexAdapter({
    resolveDocIds: async ({ envelope: normalizedEnvelope }) => {
      let resolverQuery = client
        .from('markos_literacy_chunks')
        .select('chunk_id, doc_id')
        .eq('status', 'canonical')
        .in('discipline', disciplineCandidates)
        .limit(Math.max(20, Number(topK) * 10 || 50));

      if (normalizedEnvelope.filters.business_model[0]) {
        resolverQuery = resolverQuery.contains('business_model', [normalizedEnvelope.filters.business_model[0]]);
      }
      if (normalizedEnvelope.filters.funnel_stage[0]) {
        resolverQuery = resolverQuery.eq('funnel_stage', normalizedEnvelope.filters.funnel_stage[0]);
      }
      if (normalizedEnvelope.filters.content_type[0]) {
        resolverQuery = resolverQuery.eq('content_type', normalizedEnvelope.filters.content_type[0]);
      }

      const { data, error } = await resolverQuery;
      if (error) {
        return [];
      }

      return Array.from(new Set((data || []).map((row) => String(row.chunk_id || row.doc_id || '').trim()).filter(Boolean)));
    },
    retrieveDocuments: async ({ envelope: normalizedEnvelope }) => {
      let retrievalQuery = client
        .from('markos_literacy_chunks')
        .select('chunk_id, doc_id, chunk_text, discipline, sub_discipline, business_model, funnel_stage, content_type, pain_point_tags, source_ref, version, updated_at')
        .eq('status', 'canonical')
        .in('discipline', disciplineCandidates)
        .limit(Math.max(1, Number(topK) || 5));

      if (normalizedEnvelope.filters.business_model[0]) {
        retrievalQuery = retrievalQuery.contains('business_model', [normalizedEnvelope.filters.business_model[0]]);
      }
      if (normalizedEnvelope.filters.funnel_stage[0]) {
        retrievalQuery = retrievalQuery.eq('funnel_stage', normalizedEnvelope.filters.funnel_stage[0]);
      }
      if (normalizedEnvelope.filters.content_type[0]) {
        retrievalQuery = retrievalQuery.eq('content_type', normalizedEnvelope.filters.content_type[0]);
      }
      if (normalizedEnvelope.filters.pain_point_tags.length > 0) {
        retrievalQuery = retrievalQuery.overlaps('pain_point_tags', normalizedEnvelope.filters.pain_point_tags);
      }

      const { data, error } = await retrievalQuery;
      if (error) {
        return [];
      }

      const queryTokens = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
      const rows = Array.isArray(data) ? data : [];
      const scored = rows.map((row) => {
        const text = String(row.chunk_text || '');
        const haystack = `${text}\n${row.source_ref || ''}`.toLowerCase();
        const scoreBase = queryTokens.length === 0
          ? 1
          : queryTokens.reduce((count, token) => (haystack.includes(token) ? count + 1 : count), 0);

        return {
          id: String(row.chunk_id || row.doc_id || ''),
          text,
          metadata: {
            discipline: row.discipline || null,
            sub_discipline: row.sub_discipline || null,
            business_model: Array.isArray(row.business_model) ? row.business_model : [],
            funnel_stage: row.funnel_stage || null,
            content_type: row.content_type || null,
            pain_point_tags: Array.isArray(row.pain_point_tags) ? row.pain_point_tags : [],
            tenant_scope: normalizedEnvelope.filters.tenant_scope,
            source_ref: row.source_ref || null,
            version: row.version || null,
            updated_at: row.updated_at || null,
          },
          score: scoreBase,
        };
      });

      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(1, Number(topK) || 5));
    },
  });

  try {
    const result = await adapter.retrieve({
      tenantId: envelope.filters.tenant_scope,
      envelope,
    });

    return Array.isArray(result.items)
      ? result.items.filter((entry) => entry.text.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function createEmptyCoverageBucket() {
  return {
    doc_count: 0,
    chunk_count: 0,
    last_updated: null,
    business_models: [],
  };
}

function normalizeDisciplineLabel(value) {
  const normalized = slugifyDiscipline(value);
  if (!normalized) return '';
  return normalized
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('_');
}

async function getLiteracyCoverageSummary() {
  const health = await healthCheck();
  const disciplines = Object.fromEntries(
    DEFAULT_COVERAGE_DISCIPLINES.map((name) => [name, createEmptyCoverageBucket()])
  );

  if (!health.ok) {
    return {
      ok: false,
      status: health.status || 'providers_unconfigured',
      disciplines,
      providers: health.providers || {},
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      status: 'providers_unconfigured',
      disciplines,
      providers: health.providers || {},
    };
  }

  const { data, error } = await client
    .from('markos_literacy_chunks')
    .select('discipline, doc_id, chunk_id, business_model, updated_at, last_validated, status')
    .eq('status', 'canonical');

  if (error) {
    return {
      ok: false,
      status: 'providers_degraded',
      disciplines,
      providers: health.providers || {},
      error: error.message,
    };
  }

  const docsByDiscipline = new Map();
  const modelsByDiscipline = new Map();

  for (const row of data || []) {
    const label = normalizeDisciplineLabel(row.discipline);
    if (!label) continue;

    if (!disciplines[label]) {
      disciplines[label] = createEmptyCoverageBucket();
    }

    disciplines[label].chunk_count += 1;

    const currentTimestamp = row.updated_at || row.last_validated || null;
    if (currentTimestamp && (!disciplines[label].last_updated || currentTimestamp > disciplines[label].last_updated)) {
      disciplines[label].last_updated = currentTimestamp;
    }

    if (!docsByDiscipline.has(label)) {
      docsByDiscipline.set(label, new Set());
    }
    docsByDiscipline.get(label).add(String(row.doc_id || row.chunk_id || ''));

    if (!modelsByDiscipline.has(label)) {
      modelsByDiscipline.set(label, new Set());
    }

    if (Array.isArray(row.business_model)) {
      for (const model of row.business_model) {
        const normalizedModel = String(model || '').trim();
        if (normalizedModel) {
          modelsByDiscipline.get(label).add(normalizedModel);
        }
      }
    }
  }

  for (const [discipline, bucket] of Object.entries(disciplines)) {
    bucket.doc_count = docsByDiscipline.has(discipline) ? docsByDiscipline.get(discipline).size : 0;
    bucket.business_models = modelsByDiscipline.has(discipline)
      ? [...modelsByDiscipline.get(discipline)].sort()
      : [];
  }

  return {
    ok: true,
    status: health.status || 'providers_ready',
    disciplines,
    providers: health.providers || {},
  };
}

async function upsertLiteracyChunk(chunk) {
  const client = getSupabaseClient();
  const index = getUpstashIndex();

  const chunkId = String(chunk && chunk.chunk_id ? chunk.chunk_id : '').trim();
  const discipline = String(chunk && chunk.discipline ? chunk.discipline : '').trim();
  const chunkText = String(chunk && chunk.chunk_text ? chunk.chunk_text : '').trim();

  if (!chunkId || !discipline || !chunkText) {
    return { ok: false, error: 'INVALID_LITERACY_CHUNK' };
  }

  const namespaceName = buildStandardsNamespaceName(discipline);
  const nowIso = new Date().toISOString();
  const metadata = {
    category: chunk.category || 'STANDARDS',
    discipline,
    sub_discipline: chunk.sub_discipline || null,
    business_model: Array.isArray(chunk.business_model) ? chunk.business_model : [],
    funnel_stage: chunk.funnel_stage || null,
    content_type: chunk.content_type || null,
    status: chunk.status || 'canonical',
    evidence_level: chunk.evidence_level || null,
    source_ref: chunk.source_ref || null,
    version: chunk.version || null,
    chunk_id: chunkId,
    doc_id: chunk.doc_id || null,
    checksum_sha256: chunk.checksum_sha256 || null,
    last_validated: chunk.last_validated || null,
    ttl_days: typeof chunk.ttl_days === 'number' ? chunk.ttl_days : 180,
    pain_point_tags: Array.isArray(chunk.pain_point_tags) ? chunk.pain_point_tags : [],
  };

  let relational = { ok: false, error: 'SUPABASE_UNCONFIGURED' };
  if (client) {
    const row = {
      chunk_id: chunkId,
      doc_id: chunk.doc_id || null,
      category: metadata.category,
      discipline,
      sub_discipline: metadata.sub_discipline,
      business_model: metadata.business_model,
      company_size: Array.isArray(chunk.company_size) ? chunk.company_size : [],
      industry_tags: Array.isArray(chunk.industry_tags) ? chunk.industry_tags : [],
      funnel_stage: metadata.funnel_stage,
      content_type: metadata.content_type,
      evidence_level: metadata.evidence_level,
      recency: chunk.recency || null,
      source_type: chunk.source_type || null,
      source_ref: metadata.source_ref,
      last_validated: metadata.last_validated,
      version: metadata.version,
      ttl_days: metadata.ttl_days,
      status: metadata.status,
      agent_use: Array.isArray(chunk.agent_use) ? chunk.agent_use : [],
      retrieval_keywords: Array.isArray(chunk.retrieval_keywords) ? chunk.retrieval_keywords : [],
      pain_point_tags: Array.isArray(chunk.pain_point_tags) ? chunk.pain_point_tags : [],
      chunk_text: chunkText,
      vector_namespace: namespaceName,
      checksum_sha256: metadata.checksum_sha256,
      conflict_note: chunk.conflict_note || null,
      updated_at: nowIso,
    };

    const { error } = await client
      .from('markos_literacy_chunks')
      .upsert(row, { onConflict: 'chunk_id' });

    relational = error ? { ok: false, error: error.message } : { ok: true, table: 'markos_literacy_chunks' };
  }

  let vector = { ok: false, error: 'UPSTASH_UNCONFIGURED' };
  if (index) {
    try {
      vector = await upsertVectorDocument(namespaceName, chunkId, chunkText, metadata);
    } catch (error) {
      vector = { ok: false, error: error.message };
    }
  }

  return {
    ok: relational.ok || vector.ok,
    relational,
    vector,
    namespace: namespaceName,
    chunk_id: chunkId,
  };
}

async function supersedeLiteracyDoc(docId) {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: 'SUPABASE_UNCONFIGURED' };
  if (!docId) return { ok: false, error: 'DOC_ID_REQUIRED' };

  const { error } = await client
    .from('markos_literacy_chunks')
    .update({ status: 'superseded', updated_at: new Date().toISOString() })
    .eq('doc_id', String(docId));

  if (error) return { ok: false, error: error.message };
  return { ok: true, doc_id: String(docId), status: 'superseded' };
}

async function storeDraft(slug, section, content, meta = {}) {
  const id = `${slug}-draft-${section}`;
  const metadata = {
    slug,
    section,
    type: 'draft',
    stored_at: new Date().toISOString(),
    ...meta,
  };

  const relational = await upsertRelationalArtifact(slug, section, content, 'draft_document');

  let vector = { ok: false, error: 'UPSTASH_UNCONFIGURED' };
  try {
    vector = await upsertVectorDocument(buildDraftCollectionName(slug), id, content, metadata);
  } catch (error) {
    vector = { ok: false, error: error.message };
  }

  return {
    ok: relational.ok || vector.ok,
    relational,
    vector,
    error: !relational.ok && !vector.ok
      ? [relational.error, vector.error].filter(Boolean).join('; ')
      : undefined,
  };
}

async function upsertMarkosdbArtifact(slug, artifact) {
  const client = getSupabaseClient();
  const upstash = getUpstashIndex();

  let relational = { ok: false, error: 'SUPABASE_UNCONFIGURED' };
  if (client) {
    const payload = {
      artifact_id: artifact.artifact_id,
      project_slug: slug,
      artifact_type: artifact.relational_record?.artifact_type || artifact.artifact_type || 'compatibility_artifact',
      source_path: artifact.source_path,
      checksum_sha256: artifact.checksum_sha256,
      content_length: Buffer.byteLength(String(artifact.content || ''), 'utf8'),
      schema_version: artifact.relational_record?.schema_version || null,
      updated_at: artifact.relational_record?.updated_at || new Date().toISOString(),
    };

    const { error } = await client
      .from('markos_artifacts')
      .upsert(payload, { onConflict: 'artifact_id' });

    relational = error ? { ok: false, error: error.message } : { ok: true, table: 'markos_artifacts' };
  }

  let vector = { ok: false, error: 'UPSTASH_UNCONFIGURED' };
  if (upstash) {
    try {
      vector = await upsertVectorDocument(
        buildMarkosdbCollectionName(slug),
        artifact.artifact_id,
        artifact.content || '',
        { slug, ...(artifact.vector_metadata || {}) }
      );
    } catch (error) {
      vector = { ok: false, error: error.message };
    }
  }

  if (!relational.ok && !vector.ok) {
    throw new Error([relational.error, vector.error].filter(Boolean).join('; '));
  }

  return {
    ok: true,
    namespace: buildMarkosdbCollectionName(slug),
    artifact_id: artifact.artifact_id,
    relational,
    vector,
  };
}

async function storeCampaignOutcome(slug, payload, meta = {}) {
  const recordedAt = new Date().toISOString();
  const outcomeId = `${slug}:campaign:${Date.now()}`;

  const client = getSupabaseClient();
  let relational = { ok: false, error: 'SUPABASE_UNCONFIGURED' };
  if (client) {
    const row = {
      outcome_id: outcomeId,
      project_slug: slug,
      discipline: meta.discipline || 'unknown',
      outcome_classification: meta.outcome_classification || 'UNKNOWN',
      metric: meta.metric || null,
      metric_value: meta.metric_value == null ? null : String(meta.metric_value),
      asset: meta.asset || null,
      notes: meta.notes || null,
      recorded_at: recordedAt,
    };

    const { error } = await client.from('markos_campaign_outcomes').upsert(row, { onConflict: 'outcome_id' });
    relational = error ? { ok: false, error: error.message } : { ok: true, table: 'markos_campaign_outcomes' };
  }

  let vector = { ok: false, error: 'UPSTASH_UNCONFIGURED' };
  try {
    vector = await upsertVectorDocument(
      buildCollectionName(getCanonicalCollectionPrefix(), slug, 'campaign-results'),
      outcomeId,
      JSON.stringify(payload || {}, null, 2),
      {
        slug,
        type: 'campaign_result',
        recorded_at: recordedAt,
        ...meta,
      }
    );
  } catch (error) {
    vector = { ok: false, error: error.message };
  }

  return {
    ok: relational.ok || vector.ok,
    relational,
    vector,
    outcome_id: outcomeId,
  };
}

async function getWinningCampaignPatterns(slug, discipline, limit = 3) {
  const index = getUpstashIndex();
  if (!index) return [];

  const candidates = getCampaignCollectionReadCandidates(slug);

  for (const namespaceName of candidates) {
    try {
      const namespace = index.namespace(namespaceName);
      const matches = await namespace.query({
        data: String(discipline || ''),
        topK: Math.max(limit * 3, limit),
        includeData: true,
        includeMetadata: true,
      });

      if (!Array.isArray(matches) || matches.length === 0) continue;

      return matches
        .filter((entry) => {
          const metadata = entry.metadata || {};
          const sameDiscipline = !discipline || metadata.discipline === discipline;
          return sameDiscipline && metadata.outcome_classification === 'SUCCESS';
        })
        .slice(0, limit)
        .map((entry) => ({
          document: entry.data || '',
          metadata: entry.metadata || {},
        }));
    } catch {
      // Try compatibility namespace candidate.
    }
  }

  return [];
}

async function clearProject(slug) {
  const client = getSupabaseClient();
  const results = { deleted: [], warnings: [] };

  if (client) {
    const artifactDelete = await client.from('markos_artifacts').delete().eq('project_slug', slug);
    if (artifactDelete.error) {
      results.warnings.push(`markos_artifacts: ${artifactDelete.error.message}`);
    } else {
      results.deleted.push('markos_artifacts');
    }

    const campaignDelete = await client.from('markos_campaign_outcomes').delete().eq('project_slug', slug);
    if (campaignDelete.error) {
      results.warnings.push(`markos_campaign_outcomes: ${campaignDelete.error.message}`);
    } else {
      results.deleted.push('markos_campaign_outcomes');
    }
  }

  if (!getUpstashIndex()) {
    results.warnings.push('UPSTASH_UNCONFIGURED');
  }

  return results;
}

module.exports = {
  buildProvisioningHealthSnapshot,
  configure,
  healthCheck,
  upsertSeed,
  getContext,
  storeDraft,
  clearProject,
  setBootReport,
  inferStorageMode,
  LEGACY_NAMESPACE_PREFIX,
  FUTURE_NAMESPACE_PREFIX,
  getCanonicalCollectionPrefix,
  getCollectionReadPrefixes,
  buildSectionCollectionName,
  buildMetaCollectionName,
  buildDraftCollectionName,
  buildMarkosdbCollectionName,
  getSectionCollectionReadCandidates,
  getMetaCollectionReadCandidates,
  getDraftCollectionReadCandidates,
  upsertMarkosdbArtifact,
  storeCampaignOutcome,
  getWinningCampaignPatterns,
  buildStandardsNamespaceName,
  getLiteracyContext,
  getLiteracyCoverageSummary,
  upsertLiteracyChunk,
  supersedeLiteracyDoc,
  buildLiteracyFilter,
};
