'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { isReservedSlug, RESERVED_SLUGS } = require('../../lib/markos/tenant/reserved-slugs.cjs');

test('Suite 201-01: system names are reserved', () => {
  for (const s of ['www', 'api', 'app', 'admin', 'mcp', 'sdk', 'mail', 'status', 'docs', 'blog', 'help', 'support', 'security', 'about', 'pricing', 'integrations']) {
    assert.equal(isReservedSlug(s), true, `${s} must be reserved`);
  }
});

test('Suite 201-01: trademark vendors are reserved (typo-squat defense per 201-CONTEXT specifics)', () => {
  for (const s of ['claude', 'openai', 'anthropic', 'supabase', 'vercel', 'stripe', 'hubspot', 'shopify', 'slack', 'google', 'meta', 'segment', 'resend', 'twilio', 'posthog', 'linear']) {
    assert.equal(isReservedSlug(s), true, `${s} must be reserved`);
  }
});

test('Suite 201-01: protected routes are reserved', () => {
  for (const s of ['signup', 'signin', 'login', 'logout', 'settings', 'billing', 'dashboard', 'invite', 'onboarding', 'auth']) {
    assert.equal(isReservedSlug(s), true, `${s} must be reserved`);
  }
});

test('Suite 201-01: all single-char slugs are reserved', () => {
  for (const c of 'abcdefghijklmnopqrstuvwxyz0123456789') {
    assert.equal(isReservedSlug(c), true, `${c} must be reserved`);
  }
});

test('Suite 201-01: profanity baseline is reserved', () => {
  for (const s of ['fuck', 'shit', 'cunt', 'bitch', 'nigger', 'faggot']) {
    assert.equal(isReservedSlug(s), true, `${s} must be reserved`);
  }
});

test('Suite 201-01: non-reserved slugs pass', () => {
  assert.equal(isReservedSlug('my-cool-workspace'), false);
  assert.equal(isReservedSlug('acme-growth'), false);
  assert.equal(isReservedSlug('esteban-studio'), false);
});

test('Suite 201-01: non-string inputs fail-closed', () => {
  assert.equal(isReservedSlug(null), true);
  assert.equal(isReservedSlug(undefined), true);
  assert.equal(isReservedSlug(42), true);
});

test('Suite 201-01: case-insensitive match', () => {
  assert.equal(isReservedSlug('WWW'), true);
  assert.equal(isReservedSlug('Claude'), true);
  assert.equal(isReservedSlug('  admin  '), true);
});

test('Suite 201-01: RESERVED_SLUGS set size >= 70', () => {
  assert.ok(RESERVED_SLUGS.size >= 70, `expected >= 70 reserved slugs, got ${RESERVED_SLUGS.size}`);
});
