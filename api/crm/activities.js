'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  getCrmStore,
  buildCrmTimeline,
} = require('../../lib/markos/crm/api.cjs');

async function handleActivities(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }
  if (req.method !== 'GET') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }
  const store = getCrmStore(req);
  const query = req.query || (() => {
    try {
      const parsed = new URL(`http://localhost${req.url || '/'}`);
      return Object.fromEntries(parsed.searchParams.entries());
    } catch {
      return {};
    }
  })();
  const timeline = buildCrmTimeline({
    tenant_id: context.tenant_id,
    record_kind: query.record_kind,
    record_id: query.record_id,
    activities: store.activities,
    identity_links: store.identityLinks,
  });
  return writeJson(res, 200, { success: true, tenant_id: context.tenant_id, timeline });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleActivities(req, res);
};

module.exports.handleActivities = handleActivities;
