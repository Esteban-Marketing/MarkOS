'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const { RATE_LIMITS, hashIp, windowStart, checkSignupRateLimit } = require('../../lib/markos/auth/rate-limit.cjs');

test('Suite 201-03: RATE_LIMITS has the locked D-03 thresholds', () => {
  assert.equal(RATE_LIMITS.ip_hourly.max, 5);
  assert.equal(RATE_LIMITS.ip_hourly.window_ms, 3_600_000);
  assert.equal(RATE_LIMITS.email_per_minute.max, 1);
  assert.equal(RATE_LIMITS.email_per_minute.window_ms, 60_000);
});

test('Suite 201-03: hashIp is deterministic and hides raw IP', () => {
  const h1 = hashIp('1.2.3.4');
  const h2 = hashIp('1.2.3.4');
  assert.equal(h1, h2);
  assert.notEqual(h1, '1.2.3.4');
  assert.equal(h1.length, 64);
});

test('Suite 201-03: windowStart snaps to window boundary', () => {
  const now = Date.parse('2026-04-17T10:37:25.500Z');
  const w = windowStart(now, 3_600_000);
  assert.equal(w, '2026-04-17T10:00:00.000Z');
});

test('Suite 201-03: checkSignupRateLimit allows first attempt', async () => {
  const client = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  };
  const r = await checkSignupRateLimit(client, { ip: '1.2.3.4', email: 'a@b.com' });
  assert.deepEqual(r, { allowed: true, reason: 'ok' });
});

test('Suite 201-03: checkSignupRateLimit denies when IP hit 5/hour', async () => {
  const client = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { attempt_count: 5 }, error: null }),
          }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  };
  const r = await checkSignupRateLimit(client, { ip: '1.2.3.4', email: 'a@b.com' });
  assert.deepEqual(r, { allowed: false, reason: 'ip_hourly' });
});

test('Suite 201-03: checkSignupRateLimit denies when email throttled (<60s ago)', async () => {
  const client = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
          maybeSingle: async () => (
            table === 'markos_signup_email_throttle'
              ? { data: { last_sent_at: new Date(Date.now() - 30_000).toISOString() }, error: null }
              : { data: null, error: null }
          ),
        }),
      }),
    }),
  };
  const r = await checkSignupRateLimit(client, { ip: '1.2.3.4', email: 'a@b.com' });
  assert.deepEqual(r, { allowed: false, reason: 'email_per_minute' });
});

test('Suite 201-03: checkSignupRateLimit allows email after 60s', async () => {
  const client = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
          maybeSingle: async () => (
            table === 'markos_signup_email_throttle'
              ? { data: { last_sent_at: new Date(Date.now() - 120_000).toISOString() }, error: null }
              : { data: null, error: null }
          ),
        }),
      }),
    }),
  };
  const r = await checkSignupRateLimit(client, { ip: '1.2.3.4', email: 'a@b.com' });
  assert.deepEqual(r, { allowed: true, reason: 'ok' });
});
