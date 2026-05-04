'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  HOLD_TABLE,
  checkKillSwitch,
  buildKillSwitchJsonRpcError,
} = require('../../lib/markos/mcp/kill-switch.cjs');

function createClient(state = {}) {
  state.rows = state.rows || [];
  state.audit = state.audit || [];
  state.error = state.error || null;

  return {
    state,
    from(name) {
      if (name === HOLD_TABLE) {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => {
                  if (state.error) return { data: null, error: state.error };
                  return { data: state.rows.slice(0, 1), error: null };
                },
              }),
              maybeSingle: async () => {
                if (state.error) return { data: null, error: state.error };
                return { data: state.rows[0] || null, error: null };
              },
            }),
          }),
        };
      }
      if (name === 'markos_audit_log_staging') {
        return {
          insert: (row) => ({
            select: () => ({
              single: async () => {
                state.audit.push(row);
                return { data: { id: String(state.audit.length) }, error: null };
              },
            }),
          }),
        };
      }
      return {
        insert: async () => ({ error: null }),
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },
  };
}

test('checkKillSwitch returns tripped=false when no active hold exists', async () => {
  const client = createClient({ rows: [] });
  const result = await checkKillSwitch(client, 't1');
  assert.deepEqual(result, { tripped: false });
});

test('checkKillSwitch trips on hold_state=hold with no release timestamp', async () => {
  const client = createClient({ rows: [{ hold_id: 'h1', hold_state: 'hold', released_at: null, reason_code: 'past_due' }] });
  const result = await checkKillSwitch(client, 't1');
  assert.equal(result.tripped, true);
  assert.equal(result.reason, 'billing_hold');
  assert.equal(client.state.audit[0].action, 'mcp.kill_switch_triggered');
});

test('checkKillSwitch does not trip on released holds', async () => {
  const client = createClient({ rows: [{ hold_id: 'h1', hold_state: 'hold', released_at: '2026-04-30T12:00:00.000Z' }] });
  const result = await checkKillSwitch(client, 't1');
  assert.deepEqual(result, { tripped: false });
});

test('checkKillSwitch fails closed when the lookup errors', async () => {
  const client = createClient({ error: { message: 'db down' } });
  const result = await checkKillSwitch(client, 't1');
  assert.equal(result.tripped, true);
  assert.equal(result.reason, 'kill_switch_check_failed');
});

test('buildKillSwitchJsonRpcError returns a 402-friendly JSON-RPC envelope', () => {
  const env = buildKillSwitchJsonRpcError(1, 'req-1', { reason: 'billing_hold', hold_id: 'h1' });
  assert.equal(env.error.code, -32003);
  assert.equal(env.error.message, 'kill_switch_triggered');
  assert.equal(env.error.data.reason, 'billing_hold');
});

test('checkKillSwitch treats missing tenant_id as fail-closed', async () => {
  const client = createClient();
  const result = await checkKillSwitch(client, '');
  assert.equal(result.tripped, true);
  assert.equal(result.reason, 'kill_switch_check_failed');
});
