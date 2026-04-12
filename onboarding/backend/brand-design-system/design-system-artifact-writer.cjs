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

class DesignSystemArtifactStore {
  constructor() {
    this.records = new Map();
  }

  upsert(tenantId, artifactFingerprint, row) {
    const key = `${tenantId}:${artifactFingerprint}`;
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

const _store = new DesignSystemArtifactStore();

function persistDesignSystemArtifacts(tenantId, payload) {
  if (!tenantId) {
    throw new Error('persistDesignSystemArtifacts: tenantId is required');
  }

  if (!isObject(payload)) {
    throw new Error('persistDesignSystemArtifacts: payload is required');
  }

  if (!isObject(payload.token_contract)) {
    throw new Error('persistDesignSystemArtifacts: token_contract is required');
  }

  if (!isObject(payload.component_contract_manifest)) {
    throw new Error('persistDesignSystemArtifacts: component_contract_manifest is required');
  }

  const canonicalPayload = {
    token_contract: payload.token_contract,
    token_contract_metadata: isObject(payload.token_contract_metadata) ? payload.token_contract_metadata : {},
    component_contract_manifest: payload.component_contract_manifest,
    component_contract_metadata: isObject(payload.component_contract_metadata) ? payload.component_contract_metadata : {},
  };

  const artifactFingerprint = buildFingerprint(canonicalPayload);
  const artifactId = `${tenantId}:design-system:${artifactFingerprint}`;

  const upsert = _store.upsert(tenantId, artifactFingerprint, {
    artifact_id: artifactId,
    artifact_fingerprint: artifactFingerprint,
    tenant_id: tenantId,
    token_contract_fingerprint: canonicalPayload.token_contract_metadata.deterministic_fingerprint || null,
    component_contract_fingerprint: canonicalPayload.component_contract_metadata.deterministic_fingerprint || null,
    payload: canonicalPayload,
  });

  return {
    created: upsert.created,
    committed: upsert.created,
    artifact_id: artifactId,
    artifact_fingerprint: artifactFingerprint,
    token_contract_fingerprint: upsert.record.token_contract_fingerprint,
    component_contract_fingerprint: upsert.record.component_contract_fingerprint,
    upsert_count: upsert.record.upsert_count,
  };
}

function resetDesignSystemArtifactStore() {
  _store.clear();
}

module.exports = {
  persistDesignSystemArtifacts,
  resetDesignSystemArtifactStore,
};