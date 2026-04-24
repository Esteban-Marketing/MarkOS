'use strict';

// Phase 204 Plan 01 Task 2: keychain primitive tests.
//
// Strategy: inject an in-memory keytar stub via require.cache override BEFORE
// requiring keychain.cjs. Tests cover:
//   - MARKOS_API_KEY env var precedence (beats keytar)
//   - keytar success path
//   - keytar-throw -> XDG fallback (writes 0o600 file)
//   - deleteToken removes line from XDG file

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { withTmpXDG } = require('./_fixtures/xdg-tmp.cjs');
const keytarStub = require('./_fixtures/keychain-stub.cjs');

// Monkey-patch Module._resolveFilename to map 'keytar' -> our stub path.
// This must happen BEFORE keychain.cjs is loaded.
const stubPath = require.resolve('./_fixtures/keychain-stub.cjs');
const Module = require('node:module');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function patched(request, ...rest) {
  if (request === 'keytar') return stubPath;
  return origResolve.call(this, request, ...rest);
};

// Prime require.cache so require('keytar') returns our stub.
require.cache[stubPath] = {
  id: stubPath,
  filename: stubPath,
  loaded: true,
  exports: keytarStub,
};

// Now lazy-load keychain so the patch is live.
function freshKeychain() {
  const p = require.resolve('../../bin/lib/cli/keychain.cjs');
  delete require.cache[p];
  const mod = require('../../bin/lib/cli/keychain.cjs');
  mod._resetWarningStateForTests();
  return mod;
}

test('keychain-01: MARKOS_API_KEY env var beats keytar', async () => {
  await withTmpXDG(async () => {
    keytarStub.reset();
    await keytarStub.setPassword('markos-cli', 'default', 'from-keytar');
    process.env.MARKOS_API_KEY = 'from-env';
    try {
      const keychain = freshKeychain();
      const v = await keychain.getToken('default');
      assert.equal(v, 'from-env');
    } finally {
      delete process.env.MARKOS_API_KEY;
    }
  });
});

test('keychain-02: keytar success path returns keytar value when env unset', async () => {
  await withTmpXDG(async () => {
    keytarStub.reset();
    await keytarStub.setPassword('markos-cli', 'default', 'tok-from-keytar');
    const keychain = freshKeychain();
    const v = await keychain.getToken('default');
    assert.equal(v, 'tok-from-keytar');
  });
});

test('keychain-03: keytar throw -> XDG fallback writes file', async () => {
  await withTmpXDG(async (dir) => {
    keytarStub.reset();
    // Force setPassword to throw to trigger XDG fallback.
    const savedSet = keytarStub.setPassword;
    keytarStub.setPassword = async () => { throw new Error('Secret Service not available'); };
    try {
      const keychain = freshKeychain();
      await keychain.setToken('default', 'xdg-token');
      const credPath = keychain.xdgCredPath();
      assert.ok(fs.existsSync(credPath), 'XDG credentials file should exist');
      const text = fs.readFileSync(credPath, 'utf8');
      assert.match(text, /default=xdg-token/);
      // File permissions check (Unix-only meaningful).
      if (process.platform !== 'win32') {
        const stat = fs.statSync(credPath);
        const mode = stat.mode & 0o777;
        assert.equal(mode, 0o600, `XDG file should be 0o600, got 0o${mode.toString(8)}`);
      }
    } finally {
      keytarStub.setPassword = savedSet;
    }
  });
});

test('keychain-04: deleteToken removes line from XDG file', async () => {
  await withTmpXDG(async () => {
    keytarStub.reset();
    const keychain = freshKeychain();
    // Write via keytar stub first.
    await keychain.setToken('alpha', 'aaa');
    await keychain.setToken('beta', 'bbb');
    await keychain.deleteToken('alpha');
    // keytar stub should no longer have alpha.
    const v = await keychain.getToken('alpha');
    assert.equal(v, null, 'alpha should be deleted');
    const v2 = await keychain.getToken('beta');
    assert.equal(v2, 'bbb', 'beta should survive');
  });
});

test('keychain-05: listProfiles returns unique sorted profiles', async () => {
  await withTmpXDG(async () => {
    keytarStub.reset();
    const keychain = freshKeychain();
    await keychain.setToken('prod', 'p');
    await keychain.setToken('default', 'd');
    await keychain.setToken('staging', 's');
    const profiles = await keychain.listProfiles();
    assert.deepEqual(profiles, ['default', 'prod', 'staging']);
  });
});
