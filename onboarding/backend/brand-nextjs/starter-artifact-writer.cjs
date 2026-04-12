'use strict';

const crypto = require('crypto');

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stableSort(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => stableSort(entry));
  }

  if (!isObject(value)) {
    return value;
  }

  const sorted = {};
  Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      sorted[key] = stableSort(value[key]);
    });

  return sorted;
}

function buildFingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stableSort(value)), 'utf8').digest('hex');
}

class StarterArtifactStore {
  constructor() {
    this.records = new Map();
  }

  upsert(tenantId, fingerprint, row) {
    const key = `${tenantId}:${fingerprint}`;
    const now = new Date().toISOString();

    if (this.records.has(key)) {
      const existing = this.records.get(key);
      const updated = {
        ...existing,
        ...row,
        updated_at: now,
        upsert_count: (existing.upsert_count || 1) + 1,
      };
      this.records.set(key, updated);
      return { created: false, record: { ...updated } };
    }

    const created = {
      ...row,
      created_at: now,
      updated_at: now,
      upsert_count: 1,
    };
    this.records.set(key, created);
    return { created: true, record: { ...created } };
  }

  clear() {
    this.records.clear();
  }
}

const _store = new StarterArtifactStore();

function persistStarterArtifacts(tenantId, payload) {
  if (!tenantId) {
    throw new Error('persistStarterArtifacts: tenantId is required');
  }

  if (!isObject(payload)) {
    throw new Error('persistStarterArtifacts: payload is required');
  }

  if (!isObject(payload.starter_descriptor)) {
    throw new Error('persistStarterArtifacts: starter_descriptor is required');
  }

  if (!isObject(payload.role_handoff_packs)) {
    throw new Error('persistStarterArtifacts: role_handoff_packs is required');
  }

  const starterMetadata = isObject(payload.starter_metadata) ? payload.starter_metadata : {};
  const roleMetadata = isObject(payload.role_handoff_metadata) ? payload.role_handoff_metadata : {};

  const canonicalPayload = {
    starter_descriptor: payload.starter_descriptor,
    starter_metadata: starterMetadata,
    role_handoff_packs: payload.role_handoff_packs,
    role_handoff_metadata: roleMetadata,
  };

  const artifactFingerprint = buildFingerprint(canonicalPayload);
  const artifactId = `${tenantId}:nextjs-starter:${artifactFingerprint}`;

  const upsert = _store.upsert(tenantId, artifactFingerprint, {
    artifact_id: artifactId,
    artifact_fingerprint: artifactFingerprint,
    tenant_id: tenantId,
    starter_fingerprint: starterMetadata.deterministic_fingerprint || null,
    role_pack_fingerprint: roleMetadata.deterministic_fingerprint || null,
    payload: canonicalPayload,
  });

  return {
    created: upsert.created,
    committed: upsert.created,
    artifact_id: artifactId,
    artifact_fingerprint: artifactFingerprint,
    starter_fingerprint: upsert.record.starter_fingerprint,
    role_pack_fingerprint: upsert.record.role_pack_fingerprint,
    upsert_count: upsert.record.upsert_count,
  };
}

function resetStarterArtifactStore() {
  _store.clear();
}

module.exports = {
  persistStarterArtifacts,
  resetStarterArtifactStore,
};
