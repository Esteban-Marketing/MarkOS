'use strict';

// Phase 203 Plan 09 Task 1:
// GET /api/tenant/webhooks/subscriptions/{sub_id}
//
// Surface 2 detail endpoint. Returns full subscription + last-N deliveries + DLQ
// counter + RateLimitState + BreakerState (F-100 schema) + active rotation (if any).
// Response shape is consumed by S2's 3 tab panels:
//   - Deliveries panel seed from `deliveries[]`
//   - DLQ panel seed from `dlq_count`
//   - Settings panel seed from `rate_limit`, `breaker_state`, `rotation`
//
// Tenant scope + cross-tenant guard (T-203-09-01): SELECT subscription.tenant_id,
// 404 if row missing, 403 cross_tenant_forbidden if tenant_id mismatch. Pattern
// mirrors 202-09 api/tenant/mcp/sessions/revoke.js.
// T-203-09-02 mitigation: response shape omits secret + secret_v2 by explicit
// column listing; signing material never leaves the DB here.

const { writeJson } = require('../../../../../lib/markos/crm/api.cjs');
const { countDLQ } = require('../../../../../lib/markos/webhooks/dlq.cjs');
const { resolvePerSubRps, PLAN_TIER_RPS } = require('../../../../../lib/markos/webhooks/rate-limit.cjs');
const { listActiveRotations, computeStage } = require('../../../../../lib/markos/webhooks/rotation.cjs');
const { perSubMetrics } = require('../../../../../lib/markos/webhooks/metrics.cjs');

const LAST_DELIVERIES_LIMIT = 100;

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../../lib/markos/auth/session.ts');
  return real();
}

function safeBreakerState(sub_id, deps) {
  if (deps && typeof deps.getBreakerState === 'function') {
    try { return deps.getBreakerState(deps.redis, sub_id); } catch { /* fallthrough */ }
  }
  try {
    // eslint-disable-next-line global-require
    const mod = require('../../../../../lib/markos/webhooks/breaker.cjs');
    if (mod && typeof mod.getBreakerState === 'function') {
      return mod.getBreakerState(deps && deps.redis, sub_id);
    }
  } catch { /* Plan 203-08 not yet deployed — neutral default */ }
  return Promise.resolve({ state: 'closed', trips: 0, probe_at: null, opened_at: null });
}

async function resolvePlanTier(supabase, org_id) {
  if (!org_id) return 'free';
  try {
    const { data: org } = await supabase
      .from('markos_orgs')
      .select('plan_tier')
      .eq('id', org_id)
      .maybeSingle();
    return (org && org.plan_tier) || 'free';
  } catch {
    return 'free';
  }
}

module.exports = async function handler(req, res) { return handleDetail(req, res); };
module.exports.handleDetail = handleDetail;

async function handleDetail(req, res, deps = {}) {
  if (req.method !== 'GET') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  const org_id = req.headers['x-markos-org-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const { sub_id } = req.query || {};
  if (!sub_id) return writeJson(res, 400, { error: 'missing_params' });

  const supabase = getSupabase(deps);

  // Cross-tenant guard — SELECT without tenant filter, check ownership, then 403/404 map.
  const { data: sub, error: subErr } = await supabase
    .from('markos_webhook_subscriptions')
    .select('id, tenant_id, url, events, active, created_at, updated_at, rps_override, rotation_state, grace_started_at, grace_ends_at')
    .eq('id', sub_id)
    .maybeSingle();
  if (subErr) return writeJson(res, 500, { error: 'db_error' });
  if (!sub) return writeJson(res, 404, { error: 'subscription_not_found' });
  if (sub.tenant_id !== tenant_id) return writeJson(res, 403, { error: 'cross_tenant_forbidden' });

  const plan_tier = await resolvePlanTier(supabase, org_id);
  const ceiling = Object.prototype.hasOwnProperty.call(PLAN_TIER_RPS, plan_tier)
    ? PLAN_TIER_RPS[plan_tier]
    : PLAN_TIER_RPS.free;
  let effective_rps = ceiling;
  try {
    effective_rps = resolvePerSubRps({ plan_tier, rps_override: sub.rps_override });
  } catch { /* invalid override — fall back to ceiling */ }

  // Last-100 deliveries — newest first. Omit raw secret-bearing columns.
  const delivRes = await supabase
    .from('markos_webhook_deliveries')
    .select('id, event_id, event, status, attempt, created_at, updated_at, replayed_from, dlq_reason, dlq_at, final_attempt, next_attempt_at')
    .eq('tenant_id', tenant_id)
    .eq('subscription_id', sub_id)
    .order('created_at', { ascending: false })
    .limit(LAST_DELIVERIES_LIMIT);
  const deliveries = Array.isArray(delivRes) ? delivRes : (delivRes && delivRes.data) || [];
  const delivErr = delivRes && delivRes.error;
  if (delivErr) return writeJson(res, 500, { error: 'db_error' });

  let dlq_count = 0;
  try { dlq_count = await countDLQ(supabase, { tenant_id }); } catch { dlq_count = 0; }

  const breaker_state = await safeBreakerState(sub.id, { ...deps });

  let rotation = null;
  try {
    const rotations = await listActiveRotations(supabase, tenant_id);
    const match = rotations.find((r) => r.subscription_id === sub.id);
    if (match) {
      rotation = {
        id: match.id,
        stage: match.stage || computeStage(match.grace_ends_at),
        grace_ends_at: match.grace_ends_at,
        initiated_at: match.initiated_at,
      };
    }
  } catch { /* no active rotation — rotation stays null */ }

  let metrics = { total_24h: 0, success_rate: 100.0, avg_latency_ms: 0, last_delivery_at: null };
  try {
    metrics = await perSubMetrics(supabase, tenant_id, sub.id);
  } catch { /* metrics gracefully empty */ }

  return writeJson(res, 200, {
    subscription: {
      id: sub.id,
      url: sub.url,
      events: sub.events || [],
      active: sub.active,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
      rotation_state: sub.rotation_state || null,
      grace_started_at: sub.grace_started_at || null,
      grace_ends_at: sub.grace_ends_at || null,
    },
    deliveries,
    dlq_count,
    rate_limit: {
      plan_tier,
      ceiling_rps: ceiling,
      effective_rps,
      override_rps: sub.rps_override == null ? null : sub.rps_override,
    },
    breaker_state,
    rotation,
    metrics,
  });
}
