'use strict';

const { resolveTenantSsoBinding } = require('../../../lib/markos/identity/sso-bindings.ts');

const TENANT_SSO_BINDING_NOT_FOUND = 'TENANT_SSO_BINDING_NOT_FOUND';

function startSso(req = {}, res = {}) {
  const tenant_id = req.tenant_id || req.tenantId || req.query?.tenant_id || null;
  const binding = resolveTenantSsoBinding({
    tenant_id,
    sso_provider_id: req.sso_provider_id || req.ssoProviderId || null,
  });

  if (!binding) {
    const payload = {
      ok: false,
      error: TENANT_SSO_BINDING_NOT_FOUND,
      tenant_id,
    };

    if (typeof res.status === 'function') {
      return res.status(404).json(payload);
    }

    return payload;
  }

  return {
    ok: true,
    tenant_id: binding.tenant_id,
    sso_provider_id: binding.sso_provider_id,
  };
}

module.exports = {
  TENANT_SSO_BINDING_NOT_FOUND,
  startSso,
};