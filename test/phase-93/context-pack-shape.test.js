const test = require('node:test');
const assert = require('node:assert/strict');

const { createResearchOrchestrationResponse } = require('../../onboarding/backend/research/research-orchestration-contract.cjs');

test('93-01 orchestration contract stays portable and preview-safe', () => {
  const response = createResearchOrchestrationResponse({
    short_summary: 'Internal evidence is sufficient for the current operator-facing message.',
    context_pack: {
      summary: 'Portable structured pack',
      claims: [],
      evidence: [],
      contradictions: [],
      active_filters: { audience: ['operator'] },
    },
    route_trace: [{ stage: 'internal_approved', status: 'used' }],
    provider_attempts: [{ provider: 'internal', status: 'used' }],
  });

  assert.deepEqual(Object.keys(response), [
    'short_summary',
    'context_pack',
    'warnings',
    'route_trace',
    'provider_attempts',
    'approval',
    'degraded',
  ]);
  assert.equal(response.approval.allow_write, false);
  assert.equal(response.approval.human_approval_required, true);
  assert.ok(Array.isArray(response.context_pack.claims));
  assert.ok(Array.isArray(response.context_pack.evidence));
  assert.ok(Array.isArray(response.context_pack.contradictions));
});
