const test = require('node:test');
const assert = require('node:assert/strict');

const { createTailoringAlignmentEnvelope } = require('../../onboarding/backend/research/tailoring-alignment-contract.cjs');
const { evaluateTailoringReviewGate } = require('../../onboarding/backend/research/tailoring-review-gates.cjs');
const {
  buildGenericOutputFixture,
  buildTailoredFixture,
  buildMissingContractFixture,
} = require('./fixtures/generic-vs-tailored-fixtures.cjs');

test('99-01 generic or template-sounding output is blocked with rewrite_required and exact fixes', () => {
  const genericFixture = buildGenericOutputFixture();
  const envelope = createTailoringAlignmentEnvelope(genericFixture);
  const result = evaluateTailoringReviewGate({ envelope, draft: genericFixture.draft });

  assert.equal(result.status, 'rewrite_required');
  assert.ok(result.blocking_reasons.some((reason) => reason.code === 'GENERIC_OUTPUT_BLOCKED'));
  assert.ok(result.blocking_reasons.some((reason) => reason.code === 'NATURALITY_COLLAPSE'));
  assert.ok(result.required_fixes.some((fix) => /ICP pain/i.test(fix)));
});

test('99-01 missing Phase 98 reasoning or ICP fit signals are treated as a blocking contract failure', () => {
  const result = evaluateTailoringReviewGate({
    envelope: {
      review: { status: 'passed', blocking_reasons: [], required_fixes: [] },
    },
    draft: buildGenericOutputFixture().draft,
    contextPack: buildMissingContractFixture().contextPack,
  });

  assert.equal(result.status, 'rewrite_required');
  assert.ok(result.blocking_reasons.some((reason) => reason.code === 'REASONING_CONTRACT_MISSING'));
  assert.ok(result.blocking_reasons.some((reason) => reason.code === 'ICP_FIT_MISSING'));
});

test('99-01 specific, governed, audience-matched output passes the rewrite gate', () => {
  const tailoredFixture = buildTailoredFixture();
  const envelope = createTailoringAlignmentEnvelope(tailoredFixture);
  const result = evaluateTailoringReviewGate({ envelope, draft: tailoredFixture.draft });

  assert.equal(result.status, 'passed');
  assert.deepEqual(result.blocking_reasons, []);
});
