const test = require('node:test');
const assert = require('node:assert/strict');

const { buildEntitlementSnapshot } = require('../helpers/billing-fixtures.cjs');
const {
  evaluateEntitlementAccess,
} = require('../../lib/markos/billing/enforcement.cjs');

test('BIL-01: restricted execute actions fail closed from MarkOS entitlement snapshot state', () => {
  const snapshot = buildEntitlementSnapshot({
    status: 'restricted',
    enforcement_source: 'markos-ledger',
    restricted_actions: ['execute_task'],
    reason_code: 'BILLING_HOLD_ACTIVE',
  });

  const decision = evaluateEntitlementAccess({
    snapshot,
    action: 'execute_task',
    actor_role: 'manager',
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason_code, 'BILLING_HOLD_ACTIVE');
  assert.equal(decision.enforcement_source, 'markos-ledger');
});

test('BIL-01: read-only billing evidence remains available during degraded entitlement state', () => {
  const snapshot = buildEntitlementSnapshot({
    status: 'degraded',
    enforcement_source: 'markos-ledger',
    restricted_actions: ['execute_task', 'write_campaigns'],
  });

  const decision = evaluateEntitlementAccess({
    snapshot,
    action: 'read_billing_evidence',
    actor_role: 'billing-admin',
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.reason_code, null);
});