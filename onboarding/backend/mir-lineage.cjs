'use strict';

const crypto = require('node:crypto');

const REQUIRED_GATE1_ENTITIES = Object.freeze([
  'company_profile',
  'mission_values',
  'audience',
  'competitive',
  'brand_voice',
]);

const APPEND_ONLY_TABLES = Object.freeze([
  'markos_mir_gate1_initializations',
  'markos_discipline_activation_evidence',
  'markos_mir_versions',
  'markos_mir_regenerations',
]);

function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function normalizeTimestamp(value) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('invalid timestamp supplied for MIR lineage record');
  }

  return date.toISOString();
}

function buildRecordId(prefix, payload) {
  const digest = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return `${prefix}_${digest.slice(0, 16)}`;
}

function ensureArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? [...value] : [value];
}

function uniqueStrings(values) {
  return [...new Set(ensureArray(values).filter(Boolean))];
}

function computeMissingGate1Entities(entityStatus = {}) {
  return REQUIRED_GATE1_ENTITIES.filter((entityKey) => entityStatus[entityKey] !== 'complete');
}

function appendRecord(persistence, tableName, record) {
  const clonedRecord = cloneValue(record);

  if (!persistence) {
    return clonedRecord;
  }

  if (typeof persistence.append === 'function') {
    return persistence.append(tableName, clonedRecord);
  }

  if (typeof persistence.insertImmutable === 'function') {
    return persistence.insertImmutable(tableName, clonedRecord);
  }

  if (persistence.tables && Array.isArray(persistence.tables[tableName])) {
    persistence.tables[tableName].push(clonedRecord);
    return clonedRecord;
  }

  throw new Error(`unsupported MIR lineage persistence adapter for ${tableName}`);
}

function listRecords(persistence, tableName) {
  if (!persistence) {
    return [];
  }

  if (typeof persistence.list === 'function') {
    return persistence.list(tableName);
  }

  if (persistence.tables && Array.isArray(persistence.tables[tableName])) {
    return cloneValue(persistence.tables[tableName]);
  }

  return [];
}

function createInMemoryLineageStore(initialTables = {}) {
  const tables = {};

  for (const tableName of APPEND_ONLY_TABLES) {
    tables[tableName] = Array.isArray(initialTables[tableName])
      ? cloneValue(initialTables[tableName])
      : [];
  }

  return {
    tables,
    append(tableName, record) {
      if (!tables[tableName]) {
        tables[tableName] = [];
      }

      const clonedRecord = cloneValue(record);
      tables[tableName].push(clonedRecord);
      return clonedRecord;
    },
    list(tableName) {
      return cloneValue(tables[tableName] || []);
    },
    update() {
      throw new Error('append-only lineage records cannot be updated');
    },
    delete() {
      throw new Error('append-only lineage records cannot be deleted');
    },
  };
}

function recordGate1Initialization({
  tenantId,
  projectSlug,
  entityStatus,
  sourceReferences,
  runId,
  persistence,
  initializedAt,
}) {
  const normalizedStatus = cloneValue(entityStatus || {});
  const missingEntities = computeMissingGate1Entities(normalizedStatus);
  const record = {
    initialization_id: buildRecordId('gate1', {
      tenantId: tenantId || null,
      projectSlug: projectSlug || null,
      entityStatus: normalizedStatus,
      initializedAt: initializedAt || null,
    }),
    tenant_id: tenantId || null,
    project_slug: projectSlug || null,
    required_entities: [...REQUIRED_GATE1_ENTITIES],
    entity_status: normalizedStatus,
    missing_entities: missingEntities,
    gate1_status: missingEntities.length === 0 ? 'ready' : 'blocked',
    source_references: cloneValue(sourceReferences || []),
    run_id: runId || null,
    initialized_at: normalizeTimestamp(initializedAt),
  };

  appendRecord(persistence, 'markos_mir_gate1_initializations', record);
  return record;
}

function recordDisciplineActivationEvidence({
  tenantId,
  projectSlug,
  discipline,
  selected,
  rationale,
  mirInputs,
  serviceContext,
  deactivationRationale,
  runId,
  persistence,
  recordedAt,
}) {
  if (!discipline) {
    throw new Error('discipline is required for activation evidence');
  }

  if (!serviceContext || !Array.isArray(serviceContext.purchased_disciplines)) {
    throw new Error('service context with purchased disciplines is required');
  }

  const previousDisciplines = uniqueStrings(serviceContext.previous_disciplines);
  const wasPreviouslyActive = previousDisciplines.includes(discipline);
  if (!selected && wasPreviouslyActive && !String(deactivationRationale || '').trim()) {
    throw new Error(`deactivation rationale required for ${discipline}`);
  }

  if (!String(rationale || '').trim()) {
    throw new Error(`rationale is required for ${discipline}`);
  }

  const record = {
    activation_id: buildRecordId('activation', {
      tenantId: tenantId || null,
      projectSlug: projectSlug || null,
      discipline,
      selected: Boolean(selected),
      recordedAt: recordedAt || null,
    }),
    tenant_id: tenantId || null,
    project_slug: projectSlug || null,
    discipline,
    selected: Boolean(selected),
    rationale: selected
      ? String(rationale).trim()
      : wasPreviouslyActive
        ? `Discipline deactivated because service context no longer supports it. ${String(deactivationRationale || '').trim()}`.trim()
        : String(deactivationRationale || rationale).trim(),
    mir_inputs: cloneValue(mirInputs || {}),
    service_context: {
      purchased_disciplines: uniqueStrings(serviceContext.purchased_disciplines),
      previous_disciplines: previousDisciplines,
      purchased: uniqueStrings(serviceContext.purchased_disciplines).includes(discipline),
      previously_active: wasPreviouslyActive,
    },
    run_id: runId || null,
    recorded_at: normalizeTimestamp(recordedAt),
  };

  appendRecord(persistence, 'markos_discipline_activation_evidence', record);
  return record;
}

function appendRegenerationRecord({
  tenantId,
  projectSlug,
  entityKey,
  parentVersionId,
  rationale,
  dependencyImpact,
  contentSnapshot,
  runId,
  persistence,
  effectiveAt,
  actorId,
}) {
  if (!entityKey) {
    throw new Error('entity key is required for MIR regeneration lineage');
  }

  if (!String(rationale || '').trim()) {
    throw new Error(`critical MIR edits require rationale for ${entityKey}`);
  }

  const timestamp = normalizeTimestamp(effectiveAt);
  const versionRecord = {
    version_id: buildRecordId('version', {
      tenantId: tenantId || null,
      projectSlug: projectSlug || null,
      entityKey,
      parentVersionId: parentVersionId || null,
      timestamp,
      contentSnapshot: contentSnapshot || null,
    }),
    tenant_id: tenantId || null,
    project_slug: projectSlug || null,
    entity_key: entityKey,
    parent_version_id: parentVersionId || null,
    content_snapshot: cloneValue(contentSnapshot || null),
    content_hash: crypto.createHash('sha256').update(JSON.stringify(contentSnapshot || null)).digest('hex'),
    rationale: String(rationale).trim(),
    dependency_impact: cloneValue(dependencyImpact || []),
    run_id: runId || null,
    actor_id: actorId || null,
    effective_at: timestamp,
  };

  const regenerationRecord = {
    regeneration_id: buildRecordId('regen', {
      tenantId: tenantId || null,
      projectSlug: projectSlug || null,
      entityKey,
      versionId: versionRecord.version_id,
      timestamp,
    }),
    tenant_id: tenantId || null,
    project_slug: projectSlug || null,
    entity_key: entityKey,
    parent_version_id: parentVersionId || null,
    version_id: versionRecord.version_id,
    rationale: String(rationale).trim(),
    dependency_impact: cloneValue(dependencyImpact || []),
    run_id: runId || null,
    actor_id: actorId || null,
    recorded_at: timestamp,
  };

  appendRecord(persistence, 'markos_mir_versions', versionRecord);
  appendRecord(persistence, 'markos_mir_regenerations', regenerationRecord);

  return {
    versionRecord,
    regenerationRecord,
  };
}

function queryLineageByTenantAndDateRange({
  tenantId,
  startDate,
  endDate,
  persistence,
  tableNames,
}) {
  const from = startDate ? new Date(startDate).getTime() : Number.NEGATIVE_INFINITY;
  const to = endDate ? new Date(endDate).getTime() : Number.POSITIVE_INFINITY;
  const tablesToQuery = Array.isArray(tableNames) && tableNames.length > 0
    ? tableNames
    : ['markos_mir_versions', 'markos_mir_regenerations'];

  return tablesToQuery.flatMap((tableName) => {
    return listRecords(persistence, tableName)
      .filter((record) => {
        const recordTimestamp = new Date(record.recorded_at || record.effective_at || record.initialized_at).getTime();
        return record.tenant_id === tenantId && recordTimestamp >= from && recordTimestamp <= to;
      })
      .sort((left, right) => {
        const leftTime = new Date(left.recorded_at || left.effective_at || left.initialized_at).getTime();
        const rightTime = new Date(right.recorded_at || right.effective_at || right.initialized_at).getTime();
        return leftTime - rightTime;
      });
  });
}

module.exports = {
  APPEND_ONLY_TABLES,
  REQUIRED_GATE1_ENTITIES,
  appendRegenerationRecord,
  computeMissingGate1Entities,
  createInMemoryLineageStore,
  queryLineageByTenantAndDateRange,
  recordDisciplineActivationEvidence,
  recordGate1Initialization,
};