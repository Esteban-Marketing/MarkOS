'use strict';

/**
 * test/plugin-registry.test.js
 *
 * Wave 0 TDD scaffolds for PLG-DA-01: plugin runtime contracts, registration,
 * loader boundary enforcement, and first-party plugin determinism.
 *
 * Phase 52 — Plan 01, Task 52-01-01 (RED state — implementation pending)
 * RED → GREEN wired in Task 52-01-02.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { validatePluginContract, PLUGIN_CONTRACT_VERSION } = require('../lib/markos/plugins/contracts.js');
const { registerPlugin, listPlugins, resolvePlugin } = require('../lib/markos/plugins/registry.js');
const { loadPlugins } = require('../lib/markos/plugins/loader.js');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_CONTRACT = {
  id: 'test-plugin-v1',
  version: '1.0.0',
  name: 'Test Plugin',
  description: 'Minimal first-party test plugin',
  requiredCapabilities: ['read_drafts'],
  requiredIamRoles: ['manager'],
  routes: [
    {
      path: '/plugins/test-plugin/dashboard',
      method: 'GET',
      handler: async (_req, _res) => {},
    },
  ],
};

const INVALID_NO_ID = { version: '1.0.0', name: 'No ID Plugin', requiredCapabilities: [], requiredIamRoles: [], routes: [] };
const INVALID_NO_CAPS = { id: 'missing-caps', version: '1.0.0', name: 'p', requiredIamRoles: [], routes: [] };
const INVALID_NO_ROUTES = { id: 'no-routes', version: '1.0.0', name: 'p', requiredCapabilities: [], requiredIamRoles: [] };

// ---------------------------------------------------------------------------
// Contract validation
// ---------------------------------------------------------------------------

test('PLUGIN_CONTRACT_VERSION exported as non-empty string', () => {
  assert.equal(typeof PLUGIN_CONTRACT_VERSION, 'string');
  assert.ok(PLUGIN_CONTRACT_VERSION.length > 0);
});

test('validatePluginContract: valid manifest returns ok=true', () => {
  const result = validatePluginContract(VALID_CONTRACT);
  assert.equal(result.ok, true, `Expected ok=true, got: ${JSON.stringify(result)}`);
});

test('validatePluginContract: missing id returns ok=false with MISSING_PLUGIN_ID code', () => {
  const result = validatePluginContract(INVALID_NO_ID);
  assert.equal(result.ok, false);
  assert.match(result.code, /MISSING_PLUGIN_ID/);
});

test('validatePluginContract: missing requiredCapabilities returns ok=false with MISSING_CAPABILITIES code', () => {
  const result = validatePluginContract(INVALID_NO_CAPS);
  assert.equal(result.ok, false);
  assert.match(result.code, /MISSING_CAPABILITIES/);
});

test('validatePluginContract: missing routes array returns ok=false with MISSING_ROUTES code', () => {
  const result = validatePluginContract(INVALID_NO_ROUTES);
  assert.equal(result.ok, false);
  assert.match(result.code, /MISSING_ROUTES/);
});

test('validatePluginContract: null/undefined input returns ok=false with INVALID_MANIFEST code', () => {
  assert.equal(validatePluginContract(null).ok, false);
  assert.match(validatePluginContract(null).code, /INVALID_MANIFEST/);
  assert.equal(validatePluginContract(undefined).ok, false);
});

// ---------------------------------------------------------------------------
// Registry — deterministic registration order
// ---------------------------------------------------------------------------

test('registerPlugin: valid contract registers successfully and is listable', () => {
  const registry = registerPlugin(VALID_CONTRACT, { fresh: true });
  const plugins = listPlugins(registry);
  assert.ok(Array.isArray(plugins));
  assert.equal(plugins.length, 1);
  assert.equal(plugins[0].id, VALID_CONTRACT.id);
});

test('registerPlugin: duplicate id registration is idempotent (same contract)', () => {
  let registry = registerPlugin(VALID_CONTRACT, { fresh: true });
  registry = registerPlugin(VALID_CONTRACT, { registry });
  const plugins = listPlugins(registry);
  assert.equal(plugins.length, 1);
});

test('registerPlugin: invalid contract throws with INVALID_PLUGIN_CONTRACT error', () => {
  assert.throws(
    () => registerPlugin(INVALID_NO_ID, { fresh: true }),
    (err) => {
      assert.match(err.message, /INVALID_PLUGIN_CONTRACT/);
      return true;
    }
  );
});

test('registerPlugin: registration order is deterministic (insertion order preserved)', () => {
  const contractA = { ...VALID_CONTRACT, id: 'plugin-alpha' };
  const contractB = { ...VALID_CONTRACT, id: 'plugin-beta' };
  let registry = registerPlugin(contractA, { fresh: true });
  registry = registerPlugin(contractB, { registry });
  const plugins = listPlugins(registry);
  assert.equal(plugins[0].id, 'plugin-alpha');
  assert.equal(plugins[1].id, 'plugin-beta');
});

test('resolvePlugin: returns registered plugin by id', () => {
  const registry = registerPlugin(VALID_CONTRACT, { fresh: true });
  const plugin = resolvePlugin(registry, VALID_CONTRACT.id);
  assert.ok(plugin);
  assert.equal(plugin.id, VALID_CONTRACT.id);
});

test('resolvePlugin: returns null for unknown plugin id', () => {
  const registry = registerPlugin(VALID_CONTRACT, { fresh: true });
  const plugin = resolvePlugin(registry, 'does-not-exist');
  assert.equal(plugin, null);
});

test('resolved plugin metadata is immutable (frozen)', () => {
  const registry = registerPlugin(VALID_CONTRACT, { fresh: true });
  const plugin = resolvePlugin(registry, VALID_CONTRACT.id);
  assert.throws(() => {
    plugin.id = 'mutated';
  });
});

// ---------------------------------------------------------------------------
// Loader — fail-closed boot with error boundaries
// ---------------------------------------------------------------------------

test('loadPlugins: valid plugin array boots without error', () => {
  const result = loadPlugins([VALID_CONTRACT]);
  assert.ok(result.registry);
  assert.equal(result.failures.length, 0);
});

test('loadPlugins: invalid plugin does not halt boot (error boundary)', () => {
  const result = loadPlugins([VALID_CONTRACT, INVALID_NO_ID]);
  // Valid plugin still loaded
  assert.equal(listPlugins(result.registry).length, 1);
  // Invalid plugin recorded as failure
  assert.equal(result.failures.length, 1);
  assert.ok(result.failures[0].error);
});

test('loadPlugins: empty array returns empty registry with no failures', () => {
  const result = loadPlugins([]);
  assert.equal(listPlugins(result.registry).length, 0);
  assert.equal(result.failures.length, 0);
});

test('loadPlugins: marketplace/third-party plugin install flag is explicitly unsupported', () => {
  // verify loader does not expose any install-from-registry or third-party path
  const { installPlugin, loadFromMarketplace, addThirdPartyPlugin } = require('../lib/markos/plugins/loader.js');
  assert.equal(installPlugin, undefined, 'installPlugin must not be exported in Phase 52');
  assert.equal(loadFromMarketplace, undefined, 'loadFromMarketplace must not be exported in Phase 52');
  assert.equal(addThirdPartyPlugin, undefined, 'addThirdPartyPlugin must not be exported in Phase 52');
});
