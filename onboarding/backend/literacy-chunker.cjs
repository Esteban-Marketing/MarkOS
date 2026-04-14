'use strict';

const { normalizeNeuroLiteracyMetadata } = require('./research/neuro-literacy-schema.cjs');

function parseSimpleYamlValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, ''))
      .filter(Boolean);
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseLiteracyFrontmatter(markdown) {
  const text = String(markdown || '');
  const blockMatch = text.match(/```yaml\s*([\s\S]*?)```/i);
  if (!blockMatch) return {};

  const body = blockMatch[1]
    .replace(/^\s*---\s*/m, '')
    .replace(/\s*---\s*$/m, '')
    .trim();

  const metadata = {};
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf(':');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    metadata[key] = parseSimpleYamlValue(value);
  }

  return {
    ...metadata,
    ...normalizeNeuroLiteracyMetadata(metadata),
  };
}

function toSectionSlug(title) {
  return String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function createLiteracyChunkId(docId, sectionSlug, index) {
  const safeDocId = String(docId || 'doc').trim() || 'doc';
  const safeSection = toSectionSlug(sectionSlug || 'section');
  const ordinal = String(Number(index) || 0).padStart(3, '0');
  return `${safeDocId}::${safeSection}::${ordinal}`;
}

function findSection(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`(?:^##\\s+${escaped}\\s*$\\r?\\n)([\\s\\S]*?)(?=\\r?\\n##\\s+|\\r?\\n#\\s+|$)`, 'im');
  const match = text.match(rx);
  return match ? match[1].trim() : '';
}

function chunkLiteracyFile(markdown, metadata = {}) {
  const text = String(markdown || '');
  const normalizedMetadata = {
    ...metadata,
    ...normalizeNeuroLiteracyMetadata(metadata),
  };
  const chunks = [];
  const docId = normalizedMetadata.doc_id || normalizedMetadata.artifact_id || normalizedMetadata.document_id || 'literacy-doc';

  const definitionMatch = text.match(/^#\s+(.+?)\s*$([\s\S]*?)(?=^##\s+)/m);
  if (definitionMatch) {
    chunks.push({ type: 'definition', title: definitionMatch[1].trim(), sectionSlug: 'definition', text: `${definitionMatch[1].trim()}\n\n${definitionMatch[2].trim()}`.trim() });
  }

  const evidence = findSection(text, 'EVIDENCE BASE');
  if (evidence) {
    chunks.push({ type: 'evidence', title: 'Evidence Base', sectionSlug: 'evidence-base', text: evidence });
  }

  const coreTactics = findSection(text, 'CORE TACTICS');
  if (coreTactics) {
    const tacticRegex = /^###\s+(.+?)\s*$([\s\S]*?)(?=^###\s+|\n##\s+|$)/gim;
    let match;
    while ((match = tacticRegex.exec(coreTactics)) !== null) {
      chunks.push({ type: 'tactic', title: match[1].trim(), sectionSlug: `tactic-${toSectionSlug(match[1])}`, text: match[2].trim() });
    }
  }

  const benchmarks = findSection(text, 'PERFORMANCE BENCHMARKS');
  if (benchmarks) {
    chunks.push({ type: 'benchmark', title: 'Performance Benchmarks', sectionSlug: 'performance-benchmarks', text: benchmarks });
  }

  const counter = findSection(text, 'COUNTER-INDICATORS');
  if (counter) {
    chunks.push({ type: 'counter-indicators', title: 'Counter Indicators', sectionSlug: 'counter-indicators', text: counter });
  }

  const vocabulary = findSection(text, 'VOCABULARY');
  if (vocabulary) {
    const lines = vocabulary.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (const line of lines) {
      const termMatch = line.match(/^-\s*\*\*(.+?)\*\*\s*:?\s*(.*)$/);
      if (!termMatch) continue;
      chunks.push({ type: 'vocabulary', title: termMatch[1].trim(), sectionSlug: `vocab-${toSectionSlug(termMatch[1])}`, text: termMatch[2].trim() || termMatch[1].trim() });
    }
  }

  return chunks.map((chunk, index) => ({
    chunk_id: createLiteracyChunkId(docId, chunk.sectionSlug, index),
    doc_id: docId,
    content_type: chunk.type,
    section_title: chunk.title,
    chunk_text: chunk.text,
    business_model: Array.isArray(normalizedMetadata.business_model)
      ? normalizedMetadata.business_model
      : [normalizedMetadata.business_model].filter(Boolean),
    funnel_stage: normalizedMetadata.funnel_stage || null,
    buying_maturity: normalizedMetadata.buying_maturity || null,
    overlay_for: normalizedMetadata.overlay_for || null,
    tone_guidance: normalizedMetadata.tone_guidance || null,
    proof_posture: normalizedMetadata.proof_posture || null,
    naturality_expectations: normalizedMetadata.naturality_expectations || null,
    pain_point_tags: Array.isArray(normalizedMetadata.pain_point_tags) ? normalizedMetadata.pain_point_tags : [],
    desired_outcome_tags: Array.isArray(normalizedMetadata.desired_outcome_tags) ? normalizedMetadata.desired_outcome_tags : [],
    objection_tags: Array.isArray(normalizedMetadata.objection_tags) ? normalizedMetadata.objection_tags : [],
    trust_driver_tags: Array.isArray(normalizedMetadata.trust_driver_tags) ? normalizedMetadata.trust_driver_tags : [],
    trust_blocker_tags: Array.isArray(normalizedMetadata.trust_blocker_tags) ? normalizedMetadata.trust_blocker_tags : [],
    emotional_state_tags: Array.isArray(normalizedMetadata.emotional_state_tags) ? normalizedMetadata.emotional_state_tags : [],
    neuro_trigger_tags: Array.isArray(normalizedMetadata.neuro_trigger_tags) ? normalizedMetadata.neuro_trigger_tags : [],
    archetype_tags: Array.isArray(normalizedMetadata.archetype_tags) ? normalizedMetadata.archetype_tags : [],
    naturality_tags: Array.isArray(normalizedMetadata.naturality_tags) ? normalizedMetadata.naturality_tags : [],
    icp_segment_tags: Array.isArray(normalizedMetadata.icp_segment_tags) ? normalizedMetadata.icp_segment_tags : [],
    company_tailoring_profile: normalizedMetadata.company_tailoring_profile || {},
    icp_tailoring_profile: normalizedMetadata.icp_tailoring_profile || {},
    stage_tailoring_profile: normalizedMetadata.stage_tailoring_profile || {},
    neuro_profile: normalizedMetadata.neuro_profile || {},
    metadata: normalizedMetadata,
  }));
}

module.exports = {
  parseLiteracyFrontmatter,
  chunkLiteracyFile,
  createLiteracyChunkId,
};
