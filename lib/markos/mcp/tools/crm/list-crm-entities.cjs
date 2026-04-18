'use strict';

// Tool: list_crm_entities. Simple-tier, non-LLM, read-only. Lists CRM entities filtered by kind.
// D-15 tenant scope: tenant_id from session; tenant_id embedded in output.
// Falls back gracefully when lib/markos/crm/entities.cjs unavailable.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['kind'],
  additionalProperties: false,
  properties: {
    kind: { type: 'string', enum: ['contact', 'account', 'deal'] },
    filter: { type: 'object', additionalProperties: true },
    limit: { type: 'integer', minimum: 1, maximum: 200 },
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

async function listEntitiesSafe({ supabase, tenant_id, kind, filter, limit, deps }) {
  if (deps && typeof deps.listEntities === 'function') {
    try {
      return await deps.listEntities({ tenant_id, kind, filter, limit });
    } catch {
      return { entities: [], source: 'deps_error' };
    }
  }
  try {
    const mod = require('../../../crm/entities.cjs');
    if (typeof mod.listCrmEntities === 'function') {
      // record_kind maps to the CRM contract's record_kind arg; pass the store via req.crmStore fallback.
      const store = (deps && deps.store) || supabase || {};
      const result = mod.listCrmEntities(store, {
        tenant_id,
        record_kind: kind,
        search: filter?.search || null,
      });
      const rows = Array.isArray(result) ? result : [];
      return { entities: rows.slice(0, limit) };
    }
    return { entities: [], source: 'unavailable' };
  } catch {
    return { entities: [], source: 'unavailable' };
  }
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const deps = ctx.deps || {};
  const result = await listEntitiesSafe({
    supabase,
    tenant_id: session.tenant_id,
    kind: args.kind,
    filter: args.filter || {},
    limit: args.limit || 50,
    deps,
  });
  const entities = Array.isArray(result.entities) ? result.entities : [];
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            kind: args.kind,
            count: entities.length,
            entities,
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
  name: 'list_crm_entities',
  description:
    'List CRM entities (contacts / accounts / deals) for the tenant, filtered by kind + optional filter.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.list_crm_entities,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
