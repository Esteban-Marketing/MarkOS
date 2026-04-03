const test = require('node:test');
const assert = require('node:assert/strict');

const { buildVendorInventoryEntry } = require('../helpers/billing-fixtures.cjs');
const {
  buildVendorInventoryReport,
} = require('../../lib/markos/governance/vendor-inventory.cjs');

test('GOV-01: vendor inventory report includes AI and billing subprocessors from immutable ledgers', () => {
  const report = buildVendorInventoryReport({
    evidence_entries: [
      buildVendorInventoryEntry({ vendor_key: 'openai' }),
      buildVendorInventoryEntry({ vendor_key: 'stripe', service_category: 'billing' }),
    ],
  });

  assert.equal(report.entries.length, 2);
  assert.equal(report.entries[0].source_of_truth, 'immutable-ledger');
  assert.equal(report.entries[1].vendor_key, 'stripe');
});

test('GOV-01: vendor inventory report rejects operator-authored notes as source of truth', () => {
  assert.throws(
    () => buildVendorInventoryReport({
      evidence_entries: [
        buildVendorInventoryEntry({ source_of_truth: 'operator-notes' }),
      ],
    }),
    /IMMUTABLE_EVIDENCE_REQUIRED/
  );
});