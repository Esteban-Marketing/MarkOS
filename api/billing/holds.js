'use strict';

const { canPerformAction } = require('../../lib/markos/rbac/iam-v32.js');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const { deriveProviderSyncOutcome } = require('../../lib/markos/billing/provider-sync.cjs');

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }

  const iamRole = auth.iamRole || auth.role || auth.principal?.tenant_role || 'readonly';
  if (!canPerformAction(iamRole, 'manage_billing')) {
    return writeJson(res, 403, { success: false, error: 'BILLING_ADMIN_REQUIRED', message: 'manage_billing permission required' });
  }

  const hold = deriveProviderSyncOutcome({
    line_items: [],
    provider: 'stripe',
    sync_status: 'failed',
    failure_code: 'PAYMENT_METHOD_DECLINED',
  });

  return writeJson(res, 200, {
    success: true,
    hold,
  });
};