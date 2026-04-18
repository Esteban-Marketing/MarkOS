'use strict';

// Phase 202 Plan 03: cost-meter — per-tenant 24h rolling budget enforcement (D-10, D-11, D-21).
// The only admission gate for billable tool invocations. Fail-closed on RPC errors.

const { capCentsForPlanTier } = require('./cost-table.cjs');
const { enqueueAuditStaging } = require('../audit/writer.cjs');

// Effective-unbounded cap for trueup calls — trueup runs post-invocation and accepts overage
// per RESEARCH §cost Handler flow step 3. The next call will be blocked by the SQL fn's
// post-insert `spent_cents > cap_cents` check once the true cap applies.
const TRUEUP_CAP_CENTS = 2_000_000_000;

async function checkAndChargeBudget(client, input) {
  const { tenant_id, tool_id, plan_tier, estimated_cents, actor_id, org_id, req_id } = input || {};
  if (!tenant_id || !tool_id || !plan_tier || typeof estimated_cents !== 'number') {
    throw new Error('checkAndChargeBudget: tenant_id + tool_id + plan_tier + estimated_cents required');
  }

  const cap_cents = capCentsForPlanTier(plan_tier);

  const { data, error } = await client.rpc('check_and_charge_mcp_budget', {
    p_tenant_id: tenant_id,
    p_charge_cents: Math.max(0, Math.ceil(estimated_cents)),
    p_cap_cents: cap_cents,
  });
  if (error) throw new Error(`checkAndChargeBudget: rpc failed: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('checkAndChargeBudget: rpc returned empty');

  const result = {
    ok: row.ok === true,
    spent_cents: Number(row.spent_cents || 0),
    cap_cents: Number(row.cap_cents || cap_cents),
    reset_at: typeof row.reset_at === 'string' ? row.reset_at : new Date(row.reset_at).toISOString(),
  };

  if (!result.ok) {
    // Fire-and-forget audit on breach. Never let an audit failure mask the 402.
    await enqueueAuditStaging(client, {
      tenant_id,
      org_id: org_id || null,
      source_domain: 'mcp',
      action: 'tool.budget_exhausted',
      actor_id: actor_id || 'mcp-pipeline',
      actor_role: 'mcp-client',
      payload: {
        tool_id,
        req_id: req_id || null,
        spent_cents: result.spent_cents,
        cap_cents: result.cap_cents,
        reset_at: result.reset_at,
      },
    }).catch(() => {});
  }

  return result;
}

async function trueupBudget(client, input) {
  const { tenant_id, tool_id, delta_cents } = input || {};
  if (!tenant_id || !tool_id) throw new Error('trueupBudget: tenant_id + tool_id required');
  if (typeof delta_cents !== 'number' || delta_cents <= 0) return;

  // Charge the delta; use TRUEUP_CAP_CENTS so the insert always succeeds even if tenant at cap.
  const { error } = await client.rpc('check_and_charge_mcp_budget', {
    p_tenant_id: tenant_id,
    p_charge_cents: Math.ceil(delta_cents),
    p_cap_cents: TRUEUP_CAP_CENTS,
  });
  if (error) throw new Error(`trueupBudget: rpc failed: ${error.message}`);
}

async function readCurrentSpendCents(client, tenant_id) {
  if (!tenant_id) throw new Error('readCurrentSpendCents: tenant_id required');
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data, error } = await client
    .from('markos_mcp_cost_window')
    .select('window_start, spent_cents')
    .eq('tenant_id', tenant_id)
    .gt('window_start', cutoff);
  if (error) throw new Error(`readCurrentSpendCents: select failed: ${error.message}`);
  const rows = Array.isArray(data) ? data : [];
  const total = rows.reduce((sum, r) => sum + Number(r.spent_cents || 0), 0);
  const oldest = rows.length
    ? rows.reduce((a, b) => (a.window_start < b.window_start ? a : b)).window_start
    : cutoff;
  return { spent_cents: total, window_start: oldest };
}

function buildBudgetExhaustedJsonRpcError(id, req_id, budget) {
  return {
    jsonrpc: '2.0',
    id: id === undefined ? null : id,
    error: {
      code: -32001,
      message: 'budget_exhausted',
      data: {
        error: 'budget_exhausted',
        reset_at: budget.reset_at,
        spent_cents: budget.spent_cents,
        cap_cents: budget.cap_cents,
        req_id,
      },
    },
  };
}

module.exports = {
  TRUEUP_CAP_CENTS,
  checkAndChargeBudget,
  trueupBudget,
  readCurrentSpendCents,
  buildBudgetExhaustedJsonRpcError,
};
