'use strict';

const crypto = require('crypto');
const { validateIdentityArtifact } = require('./identity-artifact-schema.cjs');
const { buildSemanticRoleModel } = require('./semantic-role-model.cjs');

const IDENTITY_RULESET_VERSION = '75.02.0';

function stableSort(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => stableSort(entry));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const sorted = {};
  Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      sorted[key] = stableSort(value[key]);
    });
  return sorted;
}

function stableStringify(value) {
  return JSON.stringify(stableSort(value));
}

function buildFingerprint(value) {
  return crypto.createHash('sha256').update(stableStringify(value), 'utf8').digest('hex');
}

function compileIdentityArtifact(strategySynthesisResult, opts = {}) {
  if (!strategySynthesisResult || typeof strategySynthesisResult !== 'object') {
    throw new Error('compileIdentityArtifact: strategySynthesisResult is required');
  }
  if (!strategySynthesisResult.artifact || typeof strategySynthesisResult.artifact !== 'object') {
    throw new Error('compileIdentityArtifact: strategy artifact is required');
  }

  const strategyFingerprint = strategySynthesisResult.metadata
    && strategySynthesisResult.metadata.deterministic_fingerprint
    ? strategySynthesisResult.metadata.deterministic_fingerprint
    : 'unknown';
  const rulesetVersion = typeof opts.ruleset_version === 'string' && opts.ruleset_version.trim().length > 0
    ? opts.ruleset_version
    : IDENTITY_RULESET_VERSION;

  const roleModel = buildSemanticRoleModel(strategySynthesisResult);
  const artifact = {
    semantic_color_roles: roleModel.semantic_color_roles,
    typography_hierarchy: roleModel.typography_hierarchy,
    spacing_intent: roleModel.spacing_intent,
    visual_constraints: roleModel.visual_constraints,
    lineage: {
      ruleset_version: rulesetVersion,
      strategy_fingerprint: strategyFingerprint,
      decisions: [roleModel.lineage_decision].sort((a, b) => a.decision_id.localeCompare(b.decision_id)),
    },
  };

  const validation = validateIdentityArtifact(artifact);
  if (!validation.valid) {
    throw new Error(`compileIdentityArtifact: invalid identity artifact: ${validation.errors.join('; ')}`);
  }

  const deterministicFingerprint = buildFingerprint({ ruleset_version: rulesetVersion, artifact });

  return {
    artifact: stableSort(artifact),
    metadata: {
      ruleset_version: rulesetVersion,
      strategy_fingerprint: strategyFingerprint,
      deterministic_fingerprint: deterministicFingerprint,
    },
  };
}

module.exports = {
  IDENTITY_RULESET_VERSION,
  compileIdentityArtifact,
};
