'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyBotIdToken, BOTID_VERIFY_ENDPOINT } = require('../../lib/markos/auth/botid.cjs');

test('Suite 201-03: BOTID_VERIFY_ENDPOINT is a string URL', () => {
  assert.equal(typeof BOTID_VERIFY_ENDPOINT, 'string');
  assert.ok(/^https?:\/\//.test(BOTID_VERIFY_ENDPOINT));
});

test('Suite 201-03: missing token → missing_token', async () => {
  const r = await verifyBotIdToken('', {});
  assert.deepEqual(r, { ok: false, reason: 'missing_token' });
});

test('Suite 201-03: skipInTest bypasses verification', async () => {
  const r = await verifyBotIdToken('anything', { skipInTest: true });
  assert.deepEqual(r, { ok: true, reason: 'test_skip' });
});

test('Suite 201-03: network error → fail closed', async () => {
  const fetchImpl = async () => { throw new Error('connection_refused'); };
  const r = await verifyBotIdToken('t', { fetchImpl, endpoint: 'http://x' });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'network_error');
});

test('Suite 201-03: non-200 response → fail closed', async () => {
  const fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({}) });
  const r = await verifyBotIdToken('t', { fetchImpl, endpoint: 'http://x' });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'network_error');
});

test('Suite 201-03: verified=true → ok', async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ verified: true }) });
  const r = await verifyBotIdToken('t', { fetchImpl, endpoint: 'http://x' });
  assert.deepEqual(r, { ok: true, reason: 'verified' });
});

test('Suite 201-03: verified=false → invalid', async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ verified: false }) });
  const r = await verifyBotIdToken('t', { fetchImpl, endpoint: 'http://x' });
  assert.deepEqual(r, { ok: false, reason: 'invalid' });
});
