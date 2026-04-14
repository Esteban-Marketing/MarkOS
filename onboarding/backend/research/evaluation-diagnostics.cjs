'use strict';

const { normalizeDiagnostic } = require('../brand-governance/governance-diagnostics.cjs');

const EVALUATION_CODES = Object.freeze({
  GROUNDING_BLOCKED: 'GROUNDING_BLOCKED',
  ROUTE_TRACE_MISSING: 'ROUTE_TRACE_MISSING',
  PROVIDER_AUDIT_MISSING: 'PROVIDER_AUDIT_MISSING',
  CONTRADICTION_REVIEW_REQUIRED: 'CONTRADICTION_REVIEW_REQUIRED',
  ARTIFACT_WARNING: 'ARTIFACT_WARNING',
  UNSUPPORTED_NEURO_LANGUAGE: 'UNSUPPORTED_NEURO_LANGUAGE',
  MANIPULATIVE_NEURO_POSTURE: 'MANIPULATIVE_NEURO_POSTURE',
  EVIDENCE_REQUIRED: 'EVIDENCE_REQUIRED',
  BASELINE_REGRESSION: 'BASELINE_REGRESSION',
});

function toDiagnostic(code, detail, severity = 'warning') {
  return {
    ...normalizeDiagnostic(code, detail),
    severity,
  };
}

function hasCitation(evidence = []) {
  return Array.isArray(evidence) && evidence.some((entry) => String(entry?.citation || '').trim());
}

function collectArtifactIssues(preview = {}, index = 0) {
  const artifactId = String(preview.artifact_id || `artifact-${index + 1}`);
  const warnings = Array.isArray(preview.warnings) ? preview.warnings.slice() : [];
  const contradictions = Array.isArray(preview.contradictions) ? preview.contradictions : [];
  const blockers = [];
  const diagnostics = [];

  if (!hasCitation(preview.evidence)) {
    blockers.push(EVALUATION_CODES.GROUNDING_BLOCKED);
    diagnostics.push(toDiagnostic(EVALUATION_CODES.GROUNDING_BLOCKED, `Artifact ${artifactId} is missing citation-backed evidence.`, 'blocker'));
    diagnostics.push(toDiagnostic(EVALUATION_CODES.EVIDENCE_REQUIRED, `Artifact ${artifactId} must include evidence refs before promotion.`, 'blocker'));
  }

  if (contradictions.length > 0) {
    if (!blockers.includes(EVALUATION_CODES.GROUNDING_BLOCKED)) {
      warnings.push('contradictions require review');
    }
    diagnostics.push(toDiagnostic(EVALUATION_CODES.CONTRADICTION_REVIEW_REQUIRED, `Artifact ${artifactId} includes contradiction flags that need operator review.`, blockers.length > 0 ? 'blocker' : 'warning'));
  }

  for (const warning of warnings) {
    diagnostics.push(toDiagnostic(EVALUATION_CODES.ARTIFACT_WARNING, `Artifact ${artifactId}: ${warning}`, 'warning'));
  }

  return { artifact_id: artifactId, warnings, blockers, diagnostics };
}

function collectTextDiagnostics(draft = '') {
  const text = String(draft || '').trim();
  if (!text) return [];

  const diagnostics = [];

  if (/(dopamine|cortisol|oxytocin|brain[- ]?hack)/i.test(text)) {
    diagnostics.push(toDiagnostic(
      EVALUATION_CODES.UNSUPPORTED_NEURO_LANGUAGE,
      'Unsupported neuro language appeared without governed evidence or safe framing.',
      'blocker',
    ));
  }

  if (/(force action|pressure buyers|fear[^.]{0,20}now|manipulative|shame|coerce)/i.test(text)) {
    diagnostics.push(toDiagnostic(
      EVALUATION_CODES.MANIPULATIVE_NEURO_POSTURE,
      'Manipulative pressure tactics are not allowed in premium-quality output.',
      'blocker',
    ));
  }

  return diagnostics;
}

function collectRunDiagnostics(input = {}) {
  const previews = Array.isArray(input.previews) ? input.previews : [];
  const routeTrace = Array.isArray(input.route_trace) ? input.route_trace : [];
  const providerAttempts = Array.isArray(input.provider_attempts) ? input.provider_attempts : [];
  const draft = String(input.draft || input.text || input.output || '');

  const diagnostics = [];

  if (routeTrace.length === 0) {
    diagnostics.push(
      toDiagnostic(EVALUATION_CODES.ROUTE_TRACE_MISSING, 'Route trace is required for auditability.', 'blocker'),
      toDiagnostic(EVALUATION_CODES.GROUNDING_BLOCKED, 'Grounding is blocked because route trace is missing.', 'blocker'),
    );
  }

  if (providerAttempts.length === 0) {
    diagnostics.push(toDiagnostic(EVALUATION_CODES.PROVIDER_AUDIT_MISSING, 'Provider attempt audit trail is missing.', 'warning'));
  }

  diagnostics.push(...collectTextDiagnostics(draft));

  for (let index = 0; index < previews.length; index += 1) {
    diagnostics.push(...collectArtifactIssues(previews[index], index).diagnostics);
  }

  const seen = new Set();
  return diagnostics.filter((entry) => {
    const key = `${entry.code}:${entry.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasBlockingDiagnostics(diagnostics = []) {
  return diagnostics.some((entry) => entry.severity === 'blocker' || entry.code === EVALUATION_CODES.GROUNDING_BLOCKED);
}

module.exports = {
  EVALUATION_CODES,
  collectArtifactIssues,
  collectRunDiagnostics,
  hasBlockingDiagnostics,
};
