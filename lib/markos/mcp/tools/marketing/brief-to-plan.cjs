'use strict';

// Tool: brief_to_plan. Sonnet LLM. Expands a brief into a 5-step execution plan.
// D-15 tenant scope.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['brief'],
  additionalProperties: false,
  properties: {
    brief: {
      type: 'object',
      required: ['channel', 'audience', 'pain', 'promise', 'brand'],
      additionalProperties: true,
      properties: {
        channel: { type: 'string' },
        audience: { type: 'string' },
        pain: { type: 'string' },
        promise: { type: 'string' },
        brand: { type: 'string' },
      },
    },
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

async function invokeLLM(brief, deps) {
  const llm = deps.llm;
  if (!llm) {
    return {
      text: JSON.stringify({
        steps: [
          { phase: 'research', summary: 'Research audience + pain signals', source: 'llm-fallback' },
          { phase: 'pain', summary: `Map pain: ${brief.pain}`, source: 'llm-fallback' },
          { phase: 'promise', summary: `Land promise: ${brief.promise}`, source: 'llm-fallback' },
          { phase: 'drafts', summary: `Draft for ${brief.channel}`, source: 'llm-fallback' },
          { phase: 'schedule', summary: `Schedule channel ${brief.channel}`, source: 'llm-fallback' },
        ],
      }),
      input_tokens: 0,
      output_tokens: 0,
    };
  }
  const resp = await llm.messages.create({
    model: COST_TABLE.brief_to_plan.model,
    max_tokens: 1500,
    system:
      'You expand a marketing brief into a 5-step execution plan with phases (research → pain → promise → drafts → schedule). Return strict JSON { steps: [{ phase: string, summary: string, source: string }] }.',
    messages: [{ role: 'user', content: `Brief: ${JSON.stringify(brief)}` }],
  });
  return {
    text: (resp.content && resp.content[0] && resp.content[0].text) || '{"steps":[]}',
    input_tokens: (resp.usage && resp.usage.input_tokens) || 0,
    output_tokens: (resp.usage && resp.usage.output_tokens) || 0,
  };
}

async function handler(ctx) {
  const { args, session } = ctx;
  const deps = ctx.deps || {};
  const { text, input_tokens, output_tokens } = await invokeLLM(args.brief || {}, deps);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { steps: [] };
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            brief: args.brief,
            steps: Array.isArray(parsed.steps) ? parsed.steps : [],
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
  name: 'brief_to_plan',
  description:
    'Expand a marketing brief into a 5-step execution plan (research → pain → promise → drafts → schedule).',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.brief_to_plan,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
