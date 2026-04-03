export const GOVERNANCE_EVIDENCE_SOURCES = [
  'markos_audit_log',
  'billing_usage_ledger',
  'identity_role_mapping_events',
  'billing_provider_sync_log',
] as const;

export type GovernanceEvidencePack = {
  evidence_pack_id: string;
  tenant_id: string;
  pack_type: 'billing_and_identity_controls' | 'vendor_inventory' | 'retention_export';
  generated_at: string;
  evidence_sources: (typeof GOVERNANCE_EVIDENCE_SOURCES)[number][];
  privileged_billing_actions: string[];
  privileged_identity_actions: string[];
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