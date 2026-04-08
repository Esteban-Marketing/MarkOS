import type { EntitlementSnapshot } from './contracts';

type EntitlementDecision = {
  allowed: boolean;
  action: string;
  actor_role: string;
  billing_state: EntitlementSnapshot['status'];
  reason_code: string | null;
  enforcement_source: EntitlementSnapshot['enforcement_source'];
  read_access_preserved: boolean;
};

type PluginEntitlementDecision = {
  allowed: boolean;
  plugin_id: string;
  capability: string;
  billing_state: EntitlementSnapshot['status'];
  reason_code: string | null;
  enforcement_source: EntitlementSnapshot['enforcement_source'];
  provider_truth_source: EntitlementSnapshot['enforcement_source'];
};

type QuotaDimensionDecision = {
  allowed: boolean;
  action: string;
  dimension: string;
  requested_delta: number;
  billing_state: EntitlementSnapshot['status'];
  quota_state: EntitlementSnapshot['quota_state'][string];
  current_usage: number;
  projected_usage: number;
  allowance: number;
  reason_code: string | null;
  enforcement_source: EntitlementSnapshot['enforcement_source'];
  read_access_preserved: boolean;
};

const QUOTA_DIMENSIONS = ['seats', 'projects', 'agent_runs', 'token_budget', 'storage_gb_days'] as const;

const QUOTA_REASON_BY_DIMENSION: Record<string, string> = {
  seats: 'SEAT_CAP_EXCEEDED',
  projects: 'PROJECT_CAP_EXCEEDED',
  agent_runs: 'AGENT_RUN_LIMIT_EXCEEDED',
  token_budget: 'TOKEN_BUDGET_EXHAUSTED',
  storage_gb_days: 'STORAGE_BUDGET_EXHAUSTED',
};

const DEFAULT_PREMIUM_FEATURE_FLAGS = {
  enterprise_sso: true,
  governance_exports: true,
  premium_campaign_publish: true,
} as const;

const DEFAULT_ALLOWANCES = {
  seats: 10,
  projects: 5,
  agent_runs: 1000,
  token_budget: 100000,
  storage_gb_days: 50,
  premium_feature_flags: DEFAULT_PREMIUM_FEATURE_FLAGS,
} as const;

const DEFAULT_USAGE_TO_DATE = {
  seats: 1,
  projects: 1,
  agent_runs: 1,
  token_budget: 12,
  storage_gb_days: 0,
} as const;

const DEFAULT_QUOTA_STATE = {
  seats: 'within_limit',
  projects: 'within_limit',
  agent_runs: 'within_limit',
  token_budget: 'within_limit',
  storage_gb_days: 'within_limit',
} as const;

function deriveQuotaStateValue({
  allowance,
  usage,
  requestedDelta = 0,
}: {
  allowance?: number;
  usage?: number;
  requestedDelta?: number;
}): EntitlementSnapshot['quota_state'][string] {
  const normalizedAllowance = Number.isFinite(Number(allowance)) ? Number(allowance) : 0;
  const normalizedUsage = Number.isFinite(Number(usage)) ? Number(usage) : 0;
  const normalizedRequestedDelta = Number.isFinite(Number(requestedDelta)) ? Number(requestedDelta) : 0;
  const projectedUsage = normalizedUsage + normalizedRequestedDelta;

  if (normalizedAllowance <= 0) {
    return projectedUsage > 0 ? 'over_limit' : 'at_limit';
  }

  if (projectedUsage > normalizedAllowance) {
    return 'over_limit';
  }

  if (projectedUsage === normalizedAllowance) {
    return 'at_limit';
  }

  return 'within_limit';
}

function normalizeQuotaState(
  value: Partial<EntitlementSnapshot['quota_state']> = {},
  allowances: EntitlementSnapshot['allowances'],
  usageToDate: EntitlementSnapshot['usage_to_date'],
): EntitlementSnapshot['quota_state'] {
  const quotaState = { ...DEFAULT_QUOTA_STATE } as EntitlementSnapshot['quota_state'];

  for (const dimension of QUOTA_DIMENSIONS) {
    const explicitState = value[dimension];
    quotaState[dimension] = explicitState || deriveQuotaStateValue({
      allowance: Number(allowances[dimension]),
      usage: Number(usageToDate[dimension]),
    });
  }

  for (const [dimension, state] of Object.entries(value)) {
    if (typeof state === 'string') {
      quotaState[dimension] = state as EntitlementSnapshot['quota_state'][string];
    }
  }

  return quotaState;
}

function isRecoverySurfaceAction(action = ''): boolean {
  const normalized = String(action || '').trim().toLowerCase();
  return isReadVisibleAction(normalized)
    || normalized.includes('billing')
    || normalized.includes('invoice')
    || normalized.includes('evidence')
    || normalized.includes('summary')
    || normalized.includes('settings');
}

function getQuotaDimensionReason(dimension = ''): string {
  return QUOTA_REASON_BY_DIMENSION[dimension] || 'BILLING_POLICY_BLOCKED';
}

function evaluateQuotaState(
  snapshot: EntitlementSnapshot,
  dimension = 'token_budget',
  requestedDelta = 0,
) {
  const allowance = Number(snapshot.allowances[dimension] ?? 0);
  const currentUsage = Number(snapshot.usage_to_date[dimension] ?? 0);
  const projectedUsage = currentUsage + requestedDelta;
  const quotaState = requestedDelta === 0
    ? snapshot.quota_state[dimension] || deriveQuotaStateValue({ allowance, usage: currentUsage })
    : deriveQuotaStateValue({ allowance, usage: currentUsage, requestedDelta });

  return {
    dimension,
    allowance,
    current_usage: currentUsage,
    projected_usage: projectedUsage,
    quota_state: quotaState,
    exceeded: quotaState === 'over_limit',
    reason_code: quotaState === 'over_limit' ? getQuotaDimensionReason(dimension) : null,
  };
}

function getActionQuotaBlock(snapshot: EntitlementSnapshot) {
  for (const dimension of ['token_budget', 'agent_runs']) {
    const decision = evaluateQuotaState(snapshot, dimension);
    if (decision.exceeded) {
      return decision;
    }
  }

  return null;
}

function isReadVisibleAction(action = ''): boolean {
  const normalized = String(action || '').trim().toLowerCase();
  return normalized.startsWith('read_')
    || normalized.startsWith('view_')
    || normalized.includes('evidence')
    || normalized.includes('invoice')
    || normalized.includes('summary');
}

export function buildEntitlementSnapshot(overrides: Partial<EntitlementSnapshot> = {}): EntitlementSnapshot {
  const allowances = {
    ...DEFAULT_ALLOWANCES,
    ...(overrides.allowances || {}),
    token_budget: Number((overrides.allowances as Record<string, number> | undefined)?.token_budget ?? (overrides.allowances as Record<string, number> | undefined)?.token_units ?? DEFAULT_ALLOWANCES.token_budget),
    premium_feature_flags: {
      ...DEFAULT_PREMIUM_FEATURE_FLAGS,
      ...((overrides.allowances as EntitlementSnapshot['allowances'] | undefined)?.premium_feature_flags || {}),
    },
  };
  const usageToDate = {
    ...DEFAULT_USAGE_TO_DATE,
    ...(overrides.usage_to_date || {}),
    token_budget: Number((overrides.usage_to_date as Record<string, number> | undefined)?.token_budget ?? (overrides.usage_to_date as Record<string, number> | undefined)?.token_units ?? DEFAULT_USAGE_TO_DATE.token_budget),
  };

  return {
    snapshot_id: String(overrides.snapshot_id || 'entitlement-snapshot-001'),
    tenant_id: String(overrides.tenant_id || 'tenant-alpha-001'),
    billing_period_start: String(overrides.billing_period_start || '2026-04-01T00:00:00.000Z'),
    billing_period_end: String(overrides.billing_period_end || '2026-04-30T23:59:59.999Z'),
    plan_key: String(overrides.plan_key || 'growth-monthly'),
    status: overrides.status || 'active',
    enforcement_source: 'markos-ledger',
    restricted_actions: Array.isArray(overrides.restricted_actions) ? overrides.restricted_actions.slice() : [],
    restricted_capabilities: Array.isArray(overrides.restricted_capabilities) ? overrides.restricted_capabilities.slice() : [],
    allowances,
    usage_to_date: usageToDate,
    quota_state: normalizeQuotaState(overrides.quota_state || {}, allowances, usageToDate),
    read_access_preserved: overrides.read_access_preserved !== false,
    reason_code: overrides.reason_code || null,
  };
}

export function buildBillingDenyReason({
  snapshot,
  action,
  capability,
  quota_dimension,
  requested_delta,
}: {
  snapshot?: Partial<EntitlementSnapshot>;
  action?: string;
  capability?: string;
  quota_dimension?: string;
  requested_delta?: number;
} = {}): string {
  const normalizedSnapshot = buildEntitlementSnapshot(snapshot || {});

  if (quota_dimension) {
    const quotaDecision = evaluateQuotaState(normalizedSnapshot, quota_dimension, requested_delta || 0);
    if (quotaDecision.exceeded) {
      return quotaDecision.reason_code || 'BILLING_POLICY_BLOCKED';
    }
  }

  if (normalizedSnapshot.reason_code) {
    return normalizedSnapshot.reason_code;
  }

  const actionQuotaBlock = getActionQuotaBlock(normalizedSnapshot);
  if (actionQuotaBlock) {
    return actionQuotaBlock.reason_code || 'BILLING_POLICY_BLOCKED';
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

export function evaluateEntitlementAccess({ snapshot, action, actor_role }: { snapshot?: Partial<EntitlementSnapshot>; action?: string; actor_role?: string } = {}): EntitlementDecision {
  const normalizedSnapshot = buildEntitlementSnapshot(snapshot || {});
  const normalizedAction = String(action || 'unknown');
  const recoveryAction = isRecoverySurfaceAction(normalizedAction);
  const blockedByRestriction = normalizedSnapshot.restricted_actions.includes(normalizedAction);
  const blockedByState = !recoveryAction && (normalizedSnapshot.status === 'hold' || normalizedSnapshot.status === 'restricted');
  const quotaBlock = recoveryAction ? null : getActionQuotaBlock(normalizedSnapshot);
  const allowed = !blockedByRestriction && !blockedByState && !quotaBlock;

  return {
    allowed,
    action: normalizedAction,
    actor_role: actor_role || 'unknown',
    billing_state: normalizedSnapshot.status,
    reason_code: allowed
      ? null
      : quotaBlock?.reason_code || buildBillingDenyReason({ snapshot: normalizedSnapshot, action: normalizedAction }),
    enforcement_source: normalizedSnapshot.enforcement_source,
    read_access_preserved: normalizedSnapshot.read_access_preserved && recoveryAction,
  };
}

export function assertEntitledAction({ snapshot, action, actor_role }: { snapshot?: Partial<EntitlementSnapshot>; action?: string; actor_role?: string } = {}): EntitlementDecision {
  const decision = evaluateEntitlementAccess({ snapshot, action, actor_role });

  if (!decision.allowed) {
    throw new Error(decision.reason_code || 'BILLING_POLICY_BLOCKED');
  }

  return decision;
}

export function evaluatePluginCapabilityAccess({ snapshot, plugin_id, capability }: { snapshot?: Partial<EntitlementSnapshot>; plugin_id?: string; capability?: string }): PluginEntitlementDecision {
  const normalizedSnapshot = buildEntitlementSnapshot(snapshot || {});
  const normalizedCapability = String(capability || 'unknown');
  const readCapability = normalizedCapability.startsWith('read_');
  const blockedByCapability = normalizedSnapshot.restricted_capabilities.includes(normalizedCapability);
  const blockedByState = !readCapability && (normalizedSnapshot.status === 'hold' || normalizedSnapshot.status === 'restricted');
  const quotaBlock = readCapability ? null : getActionQuotaBlock(normalizedSnapshot);
  const allowed = !blockedByCapability && !blockedByState && !quotaBlock;

  return {
    allowed,
    plugin_id: plugin_id || 'unknown',
    capability: normalizedCapability,
    billing_state: normalizedSnapshot.status,
    reason_code: allowed
      ? null
      : quotaBlock?.reason_code || buildBillingDenyReason({ snapshot: normalizedSnapshot, action: normalizedCapability, capability: normalizedCapability }),
    enforcement_source: normalizedSnapshot.enforcement_source,
    provider_truth_source: normalizedSnapshot.enforcement_source,
  };
}

export function evaluateQuotaDimensionAccess({
  snapshot,
  dimension,
  requested_delta,
  action,
}: {
  snapshot?: Partial<EntitlementSnapshot>;
  dimension?: string;
  requested_delta?: number;
  action?: string;
} = {}): QuotaDimensionDecision {
  const normalizedSnapshot = buildEntitlementSnapshot(snapshot || {});
  const normalizedAction = String(action || 'unknown');
  const normalizedDimension = String(dimension || 'token_budget');
  const normalizedRequestedDelta = Number.isFinite(Number(requested_delta)) ? Number(requested_delta) : 0;
  const recoveryAction = isRecoverySurfaceAction(normalizedAction);
  const quotaDecision = evaluateQuotaState(normalizedSnapshot, normalizedDimension, normalizedRequestedDelta);
  const allowed = recoveryAction || !quotaDecision.exceeded;

  return {
    allowed,
    action: normalizedAction,
    dimension: normalizedDimension,
    requested_delta: normalizedRequestedDelta,
    billing_state: normalizedSnapshot.status,
    quota_state: quotaDecision.quota_state,
    current_usage: quotaDecision.current_usage,
    projected_usage: quotaDecision.projected_usage,
    allowance: quotaDecision.allowance,
    reason_code: allowed ? null : quotaDecision.reason_code,
    enforcement_source: normalizedSnapshot.enforcement_source,
    read_access_preserved: normalizedSnapshot.read_access_preserved && recoveryAction,
  };
}