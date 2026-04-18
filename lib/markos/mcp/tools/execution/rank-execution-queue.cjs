'use strict';

// Tool: rank_execution_queue. Simple-tier, non-LLM. Wires to CRM execution ranker.
// D-15 tenant scope: tenant_id pulled from session; rankExecutionQueue is tenant-filtered.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object', additionalProperties: false,
  properties: { limit: { type: 'integer', minimum: 1, maximum: 100 } },
};

const outputSchema = {
  type: 'object', required: ['content'], additionalProperties: true,
  properties: {
    content: {
      type: 'array',
      items: {
        type: 'object', required: ['type', 'text'],
        properties: { type: { enum: ['text'] }, text: { type: 'string' } },
      },
    },
  },
};

async function rank(supabase, tenant_id, limit, deps) {
  if (deps && deps.rank) return deps.rank(supabase, tenant_id, limit);
  try {
    // execution.ts may or may not exist at require time; lean-load and fall through on failure.
    const mod = require('../../../crm/execution.cjs');
    if (mod && typeof mod.rankExecutionQueue === 'function') {
      return await mod.rankExecutionQueue(supabase, tenant_id, { limit });
    }
  } catch { /* fall through */ }
  return { ranked: [] };
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const limit = args.limit || 25;
  const r = await rank(supabase, session.tenant_id, limit, ctx.deps);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        tenant_id: session.tenant_id, // D-15
        ranked: (r.ranked || []).slice(0, limit),
        generated_at: new Date().toISOString(),
      }, null, 2),
    }],
  };
}

const descriptor = {
  name: 'rank_execution_queue',
  description: 'Rank CRM execution-queue items for the session tenant, optionally limited.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.rank_execution_queue,
  inputSchema, outputSchema, handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
