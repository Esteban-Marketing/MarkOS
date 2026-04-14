'use strict';

const { scoreCandidate } = require('./evaluation-score-policy.cjs');

function compareScoredCandidates(left, right) {
  return (
    right.total - left.total
    || right.breakdown.grounding - left.breakdown.grounding
    || right.breakdown.evidence_sufficiency - left.breakdown.evidence_sufficiency
    || right.breakdown.personalization - left.breakdown.personalization
    || right.breakdown.delta_safety - left.breakdown.delta_safety
    || right.breakdown.efficiency - left.breakdown.efficiency
  );
}

function describeCandidate(candidate, nextCandidate) {
  if (!candidate) return null;

  const reasons = [];
  if (!nextCandidate || candidate.breakdown.grounding >= nextCandidate.breakdown.grounding) {
    reasons.push('stronger grounding');
  }
  if (!nextCandidate || candidate.breakdown.evidence_sufficiency >= nextCandidate.breakdown.evidence_sufficiency) {
    reasons.push('better evidence sufficiency');
  }
  if (!nextCandidate || candidate.breakdown.personalization >= nextCandidate.breakdown.personalization) {
    reasons.push('stronger personalization fit');
  }

  const reason = reasons.length > 0
    ? `Selected for ${reasons.join(', ')} over efficiency alone.`
    : 'Selected after a conservative evidence-first comparison.';

  return {
    provider: candidate.provider,
    score: candidate.total,
    band: 'winner',
    reason,
  };
}

function rankProviderCandidates(candidates = []) {
  const scored = (Array.isArray(candidates) ? candidates : [])
    .map((candidate) => scoreCandidate(candidate))
    .sort(compareScoredCandidates);

  const bestRaw = scored[0] || null;
  const runnerRaw = scored[1] || null;
  const bestCandidate = describeCandidate(bestRaw, runnerRaw);
  const runnerUp = runnerRaw
    ? {
        provider: runnerRaw.provider,
        score: runnerRaw.total,
        band: 'runner_up',
        reason: 'Runner-up: evidence remained solid but the winner had stronger grounding.',
      }
    : null;

  const scoreBreakdown = scored.map((entry) => ({
    provider: entry.provider,
    total: entry.total,
    grounding: entry.breakdown.grounding,
    evidence_sufficiency: entry.breakdown.evidence_sufficiency,
    personalization: entry.breakdown.personalization,
    delta_safety: entry.breakdown.delta_safety,
    efficiency: entry.breakdown.efficiency,
    decision_band: entry.decision_band,
  }));

  return {
    best_candidate: bestCandidate,
    runner_up: runnerUp,
    score_breakdown: scoreBreakdown,
  };
}

module.exports = {
  rankProviderCandidates,
};
