'use strict';

// Tool: query_crm_timeline. Simple-tier, non-LLM, read-only. Returns tenant-scoped activity timeline.
// D-15 tenant scope.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['entity_id'],
  additionalProperties: false,
  properties: {
    entity_id: { type: 'string', minLength: 1, maxLength: 200 },
    entity_kind: { type: 'string', enum: ['contact', 'account', 'deal'] },
    limit: { type: 'integer', minimum: 1, maximum: 100 },
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

async function queryTimelineSafe({ supabase, tenant_id, entity_id, entity_kind, limit, deps }) {
  if (deps && typeof deps.buildTimeline === 'function') {
    try {
      return await deps.buildTimeline({ tenant_id, entity_id, entity_kind, limit });
    } catch {
      return { timeline: [], source: 'deps_error' };
    }
  }
  try {
    const mod = require('../../../crm/timeline.cjs');
    if (typeof mod.buildCrmTimeline === 'function') {
      const store = (deps && deps.store) || supabase || {};
      const activities = Array.isArray(store.activities) ? store.activities : [];
      const identityLinks = Array.isArray(store.identityLinks) ? store.identityLinks : [];
      const timeline = mod.buildCrmTimeline({
        tenant_id,
        record_kind: entity_kind || null,
        record_id: entity_id,
        activities,
        identity_links: identityLinks,
      });
      return { timeline: timeline.slice(0, limit) };
    }
    return { timeline: [], source: 'unavailable' };
  } catch {
    return { timeline: [], source: 'unavailable' };
  }
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const deps = ctx.deps || {};
  const result = await queryTimelineSafe({
    supabase,
    tenant_id: session.tenant_id,
    entity_id: args.entity_id,
    entity_kind: args.entity_kind,
    limit: args.limit || 50,
    deps,
  });
  const timeline = Array.isArray(result.timeline) ? result.timeline : [];
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            entity_id: args.entity_id,
            entity_kind: args.entity_kind || null,
            count: timeline.length,
            timeline,
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
  name: 'query_crm_timeline',
  description:
    'Return the tenant-scoped CRM activity timeline for a given entity (contact / account / deal).',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.query_crm_timeline,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
