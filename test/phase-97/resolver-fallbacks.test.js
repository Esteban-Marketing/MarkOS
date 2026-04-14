'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveExample,
  resolveSkeleton,
  resolveTemplateSelection,
} = require('../../onboarding/backend/agents/example-resolver.cjs');

test('97-03 alias and edge-case business models resolve through the new family map', () => {
  const inputs = ['agency', 'services', 'consulting', 'info-products', 'ecommerce', 'DTC', 'Marketplace', 'Agents-aaS'];

  for (const input of inputs) {
    const selection = resolveTemplateSelection('Paid_Media', input);
    assert.ok(selection, `expected a deterministic selection for ${input}`);
    assert.ok(typeof selection.baseDoc === 'string' && selection.baseDoc.length > 0);
    assert.ok(selection.familySlug);
  }
});

test('97-03 deterministic fallback returns useful content before empty output for repo-supported aliases', () => {
  const skeleton = resolveSkeleton('Paid_Media', 'DTC');
  assert.notEqual(skeleton, '');

  const exampleBlock = resolveExample('AUDIENCES', 'Marketplace');
  assert.ok(exampleBlock.includes('Reference Example'));
});

test('97-03 composition-pair metadata is exposed for first-class overlays', () => {
  const selection = resolveTemplateSelection('Landing_Pages', 'consulting');
  assert.equal(selection.familySlug, 'services');
  assert.ok(selection.baseDoc.endsWith('.md'));
  assert.ok(selection.overlayDoc.endsWith('TPL-SHARED-overlay-consulting.md'));
});
