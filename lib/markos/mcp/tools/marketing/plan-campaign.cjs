'use strict';

// Tool: plan_campaign (D-04 hero demo).
// Wires to pack-loader for audience/literacy context + LLM planner.
// latency_tier = llm per D-18; mutating = false (plan is a read/generate, not a write).

const { randomUUID } = require('node:crypto');
const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['objective', 'audience'],
  additionalProperties: false,
  properties: {
    objective: { type: 'string', minLength: 1, maxLength: 1000 },
    audience:  { type: 'string', minLength: 1, maxLength: 500 },
    budget:    { type: 'string', maxLength: 200 },
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
        properties: { type: { type: 'string', enum: ['text'] }, text: { type: 'string' } },
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

async function loadLLM() {
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const Ctor = Anthropic.default || Anthropic;
    return new Ctor({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch {
    return null;
  }
}

async function invokeLlmPlanner(session, args, deps) {
  const llm = deps.llm || (await loadLLM());
  if (!llm) {
    return { parsed: { channels: [] }, input_tokens: 0, output_tokens: 0 };
  }
  const sys = `You are a marketing campaign planner for tenant ${session.tenant_id}. Produce a structured campaign plan grounded in brand canon.`;
  const user = `Objective: ${args.objective}\nAudience: ${args.audience}\nBudget: ${args.budget || 'n/a'}\nReturn JSON with channels: [{channel, blocks:[...]}].`;

  const resp = await llm.messages.create({
    model: COST_TABLE.plan_campaign.model,
    max_tokens: 1500,
    system: sys,
    messages: [{ role: 'user', content: user }],
  });

  const text = (resp.content && resp.content[0] && resp.content[0].text) || '{}';
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { channels: [] }; }
  return {
    parsed,
    input_tokens: (resp.usage && resp.usage.input_tokens) || 0,
    output_tokens: (resp.usage && resp.usage.output_tokens) || 0,
  };
}

async function handler(ctx) {
  const { args, session } = ctx;
  const deps = ctx.deps || {};

  const { parsed, input_tokens, output_tokens } = await invokeLlmPlanner(session, args, deps);

  const plan = {
    plan_id: `plan-${randomUUID()}`,
    objective: args.objective,
    audience: args.audience,
    channels: Array.isArray(parsed.channels) ? parsed.channels : [],
    created_at: new Date().toISOString(),
    tenant_id: session.tenant_id, // D-15 tenant scope — handler embeds tenant id in output
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(plan, null, 2) }],
    _usage: { input_tokens, output_tokens },
  };
}

const descriptor = {
  name: 'plan_campaign',
  description: 'Produce a campaign plan outline grounded in brand canon from an objective + audience + optional budget.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.plan_campaign,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
