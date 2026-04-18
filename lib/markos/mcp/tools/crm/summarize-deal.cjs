'use strict';

// Tool: summarize_deal. LLM tier (Haiku). Fetches deal timeline + tasks → summarizes.
// D-15 tenant scope: tenant_id embedded in output.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['deal_id'],
  additionalProperties: false,
  properties: {
    deal_id: { type: 'string', minLength: 1, maxLength: 200 },
  },
};

const outputSchema = {
  type: 'object',
  required: ['content', '_usage'],
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
    _usage: {
      type: 'object',
      required: ['input_tokens', 'output_tokens'],
      properties: {
        input_tokens: { type: 'integer', minimum: 0 },
        output_tokens: { type: 'integer', minimum: 0 },
      },
    },
  },
};

async function loadDealContext({ supabase, tenant_id, deal_id, deps }) {
  if (deps && typeof deps.loadDealContext === 'function') {
    try {
      return await deps.loadDealContext({ tenant_id, deal_id });
    } catch {
      return { timeline: [], open_tasks: [] };
    }
  }
  try {
    const timelineMod = require('../../../crm/timeline.cjs');
    const entitiesMod = require('../../../crm/entities.cjs');
    const store = (deps && deps.store) || supabase || {};
    const activities = Array.isArray(store.activities) ? store.activities : [];
    const identityLinks = Array.isArray(store.identityLinks) ? store.identityLinks : [];
    const timeline =
      typeof timelineMod.buildCrmTimeline === 'function'
        ? timelineMod.buildCrmTimeline({
            tenant_id,
            record_kind: 'deal',
            record_id: deal_id,
            activities,
            identity_links: identityLinks,
          })
        : [];
    const entities =
      typeof entitiesMod.listCrmEntities === 'function'
        ? entitiesMod.listCrmEntities(store, { tenant_id, record_kind: 'deal' })
        : [];
    const deal = Array.isArray(entities)
      ? entities.find((e) => e.entity_id === deal_id)
      : null;
    return { timeline: timeline || [], deal, open_tasks: [] };
  } catch {
    return { timeline: [], open_tasks: [] };
  }
}

async function invokeLLM(deal, timeline, deps) {
  const llm = deps.llm;
  if (!llm) {
    return {
      text: JSON.stringify({
        summary: `Deal ${deal?.entity_id || 'unknown'}: ${deal?.display_name || 'no-display'} — fallback summary.`,
        highlights: [],
        next_steps: [],
      }),
      input_tokens: 0,
      output_tokens: 0,
    };
  }
  const resp = await llm.messages.create({
    model: COST_TABLE.summarize_deal.model,
    max_tokens: 600,
    system:
      'You summarize a CRM deal for an operator. Return strict JSON { summary: string, highlights: [string], next_steps: [string] }.',
    messages: [
      {
        role: 'user',
        content: `Deal: ${JSON.stringify(deal || {})}\nTimeline (last 20):\n${JSON.stringify((timeline || []).slice(0, 20))}`,
      },
    ],
  });
  return {
    text: (resp.content && resp.content[0] && resp.content[0].text) || '{}',
    input_tokens: (resp.usage && resp.usage.input_tokens) || 0,
    output_tokens: (resp.usage && resp.usage.output_tokens) || 0,
  };
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const deps = ctx.deps || {};
  const dealCtx = await loadDealContext({
    supabase,
    tenant_id: session.tenant_id,
    deal_id: args.deal_id,
    deps,
  });
  const { text, input_tokens, output_tokens } = await invokeLLM(dealCtx.deal, dealCtx.timeline, deps);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { summary: 'parse_failed', highlights: [], next_steps: [] };
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            deal_id: args.deal_id,
            summary: parsed.summary || '',
            highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
            next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
          },
          null,
          2,
        ),
      },
    ],
    _usage: { input_tokens, output_tokens },
  };
}

const descriptor = {
  name: 'summarize_deal',
  description:
    'Summarize a CRM deal (status + activity highlights + next-step suggestions) via Haiku LLM. Tenant-scoped.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.summarize_deal,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
