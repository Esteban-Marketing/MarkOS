'use strict';

const crypto = require('node:crypto');

function getUnitPrice(pricingSnapshot, pricingKey) {
  const snapshot = pricingSnapshot || {};
  if (!snapshot.unit_prices || !Object.prototype.hasOwnProperty.call(snapshot.unit_prices, pricingKey)) {
    throw new Error(`BILLING_PRICING_MISSING:${pricingKey}`);
  }
  return Number(snapshot.unit_prices[pricingKey]);
}

function assertUsageEvent(event = {}) {
  const requiredFields = [
    'usage_event_id',
    'tenant_id',
    'billing_period_start',
    'billing_period_end',
    'unit_type',
    'source_event_key',
    'source_payload_ref',
    'pricing_key',
  ];
  for (const fieldName of requiredFields) {
    if (!String(event[fieldName] || '').trim()) {
      throw new Error(`BILLING_INPUT_INVALID:${fieldName}`);
    }
  }

  const quantity = Number(event.quantity);
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error('BILLING_INPUT_INVALID:quantity');
  }

  return {
    ...event,
    quantity,
  };
}

function buildAggregateKey(event, pricingSnapshotId) {
  return [
    event.tenant_id,
    event.billing_period_start,
    event.billing_period_end,
    event.unit_type,
    event.pricing_key,
    pricingSnapshotId || '',
  ].join('|');
}

function aggregateUsageForPeriod(events = [], options = {}) {
  const deduped = new Map();
  for (const rawEvent of events) {
    const event = assertUsageEvent(rawEvent);
    if (!deduped.has(event.source_event_key)) {
      deduped.set(event.source_event_key, event);
    }
  }

  const pricingSnapshot = options.pricingSnapshot || null;
  const aggregates = new Map();
  for (const event of deduped.values()) {
    const aggregateKey = buildAggregateKey(event, pricingSnapshot && pricingSnapshot.snapshot_id);
    if (!aggregates.has(aggregateKey)) {
      aggregates.set(aggregateKey, {
        tenant_id: event.tenant_id,
        billing_period_start: event.billing_period_start,
        billing_period_end: event.billing_period_end,
        unit_type: event.unit_type,
        pricing_key: event.pricing_key,
        pricing_snapshot_id: pricingSnapshot ? pricingSnapshot.snapshot_id : null,
        pricing_version: pricingSnapshot ? pricingSnapshot.pricing_version : null,
        aggregated_quantity: 0,
        lineage_count: 0,
        source_event_keys: [],
        source_payload_refs: [],
        usage_event_ids: [],
      });
    }

    const aggregate = aggregates.get(aggregateKey);
    aggregate.aggregated_quantity += event.quantity;
    aggregate.lineage_count += 1;
    aggregate.source_event_keys.push(event.source_event_key);
    aggregate.source_payload_refs.push(event.source_payload_ref);
    aggregate.usage_event_ids.push(event.usage_event_id);
  }

  return Array.from(aggregates.values()).map((aggregate) => ({
    ...aggregate,
    source_event_keys: aggregate.source_event_keys.sort(),
    source_payload_refs: aggregate.source_payload_refs.sort(),
    usage_event_ids: aggregate.usage_event_ids.sort(),
  }));
}

function buildLedgerRows(aggregates = [], options = {}) {
  const pricingSnapshot = options.pricingSnapshot || null;

  return aggregates.map((aggregate) => {
    const pricingSnapshotId = aggregate.pricing_snapshot_id || (pricingSnapshot && pricingSnapshot.snapshot_id) || null;
    const pricingVersion = aggregate.pricing_version || (pricingSnapshot && pricingSnapshot.pricing_version) || null;
    const unitAmountUsd = pricingSnapshot ? getUnitPrice(pricingSnapshot, aggregate.pricing_key) : 0;
    const amountUsd = Number((aggregate.aggregated_quantity * unitAmountUsd).toFixed(6));
    const hashInput = [
      aggregate.tenant_id,
      aggregate.billing_period_start,
      aggregate.billing_period_end,
      aggregate.unit_type,
      aggregate.pricing_key,
      pricingSnapshotId || '',
    ].join('|');
    const ledgerRowId = `ledger:${crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 24)}`;

    return Object.freeze({
      ledger_row_id: ledgerRowId,
      tenant_id: aggregate.tenant_id,
      billing_period_start: aggregate.billing_period_start,
      billing_period_end: aggregate.billing_period_end,
      unit_type: aggregate.unit_type,
      aggregated_quantity: aggregate.aggregated_quantity,
      lineage_count: aggregate.lineage_count,
      source_event_keys: aggregate.source_event_keys,
      source_payload_refs: aggregate.source_payload_refs,
      usage_event_ids: aggregate.usage_event_ids,
      ledger_source: 'markos-ledger',
      priced_at: pricingSnapshot ? pricingSnapshot.effective_at : aggregate.billing_period_end,
      pricing_key: aggregate.pricing_key,
      pricing_snapshot_id: pricingSnapshotId,
      pricing_version: pricingVersion,
      unit_amount_usd: unitAmountUsd,
      amount_usd: amountUsd,
    });
  });
}

module.exports = {
  aggregateUsageForPeriod,
  buildLedgerRows,
};