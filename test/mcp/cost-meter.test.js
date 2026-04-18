'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  checkAndChargeBudget, trueupBudget, readCurrentSpendCents,
  buildBudgetExhaustedJsonRpcError, TRUEUP_CAP_CENTS,
} = require('../../lib/markos/mcp/cost-meter.cjs');

function mockSupabase(state = {}) {
  state.rpc_calls = [];
  state.audit = [];
  state.rows = state.rows || [];
  state.rpc_return = state.rpc_return;
  state.rpc_error = state.rpc_error;

  return {
    state,
    rpc(name, args) {
      state.rpc_calls.push({ name, args });
      if (state.rpc_error) return Promise.resolve({ data: null, error: state.rpc_error });
      return Promise.resolve({ data: state.rpc_return || [{ ok: true, spent_cents: 0, cap_cents: 100, reset_at: new Date().toISOString() }], error: null });
    },
    from(name) {
      if (name === 'markos_mcp_cost_window') {
        return {
          select: () => ({
            eq: () => ({
              gt: () => Promise.resolve({ data: state.rows, error: null }),
            }),
          }),
        };
      }
      if (name === 'markos_audit_log_staging' || name === 'markos_audit_staging' || name === 'markos_audit_log') {
        return {
          insert: (r) => ({
            select: () => ({
              single: async () => { state.audit.push(r); return { data: { id: 'audit-stub-id' }, error: null }; },
            }),
          }),
        };
      }
      return { insert: async () => ({ error: null }) };
    },
  };
}

test('Suite 202-03: checkAndChargeBudget calls check_and_charge_mcp_budget RPC with correct cap for free tier', async () => {
  const c = mockSupabase({ rpc_return: [{ ok: true, spent_cents: 5, cap_cents: 100, reset_at: new Date().toISOString() }] });
  const r = await checkAndChargeBudget(c, { tenant_id: 't1', tool_id: 'draft_message', plan_tier: 'free', estimated_cents: 3 });
  assert.equal(r.ok, true);
  assert.equal(c.state.rpc_calls.length, 1);
  assert.equal(c.state.rpc_calls[0].name, 'check_and_charge_mcp_budget');
  assert.equal(c.state.rpc_calls[0].args.p_cap_cents, 100);
  assert.equal(c.state.rpc_calls[0].args.p_charge_cents, 3);
});

test('Suite 202-03: checkAndChargeBudget resolves cap 10000 for non-free plan tier', async () => {
  const c = mockSupabase({ rpc_return: [{ ok: true, spent_cents: 0, cap_cents: 10000, reset_at: new Date().toISOString() }] });
  await checkAndChargeBudget(c, { tenant_id: 't1', tool_id: 'draft_message', plan_tier: 'team', estimated_cents: 1 });
  assert.equal(c.state.rpc_calls[0].args.p_cap_cents, 10000);
});

test('Suite 202-03: checkAndChargeBudget emits source_domain=mcp action=tool.budget_exhausted audit on ok=false', async () => {
  const reset = new Date(Date.now() + 3600 * 1000).toISOString();
  const c = mockSupabase({ rpc_return: [{ ok: false, spent_cents: 100, cap_cents: 100, reset_at: reset }] });
  const r = await checkAndChargeBudget(c, { tenant_id: 't1', tool_id: 'draft_message', plan_tier: 'free', estimated_cents: 3, req_id: 'mcp-req-abc' });
  assert.equal(r.ok, false);
  assert.equal(r.spent_cents, 100);
  assert.equal(r.cap_cents, 100);
  const audit = c.state.audit[0];
  assert.equal(audit?.source_domain, 'mcp');
  assert.equal(audit?.action, 'tool.budget_exhausted');
  assert.equal(audit?.payload?.tool_id, 'draft_message');
  assert.equal(audit?.payload?.req_id, 'mcp-req-abc');
});

test('Suite 202-03: checkAndChargeBudget does NOT emit audit when ok=true', async () => {
  const c = mockSupabase({ rpc_return: [{ ok: true, spent_cents: 5, cap_cents: 100, reset_at: new Date().toISOString() }] });
  await checkAndChargeBudget(c, { tenant_id: 't1', tool_id: 'draft_message', plan_tier: 'free', estimated_cents: 3 });
  assert.equal(c.state.audit.length, 0);
});

test('Suite 202-03: checkAndChargeBudget rethrows on RPC error (fail-closed)', async () => {
  const c = mockSupabase({ rpc_error: { message: 'db down' } });
  await assert.rejects(() => checkAndChargeBudget(c, { tenant_id: 't1', tool_id: 'draft_message', plan_tier: 'free', estimated_cents: 1 }), /db down/);
});

test('Suite 202-03: trueupBudget calls RPC with effectively-unbounded cap (TRUEUP_CAP_CENTS)', async () => {
  const c = mockSupabase();
  await trueupBudget(c, { tenant_id: 't1', tool_id: 'draft_message', delta_cents: 7 });
  assert.equal(c.state.rpc_calls.length, 1);
  assert.equal(c.state.rpc_calls[0].args.p_charge_cents, 7);
  assert.equal(c.state.rpc_calls[0].args.p_cap_cents, TRUEUP_CAP_CENTS);
});

test('Suite 202-03: trueupBudget is a no-op when delta_cents <= 0', async () => {
  const c = mockSupabase();
  await trueupBudget(c, { tenant_id: 't1', tool_id: 'draft_message', delta_cents: 0 });
  await trueupBudget(c, { tenant_id: 't1', tool_id: 'draft_message', delta_cents: -3 });
  assert.equal(c.state.rpc_calls.length, 0);
});

test('Suite 202-03: readCurrentSpendCents sums across hourly buckets within last 24h', async () => {
  const c = mockSupabase({ rows: [
    { window_start: new Date(Date.now() - 20 * 3600 * 1000).toISOString(), spent_cents: 30 },
    { window_start: new Date(Date.now() - 10 * 3600 * 1000).toISOString(), spent_cents: 25 },
    { window_start: new Date(Date.now() -  2 * 3600 * 1000).toISOString(), spent_cents: 15 },
  ] });
  const r = await readCurrentSpendCents(c, 't1');
  assert.equal(r.spent_cents, 70);
});

test('Suite 202-03: readCurrentSpendCents returns 0 when no buckets', async () => {
  const c = mockSupabase({ rows: [] });
  const r = await readCurrentSpendCents(c, 't1');
  assert.equal(r.spent_cents, 0);
});

test('Suite 202-03: buildBudgetExhaustedJsonRpcError returns JSON-RPC -32001 envelope (D-11)', () => {
  const reset = '2026-04-18T14:00:00.000Z';
  const env = buildBudgetExhaustedJsonRpcError(42, 'mcp-req-xyz', { reset_at: reset, spent_cents: 100, cap_cents: 100 });
  assert.equal(env.jsonrpc, '2.0');
  assert.equal(env.id, 42);
  assert.equal(env.error.code, -32001);
  assert.equal(env.error.message, 'budget_exhausted');
  assert.equal(env.error.data.error, 'budget_exhausted');
  assert.equal(env.error.data.reset_at, reset);
  assert.equal(env.error.data.spent_cents, 100);
  assert.equal(env.error.data.cap_cents, 100);
  assert.equal(env.error.data.req_id, 'mcp-req-xyz');
});

test('Suite 202-03: buildBudgetExhaustedJsonRpcError normalizes undefined id to null', () => {
  const env = buildBudgetExhaustedJsonRpcError(undefined, 'r', { reset_at: 'x', spent_cents: 0, cap_cents: 0 });
  assert.equal(env.id, null);
});
