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

  return {
    async append(entry) {
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

test('cross-tenant access attempts are denied with explicit scope errors', async () => {
  const store = createAuditStore([makeArtifact()]);

  const operatorRes = createRes();
  await handlers.handleRoleViewOperator({
    method: 'POST',
    url: '/api/vault/role-view/operator',
    headers: {
      'x-tenant-id': 'tenant-alpha',
      'x-resource-tenant-id': 'tenant-beta',
      'x-role': 'operator',
    },
    body: {
      action: 'set_publish_flag',
      artifact_id: 'artifact-001',
    },
  }, operatorRes, { auditStore: store });

  assert.equal(operatorRes.statusCode, 403);
  assert.equal(operatorRes.body.error, 'E_SCOPE_TENANT_MISMATCH');

  const agentRes = createRes();
  await handlers.handleRoleViewAgent({
    method: 'GET',
    url: '/api/vault/role-view/agent/reason',
    headers: {
      'x-tenant-id': 'tenant-alpha',
      'x-resource-tenant-id': 'tenant-beta',
      'x-role': 'agent',
    },
  }, agentRes, { auditStore: store });

  assert.equal(agentRes.statusCode, 403);
  assert.equal(agentRes.body.error, 'E_SCOPE_TENANT_MISMATCH');
});

test('agent retrieval is tenant-isolated and does not leak cross-tenant artifacts', async () => {
  const store = createAuditStore([
    makeArtifact({ tenant_id: 'tenant-alpha', artifact_id: 'artifact-alpha', doc_id: 'doc-alpha' }),
    makeArtifact({ tenant_id: 'tenant-beta', artifact_id: 'artifact-beta', doc_id: 'doc-beta' }),
  ]);

  const res = createRes();
  await handlers.handleRoleViewAgent({
    method: 'GET',
    url: '/api/vault/role-view/agent/reason',
    headers: {
      'x-tenant-id': 'tenant-alpha',
      'x-role': 'agent',
    },
  }, res, { auditStore: store });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].artifact_id, 'doc-alpha');
});
