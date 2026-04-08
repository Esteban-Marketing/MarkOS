export const BILLING_USAGE_UNIT_TYPES = [
  'agent_run',
  'token_input',
  'token_output',
  'plugin_operation',
  'storage_gb_day',
] as const;

export const BILLING_SOURCE_TYPES = [
  'agent_run_close',
  'agent_provider_attempt',
  'plugin_operation',
  'storage_snapshot',
] as const;

export type BillingUsageEvent = {
  usage_event_id: string;
  tenant_id: string;
  correlation_id: string;
  billing_period_start: string;
  billing_period_end: string;
  unit_type: (typeof BILLING_USAGE_UNIT_TYPES)[number];
  quantity: number;
  source_type: (typeof BILLING_SOURCE_TYPES)[number];
  source_event_key: string;
  source_payload_ref: string;
  provider_context: {
    provider: string;
    model: string | null;
  } | null;
  pricing_key: string;
  measured_at: string;
};

export type BillingUsageLedgerRow = {
  ledger_row_id: string;
  tenant_id: string;
  billing_period_start: string;
  billing_period_end: string;
  unit_type: (typeof BILLING_USAGE_UNIT_TYPES)[number];
  pricing_key: string;
  pricing_snapshot_id: string | null;
  pricing_version: string | null;
  aggregated_quantity: number;
  lineage_count: number;
  source_event_keys: string[];
  source_payload_refs: string[];
  usage_event_ids: string[];
  ledger_source: 'markos-ledger';
  priced_at: string;
  unit_amount_usd: number;
  amount_usd: number;
};

export type EntitlementSnapshot = {
  snapshot_id: string;
  tenant_id: string;
  billing_period_start: string;
  billing_period_end: string;
  plan_key: string;
  status: 'active' | 'degraded' | 'restricted' | 'hold';
  enforcement_source: 'markos-ledger';
  restricted_actions: string[];
  restricted_capabilities: string[];
  allowances: {
    seats: number;
    projects: number;
    agent_runs: number;
    token_budget: number;
    storage_gb_days: number;
    premium_feature_flags: Record<string, boolean>;
    [key: string]: number | Record<string, boolean>;
  };
  usage_to_date: {
    seats: number;
    projects: number;
    agent_runs: number;
    token_budget: number;
    storage_gb_days: number;
    [key: string]: number;
  };
  quota_state: {
    seats: 'within_limit' | 'at_limit' | 'over_limit';
    projects: 'within_limit' | 'at_limit' | 'over_limit';
    agent_runs: 'within_limit' | 'at_limit' | 'over_limit';
    token_budget: 'within_limit' | 'at_limit' | 'over_limit';
    storage_gb_days: 'within_limit' | 'at_limit' | 'over_limit';
    [key: string]: 'within_limit' | 'at_limit' | 'over_limit';
  };
  read_access_preserved: boolean;
  reason_code: string | null;
};

export type InvoiceLineItem = {
  line_item_id: string;
  tenant_id: string;
  invoice_id: string;
  provider_invoice_id: string | null;
  billing_period_start: string;
  billing_period_end: string;
  line_item_type: 'subscription_base' | 'metered_overage' | 'credit' | 'adjustment';
  pricing_key: string;
  quantity: number;
  unit_amount_usd: number;
  amount_usd: number;
  ledger_row_ids: string[];
  billing_truth_source: 'markos-ledger';
  reconciliation_status: 'pending' | 'reconciled' | 'failed';
};