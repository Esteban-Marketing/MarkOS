import type { ExternalRoleClaim, IdentityRoleMappingDecision, TenantSsoBinding } from './contracts';
import { IAM_V32_ROLES } from '../rbac/iam-v32.js';

export const UNMAPPED_EXTERNAL_CLAIM = 'UNMAPPED_EXTERNAL_CLAIM';
export const EXTERNAL_ROLE_ESCALATION_DENIED = 'EXTERNAL_ROLE_ESCALATION_DENIED';

const CLAIM_TO_ROLE: Record<string, (typeof IAM_V32_ROLES)[number]> = {
  'markos-owner': 'owner',
  'markos-tenant-admin': 'tenant-admin',
  'markos-manager': 'manager',
  'markos-contributor': 'contributor',
  'markos-reviewer': 'reviewer',
  'markos-billing-admin': 'billing-admin',
  'markos-readonly': 'readonly',
};

export function mapExternalClaimsToRole(input: {
  binding: TenantSsoBinding;
  claims: ExternalRoleClaim[];
  actor_id?: string;
  correlation_id?: string;
  requested_role?: string;
}): IdentityRoleMappingDecision {
  const claims = Array.isArray(input.claims) ? input.claims : [];
  const requestedRole = input.requested_role || null;
  const matchedClaim = claims.find((claim) => CLAIM_TO_ROLE[claim.claim_value]);

  if (requestedRole && requestedRole === 'owner' && requestedRole !== CLAIM_TO_ROLE[matchedClaim?.claim_value || '']) {
    return {
      decision_id: `decision-${input.binding.tenant_id}`,
      tenant_id: input.binding.tenant_id,
      actor_id: input.actor_id || 'unknown',
      correlation_id: input.correlation_id || `corr-${input.binding.tenant_id}`,
      sso_provider_id: input.binding.sso_provider_id,
      matched_rule_id: null,
      canonical_role: null,
      decision: 'denied',
      denial_reason: EXTERNAL_ROLE_ESCALATION_DENIED,
      source_claims: claims,
      mapped_at: new Date().toISOString(),
    };
  }

  if (!matchedClaim) {
    return {
      decision_id: `decision-${input.binding.tenant_id}`,
      tenant_id: input.binding.tenant_id,
      actor_id: input.actor_id || 'unknown',
      correlation_id: input.correlation_id || `corr-${input.binding.tenant_id}`,
      sso_provider_id: input.binding.sso_provider_id,
      matched_rule_id: null,
      canonical_role: null,
      decision: 'denied',
      denial_reason: UNMAPPED_EXTERNAL_CLAIM,
      source_claims: claims,
      mapped_at: new Date().toISOString(),
    };
  }

  return {
    decision_id: `decision-${input.binding.tenant_id}`,
    tenant_id: input.binding.tenant_id,
    actor_id: input.actor_id || 'unknown',
    correlation_id: input.correlation_id || `corr-${input.binding.tenant_id}`,
    sso_provider_id: input.binding.sso_provider_id,
    matched_rule_id: `rule:${matchedClaim.claim_value}`,
    canonical_role: CLAIM_TO_ROLE[matchedClaim.claim_value],
    decision: 'granted',
    denial_reason: null,
    source_claims: claims,
    mapped_at: new Date().toISOString(),
  };
}

export function recordRoleMappingDecision(decision: IdentityRoleMappingDecision) {
  return {
    ...decision,
    recorded_at: new Date().toISOString(),
  };
}