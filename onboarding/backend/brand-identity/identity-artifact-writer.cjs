'use strict';

const crypto = require('crypto');

class IdentityArtifactStore {
  constructor() {
    this.records = new Map();
  }

  upsert(tenantId, fingerprint, record) {
    const key = `${tenantId}:${fingerprint}`;
    const now = new Date().toISOString();

    if (this.records.has(key)) {
      const existing = this.records.get(key);
      const updated = {
        ...existing,
        ...record,
        updated_at: now,
        upsert_count: (existing.upsert_count || 1) + 1,
      };
      this.records.set(key, updated);
      return { created: false, record: { ...updated } };
    }

    const createdRecord = {
      ...record,
      created_at: now,
      updated_at: now,
      upsert_count: 1,
    };
    this.records.set(key, createdRecord);
    return { created: true, record: { ...createdRecord } };
  }

  getByTenant(tenantId) {
    const records = [];
    for (const row of this.records.values()) {
      if (row.tenant_id === tenantId) {
        records.push({ ...row });
      }
    }
    return records.sort((a, b) => a.artifact_id.localeCompare(b.artifact_id));
  }

  clear() {
    this.records.clear();
  }
}

const _store = new IdentityArtifactStore();

function buildArtifactFingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

function persistIdentityArtifact(tenantId, compiledIdentity) {
  if (!tenantId) {
    throw new Error('persistIdentityArtifact: tenantId is required');
  }
  if (!compiledIdentity || typeof compiledIdentity !== 'object' || !compiledIdentity.artifact) {
    throw new Error('persistIdentityArtifact: compiled identity artifact is required');
  }

  const payload = {
    artifact: compiledIdentity.artifact,
    ruleset_version: compiledIdentity.metadata ? compiledIdentity.metadata.ruleset_version : null,
    strategy_fingerprint: compiledIdentity.metadata ? compiledIdentity.metadata.strategy_fingerprint : null,
  };
  const artifactFingerprint = buildArtifactFingerprint(payload);
  const artifactId = `${tenantId}:identity:${artifactFingerprint}`;

  const upsert = _store.upsert(tenantId, artifactFingerprint, {
    artifact_id: artifactId,
    artifact_fingerprint: artifactFingerprint,
    tenant_id: tenantId,
    ruleset_version: payload.ruleset_version,
    strategy_fingerprint: payload.strategy_fingerprint,
    artifact: compiledIdentity.artifact,
  });

  return {
    created: upsert.created,
    committed: upsert.created,
    artifact_id: artifactId,
    artifact_fingerprint: artifactFingerprint,
    ruleset_version: payload.ruleset_version,
    upsert_count: upsert.record.upsert_count,
  };
}

function queryIdentityArtifactsByTenant(tenantId) {
  if (!tenantId) {
    return [];
  }
  return _store.getByTenant(tenantId);
}

function resetIdentityArtifactStore() {
  _store.clear();
}

module.exports = {
  persistIdentityArtifact,
  queryIdentityArtifactsByTenant,
  resetIdentityArtifactStore,
};
