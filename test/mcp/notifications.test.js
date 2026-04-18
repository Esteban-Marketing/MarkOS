'use strict';

// Phase 202 Plan 08 — Task 1: subscriptions + broadcast suite.
// Plan spec §"notifications.test.js (addSubscription adds to Redis SET, broadcastResourceUpdated
// iterates subscribers, listSubscribers returns session_ids, broadcast does not throw on
// disconnected channels)"

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SUBSCRIPTION_TTL_SECONDS,
  addSubscription,
  removeSubscription,
  listSubscribers,
  broadcastResourceUpdated,
} = require('../../lib/markos/mcp/subscriptions.cjs');

function mockRedis() {
  const sets = new Map();
  const expiries = new Map();
  return {
    sets,
    expiries,
    async sadd(k, v) {
      if (!sets.has(k)) sets.set(k, new Set());
      sets.get(k).add(v);
      return 1;
    },
    async srem(k, v) {
      const s = sets.get(k);
      if (!s) return 0;
      return s.delete(v) ? 1 : 0;
    },
    async smembers(k) {
      return Array.from(sets.get(k) || []);
    },
    async expire(k, s) {
      expiries.set(k, s);
      return 1;
    },
  };
}

test('Suite 202-08: SUBSCRIPTION_TTL_SECONDS is 24h (matches session TTL)', () => {
  assert.equal(SUBSCRIPTION_TTL_SECONDS, 24 * 60 * 60);
});

test('Suite 202-08: addSubscription adds session_id to subs:mcp:<uri> SET + sets expiry', async () => {
  const r = mockRedis();
  await addSubscription(r, 'sess-1', 'mcp://markos/canon/t1');
  const members = await listSubscribers(r, 'mcp://markos/canon/t1');
  assert.deepEqual(members.sort(), ['sess-1']);
  assert.equal(r.expiries.get('subs:mcp:mcp://markos/canon/t1'), 24 * 60 * 60);
});

test('Suite 202-08: addSubscription is idempotent (re-subscribe keeps single entry)', async () => {
  const r = mockRedis();
  await addSubscription(r, 'sess-1', 'mcp://markos/canon/t1');
  await addSubscription(r, 'sess-1', 'mcp://markos/canon/t1');
  const members = await listSubscribers(r, 'mcp://markos/canon/t1');
  assert.equal(members.length, 1);
});

test('Suite 202-08: removeSubscription removes from SET', async () => {
  const r = mockRedis();
  await addSubscription(r, 'sess-1', 'mcp://markos/canon/t1');
  await addSubscription(r, 'sess-2', 'mcp://markos/canon/t1');
  await removeSubscription(r, 'sess-1', 'mcp://markos/canon/t1');
  assert.deepEqual(await listSubscribers(r, 'mcp://markos/canon/t1'), ['sess-2']);
});

test('Suite 202-08: addSubscription requires session_id and uri', async () => {
  const r = mockRedis();
  await assert.rejects(addSubscription(r, null, 'mcp://x'), /required/);
  await assert.rejects(addSubscription(r, 'sess-1', null), /required/);
});

test('Suite 202-08: broadcastResourceUpdated writes SSE frame to each subscriber channel', async () => {
  const r = mockRedis();
  await addSubscription(r, 'sess-1', 'mcp://markos/canon/t1');
  await addSubscription(r, 'sess-2', 'mcp://markos/canon/t1');
  const writes = { 'sess-1': [], 'sess-2': [] };
  const channels = new Map([
    ['sess-1', { write: (d) => writes['sess-1'].push(d) }],
    ['sess-2', { write: (d) => writes['sess-2'].push(d) }],
  ]);
  const result = await broadcastResourceUpdated(r, 'mcp://markos/canon/t1', channels);
  assert.equal(result.notified, 2);
  assert.equal(result.removed, 0);
  for (const sid of ['sess-1', 'sess-2']) {
    const frame = writes[sid][0];
    assert.match(frame, /^data: /);
    assert.match(frame, /notifications\/resources\/updated/);
    assert.match(frame, /"uri":"mcp:\/\/markos\/canon\/t1"/);
  }
});

test('Suite 202-08: broadcastResourceUpdated removes subscribers with disconnected channels', async () => {
  const r = mockRedis();
  await addSubscription(r, 'sess-1', 'mcp://markos/canon/t1');
  await addSubscription(r, 'sess-gone', 'mcp://markos/canon/t1');
  const channels = new Map([
    ['sess-1', { write: () => {} }],
    // sess-gone intentionally absent
  ]);
  const result = await broadcastResourceUpdated(r, 'mcp://markos/canon/t1', channels);
  assert.equal(result.notified, 1);
  assert.equal(result.removed, 1);
  const remaining = await listSubscribers(r, 'mcp://markos/canon/t1');
  assert.deepEqual(remaining, ['sess-1']);
});

test('Suite 202-08: broadcastResourceUpdated handles channel.write throwing (broken pipe)', async () => {
  const r = mockRedis();
  await addSubscription(r, 'sess-broken', 'mcp://markos/canon/t1');
  const channels = new Map([
    ['sess-broken', { write: () => { throw new Error('broken pipe'); } }],
  ]);
  const result = await broadcastResourceUpdated(r, 'mcp://markos/canon/t1', channels);
  assert.equal(result.notified, 0);
  assert.equal(result.removed, 1);
  // broken subscription should have been reaped
  assert.deepEqual(await listSubscribers(r, 'mcp://markos/canon/t1'), []);
});

test('Suite 202-08: listSubscribers returns empty array for unknown URI', async () => {
  const r = mockRedis();
  const members = await listSubscribers(r, 'mcp://markos/canon/never');
  assert.deepEqual(members, []);
});
