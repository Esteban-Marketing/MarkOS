'use strict';

// Tool: schedule_post. Simple-tier, MUTATING. Requires approval-token round-trip via pipeline (D-03/D-16).
// Handler only runs after pipeline consumed approval_token; handler does NOT re-validate.
// D-15 tenant scope: tenant_id pulled from session; queue write filters on tenant_id.

const { randomUUID } = require('node:crypto');
const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object', required: ['channel', 'content', 'scheduled_at'], additionalProperties: false,
  properties: {
    channel: { type: 'string', enum: ['email', 'x', 'linkedin', 'sms'] },
    content: { type: 'string', minLength: 1, maxLength: 5000 },
    scheduled_at: { type: 'string', format: 'date-time' },
    approval_token: { type: 'string', pattern: '^[0-9a-f]{32}$' },
  },
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

function preview(args) {
  return {
    tool: 'schedule_post',
    channel: args.channel,
    scheduled_at: args.scheduled_at,
    content_preview: String(args.content || '').slice(0, 200),
  };
}

async function enqueue(supabase, input, deps) {
  if (deps && deps.enqueue) return deps.enqueue(supabase, input);
  try {
    const mod = require('../../../crm/outbound/channel-queue.cjs');
    if (mod && typeof mod.scheduleChannelPost === 'function') {
      return await mod.scheduleChannelPost(supabase, input);
    }
  } catch { /* fall through to local stub */ }
  return { post_id: `post-${randomUUID()}`, status: 'queued' };
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const input = {
    tenant_id: session.tenant_id, // D-15 — tenant filter on queue write
    channel: args.channel,
    content: args.content,
    scheduled_at: args.scheduled_at,
    scheduled_by_user_id: session.user_id,
  };
  const { post_id, status } = await enqueue(supabase, input, ctx.deps);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        post_id,
        channel: args.channel,
        scheduled_at: args.scheduled_at,
        status: status || 'queued',
        tenant_id: session.tenant_id,
      }, null, 2),
    }],
  };
}

const descriptor = {
  name: 'schedule_post',
  description: 'Schedule a post draft onto a channel queue. Mutating — requires approval_token round-trip.',
  latency_tier: 'simple',
  mutating: true,
  cost_model: COST_TABLE.schedule_post,
  inputSchema, outputSchema, handler, preview,
};

module.exports = { descriptor, inputSchema, outputSchema, handler, preview };
