'use strict';

const REQUIRED_ROOT_SECTIONS = Object.freeze([
  'app_shell',
  'theme_mappings',
  'component_bindings',
  'integration_metadata',
  'lineage',
]);

const REQUIRED_APP_SHELL_FIELDS = Object.freeze([
  'framework',
  'router',
  'entry_layout',
  'supported_routes',
]);

const REQUIRED_THEME_MAPPING_SECTIONS = Object.freeze([
  'css_variables',
  'theme_extensions',
]);

const REQUIRED_LINEAGE_FIELDS = Object.freeze([
  'ruleset_version',
  'strategy_fingerprint',
  'identity_fingerprint',
  'token_contract_fingerprint',
  'component_manifest_fingerprint',
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

function normalizeDiagnostics(diagnostics) {
  return diagnostics
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      code: item.code,
      severity: item.severity || 'error',
      path: item.path || 'unknown',
      message: item.message || 'Unknown diagnostic',
      blocking: item.blocking !== false,
      recommended_fix: item.recommended_fix || 'Provide the missing required starter descriptor section.',
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

function validateStarterDescriptor(descriptor) {
  const diagnostics = [];

  if (!isObject(descriptor)) {
    diagnostics.push(createDiagnostic(
      'STARTER_DESCRIPTOR_INVALID',
      'starter_descriptor',
      'starter_descriptor must be an object',
      'Provide starter_descriptor as an object with app_shell, theme_mappings, component_bindings, integration_metadata, and lineage.'
    ));

    return {
      valid: false,
      diagnostics: normalizeDiagnostics(diagnostics),
    };
  }

  REQUIRED_ROOT_SECTIONS.forEach((section) => {
    if (!isObject(descriptor[section])) {
      diagnostics.push(createDiagnostic(
        'STARTER_SECTION_MISSING',
        section,
        `Missing required starter descriptor section: ${section}`,
        `Add ${section} as an object with required starter metadata.`
      ));
    }
  });

  if (isObject(descriptor.app_shell)) {
    REQUIRED_APP_SHELL_FIELDS.forEach((field) => {
      const value = descriptor.app_shell[field];
      const validField = field === 'supported_routes' ? isNonEmptyArray(value) : isNonEmptyString(value);
      if (!validField) {
        diagnostics.push(createDiagnostic(
          'STARTER_APP_SHELL_FIELD_MISSING',
          `app_shell.${field}`,
          `Missing required app shell field: ${field}`,
          `Set app_shell.${field} to a non-empty ${field === 'supported_routes' ? 'array' : 'string'}.`
        ));
      }
    });
  }

  if (isObject(descriptor.theme_mappings)) {
    REQUIRED_THEME_MAPPING_SECTIONS.forEach((section) => {
      if (!hasNonEmptyObjectProperty(descriptor.theme_mappings, section)) {
        diagnostics.push(createDiagnostic(
          'STARTER_THEME_MAPPING_SECTION_MISSING',
          `theme_mappings.${section}`,
          `Missing required theme mapping section: ${section}`,
          `Add theme_mappings.${section} object with required mappings.`
        ));
      }
    });
  }

  if (isObject(descriptor.component_bindings)) {
    if (!hasNonEmptyObjectProperty(descriptor.component_bindings, 'intents')) {
      diagnostics.push(createDiagnostic(
        'STARTER_COMPONENT_BINDINGS_MISSING',
        'component_bindings.intents',
        'component_bindings.intents must be a non-empty object',
        'Provide semantic intent to primitive/state mappings.'
      ));
    }

    if (!isNonEmptyArray(descriptor.component_bindings.required_primitives)) {
      diagnostics.push(createDiagnostic(
        'STARTER_COMPONENT_BINDINGS_MISSING',
        'component_bindings.required_primitives',
        'component_bindings.required_primitives must be a non-empty array',
        'Provide required primitive list for implementation completeness checks.'
      ));
    }
  }

  if (isObject(descriptor.integration_metadata)) {
    if (!isNonEmptyArray(descriptor.integration_metadata.install_steps)) {
      diagnostics.push(createDiagnostic(
        'STARTER_INTEGRATION_METADATA_MISSING',
        'integration_metadata.install_steps',
        'integration_metadata.install_steps must be a non-empty array',
        'Provide deterministic integration steps for the app-router starter output.'
      ));
    }

    if (!hasNonEmptyObjectProperty(descriptor.integration_metadata, 'dependencies')) {
      diagnostics.push(createDiagnostic(
        'STARTER_INTEGRATION_METADATA_MISSING',
        'integration_metadata.dependencies',
        'integration_metadata.dependencies must be a non-empty object',
        'Provide dependency metadata required for starter integration.'
      ));
    }
  }

  if (isObject(descriptor.lineage)) {
    REQUIRED_LINEAGE_FIELDS.forEach((field) => {
      if (!isNonEmptyString(descriptor.lineage[field])) {
        diagnostics.push(createDiagnostic(
          'STARTER_LINEAGE_POINTER_MISSING',
          `lineage.${field}`,
          `Missing required lineage field: ${field}`,
          `Set lineage.${field} to a non-empty string.`
        ));
      }
    });
  }

  const normalized = normalizeDiagnostics(diagnostics);
  return {
    valid: normalized.length === 0,
    diagnostics: normalized,
  };
}

module.exports = {
  REQUIRED_ROOT_SECTIONS,
  REQUIRED_APP_SHELL_FIELDS,
  REQUIRED_THEME_MAPPING_SECTIONS,
  REQUIRED_LINEAGE_FIELDS,
  validateStarterDescriptor,
};
