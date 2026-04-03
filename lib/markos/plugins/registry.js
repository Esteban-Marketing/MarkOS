'use strict';

/**
 * lib/markos/plugins/registry.js
 *
 * Deterministic plugin registry with immutable metadata and fail-closed semantics.
 *
 * Phase 52 — PLG-DA-01
 * Decision D-01: Registration order is preserved (insertion order, Map-backed).
 * Decision D-02: Registry stores validated, frozen plugin entries.
 *
 * The registry is an opaque value (plain object with a Map). Callers should not
 * mutate it directly — use the exported functions.
 */

const { validatePluginContract } = require('./contracts.js');

/**
 * createRegistry() → Registry
 *
 * Creates a fresh empty registry. Internal structure is intentionally opaque.
 * @returns {{ plugins: Map<string, object> }}
 */
function createRegistry() {
  return { plugins: new Map() };
}

/**
 * registerPlugin(manifest, opts) → Registry
 *
 * Validates and registers a plugin manifest. Returns the (potentially new) registry.
 *
 * Options:
 *   fresh?: boolean  — create a brand-new registry (ignores any existing registry)
 *   registry?: Registry — existing registry to add to; required when fresh=false
 *
 * Throws with code INVALID_PLUGIN_CONTRACT if validation fails.
 * Idempotent for identical registrations: registering the same plugin id twice is a no-op.
 *
 * @param {object} manifest
 * @param {{ fresh?: boolean, registry?: object }} opts
 * @returns {{ plugins: Map<string, object> }}
 */
function registerPlugin(manifest, opts = {}) {
  const validation = validatePluginContract(manifest);
  if (!validation.ok) {
    const err = new Error(`INVALID_PLUGIN_CONTRACT:${validation.code} — ${validation.detail}`);
    err.code = 'INVALID_PLUGIN_CONTRACT';
    err.contractCode = validation.code;
    throw err;
  }

  const registry = opts.fresh ? createRegistry() : (opts.registry || createRegistry());

  // Idempotent: skip if same id already registered
  if (registry.plugins.has(manifest.id)) {
    return registry;
  }

  // Freeze a clean copy of the manifest for immutability
  const frozen = Object.freeze({
    id: String(manifest.id),
    version: String(manifest.version),
    name: String(manifest.name),
    description: manifest.description ? String(manifest.description) : '',
    requiredCapabilities: Object.freeze([...manifest.requiredCapabilities]),
    requiredIamRoles: Object.freeze([...manifest.requiredIamRoles]),
    routes: Object.freeze(manifest.routes.map((r) => Object.freeze({ ...r }))),
    handlers: manifest.handlers ? Object.freeze({ ...manifest.handlers }) : Object.freeze({}),
    hooks: manifest.hooks ? Object.freeze({ ...manifest.hooks }) : Object.freeze({}),
  });

  registry.plugins.set(frozen.id, frozen);
  return registry;
}

/**
 * listPlugins(registry) → object[]
 *
 * Returns all registered plugins in insertion (registration) order.
 * Returned array is a snapshot — mutations do not affect the registry.
 *
 * @param {{ plugins: Map<string, object> }} registry
 * @returns {object[]}
 */
function listPlugins(registry) {
  if (!registry || !(registry.plugins instanceof Map)) {
    return [];
  }
  return [...registry.plugins.values()];
}

/**
 * resolvePlugin(registry, pluginId) → object | null
 *
 * Returns the frozen plugin entry for the given id, or null if not registered.
 *
 * @param {{ plugins: Map<string, object> }} registry
 * @param {string} pluginId
 * @returns {object | null}
 */
function resolvePlugin(registry, pluginId) {
  if (!registry || !(registry.plugins instanceof Map)) {
    return null;
  }
  return registry.plugins.get(pluginId) ?? null;
}

module.exports = {
  createRegistry,
  registerPlugin,
  listPlugins,
  resolvePlugin,
};
