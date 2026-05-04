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
const { readSecret } = require('../../lib/markos/webhooks/secret-vault.cjs');

async function allowHttpsUrl(url) {
  return {
    ok: true,
    resolvedIp: '93.184.216.34',
    resolvedFamily: 'A',
    hostname: new URL(url).hostname,
  };
}

test('subscribe creates active row with generated show-once secret and vault ref', async () => {
  const store = createInMemoryStore();
  const result = await subscribe(
    store,
    {
      tenant_id: 't-1',
      url: 'https://example.com/hooks',
      events: ['approval.created'],
    },
    { validateUrl: allowHttpsUrl },
  );
  const stored = await store.findById('t-1', result.subscription.id);
  assert.match(result.subscription.id, /^whsub_/);
  assert.equal(result.subscription.active, true);
  assert.equal(typeof result.plaintext_secret_show_once, 'string');
  assert.equal(result.plaintext_secret_show_once.length, 64);
  assert.equal(result.subscription.secret, undefined);
  assert.equal(result.subscription.secret_vault_ref, undefined);
  assert.match(stored.secret_vault_ref, /^markos:webhook:secret:/);
});

test('subscribe honors caller-provided secret while storing only the vault ref on the row', async () => {
  const store = createInMemoryStore();
  const result = await subscribe(
    store,
    {
      tenant_id: 't-1',
      url: 'https://example.com',
      events: ['campaign.launched'],
      secret: 'fixed-secret',
    },
    { validateUrl: allowHttpsUrl },
  );
  const stored = await store.findById('t-1', result.subscription.id);
  assert.equal(result.plaintext_secret_show_once, 'fixed-secret');
  assert.equal(await readSecret(store.client, stored.secret_vault_ref), 'fixed-secret');
  assert.equal(stored.secret, undefined);
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
  const result = await subscribe(
    store,
    { tenant_id: 't-1', url: 'https://example.com', events: ['approval.created'] },
    { validateUrl: allowHttpsUrl },
  );
  const updated = await unsubscribe(store, 't-1', result.subscription.id);
  assert.equal(updated.active, false);
});

test('unsubscribe rejects foreign tenant', async () => {
  const store = createInMemoryStore();
  const result = await subscribe(
    store,
    { tenant_id: 't-1', url: 'https://example.com', events: ['approval.created'] },
    { validateUrl: allowHttpsUrl },
  );
  await assert.rejects(unsubscribe(store, 't-2', result.subscription.id), /subscription not found/);
});

test('listSubscriptions returns only the calling tenant\'s rows', async () => {
  const store = createInMemoryStore();
  await subscribe(
    store,
    { tenant_id: 't-1', url: 'https://a.example', events: ['approval.created'] },
    { validateUrl: allowHttpsUrl },
  );
  await subscribe(
    store,
    { tenant_id: 't-2', url: 'https://b.example', events: ['approval.created'] },
    { validateUrl: allowHttpsUrl },
  );
  await subscribe(
    store,
    { tenant_id: 't-1', url: 'https://c.example', events: ['campaign.launched'] },
    { validateUrl: allowHttpsUrl },
  );

  const t1Rows = await listSubscriptions(store, 't-1');
  const t2Rows = await listSubscriptions(store, 't-2');
  assert.equal(t1Rows.length, 2);
  assert.equal(t2Rows.length, 1);
  assert.match(t1Rows[0].secret_vault_ref, /^markos:webhook:secret:/);
});

test('WEBHOOK_EVENTS covers all 13 canonical events', () => {
  assert.equal(WEBHOOK_EVENTS.length, 13);
  const namespaces = new Set(WEBHOOK_EVENTS.map((e) => e.split('.')[0]));
  assert.ok(namespaces.has('approval'));
  assert.ok(namespaces.has('campaign'));
  assert.ok(namespaces.has('execution'));
  assert.ok(namespaces.has('incident'));
  assert.ok(namespaces.has('consent'));
  assert.ok(namespaces.has('byod'));
});
