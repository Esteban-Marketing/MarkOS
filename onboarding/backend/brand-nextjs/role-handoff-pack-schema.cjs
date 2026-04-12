'use strict';

const REQUIRED_ROLES = Object.freeze([
  'strategist',
  'designer',
  'founder_operator',
  'frontend_engineer',
  'content_marketing',
]);

const REQUIRED_ROLE_SECTIONS = Object.freeze([
  'immediate_next_actions',
  'immutable_constraints',
  'acceptance_checks',
  'lineage',
]);

const REQUIRED_ROLE_LINEAGE_FIELDS = Object.freeze([
  'descriptor_fingerprint',
  'source_artifacts',
]);

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function createDiagnostic(code, path, message, recommendedFix) {
  return {
    code,
    severity: 'error',
    path,
    message,
    blocking: true,
    recommended_fix: recommendedFix,
  };
}

function normalizeDiagnostics(diagnostics) {
  return diagnostics
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      code: item.code,
      severity: item.severity || 'error',
      path: item.path || 'unknown',
      message: item.message || 'Unknown diagnostic',
      blocking: item.blocking !== false,
      recommended_fix: item.recommended_fix || 'Provide the missing required role handoff section.',
    }))
    .sort((a, b) => {
      const codeCmp = String(a.code).localeCompare(String(b.code));
      if (codeCmp !== 0) {
        return codeCmp;
      }
      const pathCmp = String(a.path).localeCompare(String(b.path));
      if (pathCmp !== 0) {
        return pathCmp;
      }
      return String(a.message).localeCompare(String(b.message));
    });
}

function validateRolePayload(roleKey, payload, diagnostics) {
  if (!isObject(payload)) {
    diagnostics.push(createDiagnostic(
      'ROLE_PACK_MISSING',
      `role_packs.${roleKey}`,
      `Missing required role pack: ${roleKey}`,
      `Provide role_packs.${roleKey} with required action, constraints, acceptance, and lineage sections.`
    ));
    return;
  }

  REQUIRED_ROLE_SECTIONS.forEach((section) => {
    const sectionValue = payload[section];
    const validSection = section === 'lineage' ? isObject(sectionValue) : isNonEmptyArray(sectionValue);
    if (!validSection) {
      diagnostics.push(createDiagnostic(
        'ROLE_SECTION_MISSING',
        `role_packs.${roleKey}.${section}`,
        `Missing required role section: ${section}`,
        `Set role_packs.${roleKey}.${section} to a non-empty ${section === 'lineage' ? 'object' : 'array'}.`
      ));
    }
  });

  if (isObject(payload.lineage)) {
    REQUIRED_ROLE_LINEAGE_FIELDS.forEach((field) => {
      const value = payload.lineage[field];
      const validField = field === 'source_artifacts' ? isNonEmptyArray(value) : isNonEmptyString(value);
      if (!validField) {
        diagnostics.push(createDiagnostic(
          'ROLE_LINEAGE_POINTER_MISSING',
          `role_packs.${roleKey}.lineage.${field}`,
          `Missing required role lineage field: ${field}`,
          `Set role_packs.${roleKey}.lineage.${field} to a non-empty ${field === 'source_artifacts' ? 'array' : 'string'}.`
        ));
      }
    });
  }
}

function validateRoleHandoffPack(contract) {
  const diagnostics = [];

  if (!isObject(contract)) {
    diagnostics.push(createDiagnostic(
      'ROLE_PACK_CONTRACT_INVALID',
      'role_pack_contract',
      'role_pack_contract must be an object',
      'Provide role_pack_contract as an object with descriptor_reference and role_packs.'
    ));

    return {
      valid: false,
      diagnostics: normalizeDiagnostics(diagnostics),
    };
  }

  if (!isNonEmptyString(contract.descriptor_reference)) {
    diagnostics.push(createDiagnostic(
      'ROLE_DESCRIPTOR_REFERENCE_MISSING',
      'descriptor_reference',
      'descriptor_reference must be a non-empty string',
      'Set descriptor_reference to the canonical starter descriptor identifier.'
    ));
  }

  if (!isObject(contract.role_packs)) {
    diagnostics.push(createDiagnostic(
      'ROLE_PACKS_SECTION_INVALID',
      'role_packs',
      'role_packs must be an object',
      'Provide role_packs object keyed by required role names.'
    ));
  } else {
    REQUIRED_ROLES.forEach((roleKey) => {
      validateRolePayload(roleKey, contract.role_packs[roleKey], diagnostics);
    });
  }

  const normalized = normalizeDiagnostics(diagnostics);
  return {
    valid: normalized.length === 0,
    diagnostics: normalized,
  };
}

module.exports = {
  REQUIRED_ROLES,
  REQUIRED_ROLE_SECTIONS,
  REQUIRED_ROLE_LINEAGE_FIELDS,
  validateRoleHandoffPack,
};
