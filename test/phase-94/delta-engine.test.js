const test = require('node:test');
const assert = require('node:assert/strict');

const { generatePatchPreview } = require('../../onboarding/backend/research/mir-msp-delta-engine.cjs');

test('94-02 delta engine emits a narrow before-and-after section preview', () => {
  const preview = generatePatchPreview({
    artifact_family: 'MIR',
    section_key: 'audience',
    context_pack: {
      evidence: [{ id: 'ev-1', citation: 'MIR / Canonical', implication: 'Refine audience language', excerpt: 'operators want proof' }],
      contradictions: [],
    },
    current_content: 'Old audience copy',
    proposed_content: 'New audience copy',
  });

  assert.equal(preview.diff.mode, 'section_replace');
  assert.equal(preview.diff.before_excerpt, 'Old audience copy');
  assert.equal(preview.diff.after_excerpt, 'New audience copy');
  assert.ok(preview.diff.change_rationale.length > 0);
});
