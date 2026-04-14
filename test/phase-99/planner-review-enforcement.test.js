const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { buildTailoredFixture, buildGenericOutputFixture } = require('./fixtures/generic-vs-tailored-fixtures.cjs');
const { createTailoringAlignmentEnvelope } = require('../../onboarding/backend/research/tailoring-alignment-contract.cjs');
const { evaluateTailoringReviewGate } = require('../../onboarding/backend/research/tailoring-review-gates.cjs');

const repoRoot = path.resolve(__dirname, '../..');

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

test('99-02 planner, checker, and neuro auditor instructions require the shared tailoring contract and blocking rewrite behavior', () => {
  const planner = read('.agent/markos/agents/markos-planner.md');
  const checker = read('.agent/markos/agents/markos-plan-checker.md');
  const auditor = read('.agent/markos/agents/markos-neuro-auditor.md');
  const skill = read('.agent/skills/markos-neuro-auditor/SKILL.md');

  assert.match(planner, /tailoring_alignment_envelope|reasoning\.winner|why_it_fits_summary/i);
  assert.match(planner, /matched ICP|trust posture|naturality/i);
  assert.match(checker, /rewrite_required|GENERIC_OUTPUT_BLOCKED|REASONING_CONTRACT_MISSING/i);
  assert.match(auditor, /MARKOS-REF-NEU-01/i);
  assert.match(auditor, /rewrite_required|required_fixes|generic/i);
  assert.match(skill, /rewrite_required|shared contract|MARKOS-REF-NEU-01/i);
});

test('99-02 the shared review gate returns repo-standard blocker codes for shallow output', () => {
  const envelope = createTailoringAlignmentEnvelope(buildTailoredFixture());
  const result = evaluateTailoringReviewGate({ envelope, draft: buildGenericOutputFixture().draft });

  assert.equal(result.status, 'rewrite_required');
  assert.ok(result.blocking_reasons.some((reason) => reason.code === 'GENERIC_OUTPUT_BLOCKED'));
  assert.ok(result.blocking_reasons.some((reason) => reason.code === 'NATURALITY_COLLAPSE'));
});
