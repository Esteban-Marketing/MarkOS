'use strict';

// D-30: one JSON line per tool call. Vercel Log Drains wraps as { source:'lambda', message:<JSON>, ... }.
// Downstream sinks (Datadog / Logflare / Sentry Logs) auto-parse the JSON in `message`.

function emitLogLine(entry) {
  const safeEntry = {
    domain: 'mcp',
    req_id: entry.req_id || null,
    session_id: entry.session_id || null,
    tenant_id: entry.tenant_id || null,
    tool_id: entry.tool_id || null,
    duration_ms: typeof entry.duration_ms === 'number' ? entry.duration_ms : null,
    status: entry.status || null,
    cost_cents: typeof entry.cost_cents === 'number' ? entry.cost_cents : 0,
    error_code: entry.error_code || null,
    timestamp: new Date().toISOString(),
  };
  try {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(safeEntry));
  } catch {
    // log-drain emission must never throw into the pipeline finally block
  }
  return safeEntry; // returned for test introspection
}

module.exports = { emitLogLine };
