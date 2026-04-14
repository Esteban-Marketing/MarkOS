'use strict';

const { normalizeIcpSignals } = require('./icp-signal-normalizer.cjs');
const { buildIcpCandidates } = require('./icp-candidate-builder.cjs');
const { rankIcpCandidates } = require('./icp-fit-scorer.cjs');
const { determineConfidenceFlag, buildUncertaintyNotes } = require('./icp-confidence-policy.cjs');
const { createIcpRecommendation } = require('./icp-recommendation-contract.cjs');

function titleCase(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function buildSummary(winner, signals = {}) {
  const summaryBits = [];
  if (winner?.overlay_key) {
    summaryBits.push(`${titleCase(winner.overlay_key)} overlay guidance`);
  }
  if ((signals.trust_driver_tags || []).includes('proof')) {
    summaryBits.push('proof-led trust positioning');
  }
  if ((signals.desired_outcome_tags || []).length > 0) {
    summaryBits.push('pipeline-oriented outcome fit');
  }
  return `${summaryBits.join(' with ') || 'Governed ICP reasoning'} best fits this ICP.`;
}

function buildRunnerUpReason(winner, runnerUp) {
  if (!runnerUp) {
    return 'No runner-up candidate exceeded the governance floor.';
  }
  return `${runnerUp.overlay_key} ranked below ${winner.overlay_key} because its fit score and certainty were lower.`;
}

function buildIcpReasoningRecommendation(input = {}) {
  const normalizedSignals = normalizeIcpSignals(input);
  const candidates = buildIcpCandidates(normalizedSignals);
  const ranked = rankIcpCandidates(candidates, normalizedSignals);

  if (ranked.length === 0) {
    throw new Error('No ICP candidates could be generated.');
  }

  const winner = ranked[0];
  const runnerUp = ranked[1] || null;
  const confidence_flag = determineConfidenceFlag({
    topScore: winner.score,
    runnerUpScore: runnerUp?.score ?? Math.max(0, winner.score - 12),
    warnings: winner.warnings,
    hasMixedSignals: (normalizedSignals.archetype_tags || []).length > 1 || (normalizedSignals.neuro_trigger_tags || []).length > 1,
  });

  return createIcpRecommendation({
    input: normalizedSignals,
    confidence_flag,
    candidate_shortlist: ranked.slice(0, 3),
    winner: {
      ...winner,
      why_it_fits_summary: winner.why_it_fits,
    },
    explanation: {
      summary: buildSummary(winner, normalizedSignals),
      runner_up_reason: buildRunnerUpReason(winner, runnerUp),
      uncertainty: buildUncertaintyNotes({
        topScore: winner.score,
        runnerUpScore: runnerUp?.score ?? Math.max(0, winner.score - 12),
        warnings: winner.warnings,
        hasMixedSignals: confidence_flag !== 'high',
      }),
    },
  });
}

module.exports = {
  buildIcpReasoningRecommendation,
};
