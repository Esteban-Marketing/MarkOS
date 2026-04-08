'use strict';

const {
  assertCrmRecordKind,
  validateCrmEntity,
} = require('./contracts.ts');

function ensureStore(store) {
  if (!store || typeof store !== 'object') {
    throw new Error('CRM_STORE_REQUIRED');
  }
  if (!Array.isArray(store.entities)) {
    store.entities = [];
  }
  return store;
}

function toIsoString(value, fallback) {
  const resolved = value ? new Date(value) : new Date(fallback || Date.now());
  if (Number.isNaN(resolved.getTime())) {
    throw new TypeError('CRM_ENTITY_INVALID:timestamp');
  }
  return resolved.toISOString();
}

function normalizeCrmEntity(input) {
  const recordKind = assertCrmRecordKind(input.record_kind);
  const now = new Date().toISOString();
  const normalized = Object.freeze({
    entity_id: String(input.entity_id || '').trim(),
    tenant_id: String(input.tenant_id || '').trim(),
    record_kind: recordKind,
    display_name: String(input.display_name || '').trim(),
    status: String(input.status || 'active').trim() || 'active',
    linked_record_kind: input.linked_record_kind ? assertCrmRecordKind(input.linked_record_kind) : null,
    linked_record_id: input.linked_record_id ? String(input.linked_record_id).trim() : null,
    merged_into: input.merged_into ? String(input.merged_into).trim() : null,
    attributes: input.attributes && typeof input.attributes === 'object'
      ? Object.freeze({ ...input.attributes })
      : Object.freeze({}),
    created_at: toIsoString(input.created_at, now),
    updated_at: toIsoString(input.updated_at, now),
  });
  validateCrmEntity(normalized);
  return normalized;
}

function createCrmEntity(store, input) {
  const targetStore = ensureStore(store);
  const entity = normalizeCrmEntity(input || {});
  const existing = targetStore.entities.find((row) => row.entity_id === entity.entity_id);
  if (existing) {
    throw new Error('CRM_ENTITY_EXISTS');
  }
  targetStore.entities.push(entity);
  return entity;
}

function updateCrmEntity(store, selector, patch) {
  const targetStore = ensureStore(store);
  const tenantId = String(selector?.tenant_id || '').trim();
  const entityId = String(selector?.entity_id || '').trim();
  const entity = targetStore.entities.find((row) => row.entity_id === entityId);
  if (!entity) {
    throw new Error('CRM_ENTITY_NOT_FOUND');
  }
  if (!tenantId || entity.tenant_id !== tenantId) {
    throw new Error('CRM_TENANT_SCOPE_DENIED');
  }
  const updated = normalizeCrmEntity({
    ...entity,
    ...patch,
    entity_id: entity.entity_id,
    tenant_id: entity.tenant_id,
    record_kind: entity.record_kind,
    created_at: entity.created_at,
    updated_at: new Date().toISOString(),
  });
  const index = targetStore.entities.findIndex((row) => row.entity_id === entityId);
  targetStore.entities.splice(index, 1, updated);
  return updated;
}

function listCrmEntities(store, selector) {
  const targetStore = ensureStore(store);
  const tenantId = String(selector?.tenant_id || '').trim();
  if (!tenantId) {
    throw new Error('CRM_TENANT_SCOPE_REQUIRED');
  }
  const recordKind = selector?.record_kind ? assertCrmRecordKind(selector.record_kind) : null;
  return targetStore.entities
    .filter((row) => row.tenant_id === tenantId)
    .filter((row) => !recordKind || row.record_kind === recordKind)
    .filter((row) => !selector?.search || row.display_name.toLowerCase().includes(String(selector.search).toLowerCase()))
    .sort((left, right) => left.display_name.localeCompare(right.display_name));
}

module.exports = {
  createCrmEntity,
  updateCrmEntity,
  listCrmEntities,
  normalizeCrmEntity,
};
