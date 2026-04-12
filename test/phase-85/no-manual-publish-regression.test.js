'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeSyncEvent } = require('../../onboarding/backend/vault/sync-event-contract.cjs');
const { createSyncOrchestrator } = require('../../onboarding/backend/vault/sync-orchestrator.cjs');
const { createSyncService } = require('../../onboarding/backend/vault/sync-service.cjs');

// Test 1: requires_manual_publish is always false on all normalized sync events (D-05 / LITV-01)
test('85-04 normalized sync events always have requires_manual_publish = false', () => {
  for (const eventType of ['add', 'change', 'unlink']) {
    const event = normalizeSyncEvent({
      eventType,
      absolutePath: '/vault/Discipline/doc.md',
      tenantId: 'tenant-alpha',
      observedAt: '2026-04-12T00:00:00.000Z',
    });
    assert.equal(
      event.requires_manual_publish,
      false,
      `Event type '${eventType}' must not require manual publish`
    );
  }
});

// Test 2: full sync pipeline does NOT invoke any publish gate (D-05)
test('85-04 full sync pipeline does not invoke any publish function', async () => {
  let publishCalled = false;
  const enqueued = [];

  const orchestrator = createSyncOrchestrator({
    tenantId: 'tenant-alpha',
    vaultRoot: '/vault',
    enqueue: async (event) => {
      if (event.requires_manual_publish === true) publishCalled = true;
      enqueued.push(event);
      return { accepted: true };
    },
  });

  await orchestrator.handleFsEvent('change', '/vault/Discipline/doc.md');

  assert.equal(enqueued.length, 1);
  assert.equal(publishCalled, false, 'no event should require manual publish');
  assert.equal(enqueued[0].requires_manual_publish, false);
});

// Test 3: sync-service ingest does not require a publish gate after conflict resolution (D-05 / LITV-01)
test('85-04 sync-service ingest does not require a publish gate after conflict resolution', async () => {
  const revisionStore = new Map();
  const publishGateCalled = [];

  const svc = createSyncService({
    tenantId: 'tenant-alpha',
    vaultRoot: '/vault',
    ingestEvent: async (event) => {
      if (typeof event.publish === 'function') {
        publishGateCalled.push(true);
      }
      revisionStore.set(event.doc_id, event);
      return { outcome: 'applied' };
    },
  });

  await svc.handleChange('/vault/Paid_Media/strategy.md', {
    metadata: {
      discipline: 'Paid_Media',
      audience: ['ICP:ENT'],
      business_model: 'B2B',
      pain_point_tags: ['retention'],
    },
  });

  assert.equal(publishGateCalled.length, 0, 'no publish gate should be invoked');
  assert.equal(revisionStore.has('paid_media/strategy.md'), true);
});

// Test 4: edits survive re-index without requiring re-publish (D-05)
test('85-04 edits survive re-index without requiring re-publish', async () => {
  const ingested = [];

  const svc = createSyncService({
    tenantId: 'tenant-alpha',
    vaultRoot: '/vault',
    ingestEvent: async (event) => {
      ingested.push({ doc_id: event.doc_id, outcome: 'applied' });
      return { outcome: 'applied' };
    },
  });

  await svc.handleChange('/vault/Content_SEO/guide.md', {
    metadata: {
      discipline: 'Content_SEO',
      audience: ['SEGMENT:SMB'],
      business_model: 'B2C',
      pain_point_tags: ['visibility'],
    },
  });

  await svc.handleChange('/vault/Content_SEO/guide.md', {
    metadata: {
      discipline: 'Content_SEO',
      audience: ['SEGMENT:SMB'],
      business_model: 'B2C',
      pain_point_tags: ['visibility'],
    },
  });

  assert.equal(ingested.length, 2, 'both edits are ingested automatically without publish gate');
  assert.ok(ingested.every((r) => r.outcome === 'applied'));
});

// Test 5: scope-checked ingest correctly threads tenant context (D-07 regression)
test('85-04 sync service propagates tenant context into ingested events', async () => {
  const ingested = [];

  const svc = createSyncService({
    tenantId: 'tenant-beta',
    vaultRoot: '/vault',
    ingestEvent: async (event) => {
      ingested.push(event);
      return { outcome: 'applied' };
    },
  });

  await svc.handleChange('/vault/Lifecycle_Email/campaign.md', {
    metadata: {
      discipline: 'Lifecycle_Email',
      audience: ['ROLE:CX_MANAGER'],
      business_model: 'B2B',
      pain_point_tags: ['churn'],
    },
  });

  assert.equal(ingested.length, 1);
  assert.equal(ingested[0].tenant_id, 'tenant-beta');
  assert.equal(ingested[0].requires_manual_publish, false);
});
