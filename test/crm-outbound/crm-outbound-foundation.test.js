require('../helpers/ts-register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const {
  getOutboundChannelCapabilities,
  normalizeOutboundProviderEvent,
} = require('../../lib/markos/outbound/providers/base-adapter.ts');
const { createResendAdapter } = require('../../lib/markos/outbound/providers/resend-adapter.ts');
const { createTwilioAdapter } = require('../../lib/markos/outbound/providers/twilio-adapter.ts');
const { handleOutboundSend } = require('../../api/crm/outbound/send.js');

function authFor(role, tenantId = 'tenant-alpha-001', actorId = `${role}-actor-001`) {
  return {
    tenant_id: tenantId,
    iamRole: role,
    principal: {
      id: actorId,
      tenant_id: tenantId,
      tenant_role: role,
    },
  };
}

function makeReq({ method = 'GET', auth = null, crmStore = null, body = {}, query = {}, outboundProviders = null, brandPackConfig = null } = {}) {
  return {
    method,
    body,
    query,
    crmStore,
    markosAuth: auth,
    outboundProviders,
    brandPackConfig,
  };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    writeHead(code) { this.statusCode = code; },
    end(payload) { this.body = JSON.parse(payload); },
  };
}

function seedContact(store, tenantId = 'tenant-alpha-001') {
  createCrmEntity(store, {
    entity_id: 'contact-001',
    tenant_id: tenantId,
    record_kind: 'contact',
    display_name: 'Ada Lovelace',
    attributes: {
      email: 'ada@example.com',
      phone: '+15551230000',
      whatsapp_number: '+15551230000',
      whatsapp_window_open: true,
    },
  });

  store.outboundConsentRecords = [
    {
      consent_id: 'consent-email-001',
      tenant_id: tenantId,
      contact_id: 'contact-001',
      channel: 'email',
      status: 'subscribed',
      lawful_basis: 'marketing',
      verified_at: '2026-04-04T12:00:00.000Z',
    },
    {
      consent_id: 'consent-sms-001',
      tenant_id: tenantId,
      contact_id: 'contact-001',
      channel: 'sms',
      status: 'opted_in',
      lawful_basis: 'marketing',
      verified_at: '2026-04-04T12:00:00.000Z',
    },
    {
      consent_id: 'consent-whatsapp-001',
      tenant_id: tenantId,
      contact_id: 'contact-001',
      channel: 'whatsapp',
      status: 'opted_in',
      lawful_basis: 'marketing',
      verified_at: '2026-04-04T12:00:00.000Z',
    },
  ];
}

test('CRM-05: outbound foundation sends real email, sms, and whatsapp requests with provider-normalized audit lineage', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  seedContact(store);

  const resendCalls = [];
  const twilioCalls = [];
  const outboundProviders = {
    email: createResendAdapter({
      apiKey: 'resend-test-key',
      defaultFrom: 'team@markos.test',
      fetchImpl: async (url, options) => {
        resendCalls.push({ url, options });
        return {
          ok: true,
          async json() {
            return { id: 're_msg_001' };
          },
        };
      },
    }),
    sms: createTwilioAdapter({
      accountSid: 'ACtest123',
      authToken: 'twilio-secret',
      defaultFromSms: '+15550001111',
      defaultFromWhatsApp: 'whatsapp:+15550002222',
      fetchImpl: async (url, options) => {
        twilioCalls.push({ url, options });
        return {
          ok: true,
          async json() {
            return { sid: `SM${String(twilioCalls.length).padStart(3, '0')}`, status: 'queued' };
          },
        };
      },
    }),
    whatsapp: createTwilioAdapter({
      accountSid: 'ACtest123',
      authToken: 'twilio-secret',
      defaultFromSms: '+15550001111',
      defaultFromWhatsApp: 'whatsapp:+15550002222',
      fetchImpl: async (url, options) => {
        twilioCalls.push({ url, options });
        return {
          ok: true,
          async json() {
            return { sid: `SM${String(twilioCalls.length).padStart(3, '0')}`, status: 'queued' };
          },
        };
      },
    }),
  };

  const emailReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    outboundProviders,
    brandPackConfig: { label: 'Alpha Brand', overrides: { 'color.action.primary': '#123456' } },
    body: {
      contact_id: 'contact-001',
      record_kind: 'contact',
      record_id: 'contact-001',
      channel: 'email',
      subject: 'Pricing follow-up',
      body_markdown: 'Here is the recap and next step.',
      use_case: 'marketing',
    },
  });
  const emailRes = makeRes();
  await handleOutboundSend(emailReq, emailRes);

  const smsReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    outboundProviders,
    body: {
      contact_id: 'contact-001',
      record_kind: 'contact',
      record_id: 'contact-001',
      channel: 'sms',
      body_markdown: 'Quick check-in before tomorrow.',
      use_case: 'marketing',
    },
  });
  const smsRes = makeRes();
  await handleOutboundSend(smsReq, smsRes);

  const whatsappReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    outboundProviders,
    body: {
      contact_id: 'contact-001',
      record_kind: 'contact',
      record_id: 'contact-001',
      channel: 'whatsapp',
      body_markdown: 'Your onboarding checklist is ready.',
      template_key: 'onboarding-checklist',
      use_case: 'marketing',
    },
  });
  const whatsappRes = makeRes();
  await handleOutboundSend(whatsappReq, whatsappRes);

  assert.equal(emailRes.statusCode, 200);
  assert.equal(emailRes.body.send.provider, 'resend');
  assert.equal(emailRes.body.send.provider_message_id, 're_msg_001');
  assert.equal(emailRes.body.send.channel, 'email');
  assert.equal(smsRes.statusCode, 200);
  assert.equal(smsRes.body.send.provider, 'twilio');
  assert.equal(smsRes.body.send.channel, 'sms');
  assert.equal(whatsappRes.statusCode, 200);
  assert.equal(whatsappRes.body.send.provider, 'twilio');
  assert.equal(whatsappRes.body.send.channel, 'whatsapp');
  assert.equal(store.outboundMessages.length, 3);
  assert.equal(store.activities.filter((item) => item.activity_family === 'outbound_event').length, 3);
  assert.match(resendCalls[0].url, /resend/i);
  assert.match(twilioCalls[0].url, /twilio/i);
  assert.match(String(twilioCalls[1].options.body), /whatsapp/i);
});

test('CRM-05: outbound provider normalization preserves channel capabilities and inbound status semantics', async () => {
  assert.deepEqual(getOutboundChannelCapabilities('email'), {
    channel: 'email',
    provider: 'resend',
    supports_subject: true,
    supports_templates: true,
    supports_replies: true,
  });
  assert.deepEqual(getOutboundChannelCapabilities('sms'), {
    channel: 'sms',
    provider: 'twilio',
    supports_subject: false,
    supports_templates: false,
    supports_replies: true,
  });

  const resendAdapter = createResendAdapter({ apiKey: 'resend-test-key' });
  const twilioAdapter = createTwilioAdapter({ accountSid: 'ACtest123', authToken: 'twilio-secret' });

  const deliveredEmail = normalizeOutboundProviderEvent(resendAdapter, {
    type: 'email.delivered',
    data: { email_id: 're_msg_123', to: ['ada@example.com'] },
  });
  const inboundWhatsapp = normalizeOutboundProviderEvent(twilioAdapter, {
    SmsSid: 'SM999',
    MessageStatus: 'received',
    From: 'whatsapp:+15551230000',
    To: 'whatsapp:+15550002222',
    Body: 'Sounds good.',
  });

  assert.equal(deliveredEmail.provider, 'resend');
  assert.equal(deliveredEmail.status, 'delivered');
  assert.equal(inboundWhatsapp.provider, 'twilio');
  assert.equal(inboundWhatsapp.status, 'received');
  assert.equal(inboundWhatsapp.direction, 'inbound');
});

test('CRM-06: high-risk outbound sends fail closed until approval is explicitly granted', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  seedContact(store);

  const req = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: {
      contact_id: 'contact-001',
      record_kind: 'contact',
      record_id: 'contact-001',
      channel: 'sms',
      body_markdown: 'We miss you. Here is a last-chance offer.',
      use_case: 'reengagement',
      risk_level: 'high',
    },
  });
  const res = makeRes();
  await handleOutboundSend(req, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, 'CRM_OUTBOUND_APPROVAL_REQUIRED');
  assert.equal(store.activities.filter((item) => item.activity_family === 'outbound_event').length, 1);
  assert.equal(store.activities[0].payload_json.outcome, 'blocked');
});