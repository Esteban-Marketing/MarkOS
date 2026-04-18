'use strict';

// Phase 203 Plan 04 Task 2 — replay endpoint + contract integration tests.
// Covers:
//   - 2a-2d: single-replay endpoint auth + cross-tenant + happy-path + D-07 409
//   - 2e-2g: batch-replay empty / too-large / happy-path
//   - 2h: idempotencyKey stability across rapid re-clicks inside 5-min window
//   - 2i-2j: F-98 + F-73 YAML declarations for replay paths + new delivery columns

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

// --- Fake req/res helpers -------------------------------------------------

function makeReq({ method = 'POST', headers = {}, query = {}, body = null } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.headers = headers;
  req.query = query;
  // Stream-compatible body delivery so readJson(req) in the handler works.
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

// --- Mock Supabase client -------------------------------------------------

function makeMockClient(rows) {
  const deliveries = new Map();
  const subscriptions = new Map();
  const inserted = [];
  for (const r of rows.deliveries || []) deliveries.set(r.id, r);
  for (const r of rows.subscriptions || []) subscriptions.set(r.id, r);

  function selectBuilder(table, filters = []) {
    const set = table === 'markos_webhook_deliveries' ? deliveries : subscriptions;
    return {
      eq(col, val) { return selectBuilder(table, [...filters, { col, val }]); },
      async maybeSingle() {
        for (const row of set.values()) {
          const ok = filters.every((f) => row[f.col] === f.val);
          if (ok) return { data: row, error: null };
        }
        return { data: null, error: null };
      },
    };
  }

  function insertBuilder(table, row) {
    const set = table === 'markos_webhook_deliveries' ? deliveries : subscriptions;
    inserted.push({ table, row });
    set.set(row.id, row);
    return {
      select() {
        return {
          async single() { return { data: row, error: null }; },
        };
      },
    };
  }

  return {
    from(table) {
      return {
        select: () => selectBuilder(table),
        insert: (row) => insertBuilder(table, row),
      };
    },
    __inserted: inserted,
  };
}

function makeMockQueue() {
  const captured = [];
  return {
    async push(id, options) { captured.push({ id, options: options || null }); },
    captured,
  };
}

function makeFailedDelivery(overrides = {}) {
  return {
    id: 'whdel_orig_1',
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    event_type: 'approval.created',
    body: '{"orig":true}',
    status: 'failed',
    attempt: 24,
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeSubscription(overrides = {}) {
  return {
    id: 'whsub_1',
    tenant_id: 'ten_a',
    url: 'https://example.com/hook',
    events: ['approval.created'],
    active: true,
    secret: 'shh',
    ...overrides,
  };
}

// --- Handler loaders ------------------------------------------------------

const singleHandlerPath = path.join(
  REPO_ROOT,
  'api', 'tenant', 'webhooks', 'subscriptions', '[sub_id]', 'deliveries', '[delivery_id]', 'replay.js',
);
const batchHandlerPath = path.join(
  REPO_ROOT,
  'api', 'tenant', 'webhooks', 'subscriptions', '[sub_id]', 'dlq', 'replay.js',
);

function loadSingleHandler() {
  // eslint-disable-next-line global-require
  return require(singleHandlerPath);
}
function loadBatchHandler() {
  // eslint-disable-next-line global-require
  return require(batchHandlerPath);
}

// --- Tests ----------------------------------------------------------------

test('single replay: 401 when x-markos-user-id missing', async () => {
  const handler = loadSingleHandler();
  const req = makeReq({ headers: {}, query: { sub_id: 'whsub_1', delivery_id: 'whdel_orig_1' } });
  const res = makeRes();
  await handler.handleReplaySingle(req, res, {
    supabase: makeMockClient({ subscriptions: [], deliveries: [] }),
    queue: makeMockQueue(),
  });
  await res.waitForEnd();
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.json(), { error: 'unauthorized' });
});

test('single replay: 403 cross_tenant_forbidden when subscription belongs to another tenant', async () => {
  const handler = loadSingleHandler();
  const supabase = makeMockClient({
    subscriptions: [makeSubscription({ tenant_id: 'ten_b' })],
    deliveries: [makeFailedDelivery()],
  });
  const req = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1', delivery_id: 'whdel_orig_1' },
  });
  const res = makeRes();
  await handler.handleReplaySingle(req, res, { supabase, queue: makeMockQueue() });
  await res.waitForEnd();
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.json(), { error: 'cross_tenant_forbidden' });
});

test('single replay: 200 happy path returns { ok, original_id, new_id }', async () => {
  const handler = loadSingleHandler();
  const supabase = makeMockClient({
    subscriptions: [makeSubscription()],
    deliveries: [makeFailedDelivery()],
  });
  const queue = makeMockQueue();
  const req = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1', delivery_id: 'whdel_orig_1' },
  });
  const res = makeRes();
  await handler.handleReplaySingle(req, res, {
    supabase,
    queue,
    enqueueAuditStaging: async () => {},
  });
  await res.waitForEnd();
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.ok, true);
  assert.equal(body.original_id, 'whdel_orig_1');
  assert.ok(body.new_id.startsWith('del_'));
  assert.equal(queue.captured.length, 1);
});

test('single replay: 409 not_failed when delivery.status=delivered (D-07)', async () => {
  const handler = loadSingleHandler();
  const supabase = makeMockClient({
    subscriptions: [makeSubscription()],
    deliveries: [makeFailedDelivery({ status: 'delivered' })],
  });
  const req = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1', delivery_id: 'whdel_orig_1' },
  });
  const res = makeRes();
  await handler.handleReplaySingle(req, res, {
    supabase,
    queue: makeMockQueue(),
    enqueueAuditStaging: async () => {},
  });
  await res.waitForEnd();
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.json(), { error: 'not_failed' });
});

test('batch replay: 400 empty_batch when delivery_ids is empty array', async () => {
  const handler = loadBatchHandler();
  const supabase = makeMockClient({
    subscriptions: [makeSubscription()],
    deliveries: [],
  });
  const req = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1' },
    body: { delivery_ids: [] },
  });
  const res = makeRes();
  await handler.handleReplayBatch(req, res, {
    supabase,
    queue: makeMockQueue(),
    enqueueAuditStaging: async () => {},
  });
  await res.waitForEnd();
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.json(), { error: 'empty_batch' });
});

test('batch replay: 400 batch_too_large when delivery_ids.length > 100', async () => {
  const handler = loadBatchHandler();
  const supabase = makeMockClient({
    subscriptions: [makeSubscription()],
    deliveries: [],
  });
  const ids = Array.from({ length: 101 }, (_, i) => `whdel_${i}`);
  const req = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1' },
    body: { delivery_ids: ids },
  });
  const res = makeRes();
  await handler.handleReplayBatch(req, res, {
    supabase,
    queue: makeMockQueue(),
    enqueueAuditStaging: async () => {},
  });
  await res.waitForEnd();
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.json(), { error: 'batch_too_large' });
});

test('batch replay: 200 happy path returns { ok, batch_id, count, replayed, skipped }', async () => {
  const handler = loadBatchHandler();
  const supabase = makeMockClient({
    subscriptions: [makeSubscription()],
    deliveries: [
      makeFailedDelivery({ id: 'whdel_1' }),
      makeFailedDelivery({ id: 'whdel_2' }),
    ],
  });
  const queue = makeMockQueue();
  const req = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1' },
    body: { delivery_ids: ['whdel_1', 'whdel_2'] },
  });
  const res = makeRes();
  await handler.handleReplayBatch(req, res, {
    supabase,
    queue,
    enqueueAuditStaging: async () => {},
  });
  await res.waitForEnd();
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.ok, true);
  assert.ok(body.batch_id.startsWith('batch_'));
  assert.equal(body.count, 2);
  assert.equal(body.replayed.length, 2);
  assert.equal(body.skipped.length, 0);
  assert.equal(queue.captured.length, 2);
});

test('batch replay idempotencyKey stable across rapid re-clicks in same 5-min window (RESEARCH Pitfall 7)', async () => {
  const handler = loadBatchHandler();
  const fixedNow = 1_700_000_000_000; // Math.floor(fixedNow / 300_000) is the same bucket for any time in that 5-min window

  // Invocation 1
  const supabase1 = makeMockClient({
    subscriptions: [makeSubscription()],
    deliveries: [makeFailedDelivery({ id: 'whdel_1' }), makeFailedDelivery({ id: 'whdel_2' })],
  });
  const queue1 = makeMockQueue();
  const req1 = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1' },
    body: { delivery_ids: ['whdel_1', 'whdel_2'] },
  });
  const res1 = makeRes();
  await handler.handleReplayBatch(req1, res1, {
    supabase: supabase1, queue: queue1,
    enqueueAuditStaging: async () => {},
    now: () => fixedNow,
  });
  await res1.waitForEnd();

  // Invocation 2 — seconds later, same 5-min bucket
  const supabase2 = makeMockClient({
    subscriptions: [makeSubscription()],
    deliveries: [makeFailedDelivery({ id: 'whdel_1' }), makeFailedDelivery({ id: 'whdel_2' })],
  });
  const queue2 = makeMockQueue();
  const req2 = makeReq({
    headers: { 'x-markos-user-id': 'u1', 'x-markos-tenant-id': 'ten_a' },
    query: { sub_id: 'whsub_1' },
    body: { delivery_ids: ['whdel_1', 'whdel_2'] },
  });
  const res2 = makeRes();
  await handler.handleReplayBatch(req2, res2, {
    supabase: supabase2, queue: queue2,
    enqueueAuditStaging: async () => {},
    now: () => fixedNow + 2000, // +2s, same bucket
  });
  await res2.waitForEnd();

  // Collect per-original_id idempotency keys from each batch.
  const keys1 = queue1.captured.map((c) => c.options?.idempotencyKey).sort();
  const keys2 = queue2.captured.map((c) => c.options?.idempotencyKey).sort();
  assert.deepEqual(keys1, keys2, 'idempotencyKeys must be identical across two invocations inside same 5-min window');
});

test('F-98 contract declares both replay paths + 409 already_replayed envelope shape', () => {
  const yamlPath = path.join(REPO_ROOT, 'contracts', 'F-98-webhook-dlq-v1.yaml');
  assert.ok(fs.existsSync(yamlPath), 'F-98 contract must exist');
  const text = fs.readFileSync(yamlPath, 'utf8');

  assert.match(text, /flow_id:\s*F-98/);
  assert.match(
    text,
    /\/api\/tenant\/webhooks\/subscriptions\/\{sub_id\}\/deliveries\/\{delivery_id\}\/replay/,
    'F-98 must declare the single-replay path',
  );
  assert.match(
    text,
    /\/api\/tenant\/webhooks\/subscriptions\/\{sub_id\}\/dlq\/replay/,
    'F-98 must declare the batch replay path',
  );
  assert.match(text, /not_failed/, 'F-98 must declare the not_failed error envelope');
  assert.match(text, /cross_tenant_forbidden/, 'F-98 must declare the cross_tenant_forbidden error');
  assert.match(text, /batch_too_large/, 'F-98 must declare the batch_too_large error');
});

test('F-73 contract extended with replayed_from + dlq_at + outbound replay headers', () => {
  const yamlPath = path.join(REPO_ROOT, 'contracts', 'F-73-webhook-delivery-v1.yaml');
  assert.ok(fs.existsSync(yamlPath));
  const text = fs.readFileSync(yamlPath, 'utf8');

  assert.match(text, /replayed_from/, 'F-73 must declare replayed_from column');
  assert.match(text, /dlq_at/, 'F-73 must declare dlq_at column');
  assert.match(text, /x-markos-replayed-from/i, 'F-73 must declare x-markos-replayed-from outbound header');
  assert.match(text, /x-markos-attempt/i, 'F-73 must declare x-markos-attempt outbound header');
});
