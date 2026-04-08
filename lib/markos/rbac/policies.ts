/**
 * Policy Bridge: Legacy route-based checks → IAM v3.2 action-scoped authorization
 * 
 * This module maintains backward compatibility with legacy role checks while
 * routing through the canonical v3.2 IAM model for deterministic permission evaluation.
 * 
 * Phase 51-03: Integration point between legacy route authorization and action-level IAM.
 */

const LEGACY_TO_IAM_MAPPING = Object.freeze({
  owner: "owner",
  operator: "tenant-admin",
  strategist: "manager",
  viewer: "readonly",
  agent: "owner",
} satisfies Record<MarkOSRole, string>);

const ACTION_POLICY = Object.freeze({
  read_operations: [
    "owner",
    "tenant-admin",
    "manager",
    "contributor",
    "reviewer",
    "billing-admin",
    "readonly",
  ],
  execute_task: ["owner", "tenant-admin", "manager"],
  retry_task: ["owner", "tenant-admin", "manager"],
  approve_task: ["owner", "tenant-admin", "manager", "reviewer"],
  send_outbound: ["owner", "tenant-admin", "manager", "contributor"],
  approve_outbound: ["owner", "tenant-admin", "manager", "reviewer"],
  plan_approve: ["owner", "tenant-admin", "manager", "reviewer"],
  plan_reject: ["owner", "tenant-admin", "manager", "reviewer"],
  publish_campaign: ["owner", "tenant-admin", "manager"],
  manage_billing: ["owner", "billing-admin"],
  manage_users: ["owner", "tenant-admin"],
  access_analytics: [
    "owner",
    "tenant-admin",
    "manager",
    "contributor",
    "reviewer",
    "billing-admin",
    "readonly",
  ],
  view_copilot: [
    "owner",
    "tenant-admin",
    "manager",
    "contributor",
    "reviewer",
    "readonly",
  ],
  package_copilot_action: ["owner", "tenant-admin", "manager", "reviewer"],
  approve_copilot_action: ["owner", "tenant-admin", "manager", "reviewer"],
  run_copilot_playbook: ["owner", "tenant-admin", "manager", "reviewer"],
  review_cross_tenant_copilot: ["owner"],
} satisfies Record<string, string[]>);

function validateLegacyRole(role: string): string {
  if (typeof role !== "string") {
    const err = new Error(`Legacy role must be string, got ${typeof role}`) as Error & {
      code?: string;
    };
    err.code = "INVALID_LEGACY_ROLE_TYPE";
    throw err;
  }

  const mapped = LEGACY_TO_IAM_MAPPING[role as MarkOSRole];
  if (!mapped) {
    const err = new Error(
      `Unmapped legacy role: ${role}. Supported: ${Object.keys(LEGACY_TO_IAM_MAPPING).join(", ")}`
    ) as Error & { code?: string };
    err.code = "UNMAPPED_LEGACY_ROLE";
    throw err;
  }

  return mapped;
}

function canPerformAction(role: string, action: string): boolean {
  if (!role || !action) {
    return false;
  }

  const allowedRoles = ACTION_POLICY[action];
  return Array.isArray(allowedRoles) ? allowedRoles.includes(role) : false;
}

export type MarkOSRole = "owner" | "operator" | "strategist" | "viewer" | "agent";

export type RouteKey =
  | "dashboard"
  | "operations"
  | "company"
  | "mir"
  | "msp"
  | "icps"
  | "segments"
  | "campaigns"
  | "settings";

const routePermissions: Record<RouteKey, MarkOSRole[]> = {
  dashboard: ["owner", "operator", "strategist", "viewer", "agent"],
  operations: ["owner", "operator"],
  company: ["owner", "operator", "strategist", "agent"],
  mir: ["owner", "operator", "strategist", "agent"],
  msp: ["owner", "operator", "strategist", "agent"],
  icps: ["owner", "operator", "strategist", "agent"],
  segments: ["owner", "operator", "strategist", "agent"],
  campaigns: ["owner", "operator", "strategist", "agent"],
  settings: ["owner", "operator"],
};

/**
 * Routes mapped to required IAM v3.2 actions
 * Used by canAccessRoute() to perform action-level authorization
 */
const routeToActionMapping: Record<RouteKey, string> = {
  dashboard: 'read_operations',
  operations: 'execute_task',
  company: 'read_operations',
  mir: 'read_operations',
  msp: 'read_operations',
  icps: 'read_operations',
  segments: 'read_operations',
  campaigns: 'publish_campaign',
  settings: 'manage_users',
};

/**
 * mapLegacyRoleToIamRole(legacy: MarkOSRole): string
 * 
 * Bridge function: converts legacy role to canonical IAM role for deterministic authorization.
 * Used during transition period to ensure compatibility without privilege widening.
 * 
 * @param {MarkOSRole} role - Legacy role name
 * @returns {string} Mapped v3.2 IAM role
 * @throws Error if role is unmapped or invalid
 */
function mapLegacyRoleToIamRole(role: MarkOSRole): string {
  try {
    return validateLegacyRole(role);
  } catch (err: any) {
    // Fallback: treat unmapped role as readonly (fail-closed)
    if (err.code === 'UNMAPPED_LEGACY_ROLE') {
      console.warn(`Unmapped legacy role: ${role}, falling back to readonly`);
      return 'readonly';
    }
    throw err;
  }
}

/**
 * canAccessRoute(role: MarkOSRole, route: string): boolean
 * 
 * Legacy route-level access check.
 * Used for backward compatibility during transition to action-based authorization.
 * Routes are mapped to abstract actions and checked against IAM v3.2 policy.
 * 
 * @param {MarkOSRole} role - Actor's legacy role
 * @param {string} route - Route name
 * @returns {boolean} True if authorized, false otherwise (fail-closed)
 */
export function canAccess(role: MarkOSRole, route: string): boolean {
  const castRoute = route as RouteKey;
  
  // Fail-closed: unknown route
  if (!routePermissions[castRoute]) {
    return false;
  }

  // Legacy check (for now, still do route permission check)
  const legacyAllowed = routePermissions[castRoute].includes(role);
  if (!legacyAllowed) {
    return false;
  }

  // NEW: Also check against action-level policy via IAM mapping
  try {
    const iamRole = mapLegacyRoleToIamRole(role);
    const requiredAction = routeToActionMapping[castRoute] || 'read_operations';
    return canPerformAction(iamRole, requiredAction);
  } catch (err) {
    console.error(`Error checking action-level permission for ${role}/${route}:`, err);
    return false;
  }
}

/**
 * canPublish(role: MarkOSRole): boolean
 * 
 * Specific check for publish/campaign operations.
 * Maps to IAM v3.2 'publish_campaign' action.
 * 
 * @param {MarkOSRole} role - Actor's legacy role
 * @returns {boolean} True if authorized to publish, false otherwise
 */
export function canPublish(role: MarkOSRole): boolean {
  try {
    const iamRole = mapLegacyRoleToIamRole(role);
    return canPerformAction(iamRole, 'publish_campaign');
  } catch (err) {
    console.error(`Error checking publish permission for ${role}:`, err);
    return false;
  }
}
