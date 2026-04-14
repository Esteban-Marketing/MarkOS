'use strict';

const { normalizeEvidenceItem } = require('./research-orchestration-contract.cjs');

const AUTHORITY_PRIORITY = Object.freeze({
  approved_internal: 0,
  internal_recent: 1,
  external_official: 2,
  external_secondary: 3,
  synthesized_inference: 4,
});

function compareEvidence(left, right) {
  const leftAuthority = AUTHORITY_PRIORITY[left.authority_class] ?? 99;
  const rightAuthority = AUTHORITY_PRIORITY[right.authority_class] ?? 99;
  if (leftAuthority !== rightAuthority) {
    return leftAuthority - rightAuthority;
  }

  const leftFreshness = Date.parse(left.freshness || 0) || 0;
  const rightFreshness = Date.parse(right.freshness || 0) || 0;
  if (rightFreshness !== leftFreshness) {
    return rightFreshness - leftFreshness;
  }

  return Number(right.confidence || 0) - Number(left.confidence || 0);
}

function mergeEvidenceItems(items = []) {
  const deduped = new Map();

  for (const item of items.map((entry) => normalizeEvidenceItem(entry))) {
    const key = `${item.topic || 'general'}::${item.citation || item.claim}`;
    if (!deduped.has(key)) {
      deduped.set(key, item);
      continue;
    }

    const current = deduped.get(key);
    deduped.set(key, compareEvidence(item, current) < 0 ? item : current);
  }

  return Array.from(deduped.values()).sort(compareEvidence);
}

module.exports = {
  mergeEvidenceItems,
};
