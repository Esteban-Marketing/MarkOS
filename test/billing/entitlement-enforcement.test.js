const test = require('node:test');
const assert = require('node:assert/strict');

const { buildEntitlementSnapshot } = require('../helpers/billing-fixtures.cjs');
const {
  evaluateEntitlementAccess,
  evaluateQuotaDimensionAccess,
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

test('TEN-04: execute actions fail closed when token budget is exhausted', () => {
  const snapshot = buildEntitlementSnapshot({
    allowances: { token_budget: 100 },
    usage_to_date: { token_budget: 100 },
    quota_state: { token_budget: 'over_limit' },
  });

  const decision = evaluateEntitlementAccess({
    snapshot,
    action: 'execute_task',
    actor_role: 'manager',
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason_code, 'TOKEN_BUDGET_EXHAUSTED');
});

test('TEN-04: operator recovery surfaces remain available while prepaid quota is exhausted', () => {
  const snapshot = buildEntitlementSnapshot({
    allowances: { token_budget: 100 },
    usage_to_date: { token_budget: 100 },
    quota_state: { token_budget: 'over_limit' },
  });

  const decision = evaluateEntitlementAccess({
    snapshot,
    action: 'manage_plugin_settings',
    actor_role: 'owner',
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.reason_code, null);
});

test('TEN-04: project creation blocks at the submit mutation seam once capacity is exhausted', () => {
  const snapshot = buildEntitlementSnapshot({
    allowances: { projects: 1 },
    usage_to_date: { projects: 1 },
    quota_state: { projects: 'at_limit' },
  });

  const decision = evaluateQuotaDimensionAccess({
    snapshot,
    dimension: 'projects',
    requested_delta: 1,
    action: 'create_project',
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason_code, 'PROJECT_CAP_EXCEEDED');
  assert.equal(decision.projected_usage, 2);
});

test('BIL-04: hold snapshots continue exposing billing evidence and settings during recovery', () => {
  const snapshot = buildEntitlementSnapshot({
    status: 'hold',
    reason_code: 'PAYMENT_METHOD_DECLINED',
    restricted_actions: ['execute_task', 'write_campaigns'],
  });

  const decision = evaluateEntitlementAccess({
    snapshot,
    action: 'review_billing_settings',
    actor_role: 'billing-admin',
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.reason_code, null);
});