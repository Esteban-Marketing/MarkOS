const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeDeepResearchEnvelope,
  createPreviewResearchResponse,
} = require('../../onboarding/backend/research/deep-research-envelope.cjs');

test('91-01 deep research envelope normalizes a portable v1 request and enforces safe defaults', () => {
  const envelope = normalizeDeepResearchEnvelope({
    query: 'How should MarkOS tailor messaging for Acme?',
    research_type: 'company',
    filters: {
      industry: ['b2b_saas'],
      company: { name: 'Acme', domain: 'acme.com' },
      audience: ['revops_leader'],
      offer_product: ['pipeline_analytics_platform'],
      extensions: {
        funnel_stage: ['decision'],
      },
    },
    targets: ['msp', 'mir', 'msp'],
    telemetry: { client_surface: 'copilot', request_id: 'req-91' },
  });

  assert.equal(envelope.contract_version, 'markos.deep_research.v1');
  assert.equal(envelope.mode, 'preview');
  assert.deepEqual(envelope.targets, ['mir', 'msp']);
  assert.equal(envelope.provider_policy.allow_write, false);
  assert.equal(envelope.provider_policy.human_approval_required, true);
  assert.equal(envelope.provider_policy.citations_required, true);
  assert.deepEqual(envelope.provider_policy.route, ['markos_vault', 'markos_mcp', 'tavily', 'firecrawl', 'openai_synthesis']);
});

test('91-01 deep research envelope rejects unknown keys and invalid non-preview write posture', () => {
  assert.throws(() => {
    normalizeDeepResearchEnvelope({
      query: 'Tailor messaging',
      research_type: 'company',
      filters: {
        industry: ['b2b_saas'],
        company: { name: 'Acme', domain: 'acme.com' },
        audience: ['revops_leader'],
        offer_product: ['platform'],
      },
      unknown_field: true,
    });
  }, (error) => error && error.code === 'E_DEEP_RESEARCH_ENVELOPE_UNKNOWN_KEY');

  assert.throws(() => {
    normalizeDeepResearchEnvelope({
      mode: 'apply',
      query: 'Tailor messaging',
      research_type: 'company',
      filters: {
        industry: ['b2b_saas'],
        company: { name: 'Acme', domain: 'acme.com' },
        audience: ['revops_leader'],
        offer_product: ['platform'],
      },
      provider_policy: {
        allow_write: true,
      },
    });
  }, (error) => error && error.code === 'E_DEEP_RESEARCH_WRITE_BLOCKED');
});

test('91-01 preview response exposes the operator-visible universal contract fields', () => {
  const response = createPreviewResearchResponse({
    request: normalizeDeepResearchEnvelope({
      query: 'Tailor messaging',
      research_type: 'company',
      filters: {
        industry: ['b2b_saas'],
        company: { name: 'Acme', domain: 'acme.com' },
        audience: ['revops_leader'],
        offer_product: ['platform'],
      },
    }),
    route_trace: [{ stage: 'internal', provider: 'markos_vault', status: 'used' }],
    context_pack: { summary: 'Grounded summary', findings: [] },
    patch_preview: [],
  });

  assert.deepEqual(Object.keys(response), [
    'contract_version',
    'status',
    'research_id',
    'active_filters',
    'route_trace',
    'context_pack',
    'patch_preview',
    'approval',
    'warnings',
  ]);
  assert.equal(response.approval.write_mode, 'preview_only');
  assert.equal(response.approval.human_approval_required, true);
});
