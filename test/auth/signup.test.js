'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const { enqueueSignup } = require('../../lib/markos/auth/signup.cjs');

function mockClient(opts = {}) {
  const calls = { otp: [], upserts: [], selects: [] };
  const emptyRowChain = {
    select: () => ({
      eq: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        maybeSingle: async () => ({ data: null, error: null }),
      }),
    }),
    upsert: (row) => { calls.upserts.push(row); return { error: null }; },
    delete: () => ({ eq: async () => ({ error: null }) }),
    insert: () => ({ select: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) }),
  };
  return {
    calls,
    from: () => emptyRowChain,
    auth: {
      signInWithOtp: async (args) => {
        calls.otp.push(args);
        return { error: opts.otpError || null };
      },
    },
  };
}

test('Suite 201-03: enqueueSignup rejects missing email', async () => {
  const c = mockClient();
  const r = await enqueueSignup(c, { email: '', botIdToken: 't', ip: '1.2.3.4' }, { skipBotIdInTest: true });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'invalid_email');
});

test('Suite 201-03: enqueueSignup rejects malformed email', async () => {
  const c = mockClient();
  const r = await enqueueSignup(c, { email: 'no-at-sign', botIdToken: 't', ip: '1.2.3.4' }, { skipBotIdInTest: true });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'invalid_email');
});

test('Suite 201-03: enqueueSignup rejects on BotID failure', async () => {
  const c = mockClient();
  const fetchImpl = async () => ({ ok: true, json: async () => ({ verified: false }) });
  const r = await enqueueSignup(c, { email: 'a@b.com', botIdToken: 't', ip: '1.2.3.4' }, { fetchImpl });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'bot_detected');
});

test('Suite 201-03: enqueueSignup succeeds with skipBotIdInTest + calls signInWithOtp', async () => {
  const c = mockClient();
  const r = await enqueueSignup(
    c,
    { email: 'alice@acme.com', botIdToken: 'tok', ip: '1.2.3.4' },
    { skipBotIdInTest: true, baseUrl: 'https://markos.dev' },
  );
  assert.equal(r.ok, true, `expected ok, got ${JSON.stringify(r)}`);
  assert.ok(r.buffer_expires_at);
  assert.equal(c.calls.otp.length, 1);
  assert.equal(c.calls.otp[0].email, 'alice@acme.com');
  assert.equal(c.calls.otp[0].options.shouldCreateUser, true);
  assert.equal(c.calls.otp[0].options.emailRedirectTo, 'https://markos.dev/api/auth/callback');
  // Upserts buffer row — NOT markos_orgs (Pitfall 1)
  assert.ok(c.calls.upserts.some(u => u.email === 'alice@acme.com' && u.botid_token === 'tok'));
});

test('Suite 201-03: enqueueSignup surfaces supabase error', async () => {
  const c = mockClient({ otpError: { message: 'Email rate limit reached' } });
  const r = await enqueueSignup(
    c,
    { email: 'a@b.com', botIdToken: 't', ip: '1.2.3.4' },
    { skipBotIdInTest: true },
  );
  assert.equal(r.ok, false);
  assert.equal(r.code, 'supabase_error');
  assert.match(r.message, /Email rate limit/);
});

test('Suite 201-03: enqueueSignup normalises email to lowercase', async () => {
  const c = mockClient();
  await enqueueSignup(c, { email: 'ALICE@ACME.COM', botIdToken: 't', ip: '1.2.3.4' }, { skipBotIdInTest: true });
  assert.equal(c.calls.otp[0].email, 'alice@acme.com');
});
