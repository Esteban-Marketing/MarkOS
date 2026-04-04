import type { TenantSsoBinding } from './contracts';

export function normalizeTenantSsoBinding(binding: Partial<TenantSsoBinding>): TenantSsoBinding {
  return {
    binding_id: String(binding.binding_id || 'binding-missing'),
    tenant_id: String(binding.tenant_id || 'tenant-missing'),
    sso_provider_id: String(binding.sso_provider_id || 'provider-missing'),
    provider_type: binding.provider_type === 'oidc' ? 'oidc' : 'saml',
    idp_entity_id: String(binding.idp_entity_id || ''),
    attribute_mappings: binding.attribute_mappings || {},
    created_at: String(binding.created_at || new Date().toISOString()),
    updated_at: String(binding.updated_at || new Date().toISOString()),
  };
}

export function resolveTenantSsoBinding(input: {
  tenant_id?: string;
  tenantId?: string;
  sso_provider_id?: string;
  ssoProviderId?: string;
  provider_type?: 'saml' | 'oidc';
  idp_entity_id?: string;
  attribute_mappings?: Record<string, string>;
}): TenantSsoBinding | null {
  const tenant_id = input.tenant_id || input.tenantId;
  const sso_provider_id = input.sso_provider_id || input.ssoProviderId;

  if (!tenant_id || !sso_provider_id) {
    return null;
  }

  return normalizeTenantSsoBinding({
    binding_id: `${tenant_id}:${sso_provider_id}`,
    tenant_id,
    sso_provider_id,
    provider_type: input.provider_type || 'saml',
    idp_entity_id: input.idp_entity_id || '',
    attribute_mappings: input.attribute_mappings || {},
  });
}