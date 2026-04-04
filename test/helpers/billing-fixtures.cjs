'use strict';

function withOverrides(base, overrides = {}) {
  return Object.assign({}, base, overrides);
}

function buildBillingUsageEvent(overrides = {}) {
  return withOverrides({
    usage_event_id: 'usage-event-001',
    tenant_id: 'tenant-alpha-001',
    correlation_id: 'corr-billing-001',
    billing_period_start: '2026-04-01T00:00:00.000Z',
    billing_period_end: '2026-04-30T23:59:59.999Z',
    unit_type: 'agent_run',
    quantity: 1,
    source_type: 'agent_run_close',
    source_event_key: 'run-close:tenant-alpha-001:corr-billing-001:agent_run',
    source_payload_ref: 'run:run-001',
    provider_context: {
      provider: 'openai',
      model: 'gpt-4o-mini',
    },
    pricing_key: 'agent_run.base',
    measured_at: '2026-04-03T18:30:00.000Z',
  }, overrides);
}

function buildBillingUsageLedgerRow(overrides = {}) {
  return withOverrides({
    ledger_row_id: 'ledger-row-001',
    tenant_id: 'tenant-alpha-001',
    billing_period_start: '2026-04-01T00:00:00.000Z',
    billing_period_end: '2026-04-30T23:59:59.999Z',
    unit_type: 'agent_run',
    aggregated_quantity: 1,
    lineage_count: 1,
    source_event_keys: ['run-close:tenant-alpha-001:corr-billing-001:agent_run'],
    source_payload_refs: ['run:run-001'],
    ledger_source: 'markos-ledger',
    priced_at: '2026-04-30T23:59:59.999Z',
  }, overrides);
}

function buildEntitlementSnapshot(overrides = {}) {
  return withOverrides({
    snapshot_id: 'entitlement-snapshot-001',
    tenant_id: 'tenant-alpha-001',
    billing_period_start: '2026-04-01T00:00:00.000Z',
    billing_period_end: '2026-04-30T23:59:59.999Z',
    plan_key: 'growth-monthly',
    status: 'active',
    enforcement_source: 'markos-ledger',
    restricted_actions: [],
    restricted_capabilities: [],
    allowances: {
      seats: 10,
      projects: 5,
      agent_runs: 1000,
      token_budget: 100000,
      storage_gb_days: 50,
      premium_feature_flags: {
        enterprise_sso: true,
        governance_exports: true,
        premium_campaign_publish: true,
      },
    },
    usage_to_date: {
      seats: 1,
      projects: 1,
      agent_runs: 1,
      token_budget: 12,
      storage_gb_days: 0,
    },
    read_access_preserved: true,
    reason_code: null,
  }, overrides);
}

function buildInvoiceLineItem(overrides = {}) {
  return withOverrides({
    line_item_id: 'invoice-line-001',
    tenant_id: 'tenant-alpha-001',
    invoice_id: 'invoice-001',
    provider_invoice_id: null,
    billing_period_start: '2026-04-01T00:00:00.000Z',
    billing_period_end: '2026-04-30T23:59:59.999Z',
    line_item_type: 'metered_overage',
    pricing_key: 'agent_run.base',
    quantity: 1,
    unit_amount_usd: 12.5,
    amount_usd: 12.5,
    ledger_row_ids: ['ledger-row-001'],
    billing_truth_source: 'markos-ledger',
    reconciliation_status: 'pending',
  }, overrides);
}

function buildTenantSsoBinding(overrides = {}) {
  return withOverrides({
    binding_id: 'sso-binding-001',
    tenant_id: 'tenant-alpha-001',
    sso_provider_id: 'sso-provider-acme',
    provider_type: 'saml',
    idp_entity_id: 'https://idp.acme.test/metadata',
    attribute_mappings: {
      email: 'email',
      groups: 'groups',
    },
    created_at: '2026-04-03T18:30:00.000Z',
    updated_at: '2026-04-03T18:30:00.000Z',
  }, overrides);
}

function buildExternalRoleClaim(overrides = {}) {
  return withOverrides({
    claim_type: 'group',
    claim_value: 'markos-billing-admin',
    source_attribute: 'groups',
    issuer: 'https://idp.acme.test/metadata',
  }, overrides);
}

function buildIdentityRoleMappingDecision(overrides = {}) {
  return withOverrides({
    decision_id: 'role-map-001',
    tenant_id: 'tenant-alpha-001',
    actor_id: 'user-identity-001',
    correlation_id: 'corr-identity-001',
    sso_provider_id: 'sso-provider-acme',
    matched_rule_id: 'rule-billing-admin',
    canonical_role: 'billing-admin',
    decision: 'granted',
    denial_reason: null,
    source_claims: [buildExternalRoleClaim()],
    mapped_at: '2026-04-03T18:30:00.000Z',
  }, overrides);
}

function buildGovernanceEvidencePack(overrides = {}) {
  return withOverrides({
    evidence_pack_id: 'evidence-pack-001',
    tenant_id: 'tenant-alpha-001',
    pack_type: 'billing_and_identity_controls',
    generated_at: '2026-04-03T18:30:00.000Z',
    evidence_sources: [
      'markos_audit_log',
      'billing_usage_ledger',
      'identity_role_mapping_events',
    ],
    privileged_billing_actions: ['invoice_reconciled', 'billing_hold_applied'],
    privileged_identity_actions: ['role_mapping_granted', 'role_mapping_denied'],
    generated_from_operator_notes: false,
  }, overrides);
}

function buildRetentionExportRecord(overrides = {}) {
  return withOverrides({
    export_record_id: 'retention-export-001',
    evidence_pack_id: 'evidence-pack-001',
    tenant_id: 'tenant-alpha-001',
    retention_window: 'P12M',
    export_status: 'ready',
    exported_at: null,
    export_location: 'markos://governance/evidence-pack-001',
  }, overrides);
}

function buildVendorInventoryEntry(overrides = {}) {
  return withOverrides({
    vendor_inventory_id: 'vendor-inventory-001',
    tenant_id: 'tenant-alpha-001',
    vendor_key: 'openai',
    vendor_name: 'OpenAI',
    service_category: 'ai',
    subprocesses_personal_data: true,
    source_of_truth: 'immutable-ledger',
    evidence_ref: 'evidence-pack-001',
    reviewed_at: '2026-04-03T18:30:00.000Z',
  }, overrides);
}

module.exports = {
  buildBillingUsageEvent,
  buildBillingUsageLedgerRow,
  buildEntitlementSnapshot,
  buildInvoiceLineItem,
  buildTenantSsoBinding,
  buildExternalRoleClaim,
  buildIdentityRoleMappingDecision,
  buildGovernanceEvidencePack,
  buildRetentionExportRecord,
  buildVendorInventoryEntry,
};