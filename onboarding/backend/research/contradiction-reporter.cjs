'use strict';

function normalizeText(value) {
  return String(value || '').trim();
}

function detectEvidenceContradictions(items = []) {
  const contradictions = [];
  const internalItems = items.filter((item) => item.authority_class === 'approved_internal');
  const externalItems = items.filter((item) => item.authority_class === 'external_official' || item.authority_class === 'external_secondary');

  for (const internalItem of internalItems) {
    for (const externalItem of externalItems) {
      const sameTopic = normalizeText(internalItem.topic || 'general') === normalizeText(externalItem.topic || 'general');
      const differentClaim = normalizeText(internalItem.claim).toLowerCase() !== normalizeText(externalItem.claim).toLowerCase();

      if (!sameTopic || !differentClaim) {
        continue;
      }

      contradictions.push({
        kind: 'contradiction',
        topic: normalizeText(internalItem.topic || 'general'),
        internal_claim: internalItem.claim,
        external_claim: externalItem.claim,
        freshness: {
          internal: internalItem.freshness || null,
          external: externalItem.freshness || null,
        },
        confidence: {
          internal: Number(internalItem.confidence || 0),
          external: Number(externalItem.confidence || 0),
        },
        recommendation: 'surface_in_patch_preview',
      });
    }
  }

  return contradictions;
}

module.exports = {
  detectEvidenceContradictions,
};
