'use strict';

const REQUIRED_TOKEN_CATEGORIES = Object.freeze([
  'color',
  'typography',
  'spacing',
  'radius',
  'shadow',
  'motion',
]);

const REQUIRED_TAILWIND_V4_SECTIONS = Object.freeze([
  'css_variables',
  'theme_extensions',
]);

const REQUIRED_LINEAGE_FIELDS = Object.freeze([
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

function hasNonEmptyObjectProperty(obj, key) {
  return isObject(obj) && isObject(obj[key]) && Object.keys(obj[key]).length > 0;
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

function validateTokenContract(contract) {
  const diagnostics = [];

  if (!isObject(contract)) {
    diagnostics.push(createDiagnostic(
      'TOKEN_CONTRACT_INVALID',
      'token_contract',
      'token_contract must be an object',
      'Provide token_contract as an object with categories, tailwind_v4 mapping, and lineage metadata.'
    ));

    return {
      valid: false,
      diagnostics,
    };
  }

  const categories = contract.categories;
  if (!isObject(categories)) {
    diagnostics.push(createDiagnostic(
      'TOKEN_CATEGORY_INVALID',
      'categories',
      'categories must be an object',
      'Provide categories object with required token category entries.'
    ));
  } else {
    REQUIRED_TOKEN_CATEGORIES.forEach((category) => {
      if (!hasNonEmptyObjectProperty(categories, category)) {
        diagnostics.push(createDiagnostic(
          'TOKEN_CATEGORY_MISSING',
          `categories.${category}`,
          `Missing required token category: ${category}`,
          `Add categories.${category} with at least one canonical token entry.`
        ));
      }
    });
  }

  const mapping = contract.tailwind_v4;
  if (!isObject(mapping)) {
    diagnostics.push(createDiagnostic(
      'TAILWIND_V4_MAPPING_INVALID',
      'tailwind_v4',
      'tailwind_v4 must be an object',
      'Provide tailwind_v4 object with css_variables and theme_extensions sections.'
    ));
  } else {
    REQUIRED_TAILWIND_V4_SECTIONS.forEach((section) => {
      if (!hasNonEmptyObjectProperty(mapping, section)) {
        diagnostics.push(createDiagnostic(
          'TAILWIND_V4_MAPPING_SECTION_MISSING',
          `tailwind_v4.${section}`,
          `Missing required Tailwind v4 mapping section: ${section}`,
          `Add tailwind_v4.${section} object with required variable mappings.`
        ));
      }
    });
  }

  const lineage = contract.lineage;
  if (!isObject(lineage)) {
    diagnostics.push(createDiagnostic(
      'LINEAGE_POINTER_MISSING',
      'lineage',
      'lineage must be an object',
      'Provide lineage object with ruleset_version, strategy_fingerprint, identity_fingerprint, and decisions.'
    ));
  } else {
    REQUIRED_LINEAGE_FIELDS.forEach((field) => {
      if (!isNonEmptyString(lineage[field])) {
        diagnostics.push(createDiagnostic(
          'LINEAGE_POINTER_MISSING',
          `lineage.${field}`,
          `Missing required lineage field: ${field}`,
          `Set lineage.${field} to a non-empty string.`
        ));
      }
    });

    if (!Array.isArray(lineage.decisions) || lineage.decisions.length === 0) {
      diagnostics.push(createDiagnostic(
        'LINEAGE_DECISIONS_MISSING',
        'lineage.decisions',
        'lineage.decisions must be a non-empty array',
        'Provide at least one lineage decision with decision_id and source_node_ids.'
      ));
    }
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics,
  };
}

module.exports = {
  REQUIRED_TOKEN_CATEGORIES,
  REQUIRED_TAILWIND_V4_SECTIONS,
  REQUIRED_LINEAGE_FIELDS,
  validateTokenContract,
};
