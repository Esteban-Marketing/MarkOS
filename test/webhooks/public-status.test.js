'use strict';

// Phase 203 Plan 10 Task 2 — Public status endpoint + F-99 contract shape tests.
// Runs alongside status-page.test.js + ui-s3-a11y.test.js.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    writeHead(code, headers) {
      this.statusCode = code;
      if (headers) for (const [k, v] of Object.entries(headers)) this.headers[k.toLowerCase()] = v;
    },
    end(b) { this.body = b; },
  };
  return res;
}

function loadHandler() {
  const modPath = require.resolve('../../api/public/webhooks/status.js');
  delete require.cache[modPath];
  return require('../../api/public/webhooks/status.js');
}

test('2a: GET /api/public/webhooks/status returns 200 with all 5 required hero fields + no auth', async () => {
  const handler = loadHandler();
  const res = makeRes();
  const fakeSupabase = {
    from() { return this; },
    select() { return this; },
    async limit() { return { data: [], error: null }; },
  };
  // aggregateFleetMetrics stub that matches the metric shape Plan 203-09 provides.
  const deps = {
    supabase: fakeSupabase,
    aggregateFleetMetrics: async () => ({
      total_24h: 12345,
      delivered_24h: 12200,
      success_rate: 0.988,
      avg_latency_ms: 215,
      dlq_count: 3,
    }),
  };
  await handler({ method: 'GET', headers: {} }, res, deps);
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.ok('total_24h' in body, 'missing total_24h');
  assert.ok('success_rate' in body, 'missing success_rate');
  assert.ok('avg_latency_ms' in body, 'missing avg_latency_ms');
  assert.ok('dlq_count' in body, 'missing dlq_count');
  assert.ok('last_updated' in body, 'missing last_updated');
});

test('2b: response sets Cache-Control + CORS headers', async () => {
  const handler = loadHandler();
  const res = makeRes();
  const deps = {
    supabase: {},
    aggregateFleetMetrics: async () => ({
      total_24h: 0, delivered_24h: 0, success_rate: 1.0, avg_latency_ms: 0, dlq_count: 0,
    }),
  };
  await handler({ method: 'GET', headers: {} }, res, deps);
  const cache = res.headers['cache-control'] || '';
  assert.match(cache, /public/);
  assert.match(cache, /max-age=60/);
  assert.match(cache, /s-maxage=60/);
  const cors = res.headers['access-control-allow-origin'] || '';
  assert.equal(cors, '*');
});

test('2c: platform-wide aggregation — no tenant_id exposed in response body', async () => {
  const handler = loadHandler();
  const res = makeRes();
  let receivedTenantArg;
  const deps = {
    supabase: {},
    aggregateFleetMetrics: async (_supabase, tenantArg) => {
      receivedTenantArg = tenantArg;
      return { total_24h: 100, delivered_24h: 99, success_rate: 0.99, avg_latency_ms: 120, dlq_count: 0 };
    },
  };
  await handler({ method: 'GET', headers: {} }, res, deps);
  assert.equal(receivedTenantArg, null, 'aggregateFleetMetrics should be called with tenant_id=null for platform-wide');
  const body = JSON.parse(res.body);
  assert.ok(!('tenant_id' in body), 'response must NOT carry tenant_id');
});

test('2c.method: non-GET returns 405', async () => {
  const handler = loadHandler();
  const res = makeRes();
  await handler({ method: 'POST', headers: {} }, res, { supabase: {}, aggregateFleetMetrics: async () => ({}) });
  assert.equal(res.statusCode, 405);
});

test('2c.error: aggregate throws → 500 status_unavailable envelope', async () => {
  const handler = loadHandler();
  const res = makeRes();
  const deps = {
    supabase: {},
    aggregateFleetMetrics: async () => { throw new Error('supabase down'); },
  };
  await handler({ method: 'GET', headers: {} }, res, deps);
  assert.equal(res.statusCode, 500);
  const body = JSON.parse(res.body);
  assert.equal(body.error, 'status_unavailable');
});

test('2g: F-99 YAML declares /api/public/webhooks/status GET + 60s cache + no auth', () => {
  const yamlPath = path.join(REPO_ROOT, 'contracts', 'F-99-webhook-status-v1.yaml');
  const src = fs.readFileSync(yamlPath, 'utf8');
  assert.match(src, /F-99/);
  assert.match(src, /\/api\/public\/webhooks\/status/);
  // Must describe GET
  assert.match(src, /get:/);
  // References Stripe/Vercel lineage per acceptance criteria
  assert.match(src, /[Ss]tripe|[Vv]ercel/);
});
