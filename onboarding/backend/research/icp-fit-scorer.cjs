'use strict';

const { compareCandidates, determineConfidenceFlag } = require('./icp-confidence-policy.cjs');
const { STAGE_TRIGGER_MAP } = require('./icp-candidate-builder.cjs');

function scoreFromPresence(items = [], high = 90, medium = 70, low = 55) {
  if (!Array.isArray(items) || items.length === 0) return low;
  if (items.length >= 2) return high;
  return medium;
}

function uniqueList(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function computePainFit(signals = {}) {
  return Math.round((scoreFromPresence(signals.pain_point_tags, 92, 80, 58) + scoreFromPresence(signals.desired_outcome_tags, 90, 78, 55)) / 2);
}

function computeTrustFit(candidate, signals = {}) {
  let score = scoreFromPresence(signals.trust_driver_tags, 86, 78, 60);
  if (candidate.primary_trigger === 'B04') score += 8;
  if (candidate.primary_trigger === 'B03') score += 4;
  score -= Math.min(18, (signals.trust_blocker_tags || []).length * 6);
  return Math.max(35, Math.min(100, score));
}

function computeObjectionFit(candidate, signals = {}) {
  let score = scoreFromPresence(signals.objection_tags, 82, 72, 58);
  if (candidate.primary_trigger === 'B02' || candidate.primary_trigger === 'B04') score += 8;
  return Math.max(35, Math.min(100, score));
}

function computeStageFit(candidate, signals = {}) {
  const preferred = STAGE_TRIGGER_MAP[signals.funnel_stage] || [];
  return preferred.includes(candidate.primary_trigger) ? 92 : 60;
}

function computeTriggerAndArchetypeFit(candidate, signals = {}) {
  let score = 58;
  if ((signals.neuro_trigger_tags || []).includes(candidate.primary_trigger)) score += 22;
  if ((signals.archetype_tags || []).includes(candidate.archetype)) score += 18;
  return Math.max(35, Math.min(100, score));
}

function computeNaturalityFit(candidate, signals = {}) {
  let score = scoreFromPresence(signals.naturality_tags, 84, 76, 66);
  if (signals.neuro_profile?.manipulation_blocked !== false) score += 6;

  const businessModel = String(signals.business_model || '').trim().toLowerCase();
  if (businessModel) {
    if (businessModel.includes(candidate.overlay_key)) {
      score += 12;
    } else if (/(service|consult|agency)/.test(businessModel) && candidate.overlay_key === 'consulting') {
      score += 12;
    } else if (/(ecommerce|e-commerce|dtc|marketplace|retail)/.test(businessModel) && candidate.overlay_key === 'ecommerce') {
      score += 12;
    } else if (/(info|course|education|digital product)/.test(businessModel) && candidate.overlay_key === 'info-products') {
      score += 12;
    }
  }

  return Math.max(40, Math.min(100, score));
}

function buildWhyItFits(candidate, signals = {}) {
  const reasons = [];
  if ((signals.trust_driver_tags || []).includes('proof')) {
    reasons.push('proof-led trust cues');
  }
  if ((signals.pain_point_tags || []).length > 0) {
    reasons.push('named pain-point alignment');
  }
  if ((signals.desired_outcome_tags || []).length > 0) {
    reasons.push('clear desired-outcome fit');
  }
  if ((signals.objection_tags || []).length > 0) {
    reasons.push('objection-aware framing');
  }
  if (reasons.length === 0) {
    reasons.push('governed stage and trigger alignment');
  }
  return `${candidate.overlay_key} fits this ICP through ${reasons.join(', ')}.`;
}

function scoreIcpCandidate(candidate, signals = {}) {
  const pain_fit = computePainFit(signals);
  const trust_fit = computeTrustFit(candidate, signals);
  const objection_fit = computeObjectionFit(candidate, signals);
  const stage_fit = computeStageFit(candidate, signals);
  const trigger_fit = computeTriggerAndArchetypeFit(candidate, signals);
  const naturality_fit = computeNaturalityFit(candidate, signals);

  const total = Math.round(
    (pain_fit * 0.30)
    + (trust_fit * 0.20)
    + (objection_fit * 0.15)
    + (stage_fit * 0.15)
    + (trigger_fit * 0.15)
    + (naturality_fit * 0.05)
  );

  const unresolved_trust_blockers = uniqueList(signals.trust_blocker_tags || []);
  const warnings = [];
  if (unresolved_trust_blockers.length > 0) {
    warnings.push('Trust blockers remain and should be addressed in the final messaging.');
  }
  if ((signals.archetype_tags || []).length > 1 || (signals.neuro_trigger_tags || []).length > 1) {
    warnings.push('Multiple ICP cues are competing, so certainty is reduced.');
  }

  return {
    ...candidate,
    score: total,
    matched_signals: {
      pain_point_tags: uniqueList(signals.pain_point_tags || []),
      desired_outcome_tags: uniqueList(signals.desired_outcome_tags || []),
      trust_driver_tags: uniqueList(signals.trust_driver_tags || []),
      objection_tags: uniqueList(signals.objection_tags || []),
      neuro_trigger_tags: [candidate.primary_trigger],
      archetype_tags: candidate.archetype ? [candidate.archetype] : [],
      icp_segment_tags: uniqueList(signals.icp_segment_tags || []),
      naturality_tags: uniqueList(signals.naturality_tags || []),
    },
    why_it_fits: buildWhyItFits(candidate, signals),
    warnings,
    unresolved_trust_blockers,
    subscores: {
      pain_fit,
      trust_fit,
      objection_fit,
      stage_fit,
      trigger_fit,
      naturality_fit,
    },
  };
}

function rankIcpCandidates(candidates = [], signals = {}) {
  const scored = (Array.isArray(candidates) ? candidates : [])
    .map((candidate) => scoreIcpCandidate(candidate, signals))
    .sort(compareCandidates);

  return scored.map((entry, index, list) => ({
    ...entry,
    rank: index + 1,
    confidence: determineConfidenceFlag({
      topScore: entry.score,
      runnerUpScore: list[index + 1]?.score ?? Math.max(0, entry.score - 12),
      warnings: entry.warnings,
      hasMixedSignals: entry.unresolved_trust_blockers.length > 0,
    }),
  }));
}

module.exports = {
  scoreIcpCandidate,
  rankIcpCandidates,
};
