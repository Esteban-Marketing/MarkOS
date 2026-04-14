'use strict';

const { getLiteracyContext } = require('../vector-store-client.cjs');
const { mergeReasoningRetrievalFilters } = require('../pageindex/retrieval-envelope.cjs');
const {
  createKnowledgeError,
  normalizeToken,
  normalizeClaims,
  assertReadOnlyOperation,
  assertTenantAccess,
  normalizeScopes,
  normalizeArtifactKind,
  isApprovedRecord,
  assertApprovedRecord,
} = require('./company-knowledge-policy.cjs');
const { buildMarkosKnowledgeUri, parseMarkosKnowledgeUri } = require('./markos-knowledge-uri.cjs');

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
}

function normalizeSnippet(text, maxLength = 160) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function compareResults(a, b) {
  const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
  if (scoreDiff !== 0) {
    return scoreDiff;
  }
  return String(a.title || '').localeCompare(String(b.title || ''));
}

function scoreRecord(record, query) {
  const normalizedQuery = normalizeToken(query).toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return Number(record.score || record.confidence || 1);
  }

  const haystack = [record.title, record.content, record.source_ref, record.implication]
    .map((value) => String(value || '').toLowerCase())
    .join('\n');

  const matchScore = tokens.reduce((count, token) => (haystack.includes(token) ? count + 1 : count), 0);
  return Number(record.score || 0) + matchScore;
}

function normalizeFixtureRecord(record, tenantId) {
  const artifactKind = normalizeArtifactKind(record.kind || record.artifact_kind || 'literacy');
  const artifactId = normalizeToken(record.artifact_id || record.evidence_pack_id || record.id || record.title || 'artifact');
  const recordTenantId = normalizeToken(record.tenant_id || tenantId) || tenantId;

  return {
    tenant_id: recordTenantId,
    artifact_kind: artifactKind,
    artifact_id: artifactId,
    title: normalizeToken(record.title) || `${artifactKind}:${artifactId}`,
    content: String(record.content || record.text || '').trim(),
    source_ref: normalizeToken(record.source_ref || record.citation || `${artifactKind}/${artifactId}`),
    updated_at: normalizeToken(record.updated_at || record.freshness || null) || null,
    approval_status: normalizeToken(record.approval_status || record.status || 'approved') || 'approved',
    score: Number(record.score || 0),
    confidence: Number(record.confidence || record.score || 0),
    implication: normalizeToken(record.implication || null) || null,
    artifact_uri: record.artifact_uri || buildMarkosKnowledgeUri({
      tenantId: recordTenantId,
      kind: artifactKind,
      artifactId,
      section: normalizeToken(record.section || null) || null,
    }),
  };
}

async function gatherLiteracyRecords({ query, filters, tenantId, topK }) {
  const discipline = toArray(filters && filters.discipline)[0] || 'Paid Media';
  const literacyResults = await getLiteracyContext(discipline, query || 'summary', {
    audience: toArray(filters && filters.audience)[0] || null,
    business_model: toArray(filters && filters.business_model)[0] || null,
    funnel_stage: toArray(filters && filters.funnel_stage)[0] || null,
    content_type: toArray(filters && filters.content_type)[0] || null,
    pain_point_tags: toArray(filters && filters.pain_point_tags),
    desired_outcome_tags: toArray(filters && filters.desired_outcome_tags),
    objection_tags: toArray(filters && filters.objection_tags),
    trust_driver_tags: toArray(filters && filters.trust_driver_tags),
    trust_blocker_tags: toArray(filters && filters.trust_blocker_tags),
    emotional_state_tags: toArray(filters && filters.emotional_state_tags),
    neuro_trigger_tags: toArray(filters && filters.neuro_trigger_tags),
    archetype_tags: toArray(filters && filters.archetype_tags),
    naturality_tags: toArray(filters && filters.naturality_tags),
    icp_segment_tags: toArray(filters && filters.icp_segment_tags),
    tenant_scope: tenantId,
  }, topK);

  return literacyResults.map((entry, index) => normalizeFixtureRecord({
    kind: 'literacy',
    artifact_id: entry.id || `literacy-${index + 1}`,
    title: entry.metadata && entry.metadata.source_ref ? entry.metadata.source_ref : `Literacy snippet ${index + 1}`,
    content: entry.text,
    source_ref: entry.metadata && entry.metadata.source_ref ? entry.metadata.source_ref : `Literacy/${discipline}`,
    updated_at: entry.metadata && entry.metadata.updated_at ? entry.metadata.updated_at : null,
    approval_status: 'approved',
    score: Number(entry.score || 0),
    confidence: Number(entry.score || 0),
    implication: 'Use approved internal guidance.',
  }, tenantId));
}

async function resolveCandidateRecords({ query, scopes, filters, tenantId, topK, fixtures }) {
  const candidateRecords = Array.isArray(fixtures && fixtures.records)
    ? fixtures.records.map((record) => normalizeFixtureRecord(record, tenantId))
    : [];

  if (candidateRecords.length === 0 && scopes.includes('literacy')) {
    const liveLiteracy = await gatherLiteracyRecords({ query, filters, tenantId, topK });
    candidateRecords.push(...liveLiteracy);
  }

  return candidateRecords
    .filter((record) => record.tenant_id === tenantId)
    .filter((record) => scopes.includes(record.artifact_kind));
}

function mapSearchResult(record, query) {
  return {
    artifact_uri: record.artifact_uri,
    artifact_kind: record.artifact_kind,
    title: record.title,
    snippet: normalizeSnippet(record.content),
    citation: record.source_ref,
    source_ref: record.source_ref,
    authority: 'approved_internal',
    updated_at: record.updated_at,
    freshness: record.updated_at,
    score: scoreRecord(record, query),
    confidence: record.confidence,
    implication: record.implication,
    resource_link: {
      uri: record.artifact_uri,
      mimeType: 'application/json',
    },
  };
}

function extractSectionContent(content, section) {
  const normalizedSection = normalizeToken(section);
  if (!normalizedSection) {
    return String(content || '');
  }

  const text = String(content || '');
  const lines = text.split(/\r?\n/);
  const headingPattern = new RegExp(`^#{1,6}\\s+${normalizedSection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
  const startIndex = lines.findIndex((line) => headingPattern.test(line));
  if (startIndex === -1) {
    return text;
  }

  const remainder = lines.slice(startIndex);
  const nextHeadingIndex = remainder.slice(1).findIndex((line) => /^#{1,6}\s+/.test(line));
  if (nextHeadingIndex === -1) {
    return remainder.join('\n').trim();
  }

  return remainder.slice(0, nextHeadingIndex + 1).join('\n').trim();
}

async function searchApprovedKnowledge({
  query,
  scopes,
  filters = {},
  claims = {},
  topK = 5,
  fixtures = null,
  reasoning = null,
  operation = 'search_markos_knowledge',
} = {}) {
  assertReadOnlyOperation(operation);
  const normalizedClaims = normalizeClaims(claims);
  const normalizedScopes = normalizeScopes(scopes);
  const mergedFilters = mergeReasoningRetrievalFilters({
    ...(filters && typeof filters === 'object' ? filters : {}),
    tenant_scope: normalizeToken(filters.tenant_scope || filters.tenantId || normalizedClaims.tenantId),
  }, reasoning);
  const tenantHint = normalizeToken(mergedFilters.tenant_scope || mergedFilters.tenantId || null) || normalizedClaims.tenantId;
  assertTenantAccess({ claims: normalizedClaims, tenantId: tenantHint, mode: 'reason' });

  const queryText = normalizeToken(query) || 'summary';
  const records = await resolveCandidateRecords({
    query: queryText,
    scopes: normalizedScopes,
    filters: mergedFilters,
    tenantId: normalizedClaims.tenantId,
    topK: Math.max(1, Number(topK) || 5),
    fixtures,
  });

  const results = records
    .filter((record) => isApprovedRecord(record))
    .map((record) => mapSearchResult(record, queryText))
    .sort(compareResults)
    .slice(0, Math.max(1, Number(topK) || 5));

  const warnings = [];
  const unsupportedScopes = normalizedScopes.filter((scope) => !records.some((record) => record.artifact_kind === scope));
  if (unsupportedScopes.length > 0 && (!fixtures || !Array.isArray(fixtures.records))) {
    warnings.push(`No approved ${unsupportedScopes.join(', ')} artifacts are currently available through the shared retrieval service.`);
  }

  return {
    operation: 'search_markos_knowledge',
    query: queryText,
    scopes: normalizedScopes,
    results,
    warnings,
    ...(reasoning && reasoning.winner
      ? {
          reasoning: {
            confidence: reasoning.winner.confidence || reasoning.confidence_flag || null,
            winner: {
              overlay_key: reasoning.winner.overlay_key || null,
              why_it_fits_summary: reasoning.winner.why_it_fits_summary || null,
            },
          },
        }
      : {}),
  };
}

async function fetchApprovedArtifact({
  uri,
  section = null,
  claims = {},
  fixtures = null,
  operation = 'fetch_markos_artifact',
} = {}) {
  assertReadOnlyOperation(operation);
  const normalizedClaims = normalizeClaims(claims);
  const parsed = parseMarkosKnowledgeUri(uri, { claims: normalizedClaims });

  const records = await resolveCandidateRecords({
    query: parsed.artifact_id,
    scopes: [parsed.kind],
    filters: { tenant_scope: parsed.tenant_id },
    tenantId: parsed.tenant_id,
    topK: 10,
    fixtures,
  });

  const match = records.find((record) => record.artifact_kind === parsed.kind && record.artifact_id === parsed.artifact_id);
  if (!match) {
    throw createKnowledgeError('E_KNOWLEDGE_ARTIFACT_NOT_FOUND', 'The requested approved artifact could not be found for this tenant.');
  }

  assertApprovedRecord(match);

  const requestedSection = normalizeToken(section) || parsed.section || null;
  const content = extractSectionContent(match.content, requestedSection);

  return {
    operation: 'fetch_markos_artifact',
    uri: parsed.uri,
    artifact: {
      artifact_uri: parsed.uri,
      artifact_kind: match.artifact_kind,
      artifact_id: match.artifact_id,
      title: match.title,
      section: requestedSection,
      content,
      citation: match.source_ref,
      source_ref: match.source_ref,
      authority: 'approved_internal',
      updated_at: match.updated_at,
      freshness: match.updated_at,
      confidence: match.confidence,
      implication: match.implication,
    },
    warnings: [],
  };
}

module.exports = {
  searchApprovedKnowledge,
  fetchApprovedArtifact,
};
