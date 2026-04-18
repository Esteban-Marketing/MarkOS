'use strict';

// Tool: research_audience. Simple-tier, non-LLM. Reads pack-loader for tenant pains + archetypes.
// D-15 tenant scope: tenant_id pulled from session; filter applied; tenant_id embedded in output.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['segment'],
  additionalProperties: false,
  properties: { segment: { type: 'string', minLength: 1, maxLength: 200 } },
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

async function loadPack(supabase, tenant_id, deps) {
  if (deps && deps.loadPack) return deps.loadPack(supabase, tenant_id);
  try {
    const { loadPackForTenant } = require('../../../packs/pack-loader.cjs');
    if (typeof loadPackForTenant === 'function') return await loadPackForTenant(supabase, tenant_id);
    return { pains: [], archetypes: [], canon: [] };
  } catch {
    return { pains: [], archetypes: [], canon: [] };
  }
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  let pack;
  try {
    pack = await loadPack(supabase, session.tenant_id, ctx.deps);
  } catch {
    pack = { pains: [], archetypes: [], canon: [] };
  }

  const pains = (pack.pains || [])
    .filter((p) => !args.segment || !p.segment || String(p.segment).toLowerCase() === String(args.segment).toLowerCase())
    .map((p) => (typeof p === 'string' ? p : (p.name || String(p))));
  const archetypes = (pack.archetypes || []).map((a) => (typeof a === 'string' ? a : (a.slug || a.name || String(a))));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        segment: args.segment,
        tenant_id: session.tenant_id, // D-15
        pains,
        archetypes,
        generated_at: new Date().toISOString(),
      }, null, 2),
    }],
  };
}

const descriptor = {
  name: 'research_audience',
  description: 'Return an audience research snapshot (pains + archetypes) for a segment key, tenant-scoped.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.research_audience,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
