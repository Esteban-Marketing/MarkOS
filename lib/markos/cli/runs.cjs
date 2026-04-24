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

// Phase 207 CONTRACT-LOCK §4 v2 state enum. 15 states — preserved v1 set +
// 5 net-new (queued, paused, retry_wait, canceled, dlq).
const V2_STATES = Object.freeze([
  'requested', 'accepted', 'context_loaded', 'executing',
  'awaiting_approval', 'approved', 'rejected', 'completed', 'failed', 'archived',
  'queued', 'paused', 'retry_wait', 'canceled', 'dlq',
]);

// Canonical v1 → v2 state map. Used when writing `v2_state` in lockstep with
// the legacy `status` column on insert/update, and when reading rows that
// predate Plan 204-13. Mirrors the back-fill in migration 77.
const STATE_V1_TO_V2_MAP = Object.freeze({
  pending:   'requested',
  running:   'executing',
  success:   'completed',
  failed:    'failed',
  cancelled: 'canceled', // v2 spelling is US "canceled"
});

// Pricing-Engine placeholder sentinel. Until Phase 205 lands an approved
// PricingRecommendation, run rows carry this token in pricing_engine_context
// so downstream surfaces (status + billing) know the cost is not yet sealed.
// Policy source: `obsidian/brain/Pricing Engine Canon.md` + D-204-06 + D-207-05.
const PRICING_PLACEHOLDER_SENTINEL = '{{MARKOS_PRICING_ENGINE_PENDING}}';

// Canonical AgentRun v2 agent_registry_version for this phase. Matches the
// value in CONTRACT-LOCK §4 (`2026-04-23-r1`). Bumped by Phase 207-06 when
// the adopter adapter takes over.
const AGENT_REGISTRY_VERSION = '2026-04-23-r1';

// v2 trigger_kind + source_surface constants for the CLI surface.
const V2_TRIGGER_KIND = 'cli';
const V2_SOURCE_SURFACE = 'cli:markos run';

// Default v2 approval_policy object — matches CONTRACT-LOCK §4 default.
const DEFAULT_APPROVAL_POLICY = Object.freeze({
  mode: 'always',
  required_roles: [],
});

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

// Deterministic idempotency key derivation. If the caller does not supply
// an idempotency_key, we hash `tenant_id + JSON.stringify(brief)` so repeat
// submissions of the same brief within a tenant are de-dupable downstream
// (Phase 207-03 retry_wait path uses this). Format matches CONTRACT-LOCK §4
// (free-form string). Tests assert determinism.
function deriveIdempotencyKey({ tenant_id, brief }) {
  const canonical = JSON.stringify({ t: tenant_id, b: brief });
  const digest = crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 32);
  return `idem_${digest}`;
}

// Compose the canonical Phase 207 AgentRun v2 payload shape for a CLI-born
// run. This is the SHAPE that `submitRun` writes into `markos_cli_runs` AND
// that the doctor `agentrun_v2_alignment` check asserts on. Keeping the
// builder here means the shape is tested in one place and drift is caught
// by the compliance suite (see test/cli/v2-compliance.test.js).
function buildV2Payload({ tenant_id, user_id, brief, priority, chain_id, parent_run_id, correlation_id, agent_id, idempotency_key, approval_policy, envelope }) {
  const effectivePriority = priority || 'P2';
  const env = envelope || buildPlanEnvelope({ tenant_id, priority: effectivePriority });
  return {
    // v1-compat columns (preserved for the stub executor + legacy status queries).
    tenant_id,
    user_id,
    brief_json: brief,
    status: 'pending',
    steps_completed: 0,
    steps_total: env.steps.length,
    // v2-canonical fields (CONTRACT-LOCK §4).
    trigger_kind: V2_TRIGGER_KIND,
    source_surface: V2_SOURCE_SURFACE,
    priority: env.priority,
    chain_id: chain_id || null,
    parent_run_id: parent_run_id || null,
    correlation_id: correlation_id || newCorrelationId(),
    idempotency_key: idempotency_key || deriveIdempotencyKey({ tenant_id, brief }),
    agent_id: agent_id || env.agent_id,
    agent_registry_version: AGENT_REGISTRY_VERSION,
    approval_policy: approval_policy || { ...DEFAULT_APPROVAL_POLICY },
    provider_policy: {},
    tool_policy: {},
    // v2 cost model (CONTRACT-LOCK §8). Placeholder sentinel carried until the
    // Pricing Engine (Phase 205) produces an approved recommendation.
    estimated_cost_usd_micro: env.estimated_cost_usd_micro,
    actual_cost_usd_micro: 0,
    cost_currency: 'USD',
    tokens_input: 0,
    tokens_output: 0,
    pricing_engine_context: { placeholder: PRICING_PLACEHOLDER_SENTINEL },
    // v2 state — canonical parallel to v1 `status`. 'requested' is the inbound
    // analog of v1 'pending' per STATE_V1_TO_V2_MAP.
    v2_state: 'requested',
    retry_count: 0,
    retry_after: null,
    last_error_code: null,
    task_id: null,
    closed_at: null,
  };
}

// Required v2 payload fields (for the doctor `agentrun_v2_alignment` check +
// the v2 compliance test suite). Each test + doctor check walks this list and
// asserts the column is present on a sample row / a built payload.
const V2_REQUIRED_FIELDS = Object.freeze([
  'tenant_id', 'user_id',
  'trigger_kind', 'source_surface', 'priority', 'chain_id', 'parent_run_id',
  'correlation_id', 'idempotency_key',
  'agent_id', 'agent_registry_version',
  'approval_policy', 'provider_policy', 'tool_policy',
  'estimated_cost_usd_micro', 'actual_cost_usd_micro', 'cost_currency',
  'tokens_input', 'tokens_output', 'pricing_engine_context',
  'v2_state', 'retry_count', 'retry_after', 'last_error_code',
  'task_id', 'closed_at',
]);

// Assertion used by `test/cli/v2-compliance.test.js` and by the doctor's
// `agentrun_v2_alignment` check. Returns { ok, missing[] }. Non-throwing so
// both consumers can decide their own failure mode (doctor = warn/error,
// test = assert.ok).
function assertV2PayloadShape(payload) {
  const missing = [];
  for (const f of V2_REQUIRED_FIELDS) {
    if (!Object.hasOwn(payload || {}, f)) missing.push(f);
  }
  return { ok: missing.length === 0, missing };
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
async function submitRun({ client, tenant_id, user_id, brief, priority, chain_id, parent_run_id, correlation_id, agent_id, idempotency_key, approval_policy } = {}) {
  assertClient(client, 'submitRun');
  if (!tenant_id) throw new Error('submitRun: tenant_id required');
  if (!user_id) throw new Error('submitRun: user_id required');
  if (!brief || typeof brief !== 'object') throw new Error('submitRun: brief required');

  // Build the envelope shape so cost_usd_micro / agent_id / priority are
  // consistent with the dry-run /plan response. source_domain='cli' tag is
  // emitted as audit.
  const envelope = buildPlanEnvelope({ tenant_id, priority: priority || 'P2' });

  // Plan 204-13 Task 2: the CLI surface now writes the canonical v2 payload
  // shape (priority, trigger_kind:'cli', source_surface:'cli:markos run',
  // agent_id, agent_registry_version, idempotency_key, approval_policy,
  // pricing_engine_context, v2_state) via `buildV2Payload`. Doctor's
  // `agentrun_v2_alignment` check consumes V2_REQUIRED_FIELDS from the same
  // source.
  const row = buildV2Payload({
    tenant_id, user_id, brief,
    priority, chain_id, parent_run_id,
    correlation_id, agent_id, idempotency_key, approval_policy,
    envelope,
  });

  // Insert + fetch back the generated id. We insert the full v2 payload; if
  // the running DB is still on migration 75 only (pre-77), Supabase PostgREST
  // will 400 on unknown columns — the defensive fallback below handles that
  // case by retrying with only the v1-shape subset so the CLI keeps working
  // during staged rollout.
  let { data, error } = await runQuery(
    client.from(RUNS_TABLE).insert(row).select('id, status, tenant_id, priority').single(),
  );
  if (error && /column .* does not exist|schema cache|unknown column/i.test(String(error.message || error))) {
    // Fallback path: migration 77 hasn't been applied yet. Strip the v2-only
    // columns and retry. Tracked by the doctor `agentrun_v2_alignment` check
    // which will emit a warning until migration 77 lands in the tenant DB.
    const v1Only = {
      tenant_id: row.tenant_id,
      user_id: row.user_id,
      brief_json: row.brief_json,
      status: row.status,
      steps_completed: row.steps_completed,
      steps_total: row.steps_total,
      trigger_kind: row.trigger_kind,
      source_surface: row.source_surface,
      priority: row.priority,
      chain_id: row.chain_id,
      correlation_id: row.correlation_id,
      agent_id: row.agent_id,
      agent_registry_version: row.agent_registry_version,
      estimated_cost_usd_micro: row.estimated_cost_usd_micro,
      actual_cost_usd_micro: row.actual_cost_usd_micro,
    };
    ({ data, error } = await runQuery(
      client.from(RUNS_TABLE).insert(v1Only).select('id, status, tenant_id, priority').single(),
    ));
  }
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
  // Plan 204-13: v2_state is split out of the main update patch and applied
  // as a separate, best-effort write so pre-migration-77 DBs (where the
  // v2_state column does not exist) don't lose the core status update.
  // Core status update — must succeed for the run row to make progress.
  async function update(patch) {
    try {
      await runQuery(client.from(RUNS_TABLE).update(patch).eq('id', run_id));
    } catch {
      /* advisory */
    }
  }
  // v2-only update — best-effort; silently no-ops if v2_state column is absent.
  async function updateV2State(patch) {
    try {
      await runQuery(client.from(RUNS_TABLE).update(patch).eq('id', run_id));
    } catch {
      /* v2 columns may not exist yet on this DB — non-fatal */
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

  // Plan 204-13 Task 2: the stub executor now writes v2_state in lockstep
  // with the legacy `status` column. If migration 77 hasn't landed, the
  // UPDATE catches the unknown-column error and silently falls back (the
  // `update` helper already swallows errors); the legacy `status` column
  // remains the source of truth during the transition.

  // 1. → running / executing
  await update({
    status: 'running',
    started_at: new Date().toISOString(),
    steps_completed: 0,
  });
  await updateV2State({ v2_state: 'executing' });

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
  const nowIso = new Date().toISOString();
  await update({
    status: 'success',
    steps_completed: 3,
    completed_at: nowIso,
    result_json: { draft: 'stub output for GA v1', tokens_used: 1850 },
  });
  await updateV2State({ v2_state: 'completed', closed_at: nowIso });
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

  // Plan 204-13 Task 4: project v2-aware columns (v2_state, closed_at,
  // task_id) so `markos status` recent_runs can surface them. Fallback
  // to v1-only shape if the DB is pre-migration-77.
  const V2_SELECT = 'id, tenant_id, user_id, status, v2_state, steps_completed, steps_total, priority, trigger_kind, source_surface, estimated_cost_usd_micro, actual_cost_usd_micro, task_id, closed_at, created_at, started_at, completed_at';
  const V1_SELECT = 'id, tenant_id, user_id, status, steps_completed, steps_total, priority, trigger_kind, source_surface, estimated_cost_usd_micro, actual_cost_usd_micro, created_at, started_at, completed_at';

  let { data, error } = await runQuery(
    client.from(RUNS_TABLE)
      .select(V2_SELECT)
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(n),
  );
  if (error && /column .* does not exist|schema cache|unknown column/i.test(String(error.message || error))) {
    ({ data, error } = await runQuery(
      client.from(RUNS_TABLE)
        .select(V1_SELECT)
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false })
        .limit(n),
    ));
  }
  if (error) throw new Error(`listRuns: query failed: ${error.message || String(error)}`);
  const rows = Array.isArray(data) ? data : [];
  // Defensive: if v2_state is missing on any row (pre-migration-77), synthesize
  // it from the v1 status column using STATE_V1_TO_V2_MAP so downstream
  // consumers (status panel, doctor) don't have to carry two code paths.
  return rows.map((r) => ({
    ...r,
    v2_state: r.v2_state || STATE_V1_TO_V2_MAP[r.status] || 'requested',
  }));
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

  const nowIso = new Date().toISOString();
  const patch = {
    status: 'cancelled',
    completed_at: nowIso,
    error_message: 'cancelled_by_user',
  };
  await runQuery(client.from(RUNS_TABLE).update(patch).eq('id', run_id));
  // Plan 204-13: also write v2_state='canceled' + closed_at. Best-effort —
  // silently no-ops if the columns are absent (pre-migration-77 DB).
  try {
    await runQuery(client.from(RUNS_TABLE).update({ v2_state: 'canceled', closed_at: nowIso }).eq('id', run_id));
  } catch { /* advisory */ }

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
  // Plan 204-13: v2 compliance helpers (consumed by tests + doctor's
  // agentrun_v2_alignment check).
  buildV2Payload,
  assertV2PayloadShape,
  deriveIdempotencyKey,
  V2_REQUIRED_FIELDS,
  V2_STATES,
  STATE_V1_TO_V2_MAP,
  PRICING_PLACEHOLDER_SENTINEL,
  AGENT_REGISTRY_VERSION,
  V2_TRIGGER_KIND,
  V2_SOURCE_SURFACE,
  DEFAULT_APPROVAL_POLICY,
  // Constants.
  RUNS_TABLE,
  RUN_STATES,
  TERMINAL_STATES,
  STUB_STEP_DELAY_MS,
  POLL_INTERVAL_MS,
  HEARTBEAT_MS,
  MAX_STREAM_MS,
};
