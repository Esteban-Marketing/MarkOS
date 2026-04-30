'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { maskSecret } = require('../../../lib/markos/cli/env.cjs');

test('204.1 D-06 maskSecret: long secret shows only the last 4 characters', () => {
  const value = 'postgres://user:secret@db.foo.com:5432/postgres';
  const masked = maskSecret(value);
  assert.equal(masked.length, value.length);
  assert.equal(masked.slice(-4), 'gres');
  assert.equal(masked.slice(0, -4), '*'.repeat(value.length - 4));
  assert.ok(!masked.includes('postgres://'));
  assert.ok(!masked.includes('secret'));
});

test('204.1 D-06 maskSecret: family prefixes never remain visible', () => {
  assert.equal(maskSecret('sk_live_abc123def').slice(0, 4), '****');
  assert.equal(maskSecret('AKIAIOSFODNN7EXAMPLE').slice(-4), 'MPLE');
  assert.equal(maskSecret('ghp_aaaaaaaaaaaaaaaaaa').slice(-4), 'aaaa');
});

test('204.1 D-06 maskSecret: short secrets are fully masked', () => {
  assert.equal(maskSecret('abc'), '***');
  assert.equal(maskSecret('1234567'), '*******');
  assert.equal(maskSecret(''), '');
});

test('204.1 D-06 maskSecret: exactly 8 characters still reveal the last 4', () => {
  assert.equal(maskSecret('abcd1234'), '****1234');
});

test('204.1 D-06 maskSecret: nullish values are tolerated', () => {
  assert.equal(maskSecret(null), '');
  assert.equal(maskSecret(undefined), '');
});
