'use strict';

const crypto = require('crypto');
const { detectContradictions } = require('./contradiction-detector.cjs');

const STRATEGY_RULESET_VERSION = '74.02.0';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstSentence(text) {
  const value = String(text || '').trim();
  if (!value) {
    return '';
  }
  const cut = value.indexOf('.');
  return cut === -1 ? value : value.slice(0, cut + 1);
}

function stableHash(input) {
  return crypto.createHash('sha256').update(String(input || ''), 'utf8').digest('hex');
}

function rankEvidence(normalizedSegments) {
  const scored = [];

  asArray(normalizedSegments).forEach((segment) => {
    const payload = segment && segment.payload && typeof segment.payload === 'object' ? segment.payload : {};
    const segmentName = String(payload.segment_name || segment.segment_id || '').trim();
    const nodeKey = String(segment.node_key || '').trim();
    if (!segmentName || !nodeKey) {
      return;
    }

    const pains = asArray(payload.pains).filter((entry) => entry && entry.pain);
    const needs = asArray(payload.needs).filter((entry) => entry && entry.need);
    const expectations = asArray(payload.expectations).filter((entry) => entry && entry.expectation);
    const outcomes = asArray(payload.desired_outcomes).filter((entry) => typeof entry === 'string' && entry.trim().length > 0);

    const score = (pains.length * 4) + (needs.length * 3) + (expectations.length * 2) + outcomes.length;

    scored.push({
      node_key: nodeKey,
      segment_name: segmentName,
      score,
      pains,
      needs,
      expectations,
      outcomes,
    });
  });

  return scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.node_key.localeCompare(b.node_key);
  });
}

function buildClaim(claim, evidenceNodeIds) {
  return {
    claim,
    evidence_node_ids: Array.from(new Set(asArray(evidenceNodeIds))).sort((a, b) => a.localeCompare(b)),
  };
}

function synthesizeStrategyArtifact(tenantId, normalizedBrandData, opts = {}) {
  if (!tenantId) {
    throw new Error('synthesizeStrategyArtifact: tenantId is required');
  }
  if (!normalizedBrandData || typeof normalizedBrandData !== 'object') {
    throw new Error('synthesizeStrategyArtifact: normalizedBrandData is required');
  }

  const rulesetVersion = typeof opts.ruleset_version === 'string' && opts.ruleset_version.trim().length > 0
    ? opts.ruleset_version
    : STRATEGY_RULESET_VERSION;

  const ranked = rankEvidence(normalizedBrandData.normalized_segments);
  if (ranked.length === 0) {
    throw new Error('synthesizeStrategyArtifact: no normalized segments available');
  }

  const top = ranked[0];
  const secondary = ranked[1] || ranked[0];
  const allEvidence = ranked.map((entry) => entry.node_key);

  const topNeed = top.needs[0] && top.needs[0].need ? String(top.needs[0].need) : 'reliable outcomes';
  const topPain = top.pains[0] && top.pains[0].pain ? String(top.pains[0].pain) : 'fragmented execution';
  const topExpectation = top.expectations[0] && top.expectations[0].expectation
    ? String(top.expectations[0].expectation)
    : 'clear guidance';
  const topOutcome = top.outcomes[0] || 'faster execution confidence';

  const positioning = buildClaim(
    `For ${top.segment_name}, we position around ${topExpectation.toLowerCase()} without sacrificing governance rigor.`,
    [top.node_key]
  );

  const valuePromise = buildClaim(
    `${top.segment_name} teams convert ${topPain.toLowerCase()} into ${topOutcome.toLowerCase()} by prioritizing ${topNeed.toLowerCase()}.`,
    [top.node_key, secondary.node_key]
  );

  const differentiators = [
    buildClaim(
      `Deterministic strategy synthesis preserves lineage for ${top.segment_name} evidence.`,
      [top.node_key]
    ),
    buildClaim(
      `Tenant-scoped compilation keeps guidance stable across ${secondary.segment_name} and adjacent segments.`,
      [secondary.node_key]
    ),
  ];

  const messagingPillars = [
    {
      pillar: 'Evidence-grounded clarity',
      claims: [
        buildClaim(
          firstSentence(`Lead with ${topNeed.toLowerCase()} and cite concrete segment evidence before channel execution.`),
          [top.node_key]
        ),
      ],
    },
    {
      pillar: 'Governed confidence',
      claims: [
        buildClaim(
          firstSentence(`Avoid unsupported certainty; frame confidence using explicit evidence from ${secondary.segment_name}.`),
          [secondary.node_key]
        ),
      ],
    },
  ];

  const disallowedClaims = [
    buildClaim('Guarantee universal outcomes without segment evidence.', allEvidence),
  ];

  const confidenceNotes = [
    buildClaim(
      `Confidence is highest for ${top.segment_name}; retain caution when extrapolating beyond ranked segments.`,
      [top.node_key, secondary.node_key]
    ),
  ];

  const artifact = {
    ruleset_version: rulesetVersion,
    positioning,
    value_promise: valuePromise,
    differentiators,
    messaging_pillars: messagingPillars,
    disallowed_claims: disallowedClaims,
    confidence_notes: confidenceNotes,
    conflict_annotations: [],
  };

  const conflicts = detectContradictions(artifact, { ruleset_version: rulesetVersion });
  artifact.conflict_annotations = conflicts;

  const deterministicFingerprint = stableHash(JSON.stringify({
    ruleset_version: rulesetVersion,
    artifact,
  }));

  return {
    artifact,
    metadata: {
      tenant_id: tenantId,
      ruleset_version: rulesetVersion,
      content_fingerprint: normalizedBrandData.content_fingerprint || null,
      deterministic_fingerprint: deterministicFingerprint,
      ranked_evidence_node_ids: ranked.map((entry) => entry.node_key),
    },
  };
}

module.exports = {
  STRATEGY_RULESET_VERSION,
  synthesizeStrategyArtifact,
};
