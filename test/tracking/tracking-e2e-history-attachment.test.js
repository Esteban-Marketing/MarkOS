const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { createJsonRequest } = require('../setup.js');
const { buildCrmTimeline } = require('../../lib/markos/crm/timeline.ts');
const { appendTrackedActivity } = require('../../lib/markos/crm/tracking.ts');

const identifyHandlerPath = path.join(__dirname, '../../api/tracking/identify.js');

function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function makeReq(body) {
  return {
    ...createJsonRequest(body, '/api/tracking/identify?project_slug=markos-client', 'POST'),
    headers: { 'content-type': 'application/json' },
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

test('TRK-04: accepted identity assertions attach anonymous history to known CRM timelines', async () => {
  const handler = loadFreshModule(identifyHandlerPath);
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };

  appendTrackedActivity(store, {
    tenant_id: 'tenant-alpha-001',
    event_name: 'posthog.$pageview',
    source_event_ref: 'ingest:1',
    anonymous_identity_id: 'anon-123',
    payload: { page_url: 'https://example.com/pricing' },
  });

  const req = makeReq({
    tenant_id: 'tenant-alpha-001',
    anonymous_identity_id: 'anon-123',
    known_record_kind: 'contact',
    known_record_id: 'contact-123',
    source_event_ref: 'identify:accepted:1',
    signals: {
      email_exact_match: true,
      domain_match: true,
      session_overlap: true,
    },
  });
  req.crmStore = store;
  const res = makeRes();

  await handler(req, res);

  const timeline = buildCrmTimeline({
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    record_id: 'contact-123',
    activities: store.activities,
    identity_links: store.identityLinks,
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.decision, 'accepted');
  assert.equal(store.identityLinks[0].link_status, 'accepted');
  assert.ok(timeline.some((entry) => entry.source_event_ref === 'ingest:1' && entry.stitched_identity === true));
  assert.ok(timeline.some((entry) => entry.activity_family === 'attribution_update'));
});

test('TRK-04: review-only identity candidates do not attach anonymous history yet', async () => {
  const handler = loadFreshModule(identifyHandlerPath);
  const store = { entities: [], activities: [], identityLinks: [], mergeDecisions: [], mergeLineage: [] };

  appendTrackedActivity(store, {
    tenant_id: 'tenant-alpha-001',
    event_name: 'posthog.$pageview',
    source_event_ref: 'ingest:2',
    anonymous_identity_id: 'anon-456',
    payload: { page_url: 'https://example.com/about' },
  });

  const req = makeReq({
    tenant_id: 'tenant-alpha-001',
    anonymous_identity_id: 'anon-456',
    known_record_kind: 'contact',
    known_record_id: 'contact-456',
    source_event_ref: 'identify:review:1',
    signals: {
      domain_match: true,
      form_submitted: true,
      device_match: true,
    },
  });
  req.crmStore = store;
  const res = makeRes();

  await handler(req, res);

  const timeline = buildCrmTimeline({
    tenant_id: 'tenant-alpha-001',
    record_kind: 'contact',
    record_id: 'contact-456',
    activities: store.activities,
    identity_links: store.identityLinks,
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.decision, 'review');
  assert.equal(store.identityLinks[0].link_status, 'review');
  assert.equal(timeline.some((entry) => entry.source_event_ref === 'ingest:2'), false);
});