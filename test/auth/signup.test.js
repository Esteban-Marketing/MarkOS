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

// --- F-80 contract presence + handler shape (Task 2) ---
test('Suite 201-03: F-80 contract file exists and references /api/auth/signup', () => {
  const fs = require('fs');
  const path = require('path');
  const p = path.join(__dirname, '..', '..', 'contracts', 'F-80-public-signup-v1.yaml');
  assert.ok(fs.existsSync(p), 'F-80 yaml missing');
  const yaml = fs.readFileSync(p, 'utf8');
  assert.match(yaml, /\/api\/auth\/signup/);
  assert.match(yaml, /\/api\/auth\/callback/);
  assert.match(yaml, /SignupRequest/);
  assert.match(yaml, /bot_detected/);
  assert.match(yaml, /rate_limited/);
});

test('Suite 201-03: api/auth/signup.js exports default handler + getClientIp', () => {
  const mod = require('../../api/auth/signup.js');
  assert.equal(typeof mod, 'function');
  assert.equal(typeof mod.getClientIp, 'function');
});

test('Suite 201-03: api/auth/callback.js exports default handler', () => {
  const mod = require('../../api/auth/callback.js');
  assert.equal(typeof mod, 'function');
});

test('Suite 201-03: signup handler returns 405 for non-POST', async () => {
  const handler = require('../../api/auth/signup.js');
  const req = { method: 'GET', headers: {}, url: '/api/auth/signup', socket: {} };
  let statusCode = null;
  const res = {
    setHeader: () => {},
    end: () => {},
  };
  Object.defineProperty(res, 'statusCode', { set: (v) => { statusCode = v; } });
  await handler(req, res);
  assert.equal(statusCode, 405);
});

// --- Surface 1 page presence + key strings (Task 3) ---
test('Suite 201-03: app/(marketing)/signup/page.tsx exists with required semantics', () => {
  const fs = require('fs');
  const path = require('path');
  const p = path.join(__dirname, '..', '..', 'app', '(marketing)', 'signup', 'page.tsx');
  assert.ok(fs.existsSync(p), 'signup page.tsx missing');
  const src = fs.readFileSync(p, 'utf8');
  assert.match(src, /'use client'/);
  assert.match(src, /id="signup-heading"/);
  assert.match(src, /Start your workspace/);
  assert.match(src, /Create workspace/); // primary CTA per UI-SPEC
  assert.match(src, /aria-live="polite"/);
  assert.match(src, /type="submit"/);
  assert.match(src, /\/api\/auth\/signup/);
  assert.match(src, /__botId/); // BotID pre-submit hook
});

test('Suite 201-03: signup page.module.css locks UI-SPEC tokens', () => {
  const fs = require('fs');
  const path = require('path');
  const p = path.join(__dirname, '..', '..', 'app', '(marketing)', 'signup', 'page.module.css');
  const css = fs.readFileSync(p, 'utf8');
  assert.match(css, /min-height: 44px/);          // touch targets
  assert.match(css, /border-radius: 28px/);        // hero card radius
  assert.match(css, /#0d9488/);                     // accent colour
  assert.match(css, /outline: 2px solid #0d9488/);  // focus ring (WCAG)
  assert.match(css, /'Sora'/);                      // display font
  assert.match(css, /'Space Grotesk'/);             // body font
});
