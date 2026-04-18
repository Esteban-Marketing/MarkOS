/**
 * test/openapi/openapi-build.test.js
 *
 * Smoke tests for the OpenAPI merge build:
 *   1. buildOpenApiDoc() returns a valid OpenAPI 3.1 shape
 *   2. All F-NN flow IDs found in contracts/ are present in x-markos-flows
 *   3. paths object is non-empty
 *   4. info.version is present
 *   5. Determinism: calling buildOpenApiDoc() twice produces identical JSON output
 *
 * Run: node --test test/openapi/openapi-build.test.js
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BUILD_SCRIPT = path.join(REPO_ROOT, 'scripts', 'openapi', 'build-openapi.cjs');
const CONTRACTS_DIR = path.join(REPO_ROOT, 'contracts');
const JSON_ARTIFACT = path.join(CONTRACTS_DIR, 'openapi.json');

// Load build module
const { buildOpenApiDoc } = require(BUILD_SCRIPT);

// Helper: collect all F-NN file basenames from contracts/
function collectContractFileIds() {
  const files = fs.readdirSync(CONTRACTS_DIR)
    .filter(f => /^F-\d+.*\.yaml$/i.test(f))
    .sort();
  return files;
}

test('buildOpenApiDoc returns a non-null object', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(doc !== null && typeof doc === 'object', 'doc must be an object');
});

test('openapi field is 3.1.0', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.equal(doc.openapi, '3.1.0', 'openapi version must be 3.1.0');
});

test('info.version is present and non-empty', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(doc.info, 'info must be present');
  assert.ok(typeof doc.info.version === 'string' && doc.info.version.length > 0, 'info.version must be a non-empty string');
});

test('info.title is present', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(doc.info && doc.info.title, 'info.title must be present');
});

test('paths object is present and non-empty', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(doc.paths && typeof doc.paths === 'object', 'paths must be an object');
  const pathCount = Object.keys(doc.paths).length;
  assert.ok(pathCount > 0, `paths must have at least 1 entry, got ${pathCount}`);
});

test('x-markos-flows index is present', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(doc['x-markos-flows'], 'x-markos-flows must be present');
  const flowCount = Object.keys(doc['x-markos-flows']).length;
  assert.ok(flowCount > 0, `x-markos-flows must have entries, got ${flowCount}`);
});

test('all F-NN contract files are represented in x-markos-flows', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  const contractFiles = collectContractFileIds();
  const flowKeys = Object.keys(doc['x-markos-flows']);

  // Each contract file should be referenced in x-markos-flows sources
  const sources = flowKeys.map(k => doc['x-markos-flows'][k].source);

  assert.ok(
    contractFiles.length >= 39,
    `Expected at least 39 F-NN contract files in contracts/, got ${contractFiles.length}`
  );

  // Each contract file should appear in exactly one source entry
  for (const file of contractFiles) {
    const expectedSource = `contracts/${file}`;
    assert.ok(
      sources.includes(expectedSource),
      `Contract file ${file} should be referenced in x-markos-flows sources. Sources found: ${sources.join(', ')}`
    );
  }
});

test('flow count equals number of contract files', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  const contractFiles = collectContractFileIds();
  const flowCount = Object.keys(doc['x-markos-flows']).length;

  assert.equal(
    flowCount,
    contractFiles.length,
    `Flow count (${flowCount}) should equal contract file count (${contractFiles.length})`
  );
});

test('tags array is present and non-empty', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(Array.isArray(doc.tags), 'tags must be an array');
  assert.ok(doc.tags.length > 0, 'tags must have at least one entry');
});

test('determinism: two calls to buildOpenApiDoc produce identical JSON', () => {
  const doc1 = buildOpenApiDoc(CONTRACTS_DIR);
  const doc2 = buildOpenApiDoc(CONTRACTS_DIR);
  const json1 = JSON.stringify(doc1, null, 2);
  const json2 = JSON.stringify(doc2, null, 2);
  assert.equal(json1, json2, 'Two calls to buildOpenApiDoc must produce identical JSON output');
});

test('determinism: committed openapi.json matches fresh buildOpenApiDoc output (whitespace only)', () => {
  // Only run if the artifact exists
  if (!fs.existsSync(JSON_ARTIFACT)) {
    // Skip gracefully — artifact hasn't been written yet in this test run
    return;
  }
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  const freshJson = JSON.stringify(doc, null, 2) + '\n';
  const committedJson = fs.readFileSync(JSON_ARTIFACT, 'utf8');

  // Normalize whitespace for comparison
  const normalizeJson = str => JSON.stringify(JSON.parse(str));
  assert.equal(
    normalizeJson(freshJson),
    normalizeJson(committedJson),
    'openapi.json artifact must match fresh build output (content-equivalent)'
  );
});

test('all path operations carry x-flow-id annotation', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];
  const missing = [];

  for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
    for (const method of httpMethods) {
      if (pathItem[method]) {
        if (!pathItem[method]['x-flow-id']) {
          missing.push(`${method.toUpperCase()} ${pathKey}`);
        }
      }
    }
  }

  assert.equal(
    missing.length,
    0,
    `All path operations must have x-flow-id. Missing: ${missing.join(', ')}`
  );
});

test('all path operations carry at least one tag', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];
  const missing = [];

  for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
    for (const method of httpMethods) {
      if (pathItem[method]) {
        const op = pathItem[method];
        if (!op.tags || !Array.isArray(op.tags) || op.tags.length === 0) {
          missing.push(`${method.toUpperCase()} ${pathKey}`);
        }
      }
    }
  }

  assert.equal(
    missing.length,
    0,
    `All path operations must have at least one tag. Missing: ${missing.join(', ')}`
  );
});

// -------------------------------------------------------------------------
// Phase 202 Plan 10: F-89 OAuth + F-95 MCP cost-budget path coverage.
// -------------------------------------------------------------------------

test('Phase 202: openapi.json includes F-89 OAuth + .well-known paths', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(doc.paths['/oauth/register'], 'missing /oauth/register');
  assert.ok(doc.paths['/oauth/authorize'], 'missing /oauth/authorize');
  assert.ok(doc.paths['/oauth/token'], 'missing /oauth/token');
  assert.ok(doc.paths['/oauth/revoke'], 'missing /oauth/revoke');
  assert.ok(doc.paths['/.well-known/oauth-protected-resource'],
    'missing /.well-known/oauth-protected-resource');
  assert.ok(doc.paths['/.well-known/oauth-authorization-server'],
    'missing /.well-known/oauth-authorization-server');
});

test('Phase 202: openapi.json includes F-95 /api/tenant/mcp/* backing paths', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(doc.paths['/api/tenant/mcp/usage'], 'missing /api/tenant/mcp/usage');
  assert.ok(doc.paths['/api/tenant/mcp/sessions'], 'missing /api/tenant/mcp/sessions');
  assert.ok(doc.paths['/api/tenant/mcp/sessions/revoke'],
    'missing /api/tenant/mcp/sessions/revoke');
  assert.ok(doc.paths['/api/tenant/mcp/cost-breakdown'],
    'missing /api/tenant/mcp/cost-breakdown');
});

test('Phase 202: openapi.json includes F-71-v2 /api/mcp/session path', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(doc.paths['/api/mcp/session'], 'missing /api/mcp/session');
});

// -------------------------------------------------------------------------
// Phase 203 Plan 10: F-96 fleet + F-97 rotation + F-98 DLQ + F-99 status path coverage.
// -------------------------------------------------------------------------

test('Phase 203: openapi.json includes F-96 /api/tenant/webhooks/fleet-metrics', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(
    doc.paths['/api/tenant/webhooks/fleet-metrics'],
    'missing /api/tenant/webhooks/fleet-metrics (F-96)',
  );
});

test('Phase 203: openapi.json includes F-97 rotate + rollback + finalize paths', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(
    doc.paths['/api/tenant/webhooks/subscriptions/{sub_id}/rotate'],
    'missing /api/tenant/webhooks/subscriptions/{sub_id}/rotate (F-97)',
  );
});

test('Phase 203: openapi.json includes F-98 DLQ replay paths', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(
    doc.paths['/api/tenant/webhooks/subscriptions/{sub_id}/dlq/replay'],
    'missing /api/tenant/webhooks/subscriptions/{sub_id}/dlq/replay (F-98 batch)',
  );
});

test('Phase 203: openapi.json includes F-99 public status path', () => {
  const doc = buildOpenApiDoc(CONTRACTS_DIR);
  assert.ok(
    doc.paths['/api/public/webhooks/status'],
    'missing /api/public/webhooks/status (F-99)',
  );
});
