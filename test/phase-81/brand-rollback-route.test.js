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
    strategy_artifact_id: 'strat-81-rb-001',
    identity_artifact_id: 'ident-81-rb-001',
    design_system_artifact_id: 'ds-81-rb-001',
    starter_artifact_id: 'starter-81-rb-001',
    lineage_fingerprints: {
      strategy: 'fp-strategy-81-rb',
      identity: 'fp-identity-81-rb',
      design_system: 'fp-design-system-81-rb',
      starter: 'fp-starter-81-rb',
    },
  };
}

const routePath = path.resolve(__dirname, '../../api/governance/brand-rollback.js');
const runtimeContextPath = path.resolve(__dirname, '../../onboarding/backend/runtime-context.cjs');

test.beforeEach(() => {
  _resetBundleRegistryForTest();
  _resetActivePointerForTest();
});

test('brand-rollback: success returns 200 with rolled_back + traceability_entry', async () => {
  const tenantId = 'tenant-alpha-001';
  const bundle = createBundle(tenantId, makeGoodPayload());
  setVerificationEvidence(tenantId, bundle.bundle_id, 'evidence-81-rollback-success');

  const handler = loadFreshModule(routePath);
  const req = createJsonRequest({ bundle_id: bundle.bundle_id, actor_id: 'actor-81', reason: 'rollback' }, '/api/governance/brand-rollback');
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.success, true);
  assert.equal(body.rolled_back, true);
  assert.equal(body.bundle_id, bundle.bundle_id);
  assert.equal(body.traceability_entry.action, 'rollback');
});

test('brand-rollback: bundle without verification evidence returns 422', async () => {
  const tenantId = 'tenant-alpha-001';
  const bundle = createBundle(tenantId, makeGoodPayload());

  const handler = loadFreshModule(routePath);
  const req = createJsonRequest({ bundle_id: bundle.bundle_id, actor_id: 'actor-81', reason: 'rollback' }, '/api/governance/brand-rollback');
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 422);
  const body = JSON.parse(res.body);
  assert.equal(body.success, false);
  assert.equal(body.denied, true);
  assert.equal(body.reason_code, 'BRAND_GOV_BUNDLE_NOT_VERIFIED');
  assert.ok(body.diagnostics);
});

test('brand-rollback: unknown bundle returns 422 with BRAND_GOV_BUNDLE_NOT_VERIFIED', async () => {
  const handler = loadFreshModule(routePath);
  const req = createJsonRequest({ bundle_id: 'nonexistent-bundle-id', actor_id: 'actor-81', reason: 'rollback' }, '/api/governance/brand-rollback');
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 422);
  const body = JSON.parse(res.body);
  assert.equal(body.success, false);
  assert.equal(body.denied, true);
  assert.equal(body.reason_code, 'BRAND_GOV_BUNDLE_NOT_VERIFIED');
});

test('brand-rollback: RBAC denial returns 403 for readonly role', async () => {
  await withMockedModule(runtimeContextPath, {
    createRuntimeContext: () => ({}),
    requireHostedSupabaseAuth: () => ({ ok: true, iamRole: 'readonly', tenant_id: 'tenant-alpha-001' }),
  }, async () => {
    const handler = loadFreshModule(routePath);
    const req = createJsonRequest({ bundle_id: 'bundle-irrelevant' }, '/api/governance/brand-rollback');
    const res = createMockResponse();

    await handler(req, res);
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'GOVERNANCE_ADMIN_REQUIRED');
  });
});

test('brand-rollback: auth denied returns 401', async () => {
  await withMockedModule(runtimeContextPath, {
    createRuntimeContext: () => ({}),
    requireHostedSupabaseAuth: () => ({ ok: false, status: 401, error: 'UNAUTHENTICATED', message: 'auth required' }),
  }, async () => {
    const handler = loadFreshModule(routePath);
    const req = createJsonRequest({ bundle_id: 'bundle-irrelevant' }, '/api/governance/brand-rollback');
    const res = createMockResponse();

    await handler(req, res);
    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'UNAUTHENTICATED');
  });
});

test('brand-rollback: method guard returns 405 for GET', async () => {
  const handler = loadFreshModule(routePath);
  const req = { method: 'GET', url: '/api/governance/brand-rollback', headers: {} };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  const body = JSON.parse(res.body);
  assert.equal(body.error, 'METHOD_NOT_ALLOWED');
});

test('brand-rollback: missing bundle_id returns 400', async () => {
  const handler = loadFreshModule(routePath);
  const req = createJsonRequest({}, '/api/governance/brand-rollback');
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  const body = JSON.parse(res.body);
  assert.equal(body.error, 'MISSING_BUNDLE_ID');
});
