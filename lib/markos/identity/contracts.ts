export const CANONICAL_IAM_ROLES = [
  'owner',
  'tenant-admin',
  'manager',
  'contributor',
  'reviewer',
  'billing-admin',
  'readonly',
] as const;

export type TenantSsoBinding = {
  binding_id: string;
  tenant_id: string;
  sso_provider_id: string;
  provider_type: 'saml' | 'oidc';
  idp_entity_id: string;
  attribute_mappings: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type ExternalRoleClaim = {
  claim_type: 'group' | 'role' | 'attribute';
  claim_value: string;
  source_attribute: string;
  issuer: string;
};

export type IdentityRoleMappingDecision = {
  decision_id: string;
  tenant_id: string;
  actor_id: string;
  correlation_id: string;
  sso_provider_id: string;
  matched_rule_id: string | null;
  canonical_role: (typeof CANONICAL_IAM_ROLES)[number] | null;
  decision: 'granted' | 'denied';
  denial_reason: string | null;
  source_claims: ExternalRoleClaim[];
  mapped_at: string;
};