'use strict';

/**
 * lib/markos/plugins/contracts.js
 *
 * Canonical plugin contract schema and validation for MarkOS v3.2 plugin runtime.
 *
 * Phase 52 — PLG-DA-01
 * Decision D-01: In-process CommonJS plugin loading with fail-closed validation.
 * Decision D-02: Capabilities layer + IAM role fallback.
 */

/**
 * PLUGIN_CONTRACT_VERSION — semver for the plugin manifest schema.
 * Increment on breaking changes to the contract shape.
 */
const PLUGIN_CONTRACT_VERSION = '1.0.0';

/**
 * PLUGIN_CAPABILITIES — canonical capability identifiers for Phase 52.
 * Phase 54 may extend. All strings are lowercase dot-separated namespaces.
 */
const PLUGIN_CAPABILITIES = Object.freeze([
  'read_drafts',
  'read_campaigns',
  'write_campaigns',
  'publish_campaigns',
  'read_approvals',
  'write_approvals',
  'read_telemetry',
  'trigger_workflows',
]);

/**
 * REQUIRED_MANIFEST_FIELDS — top-level keys that every plugin must declare.
 */
const REQUIRED_MANIFEST_FIELDS = Object.freeze([
  'id',
  'version',
  'name',
  'requiredCapabilities',
  'requiredIamRoles',
  'routes',
]);

/**
 * validatePluginContract(manifest) → { ok: boolean, code?: string, detail?: string }
 *
 * Validates a plugin manifest against the Phase 52 contract schema.
 * Returns fail-closed: any invalid or missing field → ok=false with a
 * deterministic error code.
 *
 * Error codes:
 *   INVALID_MANIFEST      — null/undefined/non-object input
 *   MISSING_PLUGIN_ID     — id field absent or empty
 *   MISSING_PLUGIN_VERSION — version field absent or empty
 *   MISSING_PLUGIN_NAME   — name field absent or empty
 *   MISSING_CAPABILITIES  — requiredCapabilities field absent or not an array
 *   MISSING_IAM_ROLES     — requiredIamRoles field absent or not an array
 *   MISSING_ROUTES        — routes field absent or not an array
 *   INVALID_ROUTE         — a route entry is missing path, method, or handler
 *
 * @param {unknown} manifest
 * @returns {{ ok: boolean, code?: string, detail?: string }}
 */
function validatePluginContract(manifest) {
  if (manifest === null || manifest === undefined || typeof manifest !== 'object') {
    return { ok: false, code: 'INVALID_MANIFEST', detail: 'Plugin manifest must be a non-null object' };
  }

  if (!manifest.id || typeof manifest.id !== 'string' || manifest.id.trim().length === 0) {
    return { ok: false, code: 'MISSING_PLUGIN_ID', detail: 'Plugin manifest must declare a non-empty string id' };
  }

  if (!manifest.version || typeof manifest.version !== 'string' || manifest.version.trim().length === 0) {
    return { ok: false, code: 'MISSING_PLUGIN_VERSION', detail: 'Plugin manifest must declare a non-empty version string' };
  }

  if (!manifest.name || typeof manifest.name !== 'string' || manifest.name.trim().length === 0) {
    return { ok: false, code: 'MISSING_PLUGIN_NAME', detail: 'Plugin manifest must declare a non-empty name string' };
  }

  if (!Array.isArray(manifest.requiredCapabilities)) {
    return { ok: false, code: 'MISSING_CAPABILITIES', detail: 'Plugin manifest must declare requiredCapabilities as an array' };
  }

  if (!Array.isArray(manifest.requiredIamRoles)) {
    return { ok: false, code: 'MISSING_IAM_ROLES', detail: 'Plugin manifest must declare requiredIamRoles as an array' };
  }

  if (!Array.isArray(manifest.routes)) {
    return { ok: false, code: 'MISSING_ROUTES', detail: 'Plugin manifest must declare routes as an array' };
  }

  for (let i = 0; i < manifest.routes.length; i++) {
    const route = manifest.routes[i];
    if (!route || typeof route !== 'object') {
      return { ok: false, code: 'INVALID_ROUTE', detail: `Route at index ${i} must be an object` };
    }
    if (!route.path || typeof route.path !== 'string') {
      return { ok: false, code: 'INVALID_ROUTE', detail: `Route at index ${i} must declare a string path` };
    }
    if (!route.method || !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(route.method)) {
      return { ok: false, code: 'INVALID_ROUTE', detail: `Route at index ${i} must declare a valid HTTP method` };
    }
    if (typeof route.handler !== 'function') {
      return { ok: false, code: 'INVALID_ROUTE', detail: `Route at index ${i} must declare a handler function` };
    }
  }

  return { ok: true };
}

module.exports = {
  PLUGIN_CONTRACT_VERSION,
  PLUGIN_CAPABILITIES,
  validatePluginContract,
};
