'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  getCrmStore,
} = require('../../../lib/markos/crm/api.cjs');
const {
  buildReadinessReport,
  buildReportingCockpitData,
  buildExecutiveSummary,
} = require('../../../lib/markos/crm/reporting.ts');

async function handleReportingDashboard(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }
  if (req.method !== 'GET') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const store = getCrmStore(req);
  const readiness = buildReadinessReport({ crmStore: store, tenant_id: context.tenant_id, now: req.query?.now });
  const cockpit = buildReportingCockpitData({ crmStore: store, tenant_id: context.tenant_id, now: req.query?.now });
  const executive_summary = buildExecutiveSummary({ readiness, cockpit, tenant_id: context.tenant_id });

  return writeJson(res, 200, {
    success: true,
    tenant_id: context.tenant_id,
    role_layer: context.iamRole,
    metric_families: ['pipeline_health', 'conversion', 'attribution', 'sla_risk', 'productivity', 'readiness'],
    readiness,
    cockpit,
    executive_summary,
  });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleReportingDashboard(req, res);
};

module.exports.handleReportingDashboard = handleReportingDashboard;