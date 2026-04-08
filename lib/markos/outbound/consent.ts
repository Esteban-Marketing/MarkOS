'use strict';

const { getCrmStore, listCrmEntities } = require('../crm/api.cjs');

const OPT_OUT_STATUSES = new Set(['opted_out', 'unsubscribed', 'revoked']);
const EMAIL_ALLOWED_STATUSES = new Set(['subscribed', 'transactional']);
const PHONE_ALLOWED_STATUSES = new Set(['opted_in']);

function normalizeChannel(channel) {
  const normalized = String(channel || '').trim().toLowerCase();
  if (!['email', 'sms', 'whatsapp'].includes(normalized)) {
    throw new Error(`CRM_OUTBOUND_CHANNEL_INVALID:${channel}`);
  }
  return normalized;
}

function ensureOutboundConsentStore(store) {
  const targetStore = getCrmStore({ crmStore: store });
  if (!Array.isArray(targetStore.outboundConsentRecords)) {
    targetStore.outboundConsentRecords = [];
  }
  return targetStore;
}

function getContactRecord(store, tenantId, contactId) {
  return listCrmEntities(store, { tenant_id: tenantId, record_kind: 'contact' }).find((record) => record.entity_id === contactId) || null;
}

function getConsentRecord(store, tenantId, contactId, channel) {
  return store.outboundConsentRecords.find((row) => row.tenant_id === tenantId && row.contact_id === contactId && row.channel === channel) || null;
}

function getContactPoint(contact, channel) {
  const attributes = contact?.attributes || {};
  if (channel === 'email') {
    return String(attributes.email || '').trim();
  }
  if (channel === 'sms') {
    return String(attributes.phone || '').trim();
  }
  return String(attributes.whatsapp_number || attributes.phone || '').trim();
}

function buildEligibilityResult(partial) {
  return Object.freeze({
    allowed: false,
    requires_approval: false,
    reason_code: 'CONSENT_REQUIRED',
    contact: null,
    consent: null,
    contact_point: '',
    ...partial,
  });
}

function evaluateOutboundEligibility(store, input = {}) {
  const targetStore = ensureOutboundConsentStore(store);
  const tenantId = String(input.tenant_id || '').trim();
  const contactId = String(input.contact_id || '').trim();
  const channel = normalizeChannel(input.channel);
  const useCase = String(input.use_case || 'marketing').trim().toLowerCase();
  const riskLevel = String(input.risk_level || 'standard').trim().toLowerCase();
  const approvalGranted = input.approval_granted === true || input.approved === true;

  const contact = getContactRecord(targetStore, tenantId, contactId);
  if (!contact) {
    return buildEligibilityResult({ reason_code: 'CONTACT_NOT_FOUND' });
  }

  const contactPoint = getContactPoint(contact, channel);
  if (!contactPoint) {
    return buildEligibilityResult({
      reason_code: 'CONTACT_POINT_MISSING',
      contact,
      contact_point: '',
    });
  }

  const consent = getConsentRecord(targetStore, tenantId, contactId, channel);
  if (!consent) {
    return buildEligibilityResult({
      reason_code: 'CONSENT_REQUIRED',
      contact,
      contact_point: contactPoint,
    });
  }

  const consentStatus = String(consent.status || '').trim().toLowerCase();
  if (consentStatus === 'ambiguous' || consentStatus === 'pending') {
    return buildEligibilityResult({
      reason_code: 'CONSENT_AMBIGUOUS',
      contact,
      consent,
      contact_point: contactPoint,
    });
  }
  if (OPT_OUT_STATUSES.has(consentStatus)) {
    return buildEligibilityResult({
      reason_code: 'CONSENT_OPTED_OUT',
      contact,
      consent,
      contact_point: contactPoint,
    });
  }

  if (channel === 'email' && !EMAIL_ALLOWED_STATUSES.has(consentStatus)) {
    return buildEligibilityResult({
      reason_code: 'CONSENT_REQUIRED',
      contact,
      consent,
      contact_point: contactPoint,
    });
  }

  if ((channel === 'sms' || channel === 'whatsapp') && !PHONE_ALLOWED_STATUSES.has(consentStatus)) {
    return buildEligibilityResult({
      reason_code: 'CONSENT_REQUIRED',
      contact,
      consent,
      contact_point: contactPoint,
    });
  }

  if (channel === 'whatsapp' && input.template_key === undefined && contact.attributes?.whatsapp_window_open !== true) {
    return buildEligibilityResult({
      reason_code: 'WHATSAPP_WINDOW_CLOSED',
      contact,
      consent,
      contact_point: contactPoint,
    });
  }

  const requiresApproval = riskLevel === 'high' || useCase === 'reengagement' || Number(input.bulk_size || 1) > 1;
  if (requiresApproval && !approvalGranted) {
    return buildEligibilityResult({
      reason_code: 'APPROVAL_REQUIRED',
      requires_approval: true,
      contact,
      consent,
      contact_point: contactPoint,
    });
  }

  return buildEligibilityResult({
    allowed: true,
    requires_approval: false,
    reason_code: 'ALLOWED',
    contact,
    consent,
    contact_point: contactPoint,
  });
}

function recordOutboundOptOut(store, input = {}) {
  const targetStore = ensureOutboundConsentStore(store);
  const tenantId = String(input.tenant_id || '').trim();
  const contactId = String(input.contact_id || '').trim();
  const channel = normalizeChannel(input.channel);
  const now = new Date().toISOString();
  const nextRecord = Object.freeze({
    consent_id: String(input.consent_id || `consent-${tenantId}-${contactId}-${channel}`),
    tenant_id: tenantId,
    contact_id: contactId,
    channel,
    status: 'opted_out',
    lawful_basis: String(input.lawful_basis || 'marketing').trim(),
    verified_at: input.verified_at || null,
    unsubscribed_at: now,
    opt_out_reason: String(input.reason || 'unspecified').trim(),
    updated_by: input.actor_id ? String(input.actor_id).trim() : null,
    updated_at: now,
  });

  const existingIndex = targetStore.outboundConsentRecords.findIndex((row) => row.tenant_id === tenantId && row.contact_id === contactId && row.channel === channel);
  if (existingIndex >= 0) {
    targetStore.outboundConsentRecords.splice(existingIndex, 1, nextRecord);
  } else {
    targetStore.outboundConsentRecords.push(nextRecord);
  }
  return nextRecord;
}

module.exports = {
  evaluateOutboundEligibility,
  recordOutboundOptOut,
};