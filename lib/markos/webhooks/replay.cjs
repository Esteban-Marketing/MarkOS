'use strict';

// Phase 203 Plan 04 Task 1 — webhook delivery replay library.
//
// Two entry points:
//   - replaySingle(client, queue, { tenant_id, subscription_id, delivery_id, actor_id, deps })
//     → fetches the original delivery (tenant-scoped), validates D-07 (status='failed'),
//       inserts a NEW markos_webhook_deliveries row with replayed_from = original.id, attempt = 0,
//       status = 'pending', and the raw body copied over, then enqueues it via queue.push.
//   - replayBatch(client, queue, { tenant_id, subscription_id, delivery_ids, actor_id, deps })
//     → same per-row behavior, plus BATCH_CAP = 100 + Vercel Queues idempotencyKey keyed on
//       (original_id, 5-minute bucket) so rapid clicks cannot double-dispatch (RESEARCH §Pitfall 7).
//
// Design constraints:
//   - D-06: replay is signed with a FRESH HMAC + CURRENT timestamp at DISPATCH (delivery.cjs), NOT here.
//     This module only prepares the row; it stores the raw body and never bakes in a signature.
//     Plan 203-05 wires signPayloadDualSign at dispatch. For Plan 203-04 the existing signPayload
//     path still signs every attempt from delivery.cjs — nothing to change here.
//   - D-07: replay is strictly from status='failed'. delivered / pending / retrying → rejected.
//   - T-203-04-02: defense-in-depth cross-tenant check on top of .eq('tenant_id', ...) filter.
//   - Typed errors: 'not_found' | 'cross_tenant_forbidden' | 'not_failed' | 'batch_too_large' |
//     'cross_subscription'. Handler maps to HTTP status codes (api/tenant/webhooks/...).

const { randomUUID } = require('node:crypto');

const BATCH_CAP = 100;
const IDEMPOTENCY_BUCKET_MS = 300_000; // 5 minutes (RESEARCH §Pitfall 7)

function defaultAuditEmitter() {
  // Lazy-require so test-suite can inject without pulling in the writer.
  const { enqueueAuditStaging } = require('../audit/writer.cjs');
  return enqueueAuditStaging;
}

function buildReplayRow(orig) {
  const nowIso = new Date().toISOString();
  return {
    id: `del_${randomUUID()}`,
    tenant_id: orig.tenant_id,
    subscription_id: orig.subscription_id,
    event_type: orig.event_type,
    body: orig.body,
    status: 'pending',
    attempt: 0,
    replayed_from: orig.id,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

async function fetchOriginal(client, { tenant_id, delivery_id }) {
  const { data, error } = await client
    .from('markos_webhook_deliveries')
    .select('*')
    .eq('id', delivery_id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();
  if (error) throw new Error(`replay.fetchOriginal: ${error.message}`);
  return data || null;
}

async function insertReplayRow(client, row) {
  const { data, error } = await client
    .from('markos_webhook_deliveries')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`replay.insertReplayRow: ${error.message}`);
  return data || row;
}

async function replaySingle(client, queue, params = {}) {
  const { tenant_id, subscription_id, delivery_id, actor_id, deps = {} } = params;
  if (!tenant_id) throw new Error('replaySingle: tenant_id is required');
  if (!subscription_id) throw new Error('replaySingle: subscription_id is required');
  if (!delivery_id) throw new Error('replaySingle: delivery_id is required');
  if (!actor_id) throw new Error('replaySingle: actor_id is required');

  const orig = await fetchOriginal(client, { tenant_id, delivery_id });
  if (!orig) throw new Error('not_found');
  // Defense-in-depth (T-203-04-02): the .eq filters above already block cross-tenant reads, but we
  // re-check explicitly so any adapter drift surfaces as an error, not silent success.
  if (orig.tenant_id !== tenant_id) throw new Error('cross_tenant_forbidden');
  if (orig.subscription_id !== subscription_id) throw new Error('cross_subscription');
  if (orig.status !== 'failed') throw new Error('not_failed');

  const newRow = buildReplayRow(orig);
  await insertReplayRow(client, newRow);
  await queue.push(newRow.id);

  // Audit — fire-and-forget; the drain picks up any staging rows even if this throws.
  const audit = deps.enqueueAuditStaging || defaultAuditEmitter();
  try {
    await audit({
      source_domain: 'webhooks',
      action: 'delivery.replay_single',
      tenant_id,
      actor_id,
      actor_role: deps.actor_role || 'owner',
      target_id: orig.id,
      payload: {
        new_delivery_id: newRow.id,
        subscription_id,
      },
    });
  } catch { /* noop — audit drain will catch staged rows */ }

  return { original_id: orig.id, new_id: newRow.id };
}

async function replayBatch(client, queue, params = {}) {
  const { tenant_id, subscription_id, delivery_ids, actor_id, deps = {} } = params;
  if (!tenant_id) throw new Error('replayBatch: tenant_id is required');
  if (!subscription_id) throw new Error('replayBatch: subscription_id is required');
  if (!Array.isArray(delivery_ids)) throw new Error('replayBatch: delivery_ids must be an array');
  if (!actor_id) throw new Error('replayBatch: actor_id is required');

  if (delivery_ids.length > BATCH_CAP) throw new Error('batch_too_large');

  // Dedupe while preserving order.
  const uniq = [...new Set(delivery_ids)];

  const batch_id = `batch_${randomUUID()}`;
  const replayed = [];
  const skipped = [];
  const nowFn = deps.now || Date.now;

  for (const did of uniq) {
    const orig = await fetchOriginal(client, { tenant_id, delivery_id: did });
    if (!orig) {
      skipped.push({ original_id: did, reason: 'not_found' });
      continue;
    }
    if (orig.tenant_id !== tenant_id) {
      skipped.push({ original_id: did, reason: 'cross_tenant_forbidden' });
      continue;
    }
    if (orig.subscription_id !== subscription_id) {
      skipped.push({ original_id: did, reason: 'cross_subscription' });
      continue;
    }
    if (orig.status !== 'failed') {
      skipped.push({ original_id: did, reason: 'not_failed' });
      continue;
    }

    const newRow = buildReplayRow(orig);
    await insertReplayRow(client, newRow);

    // RESEARCH §Pitfall 7 — keyed by (original_id, 5-min bucket). Rapid re-clicks inside the
    // same 5-min window produce the SAME idempotencyKey, so Vercel Queues dedupes server-side.
    const bucket = Math.floor(nowFn() / IDEMPOTENCY_BUCKET_MS);
    const idempotencyKey = `replay-${orig.id}-${bucket}`;
    await queue.push(newRow.id, { idempotencyKey });

    replayed.push({ original_id: orig.id, new_id: newRow.id });
  }

  const audit = deps.enqueueAuditStaging || defaultAuditEmitter();
  try {
    await audit({
      source_domain: 'webhooks',
      action: 'delivery.replay_batch',
      tenant_id,
      actor_id,
      actor_role: deps.actor_role || 'owner',
      target_id: subscription_id,
      payload: {
        batch_id,
        delivery_ids: uniq,
        replayed_count: replayed.length,
        skipped_count: skipped.length,
      },
    });
  } catch { /* noop */ }

  return { batch_id, count: replayed.length, replayed, skipped };
}

module.exports = {
  replaySingle,
  replayBatch,
  BATCH_CAP,
  IDEMPOTENCY_BUCKET_MS,
};
