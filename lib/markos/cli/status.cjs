'use strict';

// Phase 204 Plan 08 Task 1 — aggregateStatus library.
//
// Cross-domain operator-self-serve status envelope used by:
//   - api/tenant/status.js (GET /api/tenant/status)
//   - bin/commands/status.cjs (markos status)
//
// Four panels assembled in one round trip:
//   1. subscription      — tenant plan_tier + billing_status (org-scoped; null
//                          columns gracefully default to free/active so this
//                          plan never blocks on Phase 205 billing schema).
//   2. quota             — runs_this_month + tokens_this_month + deliveries_this_month
//                          derived from markos_cli_runs (Plan 06) + safe-required
//                          webhook fleet metrics (Phase 203 Plan 09). Errors swallowed
//                          to zeros — status must NEVER fail on a single panel.
//   3. active_rotations  — safe-required from lib/markos/webhooks/rotation.cjs
//                          (Phase 203 Plan 05). Empty array if module absent.
//   4. recent_runs       — last 5 from lib/markos/cli/runs.cjs::listRuns (Plan 06).
//
// Cross-phase dependencies imported via `safeRequire` + neutral default fallback.
// Following 203-09's lib/markos/webhooks/subscriptions/list.js precedent: this
// plan never crashes on absent sibling modules.
//
// Tenant-scoped: every underlying query receives tenant_id from resolveWhoami;
// no cross-tenant query fan-out (T-204-08-01 mitigation).

// ─── safeRequire (203-09 pattern, copied verbatim) ─────────────────────────

function safeRequire(modulePath, fallback) {
  try {
    return require(modulePath);
  } catch {
    return fallback;
  }
}

const webhookRotation = safeRequire('../webhooks/rotation.cjs', {
  listActiveRotations: async () => [],
});
const webhookMetrics = safeRequire('../webhooks/metrics.cjs', {
  aggregateFleetMetrics: async () => ({
    total_24h: 0,
    success_rate: 100,
    avg_latency_ms: 0,
    dlq_count: 0,
  }),
});
const runsLib = safeRequire('./runs.cjs', {
  listRuns: async () => [],
});

// ─── Constants ─────────────────────────────────────────────────────────────

const TENANTS_TABLE = 'markos_tenants';
const ORGS_TABLE = 'markos_orgs';
const RUNS_TABLE = 'markos_cli_runs';

const QUOTA_WINDOW_DAYS = 30;
const QUOTA_WINDOW_MS = QUOTA_WINDOW_DAYS * 24 * 3600 * 1000;
const RECENT_RUNS_DEFAULT = 5;

const DEFAULT_SUBSCRIPTION = Object.freeze({
  plan_tier: 'free',
  billing_status: 'active',
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function assertClient(client, fn) {
  if (!client || typeof client.from !== 'function') {
    throw new Error(`${fn}: client required`);
  }
}

async function runQuery(builder) {
  if (!builder) return { data: null, error: null };
  if (typeof builder.then === 'function') return await builder;
  return builder;
}

function safeNumber(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

// ─── Subscription panel ────────────────────────────────────────────────────

// Best-effort lookup. If markos_orgs is missing the plan_tier/billing_status
// columns (Phase 205 has not landed) → return DEFAULT_SUBSCRIPTION. Never throws.
async function fetchSubscription(client, tenant_id) {
  try {
    // First resolve the tenant → org_id mapping (markos_tenants has org_id from
    // Phase 201 migration 81).
    const tenantRes = await runQuery(
      client.from(TENANTS_TABLE)
        .select('id, org_id')
        .eq('id', tenant_id)
        .maybeSingle(),
    );
    if (tenantRes?.error || !tenantRes?.data) {
      return { ...DEFAULT_SUBSCRIPTION };
    }
    const org_id = tenantRes.data.org_id;
    if (!org_id) return { ...DEFAULT_SUBSCRIPTION };

    // Best-effort SELECT — if the columns do not exist this throws. Catch
    // outer try/catch returns the default.
    const orgRes = await runQuery(
      client.from(ORGS_TABLE)
        .select('id, plan_tier, billing_status')
        .eq('id', org_id)
        .maybeSingle(),
    );
    if (orgRes?.error || !orgRes?.data) {
      return { ...DEFAULT_SUBSCRIPTION };
    }
    return {
      plan_tier: orgRes.data.plan_tier || DEFAULT_SUBSCRIPTION.plan_tier,
      billing_status: orgRes.data.billing_status || DEFAULT_SUBSCRIPTION.billing_status,
    };
  } catch {
    // Schema missing the columns OR markos_orgs absent entirely — accept the
    // default rather than failing the entire status envelope.
    return { ...DEFAULT_SUBSCRIPTION };
  }
}

// ─── Quota panel ───────────────────────────────────────────────────────────

// runs_this_month: COUNT + SUM tokens_used from markos_cli_runs over the
// last 30 days, tenant-scoped. Errors → zeros (status must not 500 on quota).
async function fetchRunsQuota(client, tenant_id) {
  const windowStart = new Date(Date.now() - QUOTA_WINDOW_MS).toISOString();
  try {
    const res = await runQuery(
      client.from(RUNS_TABLE)
        .select('id, result_json, created_at')
        .eq('tenant_id', tenant_id)
        .gte('created_at', windowStart),
    );
    if (res?.error) return { runs_this_month: 0, tokens_this_month: 0 };
    const rows = Array.isArray(res?.data) ? res.data : [];
    let runs = 0;
    let tokens = 0;
    for (const row of rows) {
      runs += 1;
      // result_json is opaque JSON; tokens_used may be a number under it.
      const r = row && row.result_json;
      if (r && typeof r === 'object') {
        const t = r.tokens_used;
        tokens += safeNumber(t);
      } else if (typeof r === 'string') {
        // Defensive: result_json arrived as a JSON string.
        try {
          const parsed = JSON.parse(r);
          tokens += safeNumber(parsed && parsed.tokens_used);
        } catch { /* swallow */ }
      }
    }
    return { runs_this_month: runs, tokens_this_month: tokens };
  } catch {
    return { runs_this_month: 0, tokens_this_month: 0 };
  }
}

// deliveries_this_month: derive from webhook metrics. The fleet metrics view
// is 24h-windowed; rough 30d projection = total_24h * 30. Real 30d aggregate
// deferred to Phase 205 / gap-closure. Errors → 0.
async function fetchDeliveriesQuota(client, tenant_id) {
  try {
    const metrics = await webhookMetrics.aggregateFleetMetrics(client, tenant_id);
    const total24 = safeNumber(metrics && metrics.total_24h);
    return { deliveries_this_month: total24 * QUOTA_WINDOW_DAYS };
  } catch {
    return { deliveries_this_month: 0 };
  }
}

async function fetchQuota(client, tenant_id) {
  const [runsQuota, deliveriesQuota] = await Promise.all([
    fetchRunsQuota(client, tenant_id),
    fetchDeliveriesQuota(client, tenant_id),
  ]);
  return {
    runs_this_month: runsQuota.runs_this_month,
    tokens_this_month: runsQuota.tokens_this_month,
    deliveries_this_month: deliveriesQuota.deliveries_this_month,
    window_days: QUOTA_WINDOW_DAYS,
  };
}

// ─── Active rotations panel ────────────────────────────────────────────────

async function fetchRotations(client, tenant_id) {
  try {
    const rows = await webhookRotation.listActiveRotations(client, tenant_id);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

// ─── Recent runs panel ─────────────────────────────────────────────────────

async function fetchRecentRuns(client, tenant_id, limit = RECENT_RUNS_DEFAULT) {
  try {
    const rows = await runsLib.listRuns({
      client,
      tenant_id,
      limit: Math.max(1, Math.min(50, Number.parseInt(limit, 10) || RECENT_RUNS_DEFAULT)),
    });
    if (!Array.isArray(rows)) return [];
    // Project to the StatusEnvelope.recent_runs schema. listRuns already
    // omits brief_json / result_json (Plan 06 T-204-06-04 mitigation).
    return rows.map((r) => ({
      run_id: r.id,
      status: r.status,
      created_at: r.created_at,
      completed_at: r.completed_at || null,
      steps_completed: r.steps_completed,
      steps_total: r.steps_total,
    }));
  } catch {
    return [];
  }
}

// ─── aggregateStatus (the main export) ─────────────────────────────────────

async function aggregateStatus({ client, tenant_id, user_id, recent_limit } = {}) {
  assertClient(client, 'aggregateStatus');
  if (!tenant_id) throw new Error('aggregateStatus: tenant_id required');
  // user_id is currently advisory (read-only envelope; per-user filters not
  // applied yet). Tracked here so future per-user quotas can use the same
  // signature.

  const [subscription, quota, active_rotations, recent_runs] = await Promise.all([
    fetchSubscription(client, tenant_id),
    fetchQuota(client, tenant_id),
    fetchRotations(client, tenant_id),
    fetchRecentRuns(client, tenant_id, recent_limit),
  ]);

  return {
    subscription,
    quota,
    active_rotations,
    recent_runs,
    generated_at: new Date().toISOString(),
    // Pass-through for telemetry (advisory; never load-bearing).
    _tenant_id: tenant_id,
    _user_id: user_id || null,
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  aggregateStatus,
  // Internal helpers — exposed for tests + future composers.
  fetchSubscription,
  fetchQuota,
  fetchRotations,
  fetchRecentRuns,
  // Constants.
  TENANTS_TABLE,
  ORGS_TABLE,
  RUNS_TABLE,
  QUOTA_WINDOW_DAYS,
  QUOTA_WINDOW_MS,
  RECENT_RUNS_DEFAULT,
  DEFAULT_SUBSCRIPTION,
  // Internal — advertised for tests that want to assert safeRequire shim shape.
  _safeRequire: safeRequire,
};
