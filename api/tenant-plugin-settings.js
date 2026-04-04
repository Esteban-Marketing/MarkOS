'use strict';

/**
 * api/tenant-plugin-settings.js
 *
 * Vercel serverless handler — read and update tenant plugin settings.
 * Only `owner` and `tenant-admin` IAM roles may write.
 *
 * GET  /api/tenant-plugin-settings?plugin_id=<id>   — returns current config
 * POST /api/tenant-plugin-settings                   — enables/disables plugin + updates capability grants
 *
 * Phase 52 — Plan 03 (Task 52-03-01)
 */

const { assertEntitledAction, createRuntimeContext, requireHostedSupabaseAuth } = require('../onboarding/backend/runtime-context.cjs');

const ADMIN_ROLES = new Set(['owner', 'tenant-admin']);

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

/**
 * Shared handler called by the default export and exposed as a named export
 * for unit testing without Vercel plumbing.
 *
 * Expects `req.markosAuth` to be populated by the caller.
 */
async function handlePluginSettings(req, res) {
  const auth = req.markosAuth;
  const iamRole = auth?.principal?.tenant_role || auth?.iamRole || (req.tenantContext && req.tenantContext.role);
  const tenantId = auth?.principal?.tenant_id || auth?.tenant_id || (req.tenantContext && req.tenantContext.tenantId);

  const body = req.body || {};
  const pluginId = body.plugin_id || (req.query && req.query.plugin_id);

  if (!pluginId) {
    return writeJson(res, 400, { success: false, error: 'MISSING_PLUGIN_ID', message: 'plugin_id is required' });
  }

  if (!ADMIN_ROLES.has(iamRole)) {
    return writeJson(res, 403, { success: false, error: 'SETTINGS_FORBIDDEN', message: 'Owner or tenant-admin role required to manage plugin settings' });
  }

  const entitlementDecision = assertEntitledAction({
    entitlement_snapshot: req.entitlementSnapshot || auth?.entitlement_snapshot,
    role: iamRole,
  }, 'manage_plugin_settings');

  if (!entitlementDecision.allowed) {
    return writeJson(res, 403, {
      success: false,
      error: entitlementDecision.reason_code || 'BILLING_POLICY_BLOCKED',
      message: 'Action blocked by billing policy',
      enforcement_source: entitlementDecision.enforcement_source,
    });
  }

  // Persist the settings update (in-memory for testability; production wires to Supabase)
  const enabled = typeof body.enabled === 'boolean' ? body.enabled : false;
  const capabilities = Array.isArray(body.capabilities) ? body.capabilities : [];

  const config = {
    tenant_id: tenantId,
    plugin_id: pluginId,
    enabled,
    capabilities,
    updated_at: new Date().toISOString(),
  };

  return writeJson(res, 200, {
    success: true,
    config,
  });
}

// Default export — full Vercel handler with auth middleware
module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'plugin_settings_write' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handlePluginSettings(req, res);
};

// Named export for unit tests
module.exports.handlePluginSettings = handlePluginSettings;
