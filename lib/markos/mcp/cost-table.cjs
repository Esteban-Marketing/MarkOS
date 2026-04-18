'use strict';

// Phase 202 Plan 03: cost-table source of truth.
// Rates from platform.claude.com/docs/en/about-claude/pricing (April 2026 snapshot).
// D-09 + D-10: cents per call = base + per-1k input/output tokens (LLM tools only).
// TODO: Opus 4.7 rates are placeholder — re-verify at plan time (RESEARCH A4).

const MODEL_RATES = Object.freeze({
  // rates in CENTS per 1K tokens
  'claude-sonnet-4-6-20260301':  { input_per_1k: 0.30, output_per_1k: 1.50 }, // $3/$15 per M
  'claude-haiku-4-5-20260301':   { input_per_1k: 0.10, output_per_1k: 0.50 }, // $1/$5 per M
  'claude-opus-4-7-20260301':    { input_per_1k: 1.50, output_per_1k: 7.50 }, // TODO: re-verify at plan time; placeholder per RESEARCH A4
});

const COST_TABLE = Object.freeze({
  // Marketing — LLM-backed (16 entries)
  'draft_message':            { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in:  800, out:  600 } },
  'plan_campaign':            { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 1200, out: 1400 } },
  'audit_claim':              { base_cents: 1, model: 'claude-haiku-4-5-20260301',  avg_tokens: { in:  600, out:  400 } },
  'audit_claim_strict':       { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in:  800, out:  600 } },
  'run_neuro_audit':          { base_cents: 1, model: 'claude-haiku-4-5-20260301',  avg_tokens: { in:  500, out:  200 } },
  'generate_brief':           { base_cents: 1, model: 'claude-haiku-4-5-20260301',  avg_tokens: { in:  300, out:  800 } },
  'remix_draft':              { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 1000, out: 1200 } },
  'rank_draft_variants':      { base_cents: 1, model: 'claude-haiku-4-5-20260301',  avg_tokens: { in: 2000, out:  400 } },
  'brief_to_plan':            { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 1000, out: 1500 } },
  'generate_channel_copy':    { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in:  800, out: 1000 } },
  'expand_claim_evidence':    { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 1500, out:  800 } },
  'clone_persona_voice':      { base_cents: 1, model: 'claude-sonnet-4-6-20260301', avg_tokens: { in: 1500, out: 1000 } },
  'generate_subject_lines':   { base_cents: 1, model: 'claude-haiku-4-5-20260301',  avg_tokens: { in:  500, out:  300 } },
  'optimize_cta':             { base_cents: 1, model: 'claude-haiku-4-5-20260301',  avg_tokens: { in:  500, out:  300 } },
  'generate_preview_text':    { base_cents: 1, model: 'claude-haiku-4-5-20260301',  avg_tokens: { in:  300, out:  200 } },
  'summarize_deal':           { base_cents: 1, model: 'claude-haiku-4-5-20260301',  avg_tokens: { in: 1000, out:  400 } },

  // Non-LLM simple tier (14 entries)
  'research_audience':        { base_cents: 1, model: null },
  'list_pain_points':         { base_cents: 0, model: null },
  'rank_execution_queue':     { base_cents: 1, model: null },
  'schedule_post':            { base_cents: 2, model: null }, // mutating — small penalty
  'explain_literacy':         { base_cents: 0, model: null },
  'query_canon':              { base_cents: 0, model: null },
  'explain_archetype':        { base_cents: 0, model: null },
  'walk_taxonomy':            { base_cents: 0, model: null },
  'list_crm_entities':        { base_cents: 0, model: null },
  'query_crm_timeline':       { base_cents: 0, model: null },
  'snapshot_pipeline':        { base_cents: 0, model: null },
  'read_segment':             { base_cents: 0, model: null },
  'list_members':             { base_cents: 0, model: null },
  'query_audit':              { base_cents: 0, model: null },
});

const FREE_TIER_CAP_CENTS = 100;    // D-21 $1/day
const PAID_TIER_CAP_CENTS = 10000;  // Q3 recommendation — $100/day safety net until Phase 205 Stripe metering

function capCentsForPlanTier(plan_tier) {
  return plan_tier === 'free' ? FREE_TIER_CAP_CENTS : PAID_TIER_CAP_CENTS;
}

function computeToolCost(tool_id, usage = {}) {
  const t = COST_TABLE[tool_id];
  if (!t) throw new Error(`no_cost:${tool_id}`);
  let cents = t.base_cents;
  if (t.model) {
    const r = MODEL_RATES[t.model];
    if (!r) throw new Error(`no_rate:${t.model}`);
    const input_tokens = usage.input_tokens || 0;
    const output_tokens = usage.output_tokens || 0;
    cents += Math.ceil(r.input_per_1k * (input_tokens / 1000) + r.output_per_1k * (output_tokens / 1000));
  }
  return cents;
}

function estimateToolCost(tool_id) {
  const t = COST_TABLE[tool_id];
  if (!t) throw new Error(`no_cost:${tool_id}`);
  if (!t.model) return t.base_cents;
  return computeToolCost(tool_id, { input_tokens: t.avg_tokens.in, output_tokens: t.avg_tokens.out });
}

module.exports = {
  MODEL_RATES,
  COST_TABLE,
  FREE_TIER_CAP_CENTS,
  PAID_TIER_CAP_CENTS,
  computeToolCost,
  estimateToolCost,
  capCentsForPlanTier,
};
