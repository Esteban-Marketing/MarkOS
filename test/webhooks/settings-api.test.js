'use strict';

// Phase 203 Plan 09 Task 1 — settings API suite.
// Covers fleet-metrics + subscriptions list handlers (behaviors 1a-1d).
// Pattern mirrors test/mcp/mcp-usage-api.test.js — mock Supabase + invoke handler.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { handleFleetMetrics } = require('../../api/tenant/webhooks/fleet-metrics.js');
const { handleList } = require('../../api/tenant/webhooks/subscriptions/list.js');

// ----------------------------------------------------------------------------
// Mock helpers
// ----------------------------------------------------------------------------
function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    writeHead(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(this.headers, hdrs); },
    status(c) { this.statusCode = c; return this; },
    end(b) { this.body = b; return this; },
  };
}
function mockReq(method, body, headers = {}, query = {}) {
  const chunks = body ? [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))] : [];
  return {
    method,
    headers,
    url: '/',
    query,
    on(evt, cb) {
      if (evt === 'data') chunks.forEach(cb);
      if (evt === 'end') setImmediate(cb);
    },
  };
}

// Supabase mock that supports the minimum chain surface used by the handlers:
// `.from(table).select(cols).eq(col,val)...limit(n).order(col,{ ascending }).maybeSingle()`
// or terminal awaitable with `.then`.
function chainableResult(resolve, rows) {
  const h = {
    eq() { return h; },
    gte() { return h; },
    gt() { return h; },
    lte() { return h; },
    lt() { return h; },
    not() { return h; },
    in() { return h; },
    is() { return h; },
    order() { return h; },
    limit() { return h; },
    maybeSingle: async () => resolve(),
    then(onFulfilled, onRejected) {
      const v = rows ? { data: rows(), error: null } : resolve();
      return Promise.resolve(v).then(onFulfilled, onRejected);
    },
  };
  return h;
}

function makeSupabase(fromHandler) {
  return { from: (table) => fromHandler(table) };
}

// ----------------------------------------------------------------------------
// Test 1a: fleet-metrics 401 without auth
// ----------------------------------------------------------------------------
test('Suite 203-09 1a: GET /fleet-metrics 401 without headers', async () => {
  const res = mockRes();
  await handleFleetMetrics(mockReq('GET'), res);
  assert.equal(res.statusCode, 401);
});

test('Suite 203-09 1a: GET /fleet-metrics 405 on non-GET', async () => {
  const res = mockRes();
  await handleFleetMetrics(mockReq('POST', {}, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't' }), res);
  assert.equal(res.statusCode, 405);
});

// ----------------------------------------------------------------------------
// Test 1b: fleet-metrics happy path returns 4 headline numbers + window
// ----------------------------------------------------------------------------
test('Suite 203-09 1b: GET /fleet-metrics returns total_24h, success_rate, avg_latency_ms, dlq_count', async () => {
  const supabase = makeSupabase((table) => {
    if (table === 'markos_webhook_fleet_metrics_v1') {
      return {
        select: () => chainableResult(null, () => [
          { tenant_id: 't1', bucket: '2026-04-18T10:00:00Z', total: 100, delivered: 95, failed: 5, retrying: 0, avg_latency_ms: 120 },
          { tenant_id: 't1', bucket: '2026-04-18T11:00:00Z', total: 200, delivered: 200, failed: 0, retrying: 0, avg_latency_ms: 80 },
        ]),
      };
    }
    if (table === 'markos_webhook_deliveries') {
      // countDLQ uses head:true + count:'exact'
      return { select: () => chainableResult(null, () => []) };
    }
    return { select: () => chainableResult(() => ({ data: null, error: null })) };
  });
  // Stub count response: override the chainable for count-style call.
  supabase.from = (table) => {
    if (table === 'markos_webhook_fleet_metrics_v1') {
      return {
        select: () => {
          const h = chainableResult(null, () => [
            { tenant_id: 't1', bucket: '2026-04-18T10:00:00Z', total: 100, delivered: 95, failed: 5, retrying: 0, avg_latency_ms: 120 },
            { tenant_id: 't1', bucket: '2026-04-18T11:00:00Z', total: 200, delivered: 200, failed: 0, retrying: 0, avg_latency_ms: 80 },
          ]);
          return h;
        },
      };
    }
    if (table === 'markos_webhook_deliveries') {
      const h = {
        eq() { return h; },
        gte() { return h; },
        not() { return h; },
        then(onFulfilled, onRejected) {
          return Promise.resolve({ count: 3, error: null }).then(onFulfilled, onRejected);
        },
      };
      return { select: () => h };
    }
    return { select: () => chainableResult(() => ({ data: null, error: null })) };
  };
  const res = mockRes();
  await handleFleetMetrics(
    mockReq('GET', null, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't1' }),
    res,
    { supabase },
  );
  assert.equal(res.statusCode, 200, `expected 200, got ${res.statusCode}: ${res.body}`);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.tenant_id, 't1');
  assert.equal(parsed.total_24h, 300);
  assert.ok(parsed.success_rate > 98.0 && parsed.success_rate <= 100, `success_rate=${parsed.success_rate}`);
  assert.equal(parsed.dlq_count, 3);
  assert.ok(parsed.window_start);
  assert.ok(parsed.window_end);
  assert.ok(parsed.avg_latency_ms >= 0);
});

// ----------------------------------------------------------------------------
// Test 1c: fleet-metrics tenant scope — cross-tenant rows filtered at the view
// level (query uses .eq('tenant_id', tenant_id)).
// ----------------------------------------------------------------------------
test('Suite 203-09 1c: fleet-metrics tenant-scopes — cross-tenant rows do not contribute', async () => {
  let capturedFilter = null;
  const supabase = {
    from: (table) => {
      if (table === 'markos_webhook_fleet_metrics_v1') {
        const h = {
          eq(col, val) { capturedFilter = [col, val]; return h; },
          gte() { return h; },
          then(onFulfilled, onRejected) {
            return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
          },
        };
        return { select: () => h };
      }
      if (table === 'markos_webhook_deliveries') {
        const h = {
          eq() { return h; },
          gte() { return h; },
          not() { return h; },
          then(onFulfilled, onRejected) {
            return Promise.resolve({ count: 0, error: null }).then(onFulfilled, onRejected);
          },
        };
        return { select: () => h };
      }
      return { select: () => chainableResult(() => ({ data: null, error: null })) };
    },
  };
  const res = mockRes();
  await handleFleetMetrics(
    mockReq('GET', null, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't-A' }),
    res,
    { supabase },
  );
  assert.equal(res.statusCode, 200);
  assert.deepEqual(capturedFilter, ['tenant_id', 't-A']);
  const parsed = JSON.parse(res.body);
  // Zero-rows path: success_rate = 100 (no deliveries = healthy)
  assert.equal(parsed.total_24h, 0);
  assert.equal(parsed.success_rate, 100.0);
});

// ----------------------------------------------------------------------------
// Test 1d: GET /subscriptions decorates rows with rate_limit + breaker_state
// ----------------------------------------------------------------------------
test('Suite 203-09 1d: GET /subscriptions decorates rows with rate_limit + breaker_state', async () => {
  const supabase = {
    from: (table) => {
      if (table === 'markos_orgs') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { plan_tier: 'team' } }) }),
          }),
        };
      }
      if (table === 'markos_webhook_subscriptions') {
        const h = {
          eq() { return h; },
          order() { return h; },
          then(onFulfilled, onRejected) {
            return Promise.resolve({
              data: [
                { id: 'sub_1', tenant_id: 't1', url: 'https://example.com/hook', events: ['x.y'], active: true, created_at: '2026-04-18T00:00:00Z', rps_override: null, rotation_state: null, grace_ends_at: null },
                { id: 'sub_2', tenant_id: 't1', url: 'https://example.com/hook2', events: ['a.b'], active: true, created_at: '2026-04-18T00:00:00Z', rps_override: 30, rotation_state: null, grace_ends_at: null },
              ],
              error: null,
            }).then(onFulfilled, onRejected);
          },
        };
        return { select: () => h };
      }
      if (table === 'markos_webhook_deliveries') {
        const h = {
          eq() { return h; },
          gte() { return h; },
          then(onFulfilled, onRejected) {
            return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
          },
        };
        return { select: () => h };
      }
      return { select: () => chainableResult(() => ({ data: null, error: null })) };
    },
  };
  const res = mockRes();
  await handleList(
    mockReq('GET', null, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't1', 'x-markos-org-id': 'org_x' }),
    res,
    { supabase, getBreakerState: () => Promise.resolve({ state: 'closed', trips: 0, probe_at: null, opened_at: null }) },
  );
  assert.equal(res.statusCode, 200, `expected 200, body=${res.body}`);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.subscriptions.length, 2);
  const s1 = parsed.subscriptions.find((s) => s.id === 'sub_1');
  const s2 = parsed.subscriptions.find((s) => s.id === 'sub_2');
  assert.ok(s1.breaker_state, 'breaker_state populated');
  assert.equal(s1.status_chip, 'Healthy');
  assert.equal(s1.rate_limit.plan_tier, 'team');
  assert.equal(s1.rate_limit.ceiling_rps, 60);
  assert.equal(s1.rate_limit.effective_rps, 60); // no override → ceiling
  assert.equal(s2.rate_limit.effective_rps, 30); // override 30 < ceiling 60 → 30
  assert.equal(s2.rate_limit.override_rps, 30);
  // Secret columns never echoed (T-203-09-02).
  assert.equal(s1.secret, undefined);
  assert.equal(s1.secret_v2, undefined);
});

test('Suite 203-09 1d: GET /subscriptions 401 without headers', async () => {
  const res = mockRes();
  await handleList(mockReq('GET'), res);
  assert.equal(res.statusCode, 401);
});

// ----------------------------------------------------------------------------
// F-96 contract shape
// ----------------------------------------------------------------------------
test('Suite 203-09: F-96 contract declares 5 paths + 4 error envelopes + references F-72/F-100', () => {
  const yamlPath = path.join(__dirname, '..', '..', 'contracts', 'F-96-webhook-dashboard-v1.yaml');
  const yaml = fs.readFileSync(yamlPath, 'utf8');
  assert.match(yaml, /id:\s*F-96-webhook-dashboard-v1/);
  // 5 paths
  assert.match(yaml, /\/api\/tenant\/webhooks\/fleet-metrics/);
  assert.match(yaml, /\/api\/tenant\/webhooks\/subscriptions:/);
  assert.match(yaml, /\/api\/tenant\/webhooks\/subscriptions\/\{sub_id\}:/);
  assert.match(yaml, /\/api\/tenant\/webhooks\/subscriptions\/\{sub_id\}\/update/);
  assert.match(yaml, /\/api\/tenant\/webhooks\/subscriptions\/\{sub_id\}\/delete/);
  // 4 error envelopes
  assert.match(yaml, /cross_tenant_forbidden/);
  assert.match(yaml, /subscription_not_found/);
  assert.match(yaml, /private_ip/);
  assert.match(yaml, /rps_override_exceeds_plan/);
  // References
  assert.match(yaml, /F-72/);
  assert.match(yaml, /F-100/);
});
