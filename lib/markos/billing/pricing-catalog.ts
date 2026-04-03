'use strict';

function assertString(value, fieldName) {
  if (!String(value || '').trim()) {
    throw new Error(`BILLING_INPUT_INVALID:${fieldName}`);
  }
  return String(value).trim();
}

function assertCurrency(value) {
  const normalized = String(value || 'usd').trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalized)) {
    throw new Error('BILLING_INPUT_INVALID:currency');
  }
  return normalized;
}

function assertUnitPrices(unitPrices) {
  if (!unitPrices || typeof unitPrices !== 'object' || Array.isArray(unitPrices)) {
    throw new Error('BILLING_INPUT_INVALID:unit_prices');
  }

  const normalizedEntries = Object.entries(unitPrices).map(([pricingKey, amount]) => {
    const numericAmount = Number(amount);
    if (!pricingKey || !Number.isFinite(numericAmount) || numericAmount < 0) {
      throw new Error('BILLING_INPUT_INVALID:unit_prices');
    }
    return [pricingKey, numericAmount];
  });

  if (normalizedEntries.length === 0) {
    throw new Error('BILLING_INPUT_INVALID:unit_prices');
  }

  return Object.freeze(Object.fromEntries(normalizedEntries.sort(([left], [right]) => left.localeCompare(right))));
}

function buildPricingSnapshot(input = {}) {
  const snapshot = {
    snapshot_id: assertString(input.snapshot_id, 'snapshot_id'),
    tenant_id: assertString(input.tenant_id, 'tenant_id'),
    pricing_version: assertString(input.pricing_version, 'pricing_version'),
    effective_at: assertString(input.effective_at, 'effective_at'),
    currency: assertCurrency(input.currency),
    unit_prices: assertUnitPrices(input.unit_prices),
  };

  return Object.freeze(snapshot);
}

function getUnitPrice(pricingSnapshot, pricingKey) {
  const snapshot = pricingSnapshot || {};
  const key = assertString(pricingKey, 'pricing_key');
  if (!snapshot.unit_prices || !Object.prototype.hasOwnProperty.call(snapshot.unit_prices, key)) {
    throw new Error(`BILLING_PRICING_MISSING:${key}`);
  }
  return Number(snapshot.unit_prices[key]);
}

module.exports = {
  buildPricingSnapshot,
  getUnitPrice,
};