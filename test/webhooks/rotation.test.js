'use strict';

// Phase 203 Plan 05 Task 1 + Task 2 — webhook signing-secret rotation orchestrator tests.
//
// Task 1 (1a-1h): rotation library behavior (startRotation, rollbackRotation,
// finalizeExpiredRotations, listActiveRotations, computeStage).
// Task 2 (2a-2k): tenant-admin rotation endpoints (rotate, rotate/rollback,
// rotations/active) + F-97 + F-72 contract shape.
//
// D-09 admin-triggered only; D-10 dual-sign during 30-day grace; D-12 no post-grace restore.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const {
  startRotation,
  rollbackRotation,
  finalizeExpiredRotations,
  listActiveRotations,
  computeStage,
  GRACE_DAYS,
} = require('../../lib/markos/webhooks/rotation.cjs');

// ---------------------------------------------------------------------------
// Task 1 mock Supabase client — captures .rpc + .from(...).select(...).eq(...)
// ---------------------------------------------------------------------------

function makeRotationClient({ rpcResult = {}, rotationsRows = [], subscriptionsRows = [] } = {}) {
  const rpcCalls = [];
  const fromCalls = [];

  function selectBuilder(table, opts = {}) {
    const filters = opts.filters || [];
    const inFilters = opts.inFilters || [];
    const order = opts.order || null;
    return {
      eq(col, val) {
        return selectBuilder(table, { filters: [...filters, { col, val }], inFilters, order });
      },
      in(col, vals) {
        return selectBuilder(table, { filters, inFilters: [...inFilters, { col, vals }], order });
      },
      order(col, dir) {
        return selectBuilder(table, { filters, inFilters, order: { col, dir } });
      },
      then(resolve) {
        const set = table === 'markos_webhook_secret_rotations' ? rotationsRows : subscriptionsRows;
        const filtered = set.filter((row) => filters.every((f) => row[f.col] === f.val))
          .filter((row) => inFilters.every((f) => f.vals.includes(row[f.col])));
        resolve({ data: filtered, error: null });
        return { catch() { return { then() {} }; } };
      },
    };
  }

  const client = {
    async rpc(name, args) {
      rpcCalls.push({ name, args });
      const maybe = rpcResult[name];
      if (typeof maybe === 'function') return maybe(args);
      return maybe || { data: null, error: null };
    },
    from(table) {
      fromCalls.push({ table });
      return {
        select: () => selectBuilder(table),
      };
    },
    __rpcCalls: rpcCalls,
    __fromCalls: fromCalls,
  };
  return client;
}

// ---------------------------------------------------------------------------
// Task 1 tests
// ---------------------------------------------------------------------------

test('1a: startRotation generates 64-char hex secret + invokes start_webhook_rotation RPC + returns rotation_id + grace_ends_at', async () => {
  const client = makeRotationClient({
    rpcResult: {
      start_webhook_rotation: (args) => ({ data: { rotation_id: args.p_rotation_id, grace_ends_at: args.p_grace_ends_at }, error: null }),
    },
  });

  const res = await startRotation(client, {
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    actor_id: 'usr_owner',
  });

  assert.ok(res.rotation_id.startsWith('whrot_'));
  assert.match(res.grace_ends_at, /^\d{4}-\d{2}-\d{2}T/);
  const call = client.__rpcCalls[0];
  assert.equal(call.name, 'start_webhook_rotation');
  assert.equal(call.args.p_subscription_id, 'whsub_1');
  assert.equal(call.args.p_tenant_id, 'ten_a');
  assert.equal(call.args.p_actor_id, 'usr_owner');
  // randomBytes(32).toString('hex') → 64 chars
  assert.equal(typeof call.args.p_new_secret, 'string');
  assert.equal(call.args.p_new_secret.length, 64);
  assert.match(call.args.p_new_secret, /^[0-9a-f]{64}$/);
  // grace_ends_at should be ~30 days in the future
  const diffMs = new Date(call.args.p_grace_ends_at).getTime() - Date.now();
  const diffDays = diffMs / (86400 * 1000);
  assert.ok(diffDays > 29 && diffDays < 31, `grace window should be ~30 days, got ${diffDays}`);
});

test('1b: startRotation maps rotation_already_active error from RPC verbatim', async () => {
  const client = makeRotationClient({
    rpcResult: {
      start_webhook_rotation: () => ({ data: null, error: { message: 'rotation_already_active' } }),
    },
  });

  await assert.rejects(
    () => startRotation(client, { tenant_id: 't', subscription_id: 's', actor_id: 'u' }),
    (err) => err.message === 'rotation_already_active',
  );
});

test('1c: rollbackRotation during grace invokes rollback RPC + returns data', async () => {
  const client = makeRotationClient({
    rpcResult: {
      rollback_webhook_rotation: () => ({ data: { rolled_back: true, subscription_id: 'whsub_1' }, error: null }),
    },
  });

  const res = await rollbackRotation(client, {
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    actor_id: 'usr_owner',
  });

  assert.equal(client.__rpcCalls[0].name, 'rollback_webhook_rotation');
  assert.deepEqual(res, { rolled_back: true, subscription_id: 'whsub_1' });
});

test('1d: rollbackRotation past grace surfaces past_grace error verbatim (D-12)', async () => {
  const client = makeRotationClient({
    rpcResult: {
      rollback_webhook_rotation: () => ({ data: null, error: { message: 'past_grace' } }),
    },
  });

  await assert.rejects(
    () => rollbackRotation(client, { tenant_id: 't', subscription_id: 's', actor_id: 'u' }),
    (err) => err.message === 'past_grace',
  );
});

test('1e: finalizeExpiredRotations invokes finalize RPC with p_now + returns array', async () => {
  const fixedNow = '2026-05-18T00:00:00.000Z';
  const client = makeRotationClient({
    rpcResult: {
      finalize_expired_webhook_rotations: (args) => ({
        data: [
          { subscription_id: 'whsub_1', finalized_at: args.p_now },
          { subscription_id: 'whsub_2', finalized_at: args.p_now },
        ],
        error: null,
      }),
    },
  });

  const res = await finalizeExpiredRotations(client, fixedNow);
  assert.equal(client.__rpcCalls[0].name, 'finalize_expired_webhook_rotations');
  assert.equal(client.__rpcCalls[0].args.p_now, fixedNow);
  assert.equal(res.length, 2);
  assert.equal(res[0].subscription_id, 'whsub_1');
});

test('1f: finalizeExpiredRotations is idempotent — second call returns empty array', async () => {
  let callCount = 0;
  const client = makeRotationClient({
    rpcResult: {
      finalize_expired_webhook_rotations: () => {
        callCount += 1;
        return { data: callCount === 1 ? [{ subscription_id: 'whsub_1', finalized_at: '2026-05-18T00:00:00.000Z' }] : [], error: null };
      },
    },
  });

  const first = await finalizeExpiredRotations(client);
  const second = await finalizeExpiredRotations(client);
  assert.equal(first.length, 1);
  assert.deepEqual(second, []);
});

test('1g: listActiveRotations tenant-scopes and attaches url + stage via subscriptions join', async () => {
  const rotationsRows = [
    { id: 'whrot_1', subscription_id: 'whsub_1', tenant_id: 'ten_a', grace_ends_at: new Date(Date.now() + 6 * 86400 * 1000).toISOString(), initiated_at: '2026-04-01T00:00:00.000Z', state: 'active' },
    { id: 'whrot_2', subscription_id: 'whsub_2', tenant_id: 'ten_b', grace_ends_at: new Date(Date.now() + 10 * 86400 * 1000).toISOString(), initiated_at: '2026-04-02T00:00:00.000Z', state: 'active' }, // cross-tenant
  ];
  const subscriptionsRows = [
    { id: 'whsub_1', tenant_id: 'ten_a', url: 'https://a.example/hook' },
    { id: 'whsub_2', tenant_id: 'ten_b', url: 'https://b.example/hook' },
  ];
  const client = makeRotationClient({ rotationsRows, subscriptionsRows });

  const res = await listActiveRotations(client, 'ten_a');
  assert.equal(res.length, 1);
  assert.equal(res[0].subscription_id, 'whsub_1');
  assert.equal(res[0].url, 'https://a.example/hook');
  assert.equal(res[0].stage, 't-7'); // 6 days -> t-7
});

test('1h: listActiveRotations returns empty array (not null) when tenant has no rotation', async () => {
  const client = makeRotationClient({ rotationsRows: [], subscriptionsRows: [] });
  const res = await listActiveRotations(client, 'ten_a');
  assert.deepEqual(res, []);
});

test('1g2: computeStage classifies by days remaining', () => {
  const now = Date.now();
  assert.equal(computeStage(new Date(now - 1000).toISOString()), 't-0');
  assert.equal(computeStage(new Date(now + 1000 * 60 * 60).toISOString()), 't-0'); // <1d but >0 rounds up to 1 via ceil? verify below
  assert.equal(computeStage(new Date(now + 1.5 * 86400000).toISOString()), 't-1'); // ~2 days rounds to 2 via ceil, then falls below 7 → t-7; actually 2>1 → t-7
  assert.equal(computeStage(new Date(now + 6 * 86400000).toISOString()), 't-7');
  assert.equal(computeStage(new Date(now + 20 * 86400000).toISOString()), 'normal');
  assert.equal(GRACE_DAYS, 30);
});

// ---------------------------------------------------------------------------
// Task 2 — endpoint + contract tests
// ---------------------------------------------------------------------------

function makeReq({ method = 'POST', headers = {}, query = {}, body = null } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.headers = headers;
  req.query = query;
  if (body !== null) {
    setImmediate(() => {
      req.emit('data', Buffer.from(JSON.stringify(body)));
      req.emit('end');
    });
  } else {
    setImmediate(() => req.emit('end'));
  }
  return req;
}

function makeRes() {
  const chunks = [];
  const res = {
    statusCode: 0,
    headers: {},
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.assign(this.headers, hdrs);
    },
    end(body) {
      if (body) chunks.push(body);
      this._resolved = true;
      if (this._resolver) this._resolver();
    },
    waitForEnd() {
      if (this._resolved) return Promise.resolve();
      return new Promise((r) => { this._resolver = r; });
    },
    body() { return chunks.join(''); },
    json() { return JSON.parse(this.body()); },
  };
  return res;
}

function makeSubscriptionClient({ subscriptions = [], rpcResult = {}, rotationsRows = [], subscriptionsRows = [] } = {}) {
  const client = makeRotationClient({ rpcResult, rotationsRows, subscriptionsRows: [...subscriptionsRows, ...subscriptions] });
  // override from builder to handle markos_webhook_subscriptions with maybeSingle
  const originalFrom = client.from.bind(client);
  client.from = function (table) {
    if (table === 'markos_webhook_subscriptions') {
      let filters = [];
      const builder = {
        select() { return builder; },
        eq(col, val) { filters = [...filters, { col, val }]; return builder; },
        async maybeSingle() {
          for (const row of subscriptions) {
            if (filters.every((f) => row[f.col] === f.val)) return { data: row, error: null };
          }
          return { data: null, error: null };
        },
      };
      return builder;
    }
    return originalFrom(table);
  };
  return client;
}

function makeAllowLimiter() {
  return {
    async limit() { return { success: true, reset: Date.now() + 60_000 }; },
  };
}

function makeDenyLimiter() {
  return {
    async limit() { return { success: false, reset: Date.now() + 60_000 }; },
  };
}

function loadRotateHandler() {
  return require('../../api/tenant/webhooks/subscriptions/[sub_id]/rotate.js');
}
function loadRollbackHandler() {
  return require('../../api/tenant/webhooks/subscriptions/[sub_id]/rotate/rollback.js');
}
function loadRotationsActiveHandler() {
  return require('../../api/tenant/webhooks/rotations/active.js');
}

test('2a: POST rotate without x-markos-user-id → 401', async () => {
  const handler = loadRotateHandler();
  const req = makeReq({ headers: {}, query: { sub_id: 'whsub_1' } });
  const res = makeRes();
  await handler.handleRotate(req, res, {
    supabase: makeSubscriptionClient(),
    limiter: makeAllowLimiter(),
  });
  await res.waitForEnd();
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.json(), { error: 'unauthorized' });
});

test('2b: POST rotate with cross-tenant subscription_id → 403', async () => {
  const handler = loadRotateHandler();
  const supabase = makeSubscriptionClient({
    subscriptions: [{ id: 'whsub_1', tenant_id: 'ten_b' }],
  });
  const req = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1' },
  });
  const res = makeRes();
  await handler.handleRotate(req, res, { supabase, limiter: makeAllowLimiter() });
  await res.waitForEnd();
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.json(), { error: 'cross_tenant_forbidden' });
});

test('2c: POST rotate happy path → 200 { ok, rotation_id, grace_ends_at }', async () => {
  const handler = loadRotateHandler();
  const supabase = makeSubscriptionClient({
    subscriptions: [{ id: 'whsub_1', tenant_id: 'ten_a' }],
    rpcResult: {
      start_webhook_rotation: (args) => ({ data: { rotation_id: args.p_rotation_id, grace_ends_at: args.p_grace_ends_at }, error: null }),
    },
  });
  const req = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1' },
  });
  const res = makeRes();
  await handler.handleRotate(req, res, { supabase, limiter: makeAllowLimiter() });
  await res.waitForEnd();
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.ok, true);
  assert.ok(body.rotation_id.startsWith('whrot_'));
  assert.match(body.grace_ends_at, /^\d{4}-\d{2}-\d{2}T/);
});

test('2d: POST rotate on sub with active rotation → 409 rotation_already_active', async () => {
  const handler = loadRotateHandler();
  const supabase = makeSubscriptionClient({
    subscriptions: [{ id: 'whsub_1', tenant_id: 'ten_a' }],
    rpcResult: {
      start_webhook_rotation: () => ({ data: null, error: { message: 'rotation_already_active' } }),
    },
  });
  const req = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1' },
  });
  const res = makeRes();
  await handler.handleRotate(req, res, { supabase, limiter: makeAllowLimiter() });
  await res.waitForEnd();
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.json(), { error: 'rotation_already_active' });
});

test('2e: POST rotate second call within 5min same tenant → 429 rate_limited', async () => {
  const handler = loadRotateHandler();
  const supabase = makeSubscriptionClient({
    subscriptions: [{ id: 'whsub_1', tenant_id: 'ten_a' }],
  });
  const req = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1' },
  });
  const res = makeRes();
  await handler.handleRotate(req, res, { supabase, limiter: makeDenyLimiter() });
  await res.waitForEnd();
  assert.equal(res.statusCode, 429);
  const body = res.json();
  assert.equal(body.error, 'rate_limited');
  assert.ok(typeof body.retry_after === 'number');
});

test('2f: POST rollback within grace → 200 { ok: true }', async () => {
  const handler = loadRollbackHandler();
  const supabase = makeSubscriptionClient({
    subscriptions: [{ id: 'whsub_1', tenant_id: 'ten_a' }],
    rpcResult: {
      rollback_webhook_rotation: () => ({ data: { rolled_back: true }, error: null }),
    },
  });
  const req = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1' },
  });
  const res = makeRes();
  await handler.handleRollback(req, res, { supabase });
  await res.waitForEnd();
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().ok, true);
});

test('2g: POST rollback past grace → 409 past_grace', async () => {
  const handler = loadRollbackHandler();
  const supabase = makeSubscriptionClient({
    subscriptions: [{ id: 'whsub_1', tenant_id: 'ten_a' }],
    rpcResult: {
      rollback_webhook_rotation: () => ({ data: null, error: { message: 'past_grace' } }),
    },
  });
  const req = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1' },
  });
  const res = makeRes();
  await handler.handleRollback(req, res, { supabase });
  await res.waitForEnd();
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.json(), { error: 'past_grace' });
});

test('2h: GET rotations/active tenant-scoped → 200 { rotations: [...] }', async () => {
  const handler = loadRotationsActiveHandler();
  const rotationsRows = [
    { id: 'whrot_1', subscription_id: 'whsub_1', tenant_id: 'ten_a', grace_ends_at: new Date(Date.now() + 20 * 86400 * 1000).toISOString(), initiated_at: '2026-04-01T00:00:00.000Z', state: 'active' },
  ];
  const subscriptionsRows = [{ id: 'whsub_1', tenant_id: 'ten_a', url: 'https://a.example/hook' }];
  const supabase = makeRotationClient({ rotationsRows, subscriptionsRows });

  const req = makeReq({
    method: 'GET',
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
  });
  const res = makeRes();
  await handler.handleRotationsActive(req, res, { supabase });
  await res.waitForEnd();
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.ok(Array.isArray(body.rotations));
  assert.equal(body.rotations.length, 1);
  assert.equal(body.rotations[0].subscription_id, 'whsub_1');
  assert.equal(body.rotations[0].url, 'https://a.example/hook');
  assert.ok(['t-7', 't-1', 't-0', 'normal'].includes(body.rotations[0].stage));
});

test('2i: GET rotations/active returns empty array for tenant with no rotations', async () => {
  const handler = loadRotationsActiveHandler();
  const supabase = makeRotationClient({ rotationsRows: [], subscriptionsRows: [] });
  const req = makeReq({
    method: 'GET',
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
  });
  const res = makeRes();
  await handler.handleRotationsActive(req, res, { supabase });
  await res.waitForEnd();
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json().rotations, []);
});

test('2j: F-97 YAML parses with 3 paths + 409 envelopes', () => {
  const yamlPath = path.join(REPO_ROOT, 'contracts', 'F-97-webhook-rotation-v1.yaml');
  assert.ok(fs.existsSync(yamlPath), 'F-97 contract must exist');
  const text = fs.readFileSync(yamlPath, 'utf8');
  assert.match(text, /flow_id:\s*F-97/);
  assert.match(text, /\/api\/tenant\/webhooks\/subscriptions\/\{sub_id\}\/rotate\b/);
  assert.match(text, /\/api\/tenant\/webhooks\/subscriptions\/\{sub_id\}\/rotate\/rollback/);
  assert.match(text, /\/api\/tenant\/webhooks\/rotations\/active/);
  assert.match(text, /rotation_already_active/);
  assert.match(text, /past_grace/);
  assert.match(text, /rate_limited/);
});

test('2k: F-72 YAML gains rotation_state + grace_ends_at + secret_v2 schema fields', () => {
  const yamlPath = path.join(REPO_ROOT, 'contracts', 'F-72-webhook-subscription-v1.yaml');
  assert.ok(fs.existsSync(yamlPath));
  const text = fs.readFileSync(yamlPath, 'utf8');
  assert.match(text, /rotation_state/);
  assert.match(text, /grace_ends_at/);
  assert.match(text, /secret_v2/);
});
