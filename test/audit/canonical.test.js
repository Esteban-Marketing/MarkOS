'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { canonicalJson } = require('../../lib/markos/audit/canonical.cjs');

test('Suite 201-02: canonical — key order is stable regardless of insertion order', () => {
  assert.equal(canonicalJson({ b: 2, a: 1 }), '{"a":1,"b":2}');
  assert.equal(canonicalJson({ a: 1, b: 2 }), '{"a":1,"b":2}');
});

test('Suite 201-02: canonical — recursive sort of nested objects', () => {
  assert.equal(canonicalJson({ nested: { z: 1, a: 2 } }), '{"nested":{"a":2,"z":1}}');
});

test('Suite 201-02: canonical — array order preserved', () => {
  assert.equal(canonicalJson([3, 1, 2]), '[3,1,2]');
});

test('Suite 201-02: canonical — Date serializes as ISO string', () => {
  const d = new Date('2026-01-01T00:00:00.000Z');
  assert.equal(canonicalJson({ d }), '{"d":"2026-01-01T00:00:00.000Z"}');
});

test('Suite 201-02: canonical — undefined fields dropped', () => {
  assert.equal(canonicalJson({ a: 1, b: undefined }), '{"a":1}');
});

test('Suite 201-02: canonical — undefined in array becomes null', () => {
  assert.equal(canonicalJson([1, undefined, 3]), '[1,null,3]');
});

test('Suite 201-02: canonical — NaN / Infinity -> null', () => {
  assert.equal(canonicalJson(NaN), 'null');
  assert.equal(canonicalJson(Infinity), 'null');
  assert.equal(canonicalJson({ x: NaN }), '{"x":null}');
});

test('Suite 201-02: canonical — booleans and nulls pass through', () => {
  assert.equal(canonicalJson(true), 'true');
  assert.equal(canonicalJson(false), 'false');
  assert.equal(canonicalJson(null), 'null');
});

test('Suite 201-02: canonical — unicode strings escape correctly', () => {
  assert.equal(canonicalJson({ emoji: '🔐' }), '{"emoji":"🔐"}');
  assert.equal(canonicalJson({ q: 'a"b' }), '{"q":"a\\"b"}');
});

test('Suite 201-02: canonical — mirrors the shape expected by append_markos_audit_row SQL function', () => {
  // This is the exact layout the SQL canonical builder produces.
  const entry = {
    action: 'tenant.created',
    actor_id: 'u-1',
    actor_role: 'owner',
    occurred_at: '2026-04-17T00:00:00.000Z',
    payload: { slug: 'acme' },
    tenant_id: 'tenant-1',
  };
  const expected = '{"action":"tenant.created","actor_id":"u-1","actor_role":"owner","occurred_at":"2026-04-17T00:00:00.000Z","payload":{"slug":"acme"},"tenant_id":"tenant-1"}';
  assert.equal(canonicalJson(entry), expected);
});
