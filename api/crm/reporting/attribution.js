'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  getCrmStore,
  listCrmEntities,
} = require('../../../lib/markos/crm/api.cjs');
const { buildWeightedAttributionModel } = require('../../../lib/markos/crm/attribution.ts');

const CENTRAL_SCOPE_ROLES = new Set(['owner', 'billing-admin']);

async function handleReportingAttribution(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }
  if (req.method !== 'GET') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const scope = req.query?.scope === 'central' ? 'central' : 'tenant';
  if (scope === 'central' && !CENTRAL_SCOPE_ROLES.has(context.iamRole)) {
    return writeJson(res, 403, { success: false, error: 'CRM_REPORTING_SCOPE_FORBIDDEN', message: 'Central reporting scope requires explicit operator authorization.' });
  }

  const store = getCrmStore(req);
  const tenantIds = scope === 'central'
    ? Array.from(new Set((store.entities || []).map((entry) => entry.tenant_id).filter(Boolean)))
    : [context.tenant_id];

  const rows = tenantIds.flatMap((tenantId) => listCrmEntities(store, { tenant_id: tenantId })
    .filter((entry) => ['deal', 'contact', 'customer', 'account'].includes(entry.record_kind))
    .map((record) => buildWeightedAttributionModel({
      tenant_id: tenantId,
      record_kind: record.record_kind,
      record_id: record.entity_id,
      revenue_amount: record.attributes?.amount || record.attributes?.revenue_amount || 0,
      timeline: store.activities || [],
      identity_links: store.identityLinks || [],
    }))
    .filter((entry) => entry.weights.length > 0));

  return writeJson(res, 200, { success: true, scope, rows });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleReportingAttribution(req, res);
};

module.exports.handleReportingAttribution = handleReportingAttribution;