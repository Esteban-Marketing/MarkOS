'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  getCrmStore,
} = require('../../../lib/markos/crm/api.cjs');
const { buildExecutionQueues } = require('../../../lib/markos/crm/execution.ts');

async function handleExecutionQueues(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  if (req.method !== 'GET') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const store = getCrmStore(req);
  const queueData = buildExecutionQueues({
    crmStore: store,
    tenant_id: context.tenant_id,
    actor_id: context.actor_id,
    queue_tab: req.query?.tab || 'all',
    now: req.query?.now,
  });
  const scope = req.query?.scope === 'team' ? 'team' : 'personal';

  return writeJson(res, 200, {
    success: true,
    scope,
    tabs: queueData.tabs,
    recommendations: queueData.recommendations,
    items: scope === 'team' ? queueData.team_queue : queueData.personal_queue,
  });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleExecutionQueues(req, res);
};

module.exports.handleExecutionQueues = handleExecutionQueues;