'use strict';

// Phase 204 Plan 01 Task 2: profile resolution tests.

const test = require('node:test');
const assert = require('node:assert/strict');
const { withTmpXDG } = require('./_fixtures/xdg-tmp.cjs');

function freshConfig() {
  const p = require.resolve('../../bin/lib/cli/config.cjs');
  delete require.cache[p];
  return require('../../bin/lib/cli/config.cjs');
}

test('profiles-01: resolveProfile returns --profile value when cli.profile set', async () => {
  await withTmpXDG(async () => {
    const { resolveProfile } = freshConfig();
    const r = resolveProfile({ profile: 'prod' });
    assert.equal(r, 'prod');
  });
});

test('profiles-02: resolveProfile returns MARKOS_PROFILE env when no --profile', async () => {
  await withTmpXDG(async () => {
    process.env.MARKOS_PROFILE = 'staging';
    try {
      const { resolveProfile } = freshConfig();
      const r = resolveProfile({});
      assert.equal(r, 'staging');
    } finally {
      delete process.env.MARKOS_PROFILE;
    }
  });
});

test('profiles-03: resolveProfile defaults to "default" when no env / config / flag', async () => {
  await withTmpXDG(async () => {
    const { resolveProfile } = freshConfig();
    const r = resolveProfile({});
    assert.equal(r, 'default');
  });
});

test('profiles-04: resolveProfile uses config.active_profile when no flag / env', async () => {
  await withTmpXDG(async () => {
    const cfg = freshConfig();
    cfg.saveConfig({ active_profile: 'work' });
    // Re-require so loadConfig reads the fresh file.
    const cfg2 = freshConfig();
    const r = cfg2.resolveProfile({});
    assert.equal(r, 'work');
  });
});

test('profiles-05: --profile flag wins over MARKOS_PROFILE env', async () => {
  await withTmpXDG(async () => {
    process.env.MARKOS_PROFILE = 'from-env';
    try {
      const { resolveProfile } = freshConfig();
      const r = resolveProfile({ profile: 'from-flag' });
      assert.equal(r, 'from-flag');
    } finally {
      delete process.env.MARKOS_PROFILE;
    }
  });
});

test('profiles-06: loadConfig returns DEFAULT_CONFIG when file missing', async () => {
  await withTmpXDG(async () => {
    const { loadConfig, DEFAULT_CONFIG } = freshConfig();
    const cfg = loadConfig();
    assert.equal(cfg.active_profile, DEFAULT_CONFIG.active_profile);
    assert.equal(cfg.format, DEFAULT_CONFIG.format);
    assert.equal(cfg.telemetry, DEFAULT_CONFIG.telemetry);
  });
});

test('profiles-07: saveConfig merges patch into existing config', async () => {
  await withTmpXDG(async () => {
    const cfg = freshConfig();
    cfg.saveConfig({ active_profile: 'a' });
    const cfg2 = freshConfig();
    cfg2.saveConfig({ telemetry: true });
    const merged = freshConfig().loadConfig();
    assert.equal(merged.active_profile, 'a');
    assert.equal(merged.telemetry, true);
  });
});
