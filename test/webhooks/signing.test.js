'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  signPayload,
  signPayloadDualSign,
  verifySignature,
  SIGNATURE_PREFIX,
} = require('../../lib/markos/webhooks/signing.cjs');

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

// -------------------------------------------------------------------
// Plan 203-04 Task 1: signPayloadDualSign (Rotation Plan 203-05 foundation)
// -------------------------------------------------------------------

test('signPayloadDualSign with null v2Secret returns only V1 + Timestamp headers (no V2)', () => {
  const { headers } = signPayloadDualSign('secret1', null, 'body', () => 1_700_000_000_000);
  assert.equal(headers['X-Markos-Timestamp'], '1700000000');
  assert.ok(headers['X-Markos-Signature-V1'].startsWith(SIGNATURE_PREFIX));
  assert.equal(headers['X-Markos-Signature-V1'].length, SIGNATURE_PREFIX.length + 64);
  assert.equal(headers['X-Markos-Signature-V2'], undefined, 'V2 header must be absent when v2Secret is null');
});

test('signPayloadDualSign with both secrets returns V1 + V2 + shared Timestamp (V1 != V2)', () => {
  const { headers } = signPayloadDualSign('secret1', 'secret2', 'body', () => 1_700_000_000_000);
  assert.equal(headers['X-Markos-Timestamp'], '1700000000');
  assert.ok(headers['X-Markos-Signature-V1'].startsWith(SIGNATURE_PREFIX));
  assert.ok(headers['X-Markos-Signature-V2'].startsWith(SIGNATURE_PREFIX));
  assert.notEqual(
    headers['X-Markos-Signature-V1'],
    headers['X-Markos-Signature-V2'],
    'V1 and V2 must differ (different secrets yield different HMACs)',
  );
});

test('signPayloadDualSign V1 matches signPayload verbatim (backward compat)', () => {
  const fixed = () => 1_700_000_000_000;
  const expected = signPayload('secret1', 'body', fixed);
  const { headers } = signPayloadDualSign('secret1', null, 'body', fixed);
  assert.equal(headers['X-Markos-Signature-V1'], expected.signature);
  assert.equal(headers['X-Markos-Timestamp'], expected.timestamp);
});
