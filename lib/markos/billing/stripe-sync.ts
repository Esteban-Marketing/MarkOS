import type { InvoiceLineItem } from './contracts';

type StripeSyncAttempt = {
  sync_attempt_id: string;
  tenant_id: string;
  provider: 'stripe';
  sync_status: 'pending' | 'succeeded' | 'failed';
  reason_code: string | null;
  billing_truth_source: 'markos-ledger';
  synced_at: string;
};

export function recordStripeSyncAttempt(input: {
  tenant_id: string;
  sync_status: StripeSyncAttempt['sync_status'];
  reason_code?: string | null;
}): StripeSyncAttempt {
  return {
    sync_attempt_id: `sync-${input.tenant_id}`,
    tenant_id: input.tenant_id,
    provider: 'stripe',
    sync_status: input.sync_status,
    reason_code: input.reason_code || null,
    billing_truth_source: 'markos-ledger',
    synced_at: new Date().toISOString(),
  };
}

export function syncBillingProjectionToStripe(input: {
  tenant_id: string;
  line_items: InvoiceLineItem[];
}) {
  return {
    provider: 'stripe' as const,
    tenant_id: input.tenant_id,
    projected_line_items: input.line_items,
    billing_truth_source: 'markos-ledger' as const,
    sync_preview: true,
  };
}