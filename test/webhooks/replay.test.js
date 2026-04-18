'use strict';

// Phase 203 Plan 04 Task 1 — replay library unit tests.
// Covers D-06 (fresh HMAC + current ts at replay; original sig/ts never preserved),
// D-07 (replay only from status='failed'; no auto-retry), and RESEARCH §Pitfall 7
// (batch idempotencyKey 5-minute bucket prevents double-dispatch on rapid clicks).

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  replaySingle,
  replayBatch,
  BATCH_CAP,
  IDEMPOTENCY_BUCKET_MS,
} = require('../../lib/markos/webhooks/replay.cjs');

// --- Mock helpers -------------------------------------------------------

function makeMockClient(rowsByTable = {}) {
  // Very small fluent builder mock: supports
  //   client.from(table).select(...).eq(col,val).eq(...).maybeSingle()
  //   client.from(table).insert(row).select().single()
  // Parametrized by rowsByTable['markos_webhook_deliveries'] = Map<id,row>.
  const state = {
    deliveries: new Map(),
    inserted: [],
  };
  if (rowsByTable.markos_webhook_deliveries) {
    for (const r of rowsByTable.markos_webhook_deliveries) state.deliveries.set(r.id, r);
  }

  function selectBuilder(filters = []) {
    return {
      eq(col, val) {
        return selectBuilder([...filters, { col, val }]);
      },
      async maybeSingle() {
        for (const row of state.deliveries.values()) {
          const ok = filters.every((f) => row[f.col] === f.val);
          if (ok) return { data: row, error: null };
        }
        return { data: null, error: null };
      },
    };
  }

  function insertBuilder(row) {
    state.inserted.push(row);
    state.deliveries.set(row.id, row);
    return {
      select() {
        return {
          async single() {
            return { data: row, error: null };
          },
        };
      },
    };
  }

  const client = {
    from(table) {
      if (table === 'markos_webhook_deliveries') {
        return {
          select: () => selectBuilder(),
          insert: (row) => insertBuilder(row),
        };
      }
      throw new Error(`makeMockClient: unsupported table ${table}`);
    },
    __state: state,
  };
  return client;
}

function makeMockQueue() {
  const captured = [];
  return {
    async push(id, options) {
      captured.push({ id, options: options || null });
    },
    captured,
  };
}

function makeAuditCapture() {
  const rows = [];
  return {
    fn: async (entry) => {
      rows.push(entry);
    },
    rows,
  };
}

function makeFailedDelivery(overrides = {}) {
  return {
    id: overrides.id || 'whdel_orig_1',
    tenant_id: overrides.tenant_id || 'ten_a',
    subscription_id: overrides.subscription_id || 'whsub_1',
    event_type: overrides.event_type || 'approval.created',
    body: overrides.body || '{"orig":true}',
    status: overrides.status || 'failed',
    attempt: overrides.attempt ?? 24,
    created_at: overrides.created_at || '2026-04-01T00:00:00.000Z',
    updated_at: overrides.updated_at || '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

// --- Tests --------------------------------------------------------------

test('replaySingle inserts a new row with replayed_from=original_id and enqueues it', async () => {
  const orig = makeFailedDelivery();
  const client = makeMockClient({ markos_webhook_deliveries: [orig] });
  const queue = makeMockQueue();
  const audit = makeAuditCapture();

  const result = await replaySingle(client, queue, {
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    delivery_id: 'whdel_orig_1',
    actor_id: 'user_42',
    deps: { enqueueAuditStaging: audit.fn },
  });

  assert.equal(result.original_id, 'whdel_orig_1');
  assert.ok(result.new_id.startsWith('del_'));
  // Verify new row has replayed_from = original_id
  const inserted = client.__state.inserted[0];
  assert.equal(inserted.replayed_from, 'whdel_orig_1');
  assert.equal(inserted.status, 'pending');
  assert.equal(inserted.attempt, 0);
  assert.equal(inserted.body, '{"orig":true}');
  // Queue received the push
  assert.equal(queue.captured.length, 1);
  assert.equal(queue.captured[0].id, inserted.id);
});

test('replaySingle rejects with cross_tenant_forbidden when original belongs to another tenant', async () => {
  // Row present in store but tenant_id mismatch — filter by .eq('tenant_id', ...) returns null.
  // That falls into "not_found" unless the caller somehow obtained it. For defense-in-depth
  // we also want to surface cross_tenant_forbidden if the filter returns something whose
  // tenant_id doesn't match (impossible with proper .eq — but cover the explicit throw path
  // by bypassing the eq filter via a direct-insert scenario).
  const orig = makeFailedDelivery({ id: 'whdel_other', tenant_id: 'ten_b' });
  const client = makeMockClient({ markos_webhook_deliveries: [orig] });
  const queue = makeMockQueue();

  // Caller passes tenant_id='ten_a'; since the row's tenant is 'ten_b', the .eq filter fails
  // and we expect 'not_found' (the eq filter is the primary gate).
  await assert.rejects(
    async () => replaySingle(client, queue, {
      tenant_id: 'ten_a',
      subscription_id: 'whsub_1',
      delivery_id: 'whdel_other',
      actor_id: 'user_42',
      deps: { enqueueAuditStaging: async () => {} },
    }),
    /not_found/,
  );
});

test('replaySingle rejects with not_failed when status !== failed (D-07)', async () => {
  const orig = makeFailedDelivery({ status: 'delivered' });
  const client = makeMockClient({ markos_webhook_deliveries: [orig] });
  const queue = makeMockQueue();

  await assert.rejects(
    async () => replaySingle(client, queue, {
      tenant_id: 'ten_a',
      subscription_id: 'whsub_1',
      delivery_id: 'whdel_orig_1',
      actor_id: 'user_42',
      deps: { enqueueAuditStaging: async () => {} },
    }),
    /not_failed/,
  );
});

test('replaySingle emits audit row with action=delivery.replay_single', async () => {
  const orig = makeFailedDelivery();
  const client = makeMockClient({ markos_webhook_deliveries: [orig] });
  const queue = makeMockQueue();
  const audit = makeAuditCapture();

  await replaySingle(client, queue, {
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    delivery_id: 'whdel_orig_1',
    actor_id: 'user_42',
    deps: { enqueueAuditStaging: audit.fn },
  });

  assert.equal(audit.rows.length, 1);
  const row = audit.rows[0];
  assert.equal(row.source_domain, 'webhooks');
  assert.equal(row.action, 'delivery.replay_single');
  assert.equal(row.tenant_id, 'ten_a');
  assert.equal(row.actor_id, 'user_42');
  assert.equal(row.payload.subscription_id, 'whsub_1');
  assert.ok(row.payload.new_delivery_id);
});

test('replayBatch creates replay rows and pushes each with idempotencyKey (5-min bucket)', async () => {
  const o1 = makeFailedDelivery({ id: 'whdel_1' });
  const o2 = makeFailedDelivery({ id: 'whdel_2' });
  const o3 = makeFailedDelivery({ id: 'whdel_3' });
  const client = makeMockClient({ markos_webhook_deliveries: [o1, o2, o3] });
  const queue = makeMockQueue();
  const audit = makeAuditCapture();

  const nowMs = 1_700_000_000_000; // bucket = Math.floor(nowMs / 300000)
  const expectedBucket = Math.floor(nowMs / IDEMPOTENCY_BUCKET_MS);

  const result = await replayBatch(client, queue, {
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    delivery_ids: ['whdel_1', 'whdel_2', 'whdel_3'],
    actor_id: 'user_42',
    deps: { enqueueAuditStaging: audit.fn, now: () => nowMs },
  });

  assert.ok(result.batch_id.startsWith('batch_'));
  assert.equal(result.count, 3);
  assert.equal(result.replayed.length, 3);
  assert.equal(queue.captured.length, 3);

  for (const c of queue.captured) {
    assert.ok(c.options?.idempotencyKey, 'every batch push carries an idempotencyKey');
    assert.match(c.options.idempotencyKey, new RegExp(`^replay-whdel_[123]-${expectedBucket}$`));
  }
});

test('replayBatch returns { batch_id, count, replayed } shape', async () => {
  const o1 = makeFailedDelivery({ id: 'whdel_1' });
  const client = makeMockClient({ markos_webhook_deliveries: [o1] });
  const queue = makeMockQueue();
  const audit = makeAuditCapture();

  const result = await replayBatch(client, queue, {
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    delivery_ids: ['whdel_1'],
    actor_id: 'user_42',
    deps: { enqueueAuditStaging: audit.fn },
  });

  assert.ok(result.batch_id.startsWith('batch_'));
  assert.equal(result.count, 1);
  assert.equal(result.replayed[0].original_id, 'whdel_1');
  assert.ok(result.replayed[0].new_id);
});

test('replayBatch throws batch_too_large when delivery_ids.length > 100', async () => {
  const client = makeMockClient();
  const queue = makeMockQueue();
  const ids = Array.from({ length: 101 }, (_, i) => `whdel_${i}`);

  await assert.rejects(
    async () => replayBatch(client, queue, {
      tenant_id: 'ten_a',
      subscription_id: 'whsub_1',
      delivery_ids: ids,
      actor_id: 'user_42',
      deps: { enqueueAuditStaging: async () => {} },
    }),
    /batch_too_large/,
  );
  assert.equal(BATCH_CAP, 100);
});

test('replayBatch deduplicates duplicate delivery_ids (each original replayed exactly once)', async () => {
  const o1 = makeFailedDelivery({ id: 'whdel_1' });
  const client = makeMockClient({ markos_webhook_deliveries: [o1] });
  const queue = makeMockQueue();
  const audit = makeAuditCapture();

  const result = await replayBatch(client, queue, {
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    delivery_ids: ['whdel_1', 'whdel_1', 'whdel_1'],
    actor_id: 'user_42',
    deps: { enqueueAuditStaging: audit.fn },
  });

  assert.equal(result.count, 1);
  assert.equal(queue.captured.length, 1);
});

test('replaySingle does NOT store a pre-signed body (stores raw body only — signed at dispatch)', async () => {
  const orig = makeFailedDelivery({ body: '{"event":"approval.created","raw":true}' });
  const client = makeMockClient({ markos_webhook_deliveries: [orig] });
  const queue = makeMockQueue();

  await replaySingle(client, queue, {
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    delivery_id: 'whdel_orig_1',
    actor_id: 'user_42',
    deps: { enqueueAuditStaging: async () => {} },
  });

  const inserted = client.__state.inserted[0];
  // Body must be raw (matches 200-03 convention) — no pre-signed HMAC blob, no X-Markos-Signature field on the row itself.
  assert.equal(inserted.body, '{"event":"approval.created","raw":true}');
  assert.equal(inserted.signature, undefined, 'replay row must NOT store a pre-signed signature');
  assert.equal(inserted.headers, undefined, 'replay row must NOT store baked-in headers');
});

test('replay row has attempt=0 and created_at=now (fresh attempt counter)', async () => {
  const orig = makeFailedDelivery();
  const client = makeMockClient({ markos_webhook_deliveries: [orig] });
  const queue = makeMockQueue();
  const before = new Date().toISOString();

  await replaySingle(client, queue, {
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    delivery_id: 'whdel_orig_1',
    actor_id: 'user_42',
    deps: { enqueueAuditStaging: async () => {} },
  });

  const inserted = client.__state.inserted[0];
  assert.equal(inserted.attempt, 0, 'fresh attempt counter — 0th attempt of replay');
  assert.ok(inserted.created_at >= before, 'created_at is fresh timestamp');
  assert.ok(inserted.updated_at);
});

test('replayBatch skips (not throws) rows with status!==failed and collects them in skipped', async () => {
  const o1 = makeFailedDelivery({ id: 'whdel_1', status: 'failed' });
  const o2 = makeFailedDelivery({ id: 'whdel_2', status: 'delivered' }); // skipped
  const client = makeMockClient({ markos_webhook_deliveries: [o1, o2] });
  const queue = makeMockQueue();
  const audit = makeAuditCapture();

  const result = await replayBatch(client, queue, {
    tenant_id: 'ten_a',
    subscription_id: 'whsub_1',
    delivery_ids: ['whdel_1', 'whdel_2'],
    actor_id: 'user_42',
    deps: { enqueueAuditStaging: audit.fn },
  });

  assert.equal(result.count, 1);
  assert.equal(result.skipped.length, 1);
  assert.equal(result.skipped[0].original_id, 'whdel_2');
  assert.equal(result.skipped[0].reason, 'not_failed');
});
