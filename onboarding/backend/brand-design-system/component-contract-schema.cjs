'use strict';

const REQUIRED_PRIMITIVES = Object.freeze([
  'button',
  'input',
  'select',
  'textarea',
  'card',
  'badge',
  'alert',
  'dialog',
]);

const REQUIRED_INTERACTION_STATES = Object.freeze([
  'hover',
  'focus-visible',
  'active',
  'disabled',
  'loading',
]);

const REQUIRED_MANIFEST_LINEAGE_FIELDS = Object.freeze([
  'ruleset_version',
  'strategy_fingerprint',
  'identity_fingerprint',
]);

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
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

function indexPrimitives(primitives) {
  const map = new Map();
  primitives.forEach((entry, index) => {
    if (isObject(entry) && isNonEmptyString(entry.component)) {
      map.set(entry.component, { entry, index });
    }
  });
  return map;
}

function validatePrimitiveEntry(entry, path, diagnostics) {
  if (!isObject(entry)) {
    diagnostics.push(createDiagnostic(
      'COMPONENT_PRIMITIVE_INVALID',
      path,
      'Primitive entry must be an object',
      'Provide object with component, required_variants, required_states, token_bindings, mapping_rationale, and lineage.'
    ));
    return;
  }

  if (!isNonEmptyStringArray(entry.required_variants)) {
    diagnostics.push(createDiagnostic(
      'COMPONENT_VARIANT_MISSING',
      `${path}.required_variants`,
      'required_variants must be a non-empty string array',
      'Add at least one supported variant for this primitive.'
    ));
  }

  if (!isNonEmptyStringArray(entry.required_states)) {
    diagnostics.push(createDiagnostic(
      'COMPONENT_STATE_COVERAGE_MISSING',
      `${path}.required_states`,
      'required_states must be a non-empty string array',
      'Include required interaction states for this primitive.'
    ));
  } else {
    REQUIRED_INTERACTION_STATES.forEach((state) => {
      if (!entry.required_states.includes(state)) {
        diagnostics.push(createDiagnostic(
          'COMPONENT_STATE_COVERAGE_MISSING',
          `${path}.required_states`,
          `Missing required interaction state: ${state}`,
          `Add \"${state}\" to ${path}.required_states.`
        ));
      }
    });
  }

  if (!isObject(entry.token_bindings) || Object.keys(entry.token_bindings).length === 0) {
    diagnostics.push(createDiagnostic(
      'TOKEN_BINDING_INVALID',
      `${path}.token_bindings`,
      'token_bindings must be a non-empty object',
      'Provide semantic token bindings for this primitive.'
    ));
  }

  if (!isNonEmptyString(entry.mapping_rationale)) {
    diagnostics.push(createDiagnostic(
      'MAPPING_RATIONALE_MISSING',
      `${path}.mapping_rationale`,
      'mapping_rationale must be a non-empty string',
      'Document why this primitive mapping and state coverage exist.'
    ));
  }

  if (!isObject(entry.lineage)) {
    diagnostics.push(createDiagnostic(
      'LINEAGE_POINTER_MISSING',
      `${path}.lineage`,
      'lineage must be an object',
      'Provide lineage object with decision_id, source_node_ids, and source_kind.'
    ));
    return;
  }

  if (!isNonEmptyString(entry.lineage.decision_id)) {
    diagnostics.push(createDiagnostic(
      'LINEAGE_POINTER_MISSING',
      `${path}.lineage.decision_id`,
      'lineage.decision_id must be a non-empty string',
      'Set lineage.decision_id to the source decision identifier.'
    ));
  }

  if (!isNonEmptyStringArray(entry.lineage.source_node_ids)) {
    diagnostics.push(createDiagnostic(
      'LINEAGE_POINTER_MISSING',
      `${path}.lineage.source_node_ids`,
      'lineage.source_node_ids must be a non-empty string array',
      'Provide one or more source node IDs for lineage traceability.'
    ));
  }

  if (!isNonEmptyString(entry.lineage.source_kind)) {
    diagnostics.push(createDiagnostic(
      'LINEAGE_POINTER_MISSING',
      `${path}.lineage.source_kind`,
      'lineage.source_kind must be a non-empty string',
      'Set lineage.source_kind (for example strategy_claim or identity_decision).'
    ));
  }
}

function validateComponentContractManifest(manifest) {
  const diagnostics = [];

  if (!isObject(manifest)) {
    diagnostics.push(createDiagnostic(
      'COMPONENT_CONTRACT_INVALID',
      'component_contract_manifest',
      'component_contract_manifest must be an object',
      'Provide component_contract_manifest object with primitives and lineage.'
    ));

    return {
      valid: false,
      diagnostics,
    };
  }

  if (!Array.isArray(manifest.primitives) || manifest.primitives.length === 0) {
    diagnostics.push(createDiagnostic(
      'COMPONENT_PRIMITIVE_MISSING',
      'primitives',
      'primitives must be a non-empty array',
      'Provide required shadcn primitive definitions.'
    ));
  } else {
    const indexed = indexPrimitives(manifest.primitives);

    REQUIRED_PRIMITIVES.forEach((primitive) => {
      if (!indexed.has(primitive)) {
        diagnostics.push(createDiagnostic(
          'COMPONENT_PRIMITIVE_MISSING',
          `primitives.${primitive}`,
          `Missing required primitive: ${primitive}`,
          `Add a primitive definition for \"${primitive}\".`
        ));
      }
    });

    manifest.primitives.forEach((entry, index) => {
      validatePrimitiveEntry(entry, `primitives[${index}]`, diagnostics);
    });
  }

  if (!isObject(manifest.lineage)) {
    diagnostics.push(createDiagnostic(
      'LINEAGE_POINTER_MISSING',
      'lineage',
      'lineage must be an object',
      'Provide lineage object with ruleset_version, strategy_fingerprint, identity_fingerprint, and decisions.'
    ));
  } else {
    REQUIRED_MANIFEST_LINEAGE_FIELDS.forEach((field) => {
      if (!isNonEmptyString(manifest.lineage[field])) {
        diagnostics.push(createDiagnostic(
          'LINEAGE_POINTER_MISSING',
          `lineage.${field}`,
          `Missing required lineage field: ${field}`,
          `Set lineage.${field} to a non-empty string.`
        ));
      }
    });

    if (!isNonEmptyStringArray(manifest.lineage.decisions)) {
      diagnostics.push(createDiagnostic(
        'LINEAGE_DECISIONS_MISSING',
        'lineage.decisions',
        'lineage.decisions must be a non-empty string array',
        'Provide lineage decision IDs for the generated manifest.'
      ));
    }
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics,
  };
}

module.exports = {
  REQUIRED_PRIMITIVES,
  REQUIRED_INTERACTION_STATES,
  REQUIRED_MANIFEST_LINEAGE_FIELDS,
  validateComponentContractManifest,
};
