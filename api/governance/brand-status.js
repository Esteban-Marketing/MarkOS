'use strict';

// NOTE: active-pointer state (_activePointers, _traceabilityLog) is in-memory and ephemeral
// per serverless process instance. State does not persist across cold starts.
const { getActiveBundle, getTraceabilityLog } = require('../../onboarding/backend/brand-governance/active-pointer.cjs');
const { canPerformAction } = require('../../lib/markos/rbac/iam-v32.js');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function isGovernanceAuthorized(role) {
  return canPerformAction(role, 'manage_billing') || canPerformAction(role, 'manage_users');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }

  const iamRole = auth.iamRole || auth.role || auth.principal?.tenant_role || 'readonly';
  if (!isGovernanceAuthorized(iamRole)) {
    return writeJson(res, 403, {
      success: false,
      error: 'GOVERNANCE_ADMIN_REQUIRED',
      message: 'billing or user administration permission required',
    });
  }

  const tenantId = auth.tenant_id || auth.principal?.tenant_id || 'tenant-alpha-001';
  const activeBundle = getActiveBundle(tenantId);
  const traceabilityLog = getTraceabilityLog().filter((e) => e.tenant_id === tenantId);

  return writeJson(res, 200, {
    success: true,
    active_bundle: activeBundle,
    traceability_log: traceabilityLog,
  });
};
