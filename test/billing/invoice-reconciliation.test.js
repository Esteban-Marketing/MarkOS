const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildBillingUsageLedgerRow,
  buildInvoiceLineItem,
} = require('../helpers/billing-fixtures.cjs');
const {
  reconcileInvoiceLineItems,
} = require('../../lib/markos/billing/reconciliation.cjs');

test('BIL-03: invoice reconciliation maps immutable ledger rows to billable line items', () => {
  const ledgerRow = buildBillingUsageLedgerRow();
  const reconciled = reconcileInvoiceLineItems({
    ledger_rows: [ledgerRow],
    existing_line_items: [],
  });

  assert.equal(reconciled.line_items.length, 1);
  assert.equal(reconciled.line_items[0].ledger_row_ids[0], ledgerRow.ledger_row_id);
  assert.equal(reconciled.line_items[0].billing_truth_source, 'markos-ledger');
});

test('BIL-03: invoice reconciliation never accepts provider-only line items without MarkOS lineage', () => {
  const providerOnly = buildInvoiceLineItem({
    ledger_row_ids: [],
    provider_invoice_id: 'in_123',
  });

  assert.throws(
    () => reconcileInvoiceLineItems({ ledger_rows: [], existing_line_items: [providerOnly] }),
    /MISSING_MARKOS_LINEAGE/
  );
});