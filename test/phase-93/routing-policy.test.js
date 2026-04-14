const test = require('node:test');
const assert = require('node:assert/strict');

const { buildAdaptiveResearchRoute } = require('../../onboarding/backend/research/adaptive-research-policy.cjs');

test('93-01 routing stays internal-first and stops when evidence is sufficient', () => {
  const route = buildAdaptiveResearchRoute({
    query: 'summarize current operator messaging',
    research_type: 'company',
    business_value: 'normal',
  }, {
    internalEvidenceCount: 3,
    evidenceSufficient: true,
  });

  assert.deepEqual(route.stage_plan.map((entry) => entry.stage), [
    'internal_approved',
    'markos_mcp',
    'tavily',
    'firecrawl',
    'openai_research',
  ]);
  assert.equal(route.stage_plan[0].status, 'used');
  assert.equal(route.stage_plan[1].status, 'skipped');
  assert.equal(route.stage_plan[2].status, 'skipped');
  assert.equal(route.stage_plan[4].status, 'skipped');
  assert.equal(route.should_use_deep_research, false);
  assert.equal(route.selected_path, 'internal_only');
});

test('93-01 unresolved high-value requests can earn the deep path', () => {
  const route = buildAdaptiveResearchRoute({
    query: 'compare our positioning against fast-moving AI competitors and recommend changes',
    research_type: 'competitive_analysis',
    business_value: 'high',
    requires_freshness: true,
    target_urls: ['https://example.com/pricing'],
  }, {
    internalEvidenceCount: 1,
    evidenceSufficient: false,
  });

  assert.equal(route.stage_plan[0].status, 'used');
  assert.equal(route.stage_plan[2].status, 'used');
  assert.equal(route.stage_plan[3].status, 'used');
  assert.equal(route.stage_plan[4].status, 'used');
  assert.equal(route.should_use_deep_research, true);
  assert.equal(route.selected_path, 'deep_research');
});
