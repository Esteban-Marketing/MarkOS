'use strict';

/**
 * lib/markos/plugins/digital-agency/plugin-guard.js
 *
 * Lightweight capability gate for Digital Agency route handlers.
 *
 * Reads plugin enabled state and granted capabilities from
 * req.tenantContext (populated by auth middleware in production).
 * For Phase 52 unit tests, tenantContext is supplied directly.
 *
 * Returns {ok: true} on success, or writes 404/403 and returns {ok: false}.
 */

/**
 * pluginGuard(req, res, requiredCapability)
 *
 * Fail-closed: checks plugin enabled, then checks capability granted.
 * Plugin disabled → 404 PLUGIN_DISABLED
 * Capability missing → 403 CAPABILITY_NOT_GRANTED
 *
 * @param {object} req
 * @param {object} res
 * @param {string} requiredCapability
 * @returns {{ ok: boolean }}
 */
function pluginGuard(req, res, requiredCapability) {
  const ctx = req.tenantContext;

  if (!ctx || !ctx.pluginEnabled) {
    res.status(404).json({
      success: false,
      error: 'PLUGIN_DISABLED',
      message: 'The Digital Agency plugin is not enabled for this tenant.',
    });
    return { ok: false };
  }

  const caps = Array.isArray(ctx.grantedCapabilities) ? ctx.grantedCapabilities : [];
  if (!caps.includes(requiredCapability)) {
    res.status(403).json({
      success: false,
      error: 'CAPABILITY_NOT_GRANTED',
      message: `Capability '${requiredCapability}' not granted for this tenant.`,
    });
    return { ok: false };
  }

  return { ok: true };
}

module.exports = { pluginGuard };
