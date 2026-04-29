'use strict';

// Phase 201.1 D-107 (closes M2): Unit tests for byod-grace.cjs
// TDD RED pass — written before implementation.

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isWithinByodGraceWindow, gracePathEnabled, BYOD_GRACE_WINDOW_MS } =
  require('../../lib/markos/tenant/byod-grace.cjs');

const MS_23H = 23 * 60 * 60 * 1000;
const MS_25H = 25 * 60 * 60 * 1000;

describe('byod-grace: isWithinByodGraceWindow', () => {
  it('returns true for status=failed + last_verified_at = 23h ago (within window)', () => {
    const now = Date.now();
    const row = { status: 'failed', last_verified_at: new Date(now - MS_23H).toISOString() };
    assert.equal(isWithinByodGraceWindow(row, now), true);
  });

  it('returns false for status=failed + last_verified_at = 25h ago (outside window)', () => {
    const now = Date.now();
    const row = { status: 'failed', last_verified_at: new Date(now - MS_25H).toISOString() };
    assert.equal(isWithinByodGraceWindow(row, now), false);
  });

  it('returns false for status=verified (grace not applicable to verified rows)', () => {
    const now = Date.now();
    const row = { status: 'verified', last_verified_at: new Date(now - MS_23H).toISOString() };
    assert.equal(isWithinByodGraceWindow(row, now), false);
  });

  it('returns false for status=failed + last_verified_at = null', () => {
    const now = Date.now();
    const row = { status: 'failed', last_verified_at: null };
    assert.equal(isWithinByodGraceWindow(row, now), false);
  });

  it('returns false when MARKOS_BYOD_GRACE_DISABLED=1 (env flag disable)', () => {
    const orig = process.env.MARKOS_BYOD_GRACE_DISABLED;
    try {
      process.env.MARKOS_BYOD_GRACE_DISABLED = '1';
      const now = Date.now();
      const row = { status: 'failed', last_verified_at: new Date(now - MS_23H).toISOString() };
      assert.equal(isWithinByodGraceWindow(row, now), false);
    } finally {
      if (orig === undefined) delete process.env.MARKOS_BYOD_GRACE_DISABLED;
      else process.env.MARKOS_BYOD_GRACE_DISABLED = orig;
    }
  });
});

describe('byod-grace: constants + gracePathEnabled', () => {
  it('BYOD_GRACE_WINDOW_MS is 86400000 (24h)', () => {
    assert.equal(BYOD_GRACE_WINDOW_MS, 86_400_000);
  });

  it('gracePathEnabled returns true when env flag absent', () => {
    const orig = process.env.MARKOS_BYOD_GRACE_DISABLED;
    try {
      delete process.env.MARKOS_BYOD_GRACE_DISABLED;
      assert.equal(gracePathEnabled(), true);
    } finally {
      if (orig !== undefined) process.env.MARKOS_BYOD_GRACE_DISABLED = orig;
    }
  });

  it('gracePathEnabled returns false when MARKOS_BYOD_GRACE_DISABLED=1', () => {
    const orig = process.env.MARKOS_BYOD_GRACE_DISABLED;
    try {
      process.env.MARKOS_BYOD_GRACE_DISABLED = '1';
      assert.equal(gracePathEnabled(), false);
    } finally {
      if (orig === undefined) delete process.env.MARKOS_BYOD_GRACE_DISABLED;
      else process.env.MARKOS_BYOD_GRACE_DISABLED = orig;
    }
  });
});
