'use strict';

// Phase 203 Plan 09 Task 1 — Webhook fleet + per-subscription metrics aggregator.
//
// Two exports consumed by Surface 1 + Surface 2 tenant-admin dashboard:
//
//   aggregateFleetMetrics(client, tenant_id, now?)
//     → { total_24h, success_rate, avg_latency_ms, dlq_count,
//         window_start, window_end, tenant_id }
//     Reads markos_webhook_fleet_metrics_v1 view (48h hourly rollup per
//     tenant from migration 72); filters to last 24h; aggregates to a
//     single hero-banner row. DLQ count fetched separately via countDLQ
//     (Plan 203-03) since the view tracks terminal-status volume not DLQ
//     retention window.
//
//   perSubMetrics(client, tenant_id, subscription_id, now?)
//     → { total_24h, success_rate, avg_latency_ms, last_delivery_at }
//     Per-subscription rollup over markos_webhook_deliveries last 24h.
//     Used to decorate Surface 1 subscriptions table rows.
//
// D-04 (RESEARCH §Open Questions #3): ship as a view first (cheap); upgrade
// to a materialized table only if p95 > 150ms. The view is the source of
// truth for Surface 1's hero + Surface 3's public status page.
//
// Tenant scope: every query uses `.eq('tenant_id', tenant_id)` as the
// FIRST filter so the Postgres planner narrows before further work; DLQ
// defense-in-depth is enforced at the library layer (countDLQ throws if
// tenant_id is missing).

const { countDLQ } = require('./dlq.cjs');

const WINDOW_24H_MS = 24 * 3600 * 1000;

function toIso(d) {
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

function safeNumber(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

async function aggregateFleetMetrics(client, tenant_id, now = new Date()) {
  if (!tenant_id) throw new Error('aggregateFleetMetrics: tenant_id required');

  const nowDate = now instanceof Date ? now : new Date(now);
  const windowStart = new Date(nowDate.getTime() - WINDOW_24H_MS);
  const windowStartIso = windowStart.toISOString();
  const windowEndIso = nowDate.toISOString();

  // Query the hourly rollup view — filter to the tenant + last 24h.
  const viewRes = await client
    .from('markos_webhook_fleet_metrics_v1')
    .select('*')
    .eq('tenant_id', tenant_id)
    .gte('bucket', windowStartIso);

  const rows = Array.isArray(viewRes) ? viewRes : (viewRes && viewRes.data) || [];
  const viewErr = viewRes && viewRes.error;
  if (viewErr) throw new Error(`aggregateFleetMetrics: ${viewErr.message}`);

  let total = 0;
  let delivered = 0;
  let latencySum = 0;
  let latencyBuckets = 0;
  for (const row of rows) {
    const rowTotal = safeNumber(row.total);
    const rowDelivered = safeNumber(row.delivered);
    const rowLatency = row.avg_latency_ms == null ? null : safeNumber(row.avg_latency_ms);
    total += rowTotal;
    delivered += rowDelivered;
    if (rowLatency != null && rowDelivered > 0) {
      // Weighted sum — multiply each bucket's mean by its delivered count so
      // the 24h average is a true mean over delivered rows, not a mean-of-means.
      latencySum += rowLatency * rowDelivered;
      latencyBuckets += rowDelivered;
    }
  }

  const success_rate = total === 0 ? 100.0 : Math.round((delivered / total) * 1000) / 10;
  const avg_latency_ms = latencyBuckets === 0 ? 0 : Math.round(latencySum / latencyBuckets);

  // DLQ count — separate source (retention-windowed; not limited to 24h since
  // D-08 keeps entries 7 days regardless of delivery age).
  let dlq_count = 0;
  try {
    dlq_count = await countDLQ(client, { tenant_id });
  } catch {
    // countDLQ throws on missing tenant_id; we already validated above. On any
    // other error, fall through to 0 — the hero banner renders empty gracefully
    // rather than failing the whole surface.
    dlq_count = 0;
  }

  return {
    tenant_id,
    total_24h: total,
    success_rate,
    avg_latency_ms,
    dlq_count,
    window_start: windowStartIso,
    window_end: windowEndIso,
  };
}

async function perSubMetrics(client, tenant_id, subscription_id, now = new Date()) {
  if (!tenant_id) throw new Error('perSubMetrics: tenant_id required');
  if (!subscription_id) throw new Error('perSubMetrics: subscription_id required');

  const nowDate = now instanceof Date ? now : new Date(now);
  const windowStartIso = new Date(nowDate.getTime() - WINDOW_24H_MS).toISOString();

  const deliveriesRes = await client
    .from('markos_webhook_deliveries')
    .select('status, created_at, updated_at')
    .eq('tenant_id', tenant_id)
    .eq('subscription_id', subscription_id)
    .gte('created_at', windowStartIso);

  const rows = Array.isArray(deliveriesRes) ? deliveriesRes : (deliveriesRes && deliveriesRes.data) || [];
  const err = deliveriesRes && deliveriesRes.error;
  if (err) throw new Error(`perSubMetrics: ${err.message}`);

  let total = 0;
  let delivered = 0;
  let latencySum = 0;
  let latencyCount = 0;
  let lastDeliveryAt = null;
  for (const row of rows) {
    total += 1;
    if (row.status === 'delivered') {
      delivered += 1;
      if (row.created_at && row.updated_at) {
        const start = Date.parse(row.created_at);
        const end = Date.parse(row.updated_at);
        if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
          latencySum += end - start;
          latencyCount += 1;
        }
      }
    }
    const eventTs = row.updated_at || row.created_at;
    if (eventTs && (!lastDeliveryAt || Date.parse(eventTs) > Date.parse(lastDeliveryAt))) {
      lastDeliveryAt = eventTs;
    }
  }

  const success_rate = total === 0 ? 100.0 : Math.round((delivered / total) * 1000) / 10;
  const avg_latency_ms = latencyCount === 0 ? 0 : Math.round(latencySum / latencyCount);

  return {
    total_24h: total,
    success_rate,
    avg_latency_ms,
    last_delivery_at: lastDeliveryAt,
  };
}

module.exports = {
  aggregateFleetMetrics,
  perSubMetrics,
  WINDOW_24H_MS,
  _toIsoForTest: toIso,
};
