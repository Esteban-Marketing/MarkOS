'use strict';

// Phase 201.1 Plan 05 Task 1: Jittered-TTL + transitional-rename helper tests.
// Closes H5 (cache stampede on cohort TTL expiry + rename propagation race).

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  computeJitteredTtl,
  writeSlugToEdgeJittered,
  writeTransitionalRename,
  TRANSITIONAL_PREFIX,
  TRANSITIONAL_RENAME_TTL_SECONDS,
  SLUG_CACHE_TTL_BASE_SECONDS,
  SLUG_CACHE_TTL_JITTER_SECONDS,
} = require('../../lib/markos/tenant/slug-cache.cjs');

test('Suite 201.1-05 jitter: computeJitteredTtl always returns value in [45, 75]', () => {
  const results = Array.from({ length: 100 }, () => computeJitteredTtl());
  for (const v of results) {
    assert.ok(typeof v === 'number' && Number.isInteger(v), `expected integer, got ${v}`);
    assert.ok(v >= 45, `TTL ${v} is below minimum 45`);
    assert.ok(v <= 75, `TTL ${v} exceeds maximum 75`);
  }
});

test('Suite 201.1-05 jitter: writeSlugToEdgeJittered PATCHes edge-config with a ttl field', async () => {
  let captured = null;
  const fakeFetch = async (url, init) => {
    captured = { url, init };
    return { ok: true };
  };
  await writeSlugToEdgeJittered('slug-a', 'tenant-1', {
    VERCEL_API_TOKEN: 'tok',
    EDGE_CONFIG_ID: 'ecfg_test',
    fetch: fakeFetch,
  });
  assert.ok(captured !== null, 'fetch should have been called');
  const body = JSON.parse(captured.init.body);
  assert.ok(Array.isArray(body.items) && body.items.length === 1, 'items array expected');
  const item = body.items[0];
  assert.equal(item.operation, 'upsert');
  assert.equal(item.key, 'markos:slug:slug-a');
  assert.equal(item.value, 'tenant-1');
  assert.ok('ttl' in item, 'item must carry a ttl field');
  assert.ok(typeof item.ttl === 'number', 'ttl must be a number');
  assert.ok(item.ttl >= 45 && item.ttl <= 75, `ttl ${item.ttl} out of [45,75]`);
});

test('Suite 201.1-05 jitter: writeTransitionalRename writes __renamed: value with 90s TTL', async () => {
  let captured = null;
  const fakeFetch = async (url, init) => {
    captured = { url, init };
    return { ok: true };
  };
  await writeTransitionalRename('old-slug', 'new-slug', {
    VERCEL_API_TOKEN: 'tok',
    EDGE_CONFIG_ID: 'ecfg_test',
    fetch: fakeFetch,
  });
  assert.ok(captured !== null, 'fetch should have been called');
  const body = JSON.parse(captured.init.body);
  const item = body.items[0];
  assert.equal(item.key, 'markos:slug:old-slug');
  assert.equal(item.value, '__renamed:new-slug');
  assert.equal(item.ttl, 90);
});

test('Suite 201.1-05 jitter: TRANSITIONAL constants are correct', () => {
  assert.equal(TRANSITIONAL_PREFIX, '__renamed:');
  assert.equal(TRANSITIONAL_RENAME_TTL_SECONDS, 90);
  assert.equal(SLUG_CACHE_TTL_BASE_SECONDS, 45);
  assert.equal(SLUG_CACHE_TTL_JITTER_SECONDS, 30);
});
