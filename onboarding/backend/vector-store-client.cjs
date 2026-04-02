'use strict';

const crypto = require('crypto');

let runtimeConfig = {};
let _supabaseClient = null;
let _upstashIndex = null;
let _bootReport = null;

const LEGACY_NAMESPACE_PREFIX = 'markos';
const FUTURE_NAMESPACE_PREFIX = 'markos';
const STANDARDS_NAMESPACE_PREFIX = 'markos-standards';

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

function getUpstashUrl() {
  return runtimeConfig.upstash_vector_rest_url || process.env.UPSTASH_VECTOR_REST_URL || null;
}

function getUpstashToken() {
  return runtimeConfig.upstash_vector_rest_token || process.env.UPSTASH_VECTOR_REST_TOKEN || null;
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
  const url = getUpstashUrl();
  const token = getUpstashToken();
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
  const upstashConfigured = Boolean(getUpstashUrl() && getUpstashToken());

  const providers = {
    supabase: { configured: supabaseConfigured, ok: false },
    upstash_vector: { configured: upstashConfigured, ok: false },
  };

  if (!supabaseConfigured && !upstashConfigured) {
    return {
      ok: false,
      mode,
      status: 'providers_unconfigured',
      memory_state: 'degraded',
      providers,
      error: 'SUPABASE_* and UPSTASH_VECTOR_* variables are not configured.',
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
      }
    } catch (error) {
      providers.supabase.error = error.message;
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

  const allConfiguredOk = (!supabaseConfigured || providers.supabase.ok)
    && (!upstashConfigured || providers.upstash_vector.ok);

  return {
    ok: allConfiguredOk,
    mode,
    status: allConfiguredOk ? 'providers_ready' : 'providers_degraded',
    memory_state: allConfiguredOk ? 'enabled' : 'degraded',
    providers,
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

async function getContext(slug, section, query = 'summary', nResults = 1) {
  const index = getUpstashIndex();
  if (!index) return [];

  const candidates = getSectionCollectionReadCandidates(slug, section);

  for (const namespaceName of candidates) {
    try {
      const namespace = index.namespace(namespaceName);
      const matches = await namespace.query({
        data: query,
        topK: nResults,
        includeData: true,
        includeMetadata: true,
      });

      if (!Array.isArray(matches) || matches.length === 0) continue;

      const docs = matches
        .map((entry) => {
          if (typeof entry.data === 'string' && entry.data.trim()) return entry.data;
          if (entry.metadata && typeof entry.metadata.content === 'string') return entry.metadata.content;
          return null;
        })
        .filter(Boolean);

      if (docs.length > 0) {
        return docs;
      }
    } catch {
      // Try compatibility namespace candidate.
    }
  }

  return [];
}

async function getLiteracyContext(discipline, query = 'summary', filters = {}, topK = 5) {
  const index = getUpstashIndex();
  if (!index) return [];

  const namespaceName = buildStandardsNamespaceName(discipline);
  const namespace = index.namespace(namespaceName);
  const filter = buildLiteracyFilter(filters);

  try {
    const matches = await namespace.query({
      data: String(query || ''),
      topK: Math.max(1, Number(topK) || 5),
      includeData: true,
      includeMetadata: true,
      filter,
    });

    if (!Array.isArray(matches) || matches.length === 0) {
      return [];
    }

    return matches
      .map((entry) => ({
        id: entry && entry.id ? entry.id : null,
        text: typeof entry.data === 'string' ? entry.data : '',
        metadata: entry.metadata || {},
        score: typeof entry.score === 'number' ? entry.score : 0,
      }))
      .filter((entry) => entry.text.trim().length > 0);
  } catch {
    return [];
  }
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
  upsertLiteracyChunk,
  supersedeLiteracyDoc,
  buildLiteracyFilter,
};
