const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createPatchPreview,
  createPatchApprovalBlock,
} = require('../../onboarding/backend/research/patch-preview-policy.cjs');

test('91-02 patch preview contract stays preview-only and human approval required', () => {
  const patch = createPatchPreview({
    artifact: 'MIR',
    section: 'AUDIENCE',
    change_type: 'refresh',
    rationale: 'New evidence suggests a narrower RevOps buyer profile.',
    supporting_evidence: ['vault://mir/acme', 'https://example.com/revops'],
  });

  assert.equal(patch.artifact, 'MIR');
  assert.equal(patch.section, 'AUDIENCE');
  assert.equal(patch.change_type, 'refresh');
  assert.equal(patch.allow_write, false);
  assert.equal(patch.human_approval_required, true);
  assert.deepEqual(patch.supporting_evidence, ['vault://mir/acme', 'https://example.com/revops']);
});

test('91-02 approval block never permits auto-write or approval bypass', () => {
  const approval = createPatchApprovalBlock();

  assert.deepEqual(approval, {
    write_mode: 'preview_only',
    human_approval_required: true,
    allow_write: false,
  });
});
