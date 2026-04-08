const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { createJsonRequest } = require('../setup.js');

const handlerPath = path.join(__dirname, '../../api/tracking/ingest.js');

function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function makeReq({ method = 'POST', url = '/api/tracking/ingest', headers = {}, body = {}, crmStore = null } = {}) {
  return {
    ...createJsonRequest(body, url, method),
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    crmStore,
  };
}

function makeRes() {
  return {
    statusCode: null,
    headers: null,
    body: null,
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(payload = '') {
      this.body = payload ? JSON.parse(payload) : null;
    },
  };
}

test('TRK-01: first-party ingest sanitizes payloads and appends CRM-readable activity rows', async () => {
  const handler = loadFreshModule(handlerPath);
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };
  const req = makeReq({
    crmStore: store,
    body: {
      tenant_id: 'tenant-alpha-001',
      project_slug: 'markos-client',
      events: [
        {
          event_name: 'onboarding_page_view',
          source_event_ref: 'browser:page-view:1',
          related_record_kind: 'contact',
          related_record_id: 'anonymous',
          payload: {
            page_url: 'http://127.0.0.1:4242/',
            authorization: 'Bearer super-secret-token',
            access_token: 'token-123',
          },
        },
      ],
    },
  });
  const res = makeRes();

  await handler(req, res);

  assert.equal(res.statusCode, 202);
  assert.equal(store.activities.length, 1);
  assert.equal(store.activities[0].tenant_id, 'tenant-alpha-001');
  assert.equal(store.activities[0].activity_family, 'web_activity');
  assert.equal(store.activities[0].source_event_ref, 'browser:page-view:1');
  assert.equal(store.activities[0].payload_json.event_name, 'onboarding_page_view');
  assert.equal(store.activities[0].payload_json.authorization, '[REDACTED]');
  assert.equal(store.activities[0].payload_json.access_token, '[REDACTED]');
  assert.equal(res.body.events[0].normalized_activity_family, 'web_activity');
});

test('TRK-03: ingest rejects malformed event batches with explicit failure semantics', async () => {
  const handler = loadFreshModule(handlerPath);
  const req = makeReq({ body: { tenant_id: 'tenant-alpha-001', events: [] } });
  const res = makeRes();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'TRACKING_EVENTS_REQUIRED');
});