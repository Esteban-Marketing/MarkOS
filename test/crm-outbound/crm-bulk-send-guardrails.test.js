const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const { handleBulkOutboundSend } = require('../../api/crm/outbound/bulk-send.js');

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

function makeReq({ method = 'GET', auth = null, crmStore = null, body = {}, query = {}, outboundProviders = null } = {}) {
  return {
    method,
    body,
    query,
    crmStore,
    markosAuth: auth,
    outboundProviders,
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

function seedContact(store, id, consentStatus) {
  createCrmEntity(store, {
    entity_id: id,
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    display_name: `Contact ${id}`,
    attributes: {
      email: `${id}@example.com`,
      phone: '+15551230000',
      whatsapp_window_open: true,
    },
  });
  store.outboundConsentRecords.push({
    consent_id: `consent-${id}`,
    tenant_id: 'tenant-alpha-001',
    contact_id: id,
    channel: 'email',
    status: consentStatus,
  });
}

test('CRM-06: bulk send fails closed without approval and preserves per-message lineage for eligible contacts', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [], outboundConsentRecords: [] };
  seedContact(store, 'contact-001', 'subscribed');
  seedContact(store, 'contact-002', 'ambiguous');
  seedContact(store, 'contact-003', 'subscribed');

  const blockedReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: {
      channel: 'email',
      contact_ids: ['contact-001', 'contact-002', 'contact-003'],
      record_kind: 'contact',
      use_case: 'marketing',
      subject: 'Quarterly update',
      body_markdown: 'Here is the current update.',
    },
  });
  const blockedRes = makeRes();
  await handleBulkOutboundSend(blockedReq, blockedRes);

  const approvedReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: {
      channel: 'email',
      contact_ids: ['contact-001', 'contact-002', 'contact-003'],
      record_kind: 'contact',
      use_case: 'marketing',
      subject: 'Quarterly update',
      body_markdown: 'Here is the current update.',
      approval_granted: true,
      schedule_at: '2026-04-05T09:00:00.000Z',
    },
  });
  const approvedRes = makeRes();
  await handleBulkOutboundSend(approvedReq, approvedRes);

  assert.equal(blockedRes.statusCode, 409);
  assert.equal(blockedRes.body.error, 'CRM_OUTBOUND_APPROVAL_REQUIRED');
  assert.equal(approvedRes.statusCode, 200);
  assert.equal(approvedRes.body.bulk.approval_required, true);
  assert.equal(approvedRes.body.bulk.total_contacts, 3);
  assert.equal(approvedRes.body.bulk.eligible_contacts, 2);
  assert.equal(approvedRes.body.bulk.blocked_contacts, 1);
  assert.equal(store.outboundBulkSends.length, 1);
  assert.equal(store.outboundQueue.length, 2);
  assert.equal(store.outboundQueue[0].bulk_send_id, approvedRes.body.bulk.bulk_send_id);
});
