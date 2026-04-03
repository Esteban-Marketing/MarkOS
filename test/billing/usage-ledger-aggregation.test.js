const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  buildBillingUsageEvent,
} = require('../helpers/billing-fixtures.cjs');

function loadTsCommonJsModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const module = { exports: {} };
  const wrapped = new vm.Script(`(function (exports, require, module, __filename, __dirname) {\n${source}\n})`, {
    filename: filePath,
  });
  const localRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      return require(path.resolve(path.dirname(filePath), specifier));
    }
    return require(specifier);
  };

  wrapped.runInThisContext()(module.exports, localRequire, module, filePath, path.dirname(filePath));
  return module.exports;
}

const { aggregateUsageForPeriod, buildLedgerRows } = loadTsCommonJsModule(
  path.join(__dirname, '../../lib/markos/billing/usage-ledger.ts')
);
const { buildPricingSnapshot } = loadTsCommonJsModule(
  path.join(__dirname, '../../lib/markos/billing/pricing-catalog.ts')
);

test('BIL-02: aggregation deduplicates usage events by deterministic source_event_key', () => {
  const duplicate = buildBillingUsageEvent();
  const pricingSnapshot = buildPricingSnapshot({
    snapshot_id: 'price-001',
    tenant_id: 'tenant-alpha-001',
    pricing_version: '2026-04',
    effective_at: '2026-04-01T00:00:00.000Z',
    unit_prices: { 'agent_run.base': 12.5 },
  });
  const aggregates = aggregateUsageForPeriod([
    duplicate,
    buildBillingUsageEvent({
      usage_event_id: 'usage-event-002',
      correlation_id: 'corr-billing-002',
      source_event_key: 'run-close:tenant-alpha-001:corr-billing-002:agent_run',
      source_payload_ref: 'run:run-002',
    }),
    duplicate,
  ], {
    pricingSnapshot,
  });

  assert.equal(aggregates.length, 1);
  assert.equal(aggregates[0].aggregated_quantity, 2);
  assert.equal(aggregates[0].lineage_count, 2);
  assert.deepEqual(aggregates[0].source_payload_refs.sort(), ['run:run-001', 'run:run-002']);
});

test('BIL-02: aggregation emits immutable ledger rows tied back to raw telemetry lineage', () => {
  const pricingSnapshot = buildPricingSnapshot({
    snapshot_id: 'price-001',
    tenant_id: 'tenant-alpha-001',
    pricing_version: '2026-04',
    effective_at: '2026-04-01T00:00:00.000Z',
    unit_prices: { 'agent_run.base': 12.5 },
  });
  const aggregates = aggregateUsageForPeriod([
    buildBillingUsageEvent({ source_payload_ref: 'run:run-001' }),
    buildBillingUsageEvent({
      usage_event_id: 'usage-event-002',
      source_event_key: 'run-close:tenant-alpha-001:corr-billing-002:agent_run',
      correlation_id: 'corr-billing-002',
      source_payload_ref: 'run:run-002',
    }),
  ], {
    pricingSnapshot,
  });
  const rows = buildLedgerRows(aggregates, { pricingSnapshot });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].tenant_id, 'tenant-alpha-001');
  assert.deepEqual(rows[0].source_payload_refs, ['run:run-001', 'run:run-002']);
  assert.equal(rows[0].ledger_source, 'markos-ledger');
  assert.equal(rows[0].pricing_snapshot_id, 'price-001');
  assert.equal(rows[0].pricing_version, '2026-04');
  assert.equal(rows[0].unit_amount_usd, 12.5);
  assert.equal(rows[0].amount_usd, 25);
});

test('BIL-02: pricing snapshots stay versioned inside MarkOS and ledger rows keep snapshot evidence', () => {
  const pricingSnapshot = buildPricingSnapshot({
    snapshot_id: 'price-enterprise-2026-04',
    tenant_id: 'tenant-alpha-001',
    pricing_version: '2026-04-enterprise',
    effective_at: '2026-04-01T00:00:00.000Z',
    currency: 'usd',
    unit_prices: {
      'agent_run.base': 12.5,
      'token_input.openai.gpt-4o-mini': 0.000002,
    },
  });
  const aggregates = aggregateUsageForPeriod([
    buildBillingUsageEvent({ source_payload_ref: 'run:run-001' }),
  ]);

  const rows = buildLedgerRows(aggregates, { pricingSnapshot });

  assert.equal(pricingSnapshot.pricing_version, '2026-04-enterprise');
  assert.equal(pricingSnapshot.currency, 'usd');
  assert.deepEqual(Object.keys(pricingSnapshot.unit_prices).sort(), [
    'agent_run.base',
    'token_input.openai.gpt-4o-mini',
  ]);
  assert.equal(rows[0].pricing_snapshot_id, 'price-enterprise-2026-04');
  assert.equal(rows[0].pricing_version, '2026-04-enterprise');
});