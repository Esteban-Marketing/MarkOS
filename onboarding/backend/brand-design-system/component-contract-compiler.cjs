'use strict';

const {
  REQUIRED_PRIMITIVES,
  REQUIRED_INTERACTION_STATES,
  validateComponentContractManifest,
} = require('./component-contract-schema.cjs');
const {
  REASON_CODES,
  isObject,
  stableSort,
  buildFingerprint,
  createDiagnostic,
  normalizeDiagnostics,
} = require('./diagnostics.cjs');

const COMPONENT_CONTRACT_RULESET_VERSION = '76.02.0';

const DEFAULT_VARIANTS = Object.freeze({
  button: ['default', 'destructive', 'outline', 'ghost', 'link'],
  input: ['default'],
  select: ['default'],
  textarea: ['default'],
  card: ['default'],
  badge: ['default', 'secondary', 'destructive'],
  alert: ['default', 'destructive'],
  dialog: ['default'],
});

const DEFAULT_BINDINGS = Object.freeze({
  button: {
    background: 'color.brand.primary',
    text: 'color.text.inverse',
    border: 'color.surface.border',
  },
  input: {
    border: 'color.surface.border',
    text: 'color.text.primary',
    background: 'color.surface.default',
  },
  select: {
    border: 'color.surface.border',
    text: 'color.text.primary',
  },
  textarea: {
    border: 'color.surface.border',
    text: 'color.text.primary',
  },
  card: {
    background: 'color.surface.default',
    text: 'color.text.primary',
    border: 'color.surface.border',
  },
  badge: {
    background: 'color.brand.accent',
    text: 'color.text.inverse',
  },
  alert: {
    background: 'color.surface.default',
    border: 'color.surface.border',
    text: 'color.text.primary',
  },
  dialog: {
    background: 'color.surface.default',
    text: 'color.text.primary',
    border: 'color.surface.border',
  },
});

function normalizeString(value, fallback) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function normalizeStringArray(values, fallback) {
  const next = (Array.isArray(values) ? values : [])
    .map((entry) => normalizeString(entry, ''))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  if (next.length === 0) {
    return Array.isArray(fallback) ? fallback.slice() : [];
  }

  return Array.from(new Set(next));
}

function validateTokenCoverage(tokenContract, diagnostics) {
  if (!isObject(tokenContract)) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.COMPONENT_INPUT_INVALID,
      'token_contract',
      'token_contract must be an object',
      'Pass compileComponentContractManifest the token_contract output from compileTokenContract.'
    ));
    return;
  }

  const categories = tokenContract.categories;
  if (!isObject(categories) || !isObject(categories.color)) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.TOKEN_BINDING_INVALID,
      'token_contract.categories.color',
      'token_contract.categories.color is required for component semantic bindings',
      'Ensure token compiler emits required color category before component compilation.'
    ));
  }
}

function resolveCoverageIntent(semanticIntent) {
  const requiredPrimitives = normalizeStringArray(
    semanticIntent && semanticIntent.required_primitives,
    REQUIRED_PRIMITIVES
  );
  const requiredStates = normalizeStringArray(
    semanticIntent && semanticIntent.required_states,
    REQUIRED_INTERACTION_STATES
  );

  return {
    required_primitives: requiredPrimitives,
    required_states: requiredStates,
    tone: normalizeString(semanticIntent && semanticIntent.tone, 'neutral'),
    emphasis: normalizeString(semanticIntent && semanticIntent.emphasis, 'default'),
    density: normalizeString(semanticIntent && semanticIntent.density, 'default'),
    feedback_state: normalizeString(semanticIntent && semanticIntent.feedback_state, 'default'),
  };
}

function assertCoverage(coverage, diagnostics) {
  REQUIRED_PRIMITIVES.forEach((primitive) => {
    if (!coverage.required_primitives.includes(primitive)) {
      diagnostics.push(createDiagnostic(
        REASON_CODES.COMPONENT_PRIMITIVE_MISSING,
        `semantic_intent.required_primitives.${primitive}`,
        `Missing required primitive in semantic intent: ${primitive}`,
        `Include \"${primitive}\" in semantic_intent.required_primitives.`
      ));
    }
  });

  REQUIRED_INTERACTION_STATES.forEach((state) => {
    if (!coverage.required_states.includes(state)) {
      diagnostics.push(createDiagnostic(
        REASON_CODES.COMPONENT_STATE_COVERAGE_MISSING,
        `semantic_intent.required_states.${state}`,
        `Missing required interaction state in semantic intent: ${state}`,
        `Include \"${state}\" in semantic_intent.required_states.`
      ));
    }
  });
}

function decideBindingRationale(componentName, coverage) {
  const rationaleMap = {
    button: 'Primary action control derived from semantic tone and emphasis.',
    input: 'Canonical text capture control aligned to readability and spacing density.',
    select: 'Enumerated choice control for constrained option sets.',
    textarea: 'Long-form content entry surface with consistent focus treatment.',
    card: 'Primary grouping surface with balanced hierarchy and spacing intent.',
    badge: 'Compact status marker aligned to tone feedback semantics.',
    alert: 'Critical system feedback surface requiring strong semantic clarity.',
    dialog: 'Modal shell preserving hierarchy and interaction-state consistency.',
  };

  return `${rationaleMap[componentName]} (tone=${coverage.tone}, emphasis=${coverage.emphasis}, density=${coverage.density}, feedback=${coverage.feedback_state})`;
}

function normalizeLineageDecision(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const decisionId = normalizeString(entry.decision_id, 'unknown-decision');
  const sourceNodeIds = normalizeStringArray(entry.source_node_ids, []);
  return {
    decision_id: decisionId,
    source_node_ids: sourceNodeIds,
  };
}

function resolveLineage(strategyResult, identityResult, rulesetVersion) {
  const strategyFingerprint = normalizeString(
    strategyResult && strategyResult.metadata && strategyResult.metadata.deterministic_fingerprint,
    'unknown'
  );
  const identityFingerprint = normalizeString(
    identityResult && identityResult.metadata && identityResult.metadata.deterministic_fingerprint,
    'unknown'
  );

  const strategyDecisions = (strategyResult
    && strategyResult.artifact
    && strategyResult.artifact.lineage
    && Array.isArray(strategyResult.artifact.lineage.decisions))
    ? strategyResult.artifact.lineage.decisions
    : [];

  const identityDecisions = (identityResult
    && identityResult.artifact
    && identityResult.artifact.lineage
    && Array.isArray(identityResult.artifact.lineage.decisions))
    ? identityResult.artifact.lineage.decisions
    : [];

  const decisions = strategyDecisions
    .concat(identityDecisions)
    .map(normalizeLineageDecision)
    .filter(Boolean)
    .sort((a, b) => a.decision_id.localeCompare(b.decision_id));

  return {
    strategy_fingerprint: strategyFingerprint,
    identity_fingerprint: identityFingerprint,
    ruleset_version: rulesetVersion,
    decisions,
  };
}

function chooseSourceKind(componentName) {
  if (componentName === 'card' || componentName === 'input') {
    return 'identity_decision';
  }
  return 'strategy_claim';
}

function compileComponentContractManifest(input, opts = {}) {
  const diagnostics = [];
  const payload = isObject(input) ? input : {};

  const tokenContract = payload.token_contract;
  const semanticIntent = isObject(payload.semantic_intent) ? payload.semantic_intent : {};
  const strategyResult = payload.strategy_result;
  const identityResult = payload.identity_result;

  validateTokenCoverage(tokenContract, diagnostics);

  if (!isObject(strategyResult) || !isObject(strategyResult.artifact)) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.COMPONENT_INPUT_INVALID,
      'strategy_result',
      'strategy_result must include an artifact object',
      'Pass strategy_result from the strategy compiler output.'
    ));
  }

  if (!isObject(identityResult) || !isObject(identityResult.artifact)) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.COMPONENT_INPUT_INVALID,
      'identity_result',
      'identity_result must include an artifact object',
      'Pass identity_result from the identity compiler output.'
    ));
  }

  const coverage = resolveCoverageIntent(semanticIntent);
  assertCoverage(coverage, diagnostics);

  const rulesetVersion = normalizeString(opts.ruleset_version, COMPONENT_CONTRACT_RULESET_VERSION);
  const lineage = resolveLineage(strategyResult, identityResult, rulesetVersion);

  if (lineage.decisions.length === 0) {
    diagnostics.push(createDiagnostic(
      REASON_CODES.LINEAGE_POINTER_MISSING,
      'lineage.decisions',
      'Missing lineage decisions for component contract manifest',
      'Provide strategy and identity lineage decisions in compiler inputs.'
    ));
  }

  if (diagnostics.length > 0) {
    return {
      component_contract_manifest: null,
      metadata: {
        ruleset_version: rulesetVersion,
        strategy_fingerprint: lineage.strategy_fingerprint,
        identity_fingerprint: lineage.identity_fingerprint,
        deterministic_fingerprint: null,
      },
      diagnostics: normalizeDiagnostics(diagnostics),
    };
  }

  const primitives = REQUIRED_PRIMITIVES.map((componentName) => {
    const decision = lineage.decisions[0];
    return {
      component: componentName,
      required_variants: DEFAULT_VARIANTS[componentName] || ['default'],
      required_states: REQUIRED_INTERACTION_STATES.slice(),
      token_bindings: DEFAULT_BINDINGS[componentName] || {},
      mapping_rationale: decideBindingRationale(componentName, coverage),
      lineage: {
        decision_id: decision ? decision.decision_id : 'unknown-decision',
        source_node_ids: decision ? decision.source_node_ids : [],
        source_kind: chooseSourceKind(componentName),
      },
    };
  });

  const manifest = {
    primitives,
    lineage: {
      ruleset_version: rulesetVersion,
      strategy_fingerprint: lineage.strategy_fingerprint,
      identity_fingerprint: lineage.identity_fingerprint,
      decisions: lineage.decisions.map((entry) => entry.decision_id),
    },
  };

  const schemaValidation = validateComponentContractManifest(manifest);
  if (!schemaValidation.valid) {
    return {
      component_contract_manifest: null,
      metadata: {
        ruleset_version: rulesetVersion,
        strategy_fingerprint: lineage.strategy_fingerprint,
        identity_fingerprint: lineage.identity_fingerprint,
        deterministic_fingerprint: null,
      },
      diagnostics: normalizeDiagnostics(schemaValidation.diagnostics),
    };
  }

  const canonicalManifest = stableSort(manifest);
  const deterministicFingerprint = buildFingerprint({
    ruleset_version: rulesetVersion,
    component_contract_manifest: canonicalManifest,
  });

  return {
    component_contract_manifest: canonicalManifest,
    metadata: {
      ruleset_version: rulesetVersion,
      strategy_fingerprint: lineage.strategy_fingerprint,
      identity_fingerprint: lineage.identity_fingerprint,
      deterministic_fingerprint: deterministicFingerprint,
    },
    diagnostics: [],
  };
}

module.exports = {
  COMPONENT_CONTRACT_RULESET_VERSION,
  compileComponentContractManifest,
};
