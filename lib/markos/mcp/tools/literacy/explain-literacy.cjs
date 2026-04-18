'use strict';

// Tool: explain_literacy. Simple-tier, non-LLM. Resolves a literacy node_id OR archetype slug.
// D-15 tenant scope: tenant_id pulled from session; pack/canon loaded tenant-filtered.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    node_id:   { type: 'string', maxLength: 200 },
    archetype: { type: 'string', maxLength: 200 },
  },
  anyOf: [
    { required: ['node_id'] },
    { required: ['archetype'] },
  ],
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
    return { archetypes: [], canon: [] };
  } catch { return { archetypes: [], canon: [] }; }
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  let pack;
  try {
    pack = await loadPack(supabase, session.tenant_id, ctx.deps);
  } catch {
    pack = { archetypes: [], canon: [] };
  }
  const archetypeMatch = args.archetype
    ? (pack.archetypes || []).find((a) => (a.slug || a.name) === args.archetype)
    : null;
  const nodeMatch = args.node_id
    ? (pack.canon || []).find((c) => (c.id || c.slug) === args.node_id)
    : null;
  const body = archetypeMatch || nodeMatch || { description: 'not_found', examples: [] };
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        tenant_id: session.tenant_id, // D-15
        node_id: args.node_id || null,
        archetype: args.archetype || null,
        description: body.description || '',
        examples: body.examples || [],
        canonical_slug: body.slug || body.canonical_slug || null,
      }, null, 2),
    }],
  };
}

const descriptor = {
  name: 'explain_literacy',
  description: 'Explain a literacy node or archetype slug, returning description + examples + canonical slug.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.explain_literacy,
  inputSchema, outputSchema, handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
