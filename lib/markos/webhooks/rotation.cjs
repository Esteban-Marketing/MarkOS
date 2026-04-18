'use strict';

// Phase 203 Plan 05 Task 1 — Webhook signing-secret rotation orchestrator.
//
// Four exports:
//   - startRotation(client, { tenant_id, subscription_id, actor_id })
//       Generates a 32-byte hex secret; delegates to start_webhook_rotation RPC;
//       returns { rotation_id, grace_ends_at }. Maps 'rotation_already_active' verbatim.
//   - rollbackRotation(client, { tenant_id, subscription_id, actor_id })
//       Delegates to rollback_webhook_rotation RPC. D-12: past-grace raises 'past_grace'.
//   - finalizeExpiredRotations(client, now)
//       Cron-triggered daily; delegates to finalize_expired_webhook_rotations RPC.
//       Idempotent — second call inside the same window returns [].
//   - listActiveRotations(client, tenant_id)
//       Tenant-scoped SELECT on markos_webhook_secret_rotations WHERE state='active';
//       joins subscriptions to attach url; computes stage (t-7 | t-1 | t-0 | normal).
//
// D-09 (admin-triggered only), D-10 (dual-sign wiring lives in delivery.cjs), D-12
// (post-grace rollback rejected at DB layer + surfaced as typed error).

const { randomUUID, randomBytes } = require('node:crypto');

const GRACE_DAYS = 30;

async function startRotation(client, params = {}) {
  const { tenant_id, subscription_id, actor_id } = params;
  if (!tenant_id) throw new Error('startRotation: tenant_id is required');
  if (!subscription_id) throw new Error('startRotation: subscription_id is required');
  if (!actor_id) throw new Error('startRotation: actor_id is required');

  const newSecret = randomBytes(32).toString('hex');
  const graceEnd = new Date(Date.now() + GRACE_DAYS * 86400 * 1000).toISOString();
  const rotationId = `whrot_${randomUUID()}`;

  const { data, error } = await client.rpc('start_webhook_rotation', {
    p_rotation_id: rotationId,
    p_subscription_id: subscription_id,
    p_tenant_id: tenant_id,
    p_new_secret: newSecret,
    p_grace_ends_at: graceEnd,
    p_actor_id: actor_id,
  });
  if (error) {
    // Surface typed errors verbatim (rotation_already_active). Other DB errors get a prefix.
    const msg = error.message || String(error);
    if (msg === 'rotation_already_active') throw new Error('rotation_already_active');
    if (msg.includes('rotation_already_active')) throw new Error('rotation_already_active');
    throw new Error(`rotation.startRotation: ${msg}`);
  }

  return { rotation_id: (data && data.rotation_id) || rotationId, grace_ends_at: graceEnd };
}

async function rollbackRotation(client, params = {}) {
  const { tenant_id, subscription_id, actor_id } = params;
  if (!tenant_id) throw new Error('rollbackRotation: tenant_id is required');
  if (!subscription_id) throw new Error('rollbackRotation: subscription_id is required');
  if (!actor_id) throw new Error('rollbackRotation: actor_id is required');

  const { data, error } = await client.rpc('rollback_webhook_rotation', {
    p_subscription_id: subscription_id,
    p_tenant_id: tenant_id,
    p_actor_id: actor_id,
  });
  if (error) {
    const msg = error.message || String(error);
    // D-12: past_grace is a typed rejection surfaced verbatim.
    if (msg === 'past_grace' || msg.includes('past_grace')) throw new Error('past_grace');
    if (msg === 'rotation_not_active' || msg.includes('rotation_not_active')) throw new Error('rotation_not_active');
    throw new Error(`rotation.rollbackRotation: ${msg}`);
  }
  return data;
}

async function finalizeExpiredRotations(client, now = new Date().toISOString()) {
  const { data, error } = await client.rpc('finalize_expired_webhook_rotations', { p_now: now });
  if (error) {
    const msg = error.message || String(error);
    throw new Error(`rotation.finalizeExpiredRotations: ${msg}`);
  }
  return Array.isArray(data) ? data : (data ? [data] : []);
}

function computeStage(grace_ends_at) {
  if (!grace_ends_at) return 'normal';
  const ms = new Date(grace_ends_at).getTime() - Date.now();
  const daysRemaining = Math.ceil(ms / 86400000);
  if (daysRemaining <= 0) return 't-0';
  if (daysRemaining <= 1) return 't-1';
  if (daysRemaining <= 7) return 't-7';
  return 'normal';
}

async function listActiveRotations(client, tenant_id) {
  if (!tenant_id) throw new Error('listActiveRotations: tenant_id is required');

  // Primary select: active rotations for this tenant.
  const rotationsRes = await client
    .from('markos_webhook_secret_rotations')
    .select('id, subscription_id, tenant_id, grace_ends_at, initiated_at, state')
    .eq('tenant_id', tenant_id)
    .eq('state', 'active')
    .order('initiated_at', { ascending: true });

  // The fluent builder may implement thenable or return { data, error }; normalize both.
  const rotationsData = Array.isArray(rotationsRes) ? rotationsRes : (rotationsRes && rotationsRes.data) || [];
  const rotationsError = rotationsRes && rotationsRes.error;
  if (rotationsError) throw new Error(`rotation.listActive: ${rotationsError.message}`);
  if (!rotationsData.length) return [];

  const subIds = rotationsData.map((r) => r.subscription_id);
  const subsRes = await client
    .from('markos_webhook_subscriptions')
    .select('id, url')
    .in('id', subIds);
  const subsData = Array.isArray(subsRes) ? subsRes : (subsRes && subsRes.data) || [];
  const subsError = subsRes && subsRes.error;
  if (subsError) throw new Error(`rotation.listActive: ${subsError.message}`);

  const subUrlById = new Map();
  for (const s of subsData) subUrlById.set(s.id, s.url);

  return rotationsData.map((r) => ({
    id: r.id,
    subscription_id: r.subscription_id,
    url: subUrlById.get(r.subscription_id) || null,
    grace_ends_at: r.grace_ends_at,
    initiated_at: r.initiated_at,
    stage: computeStage(r.grace_ends_at),
  }));
}

module.exports = {
  startRotation,
  rollbackRotation,
  finalizeExpiredRotations,
  listActiveRotations,
  computeStage,
  GRACE_DAYS,
};
