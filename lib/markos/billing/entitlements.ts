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

function isReadVisibleAction(action = ''): boolean {
  const normalized = String(action || '').trim().toLowerCase();
  return normalized.startsWith('read_')
    || normalized.startsWith('view_')
    || normalized.includes('evidence')
    || normalized.includes('invoice')
    || normalized.includes('summary');
}

export function buildEntitlementSnapshot(overrides: Partial<EntitlementSnapshot> = {}): EntitlementSnapshot {
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
    allowances: {
      ...DEFAULT_ALLOWANCES,
      ...(overrides.allowances || {}),
      token_budget: Number((overrides.allowances as Record<string, number> | undefined)?.token_budget ?? (overrides.allowances as Record<string, number> | undefined)?.token_units ?? DEFAULT_ALLOWANCES.token_budget),
      premium_feature_flags: {
        ...DEFAULT_PREMIUM_FEATURE_FLAGS,
        ...((overrides.allowances as EntitlementSnapshot['allowances'] | undefined)?.premium_feature_flags || {}),
      },
    },
    usage_to_date: {
      ...DEFAULT_USAGE_TO_DATE,
      ...(overrides.usage_to_date || {}),
      token_budget: Number((overrides.usage_to_date as Record<string, number> | undefined)?.token_budget ?? (overrides.usage_to_date as Record<string, number> | undefined)?.token_units ?? DEFAULT_USAGE_TO_DATE.token_budget),
    },
    read_access_preserved: overrides.read_access_preserved !== false,
    reason_code: overrides.reason_code || null,
  };
}

export function buildBillingDenyReason({ snapshot, action, capability }: { snapshot?: Partial<EntitlementSnapshot>; action?: string; capability?: string } = {}): string {
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

export function evaluateEntitlementAccess({ snapshot, action, actor_role }: { snapshot?: Partial<EntitlementSnapshot>; action?: string; actor_role?: string } = {}): EntitlementDecision {
  const normalizedSnapshot = buildEntitlementSnapshot(snapshot || {});
  const normalizedAction = String(action || 'unknown');
  const readVisibleAction = isReadVisibleAction(normalizedAction);
  const blockedByRestriction = normalizedSnapshot.restricted_actions.includes(normalizedAction);
  const blockedByState = !readVisibleAction && (normalizedSnapshot.status === 'hold' || normalizedSnapshot.status === 'restricted');
  const allowed = !blockedByRestriction && !blockedByState;

  return {
    allowed,
    action: normalizedAction,
    actor_role: actor_role || 'unknown',
    billing_state: normalizedSnapshot.status,
    reason_code: allowed ? null : buildBillingDenyReason({ snapshot: normalizedSnapshot, action: normalizedAction }),
    enforcement_source: normalizedSnapshot.enforcement_source,
    read_access_preserved: normalizedSnapshot.read_access_preserved && readVisibleAction,
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
  const allowed = !blockedByCapability && !blockedByState;

  return {
    allowed,
    plugin_id: plugin_id || 'unknown',
    capability: normalizedCapability,
    billing_state: normalizedSnapshot.status,
    reason_code: allowed ? null : buildBillingDenyReason({ snapshot: normalizedSnapshot, action: normalizedCapability, capability: normalizedCapability }),
    enforcement_source: normalizedSnapshot.enforcement_source,
    provider_truth_source: normalizedSnapshot.enforcement_source,
  };
}