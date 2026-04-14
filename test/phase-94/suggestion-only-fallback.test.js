const test = require('node:test');
const assert = require('node:assert/strict');

const { classifyPreviewSafety } = require('../../onboarding/backend/research/preview-safety-gate.cjs');
const { generatePatchPreview } = require('../../onboarding/backend/research/mir-msp-delta-engine.cjs');

test('94-01 weak or contradictory evidence downgrades to suggestion-only', () => {
  const safety = classifyPreviewSafety({
    confidence: 0.31,
    evidenceCount: 1,
    contradictions: [{ topic: 'positioning' }],
  });

  assert.equal(safety.status, 'suggestion_only');
  assert.equal(safety.suggestion_only, true);
});

test('94-02 delta engine returns suggestion-only when certainty is not earned', () => {
  const preview = generatePatchPreview({
    artifact_family: 'MIR',
    context_pack: {
      evidence: [{ citation: 'https://example.com', implication: 'Possible positioning change' }],
      contradictions: [{ topic: 'positioning' }],
    },
    current_content: 'Existing positioning text',
  });

  assert.equal(preview.suggestion_only, true);
  assert.ok(preview.warnings.length > 0);
});
