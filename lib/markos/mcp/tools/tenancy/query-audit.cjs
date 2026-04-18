'use strict';

// Tool: query_audit. Simple-tier, non-LLM, read-only. Reads markos_audit_log filtered by tenant.
// D-15 tenant scope: tenant_id from session; Phase 201 RLS (migration 82) enforces backstop.
// Uses the F-88 read surface (tenant-admin read-only).

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    since_iso: { type: 'string', format: 'date-time' },
    actions: {
      type: 'array',
      maxItems: 50,
      items: { type: 'string', minLength: 1, maxLength: 200 },
    },
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

async function queryAudit(supabase, { tenant_id, since_iso, actions, limit, deps }) {
  if (deps && typeof deps.queryAudit === 'function') {
    try {
      return await deps.queryAudit({ tenant_id, since_iso, actions, limit });
    } catch {
      return [];
    }
  }
  if (!supabase || typeof supabase.from !== 'function') return [];
  try {
    let q = supabase.from('markos_audit_log').select('*');
    if (typeof q.eq === 'function') q = q.eq('tenant_id', tenant_id);
    if (since_iso && typeof q.gte === 'function') q = q.gte('created_at', since_iso);
    if (Array.isArray(actions) && actions.length && typeof q.in === 'function') q = q.in('action', actions);
    if (typeof q.order === 'function') q = q.order('created_at', { ascending: false });
    if (typeof q.limit === 'function') q = q.limit(limit);
    const { data } = await Promise.resolve(q);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const deps = ctx.deps || {};
  const rows = await queryAudit(supabase, {
    tenant_id: session.tenant_id, // D-15
    since_iso: args.since_iso || null,
    actions: args.actions || [],
    limit: args.limit || 50,
    deps,
  });
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            since_iso: args.since_iso || null,
            actions: args.actions || [],
            count: rows.length,
            audit_rows: rows,
          },
          null,
          2,
        ),
      },
    ],
  };
}

const descriptor = {
  name: 'query_audit',
  description:
    'Query tenant audit log with optional since_iso / actions filters. Read-only. Uses F-88 read surface.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.query_audit,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
