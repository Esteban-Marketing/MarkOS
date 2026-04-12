'use strict';

const crypto = require('crypto');

class StrategyArtifactStore {
  constructor() {
    this.records = new Map();
  }

  upsert(tenantId, fingerprint, record) {
    const key = `${tenantId}:${fingerprint}`;
    const now = new Date().toISOString();

    if (this.records.has(key)) {
      const current = this.records.get(key);
      const updated = {
        ...current,
        updated_at: now,
        upsert_count: (current.upsert_count || 1) + 1,
      };
      this.records.set(key, updated);
      return {
        created: false,
        record: { ...updated },
      };
    }

    const createdRecord = {
      ...record,
      created_at: now,
      updated_at: now,
      upsert_count: 1,
    };

    this.records.set(key, createdRecord);

    return {
      created: true,
      record: { ...createdRecord },
    };
  }

  getByTenant(tenantId) {
    const rows = [];
    for (const entry of this.records.values()) {
      if (entry.tenant_id === tenantId) {
        rows.push({ ...entry });
      }
    }
    return rows.sort((a, b) => a.artifact_id.localeCompare(b.artifact_id));
  }

  clear() {
    this.records.clear();
  }
}

const _store = new StrategyArtifactStore();

function fingerprintArtifact(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload), 'utf8').digest('hex');
}

function persistStrategyArtifact(tenantId, synthesized) {
  if (!tenantId) {
    throw new Error('persistStrategyArtifact: tenantId is required');
  }
  if (!synthesized || typeof synthesized !== 'object' || !synthesized.artifact) {
    throw new Error('persistStrategyArtifact: synthesized artifact is required');
  }

  const rulesetVersion = synthesized.metadata && synthesized.metadata.ruleset_version
    ? synthesized.metadata.ruleset_version
    : '74.02.0';

  const payload = {
    artifact: synthesized.artifact,
    ruleset_version: rulesetVersion,
    evidence_fingerprint: synthesized.metadata ? synthesized.metadata.content_fingerprint || null : null,
  };

  const artifactFingerprint = fingerprintArtifact(payload);
  const artifactId = `${tenantId}:strategy:${artifactFingerprint}`;

  const upsert = _store.upsert(tenantId, artifactFingerprint, {
    artifact_id: artifactId,
    artifact_fingerprint: artifactFingerprint,
    tenant_id: tenantId,
    ruleset_version: rulesetVersion,
    artifact: synthesized.artifact,
    evidence_fingerprint: payload.evidence_fingerprint,
  });

  return {
    created: upsert.created,
    committed: upsert.created,
    artifact_id: artifactId,
    artifact_fingerprint: artifactFingerprint,
    ruleset_version: rulesetVersion,
    upsert_count: upsert.record.upsert_count,
  };
}

function queryStrategyArtifactsByTenant(tenantId) {
  if (!tenantId) {
    return [];
  }
  return _store.getByTenant(tenantId);
}

function resetStrategyArtifactStore() {
  _store.clear();
}

module.exports = {
  persistStrategyArtifact,
  queryStrategyArtifactsByTenant,
  resetStrategyArtifactStore,
};
