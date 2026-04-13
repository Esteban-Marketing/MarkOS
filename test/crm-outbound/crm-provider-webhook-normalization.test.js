require('../helpers/ts-register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const { handleResendWebhook } = require('../../api/webhooks/resend-events.js');
const { handleTwilioWebhook } = require('../../api/webhooks/twilio-events.js');
const { normalizeOutboundEventForLedger } = require('../../lib/markos/outbound/events.ts');

function makeReq({ method = 'POST', crmStore = null, body = {} } = {}) {
  return { method, crmStore, body };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    writeHead(code) { this.statusCode = code; },
    end(payload) { this.body = JSON.parse(payload); },
  };
}

test('CRM-05: provider webhook normalization maps resend delivery and twilio opt-out into one CRM-native ledger model', async () => {
  const store = {
    entities: [],
    activities: [],
    identityLinks: [],
    mergeDecisions: [],
    mergeLineage: [],
    outboundMessages: [
      {
        outbound_id: 'outbound-tenant-alpha-001-0001',
        tenant_id: 'tenant-alpha-001',
        contact_id: 'contact-001',
        record_kind: 'contact',
        record_id: 'contact-001',
        channel: 'email',
        provider: 'resend',
        provider_message_id: 're_msg_001',
        status: 'sent',
        outcome: 'sent',
        body_markdown: 'Checking in.',
        created_by: 'manager-actor-001',
        created_at: '2026-04-04T12:00:00.000Z',
        updated_at: '2026-04-04T12:00:00.000Z',
      },
      {
        outbound_id: 'outbound-tenant-alpha-001-0002',
        tenant_id: 'tenant-alpha-001',
        contact_id: 'contact-002',
        record_kind: 'contact',
        record_id: 'contact-002',
        channel: 'sms',
        provider: 'twilio',
        provider_message_id: 'SM002',
        status: 'sent',
        outcome: 'sent',
        body_markdown: 'Short note.',
        created_by: 'manager-actor-001',
        created_at: '2026-04-04T12:00:00.000Z',
        updated_at: '2026-04-04T12:00:00.000Z',
      },
    ],
    outboundConversations: [],
    outboundConsentRecords: [
      {
        consent_id: 'consent-contact-002',
        tenant_id: 'tenant-alpha-001',
        contact_id: 'contact-002',
        channel: 'sms',
        status: 'opted_in',
      },
    ],
  };

  createCrmEntity(store, {
    entity_id: 'contact-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    display_name: 'Ada Lovelace',
    attributes: { email: 'ada@example.com' },
  });
  createCrmEntity(store, {
    entity_id: 'contact-002',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    display_name: 'Grace Hopper',
    attributes: { phone: '+15551230001' },
  });

  const resendRes = makeRes();
  await handleResendWebhook(makeReq({
    crmStore: store,
    body: {
      type: 'email.delivered',
      data: { email_id: 're_msg_001', to: ['ada@example.com'] },
    },
  }), resendRes);

  const twilioRes = makeRes();
  await handleTwilioWebhook(makeReq({
    crmStore: store,
    body: {
      SmsSid: 'SM002',
      MessageStatus: 'received',
      From: '+15551230001',
      To: '+15550000000',
      Body: 'STOP',
    },
  }), twilioRes);

  const normalized = normalizeOutboundEventForLedger({
    provider: 'resend',
    payload: {
      type: 'email.delivered',
      data: { email_id: 're_msg_001', to: ['ada@example.com'] },
    },
  });

  assert.equal(resendRes.statusCode, 200);
  assert.equal(twilioRes.statusCode, 200);
  assert.equal(normalized.status, 'delivered');
  assert.equal(store.activities.filter((item) => item.activity_family === 'outbound_event').length, 2);
  assert.equal(store.outboundConsentRecords.find((item) => item.contact_id === 'contact-002' && item.channel === 'sms').status, 'opted_out');
});
