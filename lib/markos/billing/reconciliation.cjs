'use strict';

function assertLedgerRow(row = {}) {
  if (!row.ledger_row_id) {
    throw new Error('MISSING_LEDGER_ROW_ID');
  }

  if (!row.tenant_id || !row.billing_period_start || !row.billing_period_end) {
    throw new Error('MISSING_MARKOS_LINEAGE');
  }

  return row;
}

function buildLineItemFromLedger(row, index) {
  const quantity = Number(row.aggregated_quantity || 0);
  const unitAmountUsd = Number(row.unit_amount_usd || 0);
  const amountUsd = Number(row.amount_usd || (quantity * unitAmountUsd));

  return Object.freeze({
    line_item_id: `invoice-line-${index + 1}`,
    tenant_id: row.tenant_id,
    invoice_id: `invoice-${row.billing_period_start}`,
    provider_invoice_id: null,
    billing_period_start: row.billing_period_start,
    billing_period_end: row.billing_period_end,
    line_item_type: 'metered_overage',
    pricing_key: row.pricing_key || `${row.unit_type}.base`,
    quantity,
    unit_amount_usd: unitAmountUsd,
    amount_usd: amountUsd,
    ledger_row_ids: [row.ledger_row_id],
    billing_truth_source: 'markos-ledger',
    reconciliation_status: 'reconciled',
  });
}

function reconcileInvoiceLineItems({ ledger_rows = [], existing_line_items = [] } = {}) {
  for (const lineItem of existing_line_items) {
    if (lineItem && lineItem.provider_invoice_id && (!Array.isArray(lineItem.ledger_row_ids) || lineItem.ledger_row_ids.length === 0)) {
      throw new Error('MISSING_MARKOS_LINEAGE');
    }
  }

  const lineItems = ledger_rows.map((ledgerRow, index) => buildLineItemFromLedger(assertLedgerRow(ledgerRow), index));

  return Object.freeze({
    line_items: lineItems,
    reconciliation_status: 'reconciled',
    mismatch_count: 0,
  });
}

module.exports = {
  reconcileInvoiceLineItems,
};