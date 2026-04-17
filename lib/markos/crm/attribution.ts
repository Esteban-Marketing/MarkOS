'use strict';

const { buildCrmTimeline } = require('./timeline.ts');

const FAMILY_WEIGHTS = Object.freeze({
  campaign_touch: 0.5,
  web_activity: 0.3,
  outbound_event: 0.2,
});

function toMoney(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Number(numeric.toFixed(2));
}

function toTimestamp(value) {
  const resolved = Date.parse(value || 0);
  return Number.isNaN(resolved) ? 0 : resolved;
}

function buildEligibleTimeline(input = {}) {
  let activities = [];
  if (Array.isArray(input.timeline)) {
    activities = input.timeline;
  } else if (Array.isArray(input.activities)) {
    activities = input.activities;
  }
  const timeline = buildCrmTimeline({
    tenant_id: input.tenant_id,
    record_kind: input.record_kind,
    record_id: input.record_id,
    activities,
    identity_links: Array.isArray(input.identity_links) ? input.identity_links : [],
  });

  return timeline.filter((entry) => Object.hasOwn(FAMILY_WEIGHTS, entry.activity_family));
}

function selectWeightedTouches(timeline) {
  const selected = [];
  const seenFamilies = new Set();
  for (const entry of timeline) {
    if (seenFamilies.has(entry.activity_family)) {
      continue;
    }
    seenFamilies.add(entry.activity_family);
    selected.push(entry);
  }
  return selected.sort((left, right) => {
    const leftWeight = FAMILY_WEIGHTS[left.activity_family] || 0;
    const rightWeight = FAMILY_WEIGHTS[right.activity_family] || 0;
    if (leftWeight !== rightWeight) {
      return rightWeight - leftWeight;
    }
    return toTimestamp(right.occurred_at || right.created_at) - toTimestamp(left.occurred_at || left.created_at);
  });
}

function normalizeWeights(entries) {
  const total = entries.reduce((sum, entry) => sum + (FAMILY_WEIGHTS[entry.activity_family] || 0), 0);
  if (total <= 0) {
    return [];
  }
  return entries.map((entry) => Object.freeze({
    activity_id: entry.activity_id,
    activity_family: entry.activity_family,
    source_event_ref: entry.source_event_ref,
    occurred_at: entry.occurred_at || entry.created_at || null,
    stitched_identity: entry.stitched_identity === true,
    weight: Number(((FAMILY_WEIGHTS[entry.activity_family] || 0) / total).toFixed(2)),
  }));
}

function computeRevenueContribution(input = {}) {
  const revenueAmount = toMoney(input.revenue_amount);
  const weight = Number(input.weight || 0);
  return Object.freeze({
    activity_family: input.activity_family,
    source_event_ref: input.source_event_ref,
    revenue_credit: toMoney(revenueAmount * weight),
    weight,
  });
}

function buildAttributionEvidence(input = {}) {
  const weights = Array.isArray(input.weights) ? input.weights : [];
  return Object.freeze(weights.map((entry) => Object.freeze({
    source_event_ref: entry.source_event_ref,
    activity_family: entry.activity_family,
    occurred_at: entry.occurred_at || null,
    stitched_identity: entry.stitched_identity === true,
    weight: entry.weight,
  })));
}

function buildWeightedAttributionModel(input = {}) {
  const eligibleTimeline = buildEligibleTimeline(input);
  const selectedTouches = selectWeightedTouches(eligibleTimeline);
  const weights = normalizeWeights(selectedTouches);
  const revenueAmount = toMoney(input.revenue_amount);
  const identityLinks = Array.isArray(input.identity_links) ? input.identity_links : [];
  let timelineEntries = [];
  if (Array.isArray(input.timeline)) {
    timelineEntries = input.timeline;
  } else if (Array.isArray(input.activities)) {
    timelineEntries = input.activities;
  }
  const contributions = weights.map((entry) => computeRevenueContribution({
    revenue_amount: revenueAmount,
    weight: entry.weight,
    activity_family: entry.activity_family,
    source_event_ref: entry.source_event_ref,
  }));
  const acceptedAnonymousIds = new Set(identityLinks
    .filter((link) => link?.tenant_id === input.tenant_id)
    .filter((link) => link?.known_record_kind === input.record_kind && link?.known_record_id === input.record_id)
    .filter((link) => link?.link_status === 'accepted')
    .map((link) => String(link.anonymous_identity_id || '').trim())
    .filter(Boolean));
  const reviewExcludedEntries = timelineEntries
    .filter((entry) => entry && typeof entry === 'object')
    .filter((entry) => Object.hasOwn(FAMILY_WEIGHTS, entry.activity_family))
    .filter((entry) => entry.anonymous_identity_id)
    .filter((entry) => !acceptedAnonymousIds.has(String(entry.anonymous_identity_id || '').trim()));
  const reviewExcludedCount = reviewExcludedEntries.length;
  const reviewExcludedRefs = Array.from(new Set(reviewExcludedEntries
    .map((entry) => String(entry.source_event_ref || '').trim())
    .filter(Boolean)));
  const reasons = [];
  if (reviewExcludedCount > 0) {
    reasons.push('review identity linkage excluded from attribution credit');
  }
  const missingFamilies = Object.keys(FAMILY_WEIGHTS).filter((family) => !weights.some((entry) => entry.activity_family === family));
  if (missingFamilies.length > 0) {
    reasons.push(`missing touch families: ${missingFamilies.join(', ')}`);
  }

  return Object.freeze({
    tenant_id: String(input.tenant_id || '').trim(),
    record_kind: String(input.record_kind || '').trim(),
    record_id: String(input.record_id || '').trim(),
    revenue_amount: revenueAmount,
    total_weight: Number(weights.reduce((sum, entry) => sum + entry.weight, 0).toFixed(2)),
    weights,
    contributions,
    evidence: buildAttributionEvidence({ weights }),
    uncredited_touch_count: reviewExcludedCount,
    readiness: Object.freeze({
      status: reasons.length > 0 ? 'degraded' : 'ready',
      reasons: Object.freeze(reasons),
      evidence_refs: Object.freeze(reviewExcludedRefs),
    }),
  });
}

module.exports = {
  FAMILY_WEIGHTS,
  buildWeightedAttributionModel,
  computeRevenueContribution,
  buildAttributionEvidence,
};