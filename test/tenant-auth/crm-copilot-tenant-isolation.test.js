const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const { handleCopilotContext } = require('../../api/crm/copilot/context.js');
const { handleCopilotSummaries } = require('../../api/crm/copilot/summaries.js');

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
  return { method, body, query, crmStore, markosAuth: auth };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    writeHead(code) { this.statusCode = code; },
    end(payload) { this.body = JSON.parse(payload); },
  };
}

test('CRM tenant isolation: copilot context hides foreign-tenant records and summaries', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [], outboundMessages: [], outboundConversations: [] };
  createCrmEntity(store, {
    entity_id: 'deal-alpha',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { amount: 1000 },
  });
  createCrmEntity(store, {
    entity_id: 'deal-beta',
    tenant_id: 'tenant-beta-002',
    record_kind: 'deal',
    display_name: 'Beta Deal',
    attributes: { amount: 2000 },
  });

  const contextReq = makeReq({
    method: 'GET',
    auth: authFor('manager', 'tenant-alpha-001', 'manager-actor-001'),
    crmStore: store,
    query: { record_kind: 'deal', record_id: 'deal-alpha' },
  });
  const contextRes = makeRes();
  await handleCopilotContext(contextReq, contextRes);

  const summaryReq = makeReq({
    method: 'GET',
    auth: authFor('manager', 'tenant-alpha-001', 'manager-actor-001'),
    crmStore: store,
    query: { record_kind: 'deal', record_id: 'deal-alpha' },
  });
  const summaryRes = makeRes();
  await handleCopilotSummaries(summaryReq, summaryRes);

  assert.equal(contextRes.statusCode, 200);
  assert.equal(contextRes.body.grounding.record.entity_id, 'deal-alpha');
  assert.equal(summaryRes.statusCode, 200);
  assert.equal(summaryRes.body.summary.record_id, 'deal-alpha');
  assert.ok(!summaryRes.body.summary.summary_text.includes('Beta Deal'));
});

test('CRM tenant isolation: copilot APIs fail closed without tenant context', async () => {
  const req = makeReq({ method: 'GET', auth: { iamRole: 'manager', principal: { id: 'actor-001', tenant_role: 'manager' } }, crmStore: { entities: [], activities: [], identityLinks: [] } });
  const res = makeRes();
  await handleCopilotContext(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'TENANT_CONTEXT_REQUIRED');
});

test('CRM tenant isolation: cross-tenant copilot review requires explicit owner authorization', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'deal-beta',
    tenant_id: 'tenant-beta-002',
    record_kind: 'deal',
    display_name: 'Beta Deal',
    attributes: { amount: 2000 },
  });

  const deniedReq = makeReq({
    method: 'GET',
    auth: authFor('manager', 'tenant-alpha-001', 'manager-actor-001'),
    crmStore: store,
    query: { record_kind: 'deal', record_id: 'deal-beta', review_tenant_id: 'tenant-beta-002' },
  });
  const deniedRes = makeRes();
  await handleCopilotContext(deniedReq, deniedRes);

  const allowedReq = makeReq({
    method: 'GET',
    auth: authFor('owner', 'tenant-alpha-001', 'owner-actor-001'),
    crmStore: store,
    query: { record_kind: 'deal', record_id: 'deal-beta', review_tenant_id: 'tenant-beta-002' },
  });
  const allowedRes = makeRes();
  await handleCopilotContext(allowedReq, allowedRes);

  assert.equal(deniedRes.statusCode, 403);
  assert.equal(deniedRes.body.error, 'CRM_COPILOT_OVERSIGHT_FORBIDDEN');
  assert.equal(allowedRes.statusCode, 200);
  assert.equal(allowedRes.body.target_tenant_id, 'tenant-beta-002');
});