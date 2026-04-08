const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const redirectHandlerPath = path.join(root, 'api/tracking/redirect.js');
const trackingPath = path.join(root, 'lib/markos/crm/tracking.ts');
const redirectContractPath = path.join(root, 'contracts/F-59-tracked-entry-redirect-v1.yaml');

function loadTsCommonJsModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const module = { exports: {} };
  const wrapped = new vm.Script(`(function (exports, require, module, __filename, __dirname) {\n${source}\n})`, { filename: filePath });
  const localRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      return loadTsCommonJsModule(path.resolve(path.dirname(filePath), specifier));
    }
    return require(specifier);
  };
  wrapped.runInThisContext()(module.exports, localRequire, module, filePath, path.dirname(filePath));
  return module.exports;
}

function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function makeReq(url, crmStore) {
  return { method: 'GET', url, crmStore };
}

function makeRes() {
  return {
    statusCode: null,
    headers: null,
    body: '',
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(payload = '') {
      this.body += payload;
    },
  };
}

test('TRK-02: tracked redirect preserves UTM and affiliate context as CRM evidence', async () => {
  const handler = loadFreshModule(redirectHandlerPath);
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  const req = makeReq('/api/tracking/redirect?tenant_id=tenant-alpha-001&project_slug=markos-client&to=https%3A%2F%2Fexample.com%2Fpricing&utm_source=linkedin&utm_medium=paid-social&utm_campaign=q2-launch&affiliate=partner-9&anonymous_identity_id=anon-123', store);
  const res = makeRes();

  await handler(req, res);

  assert.equal(res.statusCode, 302);
  assert.match(res.headers.Location, /^https:\/\/example.com\/pricing\?/);
  assert.match(res.headers.Location, /utm_source=linkedin/);
  assert.match(res.headers.Location, /affiliate=partner-9/);
  assert.equal(store.activities.length, 1);
  assert.equal(store.activities[0].activity_family, 'campaign_touch');
  assert.equal(store.activities[0].payload_json.utm_source, 'linkedin');
  assert.equal(store.activities[0].payload_json.affiliate_id, 'partner-9');
  assert.equal(store.activities[0].payload_json.attribution_state, 'preserved');
});

test('TRK-02: tracked redirect encodes degraded fallback state when primary destination is missing', async () => {
  const handler = loadFreshModule(redirectHandlerPath);
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  const req = makeReq('/api/tracking/redirect?tenant_id=tenant-alpha-001&fallback=https%3A%2F%2Fexample.com%2Ffallback&utm_source=newsletter', store);
  const res = makeRes();

  await handler(req, res);

  assert.equal(res.statusCode, 302);
  assert.match(res.headers.Location, /^https:\/\/example.com\/fallback\?/);
  assert.equal(store.activities[0].payload_json.attribution_state, 'degraded_fallback');
});

test('TRK-02: redirect helper contract names preserved and degraded attribution semantics', () => {
  const contract = fs.readFileSync(redirectContractPath, 'utf8');
  const tracking = loadTsCommonJsModule(trackingPath);

  assert.match(contract, /attribution_state:/);
  assert.match(contract, /preserved/);
  assert.match(contract, /degraded_fallback/);
  assert.equal(typeof tracking.buildTrackedEntryPayload, 'function');
});