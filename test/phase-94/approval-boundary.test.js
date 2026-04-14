const test = require('node:test');
const assert = require('node:assert/strict');

const { assertPreviewOnlyOperation } = require('../../onboarding/backend/research/preview-safety-gate.cjs');
const { buildMirMspPreviewBundle } = require('../../onboarding/backend/research/mir-msp-preview-entrypoint.cjs');

test('94-01 preview safety gate blocks write intent outright', () => {
  assert.throws(
    () => assertPreviewOnlyOperation({ allow_write: true }),
    (error) => error?.code === 'E_PREVIEW_WRITE_BLOCKED'
  );
});

test('94-03 preview entrypoint remains non-mutating and write-disabled', async () => {
  let writerCalled = false;
  const preview = await buildMirMspPreviewBundle({
    researchPack: { context_pack: { evidence: [], contradictions: [] }, route_trace: [], provider_attempts: [] },
    targetIntent: { artifact_family: 'MIR', section_key: 'audience' },
    currentContent: 'Existing content',
    writer: () => {
      writerCalled = true;
    },
  });

  assert.equal(preview.preview.write_disabled, true);
  assert.equal(writerCalled, false);
});
