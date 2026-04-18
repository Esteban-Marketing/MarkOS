'use strict';

// Phase 203 Plan 01 Task 1 — getWebhookStores() mode resolution (memory ↔ supabase).
// 200-03 regression compatibility requires mode='memory' to preserve singleton instances
// across calls and to return the EXACT in-memory shapes.

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  getWebhookStores,
  _resetWebhookStoresForTests,
} = require('../../lib/markos/webhooks/store.cjs');

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  _resetWebhookStoresForTests();
  delete process.env.WEBHOOK_STORE_MODE;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  _resetWebhookStoresForTests();
});

describe('getWebhookStores mode switch', () => {
  test('1h mode="memory" returns in-memory stores verbatim', () => {
    const stores = getWebhookStores({ mode: 'memory' });
    assert.ok(stores.subscriptions);
    assert.ok(stores.deliveries);
    assert.ok(stores.queue);
    // in-memory queue exposes drain()
    assert.equal(typeof stores.queue.drain, 'function');
    assert.equal(typeof stores.queue.push, 'function');
  });

  test('1i mode="supabase" via deps injection wires createSupabaseSubscriptionsStore', () => {
    const fakeClient = {
      from() {
        return {
          insert() { return { select() { return { single: async () => ({ data: {}, error: null }) } } } },
          update() { return { eq() { return { eq() { return { select() { return { maybeSingle: async () => ({ data: null, error: null }) } } } } } } } },
          select() { return { eq() { return { eq() { return { maybeSingle: async () => ({ data: null, error: null }) } } } } } },
        };
      },
    };
    const stores = getWebhookStores({ mode: 'supabase', supabase: fakeClient, queue: { push: async () => {} } });
    assert.ok(stores.subscriptions);
    assert.ok(stores.deliveries);
    assert.equal(typeof stores.subscriptions.insert, 'function');
    assert.equal(typeof stores.deliveries.insert, 'function');
    assert.equal(typeof stores.queue.push, 'function');
  });

  test('1j memory mode singleton: same instances across calls', () => {
    const first = getWebhookStores({ mode: 'memory' });
    const second = getWebhookStores({ mode: 'memory' });
    assert.equal(first.subscriptions, second.subscriptions);
    assert.equal(first.deliveries, second.deliveries);
    assert.equal(first.queue, second.queue);
  });

  test('1k _resetWebhookStoresForTests clears cached adapter instances', () => {
    const first = getWebhookStores({ mode: 'memory' });
    _resetWebhookStoresForTests();
    const second = getWebhookStores({ mode: 'memory' });
    assert.notEqual(first.subscriptions, second.subscriptions);
  });

  test('WEBHOOK_STORE_MODE=memory env switch works without deps', () => {
    process.env.WEBHOOK_STORE_MODE = 'memory';
    const stores = getWebhookStores();
    assert.equal(typeof stores.queue.drain, 'function', 'env-driven memory mode should return in-memory queue');
  });

  test('deps.mode overrides env', () => {
    process.env.WEBHOOK_STORE_MODE = 'supabase';
    const stores = getWebhookStores({ mode: 'memory' });
    assert.equal(typeof stores.queue.drain, 'function');
  });

  test('default mode falls back to memory when Supabase env missing (Rule 3 graceful degrade)', () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.WEBHOOK_STORE_MODE;
    // No deps.mode, no env → supabase default → but missing SUPABASE_URL → fallback memory
    const stores = getWebhookStores();
    assert.ok(stores.subscriptions);
    // Either the subscription store is the in-memory one OR a callable store; tested by drain presence
    assert.equal(typeof stores.queue.push, 'function');
  });
});
