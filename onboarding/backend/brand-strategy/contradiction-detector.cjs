'use strict';

const CONFLICT_RULES = Object.freeze([
  {
    key: 'positioning_service_model_mismatch',
    a: ['self-serve', 'self serve', 'low-touch', 'automated'],
    b: ['white-glove', 'white glove', 'high-touch', 'concierge'],
    severity: 'high',
    description: 'Positioning mixes self-serve and white-glove service models.',
  },
  {
    key: 'price_posture_mismatch',
    a: ['budget', 'affordable', 'low-cost', 'low cost', 'cheap'],
    b: ['premium', 'enterprise', 'high-end', 'high end'],
    severity: 'medium',
    description: 'Claims mix budget and premium pricing posture.',
  },
]);

function toClaimText(claim) {
  if (!claim || typeof claim !== 'object') {
    return '';
  }
  if (typeof claim.claim === 'string') {
    return claim.claim;
  }
  if (typeof claim.claim_text === 'string') {
    return claim.claim_text;
  }
  return '';
}

function sectionClaims(artifact, section) {
  const value = artifact[section];
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (section === 'messaging_pillars' && Array.isArray(value)) {
    return value.flatMap((pillar) => Array.isArray(pillar.claims) ? pillar.claims : []);
  }
  if (section === 'messaging_pillars' && !Array.isArray(value) && value && Array.isArray(value.claims)) {
    return value.claims;
  }
  if (value && typeof value === 'object' && Array.isArray(value.claims)) {
    return value.claims;
  }
  return [value];
}

function collectClaims(artifact) {
  const roots = [
    ...sectionClaims(artifact, 'positioning'),
    ...sectionClaims(artifact, 'value_promise'),
    ...sectionClaims(artifact, 'differentiators'),
    ...sectionClaims(artifact, 'messaging_pillars').flatMap((pillarOrClaim) => {
      if (pillarOrClaim && Array.isArray(pillarOrClaim.claims)) {
        return pillarOrClaim.claims;
      }
      return [pillarOrClaim];
    }),
  ];

  const normalized = [];
  roots.forEach((claim, index) => {
    const text = toClaimText(claim).trim();
    if (!text) {
      return;
    }
    const evidence = Array.isArray(claim.evidence_node_ids)
      ? claim.evidence_node_ids.filter((id) => typeof id === 'string' && id.trim().length > 0)
      : [];
    normalized.push({
      index,
      claim_text: text,
      claim_text_lc: text.toLowerCase(),
      evidence_node_ids: evidence,
    });
  });

  return normalized;
}

function hasAnyKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function detectContradictions(artifact, opts = {}) {
  const rulesetVersion = typeof opts.ruleset_version === 'string' && opts.ruleset_version.trim().length > 0
    ? opts.ruleset_version
    : '74.02.0';

  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    return [];
  }

  const claims = collectClaims(artifact);
  const annotations = [];

  for (const rule of CONFLICT_RULES) {
    const matchesA = claims.filter((claim) => hasAnyKeyword(claim.claim_text_lc, rule.a));
    const matchesB = claims.filter((claim) => hasAnyKeyword(claim.claim_text_lc, rule.b));

    if (matchesA.length === 0 || matchesB.length === 0) {
      continue;
    }

    const evidenceIds = new Set();
    const claimTexts = new Set();
    matchesA.concat(matchesB).forEach((match) => {
      claimTexts.add(match.claim_text);
      match.evidence_node_ids.forEach((id) => evidenceIds.add(id));
    });

    annotations.push({
      conflict_key: rule.key,
      severity: rule.severity,
      description: rule.description,
      ruleset_version: rulesetVersion,
      claim_texts: Array.from(claimTexts).sort((a, b) => a.localeCompare(b)),
      evidence_node_ids: Array.from(evidenceIds).sort((a, b) => a.localeCompare(b)),
    });
  }

  return annotations.sort((a, b) => a.conflict_key.localeCompare(b.conflict_key));
}

module.exports = {
  CONFLICT_RULES,
  detectContradictions,
};
