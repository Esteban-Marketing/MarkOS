'use strict';

const crypto = require('crypto');

const SEMANTIC_ROLESETS = Object.freeze([
  Object.freeze({
    'brand.primary': '#0d9488',
    'brand.secondary': '#0f766e',
    'surface.default': '#ffffff',
    'text.primary': '#0f172a',
    'text.inverse': '#f8fafc',
    'state.accent': '#f59e0b',
  }),
  Object.freeze({
    'brand.primary': '#2563eb',
    'brand.secondary': '#1d4ed8',
    'surface.default': '#ffffff',
    'text.primary': '#111827',
    'text.inverse': '#f9fafb',
    'state.accent': '#f97316',
  }),
  Object.freeze({
    'brand.primary': '#7c3aed',
    'brand.secondary': '#6d28d9',
    'surface.default': '#ffffff',
    'text.primary': '#1f2937',
    'text.inverse': '#f9fafb',
    'state.accent': '#0ea5e9',
  }),
]);

const TYPOGRAPHY_ROLESETS = Object.freeze([
  Object.freeze({
    'type.display': Object.freeze({ family: 'Sora', step: 'xl', weight: 700, line_height: 1.2 }),
    'type.heading': Object.freeze({ family: 'Sora', step: 'lg', weight: 600, line_height: 1.25 }),
    'type.body': Object.freeze({ family: 'Space Grotesk', step: 'md', weight: 400, line_height: 1.5 }),
    'type.caption': Object.freeze({ family: 'Space Grotesk', step: 'sm', weight: 500, line_height: 1.4 }),
  }),
  Object.freeze({
    'type.display': Object.freeze({ family: 'Manrope', step: 'xl', weight: 700, line_height: 1.2 }),
    'type.heading': Object.freeze({ family: 'Manrope', step: 'lg', weight: 600, line_height: 1.25 }),
    'type.body': Object.freeze({ family: 'Inter', step: 'md', weight: 400, line_height: 1.5 }),
    'type.caption': Object.freeze({ family: 'Inter', step: 'sm', weight: 500, line_height: 1.4 }),
  }),
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function stableHash(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

function chooseIndex(fingerprint, modulo) {
  const hash = stableHash(fingerprint || 'phase-75-default');
  const prefix = hash.slice(0, 8);
  const parsed = Number.parseInt(prefix, 16);
  if (Number.isNaN(parsed) || modulo <= 0) {
    return 0;
  }
  return parsed % modulo;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function collectLineageDecision(strategyArtifact) {
  const nodes = new Set();

  const claimCollections = [];
  if (strategyArtifact && strategyArtifact.positioning) {
    claimCollections.push([strategyArtifact.positioning]);
  }
  if (strategyArtifact && strategyArtifact.value_promise) {
    claimCollections.push([strategyArtifact.value_promise]);
  }
  claimCollections.push(asArray(strategyArtifact && strategyArtifact.differentiators));
  claimCollections.push(asArray(strategyArtifact && strategyArtifact.disallowed_claims));
  claimCollections.push(asArray(strategyArtifact && strategyArtifact.confidence_notes));

  asArray(strategyArtifact && strategyArtifact.messaging_pillars).forEach((pillar) => {
    claimCollections.push(asArray(pillar && pillar.claims));
  });

  claimCollections.forEach((claims) => {
    asArray(claims).forEach((claim) => {
      asArray(claim && claim.evidence_node_ids).forEach((nodeId) => {
        const normalized = String(nodeId || '').trim();
        if (normalized) {
          nodes.add(normalized);
        }
      });
    });
  });

  const sortedNodeIds = Array.from(nodes).sort((a, b) => a.localeCompare(b));

  return Object.freeze({
    decision_id: 'semantic-role-projection',
    strategy_node_ids: sortedNodeIds.length > 0 ? sortedNodeIds : ['strategy:unknown'],
  });
}

function buildSemanticRoleModel(strategySynthesisResult) {
  const strategyFingerprint = strategySynthesisResult
    && strategySynthesisResult.metadata
    && strategySynthesisResult.metadata.deterministic_fingerprint
    ? strategySynthesisResult.metadata.deterministic_fingerprint
    : '';

  const colorIndex = chooseIndex(strategyFingerprint, SEMANTIC_ROLESETS.length);
  const typographyIndex = chooseIndex(`${strategyFingerprint}:type`, TYPOGRAPHY_ROLESETS.length);

  return {
    semantic_color_roles: clone(SEMANTIC_ROLESETS[colorIndex]),
    typography_hierarchy: clone(TYPOGRAPHY_ROLESETS[typographyIndex]),
    spacing_intent: {
      scale: [4, 8, 12, 16, 24],
      rhythm: '4pt-baseline',
    },
    visual_constraints: {
      max_palette_size: 8,
      corner_radius_policy: 'soft-rounded',
    },
    lineage_decision: collectLineageDecision(strategySynthesisResult && strategySynthesisResult.artifact),
  };
}

module.exports = {
  buildSemanticRoleModel,
};
