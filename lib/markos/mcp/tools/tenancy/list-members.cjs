'use strict';

// Tool: list_members. Simple-tier, non-LLM, read-only. Lists markos_tenant_memberships.
// D-15 tenant scope: tenant_id from session; RLS (migration 51) is backstop.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {},
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

async function listMembers(supabase, tenant_id, deps) {
  if (deps && typeof deps.listMembers === 'function') {
    try {
      return await deps.listMembers({ tenant_id });
    } catch {
      return [];
    }
  }
  if (!supabase || typeof supabase.from !== 'function') return [];
  try {
    const query = supabase.from('markos_tenant_memberships');
    const select = typeof query.select === 'function' ? query.select('user_id, iam_role, created_at') : query;
    const filtered = typeof select.eq === 'function' ? select.eq('tenant_id', tenant_id) : select;
    const { data } = await Promise.resolve(filtered);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function handler(ctx) {
  const { session, supabase } = ctx;
  const deps = ctx.deps || {};
  const rows = await listMembers(supabase, session.tenant_id, deps); // D-15 + RLS
  const members = rows.map((m) => ({
    user_id: m.user_id,
    iam_role: m.iam_role,
    joined_at: m.created_at || m.joined_at || null,
  }));
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            count: members.length,
            members,
          },
          null,
          2,
        ),
      },
    ],
  };
}

const descriptor = {
  name: 'list_members',
  description: 'List tenant members with their IAM roles and join dates. Read-only.',
  latency_tier: 'simple',
  mutating: false,
  cost_model: COST_TABLE.list_members,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
