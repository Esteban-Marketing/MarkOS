const test = require('node:test');
const assert = require('node:assert/strict');

const { createPatchPreviewEnvelope } = require('../../onboarding/backend/research/patch-preview-contract.cjs');

test('94-01 preview contract stays review-safe and section-scoped', () => {
  const preview = createPatchPreviewEnvelope({
    artifact_family: 'MIR',
    artifact_type: 'strategy_note',
    section_key: 'audience',
    target: { note_id: 'audience-note', destination_path: 'MarkOS-Vault/Strategy/audience.md' },
    diff: {
      mode: 'section_replace',
      before_excerpt: 'Old audience copy',
      after_excerpt: 'New audience copy',
      change_rationale: 'New evidence supports a narrower ICP.',
    },
    evidence: [{ id: 'ev-1', citation: 'MIR / Canonical', excerpt: 'proof' }],
  });

  assert.equal(preview.approval_required, true);
  assert.equal(preview.write_disabled, true);
  assert.equal(preview.suggestion_only, false);
  assert.equal(preview.diff.mode, 'section_replace');
  assert.notEqual(preview.diff.mode, 'full_document_rewrite');
});
