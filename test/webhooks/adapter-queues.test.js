'use strict';

// Phase 203 Plan 01 Task 2 — Vercel Queues client adapter (push-mode).
// Tests use dep-injection (`deps.send`) so no network call is made; the real `@vercel/queue.send`
// is never imported in this suite. Behavior 2a-2d per plan.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { createVercelQueueClient } = require('../../lib/markos/webhooks/store-vercel-queue.cjs');

describe('createVercelQueueClient', () => {
  test('2a returns an object with push() method', () => {
    const captured = [];
    const client = createVercelQueueClient({
      topic: 'markos-webhook-delivery',
      deps: { send: async (...args) => { captured.push(args); } },
    });
    assert.equal(typeof client.push, 'function');
  });

  test('2b push(delivery_id) calls deps.send("markos-webhook-delivery", { delivery_id })', async () => {
    const captured = [];
    const client = createVercelQueueClient({
      topic: 'markos-webhook-delivery',
      deps: { send: async (topic, payload, opts) => { captured.push({ topic, payload, opts }); } },
    });
    await client.push('del_abc123');
    assert.equal(captured.length, 1);
    assert.equal(captured[0].topic, 'markos-webhook-delivery');
    assert.deepEqual(captured[0].payload, { delivery_id: 'del_abc123' });
  });

  test('2c push() rejects when delivery_id is falsy', async () => {
    const client = createVercelQueueClient({
      topic: 'markos-webhook-delivery',
      deps: { send: async () => {} },
    });
    await assert.rejects(() => client.push(''), /delivery_id required/);
    await assert.rejects(() => client.push(null), /delivery_id required/);
    await assert.rejects(() => client.push(undefined), /delivery_id required/);
  });

  test('2d push honors idempotencyKey when provided', async () => {
    const captured = [];
    const client = createVercelQueueClient({
      topic: 'markos-webhook-delivery',
      deps: { send: async (topic, payload, opts) => { captured.push({ topic, payload, opts }); } },
    });
    await client.push('del_x', { idempotencyKey: 'idem-123' });
    assert.equal(captured[0].opts?.idempotencyKey, 'idem-123');

    // Without idempotencyKey → opts undefined or absent
    captured.length = 0;
    await client.push('del_y');
    assert.ok(captured[0].opts === undefined || captured[0].opts.idempotencyKey === undefined);
  });
});
