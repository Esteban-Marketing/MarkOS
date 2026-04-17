'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { signPayload, verifySignature, SIGNATURE_PREFIX } = require('../../lib/markos/webhooks/signing.cjs');

test('signPayload returns sha256= prefixed digest and unix-second timestamp', () => {
  const { signature, timestamp } = signPayload('shh', '{"a":1}', () => 1_700_000_000_000);
  assert.ok(signature.startsWith(SIGNATURE_PREFIX));
  assert.equal(timestamp, '1700000000');
  assert.equal(signature.length, SIGNATURE_PREFIX.length + 64);
});

test('signPayload throws without secret', () => {
  assert.throws(() => signPayload('', 'body'), /secret is required/);
});

test('verifySignature accepts valid signature within skew window', () => {
  const body = '{"event":"approval.created"}';
  const now = () => 1_700_000_500_000;
  const { signature, timestamp } = signPayload('topsecret', body, now);
  assert.equal(verifySignature('topsecret', body, signature, timestamp, { now }), true);
});

test('verifySignature rejects tampered body', () => {
  const now = () => 1_700_000_500_000;
  const { signature, timestamp } = signPayload('topsecret', 'original', now);
  assert.equal(verifySignature('topsecret', 'tampered', signature, timestamp, { now }), false);
});

test('verifySignature rejects wrong secret', () => {
  const now = () => 1_700_000_500_000;
  const { signature, timestamp } = signPayload('topsecret', 'body', now);
  assert.equal(verifySignature('different', 'body', signature, timestamp, { now }), false);
});

test('verifySignature rejects stale timestamp beyond skew window', () => {
  const earlier = () => 1_700_000_000_000;
  const later = () => 1_700_000_000_000 + 10 * 60 * 1000;
  const { signature, timestamp } = signPayload('s', 'b', earlier);
  assert.equal(verifySignature('s', 'b', signature, timestamp, { now: later, maxSkewSeconds: 300 }), false);
});

test('verifySignature rejects missing signature prefix', () => {
  const now = () => 1_700_000_000_000;
  assert.equal(verifySignature('s', 'b', 'deadbeef', '1700000000', { now }), false);
});

test('verifySignature rejects non-numeric timestamp', () => {
  assert.equal(verifySignature('s', 'b', `${SIGNATURE_PREFIX}aaaa`, 'not-a-ts'), false);
});
