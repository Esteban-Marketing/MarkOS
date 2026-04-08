'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  getCrmStore,
} = require('../../../lib/markos/crm/api.cjs');
const { buildCentralReportingRollup } = require('../../../lib/markos/crm/reporting.ts');

const CENTRAL_SCOPE_ROLES = new Set(['owner', 'billing-admin']);

async function handleReportingRollups(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }
  if (req.method !== 'GET') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }
  if (!CENTRAL_SCOPE_ROLES.has(context.iamRole)) {
    return writeJson(res, 403, {
      success: false,
      error: 'CRM_REPORTING_SCOPE_FORBIDDEN',
      message: 'Central reporting scope requires explicit operator authorization.',
    });
  }

  const store = getCrmStore(req);
  const rollup = buildCentralReportingRollup({ crmStore: store, tenant_id: context.tenant_id, now: req.query?.now });
  return writeJson(res, 200, { success: true, scope: 'central', rollup });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleReportingRollups(req, res);
};

module.exports.handleReportingRollups = handleReportingRollups;