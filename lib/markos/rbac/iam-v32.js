/**
 * lib/markos/rbac/iam-v32.js
 * 
 * Canonical IAM v3.2 role definitions and action-level permission matrix.
 * 
 * This module provides:
 * - IAM_V32_ROLES: Array of canonical roles
 * - ACTION_POLICY: Role-scoped action permission matrix
 * - canPerformAction(role, action): Deterministic access check (default deny)
 * 
 * All authorization decisions use fail-closed semantics:
 * - Unknown roles → denied
 * - Unknown actions → denied
 * - Null/undefined inputs → denied
 */

'use strict';

/**
 * IAM_V32_ROLES: Canonical role set for MarkOS v3.2
 */
export const IAM_V32_ROLES = Object.freeze([
  'owner',           // Tenant creator, all permissions
  'tenant-admin',    // Administrative operations within tenant
  'manager',         // Plan and campaign operations
  'contributor',     // Create and edit content
  'reviewer',        // Approval gates and review
  'billing-admin',   // Billing and usage management
  'readonly',        // Read-only access
]);

/**
 * ACTION_POLICY: Role-scoped permission matrix
 * 
 * Maps actions to arrays of roles authorized to perform them.
 * Any role not explicitly listed is denied (fail-closed).
 */
export const ACTION_POLICY = Object.freeze({
  // Read and observe
  read_operations: [
    'owner',
    'tenant-admin',
    'manager',
    'contributor',
    'reviewer',
    'billing-admin',
    'readonly',
  ],

  // Execute operations
  execute_task: [
    'owner',
    'tenant-admin',
    'manager',
  ],

  // Retry failed tasks
  retry_task: [
    'owner',
    'tenant-admin',
    'manager',
  ],

  // Approve tasks at gates
  approve_task: [
    'owner',
    'tenant-admin',
    'manager',
    'reviewer',
  ],

  // Explicit aliases for plan approval/rejection gates
  plan_approve: [
    'owner',
    'tenant-admin',
    'manager',
    'reviewer',
  ],
  plan_reject: [
    'owner',
    'tenant-admin',
    'manager',
    'reviewer',
  ],

  // Publish campaigns
  publish_campaign: [
    'owner',
    'tenant-admin',
    'manager',
  ],

  // Manage billing
  manage_billing: [
    'owner',
    'billing-admin',
  ],

  // Manage users and roles
  manage_users: [
    'owner',
    'tenant-admin',
  ],

  // Access analytics
  access_analytics: [
    'owner',
    'tenant-admin',
    'manager',
    'contributor',
    'reviewer',
    'billing-admin',
    'readonly',
  ],
});

/**
 * canPerformAction(role, action): boolean
 * 
 * Deterministic authorization check.
 * Returns true if the role is authorized for the action.
 * Returns false for any unknown role, unknown action, or null/undefined inputs.
 * 
 * @param {string} role - The actor's role
 * @param {string} action - The requested action
 * @returns {boolean} True if authorized, false otherwise (fail-closed)
 */
export function canPerformAction(role, action) {
  // Fail-closed: null or undefined inputs deny access
  if (!role || !action) {
    return false;
  }

  // Fail-closed: unknown action denies access
  const allowedRoles = ACTION_POLICY[action];
  if (!Array.isArray(allowedRoles)) {
    return false;
  }

  // Check if role is in the allowed list
  return allowedRoles.includes(role);
}
