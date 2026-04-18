'use strict';

// Tool: walk_taxonomy. Simple-tier, non-LLM. Traverses literacy taxonomy neighbors.
// D-15 tenant scope: taxonomy loaded via session.tenant_id; tenant_id echoed in output.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['node_id', 'direction'],
  additionalProperties: false,
  properties: {
    node_id: { type: 'string', minLength: 1, maxLength: 200 },
    direction: { type: 'string', enum: ['children', 'parents', 'siblings'] },
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

async function loadTaxonomy(supabase, tenant_id, deps) {
  if (deps && deps.loadTaxonomy) return deps.loadTaxonomy(supabase, tenant_id);
  try {
    const { loadPackForTenant } = require('../../../packs/pack-loader.cjs');
    if (typeof loadPackForTenant === 'function') {
      const pack = await loadPackForTenant(supabase, tenant_id);
      return pack.taxonomy || pack.canon || [];
    }
    return [];
  } catch {
    return [];
  }
}

function findNeighbors(nodes, node, direction) {
  if (!node) return [];
  const id = node.id || node.slug;
  if (direction === 'children') {
    return nodes.filter((n) => n.parent_id === id || n.parent === id);
  }
  if (direction === 'parents') {
    const parentId = node.parent_id || node.parent;
    if (!parentId) return [];
    const parent = nodes.find((n) => (n.id || n.slug) === parentId);
    return parent ? [parent] : [];
  }
  // siblings
  const parentId = node.parent_id || node.parent;
  if (!parentId) return [];
  return nodes.filter(
    (n) => (n.parent_id === parentId || n.parent === parentId) && (n.id || n.slug) !== id,
  );
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const deps = ctx.deps || {};
  const nodes = await loadTaxonomy(supabase, session.tenant_id, deps); // D-15
  const list = Array.isArray(nodes) ? nodes : [];
  const node = list.find((n) => (n.id || n.slug) === args.node_id) || null;
  const neighbors = findNeighbors(list, node, args.direction);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            node_id: args.node_id,
            direction: args.direction,
            found: Boolean(node),
            node: node || null,
            neighbors,
            count: neighbors.length,
          },
          null,
          2,
        ),
      },
    ],
  };
}

const descriptor = {
  name: 'walk_taxonomy',
  description:
    'Traverse tenant literacy taxonomy neighbors (children / parents / siblings) from a given node id.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.walk_taxonomy,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
