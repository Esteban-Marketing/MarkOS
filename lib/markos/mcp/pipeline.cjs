'use strict';

// Phase 202 Plan 04 — MCP tool-call middleware pipeline.
// Implements the 10-step chain from 202-RESEARCH §"Pattern 1: Middleware Pipeline per Tool Call":
//   auth → rate_limit → tool_lookup → validate_input → free_tier →
//   approval → cost → invoke → validate_output → trueup
// A `finally` block ALWAYS emits a structured log line (D-30) + an audit row (D-29 req_id threaded).
//
// This is the SOLE entrypoint for tool invocation — Plans 202-06 / 202-07 plug into `toolRegistry`
// and inherit the full middleware chain for free. There is no bypass path to the handler.

const { randomUUID } = require('node:crypto');
const { lookupSession, touchSession } = require('./sessions.cjs');
const { checkRateLimit, buildRateLimitedJsonRpcError } = require('./rate-limit.cjs');
const { getToolValidator } = require('./ajv.cjs');
const { checkInjectionDenylist } = require('./injection-denylist.cjs');
const { issueApprovalToken, checkApprovalToken } = require('./approval.cjs');
const { checkAndChargeBudget, trueupBudget, buildBudgetExhaustedJsonRpcError } = require('./cost-meter.cjs');
const { estimateToolCost, computeToolCost } = require('./cost-table.cjs');
const { enqueueAuditStaging } = require('../audit/writer.cjs');
const { emitLogLine } = require('./log-drain.cjs');
const { captureToolError } = require('./sentry.cjs');

const STEP_NAMES = Object.freeze([
  'auth', 'rate_limit', 'tool_lookup', 'validate_input', 'free_tier',
  'approval', 'cost', 'invoke', 'validate_output', 'trueup',
]);

// D-20 per-tier compute budgets — timeout firing returns tool_timeout (-32000 + 504).
const TIMEOUT_MS = Object.freeze({ simple: 30_000, llm: 120_000, long: 300_000 });

function withTimeout(tier, promise, tool_id) {
  const ms = TIMEOUT_MS[tier] || TIMEOUT_MS.simple;
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(Object.assign(new Error('tool_timeout'), { code: 'tool_timeout', tool_id, tier })),
      ms,
    );
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

function jsonRpcError(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id: id === undefined ? null : id,
    error: { code, message, data },
  };
}

// Plan 202-05 wires the log-drain + Sentry helpers directly into the finally block;
// emitLogLine (D-30 shape) replaces the prior inline console.log, and captureToolError
// (D-32) fires on server-error statuses in the catch branch (still before finally runs).

function auditActionForStatus(status) {
  if (status === 'ok') return 'tool.invoked';
  if (status === 'approval_pending') return 'tool.approval_issued';
  return `tool.${status}`;
}

async function runToolCall(deps) {
  const { supabase, redis, bearer_token, tool_name, args, id, _meta, toolRegistry } = deps || {};
  const req_id = `mcp-req-${randomUUID()}`;
  const started_at = Date.now();

  let session = null;
  let tool = null;
  let status = 'ok';
  let error_code = null;
  let cost_cents = 0;

  try {
    // Step 1 — auth
    session = await lookupSession(supabase, bearer_token);
    if (!session) {
      status = 'unauthorized';
      error_code = 'invalid_token';
      return {
        ok: false,
        jsonRpcError: jsonRpcError(id, -32600, 'invalid_token', { req_id }),
        httpStatus: 401,
        req_id,
      };
    }
    // Rolling TTL extension — non-blocking (best effort).
    touchSession(supabase, session.id).catch(() => {});

    // Step 2 — rate-limit
    const rl = await checkRateLimit(redis, session);
    if (!rl.ok) {
      status = 'rate_limited';
      error_code = rl.reason;
      return {
        ok: false,
        jsonRpcError: buildRateLimitedJsonRpcError(id, req_id, {
          scope: rl.scope,
          retry_after: rl.retry_after,
          limit: rl.limit,
        }),
        httpStatus: 429,
        headers: { 'Retry-After': String(rl.retry_after) },
        req_id,
      };
    }

    // Step 3 — tool lookup
    tool = toolRegistry && toolRegistry[tool_name];
    if (!tool) {
      status = 'unknown_tool';
      error_code = 'tool_not_found';
      return {
        ok: false,
        jsonRpcError: jsonRpcError(id, -32601, 'tool_not_found', { tool_id: tool_name, req_id }),
        httpStatus: 404,
        req_id,
      };
    }

    // Step 4a — input validation (AJV strict)
    const validator = getToolValidator(tool_name);
    if (!validator.validateInput(args)) {
      status = 'invalid_input';
      error_code = 'invalid_tool_input';
      return {
        ok: false,
        jsonRpcError: jsonRpcError(id, -32602, 'invalid_tool_input', {
          errors: validator.validateInput.errors,
          req_id,
        }),
        httpStatus: 400,
        req_id,
      };
    }

    // Step 4b — prompt-injection deny-list (NFKC-normalized)
    const bad = checkInjectionDenylist(args);
    if (bad) {
      status = 'injection_blocked';
      error_code = 'injection_detected';
      return {
        ok: false,
        jsonRpcError: jsonRpcError(id, -32602, 'injection_detected', {
          key: bad.key,
          pattern: bad.pattern,
          req_id,
        }),
        httpStatus: 400,
        req_id,
      };
    }

    // Step 5 — free-tier write gate (D-21)
    if (tool.mutating && session.plan_tier === 'free') {
      status = 'paid_tier_required';
      error_code = 'paid_tier_required';
      return {
        ok: false,
        jsonRpcError: jsonRpcError(id, -32001, 'paid_tier_required', { req_id }),
        httpStatus: 402,
        req_id,
      };
    }

    // Step 6 — approval-token round-trip (D-03 + D-16)
    if (tool.mutating) {
      if (!args.approval_token) {
        const approval_token = await issueApprovalToken(redis, session, tool_name, args);
        const preview = typeof tool.preview === 'function' ? tool.preview(args) : { tool: tool_name, args };
        status = 'approval_pending';
        error_code = null;
        // Successful response carrying preview+token — NOT a JSON-RPC error.
        return { ok: true, req_id, result: { preview, approval_token }, cost_cents: 0 };
      }
      const approved = await checkApprovalToken(redis, args.approval_token, session, tool_name);
      if (!approved) {
        status = 'approval_invalid';
        error_code = 'approval_required';
        return {
          ok: false,
          jsonRpcError: jsonRpcError(id, -32602, 'approval_required', { req_id }),
          httpStatus: 400,
          req_id,
        };
      }
    }

    // Step 7 — cost admission gate (atomic RPC; fail-closed on error via cost-meter rethrow)
    const estimated = estimateToolCost(tool_name);
    const budget = await checkAndChargeBudget(supabase, {
      tenant_id: session.tenant_id,
      tool_id: tool_name,
      plan_tier: session.plan_tier,
      estimated_cents: estimated,
      actor_id: session.user_id,
      org_id: session.org_id,
      req_id,
    });
    if (!budget.ok) {
      status = 'budget_exhausted';
      error_code = 'budget_exhausted';
      return {
        ok: false,
        jsonRpcError: buildBudgetExhaustedJsonRpcError(id, req_id, {
          reset_at: budget.reset_at,
          spent_cents: budget.spent_cents,
          cap_cents: budget.cap_cents,
        }),
        httpStatus: 402,
        req_id,
      };
    }

    // Step 8 — invoke with compute-budget timeout per latency_tier.
    // Plan 202-08 (D-26): if the client supplies _meta.progressToken AND the tool is LLM-backed,
    // provide an emitProgress(...) callback to the handler and accumulate events in _progressEvents.
    // session.js will replay these as notifications/progress SSE frames before the final result.
    // Non-LLM tools ignore progressToken — emitProgress is null and no _progressEvents is attached.
    const _progressEvents = [];
    const progressToken = _meta && _meta.progressToken;
    const emitProgress = progressToken !== undefined && progressToken !== null && tool.latency_tier === 'llm'
      ? ({ progress, total, message }) => {
          _progressEvents.push({
            progressToken,
            progress,
            total,
            message,
            ts: new Date().toISOString(),
          });
        }
      : null;

    const invocation = await withTimeout(
      tool.latency_tier,
      Promise.resolve(tool.handler({ args, session, req_id, redis, supabase, _meta, emitProgress })),
      tool_name,
    );
    if (emitProgress && _progressEvents.length > 0 && invocation && typeof invocation === 'object') {
      invocation._progressEvents = _progressEvents;
    }

    // Step 9 — output validation (D-13; violation returns GENERIC internal_error to client, details to audit/Sentry)
    if (!validator.validateOutput(invocation)) {
      status = 'output_schema_violation';
      error_code = 'output_schema_violation';
      return {
        ok: false,
        jsonRpcError: jsonRpcError(id, -32000, 'internal_error', { req_id }),
        httpStatus: 500,
        req_id,
      };
    }

    // Step 10 — trueup: delta between actual and estimated (no-op if <= 0).
    const actual = computeToolCost(tool_name, invocation._usage || {});
    cost_cents = actual;
    const delta = actual - estimated;
    if (delta > 0) {
      await trueupBudget(supabase, {
        tenant_id: session.tenant_id,
        tool_id: tool_name,
        delta_cents: delta,
      });
    }

    return { ok: true, req_id, result: invocation, cost_cents };
  } catch (err) {
    if (!error_code) error_code = err && err.code ? err.code : 'internal_error';
    if (status === 'ok') status = err && err.code === 'tool_timeout' ? 'timeout' : 'error';
    const isTimeout = err && err.code === 'tool_timeout';
    // D-32: send server-side failures to Sentry with req_id correlation.
    // captureToolError is a no-op when SENTRY_DSN is unset (graceful degrade).
    try {
      captureToolError(err, {
        req_id,
        session_id: session && session.id,
        tenant_id: session && session.tenant_id,
        tool_id: tool_name,
      });
    } catch { /* Sentry failures must never re-throw into the pipeline */ }
    return {
      ok: false,
      jsonRpcError: jsonRpcError(
        id,
        -32000,
        isTimeout ? 'tool_timeout' : 'internal_error',
        { req_id, tool_id: tool_name, tier: err && err.tier },
      ),
      httpStatus: isTimeout ? 504 : 500,
      req_id,
    };
  } finally {
    const duration_ms = Date.now() - started_at;
    emitLogLine({
      req_id,
      session_id: session && session.id,
      tenant_id: session && session.tenant_id,
      tool_id: tool_name,
      duration_ms,
      status,
      cost_cents,
      error_code,
    });
    // D-32: also fire Sentry for non-throwing server-error statuses that short-circuit with return
    // (e.g. output_schema_violation returns without triggering the catch path). The catch path already
    // fires Sentry directly — this branch covers the synthetic-error return paths.
    if (status === 'output_schema_violation') {
      try {
        captureToolError(Object.assign(new Error('output_schema_violation'), { code: 'output_schema_violation' }), {
          req_id,
          session_id: session && session.id,
          tenant_id: session && session.tenant_id,
          tool_id: tool_name,
        });
      } catch { /* never let Sentry block the response */ }
    }
    if (session) {
      // Always-fires audit. Best-effort: catch swallow so audit failures never leak to caller.
      enqueueAuditStaging(supabase, {
        tenant_id: session.tenant_id,
        org_id: session.org_id,
        source_domain: 'mcp',
        action: auditActionForStatus(status),
        actor_id: session.user_id,
        actor_role: 'mcp-client',
        payload: { req_id, tool_id: tool_name, duration_ms, cost_cents, error_code },
      }).catch(() => {});
    }
  }
}

module.exports = { STEP_NAMES, TIMEOUT_MS, runToolCall };
