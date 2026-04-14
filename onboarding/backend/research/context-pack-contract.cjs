'use strict';

function normalizeToken(value) {
  return String(value || '').trim();
}

function normalizeEvidenceItem(item = {}) {
  return {
    authority: normalizeToken(item.authority) || 'approved_internal',
    citation: normalizeToken(item.citation) || 'unknown',
    source_type: normalizeToken(item.source_type) || 'internal',
  };
}

function cloneObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return JSON.parse(JSON.stringify(value));
}

function createContextPack(input = {}) {
  const findings = Array.isArray(input.findings) ? input.findings : [];
  const claims = Array.isArray(input.claims)
    ? input.claims
    : findings.map((finding) => ({ claim: normalizeToken(finding.claim) || '' }));

  return {
    summary: normalizeToken(input.summary) || '',
    findings: findings.map((finding) => ({
      claim: normalizeToken(finding.claim) || '',
      confidence: normalizeToken(finding.confidence) || 'medium',
      freshness: normalizeToken(finding.freshness) || null,
      implication: normalizeToken(finding.implication) || '',
      evidence: Array.isArray(finding.evidence) ? finding.evidence.map(normalizeEvidenceItem) : [],
    })),
    claims,
    evidence: Array.isArray(input.evidence) ? input.evidence.map(normalizeEvidenceItem) : [],
    contradictions: Array.isArray(input.contradictions) ? input.contradictions : [],
    active_filters: cloneObject(input.active_filters),
    tailoring_signals: cloneObject(input.tailoring_signals),
  };
}

module.exports = {
  createContextPack,
};
