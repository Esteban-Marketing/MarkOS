'use strict';

// Phase 200.1 D-204: MCP billing kill-switch.
// The plan text references legacy `markos_tenant_billing_holds.exceeded_at`; repo reality
// today uses `tenant_billing_holds` with hold_state/released_at, so we consume that table.

const { enqueueAuditStaging } = require('../audit/writer.cjs');

const HOLD_TABLE = 'tenant_billing_holds';

async function runQuery(builder) {
  if (!builder) return { data: null, error: null };
  if (typeof builder.then === 'function') return builder;
  return builder;
}

async function emitKillSwitchSafe(client, tenant_id, detail = {}, ctx = {}) {
  if (!client || typeof client.from !== 'function') return;
  try {
    await enqueueAuditStaging(client, {
      tenant_id,
      org_id: ctx.org_id || null,
      source_domain: 'mcp',
      action: 'mcp.kill_switch_triggered',
      actor_id: String(ctx.actor_id || tenant_id),
      actor_role: String(ctx.actor_role || 'mcp-client'),
      payload: {
        reason: detail.reason || 'billing_hold',
        hold_id: detail.hold_id || null,
        hold_state: detail.hold_state || null,
      },
    });
  } catch {
    // 402 response is the authoritative outcome; audit is best-effort here.
  }
}

async function checkKillSwitch(client, tenant_id, ctx = {}) {
  if (!client || typeof client.from !== 'function') {
    return { tripped: true, reason: 'kill_switch_check_failed' };
  }
  if (!tenant_id) return { tripped: true, reason: 'kill_switch_check_failed' };

  try {
    let builder = client
      .from(HOLD_TABLE)
      .select('hold_id, hold_state, reason_code, released_at, applied_at')
      .eq('tenant_id', tenant_id);
    if (typeof builder.order === 'function') {
      builder = builder.order('applied_at', { ascending: false });
    }
    if (typeof builder.limit === 'function') {
      builder = builder.limit(1);
    }

    let res;
    if (typeof builder.maybeSingle === 'function') {
      res = await builder.maybeSingle();
    } else {
      res = await runQuery(builder);
    }

    if (res.error) throw res.error;
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!row) return { tripped: false };

    const tripped = row.exceeded_at != null || (row.hold_state === 'hold' && row.released_at == null);
    if (!tripped) return { tripped: false };

    const detail = {
      tripped: true,
      reason: 'billing_hold',
      hold_id: row.hold_id || null,
      hold_state: row.hold_state || null,
      reason_code: row.reason_code || null,
    };
    await emitKillSwitchSafe(client, tenant_id, detail, ctx);
    return detail;
  } catch {
    const detail = { tripped: true, reason: 'kill_switch_check_failed' };
    await emitKillSwitchSafe(client, tenant_id, detail, ctx);
    return detail;
  }
}

function buildKillSwitchJsonRpcError(id, req_id, detail = {}) {
  return {
    jsonrpc: '2.0',
    id: id === undefined ? null : id,
    error: {
      code: -32003,
      message: 'kill_switch_triggered',
      data: {
        reason: detail.reason || 'billing_hold',
        hold_id: detail.hold_id || null,
        req_id,
      },
    },
  };
}

module.exports = {
  HOLD_TABLE,
  checkKillSwitch,
  buildKillSwitchJsonRpcError,
};
