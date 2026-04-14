const test = require('node:test');
const assert = require('node:assert/strict');

const { buildResearchPack } = require('../../onboarding/backend/research/multi-source-research-orchestrator.cjs');

test('93-03 orchestrator returns one portable envelope for downstream clients', async () => {
  const response = await buildResearchPack({
    query: 'refresh our messaging for enterprise revops leaders',
    research_type: 'competitive_analysis',
    business_value: 'high',
    requires_freshness: true,
    claims: { tenantId: 'tenant-alpha-001' },
  }, {
    adapters: {
      internal: {
        async collect() {
          return {
            evidence: [{
              provider: 'internal',
              authority_class: 'approved_internal',
              claim: 'Internal proof',
              citation: 'MIR / Canonical',
              freshness: '2026-04-10T00:00:00.000Z',
              confidence: 0.95,
              implication: 'Ground the message in approved truth.',
              lineage: { source_type: 'internal' },
              topic: 'positioning',
            }],
            attempts: [{ provider: 'internal', stage: 'internal_approved', status: 'used' }],
            warnings: [],
          };
        },
      },
      tavily: {
        async collect() {
          return { evidence: [], attempts: [{ provider: 'tavily', stage: 'tavily', status: 'used' }], warnings: [] };
        },
      },
      firecrawl: {
        async collect() {
          return { evidence: [], attempts: [{ provider: 'firecrawl', stage: 'firecrawl', status: 'skipped' }], warnings: [] };
        },
      },
      openai: {
        async collect() {
          return { evidence: [], attempts: [{ provider: 'openai_research', stage: 'openai_research', status: 'used' }], warnings: [] };
        },
      },
    },
  });

  assert.equal(response.approval.allow_write, false);
  assert.equal(response.approval.human_approval_required, true);
  assert.ok(Array.isArray(response.context_pack.evidence));
  assert.ok(Array.isArray(response.route_trace));
  assert.ok(Array.isArray(response.provider_attempts));
  assert.equal(typeof response.short_summary, 'string');
});
