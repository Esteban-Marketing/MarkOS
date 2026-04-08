'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  getCrmStore,
  listCrmEntities,
  listPipelineConfigs,
  listWorkspaceObjectDefinitions,
} = require('../../lib/markos/crm/api.cjs');

const workspace = require('../../lib/markos/crm/workspace.ts');

async function handleFunnel(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  if (req.method !== 'GET') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const store = getCrmStore(req);
  const query = req.query || {};
  const recordKind = String(query.object_kind || 'deal').trim();
  const pipelineKey = query.pipeline_key ? String(query.pipeline_key).trim() : null;
  const objectDefinition = listWorkspaceObjectDefinitions(store, { tenant_id: context.tenant_id })
    .find((entry) => entry.record_kind === recordKind) || null;
  const pipelines = listPipelineConfigs(store, { tenant_id: context.tenant_id, object_kind: recordKind });
  const pipeline = (pipelineKey ? pipelines.find((entry) => entry.pipeline_key === pipelineKey) : pipelines[0]) || { stages: [] };
  const state = workspace.createWorkspaceState({
    tenant_id: context.tenant_id,
    object_kind: recordKind,
    view_type: 'funnel',
    pipeline_key: pipeline.pipeline_key || pipelineKey,
    filters: {
      search: query.search || '',
      stage_key: query.stage_key || '',
    },
    records: listCrmEntities(store, {
      tenant_id: context.tenant_id,
      record_kind: recordKind,
      search: query.search,
    }),
  });

  return writeJson(res, 200, {
    success: true,
    rows: objectDefinition?.funnel_enabled === false
      ? []
      : workspace.buildFunnelRows({ state, pipeline }),
    pipeline,
  });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleFunnel(req, res);
};

module.exports.handleFunnel = handleFunnel;