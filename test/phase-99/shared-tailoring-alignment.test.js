const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createTailoringAlignmentEnvelope,
  assertTailoringAlignmentEnvelope,
} = require('../../onboarding/backend/research/tailoring-alignment-contract.cjs');
const {
  buildTailoredFixture,
  buildMissingContractFixture,
} = require('./fixtures/generic-vs-tailored-fixtures.cjs');

test('99-01 shared tailoring alignment envelope preserves the governed Phase 98 reasoning contract', () => {
  const envelope = createTailoringAlignmentEnvelope(buildTailoredFixture());

  assert.equal(envelope.contract_type, 'tailoring_alignment_envelope');
  assert.equal(envelope.authority_token, 'MARKOS-REF-NEU-01');
  assert.equal(envelope.confidence_flag, 'high');
  assert.equal(envelope.reasoning.winner.overlay_key, 'revenue-operators');
  assert.equal(envelope.reasoning.winner.primary_trigger, 'B04');
  assert.match(envelope.reasoning.winner.why_it_fits_summary, /operator/i);
  assert.equal(envelope.review.status, 'passed');
  assert.equal(envelope.surface_portability.semantics_locked, true);
  assert.deepEqual(envelope.surface_portability.supported_surfaces, ['api', 'mcp', 'cli', 'editor', 'internal_automation']);

  assert.doesNotThrow(() => assertTailoringAlignmentEnvelope(envelope));
});

test('99-01 alignment envelope fails fast if the winner or ICP fit signals are missing', () => {
  assert.throws(
    () => createTailoringAlignmentEnvelope(buildMissingContractFixture()),
    /overlay_key|pain_point_tags|primary_trigger/i,
  );
});
