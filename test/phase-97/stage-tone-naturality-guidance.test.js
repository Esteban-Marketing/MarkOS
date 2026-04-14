'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { validateTemplateMarkdown } = require('../../onboarding/backend/research/template-library-contract.cjs');

const repoRoot = path.join(__dirname, '..', '..');
const files = {
  sharedTone: path.join(repoRoot, '.agent', 'markos', 'literacy', 'Shared', 'TPL-SHARED-tone-and-naturality.md'),
  sharedProof: path.join(repoRoot, '.agent', 'markos', 'literacy', 'Shared', 'TPL-SHARED-proof-posture.md'),
  paidMedia: path.join(repoRoot, '.agent', 'markos', 'literacy', 'Paid_Media', 'TPL-PM-stage-aware-universal.md'),
  lifecycle: path.join(repoRoot, '.agent', 'markos', 'literacy', 'Lifecycle_Email', 'TPL-LE-stage-aware-universal.md'),
  landingPages: path.join(repoRoot, '.agent', 'markos', 'literacy', 'Landing_Pages', 'TPL-LP-stage-aware-universal.md'),
  saas: path.join(repoRoot, '.agent', 'markos', 'literacy', 'Shared', 'TPL-SHARED-overlay-saas.md'),
  consulting: path.join(repoRoot, '.agent', 'markos', 'literacy', 'Shared', 'TPL-SHARED-overlay-consulting.md'),
  ecommerce: path.join(repoRoot, '.agent', 'markos', 'literacy', 'Shared', 'TPL-SHARED-overlay-ecommerce.md'),
  infoProducts: path.join(repoRoot, '.agent', 'markos', 'literacy', 'Shared', 'TPL-SHARED-overlay-info-products.md'),
};

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('97-02 authored universal docs exist and validate against the contract', () => {
  for (const [name, filePath] of Object.entries(files)) {
    assert.ok(fs.existsSync(filePath), `expected ${name} doc to exist`);
    const result = validateTemplateMarkdown(read(filePath), { requireOverlay: name === 'saas' || name === 'consulting' || name === 'ecommerce' || name === 'infoProducts' });
    assert.equal(result.ok, true, `${name} should pass metadata validation: ${result.errors.join(', ')}`);
  }
});

test('97-02 stage-aware docs mention the full lifecycle, not a single generic voice block', () => {
  const combined = [read(files.sharedTone), read(files.paidMedia), read(files.lifecycle), read(files.landingPages)].join('\n');
  for (const stage of ['Awareness', 'Consideration', 'Decision', 'Onboarding', 'Retention']) {
    assert.match(combined, new RegExp(stage, 'i'), `expected ${stage} guidance to exist`);
  }
});

test('97-02 overlay docs encode model-specific proof and tone differences', () => {
  assert.match(read(files.saas), /trial|product-led|subscription/i);
  assert.match(read(files.consulting), /relationship|case stud|high-ticket/i);
  assert.match(read(files.ecommerce), /urgency|scarcity|review/i);
  assert.match(read(files.infoProducts), /transformation|direct-response|emotion/i);
});
