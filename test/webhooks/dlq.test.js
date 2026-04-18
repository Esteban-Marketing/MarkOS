'use strict';

// Phase 203 Plan 03 Task 1 — DLQ library tests (RED).
// Covers behaviors 1a-1k per 203-03-PLAN.md. Every assertion runs against a
// mock Supabase client that records chained calls and returns canned data/error.
// enqueueAuditStaging injection via `deps.enqueueAuditStaging` (matches pattern
// used elsewhere in the codebase for fire-and-forget audit emit seams).

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  listDLQ,
  countDLQ,
  markFailed,
  markDelivered,
  purgeExpired,
  DLQ_WINDOW_DAYS,
} = require('../../lib/markos/webhooks/dlq.cjs');

// ---------------------------------------------------------------------------
// Mock Supabase client. Records every chain call for post-hoc assertions.
// - `update` / `delete` / `select` / `eq` / `not` / `gte` / `lt` / `order` /
//   `limit` are chainable; terminal methods are `maybeSingle` and `then`.
// - `data` / `error` / `count` are configured per instance.
// ---------------------------------------------------------------------------
function mockSupabase({ data, error, count, listData, maybeSingleData } = {}) {
  const calls = [];

  function chain(op) {
    const state = {
      op,
      table: null,
      filters: [],
      mods: {},
      orders: [],
      limit: null,
      selectArgs: null,
    };
    const handle = {
      insert(row) { state.row = row; return handle; },
      update(patch) { state.patch = patch; return handle; },
      delete() { state.op = 'delete'; return handle; },
      select(cols, opts) { state.selectArgs = { cols, opts }; return handle; },
      eq(col, val) { state.filters.push(['eq', col, val]); return handle; },
      not(col, operator, val) { state.filters.push(['not', col, operator, val]); return handle; },
      gte(col, val) { state.filters.push(['gte', col, val]); return handle; },
      lt(col, val) { state.filters.push(['lt', col, val]); return handle; },
      order(col, opts) { state.orders.push([col, opts]); return handle; },
      limit(n) { state.limit = n; return handle; },
      async maybeSingle() {
        calls.push({ ...state, terminal: 'maybeSingle' });
        if (error) return { data: null, error };
        return { data: maybeSingleData !== undefined ? maybeSingleData : (data || null), error: null };
      },
      then(onFulfilled, onRejected) {
        // Thenable so `await client.from(...)...` resolves to { data, error, count }.
        calls.push({ ...state, terminal: 'await' });
        if (error) return Promise.resolve({ data: null, error, count: null }).then(onFulfilled, onRejected);
        const resolved = { data: listData !== undefined ? listData : (data !== undefined ? data : []), error: null };
        if (count !== undefined) resolved.count = count;
        return Promise.resolve(resolved).then(onFulfilled, onRejected);
      },
    };
    return handle;
  }

  const client = {
    from(table) {
      const h = {};
      for (const op of ['select', 'update', 'delete', 'insert']) {
        h[op] = function (arg1, arg2) {
          const c = chain(op);
          c._setTable = null;
          // Thread the table through the next chained state.
          calls.push({ __entered: table, op });
          if (op === 'select') return c.select(arg1, arg2);
          if (op === 'update') return c.update(arg1);
          if (op === 'insert') return c.insert(arg1);
          if (op === 'delete') return c.delete();
          return c;
        };
      }
      return h;
    },
    _calls: calls,
  };
  return client;
}

// ---------------------------------------------------------------------------
beforeEach(() => {
  // no-op; each test builds its own mock client.
});

describe('listDLQ', () => {
  test('1a: returns only status=failed + dlq_at not null + dlq_at > now-7d, tenant-scoped', async () => {
    const rows = [{ id: 'whdel_1', tenant_id: 't-1', status: 'failed' }];
    const client = mockSupabase({ listData: rows });
    const out = await listDLQ(client, { tenant_id: 't-1' });
    assert.deepEqual(out, rows);

    const chainCall = client._calls.find((c) => c.terminal === 'await');
    assert.ok(chainCall, 'list query should terminate via await');
    // filter assertions
    const filters = chainCall.filters;
    const hasEq = filters.find(f => f[0] === 'eq' && f[1] === 'tenant_id' && f[2] === 't-1');
    const hasStatus = filters.find(f => f[0] === 'eq' && f[1] === 'status' && f[2] === 'failed');
    const hasNotNull = filters.find(f => f[0] === 'not' && f[1] === 'dlq_at');
    const hasGteWindow = filters.find(f => f[0] === 'gte' && f[1] === 'dlq_at');
    assert.ok(hasEq, 'must filter by tenant_id');
    assert.ok(hasStatus, "must filter status='failed'");
    assert.ok(hasNotNull, 'must filter dlq_at not null');
    assert.ok(hasGteWindow, 'must filter dlq_at >= now-7d');
    // order by dlq_at desc
    assert.ok(chainCall.orders.some((o) => o[0] === 'dlq_at' && o[1]?.ascending === false),
      'must order by dlq_at descending');
  });

  test('1b: cross-tenant guard — throws when tenant_id missing', async () => {
    const client = mockSupabase({ listData: [] });
    await assert.rejects(
      () => listDLQ(client, { subscription_id: 'whsub_x' }),
      /tenant_id required/,
    );
  });

  test('1c: without subscription_id — lists all DLQ for tenant', async () => {
    const client = mockSupabase({ listData: [{ id: 'a' }, { id: 'b' }] });
    const out = await listDLQ(client, { tenant_id: 't-1' });
    assert.equal(out.length, 2);
    const chainCall = client._calls.find((c) => c.terminal === 'await');
    // No subscription_id filter should be present
    const hasSub = chainCall.filters.find((f) => f[0] === 'eq' && f[1] === 'subscription_id');
    assert.ok(!hasSub, 'no subscription_id filter when not provided');
  });

  test('1c.2: with subscription_id — adds subscription_id filter', async () => {
    const client = mockSupabase({ listData: [] });
    await listDLQ(client, { tenant_id: 't-1', subscription_id: 'whsub_x' });
    const chainCall = client._calls.find((c) => c.terminal === 'await');
    const hasSub = chainCall.filters.find((f) => f[0] === 'eq' && f[1] === 'subscription_id' && f[2] === 'whsub_x');
    assert.ok(hasSub, 'subscription_id filter must be present when provided');
  });

  test('1a.err: throws on supabase error', async () => {
    const client = mockSupabase({ error: { message: 'db-err' } });
    await assert.rejects(() => listDLQ(client, { tenant_id: 't-1' }), /db-err/);
  });
});

describe('countDLQ', () => {
  test('1d: returns integer count', async () => {
    const client = mockSupabase({ listData: [], count: 7 });
    const n = await countDLQ(client, { tenant_id: 't-1' });
    assert.equal(n, 7);
  });

  test('1d.zero: returns 0 when count missing/null', async () => {
    const client = mockSupabase({ listData: [] });
    const n = await countDLQ(client, { tenant_id: 't-1' });
    assert.equal(n, 0);
  });

  test('1d.throws: throws when tenant_id missing', async () => {
    const client = mockSupabase({});
    await assert.rejects(() => countDLQ(client, {}), /tenant_id required/);
  });
});

describe('markFailed', () => {
  test('1e: sets status=failed, dlq_reason, final_attempt, dlq_at, updated_at', async () => {
    const client = mockSupabase({ maybeSingleData: { id: 'whdel_1', status: 'failed' } });
    const row = await markFailed(client, 'whdel_1', { reason: 'http_500', final_attempt: 24 });
    assert.ok(row);
    const updateCall = client._calls.find((c) => c.terminal === 'maybeSingle' && c.op === 'update');
    assert.ok(updateCall, 'should run update→maybeSingle');
    assert.equal(updateCall.patch.status, 'failed');
    assert.equal(updateCall.patch.dlq_reason, 'http_500');
    assert.equal(updateCall.patch.final_attempt, 24);
    assert.ok(updateCall.patch.dlq_at, 'dlq_at must be set');
    assert.ok(updateCall.patch.updated_at, 'updated_at must be set');
    const idFilter = updateCall.filters.find((f) => f[0] === 'eq' && f[1] === 'id' && f[2] === 'whdel_1');
    assert.ok(idFilter, 'must filter by id');
  });

  test('1e.throws: throws when args missing', async () => {
    const client = mockSupabase({});
    await assert.rejects(() => markFailed(client, null, { reason: 'x', final_attempt: 1 }), /delivery_id/);
    await assert.rejects(() => markFailed(client, 'id', { final_attempt: 1 }), /reason/);
    await assert.rejects(() => markFailed(client, 'id', { reason: 'x' }), /final_attempt/);
  });
});

describe('markDelivered', () => {
  test('1f: sets status=delivered, updated_at; does NOT set dlq_at', async () => {
    const client = mockSupabase({ maybeSingleData: { id: 'whdel_1', status: 'delivered' } });
    await markDelivered(client, 'whdel_1');
    const updateCall = client._calls.find((c) => c.terminal === 'maybeSingle' && c.op === 'update');
    assert.ok(updateCall);
    assert.equal(updateCall.patch.status, 'delivered');
    assert.ok(updateCall.patch.updated_at);
    assert.ok(!('dlq_at' in updateCall.patch), 'dlq_at must NOT be set on happy-path delivered');
  });
});

describe('purgeExpired', () => {
  test('1g: hard-deletes rows where status=failed AND dlq_at < now-7d; returns {count}', async () => {
    const client = mockSupabase({ listData: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });
    const fakeNow = new Date('2026-04-18T12:00:00Z');
    const { count } = await purgeExpired(client, { now: fakeNow, deps: { enqueueAuditStaging: async () => {} } });
    assert.equal(count, 3);
    const delCall = client._calls.find((c) => c.terminal === 'await' && c.op === 'delete');
    assert.ok(delCall, 'delete chain must run');
    const statusFilter = delCall.filters.find((f) => f[0] === 'eq' && f[1] === 'status' && f[2] === 'failed');
    const ltFilter = delCall.filters.find((f) => f[0] === 'lt' && f[1] === 'dlq_at');
    assert.ok(statusFilter, "must filter status='failed'");
    assert.ok(ltFilter, 'must filter dlq_at < cutoff');
    // cutoff must be 7 days before fakeNow
    const cutoff = new Date(ltFilter[2]);
    const expected = new Date(fakeNow.getTime() - 7 * 86400 * 1000);
    assert.equal(cutoff.toISOString(), expected.toISOString());
  });

  test('1h: emits one audit row via enqueueAuditStaging after delete resolves', async () => {
    const emits = [];
    const audit = async (client, entry) => { emits.push({ client, entry }); };
    const client = mockSupabase({ listData: [{ id: 'a' }, { id: 'b' }] });
    const fakeNow = new Date('2026-04-18T12:00:00Z');
    const { count } = await purgeExpired(client, { now: fakeNow, deps: { enqueueAuditStaging: audit } });
    assert.equal(count, 2);
    assert.equal(emits.length, 1);
    const { entry } = emits[0];
    assert.equal(entry.source_domain, 'webhooks');
    assert.equal(entry.action, 'dlq.purged');
    assert.equal(entry.payload.count, 2);
    assert.equal(entry.payload.older_than, '7d');
    assert.equal(entry.payload.purged_at, fakeNow.toISOString());
  });

  test('1i: count=0 → returns {count:0} and does NOT emit audit', async () => {
    const emits = [];
    const audit = async () => { emits.push(1); };
    const client = mockSupabase({ listData: [] });
    const { count } = await purgeExpired(client, { now: new Date(), deps: { enqueueAuditStaging: audit } });
    assert.equal(count, 0);
    assert.equal(emits.length, 0, 'audit must not fire when count=0');
  });

  test('1h.swallow: audit failure does NOT fail purge (fire-and-forget)', async () => {
    const audit = async () => { throw new Error('staging-down'); };
    const client = mockSupabase({ listData: [{ id: 'a' }] });
    const { count } = await purgeExpired(client, { now: new Date(), deps: { enqueueAuditStaging: audit } });
    assert.equal(count, 1);
  });

  test('1j: markFailed does NOT delete the row — sets dlq_at so listDLQ picks it up', async () => {
    // Combined workflow test: markFailed then listDLQ should find the row.
    // (Verifies that markFailed issues an UPDATE, not a DELETE.)
    const client = mockSupabase({ maybeSingleData: { id: 'whdel_1', status: 'failed', dlq_at: 'x' } });
    await markFailed(client, 'whdel_1', { reason: 'http_500', final_attempt: 24 });
    const updateCall = client._calls.find((c) => c.terminal === 'maybeSingle' && c.op === 'update');
    assert.ok(updateCall, 'markFailed must use UPDATE, not DELETE');
    const deleteCall = client._calls.find((c) => c.op === 'delete');
    assert.ok(!deleteCall, 'markFailed must NOT emit a DELETE');
  });
});

describe('exports', () => {
  test('1k: all 5 functions + DLQ_WINDOW_DAYS constant exported', () => {
    const mod = require('../../lib/markos/webhooks/dlq.cjs');
    assert.equal(typeof mod.listDLQ, 'function');
    assert.equal(typeof mod.countDLQ, 'function');
    assert.equal(typeof mod.markFailed, 'function');
    assert.equal(typeof mod.markDelivered, 'function');
    assert.equal(typeof mod.purgeExpired, 'function');
    assert.equal(mod.DLQ_WINDOW_DAYS, 7);
  });
});
