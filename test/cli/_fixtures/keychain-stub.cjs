'use strict';

// Phase 204 Plan 01 Task 2: In-memory keytar shim for tests.
//
// Exposes getPassword/setPassword/deletePassword/findCredentials operating on
// a Map keyed by `${service}::${account}`. Installed into require.cache so
// `bin/lib/cli/keychain.cjs`'s `require('keytar')` resolves here.

const store = new Map();

function keyFor(service, account) {
  return `${service}::${account}`;
}

async function getPassword(service, account) {
  const v = store.get(keyFor(service, account));
  return v === undefined ? null : v;
}

async function setPassword(service, account, password) {
  store.set(keyFor(service, account), password);
}

async function deletePassword(service, account) {
  return store.delete(keyFor(service, account));
}

async function findCredentials(service) {
  const prefix = `${service}::`;
  const out = [];
  for (const [k, v] of store.entries()) {
    if (k.startsWith(prefix)) {
      out.push({ account: k.slice(prefix.length), password: v });
    }
  }
  return out;
}

function reset() {
  store.clear();
}

function configureShouldThrow(fn) {
  // Allow tests to force throws from methods by replacing exports.
  module.exports.getPassword = fn || getPassword;
}

const api = {
  getPassword,
  setPassword,
  deletePassword,
  findCredentials,
  reset,
  configureShouldThrow,
  _store: store,
};

module.exports = api;

// Installer: call from a test to register this stub as the `keytar` module.
// Usage: require('./_fixtures/keychain-stub.cjs').installAsKeytar();
module.exports.installAsKeytar = function installAsKeytar() {
  const Module = require('node:module');
  const stub = api;
  const origResolve = Module._resolveFilename;
  Module._resolveFilename = function patchedResolve(request, ...rest) {
    if (request === 'keytar') return require('node:path').resolve(__dirname, 'keychain-stub.cjs');
    return origResolve.call(this, request, ...rest);
  };
  // Also drop into cache directly.
  require.cache[require.resolve('./keychain-stub.cjs')] = {
    id: require.resolve('./keychain-stub.cjs'),
    filename: require.resolve('./keychain-stub.cjs'),
    loaded: true,
    exports: stub,
  };
};
