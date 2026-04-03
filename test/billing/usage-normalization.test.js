const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  buildBillingUsageEvent,
} = require('../helpers/billing-fixtures.cjs');

const billingContractsPath = path.join(__dirname, '../../lib/markos/billing/contracts.ts');

test('BIL-02: billing contracts export canonical usage and invoice contract vocabulary', () => {
  const source = fs.readFileSync(billingContractsPath, 'utf8');

  assert.match(source, /export type BillingUsageEvent/);
  assert.match(source, /export type BillingUsageLedgerRow/);
  assert.match(source, /export type EntitlementSnapshot/);
  assert.match(source, /export type InvoiceLineItem/);
  assert.match(source, /source_event_key/);
  assert.match(source, /correlation_id/);
});

test('BIL-02: usage event fixture preserves MarkOS-ledger lineage keys and provider context', () => {
  const usageEvent = buildBillingUsageEvent({
    source_type: 'agent_run_close',
    provider_context: {
      provider: 'openai',
      model: 'gpt-4o-mini',
    },
  });

  assert.equal(usageEvent.tenant_id, 'tenant-alpha-001');
  assert.equal(usageEvent.correlation_id, 'corr-billing-001');
  assert.equal(usageEvent.source_event_key, 'run-close:tenant-alpha-001:corr-billing-001:agent_run');
  assert.equal(usageEvent.source_payload_ref, 'run:run-001');
  assert.deepEqual(usageEvent.provider_context, {
    provider: 'openai',
    model: 'gpt-4o-mini',
  });
});

test('BIL-02: usage event fixture encodes billing period boundaries for later aggregation', () => {
  const usageEvent = buildBillingUsageEvent();

  assert.equal(usageEvent.billing_period_start, '2026-04-01T00:00:00.000Z');
  assert.equal(usageEvent.billing_period_end, '2026-04-30T23:59:59.999Z');
  assert.equal(usageEvent.quantity, 1);
});