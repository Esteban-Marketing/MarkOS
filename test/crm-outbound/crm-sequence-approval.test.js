const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const { handleOutboundTemplates } = require('../../api/crm/outbound/templates.js');
const { handleOutboundSequences } = require('../../api/crm/outbound/sequences.js');
const { buildSequenceExecutionPlan, selectDueOutboundWork } = require('../../lib/markos/outbound/scheduler.ts');

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
  ];
}

test('CRM-06: sequence launches stay approval-aware and emit scheduled lineage instead of hidden background execution', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  seedContact(store);

  const templateReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: {
      template_key: 'follow-up-email',
      channel: 'email',
      display_name: 'Follow-up Email',
      subject: 'Checking in on next steps',
      body_markdown: 'Hi {{first_name}}, here is a quick follow-up.',
      variables: ['first_name'],
    },
  });
  const templateRes = makeRes();
  await handleOutboundTemplates(templateReq, templateRes);

  const blockedReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: {
      action: 'launch',
      sequence_key: 'revive-sequence',
      display_name: 'Revive Sequence',
      contact_id: 'contact-001',
      record_kind: 'contact',
      record_id: 'contact-001',
      risk_level: 'high',
      use_case: 'reengagement',
      steps: [
        {
          channel: 'email',
          template_key: 'follow-up-email',
          delay_minutes: 0,
        },
      ],
    },
  });
  const blockedRes = makeRes();
  await handleOutboundSequences(blockedReq, blockedRes);

  const approvedReq = makeReq({
    method: 'POST',
    auth: authFor('manager'),
    crmStore: store,
    body: {
      action: 'launch',
      sequence_key: 'revive-sequence',
      display_name: 'Revive Sequence',
      contact_id: 'contact-001',
      record_kind: 'contact',
      record_id: 'contact-001',
      risk_level: 'high',
      use_case: 'reengagement',
      approval_granted: true,
      steps: [
        {
          channel: 'email',
          template_key: 'follow-up-email',
          delay_minutes: 0,
        },
        {
          channel: 'email',
          template_key: 'follow-up-email',
          delay_minutes: 1440,
        },
      ],
    },
  });
  const approvedRes = makeRes();
  await handleOutboundSequences(approvedReq, approvedRes);

  const plan = buildSequenceExecutionPlan({
    tenant_id: 'tenant-alpha-001',
    contact_id: 'contact-001',
    sequence_key: 'revive-sequence',
    steps: approvedRes.body.sequence.steps,
    launched_at: approvedRes.body.plan.launched_at,
  });
  const dueNow = selectDueOutboundWork(store, {
    tenant_id: 'tenant-alpha-001',
    as_of: approvedRes.body.plan.launched_at,
  });

  assert.equal(templateRes.statusCode, 200);
  assert.equal(blockedRes.statusCode, 409);
  assert.equal(blockedRes.body.error, 'CRM_OUTBOUND_APPROVAL_REQUIRED');
  assert.equal(approvedRes.statusCode, 200);
  assert.equal(plan.steps.length, 2);
  assert.equal(dueNow.length, 1);
  assert.equal(dueNow[0].sequence_key, 'revive-sequence');
  assert.equal(dueNow[0].status, 'scheduled');
});
