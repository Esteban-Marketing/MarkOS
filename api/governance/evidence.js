'use strict';

const { canPerformAction } = require('../../lib/markos/rbac/iam-v32.js');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const { buildGovernanceEvidencePack, buildAccessReviewSnapshot, buildRetentionExportRecord } = require('../../lib/markos/governance/evidence-pack.cjs');

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function isGovernanceAuthorized(role) {
  return canPerformAction(role, 'manage_billing') || canPerformAction(role, 'manage_users');
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }

  const iamRole = auth.iamRole || auth.role || auth.principal?.tenant_role || 'readonly';
  if (!isGovernanceAuthorized(iamRole)) {
    return writeJson(res, 403, { success: false, error: 'GOVERNANCE_ADMIN_REQUIRED', message: 'billing or user administration permission required' });
  }

  return writeJson(res, 200, {
    success: true,
    evidence_pack: buildGovernanceEvidencePack(),
    access_review: buildAccessReviewSnapshot(),
    retention_export: buildRetentionExportRecord(),
  });
};