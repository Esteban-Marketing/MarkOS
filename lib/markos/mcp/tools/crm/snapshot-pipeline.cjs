'use strict';

// Tool: snapshot_pipeline. Simple-tier, non-LLM, read-only. Returns pipeline stage counts + values.
// D-15 tenant scope.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    pipeline_slug: { type: 'string', maxLength: 200 },
  },
};

const outputSchema = {
  type: 'object',
  required: ['content'],
  additionalProperties: true,
  properties: {
    content: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'text'],
        properties: { type: { enum: ['text'] }, text: { type: 'string' } },
      },
    },
  },
};

async function snapshotPipelineSafe({ supabase, tenant_id, pipeline_slug, deps }) {
  if (deps && typeof deps.snapshotPipeline === 'function') {
    try {
      return await deps.snapshotPipeline({ tenant_id, pipeline_slug });
    } catch {
      return { stages: [], source: 'deps_error' };
    }
  }
  try {
    const mod = require('../../../crm/api.cjs');
    if (typeof mod.listPipelineConfigs === 'function') {
      const store = (deps && deps.store) || supabase || {};
      const configs = mod.listPipelineConfigs(store, { tenant_id });
      const filtered = pipeline_slug
        ? configs.filter((c) => c.pipeline_key === pipeline_slug)
        : configs;
      const stages = [];
      for (const cfg of filtered) {
        for (const st of cfg.stages || []) {
          stages.push({
            pipeline_key: cfg.pipeline_key,
            slug: st.stage_key,
            display_name: st.display_name,
            count: 0,
            value_cents: 0,
            forecast_weight: st.forecast_weight || null,
          });
        }
      }
      return { stages };
    }
    return { stages: [], source: 'unavailable' };
  } catch {
    return { stages: [], source: 'unavailable' };
  }
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const deps = ctx.deps || {};
  const result = await snapshotPipelineSafe({
    supabase,
    tenant_id: session.tenant_id,
    pipeline_slug: args.pipeline_slug,
    deps,
  });
  const stages = Array.isArray(result.stages) ? result.stages : [];
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            pipeline_slug: args.pipeline_slug || null,
            count: stages.length,
            stages,
            source: result.source || 'crm',
          },
          null,
          2,
        ),
      },
    ],
  };
}

const descriptor = {
  name: 'snapshot_pipeline',
  description:
    'Return a tenant-scoped pipeline snapshot: stages with counts + aggregate value. Read-only.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.snapshot_pipeline,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
