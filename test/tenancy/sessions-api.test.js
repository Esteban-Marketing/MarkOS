'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Suite 201-05: F-82 YAML documents list + revoke endpoints', () => {
  const yaml = fs.readFileSync(path.join(__dirname, '..', '..', 'contracts', 'F-82-tenant-sessions-v1.yaml'), 'utf8');
  assert.match(yaml, /\/api\/tenant\/sessions\/list/);
  assert.match(yaml, /\/api\/tenant\/sessions\/revoke/);
  assert.match(yaml, /SessionDevice/);
  assert.match(yaml, /revoked_count/);
});

test('Suite 201-05: revoke handler 405 on GET', async () => {
  const handler = require('../../api/tenant/sessions/revoke.js');
  let statusCode = null;
  const res = { setHeader: () => {}, end: () => {} };
  Object.defineProperty(res, 'statusCode', { set: v => { statusCode = v; } });
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(statusCode, 405);
});

test('Suite 201-05: revoke handler 401 when headers missing', async () => {
  const prev = process.env.MARKOS_ACTIVE_USER_ID;
  delete process.env.MARKOS_ACTIVE_USER_ID;
  try {
    const handler = require('../../api/tenant/sessions/revoke.js');
    let statusCode = null;
    const res = { setHeader: () => {}, end: () => {} };
    Object.defineProperty(res, 'statusCode', { set: v => { statusCode = v; } });
    const req = {
      method: 'POST',
      headers: {},
      on: (event, cb) => { if (event === 'end') setTimeout(cb, 0); },
    };
    await handler(req, res);
    assert.equal(statusCode, 401);
  } finally {
    if (prev) process.env.MARKOS_ACTIVE_USER_ID = prev;
  }
});

test('Suite 201-05: /settings/sessions page.tsx renders table with caption and "(this device)" marker', () => {
  const p = path.join(__dirname, '..', '..', 'app', '(markos)', 'settings', 'sessions', 'page.tsx');
  const src = fs.readFileSync(p, 'utf8');
  assert.match(src, /'use client'/);
  assert.match(src, /<table/);
  assert.match(src, /<caption>/);
  assert.match(src, /Revoke session/);
  assert.match(src, /Revoke all other sessions/);
  assert.match(src, /this device/);
  assert.match(src, /\/api\/tenant\/sessions\/list/);
  assert.match(src, /\/api\/tenant\/sessions\/revoke/);
});

test('Suite 201-05: /404-workspace/page.tsx distinguishes reserved vs unclaimed', () => {
  const p = path.join(__dirname, '..', '..', 'app', '(markos)', '404-workspace', 'page.tsx');
  const src = fs.readFileSync(p, 'utf8');
  assert.match(src, /Claim this workspace/);
  assert.match(src, /This address is reserved\./);
  assert.match(src, /reserved === '1'/);
  assert.match(src, /\/signup/);
});

test('Suite 201-05: Surface 2 + Surface 8 CSS lock UI-SPEC tokens', () => {
  const sessionsCss = fs.readFileSync(path.join(__dirname, '..', '..', 'app', '(markos)', 'settings', 'sessions', 'page.module.css'), 'utf8');
  const notFoundCss = fs.readFileSync(path.join(__dirname, '..', '..', 'app', '(markos)', '404-workspace', 'page.module.css'), 'utf8');
  for (const css of [sessionsCss, notFoundCss]) {
    assert.match(css, /#0d9488|#0f766e/);
    assert.match(css, /min-height: 44px/);
    assert.match(css, /border-radius: 28px/);
  }
});
