'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { issueApprovalToken, checkApprovalToken, APPROVAL_TTL_SECONDS } = require('../../lib/markos/mcp/approval.cjs');

function mockRedis() {
  const store = new Map();
  return {
    store,
    async set(k, v, opts) {
      if (opts && opts.nx && store.has(k)) return null;
      store.set(k, v);
      return 'OK';
    },
    async get(k) { return store.get(k) || null; },
    async del(k) { return store.delete(k) ? 1 : 0; },
    async getdel(k) { const v = store.get(k); if (v !== undefined) store.delete(k); return v || null; },
  };
}

test('Suite 202-04: APPROVAL_TTL_SECONDS is 300 (D-03 5-min window)', () => {
  assert.equal(APPROVAL_TTL_SECONDS, 300);
});

test('Suite 202-04: issueApprovalToken generates 32-char hex token', async () => {
  const redis = mockRedis();
  const token = await issueApprovalToken(redis, { id: 's1' }, 'schedule_post', { channel: 'email' });
  assert.match(token, /^[0-9a-f]{32}$/);
});

test('Suite 202-04: issueApprovalToken stores namespaced key approval:<session_id>:<token>', async () => {
  const redis = mockRedis();
  const token = await issueApprovalToken(redis, { id: 's1' }, 'schedule_post', {});
  const keys = Array.from(redis.store.keys());
  assert.equal(keys.length, 1);
  assert.equal(keys[0], `approval:s1:${token}`);
});

test('Suite 202-04: checkApprovalToken returns true then false (GETDEL one-time)', async () => {
  const redis = mockRedis();
  const session = { id: 's1' };
  const token = await issueApprovalToken(redis, session, 'schedule_post', { channel: 'email' });
  assert.equal(await checkApprovalToken(redis, token, session, 'schedule_post'), true);
  assert.equal(await checkApprovalToken(redis, token, session, 'schedule_post'), false);
});

test('Suite 202-04: checkApprovalToken rejects token for different tool_name', async () => {
  const redis = mockRedis();
  const session = { id: 's1' };
  const token = await issueApprovalToken(redis, session, 'schedule_post', {});
  assert.equal(await checkApprovalToken(redis, token, session, 'delete_post'), false);
});

test('Suite 202-04: checkApprovalToken rejects token for different session', async () => {
  const redis = mockRedis();
  const token = await issueApprovalToken(redis, { id: 's1' }, 'schedule_post', {});
  assert.equal(await checkApprovalToken(redis, token, { id: 's2' }, 'schedule_post'), false);
});

test('Suite 202-04: checkApprovalToken returns false for unknown token', async () => {
  const redis = mockRedis();
  assert.equal(await checkApprovalToken(redis, 'deadbeef'.repeat(4), { id: 's' }, 'schedule_post'), false);
});
