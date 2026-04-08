import type { DeletionWorkflowRecord, GovernanceEvidencePack, GovernancePrivilegedActionFamily, RetentionExportRecord } from './contracts';

type AccessReviewSnapshot = {
  tenant_id: string;
  review_scope: string;
  last_completed: string;
  owner: string;
  findings_status: string;
  next_review_due: string;
};

function buildDefaultPrivilegedActionFamilies(): GovernancePrivilegedActionFamily[] {
  return [
    {
      action_family: 'authentication_authorization',
      evidence_source: 'identity_role_mapping_events',
      actions: ['sso_role_mapping_granted', 'sso_role_mapping_denied'],
      immutable_provenance_fields: ['tenant_id', 'actor_id', 'correlation_id', 'sso_provider_id'],
    },
    {
      action_family: 'approvals',
      evidence_source: 'agent_approval_decision_log',
      actions: ['approval_decision_recorded', 'approval_decision_denied'],
      immutable_provenance_fields: ['run_id', 'tenant_id', 'actor_id', 'actor_role', 'correlation_id'],
    },
    {
      action_family: 'billing_administration',
      evidence_source: 'billing_provider_sync_log',
      actions: ['invoice_reconciled', 'billing_hold_applied', 'billing_hold_released', 'entitlement_snapshot_published'],
      immutable_provenance_fields: ['tenant_id', 'billing_period_start', 'billing_period_end', 'sync_attempt_id'],
    },
    {
      action_family: 'tenant_configuration',
      evidence_source: 'tenant_configuration_change_log',
      actions: ['plugin_settings_updated', 'tenant_branding_versioned', 'tenant_sso_binding_updated'],
      immutable_provenance_fields: ['tenant_id', 'plugin_id', 'enabled', 'capabilities', 'updated_at'],
    },
  ];
}

export function buildGovernanceEvidencePack(input: Partial<GovernanceEvidencePack> = {}): GovernanceEvidencePack {
  return {
    evidence_pack_id: input.evidence_pack_id || 'evidence-pack-001',
    tenant_id: input.tenant_id || 'tenant-alpha-001',
    pack_type: input.pack_type || 'billing_and_identity_controls',
    generated_at: input.generated_at || new Date().toISOString(),
    evidence_sources: input.evidence_sources || [
      'markos_audit_log',
      'billing_usage_ledger',
      'identity_role_mapping_events',
      'billing_provider_sync_log',
      'agent_approval_decision_log',
      'tenant_configuration_change_log',
    ],
    privileged_billing_actions: input.privileged_billing_actions || [
      'invoice_reconciled',
      'billing_hold_applied',
      'billing_hold_released',
      'entitlement_snapshot_published',
    ],
    privileged_identity_actions: input.privileged_identity_actions || [
      'sso_role_mapping_granted',
      'sso_role_mapping_denied',
    ],
    privileged_action_families: input.privileged_action_families || buildDefaultPrivilegedActionFamilies(),
    generated_from_operator_notes: input.generated_from_operator_notes === true,
  };
}

export function buildAccessReviewSnapshot(input: Partial<AccessReviewSnapshot> = {}): AccessReviewSnapshot {
  return {
    tenant_id: input.tenant_id || 'tenant-alpha-001',
    review_scope: input.review_scope || 'billing_and_identity_admins',
    last_completed: input.last_completed || '2026-04-03T00:00:00.000Z',
    owner: input.owner || 'owner-1',
    findings_status: input.findings_status || 'ready',
    next_review_due: input.next_review_due || '2026-05-03T00:00:00.000Z',
  };
}

export function buildRetentionExportRecord(input: Partial<RetentionExportRecord> = {}): RetentionExportRecord {
  return {
    export_record_id: input.export_record_id || 'retention-export-001',
    evidence_pack_id: input.evidence_pack_id || 'evidence-pack-001',
    tenant_id: input.tenant_id || 'tenant-alpha-001',
    retention_window: input.retention_window || 'P12M',
    export_status: input.export_status || 'ready',
    exported_at: input.exported_at || null,
    export_location: input.export_location || 'markos://governance/evidence-pack-001',
  };
}

export function buildDeletionWorkflowRecord(input: Partial<DeletionWorkflowRecord> = {}): DeletionWorkflowRecord {
  return {
    deletion_request_id: input.deletion_request_id || 'deletion-request-001',
    evidence_pack_id: input.evidence_pack_id || 'evidence-pack-001',
    tenant_id: input.tenant_id || 'tenant-alpha-001',
    request_received_at: input.request_received_at || '2026-04-04T00:00:00.000Z',
    request_scope: input.request_scope || 'tenant_workspace_data',
    requested_by_actor_id: input.requested_by_actor_id || 'privacy-admin-1',
    approval_reference: input.approval_reference || 'approval:deletion-request-001',
    export_before_delete_status: input.export_before_delete_status || 'completed',
    export_record_id: input.export_record_id || 'retention-export-001',
    export_completed_at: input.export_completed_at || '2026-04-04T00:05:00.000Z',
    deletion_action: input.deletion_action || 'anonymize_then_delete',
    workflow_status: input.workflow_status || 'completed',
    resulting_evidence_ref: input.resulting_evidence_ref || 'evidence-pack-001',
    completed_at: input.completed_at || '2026-04-04T00:06:00.000Z',
  };
}