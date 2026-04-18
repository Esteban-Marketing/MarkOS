'use strict';

// Tool: query_canon. Simple-tier, non-LLM. Free-text search over tenant brand canon.
// D-15 tenant scope: canon loaded via session.tenant_id; tenant_id echoed in output.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['query'],
  additionalProperties: false,
  properties: {
    query: { type: 'string', minLength: 1, maxLength: 1000 },
    limit: { type: 'integer', minimum: 1, maximum: 50 },
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

async function loadCanon(supabase, tenant_id, deps) {
  if (deps && deps.loadCanon) return deps.loadCanon(supabase, tenant_id);
  try {
    const { loadPackForTenant } = require('../../../packs/pack-loader.cjs');
    if (typeof loadPackForTenant === 'function') {
      const pack = await loadPackForTenant(supabase, tenant_id);
      return pack.canon || [];
    }
    return [];
  } catch {
    return [];
  }
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const deps = ctx.deps || {};
  const canon = await loadCanon(supabase, session.tenant_id, deps); // D-15
  const q = String(args.query || '').toLowerCase();
  const matches = (canon || [])
    .filter((c) => {
      const hay = `${c.title || ''} ${c.text || c.content || ''}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, args.limit || 10)
    .map((c) => ({
      id: c.id || c.slug || null,
      title: c.title || null,
      text: (c.text || c.content || '').slice(0, 500),
      source: c.source || null,
    }));
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            query: args.query,
            count: matches.length,
            matches,
          },
          null,
          2,
        ),
      },
    ],
  };
}

const descriptor = {
  name: 'query_canon',
  description:
    'Free-text search over tenant brand canon; returns top-K matches with title + text snippet.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.query_canon,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
