'use strict';

// Phase 203 Plan 03 Task 1 — DLQ library.
//
// The DLQ is NOT a separate Vercel Queue (RESEARCH §Pattern 2 note: "Vercel Queues
// does NOT have a native DLQ") — it's a tenant-scoped SELECT over
// `markos_webhook_deliveries` rows with `status='failed' AND dlq_at IS NOT NULL`,
// window = last 7 days per D-08. Migration 72 ships the 4 DLQ columns
// (replayed_from, dlq_reason, final_attempt, dlq_at) + the partial index
// `idx_deliveries_dlq_retention` that backs the purge sweep.
//
// Exports:
//   listDLQ(client, { tenant_id, subscription_id? })   — read failed rows in 7d window
//   countDLQ(client, { tenant_id })                    — integer count for the hero banner
//   markFailed(client, id, { reason, final_attempt })  — transition pending/retrying → failed + dlq_at
//   markDelivered(client, id)                          — happy-path transition to delivered (no dlq_at)
//   purgeExpired(client, { now?, deps? })              — hard-delete rows past 7d TTL + audit emit
//
// Security:
//   T-203-03-03 (Info Disclosure): listDLQ + countDLQ THROW if tenant_id is missing —
//   defense-in-depth on top of Postgres RLS. `.eq('tenant_id', ...)` is always the
//   first filter so the query planner narrows before further work.
//   T-203-03-05 (Repudiation): purgeExpired emits a single audit row per batch via
//   enqueueAuditStaging — the markos_audit_log hash-chain retains this row forever
//   even after the original DLQ delivery is hard-deleted (RESEARCH §Open Questions #2).

const { enqueueAuditStaging } = require('../audit/writer.cjs');

// D-08 locked: 7-day DLQ retention. Do NOT change without updating 203-CONTEXT.md
// + 203-RESEARCH.md + 203-09 fleet metrics (hero banner window) + 203-10 runbook.
const DLQ_WINDOW_DAYS = 7;
const DLQ_WINDOW_MS = DLQ_WINDOW_DAYS * 86400 * 1000;

function windowStartIso(now = new Date()) {
  return new Date(now.getTime() - DLQ_WINDOW_MS).toISOString();
}

async function listDLQ(client, { tenant_id, subscription_id } = {}) {
  if (!tenant_id) throw new Error('listDLQ: tenant_id required');

  let q = client
    .from('markos_webhook_deliveries')
    .select('*')
    .eq('tenant_id', tenant_id) // CRITICAL — tenant scope FIRST (cross-tenant guard)
    .eq('status', 'failed')
    .not('dlq_at', 'is', null)
    .gte('dlq_at', windowStartIso())
    .order('dlq_at', { ascending: false });

  if (subscription_id) {
    q = q.eq('subscription_id', subscription_id);
  }

  const { data, error } = await q;
  if (error) throw new Error(`listDLQ: ${error.message}`);
  return data || [];
}

async function countDLQ(client, { tenant_id } = {}) {
  if (!tenant_id) throw new Error('countDLQ: tenant_id required');

  const { count, error } = await client
    .from('markos_webhook_deliveries')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id) // tenant-first
    .eq('status', 'failed')
    .not('dlq_at', 'is', null)
    .gte('dlq_at', windowStartIso());

  if (error) throw new Error(`countDLQ: ${error.message}`);
  return count || 0;
}

async function markFailed(client, delivery_id, { reason, final_attempt } = {}) {
  if (!delivery_id) throw new Error('markFailed: delivery_id required');
  if (!reason) throw new Error('markFailed: reason required');
  if (final_attempt == null) throw new Error('markFailed: final_attempt required');

  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from('markos_webhook_deliveries')
    .update({
      status: 'failed',
      dlq_reason: reason,
      final_attempt,
      dlq_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', delivery_id)
    .select()
    .maybeSingle();

  if (error) throw new Error(`markFailed: ${error.message}`);
  return data || null;
}

async function markDelivered(client, delivery_id) {
  if (!delivery_id) throw new Error('markDelivered: delivery_id required');

  const { data, error } = await client
    .from('markos_webhook_deliveries')
    .update({
      status: 'delivered',
      updated_at: new Date().toISOString(),
    })
    .eq('id', delivery_id)
    .select()
    .maybeSingle();

  if (error) throw new Error(`markDelivered: ${error.message}`);
  return data || null;
}

async function purgeExpired(client, { now = new Date(), deps = {} } = {}) {
  const cutoffIso = new Date(now.getTime() - DLQ_WINDOW_MS).toISOString();

  const { data, error } = await client
    .from('markos_webhook_deliveries')
    .delete()
    .eq('status', 'failed')
    .lt('dlq_at', cutoffIso)
    .select('id');

  if (error) throw new Error(`purgeExpired: ${error.message}`);
  const count = Array.isArray(data) ? data.length : 0;

  // Audit emit — fire-and-forget so the DLQ purge never blocks on the audit
  // staging pipeline (202-04 pattern). The markos_audit_log hash-chain retains
  // the batch row forever even after the DLQ rows are hard-deleted.
  if (count > 0) {
    const emit = deps.enqueueAuditStaging || enqueueAuditStaging;
    try {
      await emit(client, {
        tenant_id: 'system',           // sentinel — markos_audit_log_staging.tenant_id is text not null, no FK
        org_id: null,
        source_domain: 'webhooks',      // confirmed in AUDIT_SOURCE_DOMAINS (writer.cjs:7)
        action: 'dlq.purged',
        actor_id: 'system:cron',
        actor_role: 'system',
        payload: {
          count,
          older_than: '7d',
          purged_at: now.toISOString(),
        },
      });
    } catch {
      // Swallow — audit staging failure must never block the purge.
    }
  }

  return { count };
}

module.exports = {
  listDLQ,
  countDLQ,
  markFailed,
  markDelivered,
  purgeExpired,
  DLQ_WINDOW_DAYS,
};
