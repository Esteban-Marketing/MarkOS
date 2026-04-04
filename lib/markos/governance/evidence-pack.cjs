'use strict';

function buildGovernanceEvidencePack(input = {}) {
  return Object.freeze({
    evidence_pack_id: input.evidence_pack_id || 'evidence-pack-001',
    tenant_id: input.tenant_id || 'tenant-alpha-001',
    pack_type: input.pack_type || 'billing_and_identity_controls',
    generated_at: input.generated_at || new Date().toISOString(),
    evidence_sources: input.evidence_sources || [
      'markos_audit_log',
      'billing_usage_ledger',
      'identity_role_mapping_events',
    ],
    privileged_billing_actions: input.privileged_billing_actions || [
      'line item reconciliation',
      'hold',
      'sync failure',
      'reconciliation',
    ],
    privileged_identity_actions: input.privileged_identity_actions || [
      'canonical_role',
      'decision',
      'denial_reason',
      'sso_provider_id',
    ],
    generated_from_operator_notes: input.generated_from_operator_notes === true,
  });
}

function buildAccessReviewSnapshot(input = {}) {
  return Object.freeze({
    tenant_id: input.tenant_id || 'tenant-alpha-001',
    review_scope: input.review_scope || 'billing_and_identity_admins',
    last_completed: input.last_completed || '2026-04-03T00:00:00.000Z',
    owner: input.owner || 'owner-1',
    findings_status: input.findings_status || 'ready',
    next_review_due: input.next_review_due || '2026-05-03T00:00:00.000Z',
  });
}

function buildRetentionExportRecord(input = {}) {
  return Object.freeze({
    export_record_id: input.export_record_id || 'retention-export-001',
    evidence_pack_id: input.evidence_pack_id || 'evidence-pack-001',
    tenant_id: input.tenant_id || 'tenant-alpha-001',
    retention_window: input.retention_window || 'P12M',
    export_status: input.export_status || 'ready',
    exported_at: input.exported_at || null,
    export_location: input.export_location || 'markos://governance/evidence-pack-001',
  });
}

module.exports = {
  buildGovernanceEvidencePack,
  buildAccessReviewSnapshot,
  buildRetentionExportRecord,
};