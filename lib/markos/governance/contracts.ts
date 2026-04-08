export const GOVERNANCE_EVIDENCE_SOURCES = [
  'markos_audit_log',
  'billing_usage_ledger',
  'identity_role_mapping_events',
  'billing_provider_sync_log',
  'agent_approval_decision_log',
  'tenant_configuration_change_log',
] as const;

export const PRIVILEGED_ACTION_FAMILY_KEYS = [
  'authentication_authorization',
  'approvals',
  'billing_administration',
  'tenant_configuration',
] as const;

export type GovernancePrivilegedActionFamily = {
  action_family: (typeof PRIVILEGED_ACTION_FAMILY_KEYS)[number];
  evidence_source: (typeof GOVERNANCE_EVIDENCE_SOURCES)[number];
  actions: string[];
  immutable_provenance_fields: string[];
};

export type GovernanceEvidencePack = {
  evidence_pack_id: string;
  tenant_id: string;
  pack_type: 'billing_and_identity_controls' | 'vendor_inventory' | 'retention_export';
  generated_at: string;
  evidence_sources: (typeof GOVERNANCE_EVIDENCE_SOURCES)[number][];
  privileged_billing_actions: string[];
  privileged_identity_actions: string[];
  privileged_action_families: GovernancePrivilegedActionFamily[];
  generated_from_operator_notes: false;
};

export type RetentionExportRecord = {
  export_record_id: string;
  evidence_pack_id: string;
  tenant_id: string;
  retention_window: string;
  export_status: 'ready' | 'exported' | 'failed';
  exported_at: string | null;
  export_location: string;
};

export type DeletionWorkflowRecord = {
  deletion_request_id: string;
  evidence_pack_id: string;
  tenant_id: string;
  request_received_at: string;
  request_scope: 'tenant_workspace_data' | 'tenant_identity_data' | 'tenant_billing_data';
  requested_by_actor_id: string;
  approval_reference: string;
  export_before_delete_status: 'required' | 'completed' | 'waived';
  export_record_id: string | null;
  export_completed_at: string | null;
  deletion_action: 'anonymize_then_delete' | 'hard_delete' | 'soft_delete';
  workflow_status: 'received' | 'export_ready' | 'deleted' | 'denied' | 'completed';
  resulting_evidence_ref: string;
  completed_at: string | null;
};

export type VendorInventoryEntry = {
  vendor_inventory_id: string;
  tenant_id: string;
  vendor_key: string;
  vendor_name: string;
  service_category: 'ai' | 'billing' | 'identity' | 'storage';
  subprocesses_personal_data: boolean;
  source_of_truth: 'immutable-ledger';
  evidence_ref: string;
  reviewed_at: string;
};