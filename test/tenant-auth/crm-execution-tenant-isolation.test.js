const test = require('node:test');
const assert = require('node:assert/strict');

const { createCrmEntity } = require('../../lib/markos/crm/api.cjs');
const { handleExecutionRecommendations } = require('../../api/crm/execution/recommendations.js');
const { handleExecutionQueues } = require('../../api/crm/execution/queues.js');

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

test('CRM tenant isolation: execution recommendations hide foreign-tenant records', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'deal-alpha',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'deal',
    display_name: 'Alpha Deal',
    attributes: { owner_actor_id: 'manager-actor-001', amount: 1000 },
  });
  createCrmEntity(store, {
    entity_id: 'deal-beta',
    tenant_id: 'tenant-beta-002',
    record_kind: 'deal',
    display_name: 'Beta Deal',
    attributes: { owner_actor_id: 'manager-actor-002', amount: 2000 },
  });

  const req = makeReq({ method: 'GET', auth: authFor('manager', 'tenant-alpha-001', 'manager-actor-001'), crmStore: store });
  const res = makeRes();
  await handleExecutionRecommendations(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.recommendations.length, 1);
  assert.equal(res.body.recommendations[0].record_id, 'deal-alpha');
});

test('CRM tenant isolation: execution queues fail closed without tenant context', async () => {
  const req = makeReq({ method: 'GET', auth: { iamRole: 'manager', principal: { id: 'actor-001', tenant_role: 'manager' } }, crmStore: { entities: [], activities: [], identityLinks: [] } });
  const res = makeRes();
  await handleExecutionQueues(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'TENANT_CONTEXT_REQUIRED');
});

test('CRM tenant isolation: queue scope stays tenant-bound even for manager or team mode', async () => {
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  createCrmEntity(store, {
    entity_id: 'customer-alpha',
    tenant_id: 'tenant-alpha-001',
    record_kind: 'customer',
    display_name: 'Alpha Customer',
    attributes: { health_score: 40, renewal_at: '2026-04-10T00:00:00.000Z' },
  });
  createCrmEntity(store, {
    entity_id: 'customer-beta',
    tenant_id: 'tenant-beta-002',
    record_kind: 'customer',
    display_name: 'Beta Customer',
    attributes: { health_score: 35, renewal_at: '2026-04-10T00:00:00.000Z' },
  });

  const req = makeReq({
    method: 'GET',
    auth: authFor('manager', 'tenant-alpha-001', 'manager-actor-001'),
    crmStore: store,
    query: { scope: 'team' },
  });
  const res = makeRes();
  await handleExecutionQueues(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.scope, 'team');
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].record_id, 'customer-alpha');
});