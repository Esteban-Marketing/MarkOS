'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  subscribe,
  unsubscribe,
  listSubscriptions,
  createInMemoryStore,
  WEBHOOK_EVENTS,
} = require('../../lib/markos/webhooks/engine.cjs');

test('subscribe creates active row with generated secret and id', async () => {
  const store = createInMemoryStore();
  const row = await subscribe(store, {
    tenant_id: 't-1',
    url: 'https://example.com/hooks',
    events: ['approval.created'],
  });
  assert.match(row.id, /^whsub_/);
  assert.equal(row.active, true);
  assert.equal(typeof row.secret, 'string');
  assert.equal(row.secret.length, 64);
});

test('subscribe honors caller-provided secret', async () => {
  const store = createInMemoryStore();
  const row = await subscribe(store, {
    tenant_id: 't-1',
    url: 'https://example.com',
    events: ['campaign.launched'],
    secret: 'fixed-secret',
  });
  assert.equal(row.secret, 'fixed-secret');
});

test('subscribe rejects missing tenant_id', async () => {
  const store = createInMemoryStore();
  await assert.rejects(
    subscribe(store, { tenant_id: '', url: 'https://example.com', events: ['approval.created'] }),
    /tenant_id is required/,
  );
});

test('subscribe rejects invalid url', async () => {
  const store = createInMemoryStore();
  await assert.rejects(
    subscribe(store, { tenant_id: 't', url: 'not-a-url', events: ['approval.created'] }),
    /invalid url/,
  );
});

test('subscribe rejects unknown event', async () => {
  const store = createInMemoryStore();
  await assert.rejects(
    subscribe(store, { tenant_id: 't', url: 'https://example.com', events: ['bogus.event'] }),
    /unknown event/,
  );
});

test('subscribe rejects empty events array', async () => {
  const store = createInMemoryStore();
  await assert.rejects(
    subscribe(store, { tenant_id: 't', url: 'https://example.com', events: [] }),
    /events is required/,
  );
});

test('unsubscribe deactivates a matching row', async () => {
  const store = createInMemoryStore();
  const row = await subscribe(store, { tenant_id: 't-1', url: 'https://example.com', events: ['approval.created'] });
  const updated = await unsubscribe(store, 't-1', row.id);
  assert.equal(updated.active, false);
});

test('unsubscribe rejects foreign tenant', async () => {
  const store = createInMemoryStore();
  const row = await subscribe(store, { tenant_id: 't-1', url: 'https://example.com', events: ['approval.created'] });
  await assert.rejects(unsubscribe(store, 't-2', row.id), /subscription not found/);
});

test('listSubscriptions returns only the calling tenant\'s rows', async () => {
  const store = createInMemoryStore();
  await subscribe(store, { tenant_id: 't-1', url: 'https://a.example', events: ['approval.created'] });
  await subscribe(store, { tenant_id: 't-2', url: 'https://b.example', events: ['approval.created'] });
  await subscribe(store, { tenant_id: 't-1', url: 'https://c.example', events: ['campaign.launched'] });

  const t1Rows = await listSubscriptions(store, 't-1');
  const t2Rows = await listSubscriptions(store, 't-2');
  assert.equal(t1Rows.length, 2);
  assert.equal(t2Rows.length, 1);
});

test('WEBHOOK_EVENTS covers all 12 canonical events', () => {
  assert.equal(WEBHOOK_EVENTS.length, 12);
  const namespaces = new Set(WEBHOOK_EVENTS.map((e) => e.split('.')[0]));
  assert.ok(namespaces.has('approval'));
  assert.ok(namespaces.has('campaign'));
  assert.ok(namespaces.has('execution'));
  assert.ok(namespaces.has('incident'));
  assert.ok(namespaces.has('consent'));
});
