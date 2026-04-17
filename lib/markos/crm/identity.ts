'use strict';

const { crmIdentityLinkStatuses } = require('./contracts.ts');

const ALLOWED_LINK_STATUSES = new Set(crmIdentityLinkStatuses);

function clampConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(1, numeric));
}

function scoreIdentityCandidate(candidate) {
  const input = candidate && typeof candidate === 'object' ? candidate : {};
  let confidence = 0;
  if (input.email_exact_match) confidence += 0.65;
  if (input.domain_match) confidence += 0.15;
  if (input.device_match) confidence += 0.1;
  if (input.session_overlap) confidence += 0.1;
  if (input.form_submitted) confidence += 0.15;
  confidence = clampConfidence(confidence);
  let recommended_decision = 'rejected';
  if (confidence >= 0.8) {
    recommended_decision = 'accepted';
  } else if (confidence >= 0.4) {
    recommended_decision = 'review';
  }
  return Object.freeze({
    confidence: Number(confidence.toFixed(2)),
    recommended_decision,
  });
}

function createIdentityLink(store, input) {
  if (!store || typeof store !== 'object') {
    throw new Error('CRM_STORE_REQUIRED');
  }
  if (!Array.isArray(store.identityLinks)) {
    store.identityLinks = [];
  }
  const linkStatus = String(input.link_status || 'candidate').trim();
  const link = Object.freeze({
    identity_link_id: String(input.identity_link_id || `identity-link-${store.identityLinks.length + 1}`),
    tenant_id: String(input.tenant_id || '').trim(),
    anonymous_identity_id: String(input.anonymous_identity_id || '').trim(),
    known_record_kind: String(input.known_record_kind || '').trim(),
    known_record_id: String(input.known_record_id || '').trim(),
    confidence: clampConfidence(input.confidence),
    link_status: linkStatus,
    source_event_ref: String(input.source_event_ref || '').trim(),
    reviewer_actor_id: input.reviewer_actor_id ? String(input.reviewer_actor_id).trim() : null,
    created_at: new Date(input.created_at || Date.now()).toISOString(),
  });
  if (!link.tenant_id || !link.anonymous_identity_id || !link.known_record_kind || !link.known_record_id || !link.source_event_ref || !ALLOWED_LINK_STATUSES.has(linkStatus)) {
    throw new Error('CRM_IDENTITY_LINK_INVALID');
  }
  store.identityLinks.push(link);
  return link;
}

module.exports = {
  createIdentityLink,
  scoreIdentityCandidate,
};
