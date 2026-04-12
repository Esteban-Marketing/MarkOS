'use strict';

const { validateStarterDescriptor } = require('./starter-descriptor-schema.cjs');
const {
  REASON_CODES,
  isObject,
  stableSort,
  buildFingerprint,
  createDiagnostic,
  normalizeDiagnostics,
  normalizeString,
} = require('./handoff-diagnostics.cjs');

const STARTER_DESCRIPTOR_RULESET_VERSION = '77.02.0';

const DEFAULT_APP_SHELL = Object.freeze({
  framework: 'nextjs',
  router: 'app-router',
  entry_layout: 'app/layout.tsx',
  supported_routes: ['/', '/pricing', '/about'],
});

const DEFAULT_INTEGRATION_STEPS = Object.freeze([
  'Install next, react, and react-dom dependencies.',
  'Apply theme css variables from theme_mappings.css_variables into app/globals.css.',
  'Wire route scaffold and bind required component primitives before content integration.',
]);

const DEFAULT_DEPENDENCIES = Object.freeze({
  next: '16.2.3',
  tailwindcss: '4.2.2',
  shadcn: '4.2.0',
});

function toArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function normalizeDependencyVersions(input) {
  if (!isObject(input)) {
    return { ...DEFAULT_DEPENDENCIES };
  }

  return {
    next: normalizeString(input.next, DEFAULT_DEPENDENCIES.next),
    tailwindcss: normalizeString(input.tailwindcss, DEFAULT_DEPENDENCIES.tailwindcss),
    shadcn: normalizeString(input.shadcn, DEFAULT_DEPENDENCIES.shadcn),
  };
}

function normalizeRequiredPrimitives(componentManifest) {
  const primitives = Array.isArray(componentManifest.primitives)
    ? componentManifest.primitives
    : [];

  return Array.from(new Set(
    primitives
      .map((entry) => normalizeString(entry && entry.component, ''))
      .filter(Boolean)
  )).sort((a, b) => a.localeCompare(b));
}

function normalizeIntentBindings(componentManifest) {
  const primitives = Array.isArray(componentManifest.primitives)
    ? componentManifest.primitives
    : [];

  const intents = {};
  primitives
    .slice()
    .sort((a, b) => normalizeString(a && a.component, '').localeCompare(normalizeString(b && b.component, '')))
    .forEach((entry) => {
      const component = normalizeString(entry && entry.component, '');
      if (!component) {
        return;
      }

      intents[component] = {
        component,
        required_states: toArray(entry.required_states)
          .map((state) => normalizeString(state, ''))
          .filter(Boolean)
          .sort((left, right) => left.localeCompare(right)),
        token_bindings: stableSort(isObject(entry.token_bindings) ? entry.token_bindings : {}),
      };
    });

  return intents;
}

function resolveLineage(input, rulesetVersion) {
  const strategyResult = input.strategy_result;
  const identityResult = input.identity_result;
  const tokenContract = input.token_contract;
  const componentManifest = input.component_contract_manifest;

  return {
    ruleset_version: rulesetVersion,
    strategy_fingerprint: normalizeString(strategyResult && strategyResult.metadata && strategyResult.metadata.deterministic_fingerprint, 'unknown'),
    identity_fingerprint: normalizeString(identityResult && identityResult.metadata && identityResult.metadata.deterministic_fingerprint, 'unknown'),
    token_contract_fingerprint: normalizeString(tokenContract && tokenContract.lineage && tokenContract.lineage.strategy_fingerprint, 'unknown-token'),
    component_manifest_fingerprint: normalizeString(componentManifest && componentManifest.lineage && componentManifest.lineage.strategy_fingerprint, 'unknown-component'),
  };
}

function validateInput(input, diagnostics) {
  if (!isObject(input)) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.STARTER_INPUT_INVALID,
      'input',
      'Starter descriptor compiler input must be an object.',
      'Provide strategy_result, identity_result, token_contract, and component_contract_manifest objects.'
    ));
    return;
  }

  if (!isObject(input.strategy_result) || !isObject(input.strategy_result.metadata)) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.STARTER_INPUT_INVALID,
      'strategy_result',
      'strategy_result with metadata is required.',
      'Pass strategy_result from the deterministic strategy compiler output.'
    ));
  }

  if (!isObject(input.identity_result) || !isObject(input.identity_result.metadata)) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.STARTER_INPUT_INVALID,
      'identity_result',
      'identity_result with metadata is required.',
      'Pass identity_result from the deterministic identity compiler output.'
    ));
  }

  if (!isObject(input.token_contract) || !isObject(input.token_contract.tailwind_v4)) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.STARTER_SECTION_MISSING,
      'token_contract.tailwind_v4',
      'token_contract.tailwind_v4 is required for deterministic theme mappings.',
      'Pass token_contract from phase-76 token compiler output.'
    ));
  }

  if (!isObject(input.component_contract_manifest) || !Array.isArray(input.component_contract_manifest.primitives)) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.STARTER_SECTION_MISSING,
      'component_contract_manifest.primitives',
      'component_contract_manifest.primitives is required for component bindings.',
      'Pass component_contract_manifest from phase-76 component contract compiler output.'
    ));
  }
}

function compileStarterDescriptor(input, opts = {}) {
  const diagnostics = [];
  validateInput(input, diagnostics);

  const rulesetVersion = normalizeString(opts.ruleset_version, STARTER_DESCRIPTOR_RULESET_VERSION);

  if (diagnostics.length > 0) {
    return {
      starter_descriptor: null,
      metadata: {
        ruleset_version: rulesetVersion,
        deterministic_fingerprint: null,
      },
      diagnostics: normalizeDiagnostics(diagnostics),
    };
  }

  const tokenContract = input.token_contract;
  const componentManifest = input.component_contract_manifest;
  const lineage = resolveLineage(input, rulesetVersion);

  if (lineage.strategy_fingerprint === 'unknown' || lineage.identity_fingerprint === 'unknown') {
    diagnostics.push(createDiagnostic(
      REASON_CODES.STARTER_LINEAGE_INVALID,
      'lineage',
      'Lineage fingerprints must include strategy and identity deterministic fingerprints.',
      'Provide strategy_result.metadata.deterministic_fingerprint and identity_result.metadata.deterministic_fingerprint.'
    ));
  }

  const descriptor = {
    app_shell: stableSort(DEFAULT_APP_SHELL),
    theme_mappings: {
      css_variables: stableSort(tokenContract.tailwind_v4.css_variables || {}),
      theme_extensions: stableSort(tokenContract.tailwind_v4.theme_extensions || {}),
    },
    component_bindings: {
      intents: normalizeIntentBindings(componentManifest),
      required_primitives: normalizeRequiredPrimitives(componentManifest),
    },
    integration_metadata: {
      install_steps: DEFAULT_INTEGRATION_STEPS.slice(),
      dependencies: normalizeDependencyVersions(opts.dependencies),
    },
    lineage,
  };

  const schemaResult = validateStarterDescriptor(descriptor);
  if (!schemaResult.valid) {
    diagnostics.push(...schemaResult.diagnostics.map((item) => ({
      ...item,
      code: REASON_CODES.STARTER_SCHEMA_INVALID,
    })));
  }

  if (diagnostics.length > 0) {
    return {
      starter_descriptor: null,
      metadata: {
        ruleset_version: rulesetVersion,
        deterministic_fingerprint: null,
      },
      diagnostics: normalizeDiagnostics(diagnostics),
    };
  }

  const canonicalDescriptor = stableSort(descriptor);
  const deterministicFingerprint = buildFingerprint({
    ruleset_version: rulesetVersion,
    starter_descriptor: canonicalDescriptor,
  });

  return {
    starter_descriptor: canonicalDescriptor,
    metadata: {
      ruleset_version: rulesetVersion,
      deterministic_fingerprint: deterministicFingerprint,
    },
    diagnostics: [],
  };
}

module.exports = {
  STARTER_DESCRIPTOR_RULESET_VERSION,
  compileStarterDescriptor,
};
