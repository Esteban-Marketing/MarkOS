'use strict';

// Tool: read_segment. Simple-tier, non-LLM, read-only. Returns segment membership for a key.
// D-15 tenant scope.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['segment_key'],
  additionalProperties: false,
  properties: {
    segment_key: { type: 'string', minLength: 1, maxLength: 200 },
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

async function readSegmentSafe({ supabase, tenant_id, segment_key, deps }) {
  if (deps && typeof deps.readSegment === 'function') {
    try {
      return await deps.readSegment({ tenant_id, segment_key });
    } catch {
      return { segment: null, entity_ids: [], source: 'deps_error' };
    }
  }
  // No canonical lib/markos/crm/segments module yet — falls through to empty.
  // Plan 203+ will wire real segment storage; this handler's descriptor shape is fixed.
  return { segment: { key: segment_key, tenant_id }, entity_ids: [], source: 'unavailable' };
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const deps = ctx.deps || {};
  const result = await readSegmentSafe({
    supabase,
    tenant_id: session.tenant_id,
    segment_key: args.segment_key,
    deps,
  });
  const entity_ids = Array.isArray(result.entity_ids) ? result.entity_ids : [];
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            segment_key: args.segment_key,
            segment: result.segment || null,
            count: entity_ids.length,
            entity_ids,
            source: result.source || 'segments',
          },
          null,
          2,
        ),
      },
    ],
  };
}

const descriptor = {
  name: 'read_segment',
  description:
    'Return tenant-scoped segment membership (entity ids) for a given segment key.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.read_segment,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
