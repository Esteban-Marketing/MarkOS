'use strict';

function buildVendorInventoryReport({ evidence_entries = [] } = {}) {
  const entries = evidence_entries.map((entry) => {
    if (entry.source_of_truth !== 'immutable-ledger') {
      throw new Error('IMMUTABLE_EVIDENCE_REQUIRED');
    }

    return Object.freeze({
      ...entry,
      source_of_truth: 'immutable-ledger',
    });
  });

  return Object.freeze({
    entries,
    generated_at: new Date().toISOString(),
  });
}

module.exports = {
  buildVendorInventoryReport,
};