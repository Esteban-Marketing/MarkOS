'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  assertCrmMutationAllowed,
  getCrmStore,
  appendCrmActivity,
  listPipelineConfigs,
  upsertPipelineConfig,
} = require('../../lib/markos/crm/api.cjs');

function readQuery(req) {
  if (req.query && typeof req.query === 'object') {
    return req.query;
  }
  try {
    const parsed = new URL(`http://localhost${req.url || '/'}`);
    return Object.fromEntries(parsed.searchParams.entries());
  } catch {
    return {};
  }
}

async function handlePipelines(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }

  const store = getCrmStore(req);

  if (req.method === 'GET') {
    return writeJson(res, 200, {
      success: true,
      pipelines: listPipelineConfigs(store, {
        tenant_id: context.tenant_id,
        object_kind: readQuery(req).object_kind,
      }),
    });
  }

  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
    const decision = assertCrmMutationAllowed(context, 'pipeline_update');
    if (!decision.allowed) {
      return writeJson(res, decision.status, { success: false, error: decision.error, message: decision.message });
    }
    const body = req.body || {};
    const pipeline = upsertPipelineConfig(store, {
      ...body,
      tenant_id: context.tenant_id,
    }, context.actor_id);
    appendCrmActivity(store, {
      tenant_id: context.tenant_id,
      activity_family: 'crm_mutation',
      related_record_kind: 'pipeline',
      related_record_id: pipeline.pipeline_key,
      source_event_ref: `api:pipelines:upsert:${pipeline.pipeline_key}`,
      actor_id: context.actor_id,
      payload_json: {
        action: 'pipeline_config_updated',
        object_kind: pipeline.object_kind,
        stage_count: pipeline.stages.length,
      },
    });
    return writeJson(res, 200, { success: true, pipeline });
  }

  return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handlePipelines(req, res);
};

module.exports.handlePipelines = handlePipelines;