const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeSyncEvent,
  collapseEventBurst,
} = require('../../onboarding/backend/vault/sync-event-contract.cjs');
const { createSyncOrchestrator } = require('../../onboarding/backend/vault/sync-orchestrator.cjs');

test('85-01 sync contract normalizes add/change/unlink into canonical payload shape', () => {
  const add = normalizeSyncEvent({
    eventType: 'add',
    absolutePath: '/vault/Discipline/doc.md',
    tenantId: 'tenant-alpha',
    observedAt: '2026-04-12T00:00:00.000Z',
  });
  const change = normalizeSyncEvent({
    eventType: 'change',
    absolutePath: '/vault/Discipline/doc.md',
    tenantId: 'tenant-alpha',
    observedAt: '2026-04-12T00:00:01.000Z',
  });
  const unlink = normalizeSyncEvent({
    eventType: 'unlink',
    absolutePath: '/vault/Discipline/doc.md',
    tenantId: 'tenant-alpha',
    observedAt: '2026-04-12T00:00:02.000Z',
  });

  for (const event of [add, change, unlink]) {
    assert.equal(event.tenant_id, 'tenant-alpha');
    assert.equal(event.doc_id, 'discipline/doc.md');
    assert.equal(event.source_path, '/vault/Discipline/doc.md');
    assert.equal(event.source, 'obsidian-watch');
    assert.equal(typeof event.event_type, 'string');
    assert.equal(typeof event.enqueued_at, 'string');
  }
});

test('85-01 sync contract collapses duplicate atomic-write bursts into one queue event', () => {
  const burst = [
    normalizeSyncEvent({
      eventType: 'add',
      absolutePath: '/vault/Discipline/doc.md',
      tenantId: 'tenant-alpha',
      observedAt: '2026-04-12T00:00:00.000Z',
    }),
    normalizeSyncEvent({
      eventType: 'change',
      absolutePath: '/vault/Discipline/doc.md',
      tenantId: 'tenant-alpha',
      observedAt: '2026-04-12T00:00:00.100Z',
    }),
    normalizeSyncEvent({
      eventType: 'change',
      absolutePath: '/vault/Discipline/doc.md',
      tenantId: 'tenant-alpha',
      observedAt: '2026-04-12T00:00:00.200Z',
    }),
  ];

  const collapsed = collapseEventBurst(burst);
  assert.equal(collapsed.length, 1);
  assert.equal(collapsed[0].event_type, 'change');
});

test('85-01 Obsidian edits become ingest-eligible without manual publish command', async () => {
  const enqueued = [];

  const orchestrator = createSyncOrchestrator({
    tenantId: 'tenant-alpha',
    vaultRoot: '/vault',
    enqueue: async (event) => {
      enqueued.push(event);
      return { accepted: true };
    },
  });

  await orchestrator.handleFsEvent('change', '/vault/Discipline/doc.md');

  assert.equal(enqueued.length, 1);
  assert.equal(enqueued[0].event_type, 'change');
  assert.equal(enqueued[0].requires_manual_publish, false);
});
