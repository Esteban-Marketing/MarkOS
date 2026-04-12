'use strict';

/**
 * visibility-scope.cjs — Role and tenant scope guard for sync/audit visibility endpoints.
 *
 * Phase 85 scope boundary: ingestion-adjacent visibility only.
 * Phase 86/87 retrieval role-views are explicitly deferred.
 */

const ALLOWED_VISIBILITY_ROLES = new Set(['operator', 'admin', 'audit-viewer']);

/**
 * Check whether a claims object has sufficient tenant + role authority
 * to access the specified resource context.
 *
 * Returns { allowed: boolean, code: string|null, reason: string|null }.
 * Fails closed on any missing or mismatched claim.
 */
function checkVisibilityScope(claims, resourceContext) {
  const claimTenantId = String((claims && claims.tenantId) || '').trim();
  const claimRole = String((claims && claims.role) || '').trim();

  if (!claimTenantId || !claimRole) {
    return {
      allowed: false,
      code: 'E_SCOPE_CLAIMS_MISSING',
      reason: 'Valid tenant and role claims are required for visibility access.',
    };
  }

  if (!ALLOWED_VISIBILITY_ROLES.has(claimRole)) {
    return {
      allowed: false,
      code: 'E_SCOPE_ROLE_DENIED',
      reason: `Role '${claimRole}' is not permitted to access ingestion visibility.`,
    };
  }

  const resourceTenantId = String((resourceContext && resourceContext.tenantId) || '').trim();
  if (!resourceTenantId || claimTenantId !== resourceTenantId) {
    return {
      allowed: false,
      code: 'E_SCOPE_TENANT_MISMATCH',
      reason: 'Claims tenant does not match the resource tenant.',
    };
  }

  return {
    allowed: true,
    code: null,
    reason: null,
  };
}

/**
 * Filter audit lineage records to only those visible to the given claims.
 * Strips all cross-tenant records; returns empty array for missing claims.
 */
function projectAuditLineage(claims, records) {
  const tenantId = String((claims && claims.tenantId) || '').trim();
  if (!tenantId) {
    return [];
  }

  return (Array.isArray(records) ? records : []).filter(
    (record) => String((record && record.tenant_id) || '').trim() === tenantId
  );
}

/**
 * Allowed roles for vault retrieval operations (Phase 86+).
 */
const ALLOWED_RETRIEVAL_ROLES = new Set(['operator', 'admin', 'agent']);
const ALLOWED_OPERATOR_VIEW_ROLES = new Set(['operator', 'admin']);
const ALLOWED_AGENT_VIEW_ROLES = new Set(['agent', 'admin']);

/**
 * Check whether a claims object has sufficient tenant + role authority
 * to retrieve vault artifacts (Phase 86+ retrieval scope).
 *
 * Returns { allowed: boolean, code: string|null, reason: string|null }.
 * Fails closed on any missing or mismatched claim.
 */
function checkRetrievalScope(claims, resourceContext) {
  const claimTenantId = String((claims && claims.tenantId) || '').trim();
  const claimRole = String((claims && claims.role) || '').trim();

  if (!claimTenantId || !claimRole) {
    return {
      allowed: false,
      code: 'E_SCOPE_CLAIMS_MISSING',
      reason: 'Valid tenant and role claims are required for retrieval access.',
    };
  }

  if (!ALLOWED_RETRIEVAL_ROLES.has(claimRole)) {
    return {
      allowed: false,
      code: 'E_SCOPE_ROLE_DENIED',
      reason: `Role '${claimRole}' is not permitted to retrieve vault artifacts.`,
    };
  }

  const resourceTenantId = String((resourceContext && resourceContext.tenantId) || '').trim();
  if (!resourceTenantId || claimTenantId !== resourceTenantId) {
    return {
      allowed: false,
      code: 'E_SCOPE_TENANT_MISMATCH',
      reason: 'Claims tenant does not match the resource tenant.',
    };
  }

  return {
    allowed: true,
    code: null,
    reason: null,
  };
}

function checkOperatorViewScope(claims, resourceContext) {
  const claimTenantId = String((claims && claims.tenantId) || '').trim();
  const claimRole = String((claims && claims.role) || '').trim();

  if (!claimTenantId || !claimRole) {
    return {
      allowed: false,
      code: 'E_SCOPE_CLAIMS_MISSING',
      reason: 'Valid tenant and role claims are required for operator view access.',
    };
  }

  if (!ALLOWED_OPERATOR_VIEW_ROLES.has(claimRole)) {
    return {
      allowed: false,
      code: 'E_SCOPE_ROLE_DENIED',
      reason: `Role '${claimRole}' is not permitted to access operator view actions.`,
    };
  }

  const resourceTenantId = String((resourceContext && resourceContext.tenantId) || '').trim();
  if (!resourceTenantId || claimTenantId !== resourceTenantId) {
    return {
      allowed: false,
      code: 'E_SCOPE_TENANT_MISMATCH',
      reason: 'Claims tenant does not match the operator-view resource tenant.',
    };
  }

  return {
    allowed: true,
    code: null,
    reason: null,
  };
}

function checkAgentViewScope(claims, resourceContext) {
  const claimTenantId = String((claims && claims.tenantId) || '').trim();
  const claimRole = String((claims && claims.role) || '').trim();
  const strictAgentRole = Boolean(resourceContext && resourceContext.strictAgentRole);

  if (!claimTenantId || !claimRole) {
    return {
      allowed: false,
      code: 'E_SCOPE_CLAIMS_MISSING',
      reason: 'Valid tenant and role claims are required for agent view access.',
    };
  }

  if (strictAgentRole && claimRole !== 'agent') {
    return {
      allowed: false,
      code: 'E_SCOPE_ROLE_DENIED',
      reason: `Role '${claimRole}' is not permitted for strict agent-only actions.`,
    };
  }

  if (!ALLOWED_AGENT_VIEW_ROLES.has(claimRole)) {
    return {
      allowed: false,
      code: 'E_SCOPE_ROLE_DENIED',
      reason: `Role '${claimRole}' is not permitted to access agent view actions.`,
    };
  }

  const resourceTenantId = String((resourceContext && resourceContext.tenantId) || '').trim();
  if (!resourceTenantId || claimTenantId !== resourceTenantId) {
    return {
      allowed: false,
      code: 'E_SCOPE_TENANT_MISMATCH',
      reason: 'Claims tenant does not match the agent-view resource tenant.',
    };
  }

  return {
    allowed: true,
    code: null,
    reason: null,
  };
}

module.exports = {
  checkVisibilityScope,
  projectAuditLineage,
  checkRetrievalScope,
  checkOperatorViewScope,
  checkAgentViewScope,
  ALLOWED_VISIBILITY_ROLES,
  ALLOWED_RETRIEVAL_ROLES,
  ALLOWED_OPERATOR_VIEW_ROLES,
  ALLOWED_AGENT_VIEW_ROLES,
};