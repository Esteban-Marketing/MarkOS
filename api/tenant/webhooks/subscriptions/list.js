'use strict';

// Phase 203 Plan 09 Task 1:
// GET /api/tenant/webhooks/subscriptions
//
// Surface 1 subscriptions table source. Returns tenant-scoped array with rate_limit +
// breaker_state + last_delivery_at + success_rate decoration per row so the S1 table
// can render status chip + success-rate mini-bar + Test-fire column directly from the
// payload. Mirrors 202-09 api/tenant/mcp/sessions/list.js pattern.
//
// T-203-09-01 mitigation: `.eq('tenant_id', tenant_id)` is the first filter; cross-
// tenant rows never load.
// T-203-09-02 mitigation: explicit SELECT column list excludes `secret` + `secret_v2`.
// Signing material never leaves the DB via this endpoint.

const { writeJson } = require('../../../../lib/markos/crm/api.cjs');
const { resolvePerSubRps, PLAN_TIER_RPS } = require('../../../../lib/markos/webhooks/rate-limit.cjs');
const { perSubMetrics } = require('../../../../lib/markos/webhooks/metrics.cjs');

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../lib/markos/auth/session.ts');
  return real();
}

// Safe-require: Plan 203-08 ships lib/markos/webhooks/breaker.cjs in the same wave.
// When the module is not yet present, fall through to a neutral default so this
// endpoint doesn't crash during partial-wave rollouts or test runs.
function safeBreakerState(sub_id, deps) {
  if (deps && typeof deps.getBreakerState === 'function') {
    try { return deps.getBreakerState(deps.redis, sub_id); } catch { /* fallthrough */ }
  }
  try {
    // eslint-disable-next-line global-require
    const mod = require('../../../../lib/markos/webhooks/breaker.cjs');
    if (mod && typeof mod.getBreakerState === 'function') {
      return mod.getBreakerState(deps && deps.redis, sub_id);
    }
  } catch { /* module not present yet — Plan 203-08 pairs this */ }
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

function statusChipFor(breakerState) {
  const s = (breakerState && breakerState.state) || 'closed';
  if (s === 'open') return 'Tripped';
  if (s === 'half-open') return 'Half-open';
  return 'Healthy';
}

module.exports = async function handler(req, res) { return handleList(req, res); };
module.exports.handleList = handleList;

async function handleList(req, res, deps = {}) {
  if (req.method !== 'GET') return writeJson(res, 405, { error: 'method_not_allowed' });

  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  const org_id = req.headers['x-markos-org-id'];
  if (!user_id || !tenant_id) return writeJson(res, 401, { error: 'unauthorized' });

  const supabase = getSupabase(deps);
  const plan_tier = await resolvePlanTier(supabase, org_id);

  const subsRes = await supabase
    .from('markos_webhook_subscriptions')
    .select('id, tenant_id, url, events, active, created_at, rps_override, rotation_state, grace_ends_at')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false });
  const subsData = Array.isArray(subsRes) ? subsRes : (subsRes && subsRes.data) || [];
  const subsErr = subsRes && subsRes.error;
  if (subsErr) return writeJson(res, 500, { error: 'db_error' });

  const decorated = await Promise.all(subsData.map(async (sub) => {
    const ceiling = Object.prototype.hasOwnProperty.call(PLAN_TIER_RPS, plan_tier)
      ? PLAN_TIER_RPS[plan_tier]
      : PLAN_TIER_RPS.free;
    let effective_rps = ceiling;
    try {
      effective_rps = resolvePerSubRps({ plan_tier, rps_override: sub.rps_override });
    } catch { /* invalid override — display ceiling */ }

    const breaker_state = await safeBreakerState(sub.id, { ...deps });
    let metrics = { total_24h: 0, success_rate: 100.0, avg_latency_ms: 0, last_delivery_at: null };
    try {
      metrics = await perSubMetrics(supabase, tenant_id, sub.id);
    } catch { /* metrics gracefully empty; table still renders */ }

    return {
      id: sub.id,
      url: sub.url,
      events: sub.events || [],
      active: sub.active,
      created_at: sub.created_at,
      rotation_state: sub.rotation_state || null,
      grace_ends_at: sub.grace_ends_at || null,
      status_chip: statusChipFor(breaker_state),
      breaker_state,
      rate_limit: {
        plan_tier,
        ceiling_rps: ceiling,
        effective_rps,
        override_rps: sub.rps_override == null ? null : sub.rps_override,
      },
      last_delivery_at: metrics.last_delivery_at,
      success_rate: metrics.success_rate,
      total_24h: metrics.total_24h,
    };
  }));

  return writeJson(res, 200, { subscriptions: decorated });
}
