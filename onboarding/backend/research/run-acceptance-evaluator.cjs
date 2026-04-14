'use strict';

const { createEvaluationEnvelope } = require('./evaluation-contract.cjs');
const { rankProviderCandidates } = require('./provider-comparison-engine.cjs');
const { flagArtifacts } = require('./artifact-governance-flagger.cjs');
const { collectRunDiagnostics, hasBlockingDiagnostics } = require('./evaluation-diagnostics.cjs');
const { evaluateQualityCloseoutGate } = require('./quality-closeout-gate.cjs');

function uniqueDiagnostics(entries = []) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.code}:${entry.detail}:${entry.severity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function selectBestCandidate(candidates = [], bestCandidate = null) {
  if (!Array.isArray(candidates) || candidates.length === 0) return {};
  if (!bestCandidate?.provider) return candidates[0];
  return candidates.find((candidate) => String(candidate.provider || '') === String(bestCandidate.provider || '')) || candidates[0];
}

function evaluateResearchRun(input = {}) {
  const previews = Array.isArray(input.previews) ? input.previews : [];
  const candidates = Array.isArray(input.candidates) ? input.candidates : [];
  const ranking = rankProviderCandidates(candidates);
  const artifactFlags = flagArtifacts(previews);
  const diagnostics = collectRunDiagnostics({
    previews,
    route_trace: input.route_trace,
    provider_attempts: input.provider_attempts,
    draft: input.draft || input.output || input.text,
  });

  const bestCandidateInput = selectBestCandidate(candidates, ranking.best_candidate);
  const qualityCloseout = evaluateQualityCloseoutGate({
    run_id: input.run_id,
    candidate: bestCandidateInput,
    best_candidate: ranking.best_candidate,
    runner_up: ranking.runner_up,
    score_breakdown: ranking.score_breakdown,
    artifact_flags: artifactFlags,
    previews,
    route_trace: input.route_trace,
    provider_attempts: input.provider_attempts,
    draft: input.draft || input.output || input.text,
    contextPack: input.contextPack || input.context_pack,
    reasoning: input.reasoning,
    baseline_regressions: input.baseline_regressions,
    override: input.override || null,
  });

  const mergedDiagnostics = uniqueDiagnostics([
    ...diagnostics,
    ...(Array.isArray(qualityCloseout.governance_diagnostics) ? qualityCloseout.governance_diagnostics : []),
  ]);

  const anyBlockedArtifact = artifactFlags.some((flag) => flag.status === 'blocked');
  const hasBlockers = anyBlockedArtifact || hasBlockingDiagnostics(mergedDiagnostics) || qualityCloseout.decision === 'blocked';
  const bestScore = Number(ranking.best_candidate?.score || 0);
  const allArtifactsOk = artifactFlags.every((flag) => flag.status === 'ok');

  let decision = qualityCloseout.decision || 'review_required';
  if (hasBlockers) {
    decision = 'blocked';
  } else if (bestScore >= 85 && allArtifactsOk && qualityCloseout.quality_gate?.status === 'passed') {
    decision = 'promotable';
  } else {
    decision = 'review_required';
  }

  return createEvaluationEnvelope({
    run_id: input.run_id,
    best_candidate: ranking.best_candidate,
    runner_up: ranking.runner_up,
    decision,
    score_breakdown: ranking.score_breakdown,
    artifact_flags: artifactFlags,
    governance_diagnostics: mergedDiagnostics,
    route_trace: Array.isArray(input.route_trace) ? input.route_trace : [],
    provider_attempts: Array.isArray(input.provider_attempts) ? input.provider_attempts : [],
    override: input.override || null,
    review: qualityCloseout.review,
    quality_dimensions: qualityCloseout.quality_dimensions,
    quality_gate: qualityCloseout.quality_gate,
    baseline_regressions: qualityCloseout.baseline_regressions,
    closeout_readiness: qualityCloseout.closeout_readiness,
  });
}

module.exports = {
  evaluateResearchRun,
};
