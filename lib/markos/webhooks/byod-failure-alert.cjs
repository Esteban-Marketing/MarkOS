'use strict';

// Phase 201.1 D-107 (closes M2): BYOD verification-lost alert via existing webhook engine.
//
// When markos_custom_domains.status transitions verified->failed, this module:
//   1. Emits an audit row (source_domain='tenancy', action='byod.verification_lost').
//   2. Looks up the tenant's active webhook subscriptions for event 'byod.verification_lost'.
//   3. Enqueues a delivery row per subscription (status='queued') into markos_webhook_deliveries.
//
// *** W-4 dependency note ***
// The rows inserted into markos_webhook_deliveries with status='queued' are consumed by a
// Phase 203 dispatch worker. If that worker is NOT deployed when 201.1 ships, alerts queue
// silently — they are NOT lost but the org-owner will not receive a notification until
// Phase 203 dispatch is deployed.
//
// Operator monitoring: query markos_webhook_deliveries WHERE event_type='byod.verification_lost'
// AND status='queued' periodically until Phase 203 ships.
//
// End-to-end delivery is verified out-of-band by the v4.0.0 staging-smoke harness (Plan 11 / D-108):
//   1. Provision staging tenant with custom domain.
//   2. Force domain to failed status via Vercel API.
//   3. Assert alert webhook fires within 60s.
//   4. Assert audit row + queued delivery row both exist.
//
// W-4 probe result (executed during 201.1-09 planning): no dispatch worker found in repo
// (lib/markos/webhooks/dispatch.cjs, worker.cjs, delivery.cjs do not poll status='queued').
// Phase 203 must ship one before 201.1 alerts deliver end-to-end.

const { enqueueAuditStaging } = require('../audit/writer.cjs');

const EVENT_TYPE = 'byod.verification_lost';

/**
 * Fires a BYOD verification-lost alert for the given domain.
 *
 * @param {object} client - Supabase service-role client
 * @param {object} input
 * @param {string} input.domain - The custom domain that failed verification
 * @param {string} input.tenant_id - Tenant ID that owns the domain
 * @param {string} [input.org_id] - Org ID (optional but logged)
 * @param {string|null} [input.last_verified_at] - ISO timestamp of last successful verification
 * @param {string} [input.reason] - Reason code (e.g. 'vercel_verification_failed')
 * @returns {Promise<{ delivered: number, audited: boolean, total_subscriptions?: number }>}
 */
async function fireByodFailureAlert(client, input) {
  const { domain, tenant_id, org_id, last_verified_at, reason } = input || {};

  if (!domain || !tenant_id) {
    throw new Error('fireByodFailureAlert: domain + tenant_id required');
  }

  // 1. Emit audit row (always — even if no webhook subscriptions exist).
  try {
    await enqueueAuditStaging(client, {
      tenant_id,
      org_id: org_id || null,
      source_domain: 'tenancy',
      action: EVENT_TYPE,
      actor_id: 'system',
      actor_role: 'system',
      payload: { domain, last_verified_at: last_verified_at || null, reason: reason || 'unknown' },
    });
  } catch { /* fail-soft — audit is best-effort; the grace window still serves the tenant */ }

  // 2. Look up active webhook subscriptions for this tenant + event.
  const { data: subs } = await client
    .from('markos_webhook_subscriptions')
    .select('id, url, secret, events')
    .eq('tenant_id', tenant_id)
    .eq('active', true);

  const matching = (subs || []).filter(
    (s) => Array.isArray(s.events) && s.events.includes(EVENT_TYPE),
  );

  if (matching.length === 0) {
    return { delivered: 0, audited: true };
  }

  // 3. Enqueue delivery rows into markos_webhook_deliveries.
  // *** W-4 ***: rows inserted with status='queued'. Actual delivery requires the
  // Phase 203 dispatch worker (lib/markos/webhooks/dispatch.cjs or equivalent).
  // If not deployed, rows queue silently. This plan ships the queueing surface only.
  const eventPayload = {
    event_type: EVENT_TYPE,
    occurred_at: new Date().toISOString(),
    tenant_id,
    domain,
    last_verified_at: last_verified_at || null,
    reason: reason || 'unknown',
  };

  let delivered = 0;
  for (const sub of matching) {
    try {
      await client.from('markos_webhook_deliveries').insert({
        subscription_id: sub.id,
        tenant_id,
        event_type: EVENT_TYPE,
        payload: eventPayload,
        status: 'queued',
        created_at: new Date().toISOString(),
      });
      delivered++;
    } catch { /* one delivery failure does not block others — fail-soft */ }
  }

  return { delivered, audited: true, total_subscriptions: matching.length };
}

module.exports = { fireByodFailureAlert, EVENT_TYPE };
