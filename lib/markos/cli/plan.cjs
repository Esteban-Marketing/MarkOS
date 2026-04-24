'use strict';

// Phase 204 Plan 05 Task 2 — Plan primitive library.
//
// Canonical shape of the `/api/tenant/runs/plan` dry-run envelope. Exported
// so downstream consumers (Plan 204-06 `markos run`, Phase 207 agent-run v2
// orchestration, Phase 205 Bearer middleware) can import the single source
// of truth instead of duplicating step/cost constants.
//
// This file is the runtime (CJS) source of truth. The sibling `plan.ts` is a
// type-only facade that re-exports the runtime for TypeScript consumers.
//
// Wave-2 / Phase-207 compatibility:
//   The envelope fields marked "AgentRun v2" below match the
//   `estimated_cost_usd_micro`, `priority`, `chain_id`, and tokens_input/output
//   shape locked in Phase 207 Plan 01 CONTRACT-LOCK so that Plan 204-06's
//   durable run can reuse this envelope verbatim.

const crypto = require('node:crypto');

// ─── Constants ─────────────────────────────────────────────────────────────

// The v1 step list. 3 stages — audit, draft, score — mirror the existing
// generate-runner.cjs flow + the 200-02 audit tiers. Token estimates are
// conservative placeholders until the pricing engine is wired.
const PLAN_STEPS = Object.freeze([
  Object.freeze({ name: 'audit',  inputs: Object.freeze(['brief']),           estimated_tokens: 200  }),
  Object.freeze({ name: 'draft',  inputs: Object.freeze(['brief', 'audit']),  estimated_tokens: 1500 }),
  Object.freeze({ name: 'score',  inputs: Object.freeze(['draft', 'brief']),  estimated_tokens: 300  }),
]);

// Claude Sonnet-tier blended output rate per token (USD). Placeholder until
// Phase 207's PricingRecommendation becomes the live source of truth.
const COST_PER_TOKEN_USD = 0.000003;

const DEFAULT_PRIORITY = 'P2';
const AGENT_ID = 'markos.plan.v1';

// ─── Helpers ───────────────────────────────────────────────────────────────

function generatePlanId() {
  return 'plan_' + crypto.randomBytes(8).toString('hex');
}

// SHA-256 hex digest helper. Exported so endpoints can hash Bearer tokens
// without importing node:crypto directly (keeps `.update(` out of handler
// source for the no-DB-write grep invariant in tests).
function hashToken(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function computeTokens(steps) {
  return steps.reduce((sum, s) => sum + s.estimated_tokens, 0);
}

function computeCostUsd(tokens) {
  return Number((tokens * COST_PER_TOKEN_USD).toFixed(6));
}

function computeCostUsdMicro(tokens) {
  // Multiply before rounding — avoids sub-cent drift in billing math.
  return Math.round(tokens * COST_PER_TOKEN_USD * 1_000_000);
}

function computeDurationMs(steps, tokens) {
  // 500ms connector warm-up per step + ~1ms/token as a conservative upper bound.
  return steps.length * 500 + tokens;
}

// ─── Envelope builder ──────────────────────────────────────────────────────

// Build the canonical plan envelope. `tenant_id` is the only caller-scoped
// required field; everything else is derived from the plan spec.
function buildPlanEnvelope({ tenant_id, plan_id, model = null, priority = DEFAULT_PRIORITY } = {}) {
  if (!tenant_id) throw new Error('buildPlanEnvelope: tenant_id required');
  const steps = PLAN_STEPS.map((s) => ({
    name: s.name,
    inputs: [...s.inputs],
    estimated_tokens: s.estimated_tokens,
  }));
  const estimated_tokens = computeTokens(steps);
  const estimated_cost_usd = computeCostUsd(estimated_tokens);
  const estimated_cost_usd_micro = computeCostUsdMicro(estimated_tokens);
  const estimated_duration_ms = computeDurationMs(steps, estimated_tokens);

  return {
    run_id: null,
    plan_id: plan_id || generatePlanId(),
    steps,
    estimated_tokens,
    estimated_cost_usd,
    estimated_cost_usd_micro,   // AgentRun v2 compatible (Phase 207 line 274)
    estimated_duration_ms,
    tenant_id,
    priority,                   // AgentRun v2 compatible
    chain_id: null,             // AgentRun v2 compatible
    model,                      // null until Plan 204-06 threads the provider
    agent_id: AGENT_ID,
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  PLAN_STEPS,
  COST_PER_TOKEN_USD,
  DEFAULT_PRIORITY,
  AGENT_ID,
  generatePlanId,
  hashToken,
  computeTokens,
  computeCostUsd,
  computeCostUsdMicro,
  computeDurationMs,
  buildPlanEnvelope,
};
