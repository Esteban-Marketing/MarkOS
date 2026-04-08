'use strict';

const { canPerformAction } = require('../../lib/markos/rbac/iam-v32.js');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const {
  buildGovernanceEvidencePack,
  buildAccessReviewSnapshot,
  buildRetentionExportRecord,
  buildDeletionWorkflowRecord,
  buildPhase64CloseoutRecord,
} = require('../../lib/markos/governance/evidence-pack.cjs');

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

  const tenantId = auth.tenant_id || auth.principal?.tenant_id || 'tenant-alpha-001';
  const evidencePack = buildGovernanceEvidencePack({ tenant_id: tenantId });
  const retentionExport = buildRetentionExportRecord({
    tenant_id: tenantId,
    evidence_pack_id: evidencePack.evidence_pack_id,
  });
  const deletionWorkflow = buildDeletionWorkflowRecord({
    tenant_id: tenantId,
    evidence_pack_id: evidencePack.evidence_pack_id,
    export_record_id: retentionExport.export_record_id,
    resulting_evidence_ref: evidencePack.evidence_pack_id,
  });
  const reportingCloseout = buildPhase64CloseoutRecord({
    tenant_id: tenantId,
    evidence_pack_id: evidencePack.evidence_pack_id,
  });

  return writeJson(res, 200, {
    success: true,
    evidence_pack: evidencePack,
    access_review: buildAccessReviewSnapshot({ tenant_id: tenantId }),
    retention_export: retentionExport,
    deletion_workflow: deletionWorkflow,
    reporting_closeout: reportingCloseout,
  });
};