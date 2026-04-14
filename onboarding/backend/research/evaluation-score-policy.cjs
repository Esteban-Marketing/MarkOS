'use strict';

const SCORE_WEIGHTS = Object.freeze({
  grounding: 0.34,
  evidence_sufficiency: 0.27,
  personalization: 0.18,
  delta_safety: 0.14,
  efficiency: 0.07,
});

const QUALITY_DIMENSION_KEYS = Object.freeze([
  'personalization_depth',
  'icp_fit',
  'neuro_fit',
  'naturality',
  'specificity',
  'grounded_usefulness',
]);

const QUALITY_DIMENSION_FLOORS = Object.freeze({
  personalization_depth: 80,
  icp_fit: 80,
  neuro_fit: 75,
  naturality: 75,
  specificity: 80,
  grounded_usefulness: 80,
});

const QUALITY_BLOCK_FLOORS = Object.freeze({
  personalization_depth: 50,
  icp_fit: 50,
  neuro_fit: 45,
  naturality: 50,
  specificity: 50,
  grounded_usefulness: 50,
});

function clampScore(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function unique(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function getRequiredFix(dimension) {
  const fixes = {
    personalization_depth: 'Tie the draft more directly to the matched ICP pain and desired outcome.',
    icp_fit: 'Carry the Phase 98 winner rationale and audience-specific language through the draft.',
    neuro_fit: 'Use governed trigger language only when it fits the ICP and stays evidence-aware.',
    naturality: 'Rewrite in a plainspoken, low-hype tone that sounds specific and human.',
    specificity: 'Replace abstract claims with concrete mechanics, proof, and real constraints.',
    grounded_usefulness: 'Add an actionable, evidence-aware next step instead of vague polish.',
  };

  return fixes[dimension] || 'Improve the failing quality dimension before promotion.';
}

function buildQualityDimensions(candidate = {}) {
  const signals = candidate.quality_signals && typeof candidate.quality_signals === 'object'
    ? candidate.quality_signals
    : {};

  return {
    personalization_depth: clampScore(signals.personalization_depth, clampScore(candidate.personalization, 0)),
    icp_fit: clampScore(signals.icp_fit, clampScore(candidate.icp_fit, clampScore(candidate.personalization, 0))),
    neuro_fit: clampScore(signals.neuro_fit, clampScore(candidate.neuro_fit, clampScore(candidate.delta_safety, 0))),
    naturality: clampScore(signals.naturality, clampScore(candidate.naturality, Math.round((clampScore(candidate.personalization, 0) + clampScore(candidate.delta_safety, 0)) / 2))),
    specificity: clampScore(signals.specificity, clampScore(candidate.specificity, clampScore(candidate.evidence_sufficiency, 0))),
    grounded_usefulness: clampScore(signals.grounded_usefulness, clampScore(candidate.grounded_usefulness, Math.round((clampScore(candidate.grounding, 0) + clampScore(candidate.evidence_sufficiency, 0)) / 2))),
  };
}

function scoreQualityDimensions(candidate = {}, options = {}) {
  const quality_dimensions = buildQualityDimensions(candidate);
  const failed_dimensions = [];
  const blocked_dimensions = [];
  const blocking_reasons = [];
  const required_fixes = [];

  for (const dimension of QUALITY_DIMENSION_KEYS) {
    const score = quality_dimensions[dimension];
    if (score < QUALITY_DIMENSION_FLOORS[dimension]) {
      failed_dimensions.push(dimension);
      required_fixes.push(getRequiredFix(dimension));
    }
    if (score < QUALITY_BLOCK_FLOORS[dimension]) {
      blocked_dimensions.push(dimension);
    }
  }

  if (options.tailoringGate?.status === 'rewrite_required') {
    blocking_reasons.push({
      code: 'TAILORING_REWRITE_REQUIRED',
      detail: 'Shared tailoring review already requires a rewrite before promotion can proceed.',
    });
  }

  if (blocked_dimensions.length > 0) {
    blocking_reasons.push({
      code: 'QUALITY_DIMENSION_BLOCKED',
      detail: `Quality dimensions below block floor: ${blocked_dimensions.join(', ')}`,
    });
  }

  const overall_score = Math.round(
    QUALITY_DIMENSION_KEYS.reduce((sum, key) => sum + quality_dimensions[key], 0) / QUALITY_DIMENSION_KEYS.length,
  );

  const status = blocking_reasons.length > 0
    ? 'rewrite_required'
    : failed_dimensions.length > 0
      ? 'warnings'
      : 'passed';

  return {
    overall_score,
    quality_dimensions,
    quality_gate: {
      status,
      pass_floors: { ...QUALITY_DIMENSION_FLOORS },
      block_floors: { ...QUALITY_BLOCK_FLOORS },
      failed_dimensions,
      blocking_reasons,
      required_fixes: unique([
        ...required_fixes,
        ...(Array.isArray(options.tailoringGate?.required_fixes) ? options.tailoringGate.required_fixes : []),
      ]),
    },
  };
}

function decisionBandFromTotal(total, hardBlocked = false) {
  if (hardBlocked) return 'blocked';
  if (total >= 85) return 'promotable';
  if (total >= 65) return 'review_required';
  return 'blocked';
}

function scoreCandidate(candidate = {}, options = {}) {
  const breakdown = {
    grounding: clampScore(candidate.grounding),
    evidence_sufficiency: clampScore(candidate.evidence_sufficiency),
    personalization: clampScore(candidate.personalization),
    delta_safety: clampScore(candidate.delta_safety),
    efficiency: clampScore(candidate.efficiency),
  };

  const total = Math.round(
    Object.entries(SCORE_WEIGHTS).reduce((sum, [key, weight]) => sum + (breakdown[key] * weight), 0),
  );

  const quality = scoreQualityDimensions(candidate, options);
  const hardBlocked = options.hardBlocked === true || quality.quality_gate.status === 'rewrite_required';
  const decision_band = decisionBandFromTotal(total, hardBlocked);

  return {
    provider: String(candidate.provider || 'unknown_provider'),
    total,
    score: total,
    breakdown,
    decision_band,
    hard_blocked: hardBlocked,
    quality_dimensions: quality.quality_dimensions,
    quality_gate: quality.quality_gate,
  };
}

module.exports = {
  SCORE_WEIGHTS,
  QUALITY_DIMENSION_KEYS,
  QUALITY_DIMENSION_FLOORS,
  QUALITY_BLOCK_FLOORS,
  decisionBandFromTotal,
  scoreCandidate,
  scoreQualityDimensions,
};
