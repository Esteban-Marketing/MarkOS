const test = require('node:test');
const assert = require('node:assert/strict');

const { adaptPreviewForSurface } = require('../../onboarding/backend/research/cross-surface-preview-adapter.cjs');
const { createPatchPreviewEnvelope } = require('../../onboarding/backend/research/patch-preview-contract.cjs');

test('94-03 preview semantics stay consistent across all supported surfaces', () => {
  const preview = createPatchPreviewEnvelope({
    artifact_family: 'MIR',
    artifact_type: 'strategy_note',
    section_key: 'audience',
    target: { note_id: 'audience-note', destination_path: 'MarkOS-Vault/Strategy/audience.md' },
    diff: {
      mode: 'section_replace',
      before_excerpt: 'Old',
      after_excerpt: 'New',
      change_rationale: 'Evidence-backed improvement',
    },
    evidence: [{ id: 'ev-1', citation: 'MIR / Canonical', excerpt: 'proof' }],
  });

  const surfaces = ['mcp', 'api', 'cli', 'editor'].map((surface) => adaptPreviewForSurface(preview, surface));
  assert.ok(surfaces.every((entry) => entry.payload.preview_id === preview.preview_id));
  assert.ok(surfaces.every((entry) => entry.payload.write_disabled === true));
  assert.ok(surfaces.every((entry) => entry.payload.approval_required === true));
});
