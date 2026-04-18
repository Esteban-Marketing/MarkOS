'use strict';

// Phase 203 Plan 10 Task 1 — webhook log-drain primitive.
// MIRROR of lib/markos/mcp/log-drain.cjs (Plan 202-05) with domain='webhook' tag +
// webhook-specific D-30 field set. Vercel Log Drains wraps as
// { source:'lambda', message:<JSON>, ... } and downstream sinks auto-parse the JSON.
//
// Shared module across MCP + webhook domains: emitLogLine accepts any domain but
// forces defaults appropriate to this sibling of lib/markos/mcp/log-drain.cjs.

function emitLogLine(entry) {
  const safeEntry = {
    domain: entry && entry.domain ? entry.domain : 'webhook',
    timestamp: (entry && entry.timestamp) || new Date().toISOString(),
    req_id: (entry && entry.req_id) || null,
    tenant_id: (entry && entry.tenant_id) || null,
    sub_id: (entry && entry.sub_id) || null,
    delivery_id: (entry && entry.delivery_id) || null,
    event_type: (entry && entry.event_type) || null,
    delivery_attempt:
      entry && typeof entry.delivery_attempt === 'number' ? entry.delivery_attempt : null,
    duration_ms:
      entry && typeof entry.duration_ms === 'number' ? entry.duration_ms : null,
    status: (entry && entry.status) || null,
    error_code: (entry && entry.error_code) || null,
    cost_cents:
      entry && typeof entry.cost_cents === 'number' ? entry.cost_cents : null,
  };
  try {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(safeEntry));
  } catch {
    // emission must never throw into the delivery finally block (T-203-10-03 accept pattern).
  }
  return safeEntry; // returned for test introspection
}

module.exports = { emitLogLine };
