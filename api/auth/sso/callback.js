'use strict';

const { mapExternalClaimsToRole, recordRoleMappingDecision } = require('../../../lib/markos/identity/role-mapping.ts');

function handleSsoCallback(input = {}) {
  const tenant_id = input.tenant_id || input.tenantId || null;
  const correlation_id = input.correlation_id || input.correlationId || `corr-${tenant_id || 'unknown'}`;
  const decision = mapExternalClaimsToRole({
    binding: input.binding,
    claims: input.claims,
    actor_id: input.actor_id || input.actorId,
    correlation_id,
    requested_role: input.requested_role || input.requestedRole,
  });

  return recordRoleMappingDecision({
    ...decision,
    tenant_id,
    correlation_id,
  });
}

module.exports = {
  handleSsoCallback,
};