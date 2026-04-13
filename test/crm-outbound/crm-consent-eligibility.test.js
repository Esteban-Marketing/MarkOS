require('../helpers/ts-register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const {
  evaluateOutboundEligibility,
  recordOutboundOptOut,
} = require('../../lib/markos/outbound/consent.ts');

function seedContact(store) {
  createCrmEntity(store, {
    entity_id: 'contact-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    display_name: 'Ada Lovelace',
    attributes: {
      email: 'ada@example.com',
      phone: '+15551230000',
      whatsapp_number: '+15551230000',
      whatsapp_window_open: false,
    },
  });
}

test('CRM-05: channel-specific eligibility fails closed for missing or ambiguous consent', () => {
  const store = { entities: [], activities: [], identityLinks: [] };
  seedContact(store);
  store.outboundConsentRecords = [
    {
      consent_id: 'consent-email-001',
      tenant_id: 'tenant-alpha-001',
      contact_id: 'contact-001',
      channel: 'email',
      status: 'ambiguous',
    },
  ];

  const emailResult = evaluateOutboundEligibility(store, {
    tenant_id: 'tenant-alpha-001',
    contact_id: 'contact-001',
    channel: 'email',
    use_case: 'marketing',
  });
  const smsResult = evaluateOutboundEligibility(store, {
    tenant_id: 'tenant-alpha-001',
    contact_id: 'contact-001',
    channel: 'sms',
    use_case: 'marketing',
  });

  assert.equal(emailResult.allowed, false);
  assert.equal(emailResult.reason_code, 'CONSENT_AMBIGUOUS');
  assert.equal(smsResult.allowed, false);
  assert.equal(smsResult.reason_code, 'CONSENT_REQUIRED');
});

test('CRM-05: whatsapp eligibility stays channel-specific and approval-aware', () => {
  const store = { entities: [], activities: [], identityLinks: [] };
  seedContact(store);
  store.outboundConsentRecords = [
    {
      consent_id: 'consent-wa-001',
      tenant_id: 'tenant-alpha-001',
      contact_id: 'contact-001',
      channel: 'whatsapp',
      status: 'opted_in',
      verified_at: '2026-04-04T12:00:00.000Z',
    },
  ];

  const blockedWindow = evaluateOutboundEligibility(store, {
    tenant_id: 'tenant-alpha-001',
    contact_id: 'contact-001',
    channel: 'whatsapp',
    use_case: 'marketing',
  });
  const approvalRequired = evaluateOutboundEligibility(store, {
    tenant_id: 'tenant-alpha-001',
    contact_id: 'contact-001',
    channel: 'whatsapp',
    use_case: 'reengagement',
    template_key: 'promo-revive',
    risk_level: 'high',
  });

  assert.equal(blockedWindow.allowed, false);
  assert.equal(blockedWindow.reason_code, 'WHATSAPP_WINDOW_CLOSED');
  assert.equal(approvalRequired.allowed, false);
  assert.equal(approvalRequired.requires_approval, true);
  assert.equal(approvalRequired.reason_code, 'APPROVAL_REQUIRED');
});

test('CRM-06: opt-out writes immutable channel state for later blocked sends', () => {
  const store = { entities: [], activities: [], identityLinks: [] };
  seedContact(store);
  store.outboundConsentRecords = [
    {
      consent_id: 'consent-sms-001',
      tenant_id: 'tenant-alpha-001',
      contact_id: 'contact-001',
      channel: 'sms',
      status: 'opted_in',
    },
  ];

  const optOut = recordOutboundOptOut(store, {
    tenant_id: 'tenant-alpha-001',
    contact_id: 'contact-001',
    channel: 'sms',
    actor_id: 'manager-actor-001',
    reason: 'customer_requested',
  });
  const blocked = evaluateOutboundEligibility(store, {
    tenant_id: 'tenant-alpha-001',
    contact_id: 'contact-001',
    channel: 'sms',
    use_case: 'marketing',
  });

  assert.equal(optOut.status, 'opted_out');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason_code, 'CONSENT_OPTED_OUT');
});