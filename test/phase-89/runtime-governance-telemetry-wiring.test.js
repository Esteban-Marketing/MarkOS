'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const handlers = require('../../onboarding/backend/handlers.cjs');
const { createDeterministicAuditStore } = require('./helpers/supabase-audit-store-mock.cjs');

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

test('smoke: operator role-view emits governance telemetry with required fields', async () => {
  const store = createDeterministicAuditStore();
  const events = [];
  const res = createRes();

  await handlers.handleRoleViewOperator({
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
  }, res, {
    auditStore: store,
    captureGovernanceEvent: (eventName, payload) => {
      events.push({ eventName, payload });
      return payload;
    },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(events.length, 1);
  assert.equal(events[0].payload.artifact_id, 'artifact-001');
  assert.equal(events[0].payload.retrieval_mode, 'manage');
  assert.equal(events[0].payload.outcome_status, 'success');
  assert.ok(Array.isArray(events[0].payload.anomaly_flags));
  assert.ok(events[0].payload.expected_evidence_ref);
  assert.ok(events[0].payload.observed_evidence_ref);
});

test('smoke: agent role-view emits governance telemetry for retrieval mode', async () => {
  const store = createDeterministicAuditStore([
    {
      tenant_id: 'tenant-alpha',
      artifact_id: 'artifact-101',
      doc_id: 'doc-101',
      content: 'artifact content',
      discipline: 'Paid_Media',
      audience: ['ICP:smb'],
      audience_tags: ['ICP:smb'],
      pain_point_tags: ['PAIN:budget-constraints'],
      business_model: 'B2B-SaaS',
      observed_at: '2026-04-13T00:00:00.000Z',
      provenance: { source: { system: 'obsidian' } },
    },
  ]);
  const events = [];
  const res = createRes();

  await handlers.handleRoleViewAgent({
    method: 'GET',
    url: '/api/vault/role-view/agent/reason',
    headers: {
      'x-tenant-id': 'tenant-alpha',
      'x-role': 'agent',
    },
  }, res, {
    auditStore: store,
    captureGovernanceEvent: (eventName, payload) => {
      events.push({ eventName, payload });
      return payload;
    },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(events.length, 1);
  assert.equal(events[0].payload.retrieval_mode, 'reason');
  assert.equal(events[0].payload.outcome_status, 'success');
  assert.ok(events[0].payload.artifact_id);
});

test('smoke: telemetry normalization failures fail closed with machine-readable error', async () => {
  const store = createDeterministicAuditStore();
  const res = createRes();

  await handlers.handleRoleViewOperator({
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
  }, res, {
    auditStore: store,
    captureGovernanceEvent: () => {
      const err = new Error('Missing required governance telemetry fields: observed_evidence_ref');
      err.code = 'E_GOV_TELEMETRY_REQUIRED_FIELDS';
      throw err;
    },
  });

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'E_GOVERNANCE_TELEMETRY_INVALID');
  assert.equal(res.body.machine_readable, true);
  assert.equal(res.body.governance.code, 'E_GOV_TELEMETRY_REQUIRED_FIELDS');
});
