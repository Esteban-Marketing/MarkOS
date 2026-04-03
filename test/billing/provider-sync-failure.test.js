const test = require('node:test');
const assert = require('node:assert/strict');

const { buildInvoiceLineItem } = require('../helpers/billing-fixtures.cjs');
const {
  deriveProviderSyncOutcome,
} = require('../../lib/markos/billing/provider-sync.cjs');

test('BIL-03: provider sync failure places restricted capabilities into auditable hold state', () => {
  const outcome = deriveProviderSyncOutcome({
    line_items: [buildInvoiceLineItem()],
    provider: 'stripe',
    sync_status: 'failed',
    failure_code: 'PAYMENT_METHOD_DECLINED',
  });

  assert.equal(outcome.billing_state, 'hold');
  assert.equal(outcome.reason_code, 'PAYMENT_METHOD_DECLINED');
  assert.equal(outcome.read_access_preserved, true);
});

test('BIL-03: provider sync failure does not silently restore restricted write or execute access', () => {
  const outcome = deriveProviderSyncOutcome({
    line_items: [buildInvoiceLineItem()],
    provider: 'stripe',
    sync_status: 'failed',
    failure_code: 'INVOICE_FINALIZATION_FAILED',
  });

  assert.equal(outcome.restricted_actions.includes('execute_task'), true);
  assert.equal(outcome.restricted_actions.includes('write_campaigns'), true);
});