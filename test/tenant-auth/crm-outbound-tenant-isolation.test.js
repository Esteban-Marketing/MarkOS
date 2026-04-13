require('../helpers/ts-register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
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

function makeReq({ method = 'GET', auth = null, crmStore = null, body = {}, query = {} } = {}) {
  return {
    method,
    body,
    query,
    crmStore,
    markosAuth: auth,
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

test('CRM tenant isolation: outbound send fails closed without tenant context', async () => {
  const req = makeReq({
    method: 'POST',
    auth: { iamRole: 'manager', principal: { id: 'manager-actor-001', tenant_role: 'manager' } },
    crmStore: { entities: [], activities: [], identityLinks: [], outboundConsentRecords: [] },
    body: { channel: 'email', contact_id: 'contact-001', record_kind: 'contact', record_id: 'contact-001', body_markdown: 'Hello' },
  });
  const res = makeRes();
  await handleOutboundSend(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'TENANT_CONTEXT_REQUIRED');
});

test('CRM tenant isolation: outbound send cannot target a foreign-tenant contact', async () => {
  const store = { entities: [], activities: [], identityLinks: [], outboundConsentRecords: [] };
  createCrmEntity(store, {
    entity_id: 'contact-beta',
    tenant_id: 'tenant-beta-002',
    record_kind: 'contact',
    display_name: 'Beta Contact',
    attributes: { email: 'beta@example.com', phone: '+15550009999' },
  });

  const req = makeReq({
    method: 'POST',
    auth: authFor('manager', 'tenant-alpha-001', 'manager-actor-001'),
    crmStore: store,
    body: {
      channel: 'email',
      contact_id: 'contact-beta',
      record_kind: 'contact',
      record_id: 'contact-beta',
      subject: 'Hello',
      body_markdown: 'This should fail closed.',
    },
  });
  const res = makeRes();
  await handleOutboundSend(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error, 'CRM_OUTBOUND_CONTACT_NOT_FOUND');
});

test('CRM tenant isolation: readonly roles cannot perform outbound sends even with valid contact consent', async () => {
  const store = { entities: [], activities: [], identityLinks: [], outboundConsentRecords: [] };
  createCrmEntity(store, {
    entity_id: 'contact-001',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    display_name: 'Ada Lovelace',
    attributes: { email: 'ada@example.com' },
  });
  store.outboundConsentRecords.push({
    consent_id: 'consent-email-001',
    tenant_id: 'tenant-alpha-001',
    contact_id: 'contact-001',
    channel: 'email',
    status: 'subscribed',
  });

  const req = makeReq({
    method: 'POST',
    auth: authFor('readonly'),
    crmStore: store,
    body: {
      channel: 'email',
      contact_id: 'contact-001',
      record_kind: 'contact',
      record_id: 'contact-001',
      subject: 'Hello',
      body_markdown: 'Permission checks should block this.',
    },
  });
  const res = makeRes();
  await handleOutboundSend(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'CRM_MUTATION_FORBIDDEN');
});