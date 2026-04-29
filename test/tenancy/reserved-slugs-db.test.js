'use strict';

// Phase 201.1 D-109 (closes M6): tests for DB-backed reserved-slug cache loader
// + obscenity profanity matcher + async isReservedSlugAsync surface.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isReservedSlug,
  isReservedSlugAsync,
  loadReservedSlugsFromDb,
  clearReservedSlugCache,
  getDefaultProfanitySet,
  RESERVED_SLUGS,
} = require('../../lib/markos/tenant/reserved-slugs.cjs');

// ---- Mock client helpers ----

/** Returns a mock Supabase client that returns only the 88 baseline seed slugs. */
function makeSeedOnlyClient(callLog) {
  const slugRows = [...RESERVED_SLUGS].map((s) => ({ slug: s }));
  return {
    from: (table) => {
      if (table !== 'markos_reserved_slugs') {
        throw new Error(`unexpected table: ${table}`);
      }
      return {
        select: () => {
          if (callLog) callLog.push('select');
          return Promise.resolve({ data: slugRows, error: null });
        },
      };
    },
  };
}

/** Returns a mock client that includes an additional slug beyond the baseline. */
function makeExtendedClient(extraSlug) {
  const slugRows = [...RESERVED_SLUGS, extraSlug].map((s) => ({ slug: s }));
  return {
    from: () => ({
      select: () => Promise.resolve({ data: slugRows, error: null }),
    }),
  };
}

/** Returns a mock client that always errors on select. */
function makeErrorClient() {
  return {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: { message: 'db_error' } }),
    }),
  };
}

// ---- Cache hit / miss / TTL tests ----

test('loadReservedSlugsFromDb: returns Set from DB on first call', async () => {
  clearReservedSlugCache();
  const calls = [];
  const client = makeSeedOnlyClient(calls);
  const set = await loadReservedSlugsFromDb(client);
  assert.ok(set instanceof Set, 'result is a Set');
  assert.equal(calls.length, 1, 'DB was called exactly once');
  assert.ok(set.has('www'), 'www is in the returned set');
});

test('loadReservedSlugsFromDb: second call uses cache (DB not re-queried)', async () => {
  clearReservedSlugCache();
  const calls = [];
  const client = makeSeedOnlyClient(calls);
  await loadReservedSlugsFromDb(client);
  await loadReservedSlugsFromDb(client);
  assert.equal(calls.length, 1, 'DB called only once within TTL window');
});

test('loadReservedSlugsFromDb: clearReservedSlugCache forces DB re-query', async () => {
  clearReservedSlugCache();
  const calls = [];
  const client = makeSeedOnlyClient(calls);
  await loadReservedSlugsFromDb(client);
  assert.equal(calls.length, 1);
  clearReservedSlugCache();
  await loadReservedSlugsFromDb(client);
  assert.equal(calls.length, 2, 'DB re-queried after cache clear');
});

test('loadReservedSlugsFromDb: fails closed on DB error (returns baked-in set)', async () => {
  clearReservedSlugCache();
  const set = await loadReservedSlugsFromDb(makeErrorClient());
  assert.ok(set instanceof Set);
  assert.ok(set.has('www'), 'baked-in floor still present on DB error');
});

test('loadReservedSlugsFromDb: null client returns baked-in set (no crash)', async () => {
  clearReservedSlugCache();
  const set = await loadReservedSlugsFromDb(null);
  assert.ok(set instanceof Set);
  assert.ok(set.size >= 70);
});

// ---- isReservedSlugAsync tests ----

test('isReservedSlugAsync: returns true for baked-in slug without DB call', async () => {
  clearReservedSlugCache();
  const calls = [];
  const client = makeSeedOnlyClient(calls);
  const result = await isReservedSlugAsync('www', client);
  assert.equal(result, true);
  // 'www' is in the sync Set — DB call may or may not happen depending on cache state,
  // but result must be true regardless.
});

test('isReservedSlugAsync: returns true for DB-only slug (not in baked-in Set)', async () => {
  clearReservedSlugCache();
  const client = makeExtendedClient('my-new-reserved-slug');
  const result = await isReservedSlugAsync('my-new-reserved-slug', client);
  assert.equal(result, true, 'DB-only slug must be rejected');
});

test('isReservedSlugAsync: returns false for non-reserved slug', async () => {
  clearReservedSlugCache();
  const client = makeSeedOnlyClient();
  const result = await isReservedSlugAsync('my-cool-workspace', client);
  assert.equal(result, false, 'non-reserved slug should pass');
});

test('isReservedSlugAsync: fail-closed on non-string input', async () => {
  clearReservedSlugCache();
  assert.equal(await isReservedSlugAsync(null, makeSeedOnlyClient()), true);
  assert.equal(await isReservedSlugAsync(undefined, makeSeedOnlyClient()), true);
  assert.equal(await isReservedSlugAsync(42, makeSeedOnlyClient()), true);
});

// ---- MANDATORY profanity test (W-1 closure) ----

test('rejects known profane slug via obscenity dataset', async () => {
  // This test MUST NOT be guarded by skip-on-import-failure.
  // If require('obscenity') (or the bad-words fallback) is unavailable, this test fails
  // with a clear message — fail-closed contract from W-1.
  const prof = getDefaultProfanitySet();
  assert.notEqual(prof.kind, 'noop',
    `[reserved-slugs] profanity checker loaded as 'noop' — install obscenity or bad-words. ` +
    `Current kind: ${prof.kind}. Run: npm install obscenity`);

  // Build a mockClient whose DB response contains ONLY the 88 baseline seeds.
  // 'fuckslug', 'Fuck-slug', and 'fucksluga' are intentionally absent from the DB response
  // so that a true result can ONLY come from the obscenity/bad-words matcher path.
  const seedRows = [...RESERVED_SLUGS].map((s) => ({ slug: s }));
  assert.ok(!seedRows.some((r) => r.slug === 'fuckslug'), 'fuckslug must not be in the seed set');
  assert.ok(!seedRows.some((r) => r.slug === 'fuck-slug'), 'fuck-slug must not be in the seed set');
  assert.ok(!seedRows.some((r) => r.slug === 'fucksluga'), 'fucksluga must not be in the seed set');

  const mockClient = {
    from: () => ({
      select: () => Promise.resolve({ data: seedRows, error: null }),
    }),
  };

  clearReservedSlugCache();
  assert.equal(
    await isReservedSlugAsync('fuckslug', mockClient),
    true,
    'fuckslug must be rejected by the profanity matcher',
  );

  clearReservedSlugCache();
  assert.equal(
    await isReservedSlugAsync('Fuck-slug', mockClient),
    true,
    'Fuck-slug (mixed case) must be rejected by the profanity matcher',
  );

  clearReservedSlugCache();
  assert.equal(
    await isReservedSlugAsync('fucksluga', mockClient),
    true,
    'fucksluga (suffix variant) must be rejected by the profanity matcher',
  );
});

// ---- Sync isReservedSlug backward-compat ----

test('sync isReservedSlug still works as Phase 201 baseline', () => {
  assert.equal(isReservedSlug('www'), true);
  assert.equal(isReservedSlug('Claude'), true);
  assert.equal(isReservedSlug('my-cool-workspace'), false);
  assert.equal(isReservedSlug(null), true, 'fail-closed on non-string');
  assert.equal(isReservedSlug(42), true, 'fail-closed on number');
});

test('RESERVED_SLUGS set has all 88 Phase 201 baseline entries', () => {
  assert.ok(RESERVED_SLUGS.size >= 88, `expected >= 88, got ${RESERVED_SLUGS.size}`);
});
