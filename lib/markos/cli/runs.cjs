'use strict';

// Phase 204 Plan 06 Task 1 — CLI runs library.
//
// Canonical runtime for `markos run <brief>` and the SSE event stream. Four
// exports:
//   - submitRun({ client, tenant_id, user_id, brief })            → { run_id, status, tenant_id }
//   - streamRunEvents({ client, run_id, tenant_id, writer, ... }) → async writer (SSE frames)
//   - listRuns({ client, tenant_id, limit })                      → array of meta rows
//   - getRun({ client, tenant_id, run_id })                       → single full row
//
// Plus an internal `runStubExecutor` helper (Phase 205 will replace with the
// real LLM-backed executor; today it walks the state machine with fixed 300ms
// delays so the SSE stream has something meaningful to emit).
//
// Storage:
//   - markos_cli_runs (migration 75) — one row per submission.
//   - Audit: enqueueAuditStaging source_domain='cli' action='run.submitted'.
//
// Wire compatibility:
//   - Envelope derived from lib/markos/cli/plan.cjs::buildPlanEnvelope so the
//     durable POST /api/tenant/runs body + the dry-run /plan response share a
//     single shape. Plan 204-13 later lifts these rows into AgentRun v2 tables.

const crypto = require('node:crypto');
const { buildPlanEnvelope } = require('./plan.cjs');

// ─── Constants ─────────────────────────────────────────────────────────────

const RUNS_TABLE = 'markos_cli_runs';

const RUN_STATES = Object.freeze(['pending', 'running', 'success', 'failed', 'cancelled']);
const TERMINAL_STATES = Object.freeze(new Set(['success', 'failed', 'cancelled']));

const STUB_STEP_DELAY_MS = 300;      // executor: 300ms per step transition
const POLL_INTERVAL_MS = 500;        // streamRunEvents: re-SELECT cadence
const HEARTBEAT_MS = 15_000;         // server heartbeat cadence (MDN SSE spec)
const MAX_STREAM_MS = 30 * 60 * 1000; // 30-min hard cap per QA-02

// ─── Helpers ───────────────────────────────────────────────────────────────

function assertClient(client, fn) {
  if (!client || typeof client.from !== 'function') {
    throw new Error(`${fn}: supabase client required`);
  }
}

function sha256Short(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex').slice(0, 8);
}

function newCorrelationId() {
  // ulid-ish (time-sortable hex). The 207 substrate can accept any opaque
  // string; we keep it short + monotonic for debuggability.
  return 'cor_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
}

async function runQuery(builder) {
  if (!builder) return { data: null, error: null };
  if (typeof builder.then === 'function') return await builder;
  return builder;
}

// Best-effort audit emit. Swallows errors — audit is advisory, not blocking.
async function tryEmitAudit(client, entry) {
  try {
    const { enqueueAuditStaging } = require('../audit/writer.cjs');
    await enqueueAuditStaging(client, entry);
  } catch {
    // Advisory path — tests that inject a stub client without the staging
    // table still pass.
  }
}

// ─── submitRun ─────────────────────────────────────────────────────────────

// INSERTs a row with status='pending' and schedules the stub executor on the
// next tick. Returns the run_id + status + tenant_id for the caller to echo.
async function submitRun({ client, tenant_id, user_id, brief, priority, chain_id, correlation_id, agent_id } = {}) {
  assertClient(client, 'submitRun');
  if (!tenant_id) throw new Error('submitRun: tenant_id required');
  if (!user_id) throw new Error('submitRun: user_id required');
  if (!brief || typeof brief !== 'object') throw new Error('submitRun: brief required');

  // Build the envelope shape so cost_usd_micro / agent_id / priority are
  // consistent with the dry-run /plan response. source_domain='cli' tag is
  // emitted as audit.
  const envelope = buildPlanEnvelope({ tenant_id, priority: priority || 'P2' });

  const row = {
    tenant_id,
    user_id,
    brief_json: brief,
    status: 'pending',
    steps_completed: 0,
    steps_total: envelope.steps.length,
    trigger_kind: 'cli',
    source_surface: 'cli:markos run',
    priority: envelope.priority,
    chain_id: chain_id || null,
    correlation_id: correlation_id || newCorrelationId(),
    agent_id: agent_id || envelope.agent_id,
    agent_registry_version: '2026-04-23-r1',
    estimated_cost_usd_micro: envelope.estimated_cost_usd_micro,
    actual_cost_usd_micro: 0,
  };

  // Insert + fetch back the generated id.
  const { data, error } = await runQuery(
    client.from(RUNS_TABLE).insert(row).select('id, status, tenant_id, priority').single(),
  );
  if (error) throw new Error(`submitRun: insert failed: ${error.message || String(error)}`);
  const inserted = Array.isArray(data) ? data[0] : data;
  if (!inserted || !inserted.id) throw new Error('submitRun: insert returned no id');

  const run_id = inserted.id;

  // Fire-and-forget audit emit. Not blocking the response.
  await tryEmitAudit(client, {
    tenant_id,
    source_domain: 'cli',
    action: 'run.submitted',
    actor_id: user_id,
    actor_role: 'cli',
    payload: {
      run_id,
      brief_hash: sha256Short(JSON.stringify(brief)),
      priority: envelope.priority,
      correlation_id: row.correlation_id,
    },
  });

  // Schedule the stub executor on the next tick. setImmediate keeps it off
  // the HTTP response path — the caller sees 201 immediately.
  setImmediate(() => {
    runStubExecutor(client, run_id).catch(() => { /* swallow; stream will surface */ });
  });

  return {
    run_id,
    status: inserted.status || 'pending',
    tenant_id: inserted.tenant_id || tenant_id,
    priority: inserted.priority || envelope.priority,
    correlation_id: row.correlation_id,
    events_url: `/api/tenant/runs/${run_id}/events`,
  };
}

// ─── runStubExecutor (internal; v1 GA placeholder) ─────────────────────────

// Walks the run through running→success with 300ms delays. Phase 205 will
// replace with a real LLM-backed executor. All UPDATEs are wrapped in
// try/catch so a missing row (race with a DELETE / cancel) is non-fatal.
async function runStubExecutor(client, run_id) {
  async function update(patch) {
    try {
      await runQuery(client.from(RUNS_TABLE).update(patch).eq('id', run_id));
    } catch {
      /* advisory */
    }
  }

  // Respect cancellation: if any update pass finds the row in 'cancelled',
  // bail. We re-SELECT between steps.
  async function isCancelled() {
    try {
      const { data } = await runQuery(
        client.from(RUNS_TABLE).select('status').eq('id', run_id).maybeSingle(),
      );
      return data && data.status === 'cancelled';
    } catch {
      return false;
    }
  }

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  // 1. → running
  await update({ status: 'running', started_at: new Date().toISOString(), steps_completed: 0 });

  // 2. step 1 of 3
  await delay(STUB_STEP_DELAY_MS);
  if (await isCancelled()) return;
  await update({ steps_completed: 1 });

  // 3. step 2 of 3
  await delay(STUB_STEP_DELAY_MS);
  if (await isCancelled()) return;
  await update({ steps_completed: 2 });

  // 4. step 3 of 3 + terminal
  await delay(STUB_STEP_DELAY_MS);
  if (await isCancelled()) return;
  await update({
    status: 'success',
    steps_completed: 3,
    completed_at: new Date().toISOString(),
    result_json: { draft: 'stub output for GA v1', tokens_used: 1850 },
  });
}

// ─── streamRunEvents ───────────────────────────────────────────────────────

// Async server-side SSE driver. Polls the run row every 500ms, emits events
// on state transitions + step increments, and writes a heartbeat every 15s.
// Terminates on terminal state, signal.abort, or 30-min cap.
//
// Writer contract: { write(chunk), end() } — a Node Writable / http ServerResponse
// both satisfy this.
async function streamRunEvents({
  client,
  run_id,
  tenant_id,
  writer,
  signal,
  lastEventId,
  // Injected for tests; defaults are module-level constants above.
  pollMs,
  heartbeatMs,
  maxMs,
  _nowFn,
} = {}) {
  assertClient(client, 'streamRunEvents');
  if (!run_id) throw new Error('streamRunEvents: run_id required');
  if (!tenant_id) throw new Error('streamRunEvents: tenant_id required');
  if (!writer || typeof writer.write !== 'function') throw new Error('streamRunEvents: writer required');

  const POLL = Number.isFinite(pollMs) ? pollMs : POLL_INTERVAL_MS;
  const HB = Number.isFinite(heartbeatMs) ? heartbeatMs : HEARTBEAT_MS;
  const MAX = Number.isFinite(maxMs) ? maxMs : MAX_STREAM_MS;
  const now = typeof _nowFn === 'function' ? _nowFn : () => Date.now();

  // eventId counter — resumes after Last-Event-ID if supplied.
  let eventId = Number.parseInt(String(lastEventId || 0), 10);
  if (!Number.isFinite(eventId) || eventId < 0) eventId = 0;

  function emit(event, data) {
    eventId += 1;
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    // Each data line per MDN SSE: "data:" prefix per line, frame ends \n\n.
    const lines = [];
    lines.push(`event: ${event}`);
    for (const l of payload.split('\n')) lines.push(`data: ${l}`);
    lines.push(`id: ${eventId}`);
    try { writer.write(lines.join('\n') + '\n\n'); } catch { /* writer closed */ }
  }

  async function fetchRow() {
    const { data, error } = await runQuery(
      client.from(RUNS_TABLE)
        .select('id, tenant_id, status, steps_completed, steps_total, result_json, error_message, started_at, completed_at')
        .eq('id', run_id)
        .maybeSingle(),
    );
    if (error) return null;
    return data || null;
  }

  const startMs = now();
  let lastHeartbeat = startMs;

  // Initial fetch — 404 guard. The handler already did this, but we re-check
  // for late deletes + cross-tenant (which the handler also guards but we
  // double-check here in case the lib is invoked directly).
  const first = await fetchRow();
  if (!first) {
    emit('run.error', { error: 'run_not_found', run_id });
    try { writer.end && writer.end(); } catch { /* noop */ }
    return;
  }
  if (first.tenant_id !== tenant_id) {
    emit('run.error', { error: 'cross_tenant_forbidden', run_id });
    try { writer.end && writer.end(); } catch { /* noop */ }
    return;
  }

  // Emit initial snapshot.
  emit('run.snapshot', {
    run_id,
    status: first.status,
    steps_completed: first.steps_completed,
    steps_total: first.steps_total,
  });
  if (TERMINAL_STATES.has(first.status)) {
    emit('run.completed', {
      run_id,
      status: first.status,
      result: first.result_json || null,
      error: first.error_message || null,
    });
    try { writer.end && writer.end(); } catch { /* noop */ }
    return;
  }

  let prev = { status: first.status, steps_completed: first.steps_completed };

  while (true) {
    if (signal && signal.aborted) {
      emit('run.aborted', { run_id, reason: 'client_disconnect' });
      try { writer.end && writer.end(); } catch { /* noop */ }
      return;
    }
    const elapsed = now() - startMs;
    if (elapsed >= MAX) {
      emit('run.timeout', { run_id, elapsed_ms: elapsed });
      try { writer.end && writer.end(); } catch { /* noop */ }
      return;
    }

    await new Promise((r) => setTimeout(r, POLL));

    const row = await fetchRow();
    if (!row) {
      // Row deleted mid-stream — treat as cancelled.
      emit('run.error', { error: 'run_not_found', run_id });
      try { writer.end && writer.end(); } catch { /* noop */ }
      return;
    }

    // Step transitions.
    if (row.status !== prev.status && (row.status === 'running' || row.status === 'running')) {
      // No-op placeholder for future per-status events.
    }

    if (row.steps_completed > prev.steps_completed) {
      for (let s = prev.steps_completed + 1; s <= row.steps_completed; s++) {
        emit('run.step.started', {
          run_id,
          step: s,
          steps_total: row.steps_total,
        });
        emit('run.step.completed', {
          run_id,
          step: s,
          steps_total: row.steps_total,
        });
      }
    }

    // Heartbeat.
    if (now() - lastHeartbeat >= HB) {
      emit('heartbeat', { ts: now() });
      lastHeartbeat = now();
    }

    // Terminal state → final event + close.
    if (TERMINAL_STATES.has(row.status)) {
      emit('run.completed', {
        run_id,
        status: row.status,
        result: row.result_json || null,
        error: row.error_message || null,
      });
      try { writer.end && writer.end(); } catch { /* noop */ }
      return;
    }

    prev = { status: row.status, steps_completed: row.steps_completed };
  }
}

// ─── listRuns ──────────────────────────────────────────────────────────────

// List recent runs for the tenant. T-204-06-04 mitigation: NEVER returns
// brief_json / result_json — those can be large and leak into log capture.
async function listRuns({ client, tenant_id, limit = 20 } = {}) {
  assertClient(client, 'listRuns');
  if (!tenant_id) throw new Error('listRuns: tenant_id required');
  const n = Math.max(1, Math.min(200, Number.parseInt(limit, 10) || 20));

  const { data, error } = await runQuery(
    client.from(RUNS_TABLE)
      .select('id, tenant_id, user_id, status, steps_completed, steps_total, priority, trigger_kind, source_surface, estimated_cost_usd_micro, actual_cost_usd_micro, created_at, started_at, completed_at')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(n),
  );
  if (error) throw new Error(`listRuns: query failed: ${error.message || String(error)}`);
  return Array.isArray(data) ? data : [];
}

// ─── getRun ────────────────────────────────────────────────────────────────

// Fetch a single run by id, with a tenant guard. Returns null if absent OR
// belongs to another tenant (404-equivalent — handler maps to the right HTTP).
async function getRun({ client, tenant_id, run_id } = {}) {
  assertClient(client, 'getRun');
  if (!tenant_id) throw new Error('getRun: tenant_id required');
  if (!run_id) throw new Error('getRun: run_id required');

  const { data, error } = await runQuery(
    client.from(RUNS_TABLE)
      .select('*')
      .eq('id', run_id)
      .maybeSingle(),
  );
  if (error) throw new Error(`getRun: query failed: ${error.message || String(error)}`);
  if (!data) return null;
  if (data.tenant_id !== tenant_id) return null;
  return data;
}

// ─── cancelRun ─────────────────────────────────────────────────────────────

// Transitions a non-terminal run into 'cancelled'. Idempotent — terminal
// runs are left alone and the caller gets the current state.
async function cancelRun({ client, tenant_id, user_id, run_id } = {}) {
  assertClient(client, 'cancelRun');
  if (!tenant_id) throw new Error('cancelRun: tenant_id required');
  if (!run_id) throw new Error('cancelRun: run_id required');

  const current = await getRun({ client, tenant_id, run_id });
  if (!current) return null;
  if (TERMINAL_STATES.has(current.status)) {
    return { run_id, status: current.status, was_terminal: true };
  }

  const patch = {
    status: 'cancelled',
    completed_at: new Date().toISOString(),
    error_message: 'cancelled_by_user',
  };
  await runQuery(client.from(RUNS_TABLE).update(patch).eq('id', run_id));

  await tryEmitAudit(client, {
    tenant_id,
    source_domain: 'cli',
    action: 'run.cancelled',
    actor_id: user_id || 'unknown',
    actor_role: 'cli',
    payload: { run_id, correlation_id: current.correlation_id || null },
  });

  return { run_id, status: 'cancelled', was_terminal: false };
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Primary surface.
  submitRun,
  streamRunEvents,
  listRuns,
  getRun,
  cancelRun,
  // Internal helpers exposed for tests.
  runStubExecutor,
  // Constants.
  RUNS_TABLE,
  RUN_STATES,
  TERMINAL_STATES,
  STUB_STEP_DELAY_MS,
  POLL_INTERVAL_MS,
  HEARTBEAT_MS,
  MAX_STREAM_MS,
};
