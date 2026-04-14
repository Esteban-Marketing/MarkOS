'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  FAMILY_REGISTRY,
  normalizeBusinessModel,
  resolveBusinessModelFamily,
  getFamilyEntry,
  getOverlayDocForModel,
} = require('../../onboarding/backend/research/template-family-map.cjs');

test('97-01 required business models resolve to deterministic canonical families', () => {
  const matrix = [
    ['B2B', 'b2b'],
    ['B2C', 'b2c'],
    ['SaaS', 'saas'],
    ['agency', 'agency'],
    ['agencies', 'agency'],
    ['Agents-aaS', 'agency'],
    ['services', 'services'],
    ['consulting', 'services'],
    ['info products', 'info-products'],
    ['info-products', 'info-products'],
    ['ecommerce', 'ecommerce'],
    ['DTC', 'ecommerce'],
    ['Marketplace', 'ecommerce'],
  ];

  for (const [input, expected] of matrix) {
    assert.equal(normalizeBusinessModel(input), expected, `expected ${input} -> ${expected}`);
    const resolved = resolveBusinessModelFamily(input);
    assert.ok(resolved, `expected a family entry for ${input}`);
    assert.equal(resolved.slug, expected);
    assert.ok(typeof resolved.baseDoc === 'string' && resolved.baseDoc.length > 0);
  }

  assert.ok(Array.isArray(FAMILY_REGISTRY));
  assert.ok(FAMILY_REGISTRY.length >= 6);
});

test('97-01 overlay families expose base+overlay contract', () => {
  const saas = getFamilyEntry('saas');
  const services = getFamilyEntry('services');
  const ecommerce = getFamilyEntry('ecommerce');
  const infoProducts = getFamilyEntry('info-products');

  assert.ok(saas.baseDoc.endsWith('.md'));
  assert.ok(saas.overlayDocs.saas.endsWith('TPL-SHARED-overlay-saas.md'));
  assert.ok(services.overlayDocs.consulting.endsWith('TPL-SHARED-overlay-consulting.md'));
  assert.ok(ecommerce.overlayDocs.ecommerce.endsWith('TPL-SHARED-overlay-ecommerce.md'));
  assert.ok(infoProducts.overlayDocs['info-products'].endsWith('TPL-SHARED-overlay-info-products.md'));

  assert.equal(getOverlayDocForModel(saas, 'saas'), saas.overlayDocs.saas);
  assert.equal(getOverlayDocForModel(services, 'consulting'), services.overlayDocs.consulting);
  assert.equal(getOverlayDocForModel(getFamilyEntry('b2b'), 'b2b'), null);
});

test('97-01 unknown business models fail fast and deterministically', () => {
  assert.equal(normalizeBusinessModel(''), '');
  assert.equal(resolveBusinessModelFamily('unknown-nonsense-model'), null);
  assert.equal(getFamilyEntry('definitely-missing'), null);
});
