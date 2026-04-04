'use strict';

const DEFAULT_PREMIUM_FEATURE_FLAGS = Object.freeze({
  enterprise_sso: true,
  governance_exports: true,
  premium_campaign_publish: true,
});

const DEFAULT_ALLOWANCES = Object.freeze({
  seats: 10,
  projects: 5,
  agent_runs: 1000,
  token_budget: 100000,
  storage_gb_days: 50,
  premium_feature_flags: DEFAULT_PREMIUM_FEATURE_FLAGS,
});

const DEFAULT_USAGE_TO_DATE = Object.freeze({
  seats: 1,
  projects: 1,
  agent_runs: 1,
  token_budget: 12,
  storage_gb_days: 0,
});

function cloneFlags(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_PREMIUM_FEATURE_FLAGS };
  }

  return {
    ...DEFAULT_PREMIUM_FEATURE_FLAGS,
    ...value,
  };
}

function normalizeAllowances(value = {}) {
  return {
    ...DEFAULT_ALLOWANCES,
    ...value,
    token_budget: Number(value.token_budget ?? value.token_units ?? DEFAULT_ALLOWANCES.token_budget),
    premium_feature_flags: cloneFlags(value.premium_feature_flags),
  };
}

function normalizeUsageToDate(value = {}) {
  return {
    ...DEFAULT_USAGE_TO_DATE,
    ...value,
    token_budget: Number(value.token_budget ?? value.token_units ?? DEFAULT_USAGE_TO_DATE.token_budget),
  };
}

function buildEntitlementSnapshot(overrides = {}) {
  return Object.freeze({
    snapshot_id: String(overrides.snapshot_id || 'entitlement-snapshot-001'),
    tenant_id: String(overrides.tenant_id || 'tenant-alpha-001'),
    billing_period_start: String(overrides.billing_period_start || '2026-04-01T00:00:00.000Z'),
    billing_period_end: String(overrides.billing_period_end || '2026-04-30T23:59:59.999Z'),
    plan_key: String(overrides.plan_key || 'growth-monthly'),
    status: overrides.status || 'active',
    enforcement_source: 'markos-ledger',
    restricted_actions: Array.isArray(overrides.restricted_actions) ? overrides.restricted_actions.slice() : [],
    restricted_capabilities: Array.isArray(overrides.restricted_capabilities) ? overrides.restricted_capabilities.slice() : [],
    allowances: normalizeAllowances(overrides.allowances || {}),
    usage_to_date: normalizeUsageToDate(overrides.usage_to_date || {}),
    read_access_preserved: overrides.read_access_preserved !== false,
    reason_code: overrides.reason_code || null,
  });
}

function isReadVisibleAction(action = '') {
  const normalized = String(action || '').trim().toLowerCase();
  return normalized.startsWith('read_')
    || normalized.startsWith('view_')
    || normalized.includes('evidence')
    || normalized.includes('invoice')
    || normalized.includes('summary');
}

function buildBillingDenyReason({ snapshot, action, capability } = {}) {
  const normalizedSnapshot = buildEntitlementSnapshot(snapshot || {});

  if (normalizedSnapshot.reason_code) {
    return normalizedSnapshot.reason_code;
  }

  if (capability) {
    return 'PLAN_CAP_EXCEEDED';
  }

  if (normalizedSnapshot.status === 'hold') {
    return 'BILLING_HOLD_ACTIVE';
  }

  if (normalizedSnapshot.status === 'restricted') {
    return 'ENTITLEMENT_RESTRICTED';
  }

  if (normalizedSnapshot.status === 'degraded' && !isReadVisibleAction(action)) {
    return 'ENTITLEMENT_DEGRADED';
  }

  return 'BILLING_POLICY_BLOCKED';
}

function evaluateEntitlementAccess({ snapshot, action, actor_role } = {}) {
  const normalizedSnapshot = buildEntitlementSnapshot(snapshot || {});
  const normalizedAction = String(action || 'unknown');
  const readVisibleAction = isReadVisibleAction(normalizedAction);
  const blockedByRestriction = normalizedSnapshot.restricted_actions.includes(normalizedAction);
  const blockedByState = !readVisibleAction && (normalizedSnapshot.status === 'hold' || normalizedSnapshot.status === 'restricted');
  const allowed = !blockedByRestriction && !blockedByState;

  return Object.freeze({
    allowed,
    action: normalizedAction,
    actor_role: actor_role || 'unknown',
    billing_state: normalizedSnapshot.status,
    reason_code: allowed ? null : buildBillingDenyReason({ snapshot: normalizedSnapshot, action: normalizedAction }),
    enforcement_source: normalizedSnapshot.enforcement_source,
    read_access_preserved: normalizedSnapshot.read_access_preserved && readVisibleAction,
  });
}

function assertEntitledAction({ snapshot, action, actor_role } = {}) {
  const decision = evaluateEntitlementAccess({ snapshot, action, actor_role });

  if (!decision.allowed) {
    const error = new Error(decision.reason_code || 'BILLING_POLICY_BLOCKED');
    error.code = decision.reason_code || 'BILLING_POLICY_BLOCKED';
    error.statusCode = 403;
    error.decision = decision;
    throw error;
  }

  return decision;
}

function evaluatePluginCapabilityAccess({ snapshot, plugin_id, capability, downstream_provider_state } = {}) {
  const normalizedSnapshot = buildEntitlementSnapshot(snapshot || {});
  const normalizedCapability = String(capability || 'unknown');
  const readCapability = normalizedCapability.startsWith('read_');
  const blockedByCapability = normalizedSnapshot.restricted_capabilities.includes(normalizedCapability);
  const blockedByState = !readCapability && (normalizedSnapshot.status === 'hold' || normalizedSnapshot.status === 'restricted');
  const allowed = !blockedByCapability && !blockedByState;

  return Object.freeze({
    allowed,
    plugin_id: plugin_id || 'unknown',
    capability: normalizedCapability,
    billing_state: normalizedSnapshot.status,
    reason_code: allowed ? null : buildBillingDenyReason({ snapshot: normalizedSnapshot, action: normalizedCapability, capability: normalizedCapability }),
    enforcement_source: normalizedSnapshot.enforcement_source,
    provider_truth_source: normalizedSnapshot.enforcement_source,
    downstream_provider_state: downstream_provider_state || null,
  });
}

module.exports = {
  buildEntitlementSnapshot,
  buildBillingDenyReason,
  evaluateEntitlementAccess,
  assertEntitledAction,
  evaluatePluginCapabilityAccess,
};