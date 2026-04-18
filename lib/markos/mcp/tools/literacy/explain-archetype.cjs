'use strict';

// Tool: explain_archetype. Simple-tier, non-LLM. Returns archetype description + examples.
// D-15 tenant scope: archetype loaded via session.tenant_id; tenant_id echoed in output.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['archetype_slug'],
  additionalProperties: false,
  properties: {
    archetype_slug: { type: 'string', minLength: 1, maxLength: 200 },
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

async function loadPack(supabase, tenant_id, deps) {
  if (deps && deps.loadPack) return deps.loadPack(supabase, tenant_id);
  try {
    const { loadPackForTenant } = require('../../../packs/pack-loader.cjs');
    if (typeof loadPackForTenant === 'function') {
      return await loadPackForTenant(supabase, tenant_id);
    }
    return { archetypes: [] };
  } catch {
    return { archetypes: [] };
  }
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const deps = ctx.deps || {};
  const pack = await loadPack(supabase, session.tenant_id, deps); // D-15
  const archetype = (pack.archetypes || []).find(
    (a) => (a.slug || a.name) === args.archetype_slug,
  );
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            archetype_slug: args.archetype_slug,
            found: Boolean(archetype),
            description: archetype?.description || '',
            examples: archetype?.examples || [],
            voice_markers: archetype?.voice_markers || [],
          },
          null,
          2,
        ),
      },
    ],
  };
}

const descriptor = {
  name: 'explain_archetype',
  description:
    'Return tenant-scoped archetype description + examples + voice markers for a given archetype slug.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.explain_archetype,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
