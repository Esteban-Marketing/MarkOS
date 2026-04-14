const test = require('node:test');
const assert = require('node:assert/strict');

const { generatePatchPreview } = require('../../onboarding/backend/research/mir-msp-delta-engine.cjs');

test('94-01 every changed block carries direct evidence support', () => {
  const preview = generatePatchPreview({
    artifact_family: 'MIR',
    context_pack: {
      evidence: [{ id: 'ev-1', citation: 'MIR / Canonical', implication: 'Clarify the target audience', excerpt: 'operators want proof' }],
      contradictions: [],
    },
    current_content: 'Old copy',
    proposed_content: 'New copy',
  });

  assert.ok(Array.isArray(preview.evidence));
  assert.equal(preview.evidence[0].id, 'ev-1');
  assert.ok(Array.isArray(preview.diff.supporting_evidence));
  assert.equal(preview.diff.supporting_evidence[0], 'ev-1');
});
