'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_TEMPLATE_FIELDS,
  validateTemplateMarkdown,
} = require('../../onboarding/backend/research/template-library-contract.cjs');

const VALID_TEMPLATE = [
  '```yaml',
  'doc_id: "LIT-P97-test-template"',
  'discipline: "Paid_Media"',
  'business_model: ["all"]',
  'pain_point_tags: ["high_cac"]',
  'funnel_stage: "Awareness"',
  'buying_maturity: "problem-aware"',
  'tone_guidance: "calm, direct, specific"',
  'proof_posture: "evidence-led"',
  'naturality_expectations: "human, plainspoken, non-hype"',
  '```',
  '',
  '# Phase 97 Fixture',
  '',
  '## EVIDENCE BASE',
  '- Proof should be concrete.',
  '',
  '## CORE TACTICS',
  '### Stage-specific voice',
  'Make the tone adapt to the funnel stage without sounding generic.',
].join('\n');

test('97-01 contract exposes the required Phase 97 metadata fields', () => {
  for (const key of ['business_model', 'funnel_stage', 'buying_maturity', 'tone_guidance', 'proof_posture', 'naturality_expectations']) {
    assert.ok(REQUIRED_TEMPLATE_FIELDS.includes(key), `missing required field ${key}`);
  }
});

test('97-01 valid template metadata passes the contract', () => {
  const result = validateTemplateMarkdown(VALID_TEMPLATE);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('97-01 missing stage, tone, proof, or naturality metadata fails fast', () => {
  const invalid = VALID_TEMPLATE
    .replace('funnel_stage: "Awareness"\n', '')
    .replace('tone_guidance: "calm, direct, specific"\n', '')
    .replace('proof_posture: "evidence-led"\n', '')
    .replace('naturality_expectations: "human, plainspoken, non-hype"\n', '');

  const result = validateTemplateMarkdown(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((entry) => entry.includes('funnel_stage')));
  assert.ok(result.errors.some((entry) => entry.includes('tone_guidance')));
  assert.ok(result.errors.some((entry) => entry.includes('proof_posture')));
  assert.ok(result.errors.some((entry) => entry.includes('naturality_expectations')));
});

test('97-01 overlay docs require overlay_for linkage', () => {
  const overlayWithoutLink = VALID_TEMPLATE.replace('business_model: ["all"]', 'business_model: ["saas"]');
  const failure = validateTemplateMarkdown(overlayWithoutLink, { requireOverlay: true });
  assert.equal(failure.ok, false);
  assert.ok(failure.errors.some((entry) => entry.includes('overlay_for')));

  const overlayWithLink = overlayWithoutLink.replace('pain_point_tags: ["high_cac"]', 'pain_point_tags: ["high_cac"]\noverlay_for: "shared-universal"');
  const pass = validateTemplateMarkdown(overlayWithLink, { requireOverlay: true });
  assert.equal(pass.ok, true);
});
