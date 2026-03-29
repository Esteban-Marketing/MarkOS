'use strict';

const path = require('path');

const MARKOSDB_SCHEMA_VERSION = '2026-03-30';

// Canonical relational entities persisted through Supabase (cloud) or compatibility adapters.
const SUPABASE_RELATIONAL_CONTRACT = Object.freeze({
  tables: [
    {
      name: 'markos_projects',
      primary_key: 'project_slug',
      indexes: ['owner_user_id', 'updated_at'],
      rls: 'owner_or_project_member',
    },
    {
      name: 'markos_artifacts',
      primary_key: 'artifact_id',
      indexes: ['project_slug', 'artifact_type', 'checksum_sha256', 'updated_at'],
      rls: 'project_scoped',
    },
    {
      name: 'markos_campaign_outcomes',
      primary_key: 'outcome_id',
      indexes: ['project_slug', 'discipline', 'outcome_classification', 'recorded_at'],
      rls: 'project_scoped',
    },
    {
      name: 'markos_sync_checkpoints',
      primary_key: 'checkpoint_id',
      indexes: ['project_slug', 'job_name', 'completed_at'],
      rls: 'project_scoped',
    },
  ],
});

// Canonical vector metadata expected by Upstash vector retrieval paths.
const UPSTASH_VECTOR_METADATA_FIELDS = Object.freeze([
  'slug',
  'discipline',
  'outcome',
  'source_path',
  'artifact_type',
  'checksum_sha256',
  'schema_version',
  'recorded_at',
  'ingested_at',
]);

function inferDisciplineFromRelativePath(relativePath) {
  const normalized = String(relativePath || '').replace(/\\/g, '/');
  const winnerMatch = normalized.match(/MSP\/([^/]+)\/WINNERS\//i);
  if (winnerMatch && winnerMatch[1]) {
    return winnerMatch[1];
  }

  const mspMatch = normalized.match(/MSP\/([^/]+)\//i);
  if (mspMatch && mspMatch[1]) {
    return mspMatch[1];
  }

  return null;
}

function inferOutcomeFromContent(content) {
  const text = String(content || '').toUpperCase();
  if (/WIN\b|WON\b|OUTPERFORM/.test(text)) return 'WIN';
  if (/LOSS\b|LOST\b|UNDERPERFORM/.test(text)) return 'LOSS';
  return 'UNKNOWN';
}

function classifyArtifact(relativePath) {
  const normalized = String(relativePath || '').replace(/\\/g, '/');
  if (/\/MIR\//i.test(normalized)) return 'mir_document';
  if (/\/WINNERS\/_CATALOG\.md$/i.test(normalized)) return 'winners_catalog';
  if (/\/MSP\//i.test(normalized)) return 'msp_document';
  return 'compatibility_artifact';
}

function buildNamespaceReadOrder(projectSlug, canonicalPrefix, readPrefixes) {
  return readPrefixes.map((prefix) => `${prefix}-${projectSlug}-drafts`);
}

function buildVectorMetadata({ projectSlug, relativePath, artifactType, checksumSha256, content, ingestedAt, recordedAt }) {
  const discipline = inferDisciplineFromRelativePath(relativePath);
  const outcome = inferOutcomeFromContent(content);

  return {
    slug: projectSlug,
    discipline: discipline || 'unknown',
    outcome,
    source_path: relativePath,
    artifact_type: artifactType,
    checksum_sha256: checksumSha256,
    schema_version: MARKOSDB_SCHEMA_VERSION,
    recorded_at: recordedAt || ingestedAt,
    ingested_at: ingestedAt,
  };
}

function buildRelationalRecord({ projectSlug, relativePath, artifactType, checksumSha256, content, ingestedAt }) {
  return {
    table: 'markos_artifacts',
    artifact_id: `${projectSlug}:${relativePath}`,
    project_slug: projectSlug,
    artifact_type: artifactType,
    source_path: relativePath,
    checksum_sha256: checksumSha256,
    content_length: Buffer.byteLength(String(content || ''), 'utf8'),
    schema_version: MARKOSDB_SCHEMA_VERSION,
    updated_at: ingestedAt,
  };
}

function normalizeRelativeArtifactPath(baseRoot, absolutePath) {
  return path.relative(baseRoot, absolutePath).replace(/\\/g, '/');
}

module.exports = {
  MARKOSDB_SCHEMA_VERSION,
  SUPABASE_RELATIONAL_CONTRACT,
  UPSTASH_VECTOR_METADATA_FIELDS,
  classifyArtifact,
  buildNamespaceReadOrder,
  buildVectorMetadata,
  buildRelationalRecord,
  normalizeRelativeArtifactPath,
};
