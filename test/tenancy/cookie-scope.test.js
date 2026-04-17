'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { MARKOS_COOKIE_OPTIONS, chooseCookieDomain } = require('../../lib/markos/tenant/cookie-scope.cjs');

test('Suite 201-05: MARKOS_COOKIE_OPTIONS defaults enforce sameSite=lax + httpOnly + secure', () => {
  assert.equal(MARKOS_COOKIE_OPTIONS.sameSite, 'lax');
  assert.equal(MARKOS_COOKIE_OPTIONS.httpOnly, true);
  assert.equal(MARKOS_COOKIE_OPTIONS.secure, true);
  assert.equal(MARKOS_COOKIE_OPTIONS.path, '/');
  assert.equal(Object.isFrozen(MARKOS_COOKIE_OPTIONS), true);
});

test('Suite 201-05: chooseCookieDomain returns .markos.dev for first-party subdomain', () => {
  assert.equal(chooseCookieDomain({ host: 'acme.markos.dev', apex: 'markos.dev' }), '.markos.dev');
});

test('Suite 201-05: chooseCookieDomain returns .markos.dev for apex itself', () => {
  assert.equal(chooseCookieDomain({ host: 'markos.dev', apex: 'markos.dev' }), '.markos.dev');
});

test('Suite 201-05: chooseCookieDomain returns null for BYOD custom domain (Pitfall 2 isolation)', () => {
  assert.equal(chooseCookieDomain({ host: 'acme.com', apex: 'markos.dev' }), null);
});

test('Suite 201-05: chooseCookieDomain handles invalid input', () => {
  assert.equal(chooseCookieDomain(null), null);
  assert.equal(chooseCookieDomain({}), null);
  assert.equal(chooseCookieDomain({ host: 'x' }), null);
});
