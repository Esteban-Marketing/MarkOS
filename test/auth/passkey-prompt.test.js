'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Suite 201-04: PasskeyPrompt.tsx exists and imports @simplewebauthn/browser', () => {
  const p = path.join(__dirname, '..', '..', 'components', 'markos', 'auth', 'PasskeyPrompt.tsx');
  assert.ok(fs.existsSync(p), 'PasskeyPrompt.tsx missing');
  const src = fs.readFileSync(p, 'utf8');
  assert.match(src, /'use client'/);
  assert.match(src, /@simplewebauthn\/browser/);
  assert.match(src, /startRegistration/);
  assert.match(src, /Set up passkey/);
  assert.match(src, /Not now/);
  assert.match(src, /Log in faster next time\./);
  assert.match(src, /markos_passkey_prompt_dismissed/);
  assert.match(src, /role="region"/);
  assert.match(src, /aria-label/);
});

test('Suite 201-04: PasskeyPrompt.module.css locks UI-SPEC tokens', () => {
  const p = path.join(__dirname, '..', '..', 'components', 'markos', 'auth', 'PasskeyPrompt.module.css');
  const css = fs.readFileSync(p, 'utf8');
  assert.match(css, /#0d9488/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /outline: 2px solid #0d9488/);
  assert.match(css, /'Sora'/);
});

test('Suite 201-04: F-81 contract documents all 4 WebAuthn endpoints', () => {
  const yaml = fs.readFileSync(path.join(__dirname, '..', '..', 'contracts', 'F-81-passkey-webauthn-v1.yaml'), 'utf8');
  assert.match(yaml, /\/api\/auth\/passkey\/register-options/);
  assert.match(yaml, /\/api\/auth\/passkey\/register-verify/);
  assert.match(yaml, /\/api\/auth\/passkey\/authenticate-options/);
  assert.match(yaml, /\/api\/auth\/passkey\/authenticate-verify/);
  assert.match(yaml, /PasskeyCredential/);
  assert.match(yaml, /challenge_expired/);
});

test('Suite 201-04: all 4 passkey handlers exist and are exported as functions', () => {
  for (const name of ['register-options', 'register-verify', 'authenticate-options', 'authenticate-verify']) {
    const mod = require(`../../api/auth/passkey/${name}.js`);
    assert.equal(typeof mod, 'function', `${name}.js must default-export a function`);
  }
});

test('Suite 201-04: register-options handler 405 on GET', async () => {
  const handler = require('../../api/auth/passkey/register-options.js');
  let statusCode = null;
  const res = {
    setHeader: () => {},
    end: () => {},
  };
  Object.defineProperty(res, 'statusCode', { set: (v) => { statusCode = v; } });
  const req = { method: 'GET', headers: {}, url: '/api/auth/passkey/register-options' };
  await handler(req, res);
  assert.equal(statusCode, 405);
});

test('Suite 201-04: register-options handler 401 with no session', async () => {
  const handler = require('../../api/auth/passkey/register-options.js');
  let statusCode = null;
  const res = {
    setHeader: () => {},
    end: () => {},
  };
  Object.defineProperty(res, 'statusCode', { set: (v) => { statusCode = v; } });
  const req = {
    method: 'POST',
    headers: {},
    url: '/api/auth/passkey/register-options',
    on: (event, cb) => {
      if (event === 'end') setTimeout(cb, 0);
    },
  };
  const prev = process.env.MARKOS_ACTIVE_USER_ID;
  delete process.env.MARKOS_ACTIVE_USER_ID;
  try {
    await handler(req, res);
    assert.equal(statusCode, 401);
  } finally {
    if (prev) process.env.MARKOS_ACTIVE_USER_ID = prev;
  }
});
