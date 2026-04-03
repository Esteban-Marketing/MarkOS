'use strict';

/**
 * lib/markos/plugins/loader.js
 *
 * Boot-time plugin loader with per-plugin error boundaries.
 *
 * Phase 52 — PLG-DA-01
 * Decision D-01: Plugins cannot block server startup; each validation/load is
 *   wrapped in a try-catch. Failures are recorded but do not halt the process.
 * Decision D-02: Only first-party plugins are supported in Phase 52.
 *   No marketplace/third-party install paths are exposed.
 */

const { registerPlugin, createRegistry, listPlugins } = require('./registry.js');

/**
 * loadPlugins(manifests) → { registry, failures }
 *
 * Accepts an array of plugin manifest objects and boots them into a registry.
 * Each manifest is validated and registered individually. If a manifest fails
 * validation or registration, it is captured as a failure without interrupting
 * the remaining plugins.
 *
 * Returns:
 *   registry  — the populated plugin registry (empty if no valid plugins)
 *   failures  — array of { manifest, error } for each failed plugin
 *
 * This maintains fail-closed boot semantics: invalid plugins are unreachable
 * while valid plugins continue operating normally.
 *
 * @param {object[]} manifests
 * @returns {{ registry: object, failures: Array<{ manifest: object, error: Error }> }}
 */
function loadPlugins(manifests) {
  if (!Array.isArray(manifests)) {
    const err = new Error('INVALID_PLUGIN_LIST:manifests must be an array');
    err.code = 'INVALID_PLUGIN_LIST';
    throw err;
  }

  let registry = createRegistry();
  const failures = [];

  for (const manifest of manifests) {
    try {
      registry = registerPlugin(manifest, { registry });
    } catch (err) {
      failures.push({ manifest, error: err });
    }
  }

  return { registry, failures };
}

module.exports = {
  loadPlugins,
  // NOTE: installPlugin, loadFromMarketplace, addThirdPartyPlugin are
  // intentionally NOT exported. Marketplace/third-party install is out of
  // scope for Phase 52 (deferred to Phase 54+).
};
