const test = require('node:test');
const assert = require('node:assert/strict');

const { buildEntitlementSnapshot } = require('../helpers/billing-fixtures.cjs');
const {
  evaluatePluginCapabilityAccess,
} = require('../../lib/markos/billing/plugin-entitlements.cjs');

test('BIL-01: plugin runtime denies premium capability when MarkOS entitlement snapshot is over limit', () => {
  const snapshot = buildEntitlementSnapshot({
    status: 'restricted',
    restricted_capabilities: ['publish_campaigns'],
    enforcement_source: 'markos-ledger',
    reason_code: 'PLAN_CAP_EXCEEDED',
  });

  const decision = evaluatePluginCapabilityAccess({
    snapshot,
    plugin_id: 'digital-agency-v1',
    capability: 'publish_campaigns',
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason_code, 'PLAN_CAP_EXCEEDED');
  assert.equal(decision.enforcement_source, 'markos-ledger');
});

test('BIL-01: plugin runtime never treats downstream provider state as entitlement source of truth', () => {
  const snapshot = buildEntitlementSnapshot({
    status: 'active',
    enforcement_source: 'markos-ledger',
  });

  const decision = evaluatePluginCapabilityAccess({
    snapshot,
    plugin_id: 'digital-agency-v1',
    capability: 'read_campaigns',
    downstream_provider_state: { provider: 'stripe', status: 'active' },
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.provider_truth_source, 'markos-ledger');
});

test('TEN-04: plugin runtime denies premium write capability when prepaid token budget is exhausted', () => {
  const snapshot = buildEntitlementSnapshot({
    status: 'active',
    allowances: { token_budget: 100 },
    usage_to_date: { token_budget: 100 },
    quota_state: { token_budget: 'over_limit' },
  });

  const decision = evaluatePluginCapabilityAccess({
    snapshot,
    plugin_id: 'digital-agency-v1',
    capability: 'publish_campaigns',
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason_code, 'TOKEN_BUDGET_EXHAUSTED');
});