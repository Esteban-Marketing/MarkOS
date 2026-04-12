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
const {
  publishBundle,
  _resetActivePointerForTest,
} = require('../../onboarding/backend/brand-governance/active-pointer.cjs');

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

function makeGoodPayload(idSuffix) {
  return {
    strategy_artifact_id: `strat-${idSuffix}`,
    identity_artifact_id: `ident-${idSuffix}`,
    design_system_artifact_id: `ds-${idSuffix}`,
    starter_artifact_id: `starter-${idSuffix}`,
    lineage_fingerprints: {
      strategy: `fp-strategy-${idSuffix}`,
      identity: `fp-identity-${idSuffix}`,
      design_system: `fp-design-system-${idSuffix}`,
      starter: `fp-starter-${idSuffix}`,
    },
  };
}

const routePath = path.resolve(__dirname, '../../api/governance/brand-status.js');
const runtimeContextPath = path.resolve(__dirname, '../../onboarding/backend/runtime-context.cjs');

test.beforeEach(() => {
  _resetBundleRegistryForTest();
  _resetActivePointerForTest();
});

test('brand-status: no active bundle returns 200 with null active_bundle and empty traceability_log', async () => {
  const handler = loadFreshModule(routePath);
  const req = { method: 'GET', url: '/api/governance/brand-status', headers: {} };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.success, true);
  assert.equal(body.active_bundle, null);
  assert.deepEqual(body.traceability_log, []);
});

test('brand-status: active bundle returns 200 with active_bundle and traceability log', async () => {
  const tenantId = 'tenant-alpha-001';
  const bundle = createBundle(tenantId, makeGoodPayload('status-1'));
  setVerificationEvidence(tenantId, bundle.bundle_id, 'evidence-81-status-success');
  publishBundle(tenantId, bundle.bundle_id, { actor_id: 'actor-81', reason: 'promote-for-status' });

  const handler = loadFreshModule(routePath);
  const req = { method: 'GET', url: '/api/governance/brand-status', headers: {} };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.success, true);
  assert.equal(body.active_bundle.bundle_id, bundle.bundle_id);
  assert.equal(body.traceability_log.length, 1);
  assert.equal(body.traceability_log[0].action, 'publish');
});

test('brand-status: traceability_log is tenant-filtered', async () => {
  const tenantA = 'tenant-alpha-001';
  const tenantB = 'tenant-beta-001';

  const bundleA = createBundle(tenantA, makeGoodPayload('status-a'));
  setVerificationEvidence(tenantA, bundleA.bundle_id, 'evidence-81-status-a');
  publishBundle(tenantA, bundleA.bundle_id, { actor_id: 'actor-a', reason: 'promote-a' });

  const bundleB = createBundle(tenantB, makeGoodPayload('status-b'));
  setVerificationEvidence(tenantB, bundleB.bundle_id, 'evidence-81-status-b');
  publishBundle(tenantB, bundleB.bundle_id, { actor_id: 'actor-b', reason: 'promote-b' });

  const handler = loadFreshModule(routePath);
  const req = { method: 'GET', url: '/api/governance/brand-status', headers: {} };
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.ok(Array.isArray(body.traceability_log));
  assert.ok(body.traceability_log.length >= 1);
  for (const entry of body.traceability_log) {
    assert.equal(entry.tenant_id, tenantA);
  }
});

test('brand-status: RBAC denial returns 403 for readonly role', async () => {
  await withMockedModule(runtimeContextPath, {
    createRuntimeContext: () => ({}),
    requireHostedSupabaseAuth: () => ({ ok: true, iamRole: 'readonly', tenant_id: 'tenant-alpha-001' }),
  }, async () => {
    const handler = loadFreshModule(routePath);
    const req = { method: 'GET', url: '/api/governance/brand-status', headers: {} };
    const res = createMockResponse();

    await handler(req, res);
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'GOVERNANCE_ADMIN_REQUIRED');
  });
});

test('brand-status: auth denied returns 401', async () => {
  await withMockedModule(runtimeContextPath, {
    createRuntimeContext: () => ({}),
    requireHostedSupabaseAuth: () => ({ ok: false, status: 401, error: 'UNAUTHENTICATED', message: 'auth required' }),
  }, async () => {
    const handler = loadFreshModule(routePath);
    const req = { method: 'GET', url: '/api/governance/brand-status', headers: {} };
    const res = createMockResponse();

    await handler(req, res);
    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'UNAUTHENTICATED');
  });
});

test('brand-status: method guard returns 405 for POST', async () => {
  const handler = loadFreshModule(routePath);
  const req = createJsonRequest({}, '/api/governance/brand-status', 'POST');
  const res = createMockResponse();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  const body = JSON.parse(res.body);
  assert.equal(body.error, 'METHOD_NOT_ALLOWED');
});
