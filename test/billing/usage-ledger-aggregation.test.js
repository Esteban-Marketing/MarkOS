const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildBillingUsageEvent,
} = require('../helpers/billing-fixtures.cjs');
const {
  aggregateUsageLedgerRows,
} = require('../../lib/markos/billing/ledger.cjs');

test('BIL-02: aggregation deduplicates usage events by deterministic source_event_key', () => {
  const duplicate = buildBillingUsageEvent();
  const rows = aggregateUsageLedgerRows([
    duplicate,
    buildBillingUsageEvent({ source_payload_ref: 'run:run-002' }),
    duplicate,
  ]);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].lineage_count, 1);
  assert.equal(rows[1].lineage_count, 1);
});

test('BIL-02: aggregation emits immutable ledger rows tied back to raw telemetry lineage', () => {
  const rows = aggregateUsageLedgerRows([
    buildBillingUsageEvent({ source_payload_ref: 'run:run-001' }),
  ]);

  assert.equal(rows[0].tenant_id, 'tenant-alpha-001');
  assert.deepEqual(rows[0].source_payload_refs, ['run:run-001']);
  assert.equal(rows[0].ledger_source, 'markos-ledger');
});