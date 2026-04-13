'use strict';

const VALID_MODES = new Set(['reason', 'apply', 'iterate']);

function normalize(value) {
  return String(value || '').trim();
}

function createError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function buildTenantBoundPageIndexScope({ claims, resourceContext, mode }) {
  const claimTenantId = normalize(claims && claims.tenantId);
  const resourceTenantId = normalize(resourceContext && resourceContext.tenantId);
  const normalizedMode = normalize(mode);

  if (!claimTenantId || !resourceTenantId) {
    throw createError('E_SCOPE_CLAIMS_MISSING', 'tenant scope requires both claim and resource tenant IDs.');
  }

  if (claimTenantId !== resourceTenantId) {
    throw createError('E_SCOPE_TENANT_MISMATCH', 'claims tenant does not match resource tenant.');
  }

  if (!VALID_MODES.has(normalizedMode)) {
    throw createError('E_PAGEINDEX_MODE_INVALID', 'mode must be reason, apply, or iterate.');
  }

  return {
    tenant_id: claimTenantId,
    mode: normalizedMode,
    scope: {
      tenant_id: claimTenantId,
      query_scope: 'tenant-bound',
    },
  };
}

module.exports = {
  buildTenantBoundPageIndexScope,
  VALID_MODES,
};
