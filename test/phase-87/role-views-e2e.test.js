'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const handlers = require('../../onboarding/backend/handlers.cjs');

function createRes() {
  return {
    statusCode: 0,
    body: null,
    writeHead(statusCode) {
      this.statusCode = statusCode;
    },
    end(payload) {
      this.body = JSON.parse(payload);
    },
  };
}

function createAuditStore(artifacts) {
  const rows = Array.isArray(artifacts) ? artifacts.slice() : [];
  const logs = [];

  return {
    logs,
    async append(entry) {
      logs.push({ ...entry });
      return entry;
    },
    async getAll(filter) {
      const tenantId = filter && filter.tenantId ? String(filter.tenantId) : '';
      if (!tenantId) {
        return rows.slice();
      }
      return rows.filter((row) => String(row.tenant_id) === tenantId);
    },
  };
}

function makeArtifact(overrides = {}) {
  return {
    tenant_id: 'tenant-alpha',
    artifact_id: 'artifact-001',
    doc_id: 'doc-001',
    content_hash: 'hash-001',
    content: 'artifact content',
    discipline: 'Paid_Media',
    audience: ['ICP:smb'],
    audience_tags: ['ICP:smb'],
    pain_point_tags: ['PAIN:budget-constraints'],
    business_model: 'B2B-SaaS',
    provenance: {
      source: {
        system: 'obsidian',
      },
    },
    observed_at: '2026-04-12T10:00:00.000Z',
    ...overrides,
  };
}

test('operator flow performs allowed management action and returns management payload shape', async () => {
  const store = createAuditStore([]);
  const req = {
    method: 'POST',
    url: '/api/vault/role-view/operator',
    headers: {
      'x-tenant-id': 'tenant-alpha',
      'x-role': 'operator',
    },
    body: {
      action: 'set_publish_flag',
      artifact_id: 'artifact-001',
    },
  };
  const res = createRes();

  await handlers.handleRoleViewOperator(req, res, { auditStore: store });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.view, 'operator');
  assert.equal(res.body.management.action, 'set_publish_flag');
  assert.equal(res.body.management.artifact_id, 'artifact-001');
  assert.equal(store.logs.length, 1);
});

test('agent flow retrieves reason/apply/iterate payloads with expected shape', async () => {
  const store = createAuditStore([makeArtifact()]);

  const reasonRes = createRes();
  await handlers.handleRoleViewAgent({
    method: 'GET',
    url: '/api/vault/role-view/agent/reason',
    headers: {
      'x-tenant-id': 'tenant-alpha',
      'x-role': 'agent',
    },
  }, reasonRes, { auditStore: store });

  const applyRes = createRes();
  await handlers.handleRoleViewAgent({
    method: 'GET',
    url: '/api/vault/role-view/agent/apply',
    headers: {
      'x-tenant-id': 'tenant-alpha',
      'x-role': 'agent',
    },
  }, applyRes, { auditStore: store });

  const iterateRes = createRes();
  await handlers.handleRoleViewAgent({
    method: 'GET',
    url: '/api/vault/role-view/agent/iterate',
    headers: {
      'x-tenant-id': 'tenant-alpha',
      'x-role': 'agent',
    },
  }, iterateRes, { auditStore: store });

  assert.equal(reasonRes.statusCode, 200);
  assert.equal(reasonRes.body.view, 'agent');
  assert.equal(reasonRes.body.mode, 'reason');
  assert.equal(Array.isArray(reasonRes.body.items), true);
  assert.equal(reasonRes.body.items.length, 1);

  assert.equal(applyRes.statusCode, 200);
  assert.equal(applyRes.body.mode, 'apply');

  assert.equal(iterateRes.statusCode, 200);
  assert.equal(iterateRes.body.mode, 'iterate');

  assert.equal(store.logs.length, 3);
});

test('cross-view misuse is denied', async () => {
  const store = createAuditStore([makeArtifact()]);

  const badOperatorRes = createRes();
  await handlers.handleRoleViewOperator({
    method: 'POST',
    url: '/api/vault/role-view/operator',
    headers: {
      'x-tenant-id': 'tenant-alpha',
      'x-role': 'operator',
    },
    body: {
      action: 'retrieve_reason',
      artifact_id: 'artifact-001',
    },
  }, badOperatorRes, { auditStore: store });

  assert.equal(badOperatorRes.statusCode, 400);
  assert.equal(badOperatorRes.body.error, 'E_OPERATOR_ACTION_INVALID');

  const badAgentRes = createRes();
  await handlers.handleRoleViewAgent({
    method: 'GET',
    url: '/api/vault/role-view/agent/reason',
    headers: {
      'x-tenant-id': 'tenant-alpha',
      'x-role': 'operator',
    },
  }, badAgentRes, { auditStore: store });

  assert.equal(badAgentRes.statusCode, 403);
  assert.equal(badAgentRes.body.error, 'E_SCOPE_ROLE_DENIED');
});
