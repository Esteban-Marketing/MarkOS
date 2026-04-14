const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildAdaptiveResearchRoute,
} = require('../../onboarding/backend/research/adaptive-research-policy.cjs');
const {
  createResearchOrchestrationResponse,
} = require('../../onboarding/backend/research/research-orchestration-contract.cjs');

test('93-01 staged pipeline emits trace, warnings, and contradiction placeholders', () => {
  const route = buildAdaptiveResearchRoute({
    query: 'refresh our positioning against fast-moving competitors',
    research_type: 'positioning',
    requires_freshness: true,
  }, {
    internalEvidenceCount: 1,
    evidenceSufficient: false,
  });

  const response = createResearchOrchestrationResponse({
    short_summary: 'External freshness checks were required before synthesis.',
    context_pack: {
      summary: 'Portable pack',
      claims: [],
      evidence: [],
      contradictions: [],
      active_filters: { audience: ['revops_leader'] },
    },
    route_trace: route.stage_plan,
    provider_attempts: route.stage_plan.map((entry) => ({ provider: entry.stage, status: entry.status })),
    warnings: ['No write path is available in Phase 93.'],
  });

  assert.equal(response.route_trace.length, 5);
  assert.equal(response.provider_attempts.length, 5);
  assert.equal(response.warnings[0], 'No write path is available in Phase 93.');
  assert.equal(response.context_pack.summary, 'Portable pack');
});
