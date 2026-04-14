const test = require('node:test');
const assert = require('node:assert/strict');

const { createContextPack } = require('../../onboarding/backend/research/context-pack-contract.cjs');
const { createPreviewResearchResponse } = require('../../onboarding/backend/research/deep-research-envelope.cjs');

test('96-03 preview-safe context packs carry additive tailoring signals without widening write boundaries', () => {
  const contextPack = createContextPack({
    summary: 'Tailored approved context',
    claims: [{ claim: 'RevOps buyers need proof and clarity.' }],
    active_filters: { audience: ['revops_leader'] },
    tailoring_signals: {
      company: { proof_posture: 'evidence_first' },
      icp: { objections: ['too_expensive'] },
      neuro_trigger_tags: ['B01'],
    },
  });

  const response = createPreviewResearchResponse({
    request: {
      query: 'tailored paid media guidance',
      research_type: 'company',
      filters: {
        industry: ['saas'],
        company: { name: 'Acme', domain: 'acme.com' },
        audience: ['revops_leader'],
        offer_product: ['analytics_platform'],
      },
    },
    context_pack: contextPack,
  });

  assert.equal(response.approval.allow_write, false);
  assert.equal(response.approval.human_approval_required, true);
  assert.deepEqual(response.context_pack.tailoring_signals.neuro_trigger_tags, ['B01']);
  assert.deepEqual(response.context_pack.active_filters, { audience: ['revops_leader'] });
});
