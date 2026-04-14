const test = require('node:test');
const assert = require('node:assert/strict');

const { resolvePreviewTarget } = require('../../onboarding/backend/research/section-target-resolver.cjs');

test('94-02 filter-aware resolution targets the correct MIR audience section', () => {
  const target = resolvePreviewTarget({
    artifact_family: 'MIR',
    filters: { audience: ['enterprise_revops'] },
    evidence: [{ implication: 'Tighten audience positioning' }],
  });

  assert.equal(target.section_key, 'audience');
  assert.ok(target.destination_path.includes('Strategy/audience.md'));
});

test('94-02 strategic channel intent resolves to the MSP channel strategy target', () => {
  const target = resolvePreviewTarget({
    artifact_family: 'MSP',
    filters: { strategic_intent: ['channel_expansion'] },
    evidence: [{ implication: 'Refresh channel plan' }],
  });

  assert.equal(target.section_key, 'channel_strategy');
  assert.ok(target.destination_path.includes('Execution/channel-system.md'));
});
