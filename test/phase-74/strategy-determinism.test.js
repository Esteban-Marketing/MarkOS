const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeBrandInput } = require('../../onboarding/backend/brand-inputs/normalize-brand-input.cjs');
const { synthesizeStrategyArtifact } = require('../../onboarding/backend/brand-strategy/strategy-synthesizer.cjs');

function buildBrandInput() {
  return {
    brand_profile: {
      primary_name: 'Deterministic Labs',
      mission_statement: 'Ship grounded strategy quickly.',
    },
    audience_segments: [
      {
        segment_id: 'seg-enterprise',
        segment_name: 'Enterprise operators',
        pains: [
          { pain: 'Fragmented campaign operations', rationale: 'Teams work in disconnected tools.' },
          { pain: 'Slow approvals', rationale: 'Review cycles are manual and scattered.' },
        ],
        needs: [
          { need: 'Traceable messaging decisions', rationale: 'Compliance requires source lineage.' },
        ],
        expectations: [
          { expectation: 'Governed execution', rationale: 'Operators need controls before launch.' },
        ],
        desired_outcomes: ['Faster launch confidence'],
      },
      {
        segment_id: 'seg-growth',
        segment_name: 'Growth marketers',
        pains: [
          { pain: 'Inconsistent story by channel', rationale: 'Each channel owner rewrites claims.' },
        ],
        needs: [
          { need: 'Reusable strategic pillars', rationale: 'Teams need one source of truth.' },
        ],
        expectations: [
          { expectation: 'Clear voice guardrails', rationale: 'Messaging drift must be obvious.' },
        ],
        desired_outcomes: ['Higher message consistency'],
      },
    ],
  };
}

test('strategy synthesis: repeated runs produce stable ranking and fingerprint', async () => {
  const tenantId = 'tenant-determinism';
  const normalized = normalizeBrandInput(tenantId, buildBrandInput());

  const run1 = synthesizeStrategyArtifact(tenantId, normalized);
  const run2 = synthesizeStrategyArtifact(tenantId, normalized);

  assert.deepEqual(run1.artifact, run2.artifact);
  assert.equal(run1.metadata.deterministic_fingerprint, run2.metadata.deterministic_fingerprint);
  assert.deepEqual(run1.metadata.ranked_evidence_node_ids, run2.metadata.ranked_evidence_node_ids);
});

test('strategy synthesis: required canonical sections always exist', async () => {
  const tenantId = 'tenant-determinism-sections';
  const normalized = normalizeBrandInput(tenantId, buildBrandInput());
  const run = synthesizeStrategyArtifact(tenantId, normalized);

  assert.ok(run.artifact.positioning);
  assert.ok(run.artifact.value_promise);
  assert.ok(Array.isArray(run.artifact.differentiators));
  assert.ok(Array.isArray(run.artifact.messaging_pillars));
  assert.ok(Array.isArray(run.artifact.disallowed_claims));
  assert.ok(Array.isArray(run.artifact.confidence_notes));
  assert.ok(Array.isArray(run.artifact.conflict_annotations));
});
