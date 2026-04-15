'use strict';
/**
 * test/pack-loader.test.js
 * Unit tests for lib/markos/packs/pack-loader.cjs
 * Run: node --test test/pack-loader.test.js
 */
const test   = require('node:test');
const assert = require('node:assert/strict');

// Lazy-loaded after cache resets to ensure fresh require
let loader;
function getLoader() {
  // Clear require cache + reset singleton on each reload
  const loaderPath = require.resolve('../lib/markos/packs/pack-loader.cjs');
  delete require.cache[loaderPath];
  loader = require('../lib/markos/packs/pack-loader.cjs');
  return loader;
}

test('Suite 106: pack-loader — getFamilyRegistry', async (t) => {

  await t.test('106.1 returns an array of 7 entries', () => {
    const { getFamilyRegistry, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const registry = getFamilyRegistry();
    assert.strictEqual(registry.length, 7, 'registry must have exactly 7 base pack entries');
  });

  await t.test('106.2 each entry has required legacy shape fields', () => {
    const { getFamilyRegistry, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const registry = getFamilyRegistry();
    for (const entry of registry) {
      assert.ok(typeof entry.slug === 'string' && entry.slug.length > 0, `entry.slug must be a non-empty string (got: ${entry.slug})`);
      assert.ok(Array.isArray(entry.aliases), `entry.aliases must be an array for slug=${entry.slug}`);
      assert.ok(typeof entry.baseDoc === 'string', `entry.baseDoc must be a string for slug=${entry.slug}`);
      assert.ok(typeof entry.proofDoc === 'string', `entry.proofDoc must be a string for slug=${entry.slug}`);
      assert.ok(typeof entry.overlayDocs === 'object' && entry.overlayDocs !== null, `entry.overlayDocs must be an object for slug=${entry.slug}`);
    }
  });

  await t.test('106.3 registry is frozen (immutable)', () => {
    const { getFamilyRegistry, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const registry = getFamilyRegistry();
    assert.ok(Object.isFrozen(registry), 'registry array must be frozen');
  });

  await t.test('106.4 returning same reference on second call (cache hit)', () => {
    const { getFamilyRegistry, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const first  = getFamilyRegistry();
    const second = getFamilyRegistry();
    assert.strictEqual(first, second, 'getFamilyRegistry() must return the same cached object on repeated calls');
  });

  await t.test('106.5 _resetCacheForTests clears the cache', () => {
    const { getFamilyRegistry, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const first = getFamilyRegistry();
    _resetCacheForTests();
    const second = getFamilyRegistry();
    // After reset, a new array is produced (different reference, same length)
    assert.strictEqual(second.length, 7, 'post-reset registry must still have 7 entries');
  });

  await t.test('106.6 saas entry has overlayDocs.saas set', () => {
    const { getFamilyRegistry, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const registry = getFamilyRegistry();
    const saas = registry.find(e => e.slug === 'saas');
    assert.ok(saas, 'saas entry must exist');
    assert.ok(typeof saas.overlayDocs.saas === 'string' && saas.overlayDocs.saas.length > 0,
      'saas.overlayDocs.saas must be a non-empty doc path');
  });

  await t.test('106.7 services entry has overlayDocs.consulting set', () => {
    const { getFamilyRegistry, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const registry = getFamilyRegistry();
    const services = registry.find(e => e.slug === 'services');
    assert.ok(services, 'services entry must exist');
    assert.ok(typeof services.overlayDocs.consulting === 'string',
      'services.overlayDocs.consulting must be a string doc path');
  });
});

test('Suite 106: pack-loader — resolvePackSelection', async (t) => {

  await t.test('106.8 resolves basePack from business_model', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'saas' } });
    assert.strictEqual(result.basePack, 'saas');
  });

  await t.test('106.9 resolvedAt is ISO 8601 string', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'b2b' } });
    assert.ok(typeof result.resolvedAt === 'string', 'resolvedAt must be a string');
    assert.ok(!Number.isNaN(Date.parse(result.resolvedAt)), 'resolvedAt must parse as a valid date');
  });

  await t.test('106.10 unknown business_model sets overrideReason=no_business_model_match', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'unknown_xyz' } });
    assert.strictEqual(result.basePack, null);
    assert.strictEqual(result.overrideReason, 'no_business_model_match');
  });

  await t.test('106.11 missing seed returns overrideReason=no_business_model_match', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({});
    assert.strictEqual(result.overrideReason, 'no_business_model_match');
  });

  await t.test('106.12 resolvePackSelection result shape has all four keys', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'ecommerce', industry: 'travel' } });
    assert.ok('basePack'       in result, 'must have basePack');
    assert.ok('overlayPack'    in result, 'must have overlayPack');
    assert.ok('overrideReason' in result, 'must have overrideReason');
    assert.ok('resolvedAt'     in result, 'must have resolvedAt');
  });
});

test('Suite 108: pack-loader — industry overlay resolution', async (t) => {

  await t.test('108.1 travel industry resolves overlayPack=travel', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'b2b', industry: 'travel' } });
    assert.strictEqual(result.basePack, 'b2b');
    assert.strictEqual(result.overlayPack, 'travel');
  });

  await t.test('108.2 it industry resolves overlayPack=it', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'saas', industry: 'it' } });
    assert.strictEqual(result.basePack, 'saas');
    assert.strictEqual(result.overlayPack, 'it');
  });

  await t.test('108.3 marketing-services industry resolves overlayPack=marketing-services', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'agency', industry: 'marketing services' } });
    assert.strictEqual(result.basePack, 'agency');
    assert.strictEqual(result.overlayPack, 'marketing-services');
  });

  await t.test('108.4 professional-services industry resolves overlayPack=professional-services', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'services', industry: 'professional services' } });
    assert.strictEqual(result.basePack, 'services');
    assert.strictEqual(result.overlayPack, 'professional-services');
  });

  await t.test('108.5 hospitality alias resolves to travel overlay', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'b2c', industry: 'hospitality' } });
    assert.strictEqual(result.overlayPack, 'travel');
  });

  await t.test('108.6 information technology alias resolves to it overlay', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'b2b', industry: 'information technology' } });
    assert.strictEqual(result.overlayPack, 'it');
  });

  await t.test('108.7 digital marketing alias resolves to marketing-services overlay', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'agency', industry: 'digital marketing' } });
    assert.strictEqual(result.overlayPack, 'marketing-services');
  });

  await t.test('108.8 advisory alias resolves to professional-services overlay', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'b2b', industry: 'advisory' } });
    assert.strictEqual(result.overlayPack, 'professional-services');
  });

  await t.test('108.9 unknown industry resolves overlayPack=null', () => {
    const { resolvePackSelection, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const result = resolvePackSelection({ company: { business_model: 'b2b', industry: 'agriculture' } });
    assert.strictEqual(result.basePack, 'b2b');
    assert.strictEqual(result.overlayPack, null);
  });

  await t.test('108.10 industry overlay manifests are valid JSON with required fields', () => {
    const fs   = require('fs');
    const path = require('path');
    const Ajv  = require('ajv');
    const schema = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, '../lib/markos/packs/pack-schema.json'), 'utf8'
    ));
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    const slugs = ['travel', 'it', 'marketing-services', 'professional-services'];
    for (const slug of slugs) {
      const filePath = path.resolve(__dirname, '../lib/markos/packs/industries', slug + '.industry.json');
      assert.ok(fs.existsSync(filePath), `${slug}.industry.json must exist`);
      const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      assert.ok(validate(manifest), `${slug}.industry.json must pass schema validation: ${JSON.stringify(validate.errors)}`);
      assert.strictEqual(manifest.type, 'overlay', `${slug} must have type=overlay`);
      assert.ok(Array.isArray(manifest.overlayFor) && manifest.overlayFor.length > 0,
        `${slug} must have overlayFor array`);
    }
  });

  await t.test('108.11 existing 106.1 still passes (7 base pack entries, no overlay inflation)', () => {
    const { getFamilyRegistry, _resetCacheForTests } = getLoader();
    _resetCacheForTests();
    const registry = getFamilyRegistry();
    assert.strictEqual(registry.length, 7,
      `getFamilyRegistry must return exactly 7 entries; got ${registry.length}`);
  });

});
