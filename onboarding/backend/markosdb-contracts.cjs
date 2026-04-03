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
    {
      name: 'markos_mir_gate1_initializations',
      primary_key: 'initialization_id',
      indexes: ['tenant_id', 'project_slug', 'initialized_at'],
      rls: 'tenant_scoped_append_only',
    },
    {
      name: 'markos_discipline_activation_evidence',
      primary_key: 'activation_id',
      indexes: ['tenant_id', 'project_slug', 'discipline', 'recorded_at'],
      rls: 'tenant_scoped_append_only',
    },
    {
      name: 'markos_mir_versions',
      primary_key: 'version_id',
      indexes: ['tenant_id', 'project_slug', 'entity_key', 'effective_at'],
      rls: 'tenant_scoped_append_only',
    },
    {
      name: 'markos_mir_regenerations',
      primary_key: 'regeneration_id',
      indexes: ['tenant_id', 'project_slug', 'entity_key', 'recorded_at'],
      rls: 'tenant_scoped_append_only',
    },
    {
      name: 'billing_periods',
      primary_key: 'billing_period_id',
      indexes: ['tenant_id', 'period_start', 'period_end'],
      rls: 'tenant_scoped_system_write',
    },
    {
      name: 'billing_pricing_snapshots',
      primary_key: 'pricing_snapshot_id',
      indexes: ['tenant_id', 'billing_period_id', 'effective_at'],
      rls: 'tenant_scoped_append_only',
    },
    {
      name: 'billing_usage_events',
      primary_key: 'usage_event_id',
      indexes: ['tenant_id', 'billing_period_id', 'source_event_key', 'measured_at'],
      rls: 'tenant_scoped_append_only',
    },
    {
      name: 'billing_usage_ledger_rows',
      primary_key: 'ledger_row_id',
      indexes: ['tenant_id', 'billing_period_id', 'pricing_snapshot_id', 'materialized_at'],
      rls: 'tenant_scoped_append_only',
    },
    {
      name: 'billing_usage_ledger_lineage',
      primary_key: 'ledger_lineage_id',
      indexes: ['tenant_id', 'ledger_row_id', 'usage_event_id'],
      rls: 'tenant_scoped_append_only',
    },
  ],
});

const IMMUTABLE_APPEND_ONLY_TABLES = Object.freeze([
  'markos_mir_gate1_initializations',
  'markos_discipline_activation_evidence',
  'markos_mir_versions',
  'markos_mir_regenerations',
  'billing_pricing_snapshots',
  'billing_usage_events',
  'billing_usage_ledger_rows',
  'billing_usage_ledger_lineage',
]);

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

function isAppendOnlyRelationalTable(tableName) {
  return IMMUTABLE_APPEND_ONLY_TABLES.includes(tableName);
}

module.exports = {
  IMMUTABLE_APPEND_ONLY_TABLES,
  MARKOSDB_SCHEMA_VERSION,
  SUPABASE_RELATIONAL_CONTRACT,
  UPSTASH_VECTOR_METADATA_FIELDS,
  classifyArtifact,
  buildNamespaceReadOrder,
  buildVectorMetadata,
  buildRelationalRecord,
  isAppendOnlyRelationalTable,
  normalizeRelativeArtifactPath,
};
