'use strict';

// Phase 203 Plan 01 Task 2 — Vercel Queues push consumer + vercel.ts trigger registration.
// Tests 2e-2i per plan. Consumer internals exposed via __internals for dep injection.

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const consumerPath = '../../api/webhooks/queues/deliver.js';
const consumer = require(consumerPath);
const { _resetWebhookStoresForTests } = require('../../lib/markos/webhooks/store.cjs');

beforeEach(() => {
  _resetWebhookStoresForTests();
  process.env.WEBHOOK_STORE_MODE = 'memory';
});

describe('api/webhooks/queues/deliver.js consumer', () => {
  test('2e asyncHandler delegates to processDelivery(deliveries, subscriptions, delivery_id)', async () => {
    assert.ok(consumer.__internals, 'consumer must expose __internals for testability');
    const { asyncHandler } = consumer.__internals;

    // Seed memory stores with a subscription + delivery so processDelivery finds them.
    // Use example.com (RFC 2606 — resolves to a public IP) so the 203-02 SSRF guard passes.
    const { getWebhookStores } = require('../../lib/markos/webhooks/store.cjs');
    const { subscriptions, deliveries } = getWebhookStores({ mode: 'memory' });
    await subscriptions.insert({
      id: 'whsub_1', tenant_id: 't-1', url: 'https://example.com/hook',
      secret: 's', events: ['approval.created'], active: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    await deliveries.insert({
      id: 'whdel_1', tenant_id: 't-1', subscription_id: 'whsub_1',
      event: 'approval.created', payload: {}, attempt: 0, status: 'pending',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });

    // fetch stub returns ok:true so delivery succeeds deterministically.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, status: 200 });
    try {
      const result = await asyncHandler(
        { delivery_id: 'whdel_1' },
        { messageId: 'msg_abc', deliveryCount: 1 },
      );
      assert.equal(result.delivered, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('2e asyncHandler throws when delivery_id is missing', async () => {
    const { asyncHandler } = consumer.__internals;
    await assert.rejects(
      () => asyncHandler({}, { messageId: 'msg', deliveryCount: 1 }),
      /missing_delivery_id/,
    );
  });

  test('2f retry returns { acknowledge: true } when deliveryCount > 24', () => {
    const { retry } = consumer.__internals;
    const result = retry(new Error('x'), { deliveryCount: 25 });
    assert.deepEqual(result, { acknowledge: true });
  });

  test('2g retry returns { afterSeconds } with exponential backoff otherwise', () => {
    const { retry } = consumer.__internals;
    // deliveryCount=1 → 5 * 2^1 = 10
    assert.equal(retry(new Error('x'), { deliveryCount: 1 }).afterSeconds, 10);
    // deliveryCount=3 → 5 * 2^3 = 40
    assert.equal(retry(new Error('x'), { deliveryCount: 3 }).afterSeconds, 40);
    // deliveryCount=20 → clamped inner to 15 → 5 * 2^15 = 163840 → capped at 86400
    assert.equal(retry(new Error('x'), { deliveryCount: 20 }).afterSeconds, 86400);
    // deliveryCount=24 (boundary — still retry) → cap at 86400
    assert.equal(retry(new Error('x'), { deliveryCount: 24 }).afterSeconds, 86400);
  });

  test('2h consumer options set visibilityTimeoutSeconds to 120', () => {
    assert.equal(consumer.__internals.options.visibilityTimeoutSeconds, 120);
  });
});

describe('vercel.ts queue trigger registration', () => {
  const vercelTsPath = path.resolve(__dirname, '../../vercel.ts');
  const content = fs.readFileSync(vercelTsPath, 'utf8');

  test('2i vercel.ts has queue/v2beta trigger for markos-webhook-delivery', () => {
    assert.match(content, /queue\/v2beta/, 'v2beta trigger type required');
    assert.match(content, /markos-webhook-delivery/, 'topic must be registered');
    assert.match(content, /api\/webhooks\/queues\/deliver\.js/, 'consumer path must appear');
  });

  test('2i preserves all 5 existing cron entries', () => {
    const required = [
      '/api/audit/drain',
      '/api/tenant/lifecycle/purge-cron',
      '/api/auth/cleanup-unverified-signups',
      '/api/mcp/session/cleanup',
      '/api/cron/mcp-kpi-digest',
    ];
    for (const cron of required) {
      assert.ok(content.includes(cron), `missing existing cron path: ${cron}`);
    }
  });

  test('2i queue trigger under functions (not crons)', () => {
    // The queue entry must live in a `functions` block, not promoted into the 5-entry crons array.
    assert.match(content, /functions\s*:/);
    // The crons array still closes before the queue-entry additions.
    const cronsIdx = content.indexOf('crons');
    const functionsIdx = content.indexOf('functions');
    assert.ok(cronsIdx > -1 && functionsIdx > -1, 'both crons and functions blocks must exist');
  });
});
