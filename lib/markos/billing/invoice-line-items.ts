import type { BillingUsageLedgerRow, InvoiceLineItem } from './contracts';

export function buildInvoiceLineItems(ledgerRows: BillingUsageLedgerRow[]): InvoiceLineItem[] {
  return ledgerRows.map((ledgerRow, index) => ({
    line_item_id: `invoice-line-${index + 1}`,
    tenant_id: ledgerRow.tenant_id,
    invoice_id: `invoice-${ledgerRow.billing_period_start}`,
    provider_invoice_id: null,
    billing_period_start: ledgerRow.billing_period_start,
    billing_period_end: ledgerRow.billing_period_end,
    line_item_type: 'metered_overage',
    pricing_key: ledgerRow.pricing_key || `${ledgerRow.unit_type}.base`,
    quantity: ledgerRow.aggregated_quantity,
    unit_amount_usd: ledgerRow.unit_amount_usd || 0,
    amount_usd: ledgerRow.amount_usd || 0,
    ledger_row_ids: [ledgerRow.ledger_row_id],
    billing_truth_source: 'markos-ledger',
    reconciliation_status: 'reconciled',
  }));
}

export function buildReconciliationSummary(lineItems: InvoiceLineItem[]) {
  const amountUsd = lineItems.reduce((sum, lineItem) => sum + Number(lineItem.amount_usd || 0), 0);

  return {
    line_item_count: lineItems.length,
    amount_usd: Number(amountUsd.toFixed(2)),
    billing_truth_source: 'markos-ledger' as const,
    mismatch_count: 0,
  };
}