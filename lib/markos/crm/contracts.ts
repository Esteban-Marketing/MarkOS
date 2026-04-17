'use strict';

const crmRecordKinds = Object.freeze([
  'contact',
  'company',
  'deal',
  'account',
  'customer',
  'task',
  'note',
]);

const crmIdentityLinkStatuses = Object.freeze([
  'candidate',
  'accepted',
  'review',
  'rejected',
]);

const crmWorkspaceViewTypes = Object.freeze([
  'kanban',
  'table',
  'detail',
  'timeline',
  'calendar',
  'funnel',
]);

const crmEntitySchema = Object.freeze({
  required: ['entity_id', 'tenant_id', 'record_kind', 'display_name', 'created_at', 'updated_at'],
  record_kinds: crmRecordKinds.slice(),
  tenant_partition_key: 'tenant_id',
  canonical_identifier: 'entity_id',
  merged_marker: 'merged_into',
});

const crmCustomFieldDefinitionSchema = Object.freeze({
  required: ['field_definition_id', 'tenant_id', 'entity_kind', 'field_key', 'label', 'field_type'],
  supported_field_types: ['text', 'number', 'boolean', 'date', 'select', 'multiselect', 'json'],
  governed_scope_key: 'entity_kind',
});

const crmCustomFieldValueSchema = Object.freeze({
  required: ['field_value_id', 'tenant_id', 'field_definition_id', 'entity_kind', 'entity_id'],
  scoped_value_columns: ['value_text', 'value_number', 'value_boolean', 'value_date', 'value_json'],
});

const crmPipelineDefinitionSchema = Object.freeze({
  required: ['tenant_id', 'pipeline_key', 'display_name', 'object_kind'],
});

const crmWorkspaceObjectDefinitionSchema = Object.freeze({
  required: ['tenant_id', 'record_kind', 'display_name'],
  capability_keys: ['workspace_enabled', 'pipeline_enabled', 'detail_enabled', 'timeline_enabled', 'calendar_enabled', 'funnel_enabled'],
});

function assertCrmRecordKind(recordKind) {
  const normalized = String(recordKind || '').trim().toLowerCase();
  if (!crmRecordKinds.includes(normalized)) {
    throw new Error(`CRM_RECORD_KIND_INVALID:${recordKind}`);
  }
  return normalized;
}

function assertWorkspaceViewType(viewType) {
  const normalized = String(viewType || '').trim().toLowerCase();
  if (!crmWorkspaceViewTypes.includes(normalized)) {
    throw new Error(`CRM_WORKSPACE_VIEW_INVALID:${viewType}`);
  }
  return normalized;
}

function assertWorkspaceRecordKind(recordKind, allowCustomObject = false) {
  const normalized = String(recordKind || '').trim().toLowerCase();
  if (crmRecordKinds.includes(normalized)) {
    return normalized;
  }
  if (allowCustomObject && /^[a-z0-9_-]+$/.test(normalized)) {
    return normalized;
  }
  throw new Error(`CRM_WORKSPACE_RECORD_KIND_INVALID:${recordKind}`);
}

function validateCrmEntity(input) {
  const entity = input && typeof input === 'object' ? input : {};
  for (const fieldName of crmEntitySchema.required) {
    if (!String(entity[fieldName] || '').trim()) {
      throw new Error(`CRM_ENTITY_INVALID:${fieldName}`);
    }
  }
  assertCrmRecordKind(entity.record_kind);
  return true;
}

function validateCustomFieldDefinition(input) {
  const definition = input && typeof input === 'object' ? input : {};
  for (const fieldName of crmCustomFieldDefinitionSchema.required) {
    if (!String(definition[fieldName] || '').trim()) {
      throw new Error(`CRM_CUSTOM_FIELD_DEFINITION_INVALID:${fieldName}`);
    }
  }
  assertCrmRecordKind(definition.entity_kind);
  if (!crmCustomFieldDefinitionSchema.supported_field_types.includes(definition.field_type)) {
    throw new Error(`CRM_CUSTOM_FIELD_DEFINITION_INVALID:field_type`);
  }
  return true;
}

function validateCustomFieldValue(input) {
  const value = input && typeof input === 'object' ? input : {};
  for (const fieldName of crmCustomFieldValueSchema.required) {
    if (!String(value[fieldName] || '').trim()) {
      throw new Error(`CRM_CUSTOM_FIELD_VALUE_INVALID:${fieldName}`);
    }
  }
  assertCrmRecordKind(value.entity_kind);
  return true;
}

function requireNonEmptyField(input, fieldName, errorPrefix) {
  if (!String(input[fieldName] || '').trim()) {
    throw new Error(`${errorPrefix}:${fieldName}`);
  }
}

function validatePipelineStage(stage) {
  requireNonEmptyField(stage, 'stage_key', 'CRM_PIPELINE_STAGE_INVALID');
  requireNonEmptyField(stage, 'display_name', 'CRM_PIPELINE_STAGE_INVALID');
  if (!Number.isInteger(Number(stage?.stage_order))) {
    throw new TypeError('CRM_PIPELINE_STAGE_INVALID:stage_order');
  }
}

function validatePipelineDefinition(input) {
  const pipeline = input && typeof input === 'object' ? input : {};
  for (const fieldName of crmPipelineDefinitionSchema.required) {
    requireNonEmptyField(pipeline, fieldName, 'CRM_PIPELINE_DEFINITION_INVALID');
  }
  assertWorkspaceRecordKind(pipeline.object_kind, true);
  if (Array.isArray(pipeline.stages)) {
    for (const stage of pipeline.stages) {
      validatePipelineStage(stage);
    }
  }
  return true;
}

function validateWorkspaceObjectDefinition(input) {
  const definition = input && typeof input === 'object' ? input : {};
  for (const fieldName of crmWorkspaceObjectDefinitionSchema.required) {
    requireNonEmptyField(definition, fieldName, 'CRM_WORKSPACE_OBJECT_DEFINITION_INVALID');
  }
  const isCustomObject = definition.is_custom_object === true;
  assertWorkspaceRecordKind(definition.record_kind, isCustomObject);
  if (definition.calendar_enabled === true && !String(definition.calendar_date_field_key || '').trim()) {
    throw new Error('CRM_WORKSPACE_OBJECT_DEFINITION_INVALID:calendar_date_field_key');
  }
  return true;
}

module.exports = {
  crmRecordKinds,
  crmIdentityLinkStatuses,
  crmWorkspaceViewTypes,
  crmEntitySchema,
  crmCustomFieldDefinitionSchema,
  crmCustomFieldValueSchema,
  crmPipelineDefinitionSchema,
  crmWorkspaceObjectDefinitionSchema,
  assertCrmRecordKind,
  assertWorkspaceViewType,
  assertWorkspaceRecordKind,
  validateCrmEntity,
  validateCustomFieldDefinition,
  validateCustomFieldValue,
  validatePipelineStage,
  validatePipelineDefinition,
  validateWorkspaceObjectDefinition,
};
