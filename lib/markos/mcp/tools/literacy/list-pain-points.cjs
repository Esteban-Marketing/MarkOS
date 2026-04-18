'use strict';

// Tool: list_pain_points. Simple-tier, non-LLM. Reads pack pain-point taxonomy.
// D-15 tenant scope: tenant_id pulled from session; optional category filter applied.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object', additionalProperties: false,
  properties: { category: { type: 'string', maxLength: 200 } },
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

async function loadPack(supabase, tenant_id, deps) {
  if (deps && deps.loadPack) return deps.loadPack(supabase, tenant_id);
  try {
    const { loadPackForTenant } = require('../../../packs/pack-loader.cjs');
    if (typeof loadPackForTenant === 'function') return await loadPackForTenant(supabase, tenant_id);
    return { pains: [] };
  } catch { return { pains: [] }; }
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  let pack;
  try {
    pack = await loadPack(supabase, session.tenant_id, ctx.deps);
  } catch {
    pack = { pains: [] };
  }
  let items = (pack.pains || []).map((p, i) => ({
    id: p.id || `pain-${i}`,
    name: p.name || String(p),
    description: p.description || '',
    score: typeof p.score === 'number' ? p.score : 0,
    category: p.category || null,
  }));
  if (args.category) {
    items = items.filter((p) => (p.category || '').toLowerCase() === String(args.category).toLowerCase());
  }
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        tenant_id: session.tenant_id, // D-15
        category: args.category || null,
        items,
      }, null, 2),
    }],
  };
}

const descriptor = {
  name: 'list_pain_points',
  description: 'List canonical pain-point taxonomy entries, tenant-scoped, optionally filtered by category.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.list_pain_points,
  inputSchema, outputSchema, handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
