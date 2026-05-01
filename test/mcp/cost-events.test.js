'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TABLE, recordCostEvent } = require('../../lib/markos/mcp/cost-events.cjs');

function createClient(state = {}) {
  state.rows = state.rows || [];
  state.error = state.error || null;
  return {
    state,
    from(name) {
      assert.equal(name, TABLE);
      return {
        insert: async (row) => {
          if (state.error) return { error: state.error };
          state.rows.push(row);
          return { error: null };
        },
      };
    },
  };
}

test('recordCostEvent inserts one row with the expected shape', async () => {
  const client = createClient();
  const result = await recordCostEvent(client, {
    tenant_id: 't1',
    org_id: 'o1',
    mcp_session_id: 'sess-1',
    key_id: 'key-1',
    tool_name: 'draft_message',
    llm_call_id: 'llm-1',
    cost_cents: 7,
    occurred_at: '2026-04-30T12:00:00.000Z',
  });
  assert.equal(client.state.rows.length, 1);
  assert.equal(client.state.rows[0].tenant_id, 't1');
  assert.equal(client.state.rows[0].tool_name, 'draft_message');
  assert.equal(result.cost_cents, 7);
});

test('recordCostEvent normalizes negative cost_cents to 0', async () => {
  const client = createClient();
  await recordCostEvent(client, {
    tenant_id: 't1',
    tool_name: 'list_pain_points',
    cost_cents: -9,
  });
  assert.equal(client.state.rows[0].cost_cents, 0);
});

test('recordCostEvent requires tenant_id', async () => {
  const client = createClient();
  await assert.rejects(() => recordCostEvent(client, { tool_name: 'draft_message' }), /tenant_id required/);
});

test('recordCostEvent requires tool_name', async () => {
  const client = createClient();
  await assert.rejects(() => recordCostEvent(client, { tenant_id: 't1' }), /tool_name required/);
});

test('recordCostEvent throws when the insert fails', async () => {
  const client = createClient({ error: { message: 'insert failed' } });
  await assert.rejects(() => recordCostEvent(client, { tenant_id: 't1', tool_name: 'draft_message' }), /insert failed/);
});

test('recordCostEvent prefixes generated ids with mcp-cost-', async () => {
  const client = createClient();
  await recordCostEvent(client, { tenant_id: 't1', tool_name: 'draft_message' });
  assert.equal(client.state.rows[0].id.startsWith('mcp-cost-'), true);
});
