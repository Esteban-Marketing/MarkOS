'use strict';

// Phase 201.1 Plan 05 Task 1: Single-flight Promise coalescing tests.
// Eliminates thundering-herd on cache miss within one warm Vercel function invocation.

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSingleFlight, singleFlight } = require('../../lib/markos/tenant/single-flight.cjs');

test('Suite 201.1-05 single-flight: N concurrent coalesce calls share ONE fn invocation', async () => {
  const sf = createSingleFlight();
  let callCount = 0;
  const slowFn = () => new Promise((resolve) => {
    callCount++;
    setTimeout(() => resolve('result-a'), 10);
  });

  const results = await Promise.all(
    Array.from({ length: 5 }, () => sf.coalesce('slug-a', slowFn)),
  );

  assert.equal(callCount, 1, `slowFn called ${callCount} times; expected 1`);
  assert.ok(results.every((r) => r === 'result-a'), 'all callers must receive the same result');
});

test('Suite 201.1-05 single-flight: after resolution inflight size is 0', async () => {
  const sf = createSingleFlight();
  await sf.coalesce('slug-x', () => Promise.resolve('val'));
  assert.equal(sf.inflightSize(), 0, 'inflight map must be cleared after settle');
});

test('Suite 201.1-05 single-flight: different keys do NOT share a Promise', async () => {
  const sf = createSingleFlight();
  const calls = { a: 0, b: 0 };
  const fnA = () => new Promise((r) => { calls.a++; setTimeout(() => r('a'), 5); });
  const fnB = () => new Promise((r) => { calls.b++; setTimeout(() => r('b'), 5); });

  const [ra, rb] = await Promise.all([
    sf.coalesce('slug-a', fnA),
    sf.coalesce('slug-b', fnB),
  ]);

  assert.equal(calls.a, 1, 'fnA must be called exactly once');
  assert.equal(calls.b, 1, 'fnB must be called exactly once');
  assert.equal(ra, 'a');
  assert.equal(rb, 'b');
});

test('Suite 201.1-05 single-flight: errors propagate to all subscribers and clear key', async () => {
  const sf = createSingleFlight();
  const boom = () => new Promise((_, reject) => setTimeout(() => reject(new Error('edge down')), 5));

  const [r1, r2] = await Promise.allSettled([
    sf.coalesce('slug-err', boom),
    sf.coalesce('slug-err', boom),
  ]);

  assert.equal(r1.status, 'rejected');
  assert.equal(r2.status, 'rejected');
  assert.match(r1.reason.message, /edge down/);
  assert.equal(sf.inflightSize(), 0, 'inflight key must be cleared after error');
});

test('Suite 201.1-05 single-flight: after resolve a fresh call re-executes fn', async () => {
  const sf = createSingleFlight();
  let n = 0;
  const fn = () => Promise.resolve(++n);

  const r1 = await sf.coalesce('slug-seq', fn);
  const r2 = await sf.coalesce('slug-seq', fn);

  assert.equal(r1, 1);
  assert.equal(r2, 2, 'second call after settle must re-invoke fn');
});

test('Suite 201.1-05 single-flight: module-scope singleFlight export is usable', async () => {
  // Sanity check the default instance exported as singleFlight.
  const result = await singleFlight.coalesce('__module-scope-test__', () => Promise.resolve(42));
  assert.equal(result, 42);
});
