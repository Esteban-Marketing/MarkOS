/**
 * lib/markos/tenant/contracts.js
 * 
 * Canonical tenant and membership contracts for MarkOS v3.2.
 * Shared by runtime and policy layers to enforce deterministic tenant identity and role semantics.
 * 
 * Core principles:
 * - tenant_id is mandatory in all tenant-scoped types
 * - workspace_id is compatibility-only metadata during transition
 * - Legacy roles map deterministically to v3.2 IAM roles
 * - Unmapped roles are rejected with deterministic error codes
 */

'use strict';

/**
 * TenantMembership contract
 * Represents explicit user → tenant membership with IAM role.
 * Replaces implicit workspace-scope model.
 */
const TenantMembership = {
  memb_fields: [
    'membership_id',  // pk
    'user_id',        // who
    'tenant_id',      // partition key; mandatory
    'iam_role',       // v3.2 canonical role
    'legacy_role',    // compatibility mapping
    'created_at',
    'updated_at',
  ],
  compatibility_fields: [
    'workspace_id',   // legacy fallback during migration
  ],
  description: 'Explicit many-to-many user→role→tenant membership',
};

/**
 * TenantPrincipal contract
 * Runtime principal context resolved at auth boundary.
 * Attached to every request and propagated through handler/job/agent calls.
 */
const TenantPrincipal = {
  principal_fields: [
    'actor_id',        // authenticated user_id
    'actor_name',      // for audit trails
    'active_tenant_id', // requested/current tenant
    'memberships',     // array of {tenant_id, iam_role, legacy_role}
    'auth_source',     // 'supabase_user' or 'supabase_service_role'
    'request_id',      // correlation id
    'created_at',      // when resolved
  ],
  description: 'Immutable principal bound to request; fail-closed if absent',
};

/**
 * IamRole contract
 * v3.2 canonical role set for authorization decisions.
 */
const IamRole = {
  valid_roles: [
    'owner',           // tenant creator, all permissions
    'tenant-admin',    // administrative operations
    'manager',         // plan/campaign operations
    'contributor',     // create/edit content
    'reviewer',        // approval gates
    'billing-admin',   // billing and usage
    'readonly',        // read-only access
  ],
  description: 'Canonical v3.2 IAM role set for action authorization',
};

/**
 * LegacyRole contract
 * v3.1 and earlier roles for compatibility during migration.
 */
const LegacyRole = {
  valid_roles: [
    'owner',      // creator role
    'operator',   // primary operator
    'strategist', // strategic overview
    'viewer',     // read-only
    'agent',      // automated/script role
  ],
  description: 'Legacy v3.1 roles used during transition',
};

/**
 * LEGACY_TO_IAM_MAPPING
 * Deterministic mapping from legacy roles to v3.2 IAM roles.
 * Acts as the compatibility bridge during schema and runtime transition.
 */
const LEGACY_TO_IAM_MAPPING = Object.freeze({
  owner: 'owner',           // owner → owner (direct)
  operator: 'tenant-admin', // operator → tenant-admin (primary ops role)
  strategist: 'manager',    // strategist → manager (plan/campaign ops)
  viewer: 'readonly',       // viewer → readonly (read-only access)
  agent: 'owner',           // agent → owner (scripts run with full permissions for now)
});

/**
 * validateLegacyRole(role: string): string
 * Validates legacy role and returns mapped v3.2 role.
 * Rejects unmapped roles with deterministic error for safety.
 * 
 * @param {string} role - Legacy role name
 * @returns {string} Mapped v3.2 IAM role
 * @throws {Error} with code UNMAPPED_LEGACY_ROLE if role is not in mapping
 */
function validateLegacyRole(role) {
  if (typeof role !== 'string') {
    const err = new Error(`Legacy role must be string, got ${typeof role}`);
    err.code = 'INVALID_LEGACY_ROLE_TYPE';
    throw err;
  }

  const mapped = LEGACY_TO_IAM_MAPPING[role];
  if (!mapped) {
    const err = new Error(`Unmapped legacy role: ${role}. Supported: ${Object.keys(LEGACY_TO_IAM_MAPPING).join(', ')}`);
    err.code = 'UNMAPPED_LEGACY_ROLE';
    throw err;
  }

  return mapped;
}

/**
 * Export all contracts and helpers for use by runtime and test layers.
 */
module.exports = {
  TenantMembership,
  TenantPrincipal,
  IamRole,
  LegacyRole,
  LEGACY_TO_IAM_MAPPING,
  validateLegacyRole,
};
