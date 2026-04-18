'use strict';

// Phase 203 Plan 01 Task 1 — Supabase subscriptions + deliveries adapters.
// Source: 203-RESEARCH.md §Code Examples lines 631-719; store-supabase.cjs must mirror shape.
// Every adapter method is verified against a mockSupabase chain builder — no live network.

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  createSupabaseSubscriptionsStore,
  createSupabaseDeliveriesStore,
} = require('../../lib/markos/webhooks/store-supabase.cjs');

// ---------------------------------------------------------------------------
// Mock Supabase client. Every terminal method returns { data, error }.
// The `_calls` array records every .from() → operation chain invocation for assertions.
// ---------------------------------------------------------------------------
function mockSupabase({ single, maybeSingle, list, error } = {}) {
  const calls = [];
  function chain(op) {
    const state = { op, filters: [], mods: {}, orders: [], limit: null };
    const handle = {
      insert(row) { state.row = row; return handle; },
      update(patch) { state.patch = patch; return handle; },
      select() { return handle; },
      eq(col, val) { state.filters.push(['eq', col, val]); return handle; },
      gte(col, val) { state.filters.push(['gte', col, val]); return handle; },
      order(col, opts) { state.orders.push([col, opts]); return handle; },
      limit(n) { state.limit = n; return handle; },
      async single() {
        calls.push({ ...state, terminal: 'single' });
        if (error) return { data: null, error };
        return { data: single !== undefined ? single : state.row || state.patch || null, error: null };
      },
      async maybeSingle() {
        calls.push({ ...state, terminal: 'maybeSingle' });
        if (error) return { data: null, error };
        return { data: maybeSingle !== undefined ? maybeSingle : null, error: null };
      },
      then(onFulfilled, onRejected) {
        // Thenable for list queries (listByTenant calls await q without terminal).
        calls.push({ ...state, terminal: 'await' });
        const data = error ? null : (list !== undefined ? list : []);
        const err = error || null;
        return Promise.resolve({ data, error: err }).then(onFulfilled, onRejected);
      },
    };
    return handle;
  }
  const client = {
    from(table) {
      const h = {};
      for (const op of ['insert', 'update', 'select']) {
        h[op] = function (arg) {
          const c = chain(op);
          if (op === 'insert' || op === 'update') return c[op](arg);
          return c[op]();
        };
      }
      // capture table name on every op
      const wrapped = {};
      for (const op of ['insert', 'update', 'select']) {
        wrapped[op] = function (arg) {
          const c = chain(op);
          c._table = table;
          calls._lastTable = table;
          if (op === 'insert' || op === 'update') return c[op](arg);
          return c[op]();
        };
      }
      return wrapped;
    },
    _calls: calls,
  };
  return client;
}

// ============================================================================
// createSupabaseSubscriptionsStore
// ============================================================================

describe('createSupabaseSubscriptionsStore', () => {
  test('1a insert: chains .from().insert().select().single() and returns row', async () => {
    const inserted = { id: 'whsub_x', tenant_id: 't-1', url: 'https://a', active: true };
    const client = mockSupabase({ single: inserted });
    const store = createSupabaseSubscriptionsStore(client);

    const result = await store.insert({ id: 'whsub_x', tenant_id: 't-1', url: 'https://a' });

    assert.deepEqual(result, inserted);
    assert.equal(client._calls[0].op, 'insert');
    assert.equal(client._calls[0].terminal, 'single');
    assert.equal(client._calls._lastTable, 'markos_webhook_subscriptions');
  });

  test('1b updateActive: tenant_id is FIRST filter then id', async () => {
    const updated = { id: 'whsub_x', tenant_id: 't-1', active: false };
    const client = mockSupabase({ maybeSingle: updated });
    const store = createSupabaseSubscriptionsStore(client);

    const result = await store.updateActive('t-1', 'whsub_x', false);

    assert.deepEqual(result, updated);
    const call = client._calls[0];
    assert.equal(call.op, 'update');
    assert.equal(call.terminal, 'maybeSingle');
    // tenant_id MUST be filtered FIRST (cross-tenant guard per T-203-01-02)
    assert.deepEqual(call.filters[0], ['eq', 'tenant_id', 't-1']);
    assert.deepEqual(call.filters[1], ['eq', 'id', 'whsub_x']);
    // patch includes active + updated_at
    assert.equal(call.patch.active, false);
    assert.equal(typeof call.patch.updated_at, 'string');
  });

  test('1c listByTenant: filters tenant_id AND active=true', async () => {
    const rows = [{ id: 'whsub_a', tenant_id: 't-1', active: true }];
    const client = mockSupabase({ list: rows });
    const store = createSupabaseSubscriptionsStore(client);

    const result = await store.listByTenant('t-1');
    assert.deepEqual(result, rows);
    const call = client._calls[0];
    assert.equal(call.op, 'select');
    // Both filters must be present
    const filterCols = call.filters.map((f) => f[1]);
    assert.ok(filterCols.includes('tenant_id'));
    assert.ok(filterCols.includes('active'));
  });

  test('1d findById: returns null when maybeSingle returns null', async () => {
    const client = mockSupabase({ maybeSingle: null });
    const store = createSupabaseSubscriptionsStore(client);

    const result = await store.findById('t-1', 'whsub_missing');
    assert.equal(result, null);
    const call = client._calls[0];
    assert.deepEqual(call.filters[0], ['eq', 'tenant_id', 't-1']);
    assert.deepEqual(call.filters[1], ['eq', 'id', 'whsub_missing']);
  });

  test('throws typed error on supabase error', async () => {
    const client = mockSupabase({ error: { message: 'network_down' } });
    const store = createSupabaseSubscriptionsStore(client);

    await assert.rejects(
      () => store.insert({ id: 'x', tenant_id: 't-1' }),
      /store-supabase.*network_down/,
    );
  });
});

// ============================================================================
// createSupabaseDeliveriesStore
// ============================================================================

describe('createSupabaseDeliveriesStore', () => {
  test('1e insert chains .insert().select().single()', async () => {
    const row = { id: 'whdel_x', tenant_id: 't-1', status: 'pending' };
    const client = mockSupabase({ single: row });
    const store = createSupabaseDeliveriesStore(client);

    const result = await store.insert({ id: 'whdel_x', tenant_id: 't-1' });
    assert.deepEqual(result, row);
    assert.equal(client._calls._lastTable, 'markos_webhook_deliveries');
    assert.equal(client._calls[0].op, 'insert');
    assert.equal(client._calls[0].terminal, 'single');
  });

  test('1f update merges updated_at ISO timestamp into patch', async () => {
    const row = { id: 'whdel_x', status: 'delivered' };
    const client = mockSupabase({ maybeSingle: row });
    const store = createSupabaseDeliveriesStore(client);

    const before = Date.now();
    await store.update('whdel_x', { status: 'delivered', attempt: 2 });
    const call = client._calls[0];
    assert.equal(call.op, 'update');
    assert.equal(call.terminal, 'maybeSingle');
    assert.equal(call.patch.status, 'delivered');
    assert.equal(call.patch.attempt, 2);
    assert.equal(typeof call.patch.updated_at, 'string');
    const patchTs = Date.parse(call.patch.updated_at);
    assert.ok(patchTs >= before, 'updated_at must be >= before-call timestamp');
  });

  test('1g listByTenant applies status filter when provided', async () => {
    const rows = [{ id: 'whdel_a', tenant_id: 't-1', status: 'failed' }];
    const client = mockSupabase({ list: rows });
    const store = createSupabaseDeliveriesStore(client);

    const result = await store.listByTenant('t-1', { status: 'failed' });
    assert.deepEqual(result, rows);
    const call = client._calls[0];
    assert.equal(call.op, 'select');
    const cols = call.filters.map((f) => f[1]);
    assert.ok(cols.includes('tenant_id'));
    assert.ok(cols.includes('status'));
  });

  test('listByTenant orders created_at desc with limit 100 default', async () => {
    const client = mockSupabase({ list: [] });
    const store = createSupabaseDeliveriesStore(client);
    await store.listByTenant('t-1');
    const call = client._calls[0];
    const order = call.orders[0];
    assert.equal(order[0], 'created_at');
    assert.equal(order[1].ascending, false);
    assert.equal(call.limit, 100);
  });

  test('listByTenant honors custom limit + since', async () => {
    const client = mockSupabase({ list: [] });
    const store = createSupabaseDeliveriesStore(client);
    await store.listByTenant('t-1', { limit: 25, since: '2026-04-01T00:00:00Z' });
    const call = client._calls[0];
    assert.equal(call.limit, 25);
    const gte = call.filters.find((f) => f[0] === 'gte');
    assert.deepEqual(gte, ['gte', 'created_at', '2026-04-01T00:00:00Z']);
  });

  test('findById returns null when no row', async () => {
    const client = mockSupabase({ maybeSingle: null });
    const store = createSupabaseDeliveriesStore(client);
    const result = await store.findById('whdel_nope');
    assert.equal(result, null);
  });

  test('throws typed error on deliveries.update failure', async () => {
    const client = mockSupabase({ error: { message: 'constraint_violation' } });
    const store = createSupabaseDeliveriesStore(client);
    await assert.rejects(
      () => store.update('whdel_x', { status: 'delivered' }),
      /store-supabase.*constraint_violation/,
    );
  });
});
