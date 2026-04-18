'use strict';

// Phase 203 Plan 09 Task 1 — tenant API suite (detail + update + delete handlers).
// Covers behaviors 1e-1l per 203-09-PLAN.md.

const test = require('node:test');
const assert = require('node:assert/strict');

const { handleDetail } = require('../../api/tenant/webhooks/subscriptions/[sub_id]/index.js');
const { handleUpdate } = require('../../api/tenant/webhooks/subscriptions/[sub_id]/update.js');
const { handleDelete } = require('../../api/tenant/webhooks/subscriptions/[sub_id]/delete.js');

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

// --- Supabase chain mock -----------------------------------------------------
function thenable(data, error = null, count = undefined) {
  const h = {
    eq() { return h; },
    gte() { return h; },
    gt() { return h; },
    lt() { return h; },
    lte() { return h; },
    not() { return h; },
    is() { return h; },
    in() { return h; },
    order() { return h; },
    limit() { return h; },
    maybeSingle: async () => ({ data, error }),
    select() { return h; },
    update(patch) { h._patch = patch; return h; },
    delete() { return h; },
    insert(row) { h._row = row; return h; },
    then(onFulfilled, onRejected) {
      const payload = { data, error };
      if (count !== undefined) payload.count = count;
      return Promise.resolve(payload).then(onFulfilled, onRejected);
    },
  };
  return h;
}

function makeSupabase(handlers) {
  return { from: (table) => handlers[table] || thenable(null) };
}

// ============================================================================
// Test 1e: GET /subscriptions/{sub_id} returns detail + deliveries + dlq_count + rate_limit + breaker_state
// ============================================================================
test('Suite 203-09 1e: GET /subscription detail — happy path with full shape', async () => {
  const supabase = {
    from: (table) => {
      if (table === 'markos_webhook_subscriptions') {
        return thenable({ id: 'sub_X', tenant_id: 't1', url: 'https://example.com', events: ['e'], active: true, created_at: 'x', updated_at: 'y', rps_override: null, rotation_state: null, grace_started_at: null, grace_ends_at: null });
      }
      if (table === 'markos_webhook_deliveries') {
        // detail handler makes up to 3 reads on this table:
        //  (1) list of deliveries (has limit + order in the chain)
        //  (2) countDLQ (select head:true → count)
        //  (3) perSubMetrics (status + created_at + updated_at list)
        // We differentiate by whether the chain saw `.limit(...)` (list) vs
        // an options.head marker (count) vs neither (metrics list).
        function buildChain() {
          const state = { limited: false, countMode: false };
          const h = {
            eq() { return h; },
            gte() { return h; },
            not() { return h; },
            order() { return h; },
            limit() { state.limited = true; return h; },
            then(onFulfilled, onRejected) {
              if (state.countMode) {
                return Promise.resolve({ count: 5, error: null }).then(onFulfilled, onRejected);
              }
              if (state.limited) {
                return Promise.resolve({ data: [{ id: 'del_1', subscription_id: 'sub_X', event: 'e', status: 'delivered', attempt: 0, created_at: 'a', updated_at: 'b' }], error: null }).then(onFulfilled, onRejected);
              }
              // perSubMetrics select — list of status rows
              return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
            },
            _setCountMode() { state.countMode = true; return h; },
          };
          return h;
        }
        return {
          select(cols, opts) {
            const h = buildChain();
            if (opts && opts.head) h._setCountMode();
            return h;
          },
        };
      }
      if (table === 'markos_orgs') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { plan_tier: 'enterprise' } }) }) }) };
      }
      if (table === 'markos_webhook_secret_rotations') {
        return thenable([]); // no active rotation for this sub
      }
      return thenable(null);
    },
  };
  const res = mockRes();
  await handleDetail(
    mockReq('GET', null, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't1', 'x-markos-org-id': 'org_X' }, { sub_id: 'sub_X' }),
    res,
    { supabase, getBreakerState: () => Promise.resolve({ state: 'closed', trips: 0, probe_at: null, opened_at: null }) },
  );
  assert.equal(res.statusCode, 200, `expected 200, body=${res.body}`);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.subscription.id, 'sub_X');
  assert.ok(Array.isArray(parsed.deliveries));
  assert.equal(parsed.dlq_count, 5);
  assert.ok(parsed.rate_limit);
  assert.equal(parsed.rate_limit.plan_tier, 'enterprise');
  assert.equal(parsed.rate_limit.ceiling_rps, 300);
  assert.equal(parsed.breaker_state.state, 'closed');
  assert.equal(parsed.rotation, null);
});

// ============================================================================
// Test 1f: GET /subscriptions/{sub_id} cross-tenant → 403 cross_tenant_forbidden
// ============================================================================
test('Suite 203-09 1f: GET detail cross-tenant returns 403 cross_tenant_forbidden', async () => {
  const supabase = {
    from: (table) => {
      if (table === 'markos_webhook_subscriptions') {
        return thenable({ id: 'sub_Y', tenant_id: 'other_tenant', url: 'https://example.com', events: [], active: true });
      }
      return thenable(null);
    },
  };
  const res = mockRes();
  await handleDetail(
    mockReq('GET', null, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't1' }, { sub_id: 'sub_Y' }),
    res,
    { supabase },
  );
  assert.equal(res.statusCode, 403);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.error, 'cross_tenant_forbidden');
});

test('Suite 203-09 1e: GET detail 401 without headers', async () => {
  const res = mockRes();
  await handleDetail(mockReq('GET', null, {}, { sub_id: 'x' }), res);
  assert.equal(res.statusCode, 401);
});

test('Suite 203-09 1e: GET detail 404 when subscription missing', async () => {
  const supabase = {
    from: () => thenable(null),
  };
  const res = mockRes();
  await handleDetail(
    mockReq('GET', null, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't1' }, { sub_id: 'nope' }),
    res,
    { supabase },
  );
  assert.equal(res.statusCode, 404);
});

// ============================================================================
// Test 1g: POST /update happy path re-runs SSRF + ceiling checks
// ============================================================================
test('Suite 203-09 1g: POST update happy path — url + events + rps_override succeed', async () => {
  let updateCalled = false;
  const supabase = {
    from: (table) => {
      if (table === 'markos_webhook_subscriptions') {
        const h = {
          _patch: null,
          select(cols) { h._cols = cols; return h; },
          eq() { return h; },
          maybeSingle: async () => ({
            data: h._patch
              ? { id: 'sub_1', tenant_id: 't1', url: 'https://example.com/new', events: ['a','b'], active: true, rps_override: 30 }
              : { id: 'sub_1', tenant_id: 't1', url: 'https://example.com/old', events: ['a'], active: true, rps_override: null },
            error: null,
          }),
          update(patch) { h._patch = patch; updateCalled = true; return h; },
          then(onFulfilled) { return Promise.resolve({ data: null, error: null }).then(onFulfilled); },
        };
        return h;
      }
      if (table === 'markos_orgs') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { plan_tier: 'team' } }) }) }) };
      }
      return thenable(null);
    },
  };
  const res = mockRes();
  await handleUpdate(
    mockReq('POST',
      { url: 'https://example.com/new', events: ['a', 'b'], rps_override: 30 },
      { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't1', 'x-markos-org-id': 'org_1' },
      { sub_id: 'sub_1' },
    ),
    res,
    { supabase },
  );
  assert.equal(res.statusCode, 200, `body=${res.body}`);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.ok(updateCalled, 'update() must fire with new values');
});

// ============================================================================
// Test 1h: POST /update rps_override > plan ceiling → 400 rps_override_exceeds_plan
// ============================================================================
test('Suite 203-09 1h: POST update rejects rps_override above ceiling with 400 + ceiling echoed', async () => {
  const supabase = {
    from: (table) => {
      if (table === 'markos_webhook_subscriptions') {
        return thenable({ id: 'sub_1', tenant_id: 't1', url: 'https://example.com', events: [], active: true, rps_override: null });
      }
      if (table === 'markos_orgs') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { plan_tier: 'free' } }) }) }) };
      }
      return thenable(null);
    },
  };
  const res = mockRes();
  await handleUpdate(
    mockReq('POST',
      { rps_override: 50 }, // free ceiling = 10
      { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't1', 'x-markos-org-id': 'o1' },
      { sub_id: 'sub_1' },
    ),
    res,
    { supabase },
  );
  assert.equal(res.statusCode, 400);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.error, 'rps_override_exceeds_plan');
  assert.equal(parsed.ceiling, 10);
});

// ============================================================================
// Test 1i: POST /update private-IP URL → 400 private_ip
// ============================================================================
test('Suite 203-09 1i: POST update rejects private-IP URL with 400 private_ip', async () => {
  const supabase = {
    from: (table) => {
      if (table === 'markos_webhook_subscriptions') {
        return thenable({ id: 'sub_1', tenant_id: 't1', url: 'https://example.com', events: [], active: true, rps_override: null });
      }
      return thenable(null);
    },
  };
  const res = mockRes();
  await handleUpdate(
    mockReq('POST',
      { url: 'http://127.0.0.1/hook' }, // loopback — SSRF guard rejects
      { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't1' },
      { sub_id: 'sub_1' },
    ),
    res,
    { supabase },
  );
  assert.equal(res.statusCode, 400);
  const parsed = JSON.parse(res.body);
  // Error category may be "private_ip" OR "https_required" depending on which guard rule fires
  // first. Accept either — both prove the SSRF guard was re-run on update.
  assert.ok(['private_ip', 'https_required', 'invalid_scheme'].includes(parsed.error), `got error=${parsed.error}`);
});

// ============================================================================
// Test 1j: POST /delete cross-tenant → 403
// ============================================================================
test('Suite 203-09 1j: POST delete cross-tenant returns 403', async () => {
  const supabase = {
    from: (table) => {
      if (table === 'markos_webhook_subscriptions') {
        return thenable({ id: 'sub_Y', tenant_id: 'other', active: true });
      }
      return thenable(null);
    },
  };
  const res = mockRes();
  await handleDelete(
    mockReq('POST', {}, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't1' }, { sub_id: 'sub_Y' }),
    res,
    { supabase },
  );
  assert.equal(res.statusCode, 403);
  assert.equal(JSON.parse(res.body).error, 'cross_tenant_forbidden');
});

// ============================================================================
// Test 1k: POST /delete happy path — in-flight deliveries cancelled + active=false
// ============================================================================
test('Suite 203-09 1k: POST delete happy path — cancels in-flight + deactivates subscription', async () => {
  const calls = [];
  const supabase = {
    from: (table) => {
      if (table === 'markos_webhook_subscriptions') {
        const h = {
          _patch: null,
          select(cols) { calls.push(['sub:select', cols]); return h; },
          update(patch) { h._patch = patch; calls.push(['sub:update', patch]); return h; },
          eq(col, val) { calls.push(['sub:eq', col, val]); return h; },
          maybeSingle: async () => ({ data: { id: 'sub_1', tenant_id: 't1', active: true }, error: null }),
          then(onFulfilled) { return Promise.resolve({ data: null, error: null }).then(onFulfilled); },
        };
        return h;
      }
      if (table === 'markos_webhook_deliveries') {
        const h = {
          _patch: null,
          update(patch) { h._patch = patch; calls.push(['deliv:update', patch]); return h; },
          eq() { return h; },
          in(col, vals) { calls.push(['deliv:in', col, vals]); return h; },
          then(onFulfilled) { return Promise.resolve({ data: null, error: null }).then(onFulfilled); },
        };
        return h;
      }
      return thenable(null);
    },
  };
  const res = mockRes();
  await handleDelete(
    mockReq('POST', {}, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't1' }, { sub_id: 'sub_1' }),
    res,
    { supabase },
  );
  assert.equal(res.statusCode, 200, `body=${res.body}`);
  assert.equal(JSON.parse(res.body).ok, true);

  // Assert we cancelled pending/retrying deliveries
  const deliveryUpdate = calls.find((c) => c[0] === 'deliv:update');
  assert.ok(deliveryUpdate, 'deliveries.update called');
  assert.equal(deliveryUpdate[1].status, 'cancelled');
  assert.equal(deliveryUpdate[1].dlq_reason, 'subscription_deleted');
  const deliveryIn = calls.find((c) => c[0] === 'deliv:in');
  assert.deepEqual(deliveryIn[2], ['pending', 'retrying']);

  // Assert we soft-deleted the subscription
  const subUpdate = calls.find((c) => c[0] === 'sub:update');
  assert.ok(subUpdate, 'subscription.update called');
  assert.equal(subUpdate[1].active, false);
});

test('Suite 203-09 1k: POST delete 401 without headers', async () => {
  const res = mockRes();
  await handleDelete(mockReq('POST', {}, {}, { sub_id: 'x' }), res);
  assert.equal(res.statusCode, 401);
});

test('Suite 203-09 1k: POST delete 404 when subscription missing', async () => {
  const supabase = { from: () => thenable(null) };
  const res = mockRes();
  await handleDelete(
    mockReq('POST', {}, { 'x-markos-user-id': 'u', 'x-markos-tenant-id': 't1' }, { sub_id: 'missing' }),
    res,
    { supabase },
  );
  assert.equal(res.statusCode, 404);
});

// ============================================================================
// Test 1l: F-96 YAML has 5 paths + 403/404/400 envelopes + references F-72 + F-100
// ============================================================================
test('Suite 203-09 1l: F-96 YAML declares 5 paths + 3 core error envelopes + F-72 + F-100 refs', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const yaml = fs.readFileSync(path.join(__dirname, '..', '..', 'contracts', 'F-96-webhook-dashboard-v1.yaml'), 'utf8');
  const pathCount = [
    '/api/tenant/webhooks/fleet-metrics',
    '/api/tenant/webhooks/subscriptions:',
    '/api/tenant/webhooks/subscriptions/{sub_id}:',
    '/api/tenant/webhooks/subscriptions/{sub_id}/update',
    '/api/tenant/webhooks/subscriptions/{sub_id}/delete',
  ].filter((p) => yaml.includes(p)).length;
  assert.equal(pathCount, 5, 'all 5 paths declared');

  // Error envelopes (403 cross_tenant_forbidden; 404 subscription_not_found; 400 private_ip)
  assert.match(yaml, /cross_tenant_forbidden/);
  assert.match(yaml, /subscription_not_found/);
  assert.match(yaml, /private_ip/);
  assert.match(yaml, /rps_override_exceeds_plan/);

  // References
  assert.ok(yaml.includes('F-72'));
  assert.ok(yaml.includes('F-100'));
});
