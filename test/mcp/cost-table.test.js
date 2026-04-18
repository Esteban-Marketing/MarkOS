'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MODEL_RATES, COST_TABLE,
  FREE_TIER_CAP_CENTS, PAID_TIER_CAP_CENTS,
  computeToolCost, estimateToolCost, capCentsForPlanTier,
} = require('../../lib/markos/mcp/cost-table.cjs');

test('Suite 202-03: COST_TABLE contains exactly 30 tool entries (MCP-01)', () => {
  const keys = Object.keys(COST_TABLE);
  assert.equal(keys.length, 30, `expected 30 tool entries, got ${keys.length}`);
});

test('Suite 202-03: COST_TABLE covers all wave-0 stub tools (D-02)', () => {
  for (const id of ['plan_campaign','research_audience','generate_brief','audit_claim','list_pain_points','rank_execution_queue','schedule_post','explain_literacy']) {
    assert.ok(COST_TABLE[id], `missing: ${id}`);
  }
});

test('Suite 202-03: MODEL_RATES declares 3 Anthropic models (Sonnet/Opus/Haiku)', () => {
  assert.ok(MODEL_RATES['claude-sonnet-4-6-20260301']);
  assert.ok(MODEL_RATES['claude-haiku-4-5-20260301']);
  assert.ok(MODEL_RATES['claude-opus-4-7-20260301']);
});

test('Suite 202-03: Sonnet 4.6 rates are 0.30¢ input / 1.50¢ output per 1k tokens ($3/$15 per M)', () => {
  const r = MODEL_RATES['claude-sonnet-4-6-20260301'];
  assert.equal(r.input_per_1k, 0.30);
  assert.equal(r.output_per_1k, 1.50);
});

test('Suite 202-03: Haiku 4.5 rates are 0.10¢ input / 0.50¢ output per 1k tokens ($1/$5 per M)', () => {
  const r = MODEL_RATES['claude-haiku-4-5-20260301'];
  assert.equal(r.input_per_1k, 0.10);
  assert.equal(r.output_per_1k, 0.50);
});

test('Suite 202-03: FREE_TIER_CAP_CENTS is 100 ($1/day per D-21)', () => {
  assert.equal(FREE_TIER_CAP_CENTS, 100);
});

test('Suite 202-03: PAID_TIER_CAP_CENTS is 10000 ($100/day safety net)', () => {
  assert.equal(PAID_TIER_CAP_CENTS, 10000);
});

test('Suite 202-03: capCentsForPlanTier returns 100 for free / 10000 for any other string', () => {
  assert.equal(capCentsForPlanTier('free'), 100);
  assert.equal(capCentsForPlanTier('team'), 10000);
  assert.equal(capCentsForPlanTier('enterprise'), 10000);
});

test('Suite 202-03: computeToolCost returns base_cents only for non-LLM tools', () => {
  assert.equal(computeToolCost('list_pain_points', {}), 0);
  assert.equal(computeToolCost('schedule_post', {}), 2);
  assert.equal(computeToolCost('research_audience', {}), 1);
});

test('Suite 202-03: computeToolCost adds LLM input/output per-1k math and ceils to integer cents', () => {
  // draft_message @ Sonnet: base 1 + ceil(0.30 * 800/1000 + 1.50 * 600/1000) = 1 + ceil(0.24 + 0.90) = 1 + 2 = 3
  assert.equal(computeToolCost('draft_message', { input_tokens: 800, output_tokens: 600 }), 3);
});

test('Suite 202-03: computeToolCost outputs only integer cents (no floats)', () => {
  const c = computeToolCost('plan_campaign', { input_tokens: 1234, output_tokens: 5678 });
  assert.equal(Number.isInteger(c), true);
});

test('Suite 202-03: estimateToolCost uses avg_tokens for LLM tools', () => {
  // plan_campaign Sonnet avg in=1200 out=1400: base 1 + ceil(0.30*1.2 + 1.50*1.4) = 1 + ceil(0.36+2.10) = 1 + 3 = 4
  assert.equal(estimateToolCost('plan_campaign'), 4);
});

test('Suite 202-03: estimateToolCost returns base_cents for non-LLM tools', () => {
  assert.equal(estimateToolCost('list_pain_points'), 0);
  assert.equal(estimateToolCost('schedule_post'), 2);
});

test('Suite 202-03: computeToolCost throws no_cost for unknown tool_id', () => {
  assert.throws(() => computeToolCost('totally_unknown', {}), /no_cost:totally_unknown/);
});

test('Suite 202-03: Opus 4.7 rates carry TODO re-verify marker in source', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'markos', 'mcp', 'cost-table.cjs'), 'utf8');
  assert.match(src, /opus-4-7[\s\S]*?TODO: re-verify|TODO: re-verify[\s\S]*?opus/);
});

test('Suite 202-03: COST_TABLE + MODEL_RATES are frozen (immutable at runtime)', () => {
  assert.throws(() => { COST_TABLE.new_tool = {}; });
  assert.throws(() => { MODEL_RATES.new_model = {}; });
});

test('Suite 202-03: every LLM-backed entry references a known MODEL_RATES key', () => {
  for (const [tool_id, t] of Object.entries(COST_TABLE)) {
    if (t.model) assert.ok(MODEL_RATES[t.model], `${tool_id} references unknown model ${t.model}`);
  }
});
