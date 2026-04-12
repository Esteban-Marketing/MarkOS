'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { withMockedModule, createJsonRequest } = require('../setup.js');
const {
  createBundle,
  setVerificationEvidence,
  _resetBundleRegistryForTest,
} = require('../../onboarding/backend/brand-governance/bundle-registry.cjs');
const { _resetActivePointerForTest } = require('../../onboarding/backend/brand-governance/active-pointer.cjs');

function createMockResponse() {
  return {
    statusCode: null,
    headers: null,
    body: '',
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(chunk = '') {
      this.body += chunk || '';
    },
  };
}

function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function makeGoodPayload() {
  return {
    strategy_artifact_id: 'strat-81-001',
    identity_artifact_id: 'ident-81-001',
    design_system_artifact_id: 'ds-81-001',
    starter_artifact_id: 'starter-81-001',
    lineage_fingerprints: {
      strategy: 'fp-strategy-81',
      identity: 'fp-identity-81',
      design_system: 'fp-design-system-81',
      starter: 'fp-starter-81',
    },
  };
}

const routePath = path.resolve(__dirname, '../../api/governance/brand-publish.js');
const runtimeContextPath = path.resolve(__dirname, '../../onboarding/backend/runtime-context.cjs');

test.beforeEach(() => {
  _resetBundleRegistryForTest();
  _resetActivePointerForTest();
});

test('brand-publish: success returns 200 with published + traceability_entry', async () => {
  const tenantId = 'tenant-alpha-001';
  const bundle = createBundle(tenantId, makeGoodPayload());
  setVerificationEvidence(tenantId, bundle.bundle_id, 'evidence-81-publish-success');

  const handler = loadFreshModule(routePath);
  const req = createJsonRequest({ bundle_id: bundle.bundle_id, actor_id: 'actor-81', reason: 'promote' }, '/api/governance/brand-publish');
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.success, true);
  assert.equal(body.published, true);
  assert.equal(body.bundle_id, bundle.bundle_id);
  assert.equal(body.traceability_entry.action, 'publish');
});

test('brand-publish: gate failure returns 422 with denied payload pass-through', async () => {
  const tenantId = 'tenant-alpha-001';
  const bundle = createBundle(tenantId, makeGoodPayload());

  const handler = loadFreshModule(routePath);
  const req = createJsonRequest({ bundle_id: bundle.bundle_id, actor_id: 'actor-81', reason: 'promote' }, '/api/governance/brand-publish');
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 422);
  const body = JSON.parse(res.body);
  assert.equal(body.success, false);
  assert.equal(body.denied, true);
  assert.equal(typeof body.reason_code, 'string');
  assert.ok(body.diagnostics);
});

test('brand-publish: RBAC denial returns 403 for readonly role', async () => {
  await withMockedModule(runtimeContextPath, {
    createRuntimeContext: () => ({}),
    requireHostedSupabaseAuth: () => ({ ok: true, iamRole: 'readonly', tenant_id: 'tenant-alpha-001' }),
  }, async () => {
    const handler = loadFreshModule(routePath);
    const req = createJsonRequest({ bundle_id: 'bundle-irrelevant' }, '/api/governance/brand-publish');
    const res = createMockResponse();

    await handler(req, res);
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.equal(body.error, 'GOVERNANCE_ADMIN_REQUIRED');
  });
});

test('brand-publish: auth denied returns 401', async () => {
  await withMockedModule(runtimeContextPath, {
    createRuntimeContext: () => ({}),
    requireHostedSupabaseAuth: () => ({ ok: false, status: 401, error: 'UNAUTHENTICATED', message: 'auth required' }),
  }, async () => {
    const handler = loadFreshModule(routePath);
    const req = createJsonRequest({ bundle_id: 'bundle-irrelevant' }, '/api/governance/brand-publish');
    const res = createMockResponse();

    await handler(req, res);
    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.equal(body.error, 'UNAUTHENTICATED');
  });
});

test('brand-publish: method guard returns 405 for GET', async () => {
  const handler = loadFreshModule(routePath);
  const req = { method: 'GET', url: '/api/governance/brand-publish', headers: {} };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  const body = JSON.parse(res.body);
  assert.equal(body.success, false);
  assert.equal(body.error, 'METHOD_NOT_ALLOWED');
});

test('brand-publish: missing bundle_id returns 400', async () => {
  const handler = loadFreshModule(routePath);
  const req = createJsonRequest({}, '/api/governance/brand-publish');
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  const body = JSON.parse(res.body);
  assert.equal(body.success, false);
  assert.equal(body.error, 'MISSING_BUNDLE_ID');
});
