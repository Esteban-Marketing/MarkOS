const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { buildEvaluationReviewBundle } = require('../../onboarding/backend/research/evaluation-review-entrypoint.cjs');
const { createTailoringAlignmentEnvelope } = require('../../onboarding/backend/research/tailoring-alignment-contract.cjs');
const { buildTailoredFixture, buildGenericOutputFixture } = require('./fixtures/generic-vs-tailored-fixtures.cjs');

const repoRoot = path.resolve(__dirname, '../..');

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

test('99-03 generator agents and prompt templates explicitly consume the shared tailoring contract and block silent fallback', () => {
  const contentCreator = read('.agent/markos/agents/markos-content-creator.md');
  const copyDrafter = read('.agent/markos/agents/markos-copy-drafter.md');
  const campaignArchitect = read('.agent/markos/agents/markos-campaign-architect.md');
  const seoPrompt = read('.agent/prompts/seo_content_architect.md');
  const paidPrompt = read('.agent/prompts/paid_media_creator.md');
  const croPrompt = read('.agent/prompts/cro_landing_page_builder.md');

  for (const source of [contentCreator, copyDrafter, campaignArchitect, seoPrompt, paidPrompt, croPrompt]) {
    assert.match(source, /tailoring_alignment_envelope|reasoning\.winner|why_it_fits_summary|confidence_flag/i);
    assert.match(source, /block|rewrite_required|missing winners anchor|do not silently fall back/i);
    assert.match(source, /naturality|plainspoken|specific/i);
  }
});

test('99-03 evaluation review packaging preserves rewrite-required semantics for internal automation as well as user-facing surfaces', () => {
  const alignment = createTailoringAlignmentEnvelope({
    ...buildTailoredFixture(),
    review: buildGenericOutputFixture().review,
  });

  const bundle = buildEvaluationReviewBundle({
    evaluation: {
      run_id: 'phase99-generator-regression',
      decision: 'blocked',
      review: alignment.review,
      tailoring_alignment: alignment,
      governance_diagnostics: [{ code: 'REWRITE_REQUIRED', detail: 'Generic fallback blocked.', machine_readable: true }],
      artifact_flags: [],
    },
  });

  assert.equal(bundle.review_package.governance.decision, 'blocked');
  assert.equal(bundle.surfaces.api.payload.review.status, 'rewrite_required');
  assert.equal(bundle.surfaces.internal_automation.payload.review.status, 'rewrite_required');
  assert.ok(bundle.review_package.summary.includes('rewrite_required'));
});
