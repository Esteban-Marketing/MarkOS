'use strict';

// Phase 200.1 D-204: inline per-tool cost telemetry.
// This is intentionally fail-closed: insert errors bubble to the caller.

const crypto = require('node:crypto');

const TABLE = 'markos_mcp_cost_events';
const ID_PREFIX = 'mcp-cost-';

async function runQuery(builder) {
  if (!builder) return { data: null, error: null };
  if (typeof builder.then === 'function') return builder;
  return builder;
}

async function recordCostEvent(client, input = {}) {
  if (!client || typeof client.from !== 'function') {
    throw new Error('recordCostEvent: supabase client required');
  }

  const {
    tenant_id,
    org_id = null,
    mcp_session_id = null,
    key_id = null,
    tool_name,
    llm_call_id = null,
    cost_cents = 0,
    occurred_at = new Date().toISOString(),
  } = input;

  if (!tenant_id) throw new Error('recordCostEvent: tenant_id required');
  if (!tool_name) throw new Error('recordCostEvent: tool_name required');

  const row = {
    id: ID_PREFIX + crypto.randomBytes(8).toString('hex'),
    tenant_id,
    org_id,
    mcp_session_id,
    key_id,
    tool_name,
    llm_call_id,
    cost_cents: Math.max(0, Number(cost_cents) || 0),
    occurred_at,
  };

  const res = await runQuery(client.from(TABLE).insert(row));
  if (res.error) {
    throw new Error(`recordCostEvent: insert failed: ${res.error.message || String(res.error)}`);
  }

  return {
    id: row.id,
    occurred_at,
    cost_cents: row.cost_cents,
  };
}

module.exports = {
  TABLE,
  ID_PREFIX,
  recordCostEvent,
};
