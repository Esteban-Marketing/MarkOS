'use strict';

const CONFIDENCE_FLAGS = Object.freeze(['high', 'medium', 'low']);

function determineConfidenceFlag(input = {}) {
  const topScore = Number(input.topScore || 0);
  const runnerUpScore = Number(input.runnerUpScore || 0);
  const margin = topScore - runnerUpScore;
  const warnings = Array.isArray(input.warnings) ? input.warnings : [];
  const hasMixedSignals = input.hasMixedSignals === true;

  if (topScore >= 80 && margin >= 10 && warnings.length === 0 && !hasMixedSignals) {
    return 'high';
  }

  if (topScore >= 62 && margin >= 4) {
    return 'medium';
  }

  return 'low';
}

function buildUncertaintyNotes(input = {}) {
  const notes = [];
  const flag = determineConfidenceFlag(input);
  const topScore = Number(input.topScore || 0);
  const runnerUpScore = Number(input.runnerUpScore || 0);
  const warnings = Array.isArray(input.warnings) ? input.warnings : [];

  if (flag !== 'high') {
    notes.push('Evidence is mixed enough that the recommendation should be reviewed before broad reuse.');
  }

  if ((topScore - runnerUpScore) < 5) {
    notes.push('Winner margin is narrow versus the runner-up option.');
  }

  for (const warning of warnings) {
    if (!notes.includes(warning)) {
      notes.push(warning);
    }
  }

  return notes;
}

function compareCandidates(left, right) {
  const scoreDiff = Number(right.score || 0) - Number(left.score || 0);
  if (scoreDiff !== 0) return scoreDiff;

  const painDiff = Number(right.subscores?.pain_fit || 0) - Number(left.subscores?.pain_fit || 0);
  if (painDiff !== 0) return painDiff;

  const trustBlockerDiff = (left.unresolved_trust_blockers || []).length - (right.unresolved_trust_blockers || []).length;
  if (trustBlockerDiff !== 0) return trustBlockerDiff;

  return String(left.candidate_id || '').localeCompare(String(right.candidate_id || ''));
}

module.exports = {
  CONFIDENCE_FLAGS,
  determineConfidenceFlag,
  buildUncertaintyNotes,
  compareCandidates,
};
